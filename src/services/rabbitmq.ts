import amqp from "amqplib";
import { env } from "@/config/env";

class RabbitMQService {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;

    try {
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(env.MINIO_EVENT_EXCHANGE, "topic", {
        durable: true,
      });
      await this.channel.assertQueue(env.MINIO_EVENT_QUEUE, { durable: true });
      await this.channel.bindQueue(
        env.MINIO_EVENT_QUEUE,
        env.MINIO_EVENT_EXCHANGE,
        "s3.ObjectCreated.#",
      );

      await this.channel.prefetch(1);

      console.log("✅ Connected to RabbitMQ connection pool");
      return this.channel;
    } catch (error) {
      console.error("❌ Failed to establish RabbitMQ connection:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log("Closing RabbitMQ channels and connection pools...");
    try {
      if (this.channel) {
        const ch = this.channel;
        this.channel = null;
        try {
          await ch.close();
        } catch {}
      }

      if (this.connection) {
        const conn = this.connection;
        this.connection = null;
        await conn.close();
      }

      console.log("RabbitMQ connection closed cleanly.");
    } catch (error) {
      console.error("⚠️ Error during RabbitMQ disconnection lifecycle:", error);
    }
  }
}

export const rabbitMQService = new RabbitMQService();
