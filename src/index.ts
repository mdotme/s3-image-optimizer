import { startHeartbeatInterval } from "./services/healthcheck";
import { rabbitMQService } from "./services/rabbitmq";
import { startImageOptimizerWorker } from "./workers/image-optimizer.worker";

async function main() {
  const channel = await rabbitMQService.connect();
  await startImageOptimizerWorker(channel);
  startHeartbeatInterval();
}

async function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown process...`);
  await rabbitMQService.disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Promise Rejection]:", reason);
});

main();
