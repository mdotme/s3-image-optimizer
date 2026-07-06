import type { Channel } from "amqplib";
import { env } from "@/config/env";

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
        const rawStr = msg.content.toString();
        const payload = JSON.parse(rawStr);

        console.log("\n--- 📥 NEW MINIO EVENT ---");
        console.debug(JSON.stringify(payload, null, 2));
        channel.ack(msg);
      } catch (error) {
        console.error("Failed to proccess event payload: ", error);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}
