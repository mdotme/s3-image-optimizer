import { getEnv, getRequiredEnv } from "@/utils/get-env.util";

export const env = {
  RABBITMQ_USER: getRequiredEnv("RABBITMQ_USER"),
  RABBITMQ_PASS: getRequiredEnv("RABBITMQ_PASS"),
  RABBITMQ_HOST: getRequiredEnv("RABBITMQ_HOST"),
  RABBITMQ_AMQP_PORT: +getEnv("RABBITMQ_AMQP_PORT", "5672"),

  MINIO_EVENT_EXCHANGE: getEnv("MINIO_EVENT_EXCHANGE", "minio.events"),
  MINIO_EVENT_QUEUE: getEnv("MINIO_EVENT_QUEUE", "image-uploads"),

  MINIO_API_PORT: +getEnv("MINIO_API_PORT", "9000"),
  MINIO_HOST: getRequiredEnv("MINIO_HOST"),
  MINIO_ACCESS_KEY: getRequiredEnv("MINIO_ACCESS_KEY"),
  MINIO_SECRET_KEY: getRequiredEnv("MINIO_SECRET_KEY"),
} as const;
