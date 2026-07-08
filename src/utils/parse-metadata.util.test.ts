import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { parseMetadata } from "./parse-metadata.util";

const TEST_PAYLOAD = {
  "X-Amz-Meta-Optimized": "false",
  "X-Amz-Meta-Output-Object-Key":
    "019f406a-d833-7000-a1e6-3f4f0789ae8a/optimized.webp",
  "X-Amz-Meta-Quality": "80",
  "X-Amz-Meta-Width": "1920",
  "content-type": "image/png",
};

describe("parseMetadata", () => {
  // biome-ignore lint/suspicious/noExplicitAny: disable any type warn
  let mockPayload: Record<string, any>;

  beforeEach(() => {
    mockPayload = { ...TEST_PAYLOAD };
  });

  afterEach(() => {
    mockPayload = {};
  });

  test("lower-cases all keys and strips the x-amz-meta- prefix cleanly", () => {
    const result = parseMetadata(mockPayload);

    expect(result.optimized).toBe("false");
    expect(result["output-object-key"]).toBe(
      "019f406a-d833-7000-a1e6-3f4f0789ae8a/optimized.webp",
    );
    expect(result.quality).toBe("80");
    expect(result.width).toBe("1920");
  });

  test("leaves non-prefixed system metadata keys lower-cased but untouched", () => {
    const result = parseMetadata(mockPayload);

    expect(result["content-type"]).toBe("image/png");
  });

  test("safely handles pre-lowercased metadata variants with prefixes", () => {
    const input = {
      "x-amz-meta-quality": "90",
      "content-type": "image/jpeg",
    };

    const result = parseMetadata(input);

    expect(result.quality).toBe("90");
    expect(result["content-type"]).toBe("image/jpeg");
  });

  test("strips mixed-cased variations of the prefix string safely", () => {
    const input = {
      "X-aMz-MeTa-OuTpUt-WiDtH": "1280",
    };

    const result = parseMetadata(input);

    expect(result["output-width"]).toBe("1280");
  });

  test("returns an empty object when input is empty", () => {
    expect(parseMetadata({})).toEqual({});
  });

  test("preserves all basic type assignments without structural adjustments", () => {
    const input = {
      "X-Amz-Meta-Numeric": 500,
      "X-Amz-Meta-Boolean": true,
    };

    const result = parseMetadata(input);

    expect(result.numeric).toBe(500);
    expect(result.boolean).toBe(true);
  });
});
