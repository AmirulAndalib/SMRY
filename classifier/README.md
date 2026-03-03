# Article Extraction Classifier

XGBoost classifier that evaluates HTML extraction quality. Used by the SMRY article pipeline to decide which source (smry-fast, wayback, diffbot) produced the best extraction.

## How It Works

Every HTML extraction goes through the XGBoost model — no pre-filtering rules. The model classifies content into one of 7 classes, mapped to 5 pipeline tiers:

| Model Label | Pipeline Label | Tier |
|------------|---------------|------|
| `bypassed_article` | `full_article_extracted` | 0 (best) |
| `partial_bypass` | `partial_article_extracted` | 1 |
| `hard_paywall` | `partial_article_extracted` | 1 |
| `paywall_active` | `partial_article_extracted` | 1 |
| `api_error` | `api_provider_error` | 3 |
| `content_unavailable` | `other_failure` | 2 |
| `not_article` | `full_page_not_article` | 4 |

The pipeline then selects the winner: best tier > longest article > highest confidence.

## Model

| Property | Value |
|----------|-------|
| Source | [Allanatrix/Summary_model](https://huggingface.co/Allanatrix/Summary_model) |
| Algorithm | XGBoost Booster (multi:softmax, 92 boosted rounds) |
| Accuracy | ~85% on test set |
| Inference | <17ms per classification |
| Features | 27 (HTML structure, keyword counts, tag densities, URL patterns) |
| File | `XGBOOST.pt` (1.3MB, joblib-serialized, XGBoost 2.1.3) |

### Features (27)

```text
length_chars, prefix_len, text_to_html_ratio, ws_ratio, digit_ratio, alpha_ratio,
paywall_kw, auth_required_kw, blocked_kw, error_kw, article_kw, meta_article, nav_kw,
n_p, n_a, n_h1, n_h2, n_article, n_main, n_form, n_input, n_button,
link_density, para_density, form_density, url_has_auth, url_is_platform
```

See `model.py:extract_features()` for the full extraction logic.

### File Format

The `XGBOOST.pt` file is a **joblib-serialized** dict. Load with `joblib.load()`:

```python
import joblib

artifacts = joblib.load("XGBOOST.pt")
# Keys: model, scaler, label_to_id, id_to_label, features, version, model_type, accuracy
```

## API Endpoints

### POST /classify

Classify a single HTML extraction.

```bash
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"html": "<html>...</html>", "url": "https://example.com/article"}'
```

Response:
```json
{
  "outcome": "full_article_extracted",
  "confidence": 0.44,
  "method": "model",
  "latency_us": 16000
}
```

### POST /classify/batch

Classify multiple extractions in one request.

### GET /health

```json
{"status": "ok", "model": {"loaded": true, "features": 27, ...}}
```

Returns 503 with `{"status": "degraded"}` if model failed to load.

## Running Locally

### Quick Start (recommended)

From the project root, `bun dev` starts everything (classifier + API + Next.js):

```bash
bun dev
# Classifier: http://localhost:8000
# API:        http://localhost:3001
# App:        http://localhost:3000
```

### Standalone

```bash
# Docker
bun run classifier:build
bun run classifier:dev

# Or Python venv (requires Python 3.11+)
cd classifier
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Verify

```bash
bun run classifier:health
# → {"status":"ok","model":{"loaded":true,"features":27,...}}
```

## Deployment (Railway CLI)

Deploy directly from your machine. No GitHub connection needed.

```bash
# Install and login
brew install railway
railway login

# Link to your Railway project
cd /path/to/SMRY
railway link

# Deploy classifier
railway up --service classifier -d ./classifier

# Set port
railway vars set PORT=8000 --service classifier

# Wire into main app
railway vars set \
  CLASSIFIER_URL=http://classifier.railway.internal:8000 \
  CLASSIFIER_ENABLED=true \
  --service <your-main-app-service-name>

# Verify
railway logs --service classifier
```

Rollback: set `CLASSIFIER_ENABLED=false` (env var change, no redeploy needed).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLASSIFIER_URL` | No | `http://localhost:8000` | Classifier service URL |
| `CLASSIFIER_ENABLED` | No | `false` | Set `true` to use classifier for source selection |
