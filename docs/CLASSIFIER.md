# Article Extraction Classifier

XGBoost ML classifier that evaluates HTML extraction quality from each source (smry-fast, wayback, diffbot) and picks the best one. Replaces the old ">500 chars first-wins" heuristic with an accuracy-first approach.

## Architecture

```
                   /article/auto request
                          |
                   +------v------+
                   | Cache check  |  (Redis)
                   +------+------+
                          | miss
                   +------v-------+
                   | COLLECT       |  Fire all 3 sources in parallel
                   | (no abort)    |  Every source gets equal opportunity
                   +--+----+----+-+
                      |    |    |
               smry-fast wayback diffbot
                (~1s)   (~3s)   (~8s)
                      |    |    |
                      v    v    v
                   +--------------+
                   | CLASSIFY      |  XGBoost model classifies each
                   | (model-only)  |  result into a tier
                   +------+-------+
                          |
                   +------v-------+
                   | SELECT        |  1. Best tier wins
                   |               |  2. Longest article
                   |               |  3. Highest confidence
                   |               |  Only winner cached.
                   +------+-------+
                          |
                   Return winner
```

## How It Works

### Collect Phase

All 3 extraction sources run to completion via `Promise.allSettled()`. No early abort, no speed bias. Every source gets equal opportunity regardless of how fast it responds.

Classification runs in parallel with Readability parsing inside each fetch function (adds 0ms to critical path).

### Classify Phase

Every source result is sent to the classifier microservice. The XGBoost model's prediction is used directly — no post-model rules override the model's decision. The model was trained on 138k samples with ~90% accuracy and already considers all relevant features (paywall keywords, nav signals, form density, etc.) in its learned decision boundary.

The classifier service uses sync `def` handlers (not `async def`) so FastAPI runs CPU-bound XGBoost inference in a threadpool worker instead of blocking the asyncio event loop. This allows concurrent classification requests to be processed in parallel.

### Select Phase

Sources are ranked using a comparator:

1. **Best classifier tier** — `full_article_extracted` always beats `partial_article_extracted`, regardless of source or length
2. **Longest article** — within the same tier, more content = better extraction
3. **Highest confidence** — tiebreaker when tier and length are identical

When only one source has classification data:
- If classified as tier 0-2 (good result), the classified source wins
- If classified as tier 3-4 (bad result like `not_article` or `api_error`), the unclassified source wins — a confirmed-bad classification shouldn't beat a potentially good unclassified article

Only the winning source is cached to Redis. Losers are released from memory immediately (content fields wiped, arrays cleared).

### When Classifier is Unavailable

If the classifier service is down or returns null, selection degrades gracefully:
- Score = `article_length x 0.70 + source_reliability x 0.30`
- Source reliability: diffbot (1.0) > wayback (0.8) > smry-fast (0.6)

Rollback: set `CLASSIFIER_ENABLED=false` (env var change, no redeploy needed).

## Classifier Tiers

| Tier | Label | Meaning |
|------|-------|---------|
| 0 | `full_article_extracted` | Clean full article — best outcome |
| 1 | `partial_article_extracted` | Paywall or partial content detected |
| 2 | `other_failure` | Unknown extraction issue |
| 3 | `api_provider_error` | Source API failed |
| 4 | `full_page_not_article` | Not an article (homepage, nav page, etc.) |

## Model Details

| Property | Value |
|----------|-------|
| Algorithm | XGBoost Booster (multi:softmax, 7 classes → 5 pipeline tiers) |
| Source | [Allanatrix/Summary_model](https://huggingface.co/Allanatrix/Summary_model) |
| Accuracy | ~90% on test set |
| Inference | <17ms per classification (includes feature extraction) |
| Features | 27 (HTML structure, keyword counts, tag densities, URL patterns) |
| File | `classifier/XGBOOST.pt` (1.3MB, joblib-serialized, XGBoost 2.1.3) |
| Approach | Model-only — all inputs go through XGBoost, no post-model rules |

### Model Labels (7 classes → 5 pipeline labels)

| Model Label | Pipeline Label | Description |
|------------|---------------|-------------|
| `bypassed_article` | `full_article_extracted` | Complete article content |
| `partial_bypass` | `partial_article_extracted` | Some content extracted |
| `hard_paywall` | `partial_article_extracted` | Hard paywall blocking content |
| `paywall_active` | `partial_article_extracted` | Paywall detected |
| `api_error` | `api_provider_error` | Extraction API failure |
| `content_unavailable` | `other_failure` | Content not accessible |
| `not_article` | `full_page_not_article` | Homepage, nav page, non-article |

## Local Development

```bash
# Single command — starts classifier + API + Next.js
bun dev

# Output:
# === SMRY Dev Environment ===
#   App:        http://localhost:3000
#   API:        http://localhost:3001
#   Classifier: http://localhost:8000
#   Press Ctrl+C to stop all services
# =============================
```

`bun dev` automatically:
1. Builds the classifier Docker image (first run only)
2. Starts the classifier container on port 8000
3. Waits for health check — sets `CLASSIFIER_ENABLED=true` only if healthy
4. Starts Elysia API + Next.js with classifier env vars set

Other commands:
```bash
bun run dev:app           # App only (no classifier)
bun run classifier:build  # Rebuild classifier image
bun run classifier:health # Check classifier status
bun run dev:docker        # Full Docker stack via docker-compose
```

## Deployment (Railway CLI)

The classifier runs as a separate service. No GitHub connection needed — deploy directly from your machine.

### Prerequisites

```bash
brew install railway
railway login
```

### Deploy

```bash
# Link to your Railway project
cd /path/to/SMRY
railway link

# Deploy classifier (creates service from Dockerfile)
railway up --service classifier -d ./classifier

# Set the port
railway vars set PORT=8000 --service classifier

# Wire it into your main app
railway vars set \
  CLASSIFIER_URL=http://classifier.railway.internal:8000 \
  CLASSIFIER_ENABLED=true \
  --service <your-main-app-service-name>

# Verify
railway logs --service classifier
```

### Railway Service Settings

| Setting | Value |
|---------|-------|
| Root Directory | `classifier/` |
| Builder | Dockerfile |
| Port | `8000` |
| Health Check | `/health` (returns 200 in both healthy and degraded mode) |
| Memory | 512 MB |
| Restart | Always |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLASSIFIER_URL` | No | `http://localhost:8000` | Classifier service URL |
| `CLASSIFIER_ENABLED` | No | `false` | Set `true` to activate classifier-based selection |

When `CLASSIFIER_ENABLED=false`, the system falls back to length x reliability scoring.

## Monitoring

### Structured Logs

Every article request logs the classifier decision:

```
Classifier: smry-fast  → full_article_extracted  (conf=0.44, method=model)
Classifier: wayback    → partial_article_extracted (conf=0.44, method=model)
Classifier: smry-slow  → full_article_extracted  (conf=0.43, method=model)
Extraction outcome: smry-slow won (tier=full_article_extracted, len=13409)
  sources: {
    smry-slow: { classification: full,    tier: 0, length: 13409, rank: 1 }
    smry-fast: { classification: full,    tier: 0, length: 13384, rank: 2 }
    wayback:   { classification: partial, tier: 1, length: 13384, rank: 3 }
  }
```

### PostHog Events

**`extraction_classified`** — 1 per source per request (up to 3):

| Property | Example |
|----------|---------|
| `source` | `wayback` |
| `classification` | `full_article_extracted` |
| `classification_confidence` | `0.44` |
| `classification_method` | `model` |
| `classification_latency_us` | `16000` |
| `article_length` | `13384` |

**`extraction_outcome`** — 1 per request (only emitted when at least one source was classified):

| Property | Example |
|----------|---------|
| `winning_source` | `smry-slow` |
| `winning_classification` | `full_article_extracted` |
| `winning_confidence` | `0.43` |
| `selection_reason` | `classifier_decided` / `fallback_length_reliability` / `single_source` |
| `smry_fast_classification` | `full_article_extracted` |
| `smry_fast_length` | `13384` |
| `total_fetch_ms` | `7703` |

### PostHog Insights to Build

1. **Source win rate**: Trends → `extraction_outcome` → breakdown by `winning_source`
2. **Tier distribution**: Trends → `extraction_classified` → breakdown by `classification` → then by `source`
3. **Latency**: Distribution → `extraction_outcome` → `total_fetch_ms`
4. **Classifier availability**: Trends → `extraction_outcome` → breakdown by `selection_reason`

## Production Performance

### Latency

| Scenario | Time |
|----------|------|
| Cache hit | <50ms |
| Cache miss, typical | 5-8s (all 3 sources finish) |
| Cache miss, worst case | ~15s (slowest source timeout) |
| Classifier down | Same latency (selection degrades gracefully) |
| Classifier timeout | 5s (runs in parallel with source fetches, not additive) |

### Memory (4GB server)

| Component | Usage |
|-----------|-------|
| App server baseline | ~300 MB RSS |
| Per article request peak | ~1.5 MB (3 sources, HTML + parsed) |
| After winner selected | ~0.5 MB (losers wiped) |
| Classifier service (4 workers) | ~400 MB RSS (separate container) |

### Scale Estimates

| Metric | 30K DAU | 80K DAU |
|--------|---------|---------|
| Avg req/s | ~5 | ~13 |
| Peak req/s | ~25 | ~65 |
| Classifier calls/s (peak) | ~75 (3 per req) | ~195 |
| Fetch slots needed | 75 (default) | 75-100 |
| Classifier workers | 4 (default) | 4-8 |
| Classifier memory | 400 MB | 400-800 MB |

### Tuning for Scale

- Increase `MAX_CONCURRENT_ARTICLE_FETCHES` env var (default: 75) if you see 503 OVERLOADED responses
- Increase classifier workers in `Dockerfile` CMD (default: `--workers 4`)
- Increase classifier timeout in `lib/classifier-client.ts` (default: 5s) if classifier queue backs up
- Cache hit rate improves over time — at steady state ~60-70% of requests are cache hits
