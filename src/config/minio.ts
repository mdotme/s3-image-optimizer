import * as Minio from "minio";
import { env } from "./env";

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_HOST,
  port: env.MINIO_PORT,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
  useSSL: env.MINIO_USE_SSL,
});
