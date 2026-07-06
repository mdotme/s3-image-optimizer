import { env } from "./config/env";

function main() {
  console.log("Hello via Bun!");
  console.log("ENV:");
  console.log(env);
}

main();
