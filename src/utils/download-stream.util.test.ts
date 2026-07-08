import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { downloadStream } from "./download-stream.util";

describe("downloadStream", () => {
  let tempDir: string;
  let targetFilePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "download-stream-test-"));
    targetFilePath = join(tempDir, "output.txt");
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("successfully pipes stream content directly to a disk destination", async () => {
    const mockStream = Readable.from([
      "bun-stream-chunk-1\n",
      "bun-stream-chunk-2",
    ]);

    const result = await downloadStream(mockStream, targetFilePath);

    expect(result).toBe(targetFilePath);
    expect(existsSync(targetFilePath)).toBe(true);
    expect(readFileSync(targetFilePath, "utf-8")).toBe(
      "bun-stream-chunk-1\nbun-stream-chunk-2",
    );
  });

  test("rejects the promise if the writable file stream hits an invalid directory path", async () => {
    const mockStream = Readable.from(["data"]);
    const invalidPath = join(tempDir, "missing-subfolder", "output.txt");

    expect(downloadStream(mockStream, invalidPath)).rejects.toThrow();
  });
});
