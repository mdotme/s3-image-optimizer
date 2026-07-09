import type { Channel } from "amqplib";
import z from "zod";
import { env } from "@/config/env";
import { minioClient } from "@/config/minio";
import {
  ImageOptimizer,
  type ImageOptimizerOptimizeOptions,
} from "@/services/optimizer";
import { rabbitMQService } from "@/services/rabbitmq";
import type { MinioEvent } from "@/types/minio.types";
import type { OptimizedEventPayload } from "@/types/optimized-event.types";
import { parseMetadata } from "@/utils/parse-metadata.util";

const parseNum = (val: unknown) =>
  val === "" || val === undefined ? undefined : Number(val);

const metadataSchema = z.object({
  "optimize-image": z.literal("true"),
  quality: z.preprocess(parseNum, z.number().min(1).max(100)),
  "output-object-key": z.string(),
  width: z.preprocess(parseNum, z.number().min(1).optional()),
  height: z.preprocess(parseNum, z.number().min(1).optional()),
  filter: z
    .enum([
      "nearest",
      "box",
      "bilinear",
      "linear",
      "cubic",
      "mitchell",
      "lanczos2",
      "lanczos3",
      "mks2013",
      "mks2021",
    ])
    .optional(),
});

export async function startImageOptimizerWorker(channel: Channel) {
  console.log("🤖 Worker image optimizer is active");

  await channel.consume(
    env.MINIO_EVENT_QUEUE,
    async (msg) => {
      if (!msg) {
        console.warn("⚠️ Consumer cancelled by RabbitMQ broker broker.");
        return;
      }

      const eventId = Bun.randomUUIDv7();
      const eventTime = new Date().toISOString();
      const startTime = performance.now();

      try {
        console.log("\n--- 📥 NEW MINIO EVENT ---");
        const rawStr = msg.content.toString();
        const payload = JSON.parse(rawStr) as MinioEvent;
        const record = payload?.Records[0];

        if (!record) {
          console.log("Records couldn't found in payload. Finishing queue");
          channel.ack(msg);
          return;
        }

        const rawMetadata = parseMetadata(record.s3.object?.userMetadata ?? {});

        let metadata: z.output<typeof metadataSchema>;
        try {
          const result = metadataSchema.safeParse(rawMetadata);

          if (!result.success || result.error || !result?.data) {
            console.log("Metadata validation did not pass.");
            channel.ack(msg);
            return;
          }

          console.debug("Metadata:");
          console.debug(result.data);
          metadata = result.data;
        } catch (err) {
          console.error(`Zod validation error: ${err}`);
          channel.ack(msg);
          return;
        }

        const optimizer = new ImageOptimizer();
        const optimizeOpts: ImageOptimizerOptimizeOptions = {
          quality: metadata.quality,
          width: metadata?.width,
          height: metadata?.height,
          filter: metadata?.filter,
        };

        let outputSize: number;
        try {
          const dataStream = await minioClient.getObject(
            record.s3.bucket.name,
            decodeURIComponent(record.s3.object.key.replace(/\+/g, " ")),
          );

          outputSize = await optimizer.optimizeStream(dataStream, optimizeOpts);
        } catch (err) {
          await optimizer.cleanup();
          console.error(`Error downloading file from Minio: ${err}`);
          channel.ack(msg);
          return;
        }

        let uploadedObjInfo: Awaited<ReturnType<typeof minioClient.fPutObject>>;
        try {
          uploadedObjInfo = await minioClient.fPutObject(
            record.s3.bucket.name,
            metadata["output-object-key"],
            optimizer.outputPath,
          );
        } catch (err) {
          console.error(`Unexpected error uploading optimized image: ${err}`);
          channel.ack(msg);
          return;
        }

        await optimizer.cleanup();

        try {
          if (env.OPTIMIZED_EVENT_QUEUE) {
            const durationMs = Math.round(performance.now() - startTime);
            const outPayload: OptimizedEventPayload = {
              eventId,
              eventTime,
              durationMs,
              bucket: record.s3.bucket.name,
              optimizedOptions: optimizeOpts,
              inputObject: {
                key: record.s3.object.key,
                size: record.s3.object.size,
                etag: record.s3.object.eTag,
              },
              outputObject: {
                key: metadata["output-object-key"],
                size: outputSize,
                etag: uploadedObjInfo.etag,
              },
            };

            await rabbitMQService.publishOptimizedEvent(outPayload);
          }
        } catch (err) {
          console.warn(`Failed to publish optimized event: ${err}`);
        }

        channel.ack(msg);
      } catch (error) {
        console.error("Failed to proccess event payload: ", error);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}
