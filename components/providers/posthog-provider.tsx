"use client";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // PostHog disabled
  return <>{children}</>;
}
