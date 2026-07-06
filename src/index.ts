import { rabbitMQService } from "./services/rabbitmq";
import { startImageOptimizerWorker } from "./workers/image-optimizer.worker";

async function main() {
  const channel = await rabbitMQService.connect();
  await startImageOptimizerWorker(channel);
}

async function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown process...`);
  await rabbitMQService.disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

main();
