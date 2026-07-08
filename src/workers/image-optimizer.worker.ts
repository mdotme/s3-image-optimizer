import type { Channel } from "amqplib";
import z from "zod";
import { env } from "@/config/env";
import type { MinioEvent } from "@/types/minio.types";
import { parseMetadata } from "@/utils/parse-metadata.util";

const parseNum = (val: unknown) =>
  val === "" || val === undefined ? undefined : Number(val);

const allowedImageTypes: string[] = [
  // "image/webp",
  "image/jpeg",
  "image/png",
  "image/avif",
] as const;

const metadataSchema = z.object({
  optimized: z.literal("false"),
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
    (msg) => {
      if (!msg) {
        console.warn("⚠️ Consumer cancelled by RabbitMQ broker broker.");
        return;
      }

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

        if (!allowedImageTypes.includes(record.s3.object.contentType)) {
          console.log(
            `${record.s3.object.contentType} is not supported. Finishing queue`,
          );
          channel.ack(msg);
          return;
        }

        const rawMetadata = parseMetadata(record.s3.object?.userMetadata ?? {});

        try {
          const result = metadataSchema.safeParse(rawMetadata);
          console.debug(result.data);

          if (!result.success || result.error) {
            console.log("Metadata validation did not pass.");
            channel.ack(msg);
            return;
          }
        } catch {}

        channel.ack(msg);
      } catch (error) {
        console.error("Failed to proccess event payload: ", error);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}
