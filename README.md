# 🚀 S3 Image Optimizer Microservice

An event-driven, high-performance image optimization microservice built with Bun and TypeScript.

The service listens for raw image upload events from MinIO / S3 via RabbitMQ, downloads the image to a localized temporary scratch space, processes and converts them to optimized WebP file using Bun’s native image APIs, and pushes them back onto the storage bucket.

Refer to `docker-compose.yml` `image-optimizer` section to see example docker compose usecase.

## 🔐 Environmental Variables

All environmental variables ending with
`_FILE` suffix are treated as secret (files) and supported.
Keep in mind that if both vars are defined it gets the regular one.
For example if you define `MINIO_SECRET_KEY` & `MINIO_SECRET_KEY_FILE`
it gets from `MINIO_SECRET_KEY`

| Name                    | Required |      Default      | Description                                                                                                                                                                                                                                   |
| :---------------------- | :------: | :---------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RABBITMQ_URL`          |  ✅ Yes  |      _None_       | AMQP broker connection string used to consume S3 object creation events.                                                                                                                                                                      |
| `MINIO_EVENT_EXCHANGE`  |  ❌ No   | `"minio.events"`  | RabbitMQ Exchange where MinIO publishes bucket notifications.                                                                                                                                                                                 |
| `MINIO_EVENT_QUEUE`     |  ❌ No   | `"image-uploads"` | Target RabbitMQ Queue that holds incoming processing jobs.                                                                                                                                                                                    |
| `OPTIMIZED_EVENT_QUEUE` |  ❌ No   |      _None_       | (Optional) Target RabbitMQ Queue where successful image optimization event payloads are published. If omitted, outbound routing is disabled. Payload interface definition in [optimized-event.types.ts](./src/types/optimized-event.types.ts) |
| `MINIO_HOST`            |  ❌ No   |   `"localhost"`   | Hostname or IP address of the MinIO S3 storage cluster.                                                                                                                                                                                       |
| `MINIO_PORT`            |  ❌ No   |      `9000`       | Port used to connect to the MinIO API endpoint.                                                                                                                                                                                               |
| `MINIO_USE_SSL`         |  ❌ No   |     `"false"`     | Toggles secure HTTPS/SSL transport connections (`true`/`false`).                                                                                                                                                                              |
| `MINIO_ACCESS_KEY`      |  ✅ Yes  |      _None_       | Root access key or user ID credential for MinIO authentication. Also supports `MINIO_ACCESS_KEY_FILE` secret mapping.                                                                                                                         |
| `MINIO_SECRET_KEY`      |  ✅ Yes  |      _None_       | Root secret token or password credential for MinIO authentication. Also supports `MINIO_SECRET_KEY_FILE` secret mapping.                                                                                                                      |

## Object metadata

The worker relies on Amazon S3 Object Metadata headers to determine whether an image should be processed and how it should be transformed.

Processing and Filter Rules

- Bypassing / Ignoring Files: If the any of required metadata headers is missing, the worker ignores the event entirely and leaves the object untouched.

- Format Optimization: Regardless of the input format (JPEG, PNG, HEIC, etc.), the worker dynamically optimizes and converts the output exclusively into the WebP format using native `Bun.Image` bindings.

- Fallback Behavior: All optional fields omit execution overrides; if left out, they automatically defer to the optimized internal defaults provided by `Bun.Image`.

| Name                           | Required |       Default       | Description                                                                                                                                                                  |
| :----------------------------- | :------: | :-----------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-Amz-Meta-Optimize-Image`    |  ✅ Yes  |       _None_        | Trigger flag for the worker. Must be exactly `"true"` to run the asset through the optimization pipeline.                                                                    |
| `X-Amz-Meta-Quality`           |  ✅ Yes  |       _None_        | Target compression value. Must be a valid integer string between `1` and `100`.                                                                                              |
| `X-Amz-Meta-Output-Object-Key` |  ✅ Yes  |       _None_        | Destination S3 path where the final processed image will be written.                                                                                                         |
| `X-Amz-Meta-Width`             |  ❌ No   | _Bun.Image Default_ | Target resizing width in pixels. Must be a positive integer $\ge 1$.                                                                                                         |
| `X-Amz-Meta-Height`            |  ❌ No   | _Bun.Image Default_ | Target resizing height in pixels. Must be a positive integer $\ge 1$.                                                                                                        |
| `X-Amz-Meta-Filter`            |  ❌ No   | _Bun.Image Default_ | Resampling kernel algorithm used during scaling. Accepted values: `nearest`, `box`, `bilinear`, `linear`, `cubic`, `mitchell`, `lanczos2`, `lanczos3`, `mks2013`, `mks2021`. |

## Development

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
To install dependencies:

```bash
bun install
```

Copy `.env.example` to `.env` and fill values. Also don't forget to create storage secret file in `.docker/secrets/storage_secret_key.txt`:

```bash
printf %s "password" > ./.docker/secrets/storage_secret_key.txt
```

Don't forget to start docker compose before starting the app.

To start app:

```bash
bun dev
```

🧪 To run tests:

```bash
bun test src/ # For unit tests
bun test tests/e2e # For e2e uploading tests
```
