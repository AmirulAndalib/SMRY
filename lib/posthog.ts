/**
 * PostHog types — server-side tracking removed.
 *
 * All server-side analytics are handled by structured logging (Pino).
 * Client-side analytics use posthog-js directly via PostHogProvider.
 */

export type ErrorSeverity = "expected" | "degraded" | "unexpected" | "";
