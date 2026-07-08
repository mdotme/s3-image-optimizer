# 🚀 S3 Image Optimizer Microservice

An event-driven, high-performance image optimization microservice built with Bun and TypeScript.

The service listens for raw image upload events from MinIO / S3 via RabbitMQ, downloads the image to a localized temporary scratch space, processes and converts them to optimized WebP file using Bun’s native image APIs, and pushes them back onto the storage bucket.

## Development

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```
