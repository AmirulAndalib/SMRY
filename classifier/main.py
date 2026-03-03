"""
SMRY Article Classifier — FastAPI microservice.

Classifies HTML extraction outcomes using the Allanatrix/Summary_model XGBoost classifier.
Endpoints: /classify, /classify/batch, /health
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from model import classify_html, get_model_info, load_model

logger = logging.getLogger("classifier")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model artifacts on startup (XGBOOST.pt bundled in the image)
    try:
        load_model("XGBOOST.pt")
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error("Failed to load model: %s — running in degraded mode", e)
    yield


app = FastAPI(title="SMRY Article Classifier", lifespan=lifespan)


class ClassifyRequest(BaseModel):
    html: str  # Raw HTML string (first 64KB used)
    source: str = ""  # Optional: which extraction source
    url: str = ""  # Optional: for logging


class ClassifyResponse(BaseModel):
    outcome: str  # full_article_extracted | partial_article_extracted | etc.
    confidence: float  # 0-1
    method: str  # "model" | "fallback"
    latency_us: int  # Microseconds for classification


@app.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest) -> ClassifyResponse:
    result = classify_html(req.html, url=req.url)
    return ClassifyResponse(
        outcome=result.outcome,
        confidence=result.confidence,
        method=result.method,
        latency_us=result.latency_us,
    )


@app.get("/health")
async def health():
    info = get_model_info()
    if not info["loaded"]:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "model": info},
        )
    return {"status": "ok", "model": info}


class BatchClassifyRequest(BaseModel):
    items: list[ClassifyRequest]


@app.post("/classify/batch", response_model=list[ClassifyResponse])
async def classify_batch(req: BatchClassifyRequest) -> list[ClassifyResponse]:
    results = []
    for item in req.items:
        r = classify_html(item.html, url=item.url)
        results.append(
            ClassifyResponse(
                outcome=r.outcome,
                confidence=r.confidence,
                method=r.method,
                latency_us=r.latency_us,
            )
        )
    return results
