/**
 * HTTP client for the Python article classifier service.
 *
 * Classifies HTML extraction outcomes into:
 *   full_article_extracted | partial_article_extracted |
 *   api_provider_error | other_failure | full_page_not_article
 *
 * Falls back gracefully when the classifier service is unavailable.
 */

const CLASSIFIER_URL = process.env.CLASSIFIER_URL || "http://localhost:8000";
const CLASSIFIER_TIMEOUT_MS = 3000;

export interface ClassificationResult {
  outcome:
    | "full_article_extracted"
    | "partial_article_extracted"
    | "api_provider_error"
    | "other_failure"
    | "full_page_not_article";
  confidence: number;
  method: "rule" | "model";
  latency_us: number;
}

export async function classifyHtml(
  html: string,
): Promise<ClassificationResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);
    const response = await fetch(`${CLASSIFIER_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: html.slice(0, 64000) }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return (await response.json()) as ClassificationResult;
  } catch {
    return null; // Classifier unavailable — fall back to old logic
  }
}

export async function classifyBatch(
  items: Array<{ html: string; source: string }>,
): Promise<Array<ClassificationResult | null>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);
    const response = await fetch(`${CLASSIFIER_URL}/classify/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          html: i.html.slice(0, 64000),
          source: i.source,
        })),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return items.map(() => null);
    return (await response.json()) as ClassificationResult[];
  } catch {
    return items.map(() => null);
  }
}
