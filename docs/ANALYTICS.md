# PostHog Analytics — SMRY

Complete reference for all analytics events, setup, and dashboards.

**Last updated: March 2026** (lean implementation — 9 custom events + heatmaps, client-side only)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Client (Browser)                                                │
│                                                                  │
│  posthog-js SDK (lean config)                                    │
│  ├── Heatmaps (click positions, scroll depth)                    │
│  └── 9 Custom Events (track() via useAnalytics hook)             │
│                                                                  │
│  DISABLED: $pageview, $pageleave, autocapture, session recording │
│  Visitor tracking handled by DataBuddy (separate tool)           │
├──────────────────────────────────────────────────────────────────┤
│  Ad Click Tracking (component-level)                             │
│                                                                  │
│  GravityAd component (components/ads/gravity-ad.tsx):            │
│  └── PostHog track("ad_click") with placement + ad_provider      │
│      Fires on every click, regardless of parent wiring.          │
│                                                                  │
│  fireClick() in useGravityAd hook (separate concern):            │
│  └── /api/px (sendBeacon) → server billing logs only             │
├──────────────────────────────────────────────────────────────────┤
│  Ad Impression Billing (NOT in PostHog)                          │
│                                                                  │
│  fireImpression() in useGravityAd hook:                          │
│  ├── Gravity ads → /api/px → server forwards impUrl pixel        │
│  └── ZeroClick ads → client POST to zeroclick.dev/api/v2         │
├──────────────────────────────────────────────────────────────────┤
│  Server (Elysia / Bun)                                           │
│                                                                  │
│  NO PostHog SDK — all server analytics use structured            │
│  logging (Pino). posthog-node is NOT installed.                  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `components/providers/posthog-provider.tsx` | SDK init, heatmaps enabled |
| `lib/hooks/use-analytics.ts` | Client hook: `track()`, `trackArticle()` |
| `components/ads/gravity-ad.tsx` | `ad_click` — tracks on every click with `placement` + `ad_provider` |
| `lib/hooks/use-gravity-ad.ts` | `fireClick()` → `/api/px` server billing only (no PostHog) |
| `components/features/proxy-content.tsx` | `article_loaded`, `article_error`, `tts_requested`, `view_mode_changed` |
| `components/features/article-chat.tsx` | `chat_message_sent` |
| `components/features/share-button.tsx` | `article_shared` |
| `components/features/highlight-toolbar.tsx` | `highlight_created` |
| `components/shared/mode-toggle.tsx` | `theme_changed` |
| `components/features/floating-toolbar.tsx` | `view_mode_changed` |

---

## Environment Variables

Client-side (required):

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...   # Project API key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Server-side (optional — kept for future use, not actively used):

```bash
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://us.i.posthog.com
```

> See [docs/POSTHOG_SETUP.md](POSTHOG_SETUP.md) for full setup guide.

---

## Client SDK Configuration

Initialized in `components/providers/posthog-provider.tsx`:

| Feature | Setting | Why |
|---------|---------|-----|
| Pageview | `capture_pageview: false` | DataBuddy handles visitor tracking |
| Page leave | `capture_pageleave: false` | DataBuddy handles exit tracking |
| Autocapture | `false` | Would generate ~80% of all events |
| Session Recording | `disabled` | Massive event volume |
| Heatmaps | `true` | Understand where users spend time |
| Person profiles | `identified_only` | Only creates profiles for logged-in users |
| DNT | `respect_dnt: true` | Honors Do Not Track header |

---

## All Custom Events (9 total)

```typescript
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
  | "view_mode_changed";   // user switches reader/original/iframe (also fires on article load for default)
```

Every event is automatically enriched with: `is_premium`, `device_type`, `locale`.

`article_loaded` also includes `view_mode` (markdown/html/iframe) for per-article view tracking.

---

## Event Reference

### Core — `article_loaded`

The most important event. Carries all the data for hostname reliability, source tracking, classification, and latency.

| Property | Type | Description |
|----------|------|-------------|
| `source` | string | Winning source (`smry-fast`, `smry-slow`, `wayback`) |
| `article_title` | string | Article title |
| `article_url` | string | Full URL |
| `hostname` | string | Article domain (auto-extracted) |
| `classified` | boolean | Whether classifier ran |
| `classification_outcome` | string | e.g., `good`, `truncated`, `low_quality` |
| `classification_confidence` | number | 0-1 |
| `selection_reason` | string | `classifier_decided` / `single_source` / `fallback_length_reliability` |
| `sources_succeeded` | number | How many of the 3 sources returned content (0-3) |
| `sources_failed` | string | Comma-separated list of failed sources (e.g., `"smry-slow,wayback"`). Empty string means no failures. |
| `fetch_ms` | number | Total fetch time in ms (all 3 sources, parallel) |

### Core — `article_error`

| Property | Type | Description |
|----------|------|-------------|
| `error_name` | string | Error type |
| `article_url` | string | Full URL |
| `hostname` | string | Article domain |

Fires when ALL sources fail for a URL.

### Revenue — `ad_click`

| Property | Type | Description |
|----------|------|-------------|
| `placement` | string | UI slot — snake_case (see placements below) |
| `ad_provider` | string | `zeroclick` or `gravity` |

Tracked at the **component level** in `components/ads/gravity-ad.tsx`. The `GravityAd` component receives a required `placement` prop and fires `track("ad_click", { placement, ad_provider })` on every click via `useAnalytics()`. This guarantees every click is tracked regardless of how parents wire `onClick` callbacks.

`fireClick()` in `lib/hooks/use-gravity-ad.ts` is a separate concern — it sends a beacon to `/api/px` for server-side billing logs only (no PostHog).

`ad_impression` is NOT tracked in PostHog — impression billing is handled directly by Gravity/ZeroClick SDKs via `fireImpression()`. Only clicks matter for placement optimization.

**Ad Placements** (snake_case per PostHog convention):

| Placement | Location |
|-----------|----------|
| `homepage` | Landing page |
| `article_inline` | Mid-article |
| `article_footer` | End of article |
| `article_sidebar` | Desktop right sidebar |
| `chat_top` | Above chat messages (desktop) |
| `chat_middle` | Between chat messages (desktop) |
| `chat_input` | Above prompt input (desktop) |
| `mobile_article_bottom` | Fixed bottom bar on mobile article |
| `mobile_chat_top` | Chat header on mobile |
| `mobile_chat_middle` | Between chat messages on mobile |

### Feature Adoption

| Event | Trigger | Key Properties |
|-------|---------|----------------|
| `chat_message_sent` | User sends chat message | `message_length`, `language` |
| `article_shared` | Any share action | `method`: `copy_link` / `native` / `x_twitter` / `linkedin` / `reddit` |
| `highlight_created` | Text highlighted | `text_length`, `color` |
| `tts_requested` | TTS load button | `voice`, `article_url` |
| `theme_changed` | User switches theme | `theme` (e.g., `light`, `dark`, `magic-blue`) |
| `view_mode_changed` | Article load + user switches view mode | `view_mode` (`markdown` / `html` / `iframe`) |

---

## Event Volume & Cost (30K DAU)

9 custom events + heatmaps (no $pageview, no $pageleave, no ad_impression):

| Event | Est. per session | Daily (30K DAU, 1.5 sessions) |
|-------|-----------------|-------------------------------|
| `article_loaded` | 1 | 45,000 |
| `article_error` | 0.05 | 2,250 |
| `ad_click` | 0.05 | 2,250 |
| Feature events (6) | 0.3 | 13,500 |
| Heatmap data | ~1-2 | ~67,500 |
| **Total** | **~3** | **~126,000/day** |

**Monthly: ~3.8M events**

| Scale | Monthly events | Monthly cost |
|-------|---------------|-------------|
| 1K DAU | ~126K | **Free** |
| 10K DAU | ~1.26M | **$13** |
| 30K DAU | ~3.8M | **$140** |
| 50K DAU | ~6.3M | **$265** |

PostHog pricing: 1M free/month, then $0.00005/event.

**Budget safe at 30K DAU: ~$140/month** (well under $400 limit).

### What saves the most money

| Removed | Daily savings (30K DAU) | Monthly savings |
|---------|------------------------|----------------|
| `$pageview` | ~112,500 | ~$169 |
| `$pageleave` | ~45,000 | ~$67 |
| `ad_impression` | ~112,500 | ~$169 |
| Server-side events | ~200,000+ | ~$300+ |
| Autocapture | ~500,000+ | ~$750+ |
| **Total saved** | **~970,000/day** | **~$1,450/month** |

---

## Source Reliability Tracking

The article extraction pipeline fetches from 3 sources in parallel:
1. **smry-fast** — Cloudflare-based extractor
2. **wayback** — Wayback Machine / archive.org
3. **smry-slow** — Diffbot-based extractor

Each `article_loaded` event includes:
- `sources_succeeded` — count of sources that returned content
- `sources_failed` — comma-separated string of source names that failed (empty string = none)
- `fetch_ms` — total fetch time (all sources, parallel)
- `hostname` — article domain (for per-site breakdown)

This enables the **Top Sites Dashboard** (see POSTHOG_DASHBOARD_SETUP.md).

---

## What's Tracked Where

| Metric | Tool | Why |
|--------|------|-----|
| Visitors, pageviews, bounce rate | **DataBuddy** | Free, already set up |
| Feature usage, ad clicks, source reliability | **PostHog** | Custom events with properties |
| Heatmaps (click positions, scroll depth) | **PostHog** | Needs JS SDK integration |
| Server performance, errors, classification | **Pino logs** | Zero cost, in Railway logs |
| Ad impression billing | **Gravity/ZeroClick SDK** | Direct to provider (not PostHog) |

---

## Adding a New Event

1. Add event name to `AnalyticsEvent` type in `lib/hooks/use-analytics.ts`
2. Call `track("event_name", { ...props })` or `trackArticle("event_name", url, { ...props })`
3. Update this doc

```tsx
import { useAnalytics } from "@/lib/hooks/use-analytics";

function MyComponent() {
  const { track } = useAnalytics();

  const handleAction = () => {
    track("my_event", { some_prop: "value" });
  };
}
```

**For ad events:** `ad_click` is tracked automatically by the `GravityAd` component — do NOT call `track("ad_click")` anywhere else. Each `<GravityAd>` receives a `placement` prop that determines the PostHog placement value. `fireClick()` from `useGravityAd` is for server billing only (`/api/px`) and does NOT fire PostHog events.

---

## Debugging

### Check if events are sending
1. Open browser DevTools -> Network tab
2. Filter by `posthog` or `i.posthog.com`
3. You should see batch requests every few seconds

### Common issues
- **No events in PostHog:** Check `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` env vars
- **No user identification:** Check Clerk is loaded before PostHog identify runs
- **Missing source data:** `sources` and `fetch_ms` only appear on `/article/auto` responses
- **No heatmaps:** Check `enable_heatmaps: true` in provider, visit Heatmaps in PostHog sidebar

---

## What Was Removed (March 2026)

Previously caused ~250k events/day. All removed:

- **Server-side PostHog SDK** (`posthog-node`) — replaced by Pino structured logging
- **`$pageview`** — DataBuddy handles visitor tracking
- **`$pageleave`** — DataBuddy handles exit tracking
- **`ad_impression`** — impression billing handled by Gravity/ZeroClick SDKs directly
- **`trackEvent()`** — fired on every API request
- **`trackAdEvent()`** — fired on every ad request/impression
- **`trackLLMGeneration()`** — fired on every chat message
- **`markFeatureUsed()`** — duplicated existing feature events
- **Autocapture** — tracked every click, form submit, link click
- **Session recording** — recorded every session
- **`article_submitted`** — redundant with `article_loaded` + `article_error` (every submit leads to one or the other)
- **`highlights_exported`** — `highlight_created` already tracks adoption; export is a secondary action
- **`toolbar_click`** — low-signal vanity data (clicking a button ≠ using a feature); actual outcomes already tracked by `tts_requested`, `theme_changed`, `view_mode_changed`
- **`annotation_action`** — `highlight_created` already tracks adoption; edit/delete/export are secondary actions
- Events removed: `url_validation_error`, `chat_opened`, `settings_opened`, `chat_suggestion_clicked`, `chat_message_copied`, `chat_cleared`, `setting_changed`, `ad_loaded`, `tts_played`, `tts_paused`, `tts_voice_changed`, `feature_used`
