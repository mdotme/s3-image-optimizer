import { getEnv, getRequiredEnv } from "@/utils/get-env.util";

export const env = {
  RABBITMQ_URL: getRequiredEnv("RABBITMQ_URL"),

  MINIO_EVENT_EXCHANGE: getEnv("MINIO_EVENT_EXCHANGE", "minio.events"),
  MINIO_EVENT_QUEUE: getEnv("MINIO_EVENT_QUEUE", "image-uploads"),
  OPTIMIZED_EVENT_QUEUE: getEnv("OPTIMIZED_EVENT_QUEUE"),

  MINIO_HOST: getEnv("MINIO_HOST", "localhost"),
  MINIO_PORT: +getEnv("MINIO_PORT", "9000"),
  // biome-ignore lint/suspicious/noDoubleEquals: 'Expected string bool'
  MINIO_USE_SSL: getEnv("MINIO_USE_SSL", "false") == "true",
  MINIO_ACCESS_KEY: getRequiredEnv("MINIO_ACCESS_KEY"),
  MINIO_SECRET_KEY: getRequiredEnv("MINIO_SECRET_KEY"),
} as const;
