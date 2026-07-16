import { getEnv, getRequiredEnv } from "@/utils/get-env.util";

export const env = {
  // Inbound
  MINIO_EVENT_EXCHANGE: getRequiredEnv("MINIO_EVENT_EXCHANGE"),
  MINIO_EVENT_ROUTING_KEY: getRequiredEnv("MINIO_EVENT_ROUTING_KEY"),
  OPTIMIZER_UPLOAD_QUEUE: getEnv(
    "OPTIMIZER_UPLOAD_QUEUE",
    "optimizer.image-uploads",
  ),

  // Outbound
  OPTIMIZER_EVENT_EXCHANGE: getEnv("OPTIMIZER_EVENT_EXCHANGE"),
  OPTIMIZER_EVENT_ROUTING_KEY: getEnv("OPTIMIZER_EVENT_ROUTING_KEY"),

  // RabbitMQ
  RABBITMQ_URL: getRequiredEnv("RABBITMQ_URL"),

  // Minio
  MINIO_HOST: getEnv("MINIO_HOST", "localhost"),
  MINIO_PORT: +getEnv("MINIO_PORT", "9000"),
  // biome-ignore lint/suspicious/noDoubleEquals: 'Expected string bool'
  MINIO_USE_SSL: getEnv("MINIO_USE_SSL", "false") == "true",
  MINIO_ACCESS_KEY: getRequiredEnv("MINIO_ACCESS_KEY"),
  MINIO_SECRET_KEY: getRequiredEnv("MINIO_SECRET_KEY"),
} as const;
