import { getEnv, getRequiredEnv } from "@/utils/get-env.util";

export const env = {
  RABBITMQ_URL: getRequiredEnv("RABBITMQ_URL"),

  MINIO_EVENT_EXCHANGE: getEnv("MINIO_EVENT_EXCHANGE", "minio.events"),
  MINIO_EVENT_QUEUE: getEnv("MINIO_EVENT_QUEUE", "image-uploads"),

  MINIO_API_PORT: +getEnv("MINIO_API_PORT", "9000"),
  MINIO_HOST: getRequiredEnv("MINIO_HOST"),
  MINIO_ACCESS_KEY: getRequiredEnv("MINIO_ACCESS_KEY"),
  MINIO_SECRET_KEY: getRequiredEnv("MINIO_SECRET_KEY"),
} as const;
