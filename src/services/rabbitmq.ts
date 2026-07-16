import amqp from "amqplib";
import { env } from "@/config/env";
import type { OptimizedEventPayload } from "@/types/optimized-event.types";

class RabbitMQService {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;

    try {
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.prefetch(1);

      console.log("✅ Connected to RabbitMQ connection pool");
      return this.channel;
    } catch (error) {
      console.error("❌ Failed to establish RabbitMQ connection:", error);
      throw error;
    }
  }

  async publishOptimizedEvent(
    payload: OptimizedEventPayload,
  ): Promise<boolean> {
    if (!this.channel) {
      console.warn("⚠️ RabbitMQ channel is not open. Cannot publish event.");
      return false;
    }

    if (!env.OPTIMIZER_EVENT_EXCHANGE || !env.OPTIMIZER_EVENT_ROUTING_KEY) {
      console.warn(
        "⚠️ Outbound exchange or routing key is not configured. Skipping event emission.",
      );
      return false;
    }

    try {
      const content = Buffer.from(JSON.stringify(payload));

      this.channel.publish(
        env.OPTIMIZER_EVENT_EXCHANGE,
        env.OPTIMIZER_EVENT_ROUTING_KEY,
        content,
        {
          persistent: true,
        },
      );

      console.log(
        `📡 Dispatched optimization success event to exchange: ${env.OPTIMIZER_EVENT_EXCHANGE}`,
      );
      return true;
    } catch (error) {
      console.error(`❌ Failed to publish image optimization event: ${error}`);
      return false;
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
