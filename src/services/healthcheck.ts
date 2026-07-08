import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HEALTH_FILE_PATH = join(tmpdir(), "worker-healthy");

export function startHeartbeatInterval(intervalMs = 30000): void {
  writeFileSync(HEALTH_FILE_PATH, Date.now().toString());

  setInterval(() => {
    try {
      writeFileSync(HEALTH_FILE_PATH, Date.now().toString());
    } catch (error) {
      console.error(
        "[Health Monitor] Failed to write health check file",
        error,
      );
    }
  }, intervalMs);
}
