import { mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { downloadStream } from "@/utils/download-stream.util";

export interface ImageOptimizerOptimizeOptions {
  quality: number;
  width?: number;
  height?: number;
  filter?: Bun.Image.Filter;
}

export class ImageOptimizer {
  public readonly ID = Bun.randomUUIDv7();
  public readonly rootJobDir = join(tmpdir(), "s3-image-optimizer");
  public readonly jobDir: string;
  public readonly downloadPath: string;
  public readonly outputPath: string;

  constructor() {
    this.jobDir = join(this.rootJobDir, this.ID);
    this.downloadPath = join(this.jobDir, "input");
    this.outputPath = join(this.jobDir, "output");
    mkdirSync(join(this.jobDir), { recursive: true });
  }

  async optimize(
    input: string,
    output: string,
    opts: ImageOptimizerOptimizeOptions,
  ): Promise<void> {
    const img = Bun.file(input).image({
      autoOrient: true, // EXIF orientation case
    });
    await img.metadata();

    if (opts.width && img.width > opts.width) {
      img.resize(opts.width, opts.height, {
        filter: opts?.filter,
        withoutEnlargement: true, // Safety
      });
    }

    img.webp({
      quality: opts.quality,
    });

    await img.write(output);
  }

  async optimizeStream(stream: Readable, opts: ImageOptimizerOptimizeOptions) {
    await downloadStream(stream, this.downloadPath);
    await this.optimize(this.downloadPath, this.outputPath, opts);
  }

  async cleanup() {
    try {
      await rm(this.jobDir, {
        recursive: true,
        force: true,
      });
    } catch (err) {
      console.error(`Error cleaning up image optimizer temp directory: ${err}`);
    }
  }
}
