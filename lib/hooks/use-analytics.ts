"use client";

import { useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import { useIsPremium } from "./use-is-premium";

// Tracked events — only high-value, decision-driving analytics.
// ~10 events vs the previous ~20 — cuts event volume roughly in half.
export type AnalyticsEvent =
  // Core value
  | "article_loaded"       // enriched with classification + source reliability + latency
  | "article_error"
  // Revenue
  | "ad_click"
  // Feature adoption
  | "chat_message_sent"
  | "article_shared"
  | "highlight_created"
  | "tts_requested";

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/**
 * Shared analytics hook wrapping PostHog with auto-enrichment.
 *
 * Usage:
 *   const { track, trackArticle } = useAnalytics();
 *   track("article_shared", { method: "copy_link" });
 *   trackArticle("article_loaded", articleUrl, { source: "smry-fast" });
 */
export function useAnalytics() {
  const posthog = usePostHog();
  const { isPremium } = useIsPremium();

  const track = useCallback(
    (event: AnalyticsEvent, props?: Record<string, unknown>) => {
      if (!posthog) return;
      try {
        posthog.capture(event, {
          is_premium: isPremium,
          device_type: getDeviceType(),
          locale: typeof navigator !== "undefined" ? navigator.language : undefined,
          ...props,
        });
      } catch {
        // Analytics should never crash the app
      }
    },
    [posthog, isPremium],
  );

  const trackArticle = useCallback(
    (event: AnalyticsEvent, articleUrl: string, props?: Record<string, unknown>) => {
      try {
        const hostname = new URL(articleUrl).hostname;
        track(event, { article_url: articleUrl, hostname, ...props });
      } catch {
        track(event, { article_url: articleUrl, ...props });
      }
    },
    [track],
  );

  return { track, trackArticle };
}
