"use client";

import { useCallback, useEffect, useRef } from "react";
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
  | "tts_requested"
  | "theme_changed"        // user switches theme
  | "view_mode_changed";   // user switches reader/original/iframe

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

  // Ref ensures track() always reads the LATEST isPremium at call time,
  // not the stale value captured when the useCallback closure was created.
  // Without this, article_loaded (which fires before auth loads) always sends is_premium: false.
  const isPremiumRef = useRef(isPremium);
  useEffect(() => {
    isPremiumRef.current = isPremium;
  }, [isPremium]);

  const track = useCallback(
    (event: AnalyticsEvent, props?: Record<string, unknown>) => {
      if (!posthog) return;
      try {
        posthog.capture(event, {
          is_premium: isPremiumRef.current,
          device_type: getDeviceType(),
          locale: typeof navigator !== "undefined" ? navigator.language : undefined,
          ...props,
        });
      } catch {
        // Analytics should never crash the app
      }
    },
    [posthog],
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
