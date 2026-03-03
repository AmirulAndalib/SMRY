"""
Article Extraction Classifier — model loading, feature extraction, prediction.

Uses the Allanatrix/Summary_model XGBoost classifier to classify HTML extraction
outcomes. The model file (XGBOOST.pt) is a joblib-serialized dict containing:
  - model: xgboost.core.Booster (multi:softmax, 7 classes)
  - scaler: sklearn StandardScaler (27 features)
  - id_to_label / label_to_id: class mappings
  - features: ordered feature name list

Model labels (7):
  api_error, bypassed_article, content_unavailable, hard_paywall,
  not_article, partial_bypass, paywall_active

Pipeline labels (5) — mapped from model labels:
  full_article_extracted, partial_article_extracted,
  api_provider_error, other_failure, full_page_not_article
"""

import os
import re
import time
import joblib
import numpy as np
import xgboost
from pydantic import BaseModel

# Feature column order — must match model's training features
FEATURE_COLS = [
    "length_chars", "prefix_len", "text_to_html_ratio", "ws_ratio",
    "digit_ratio", "alpha_ratio", "paywall_kw", "auth_required_kw",
    "blocked_kw", "error_kw", "article_kw", "meta_article", "nav_kw",
    "n_p", "n_a", "n_h1", "n_h2", "n_article", "n_main",
    "n_form", "n_input", "n_button",
    "link_density", "para_density", "form_density",
    "url_has_auth", "url_is_platform",
]

# Map model's 7 labels → pipeline's 5 labels
LABEL_MAP = {
    "bypassed_article": "full_article_extracted",
    "partial_bypass": "partial_article_extracted",
    "hard_paywall": "partial_article_extracted",
    "paywall_active": "partial_article_extracted",
    "api_error": "api_provider_error",
    "content_unavailable": "other_failure",
    "not_article": "full_page_not_article",
}

# Auth URL patterns (for url_has_auth feature)
_AUTH_PATTERNS = re.compile(
    r"/(login|signin|sign-in|auth|register|signup|sign-up|account|sso|oauth)",
    re.IGNORECASE,
)

def _strip_tags(html: str) -> str:
    """Strip HTML tags in O(n) without regex (ReDoS-safe)."""
    out: list[str] = []
    in_tag = False
    for ch in html:
        if ch == "<":
            in_tag = True
        elif ch == ">":
            in_tag = False
        elif not in_tag:
            out.append(ch)
    return "".join(out)

# ---------------------------------------------------------------------------
# Model artifacts (loaded once on startup)
# ---------------------------------------------------------------------------

_scaler = None
_model = None
_id_to_label: dict[int, str] = {}
_model_loaded = False


def load_model(path: str = "XGBOOST.pt") -> None:
    global _scaler, _model, _id_to_label, _model_loaded

    # Suppress XGBoost deprecation warning about older model format
    prev_verbosity = os.environ.get("XGBOOST_VERBOSITY")
    os.environ["XGBOOST_VERBOSITY"] = "0"
    try:
        artifacts = joblib.load(path)
    finally:
        if prev_verbosity is None:
            os.environ.pop("XGBOOST_VERBOSITY", None)
        else:
            os.environ["XGBOOST_VERBOSITY"] = prev_verbosity

    # Validate feature order matches model's training features
    model_features = artifacts.get("features", [])
    if model_features and model_features != FEATURE_COLS:
        raise ValueError(
            f"Feature mismatch! Model expects {model_features}, "
            f"but FEATURE_COLS has {FEATURE_COLS}"
        )

    _scaler = artifacts["scaler"]
    _model = artifacts["model"]
    _id_to_label = artifacts["id_to_label"]

    # Validate scaler dimensions match feature count
    if hasattr(_scaler, "n_features_in_") and _scaler.n_features_in_ != len(FEATURE_COLS):
        raise ValueError(
            f"Scaler expects {_scaler.n_features_in_} features, "
            f"but FEATURE_COLS has {len(FEATURE_COLS)}"
        )

    _model_loaded = True


def get_model_info() -> dict:
    return {
        "loaded": _model_loaded,
        "features": len(FEATURE_COLS),
        "labels": [LABEL_MAP.get(v, v) for v in _id_to_label.values()] if _id_to_label else [],
        "raw_labels": list(_id_to_label.values()) if _id_to_label else [],
    }


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

def extract_features(html: str, url: str = "", max_chars: int = 64000) -> dict:
    prefix = html[:max_chars].lower()
    prefix_len = len(prefix)

    # Text extraction for text_to_html_ratio
    text_only = _strip_tags(prefix).strip()
    text_len = len(text_only)

    features = {
        "length_chars": len(html),
        "prefix_len": prefix_len,
        "text_to_html_ratio": text_len / prefix_len if prefix_len else 0,
        "ws_ratio": sum(c.isspace() for c in prefix) / prefix_len if prefix_len else 0,
        "digit_ratio": sum(c.isdigit() for c in prefix) / prefix_len if prefix_len else 0,
        "alpha_ratio": sum(c.isalpha() for c in prefix) / prefix_len if prefix_len else 0,
        # Keyword counts
        "paywall_kw": (
            prefix.count("paywall") + prefix.count("subscribe")
            + prefix.count("subscription") + prefix.count("premium")
            + prefix.count("member")
        ),
        "auth_required_kw": (
            prefix.count("sign in") + prefix.count("log in")
            + prefix.count("login") + prefix.count("register")
            + prefix.count("create account")
        ),
        "blocked_kw": (
            prefix.count("access denied") + prefix.count("403")
            + prefix.count("blocked") + prefix.count("restricted")
            + prefix.count("unavailable")
        ),
        "error_kw": (
            prefix.count("error") + prefix.count("timeout")
            + prefix.count("rate limit") + prefix.count("500")
            + prefix.count("404")
        ),
        "article_kw": (
            prefix.count("published") + prefix.count("author")
            + prefix.count("reading time") + prefix.count("article")
        ),
        "meta_article": (
            prefix.count("og:article") + prefix.count("article:published")
            + prefix.count("article:author")
        ),
        "nav_kw": (
            prefix.count("home") + prefix.count("menu")
            + prefix.count("navigation") + prefix.count("sidebar")
        ),
        # Tag counts
        "n_p": prefix.count("<p"),
        "n_a": prefix.count("<a"),
        "n_h1": prefix.count("<h1"),
        "n_h2": prefix.count("<h2"),
        "n_article": prefix.count("<article"),
        "n_main": prefix.count("<main"),
        "n_form": prefix.count("<form"),
        "n_input": prefix.count("<input"),
        "n_button": prefix.count("<button"),
    }

    # Density features
    kb = prefix_len / 1000.0
    features["link_density"] = features["n_a"] / kb if kb > 0 else 0
    features["para_density"] = features["n_p"] / kb if kb > 0 else 0
    features["form_density"] = features["n_form"] / kb if kb > 0 else 0

    # URL features
    features["url_has_auth"] = 1.0 if (url and _AUTH_PATTERNS.search(url)) else 0.0
    # url_is_platform: always 0.0 — we don't know which sites the model considers
    # "platforms". The model still works without this signal.
    features["url_is_platform"] = 0.0

    return features


# ---------------------------------------------------------------------------
# Post-model validation rules
# ---------------------------------------------------------------------------

def apply_post_rules(label: str, confidence: float, features: dict) -> tuple[str, float]:
    """Adjust model prediction when feature signals strongly contradict it."""

    # Model says full article, but heavy paywall signals → downgrade to partial
    if label == "full_article_extracted" and features["paywall_kw"] >= 5 and features["n_form"] >= 1:
        return "partial_article_extracted", confidence * 0.8

    # Model says full article, but it's a nav page (link-heavy, no paragraphs)
    if label == "full_article_extracted" and features["nav_kw"] >= 5 and features["n_p"] < 5 and features["link_density"] > 20:
        return "full_page_not_article", confidence * 0.7

    return label, confidence


# ---------------------------------------------------------------------------
# Classification response
# ---------------------------------------------------------------------------

class ClassifyResponse(BaseModel):
    outcome: str
    confidence: float
    method: str  # "model" | "fallback"
    latency_us: int


# ---------------------------------------------------------------------------
# Main classification entry point
# ---------------------------------------------------------------------------

def classify_html(html: str, url: str = "") -> ClassifyResponse:
    start = time.monotonic()

    features = extract_features(html, url=url)

    # Model unavailable — use length/feature heuristic as fallback
    if not _model_loaded:
        label = "other_failure"
        if features["n_p"] >= 5 and features["text_to_html_ratio"] > 0.3:
            label = "full_article_extracted"
        elif features["paywall_kw"] >= 3:
            label = "partial_article_extracted"
        elapsed_us = int((time.monotonic() - start) * 1_000_000)
        return ClassifyResponse(
            outcome=label,
            confidence=0.0,
            method="fallback",
            latency_us=elapsed_us,
        )

    # Always run the ML model — no pre-filtering
    X = np.array([features[col] for col in FEATURE_COLS]).reshape(1, -1).astype(np.float32)
    X_scaled = _scaler.transform(X)
    dmatrix = xgboost.DMatrix(X_scaled)

    # Single inference call — derive both prediction and confidence from margins
    margins = _model.predict(dmatrix, output_margin=True)
    logits = margins[0] if margins.ndim == 2 else margins
    exp_logits = np.exp(logits - logits.max())
    probs = exp_logits / exp_logits.sum()

    prediction = int(np.argmax(probs))
    raw_label = _id_to_label.get(prediction, "content_unavailable")
    label = LABEL_MAP.get(raw_label, "other_failure")
    confidence = float(probs.max())

    # Post-model corrections — only override when features strongly contradict
    label, confidence = apply_post_rules(label, confidence, features)

    elapsed_us = int((time.monotonic() - start) * 1_000_000)
    return ClassifyResponse(
        outcome=label,
        confidence=confidence,
        method="model",
        latency_us=elapsed_us,
    )
