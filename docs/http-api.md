# HTTP API (`apps/api`)

A self-hostable render service: **Fastify** for HTTP and **BullMQ + Redis** to run layout/rasterization off the event loop. Deploy it (Railway, Fly, a container, etc.) and `POST` JSON to get diagrams back. This app is **not published to npm** — run it from the monorepo.

## Run it

```bash
# 1. Redis (required — jobs are queued)
docker run -p 6379:6379 redis

# 2. Start the API
REDIS_URL=redis://localhost:6379 API_KEY=your_secret \
  pnpm --filter @glyphic/api start
```

The repo ships a `nixpacks.toml`, so platforms like Railway build and run it with zero extra config (just provide the env vars + a Redis instance).

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `API_KEY` | — | **Required.** Bearer token for all endpoints except `/health`. If unset, every request is rejected. |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection for the BullMQ queue. |
| `PORT` | `3000` | HTTP port. |
| `CORS_ORIGIN` | *(disabled)* | Comma-separated allowlist of browser origins. Omit for same-origin / server-to-server. |
| `RATE_LIMIT_MAX` | `60` | Max requests per IP per minute. |
| `WORKER_CONCURRENCY` | `2` | Concurrent render jobs per worker process. |

## Endpoints

### `POST /v1/render`

Render a diagram. Body is a [`DiagramInput`](./diagram-types.md) JSON object (max 256 KB).

```bash
curl -X POST http://localhost:3000/v1/render \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json" \
  -d '{ "type": "flowchart", "nodes": [{ "id": "a", "label": "Start" }], "edges": [] }'
```

Responses:

| Status | Body | When |
|---|---|---|
| `200` | `{ png, svg, reactFlow?, metadata }` (`png` is base64) | Rendered within ~30s. |
| `202` | `{ message, jobId }` | Still running after 30s — poll with the job id. |
| `400` | `{ error, details }` | Invalid schema (Zod issues in `details`). |
| `401` | `{ error }` | Missing/invalid API key. |

### `GET /v1/render/:jobId`

Poll a long-running job. Requires the **same** API key that created it (jobs are owned).

| Status | Body |
|---|---|
| `200` | the completed result, **or** `{ status, jobId }` if still running |
| `403` | the key doesn't own this job |
| `404` | unknown job id |
| `500` | `{ error }` (generic — failure details are logged server-side only) |

### `GET /health`

No auth. Returns `200 { status: "ok" }` when Redis is reachable, `503 { status: "degraded" }` otherwise — suitable for load-balancer health checks.

## Operational notes

- **Security:** constant-time API-key comparison, per-IP rate limiting, a request body cap, per-job ownership checks, and generic error messages (internals are never returned to clients).
- **Reliability:** jobs retry with exponential backoff; completed/failed jobs are trimmed from Redis automatically.
- **Graceful shutdown:** `SIGTERM`/`SIGINT` drain the server, worker, queue, and Redis connection so in-flight renders aren't lost.
- **Scaling:** run multiple replicas against one Redis; tune `WORKER_CONCURRENCY` to your CPU. Rendering is CPU/memory-bound.
