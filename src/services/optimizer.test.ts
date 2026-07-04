import { beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  ImageOptimizer,
  type ImageOptimizerOptimizeOptions,
} from "./optimizer";

const projectRoot = join(import.meta.dir, "../..");
const fixturesDir = join(projectRoot, "tests/fixtures");
const outputDir = join(projectRoot, "optimized");

const FIXTURES = [
  { name: "text", file: "text.jpg" },
  { name: "trees", file: "trees.jpg" },
  { name: "fun", file: "fun.png" },
] as const;

const OPTIMIZE_CASES = [
  {
    name: "default",
    opts: { quality: 78 },
    targetWidth: undefined,
  },
  {
    name: "small",
    opts: { quality: 78, width: 800 },
    targetWidth: 800,
  },
  {
    name: "medium",
    opts: { quality: 78, width: 1920 },
    targetWidth: 1920,
  },
  {
    name: "no-enlarge",
    opts: { quality: 80, width: 6000 },
    targetWidth: 6000,
  },
] as const satisfies ReadonlyArray<{
  name: string;
  opts: ImageOptimizerOptimizeOptions;
  targetWidth: number | undefined;
}>;

const QUALITIES = [20, 50, 75] as const;
const QUALITY_WIDTH = 800;

function fixturePath(file: string): string {
  return join(fixturesDir, file);
}

function outputPath(fixtureName: string, caseName: string): string {
  const dir = join(outputDir, fixtureName);
  mkdirSync(dir, { recursive: true });
  return join(dir, `${caseName}.webp`);
}

function resetOutputDir(): void {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
}

function expectedDimensions(
  source: { width: number; height: number },
  targetWidth?: number,
): { width: number; height: number } {
  if (targetWidth === undefined || source.width <= targetWidth) {
    return { width: source.width, height: source.height };
  }

  return {
    width: targetWidth,
    height: Math.round(source.height * (targetWidth / source.width)),
  };
}

async function getFileSize(path: string): Promise<number> {
  return (await Bun.file(path).arrayBuffer()).byteLength;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatSizeDelta(originalSize: number, outputSize: number): string {
  const delta = originalSize - outputSize;
  const percent = Math.abs((delta / originalSize) * 100).toFixed(1);

  if (delta > 0) {
    return `saved ${formatBytes(delta)} (${percent}%)`;
  }

  if (delta < 0) {
    return `+${formatBytes(-delta)} larger (+${percent}%)`;
  }

  return "same size";
}

function logSizeComparison(
  label: string,
  originalSize: number,
  outputSize: number,
): void {
  console.log(
    `[${label}] ${formatBytes(originalSize)} -> ${formatBytes(outputSize)} (${formatSizeDelta(originalSize, outputSize)})`,
  );
}

describe("ImageOptimizer", () => {
  const optimizer = new ImageOptimizer();

  describe("optimize", () => {
    beforeAll(() => {
      resetOutputDir();
    });

    for (const fixture of FIXTURES) {
      for (const optimizeCase of OPTIMIZE_CASES) {
        test(`${fixture.name}/${optimizeCase.name}`, async () => {
          const input = fixturePath(fixture.file);
          const output = outputPath(fixture.name, optimizeCase.name);
          const source = await Bun.file(input).image().metadata();
          const originalSize = await getFileSize(input);

          await optimizer.optimize(input, output, optimizeCase.opts);

          expect(await Bun.file(output).exists()).toBe(true);

          const result = await Bun.file(output).image().metadata();
          const expected = expectedDimensions(source, optimizeCase.targetWidth);
          const outputSize = await getFileSize(output);

          logSizeComparison(
            `${fixture.name}/${optimizeCase.name}`,
            originalSize,
            outputSize,
          );

          expect(result.format).toBe("webp");
          expect(result.width).toBe(expected.width);

          if (
            optimizeCase.targetWidth !== undefined &&
            source.width > optimizeCase.targetWidth
          ) {
            expect(
              Math.abs(result.height - expected.height),
            ).toBeLessThanOrEqual(1);
          } else {
            expect(result.height).toBe(expected.height);
          }
        });
      }
    }

    for (const fixture of FIXTURES) {
      test(`${fixture.name}/quality`, async () => {
        const input = fixturePath(fixture.file);
        const originalSize = await getFileSize(input);
        const sizes: number[] = [];

        console.log(
          `\n[${fixture.name}/quality] original: ${formatBytes(originalSize)}`,
        );

        for (const quality of QUALITIES) {
          const output = outputPath(fixture.name, `quality-${quality}`);

          await optimizer.optimize(input, output, {
            quality,
            width: QUALITY_WIDTH,
          });

          expect(await Bun.file(output).exists()).toBe(true);

          const metadata = await Bun.file(output).image().metadata();
          expect(metadata.format).toBe("webp");

          const outputSize = await getFileSize(output);
          sizes.push(outputSize);

          logSizeComparison(
            `${fixture.name}/quality-${quality}`,
            originalSize,
            outputSize,
          );
        }

        for (let index = 1; index < sizes.length; index++) {
          expect(sizes[index - 1]).toBeLessThan(sizes[index] as number);
        }
      });
    }
  });
});
