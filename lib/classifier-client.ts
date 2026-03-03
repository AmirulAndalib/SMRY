/**
 * HTTP client for the Python article classifier service.
 *
 * Classifies HTML extraction outcomes into:
 *   full_article_extracted | partial_article_extracted |
 *   api_provider_error | other_failure | full_page_not_article
 *
 * Falls back gracefully when the classifier service is unavailable.
 */

import { env } from "../server/env";

const CLASSIFIER_URL = env.CLASSIFIER_URL || "http://localhost:8000";
const CLASSIFIER_TIMEOUT_MS = 3000;

export interface ClassificationResult {
  outcome:
    | "full_article_extracted"
    | "partial_article_extracted"
    | "api_provider_error"
    | "other_failure"
    | "full_page_not_article";
  confidence: number;
  method: "model" | "fallback";
  latency_us: number;
}

export async function classifyHtml(
  html: string,
  url?: string,
): Promise<ClassificationResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);
  try {
    const response = await fetch(`${CLASSIFIER_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: html.slice(0, 64000), url }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as ClassificationResult;
  } catch {
    return null; // Classifier unavailable — fall back to old logic
  } finally {
    clearTimeout(timeout);
  }
}
