# SMRY

Article reader and summarizer with AI chat.

## Tech Stack

- **Runtime**: Bun
- **Frontend**: Next.js (React 19, TypeScript, Tailwind CSS)
- **Backend**: Elysia (Bun-native web framework)
- **AI/LLM**: OpenRouter (Vercel AI SDK for streaming)
- **Auth**: Clerk (billing + JWT)
- **Analytics**: PostHog (product analytics, session recording, heatmaps, LLM analytics)
- **Database**: Upstash Redis (rate limiting, chat thread storage)
- **Client Storage**: IndexedDB (offline-first chat threads), localStorage (article history, preferences)

## Project Structure

```
app/              Next.js pages and route handlers
components/       React components (features/, ui/, ads/, ai/)
lib/              Shared utilities, hooks, storage
server/           Elysia API server
  routes/         API endpoints (chat, chat-threads, gravity)
  middleware/     Auth middleware
classifier/       XGBoost article classifier (Python/FastAPI, Docker)
types/            Zod schemas and shared types
```

## Key Commands

```bash
bun dev           # Start all services (classifier + Elysia + Next.js)
bun run dev:app   # Start app only (no classifier)
bun run build     # Production build
bun run lint      # ESLint
bun run typecheck # TypeScript check
bun test          # Run tests
```

## Architecture Notes

- Monorepo: Next.js frontend on port 3000, Elysia API on port 3001, Classifier on port 8000
- Next.js route handlers proxy to Elysia for streaming (avoids SSE buffering)
- Article extraction: Collect-Classify-Select — 3 sources run in parallel, XGBoost classifier picks the best one. See [docs/CLASSIFIER.md](docs/CLASSIFIER.md)
- Ad system: ZeroClick (primary) + Gravity (fallback) waterfall
- Chat threads: offline-first (IndexedDB) with server sync (Redis) for premium users
- Article history: client-side only (localStorage), premium users see full history

## Memory Monitoring

- `/health` endpoint includes memory stats and cache sizes
- Memory tracking logs: `memory_spike_operation`, `memory_operation`, `fetch_response`
- See [docs/MEMORY_TRACKING.md](docs/MEMORY_TRACKING.md) for debugging guide
