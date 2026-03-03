import { createHash } from "crypto";
import { PostHog } from "posthog-node";

/**
 * PostHog Analytics Client
 *
 * Server-side analytics client. PostHog handles batching,
 * retries, and connection management internally via its SDK.
 *
 * Env vars:
 *   POSTHOG_API_KEY          – project API key (server-side)
 *   POSTHOG_HOST             – PostHog instance URL
 */

/** One-way hash of IP — groups events by user without storing raw PII */
function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST;
  if (!apiKey || !host) return null;

  client = new PostHog(apiKey, {
    host,
    flushAt: 50,
    flushInterval: 5000,
  });
  return client;
}

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type ErrorSeverity = "expected" | "degraded" | "unexpected" | "";

export interface AnalyticsEvent {
  request_id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  path: string;
  url: string;
  hostname: string;
  source: string;
  outcome: string;
  status_code: number;
  error_type: string;
  error_message: string;
  error_severity: ErrorSeverity;
  upstream_hostname: string;
  upstream_status_code: number;
  upstream_error_code: string;
  upstream_message: string;
  duration_ms: number;
  fetch_ms: number;
  cache_lookup_ms: number;
  cache_save_ms: number;
  cache_hit: number;
  cache_status: string;
  article_length: number;
  article_title: string;
  summary_length: number;
  input_tokens: number;
  output_tokens: number;
  is_premium: number;
  client_ip: string;
  user_agent: string;
  heap_used_mb: number;
  heap_total_mb: number;
  rss_mb: number;
  env: string;
  version: string;
}

// ---------------------------------------------------------------------------
// Ad Event Types
// ---------------------------------------------------------------------------

export type AdEventStatus = "filled" | "no_fill" | "premium_user" | "gravity_error" | "timeout" | "error";
export type AdEventType = "request" | "impression" | "click" | "dismiss";

export interface AdEvent {
  event_id: string;
  timestamp: string;
  event_type: AdEventType;
  url: string;
  hostname: string;
  article_title: string;
  article_content_length: number;
  session_id: string;
  user_id: string;
  is_premium: number;
  device_type: string;
  os: string;
  browser: string;
  status: AdEventStatus;
  gravity_status_code: number;
  error_message: string;
  gravity_forwarded: number;
  brand_name: string;
  ad_title: string;
  ad_text: string;
  click_url: string;
  imp_url: string;
  cta: string;
  favicon: string;
  ad_count: number;
  duration_ms: number;
  env: string;
  placement: string;
  ad_index: number;
  ad_provider: string;
}

// ---------------------------------------------------------------------------
// trackEvent – captures request analytics
// ---------------------------------------------------------------------------

export function trackEvent(event: Partial<AnalyticsEvent>): void {
  const posthog = getClient();
  if (!posthog) return;

  // Hash client_ip for distinctId — groups requests by user without storing raw PII
  const distinctId = event.client_ip
    ? `user_${hashIP(event.client_ip)}`
    : event.request_id || `req_${crypto.randomUUID().slice(0, 8)}`;

  // Strip raw client_ip from properties before sending
  const { client_ip, ...safeProps } = event;

  posthog.capture({
    distinctId,
    event: "request_event",
    properties: {
      ...safeProps,
      // $ip is used by PostHog for geo resolution only (country, city) — not stored as a person property
      $ip: client_ip,
      timestamp: event.timestamp || new Date().toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// trackAdEvent – captures ad funnel analytics
// ---------------------------------------------------------------------------

export function trackAdEvent(event: Partial<AdEvent>): void {
  const posthog = getClient();
  if (!posthog) return;

  const eventId = event.event_id || crypto.randomUUID();
  const distinctId = event.session_id || eventId;

  posthog.capture({
    distinctId,
    event: "ad_event",
    properties: {
      ...event,
      event_id: eventId,
      timestamp: event.timestamp || new Date().toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// trackLLMGeneration – PostHog LLM analytics ($ai_generation events)
// See: https://posthog.com/docs/llm-analytics/start-here
// ---------------------------------------------------------------------------

export interface LLMGenerationEvent {
  distinctId: string;
  traceId: string;
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  input?: Array<{ role: string; content: string }>;
  outputContent?: string;
  isError?: boolean;
  errorMessage?: string;
  httpStatus?: number;
  isPremium?: boolean;
  language?: string;
  messageCount?: number;
}

export function trackLLMGeneration(event: LLMGenerationEvent): void {
  const posthog = getClient();
  if (!posthog) return;

  posthog.capture({
    distinctId: event.distinctId,
    event: "$ai_generation",
    properties: {
      $ai_trace_id: event.traceId,
      $ai_model: event.model,
      $ai_provider: event.provider,
      $ai_input_tokens: event.inputTokens,
      $ai_output_tokens: event.outputTokens,
      $ai_latency: event.latencyMs / 1000, // PostHog expects seconds
      $ai_is_error: event.isError ?? false,
      $ai_http_status: event.httpStatus ?? 200,
      ...(event.input && { $ai_input: event.input }),
      ...(event.outputContent && {
        $ai_output_choices: [{ role: "assistant", content: event.outputContent }],
      }),
      // Custom properties for SMRY-specific analysis
      is_premium: event.isPremium,
      language: event.language,
      message_count: event.messageCount,
    },
  });
}

// ---------------------------------------------------------------------------
// URL sanitization — strip query params and fragments to avoid leaking tokens
// ---------------------------------------------------------------------------

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// trackClassificationEvent – per-source classification (extraction_classified)
// ---------------------------------------------------------------------------

export interface ClassificationEventProps {
  url: string;
  hostname: string;
  source: string;
  request_id: string;
  classification: string;
  classification_confidence: number;
  classification_method: string;
  classification_latency_us: number;
  article_length: number;
}

export function trackClassificationEvent(props: ClassificationEventProps): void {
  const posthog = getClient();
  if (!posthog) return;

  posthog.capture({
    distinctId: props.request_id || `cls_${crypto.randomUUID().slice(0, 8)}`,
    event: "extraction_classified",
    properties: {
      ...props,
      url: sanitizeUrl(props.url),
      timestamp: new Date().toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// trackExtractionOutcome – per-request outcome (extraction_outcome)
// ---------------------------------------------------------------------------

export interface ExtractionOutcomeProps {
  url: string;
  hostname: string;
  request_id: string;
  winning_source: string;
  winning_classification: string;
  winning_confidence: number;
  selection_reason: string;
  smry_fast_classification: string | null;
  smry_fast_length: number;
  smry_slow_classification: string | null;
  smry_slow_length: number;
  wayback_classification: string | null;
  wayback_length: number;
  classifier_changed_result: boolean;
  old_logic_source: string | null;
  total_fetch_ms: number;
}

export function trackExtractionOutcome(props: ExtractionOutcomeProps): void {
  const posthog = getClient();
  if (!posthog) return;

  posthog.capture({
    distinctId: props.request_id || `out_${crypto.randomUUID().slice(0, 8)}`,
    event: "extraction_outcome",
    properties: {
      ...props,
      url: sanitizeUrl(props.url),
      timestamp: new Date().toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// getBufferStats – simplified (PostHog SDK manages its own buffer)
// ---------------------------------------------------------------------------

export function getBufferStats(): {
  size: number;
  maxSize: number;
  activeQueries: number;
  queuedQueries: number;
  maxConcurrentQueries: number;
} {
  return {
    size: 0,
    maxSize: 0,
    activeQueries: 0,
    queuedQueries: 0,
    maxConcurrentQueries: 0,
  };
}

// ---------------------------------------------------------------------------
// closePostHog – graceful shutdown
// ---------------------------------------------------------------------------

export async function closePostHog(): Promise<void> {
  if (client) {
    await client.shutdown();
    client = null;
  }
}

// Register shutdown handler
let isInitialized = false;
if (!isInitialized && typeof process !== "undefined") {
  isInitialized = true;
  process.on("beforeExit", async () => {
    await closePostHog();
  });
}
