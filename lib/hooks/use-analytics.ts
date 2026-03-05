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
 *   const { track, trackArticle, trackViaBeacon } = useAnalytics();
 *   track("article_shared", { method: "copy_link" });
 *   trackViaBeacon("ad_click", { placement: "homepage" }); // guaranteed delivery
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

  // Send event via navigator.sendBeacon directly to PostHog's capture API.
  // Unlike posthog.capture() which batches events and can lose them when the
  // browser navigates away (e.g. clicking an ad link), sendBeacon is guaranteed
  // to deliver even during page unload/navigation.
  const trackViaBeacon = useCallback(
    (event: AnalyticsEvent, props?: Record<string, unknown>) => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

        if (!apiKey || typeof navigator === "undefined" || !navigator.sendBeacon) {
          // Fallback to regular track if sendBeacon unavailable
          track(event, props);
          return;
        }

        const distinctId = posthog?.get_distinct_id?.() ?? "anonymous";
        const sessionId = posthog?.get_session_id?.() ?? undefined;

        const payload = JSON.stringify({
          api_key: apiKey,
          event,
          properties: {
            distinct_id: distinctId,
            $session_id: sessionId,
            is_premium: isPremiumRef.current,
            device_type: getDeviceType(),
            locale: navigator.language,
            ...props,
          },
          timestamp: new Date().toISOString(),
        });

        navigator.sendBeacon(
          `${apiHost}/capture/`,
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        // Fallback to regular track
        track(event, props);
      }
    },
    [posthog, track],
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

  return { track, trackArticle, trackViaBeacon };
}
