# Article Extraction Classifier

XGBoost classifier that categorizes HTML extraction outcomes with ~85% accuracy. Used by the SMRY article pipeline to decide whether an extraction result is a full article, paywalled content, or not an article at all.

## Architecture

```
                    /article/auto request
                           |
                    +------v------+
                    | Cache check |  (Redis — all 3 source keys)
                    +------+------+
                           | miss
                    +------v-------+
                    | Parallel     |  Fire all 3 sources at once
                    | Fetch        |
                    +-+----+-----+-+
                      |    |     |
               smry-fast wayback diffbot
                (~2s)   (~5s)   (~8s)
                      |    |     |
                  classify classify classify
                      |    |     |
                      v    v     v
                 +--------------------+
                 | Classifier Gate    |
                 |                    |
                 | full_article?      |
                 |   YES → return now |
                 |   NO  → wait for   |
                 |         remaining  |
                 +--------------------+
                           |
                    all settled
                           |
                 pick best by tier:
                 full > partial > rest
                 then by length
```

### Parallel Fetch + Classifier-Gated Selection

All 3 sources fire in parallel. As each result arrives, the classifier decides whether to accept it immediately or keep waiting:

| Classification | Action |
|---------------|--------|
| `full_article_extracted` | Accept immediately, return to user |
| `partial_article_extracted` | Store as fallback, keep waiting |
| `api_provider_error` | Skip, keep waiting |
| `full_page_not_article` | Skip, keep waiting |

When all sources have settled, pick the best result by classifier tier (full > partial > rest), then by article length within the same tier.

## Model

- **Source**: [Allanatrix/Summary_model](https://huggingface.co/Allanatrix/Summary_model)
- **Algorithm**: XGBoost Booster (multi:softmax, 92 boosted rounds)
- **File**: `XGBOOST.pt` (1.3MB, joblib-serialized, bundled in Docker image)
- **Inference**: <7ms per prediction (model path), rule-based fast path handles obvious cases in <1ms
- **Accuracy**: ~85.5% on test set

### Model Labels (7 classes)

The model predicts these raw labels, which are mapped to 5 pipeline labels:

| Model Label | Pipeline Label | Description |
|------------|---------------|-------------|
| `bypassed_article` | `full_article_extracted` | Complete article content |
| `partial_bypass` | `partial_article_extracted` | Some content extracted |
| `hard_paywall` | `partial_article_extracted` | Hard paywall blocking content |
| `paywall_active` | `partial_article_extracted` | Paywall detected |
| `api_error` | `api_provider_error` | Extraction API failure |
| `content_unavailable` | `other_failure` | Content not accessible |
| `not_article` | `full_page_not_article` | Homepage, nav page, non-article |

### Features (27)

Content stats, keyword signals, HTML tag counts, density metrics, and URL features:

```
length_chars, prefix_len, text_to_html_ratio, ws_ratio, digit_ratio, alpha_ratio,
paywall_kw, auth_required_kw, blocked_kw, error_kw, article_kw, meta_article, nav_kw,
n_p, n_a, n_h1, n_h2, n_article, n_main, n_form, n_input, n_button,
link_density, para_density, form_density, url_has_auth, url_is_platform
```

See `model.py:extract_features()` for the full extraction logic.

### File Format

The `XGBOOST.pt` file is a **joblib-serialized** dict (NOT regular pickle or torch format). It must be loaded with `joblib.load()`:

```python
import joblib

artifacts = joblib.load("XGBOOST.pt")
# Keys: model, scaler, label_to_id, id_to_label, features, version, model_type, accuracy
```

## Running Locally

### Option A: Docker (recommended)

```bash
cd classifier

# Build
docker build -t smry-classifier .

# Run
docker run -p 8000:8000 smry-classifier
```

### Option B: Python venv

Requires Python 3.11+ (tested with 3.11, 3.12, 3.13):

```bash
cd classifier

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Verify it works

```bash
# Health check
curl http://localhost:8000/health
# → {"status":"ok","model":{"loaded":true,"features":27,"labels":[...]}}

# Classify a full article (rule-based, <1ms)
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body><article><h1>Title</h1><p>P1</p><p>P2</p><p>P3</p><p>P4</p><p>P5</p><p>P6</p><p>P7</p><p>P8</p><p>P9</p><p>P10</p><meta property=\"og:article\" /><meta property=\"article:published\" /></article></body></html>"}'
# → {"outcome":"full_article_extracted","confidence":0.95,"method":"rule",...}

# Classify a non-article page (rule-based)
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body><nav>home menu navigation sidebar navigation navigation</nav><a>1</a><a>2</a><a>3</a></body></html>"}'
# → {"outcome":"full_page_not_article","confidence":0.95,"method":"rule",...}

# Classify ambiguous content (model inference, ~7ms)
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body><h1>Something</h1><p>A paragraph.</p></body></html>"}'
# → {"outcome":"...","confidence":0.64,"method":"model",...}
```

### Test with real websites

```bash
# Fetch real HTML and classify it
curl -s "https://www.nytimes.com/2026/03/02/us/politics/dhs-shutdown-impacts.htmll" | \
  python3 -c "import sys,json; print(json.dumps({'html':sys.stdin.read()}))" | \
  curl -X POST http://localhost:8000/classify -H 'Content-Type: application/json' -d @-
```

## Testing the Full Integration

### 1. Start the classifier

```bash
cd classifier && docker build -t smry-classifier . && docker run -p 8000:8000 smry-classifier
```

### 2. Configure env vars

```bash
# Add to .env or export:
CLASSIFIER_URL=http://localhost:8000
CLASSIFIER_ENABLED=true
```

### 3. Start SMRY

```bash
bun dev
```

### 4. Test

```bash
# Free article — should accept smry-fast immediately (~2s)
curl "http://localhost:3001/api/article/auto?url=https://www.paulgraham.com/do.html"

# Paywalled — should reject smry-fast, accept wayback (~5s)
curl "http://localhost:3001/api/article/auto?url=https://www.nytimes.com/2026/03/02/us/politics/dhs-shutdown-impacts.html"
```

### 5. Check logs

```
Parallel: classifier accepted full article  { source: "smry-fast", confidence: 0.95, elapsed_ms: 1823 }
```

Or for paywalled:
```
(smry-fast settled as partial, waiting...)
Parallel: classifier accepted full article  { source: "wayback", confidence: 0.91, elapsed_ms: 4521 }
```

## Rollout

```bash
CLASSIFIER_URL=http://smry-classifier.railway.internal:8000
CLASSIFIER_ENABLED=true
```

Classifier drives source selection. Rollback: set `CLASSIFIER_ENABLED=false` (env var change, no deploy).

## PostHog Events

Two events are emitted for monitoring:

**`extraction_classified`** — one per source per request:
- `url`, `hostname`, `source`, `classification`, `classification_confidence`, `classification_method`, `classification_latency_us`, `article_length`

**`extraction_outcome`** — one per `/article/auto` request:
- `winning_source`, `winning_classification`, `selection_reason`
- Per-source data: `smry_fast_classification`, `smry_fast_length`, `wayback_classification`, etc.
- Impact tracking: `classifier_changed_result`, `old_logic_source`

## Env Vars

| Variable | Required | Description |
|----------|----------|-------------|
| `CLASSIFIER_URL` | No | Classifier service URL (default: `http://localhost:8000`) |
| `CLASSIFIER_ENABLED` | No | `true` to use classifier for source selection |
