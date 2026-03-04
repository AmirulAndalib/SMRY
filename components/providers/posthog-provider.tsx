"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";
import { useEffect } from "react";

/**
 * Lean PostHog setup — custom events + heatmaps only.
 *
 * Visitor tracking (pageviews, exits) handled by DataBuddy.
 *
 * Disabled:
 *   - $pageview / $pageleave (DataBuddy handles this)
 *   - autocapture (clicks, inputs, forms)
 *   - session recording
 *
 * Enabled:
 *   - heatmaps (understand where users spend time)
 *   - 7 custom events via useAnalytics hook
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (posthog.__loaded) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      enable_heatmaps: true,
      person_profiles: "identified_only",
      respect_dnt: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.debug();
        }
      },
    });
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
