"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
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
 *   - 9 custom events via useAnalytics hook
 */
function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host || typeof window === "undefined") return;
  if (posthog.__loaded) return;

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    enable_heatmaps: true,
    person_profiles: "identified_only",
    respect_dnt: true,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}
