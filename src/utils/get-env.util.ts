import { existsSync, readFileSync } from "node:fs";

function readSecretFile(filePath: string): string | undefined {
	if (!existsSync(filePath)) {
		return undefined;
	}

	return readFileSync(filePath, "utf8").trim();
}

/**
 * Resolves an environment variable, falling back to Docker secrets via `{NAME}_FILE`.
 *
 * @example
 * // Direct env: MINIO_ENDPOINT=http://minio:9000
 * getEnv("MINIO_ENDPOINT");
 *
 * @example
 * // Docker secret: MINIO_SECRET_KEY_FILE=/run/secrets/minio_secret_key
 * getEnv("MINIO_SECRET_KEY");
 *
 * @example
 * getEnv("MINIO_PORT", "9000");
 */
export function getEnv(name: string): string | undefined;
export function getEnv(name: string, defaultValue: string): string;
export function getEnv(
	name: string,
	defaultValue?: string,
): string | undefined {
	const value = process.env[name];
	if (value !== undefined && value !== "") {
		return value;
	}

	const secretFilePath = process.env[`${name}_FILE`];
	if (secretFilePath) {
		const secret = readSecretFile(secretFilePath);
		if (secret !== undefined) {
			return secret;
		}
	}

	return defaultValue;
}
