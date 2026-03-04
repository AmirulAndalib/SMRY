import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Server-only environment variables for smry-api.
 * This is separate from lib/env.ts because the backend doesn't need
 * NEXT_PUBLIC_* variables, and @t3-oss/env-nextjs requires them.
 */
export const env = createEnv({
  server: {
    // Auth
    CLERK_SECRET_KEY: z.string().min(1),
    // Optional: PEM public key from Clerk Dashboard for networkless JWT verification.
    // Eliminates JWKS fetch failures and kid mismatch issues from key rotation.
    // Set via Clerk Dashboard > API Keys > Show JWT Public Key.
    CLERK_JWT_KEY: z.string().optional(),

    // AI/API
    OPENROUTER_API_KEY: z.string().min(1),
    DIFFBOT_API_KEY: z.string().min(1),

    // Cache
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // Analytics (PostHog) — not used server-side currently, kept for future use
    POSTHOG_API_KEY: z.string().optional(),
    POSTHOG_HOST: z.string().url().optional(),

    // Gravity Ads
    GRAVITY_API_KEY: z.string().min(1),

    // ZeroClick Ads (fallback provider)
    ZEROCLICK_API_KEY: z.string().min(1),
    // Kill switch to disable ZeroClick waterfall (for revenue testing)
    ZEROCLICK_DISABLED: z.string().optional().transform(v => v === "true"),

    // Email (inbound.new)
    INBOUND_API_KEY: z.string().min(1),
    INBOUND_WEBHOOK_TOKEN: z.string().optional(),

    // Clerk Webhooks
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    // Server config
    CORS_ORIGIN: z.string().min(1),
    API_PORT: z.coerce.number().default(Number(process.env.PORT) || 3001),
    MAX_CONCURRENT_ARTICLE_FETCHES: z.coerce.number().default(75),
    ARTICLE_FETCH_SLOT_TIMEOUT_MS: z.coerce.number().default(30000),
    // Inworld AI TTS (optional — TTS disabled when absent)
    INWORLD_API_KEY: z.string().min(1).optional(),

    // Article Classifier service (optional — falls back to >500 chars heuristic)
    CLASSIFIER_URL: z.string().url().optional(),
    CLASSIFIER_ENABLED: z.string().optional().transform(v => v === "true"),

    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("warn"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
