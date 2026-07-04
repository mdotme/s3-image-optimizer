export interface ImageOptimizerOptimizeOptions {
  quality: number;
  width?: number;
  height?: number;
  filter?: Bun.Image.Filter;
}

export class ImageOptimizer {
  // private readonly rootJobDir = join("/tmp", "s3-image-optimizer");

  async optimize(
    input: string,
    output: string,
    opts: ImageOptimizerOptimizeOptions,
  ): Promise<void> {
    // const tempId = Bun.randomUUIDv7();
    // const jobDir = join(this.rootJobDir, tempId);
    // const downloadPath = join(jobDir, "input");
    // const outputPath = join(jobDir, "output");
    // await mkdir(jobDir, { recursive: true });

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
}
