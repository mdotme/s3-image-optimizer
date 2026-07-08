# Stage 1: Build & Dependency Installation
FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Stage 2: Production Runtime Environment
FROM oven/bun:1.3.14-alpine AS runner
WORKDIR /app

RUN apk add --no-cache \
  vips \
  vips-dev \
  vips-heif

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD test -n "$(find /tmp/worker-healthy -mmin -1 2>/dev/null)" || exit 1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

ENV NODE_ENV=production

CMD ["bun", "run", "src/index.ts"]
