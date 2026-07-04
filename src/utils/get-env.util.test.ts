import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getEnv } from "./get-env.util";

const TEST_KEY = "GET_ENV_TEST_KEY";

describe("getEnv", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "get-env-test-"));
		delete process.env[TEST_KEY];
		delete process.env[`${TEST_KEY}_FILE`];
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
		delete process.env[TEST_KEY];
		delete process.env[`${TEST_KEY}_FILE`];
	});

	test("returns the env var when set", () => {
		process.env[TEST_KEY] = "direct-value";

		expect(getEnv(TEST_KEY)).toBe("direct-value");
	});

	test("returns undefined when unset and no default", () => {
		expect(getEnv(TEST_KEY)).toBeUndefined();
	});

	test("returns default when unset", () => {
		expect(getEnv(TEST_KEY, "fallback")).toBe("fallback");
	});

	test("prefers env var over docker secret file", () => {
		const secretPath = join(tempDir, "secret");
		writeFileSync(secretPath, "secret-value\n");
		process.env[TEST_KEY] = "direct-value";
		process.env[`${TEST_KEY}_FILE`] = secretPath;

		expect(getEnv(TEST_KEY)).toBe("direct-value");
	});

	test("reads value from docker secret file when env var is unset", () => {
		const secretPath = join(tempDir, "secret");
		writeFileSync(secretPath, "secret-value\n");
		process.env[`${TEST_KEY}_FILE`] = secretPath;

		expect(getEnv(TEST_KEY)).toBe("secret-value");
	});

	test("trims whitespace from secret file contents", () => {
		const secretPath = join(tempDir, "secret");
		writeFileSync(secretPath, "  secret-value  \n\n");
		process.env[`${TEST_KEY}_FILE`] = secretPath;

		expect(getEnv(TEST_KEY)).toBe("secret-value");
	});

	test("falls back to default when env var is empty", () => {
		process.env[TEST_KEY] = "";

		expect(getEnv(TEST_KEY, "fallback")).toBe("fallback");
	});

	test("falls back to default when secret file path does not exist", () => {
		process.env[`${TEST_KEY}_FILE`] = join(tempDir, "missing-secret");

		expect(getEnv(TEST_KEY, "fallback")).toBe("fallback");
	});

  test("falls back to default when env var and secret file are unset", () => {
    expect(getEnv(TEST_KEY, "9000")).toBe("9000");
  });
});
