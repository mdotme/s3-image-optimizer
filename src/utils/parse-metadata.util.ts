/**
 * Normalizes an object's keys to lowercase and strips the S3 metadata prefix
 */
export function parseMetadata(
  // biome-ignore lint/suspicious/noExplicitAny: disable any type warn
  obj: Record<string, any>,
  // biome-ignore lint/suspicious/noExplicitAny: disable any type warn
): Record<string, any> {
  const prefix = "x-amz-meta-";

  return Object.keys(obj).reduce(
    (acc, key) => {
      const lowerKey = key.toLowerCase();
      const cleanKey = lowerKey.startsWith(prefix)
        ? lowerKey.slice(prefix.length)
        : lowerKey;

      acc[cleanKey] = obj[key];
      return acc;
    },
    // biome-ignore lint/suspicious/noExplicitAny: disable any type warn
    {} as Record<string, any>,
  );
}
