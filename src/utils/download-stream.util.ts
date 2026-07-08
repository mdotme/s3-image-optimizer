import { createWriteStream } from "node:fs";
import type { Readable } from "node:stream";

/**
 * Pipes a Node.js Readable stream directly onto the disk file system.
 * Prevents loading file contents into V8 application memory.
 */
export function downloadStream(
  stream: Readable,
  downloadPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileStream = createWriteStream(downloadPath);

    stream.pipe(fileStream);

    fileStream.on("finish", () => {
      fileStream.close();
      resolve(downloadPath);
    });

    fileStream.on("error", (streamErr) => {
      fileStream.close();
      reject(streamErr);
    });

    stream.on("error", (networkErr) => {
      fileStream.close();
      reject(networkErr);
    });
  });
}
