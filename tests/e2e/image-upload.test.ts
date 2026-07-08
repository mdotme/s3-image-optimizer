import { describe, test } from "bun:test";
import { join } from "node:path";
import { minioClient } from "@/config/minio";

describe("Image uploads", () => {
  test("Image upload", async () => {
    const id = Bun.randomUUIDv7();

    await minioClient.fPutObject(
      "public",
      `${id}/original.png`,
      join(import.meta.dir, "../fixtures/fun.png"),
      {
        "Content-Type": "image/png",
        optimized: "false",
        quality: "80",
        width: "1920",
        "output-object-key": `${id}/optimized.webp`,
      },
    );
  });
});
