# PostHog Dashboard Setup Guide

Complete step-by-step guide to set up your PostHog dashboard for SMRY.
This replaces the `/admin` endpoint — everything you need is in PostHog.

## Prerequisites

Make sure these 6 env vars are set in Railway production:

| Variable | Value | Where to find |
|----------|-------|---------------|
| `POSTHOG_API_KEY` | `phc_...` | Project Settings → Project API Key |
| `POSTHOG_HOST` | `https://us.i.posthog.com` | Your PostHog instance URL |
| `POSTHOG_PROJECT_ID` | numeric ID | Project Settings → Project ID |
| `POSTHOG_PERSONAL_API_KEY` | `phx_...` | Avatar → Personal API Keys → Create with "Query Read" scope |
| `NEXT_PUBLIC_POSTHOG_KEY` | same as `POSTHOG_API_KEY` | Same key, exposed to client |
| `NEXT_PUBLIC_POSTHOG_HOST` | same as `POSTHOG_HOST` | Same host, exposed to client |

After deploy, events appear within 30 seconds.

---

## Dashboard 1: SMRY Overview (daily check)

> Dashboards → New Dashboard → name: "SMRY Overview"

### Insight 1.1 — Daily Active Users (DAU)

1. **Insights → New Insight → Trends**
2. Event: `$pageview`
3. Aggregation: **Unique users**
4. Date range: **Last 30 days**
5. Display: **Line chart**
6. Save as: **"DAU"**

### Insight 1.2 — DAU/MAU Ratio (stickiness)

1. **Insights → New Insight → Stickiness**
2. Event: `$pageview`
3. Date range: **Last 30 days**
4. This shows how many days per month users return
5. Save as: **"User Stickiness"**

### Insight 1.3 — New vs Returning Users

1. **Insights → New Insight → Lifecycle**
2. Event: `$pageview`
3. Date range: **Last 30 days**
4. Shows: New / Returning / Resurrecting / Dormant automatically
5. Save as: **"User Lifecycle"**

### Insight 1.4 — Total Requests (server health)

1. **Insights → New Insight → Trends**
2. Event: `request_event`
3. Aggregation: **Total count**
4. Date range: **Last 7 days**
5. Display: **Line chart**
6. Save as: **"Total Requests"**

### Insight 1.5 — Success Rate

1. **Insights → New Insight → Trends**
2. Event A: `request_event` → Filter: `outcome = success` → rename: "Successful"
3. Event B: `request_event` → rename: "Total"
4. Click **Enable formula** → type: `A / B * 100`
5. Date range: **Last 7 days**
6. Save as: **"Success Rate %"**

### Insight 1.6 — Premium vs Free Users

1. **Insights → New Insight → Trends**
2. Event: `$pageview`
3. Aggregation: **Unique users**
4. Breakdown by: `is_premium`
5. Date range: **Last 30 days**
6. Save as: **"Premium vs Free"**

---

## Dashboard 2: Ad Revenue (your money dashboard)

> Dashboards → New Dashboard → name: "Ad Revenue"

### Insight 2.1 — Gravity Billing Health (MOST IMPORTANT)

This tells you: did Gravity actually receive the impression pixel = did you get paid.

1. **Insights → New Insight → Trends**
2. Event A: `ad_event` → Filter: `gravity_forwarded equals 1` → rename: "Billed (paid)"
3. Event B: `ad_event` → Filter: `gravity_forwarded equals 0` → rename: "Failed (not paid)"
4. Date range: **Last 7 days**
5. Display: **Line chart**
6. Save as: **"Gravity Billing Health"**

**Set an alert**: Click the "..." menu on this insight → "Subscribe" → set alert if "Failed" exceeds 10% of "Billed". This warns you if revenue is dropping.

### Insight 2.2 — Ad Impressions by Provider

1. **Insights → New Insight → Trends**
2. Event: `ad_impression`
3. Aggregation: **Total count**
4. Breakdown by: `ad_provider`
5. Date range: **Last 7 days**
6. Save as: **"Impressions by Provider"**

### Insight 2.3 — Ad Clicks by Placement

1. **Insights → New Insight → Trends**
2. Event: `ad_click`
3. Aggregation: **Total count**
4. Breakdown by: `placement`
5. Date range: **Last 7 days**
6. Save as: **"Clicks by Placement"**

### Insight 2.4 — Click-Through Rate (CTR)

1. **Insights → New Insight → Trends**
2. Event A: `ad_impression` → rename: "Impressions"
3. Event B: `ad_click` → rename: "Clicks"
4. Enable formula → type: `B / A * 100`
5. Breakdown by: `placement`
6. Date range: **Last 7 days**
7. Save as: **"CTR by Placement"**

### Insight 2.5 — CTR by Device Type

1. **Insights → New Insight → Trends**
2. Event A: `ad_impression` → rename: "Impressions"
3. Event B: `ad_click` → rename: "Clicks"
4. Enable formula → type: `B / A * 100`
5. Breakdown by: `device_type`
6. Date range: **Last 7 days**
7. Save as: **"CTR by Device"**

### Insight 2.6 — Ad Fill Rate

1. **Insights → New Insight → Trends**
2. Event A: `ad_event` → Filter: `status equals filled` → rename: "Filled"
3. Event B: `ad_event` → Filter: `status does not equal premium_user` → rename: "Eligible"
4. Enable formula → type: `A / B * 100`
5. Date range: **Last 7 days**
6. Save as: **"Ad Fill Rate %"**

### Insight 2.7 — Ad Funnel (request → fill → impression → click)

1. **Insights → New Insight → Funnel**
2. Step 1: `ad_event` → Filter: `event_type = request`
3. Step 2: `ad_impression`
4. Step 3: `ad_click`
5. Funnel type: **Unordered** (user might not complete all steps in one session)
6. Date range: **Last 7 days**
7. Save as: **"Ad Funnel"**

---

## Dashboard 3: Top Sites & Performance

> Dashboards → New Dashboard → name: "Sites & Performance"

### Insight 3.1 — Top 10 Sites by Volume

1. **Insights → New Insight → Trends**
2. Event: `request_event`
3. Aggregation: **Total count**
4. Breakdown by: `hostname`
5. Date range: **Last 7 days**
6. Display: **Table** (click the chart type icon, pick Table)
7. PostHog shows top hostnames sorted by volume
8. Save as: **"Top Sites"**

### Insight 3.2 — Success Rate by Site

1. **Insights → New Insight → Trends**
2. Event A: `request_event` → Filter: `outcome = success` → rename: "Success"
3. Event B: `request_event` → rename: "Total"
4. Enable formula → type: `A / B * 100`
5. Breakdown by: `hostname`
6. Display: **Table**
7. Save as: **"Success Rate by Site"**

### Insight 3.3 — Average Latency by Site

1. **Insights → New Insight → Trends**
2. Event: `request_event`
3. Click aggregation dropdown (says "Total count") → **Property value → Average**
4. Property: `duration_ms`
5. Breakdown by: `hostname`
6. Display: **Table**
7. Save as: **"Avg Latency by Site"**

### Insight 3.4 — P95 Latency by Site

1. Same as 3.3 but pick **Property value → P95 (95th percentile)**
2. Save as: **"P95 Latency by Site"**

### Insight 3.5 — Cache Hit Rate

1. **Insights → New Insight → Trends**
2. Event A: `request_event` → Filter: `cache_hit equals 1` → rename: "Cache Hits"
3. Event B: `request_event` → rename: "Total"
4. Enable formula → type: `A / B * 100`
5. Date range: **Last 7 days**
6. Save as: **"Cache Hit Rate %"**

### Insight 3.6 — Error Breakdown

1. **Insights → New Insight → Trends**
2. Event: `request_event` → Filter: `outcome = error`
3. Breakdown by: `error_type`
4. Date range: **Last 7 days**
5. Display: **Table**
6. Save as: **"Errors by Type"**

---

## Dashboard 4: Feature Adoption

> Dashboards → New Dashboard → name: "Feature Adoption"

### Insight 4.1 — Feature Usage

1. **Insights → New Insight → Trends**
2. Event: `feature_used`
3. Aggregation: **Unique users**
4. Breakdown by: `feature`
5. Date range: **Last 30 days**
6. Save as: **"Feature Usage"**

### Insight 4.2 — Chat Engagement

1. **Insights → New Insight → Trends**
2. Event: `chat_message_sent`
3. Aggregation: **Total count** (line A) + **Unique users** (line B — add same event again with unique users)
4. Date range: **Last 30 days**
5. Save as: **"Chat Engagement"**

### Insight 4.3 — TTS Usage

1. **Insights → New Insight → Trends**
2. Event: `tts_requested`
3. Aggregation: **Unique users**
4. Breakdown by: `voice`
5. Date range: **Last 30 days**
6. Save as: **"TTS Usage by Voice"**

### Insight 4.4 — Article Sharing

1. **Insights → New Insight → Trends**
2. Event: `article_shared`
3. Aggregation: **Total count**
4. Date range: **Last 30 days**
5. Save as: **"Articles Shared"**

### Insight 4.5 — Highlights

1. **Insights → New Insight → Trends**
2. Event A: `highlight_created` → rename: "Created"
3. Event B: `highlights_exported` → rename: "Exported"
4. Aggregation: **Total count**
5. Date range: **Last 30 days**
6. Save as: **"Highlights"**

---

## Dashboard 5: LLM Analytics

> Go to **Product Analytics → LLM Analytics** (PostHog has a built-in dashboard for this)

PostHog auto-creates an LLM dashboard from `$ai_generation` events. It shows:
- **Cost per model** (based on token counts)
- **Latency distribution**
- **Error rate**
- **Token usage over time**

If you want custom views:

### Insight 5.1 — LLM Cost: Premium vs Free

1. **Insights → New Insight → Trends**
2. Event: `$ai_generation`
3. Aggregation: **Property value → Sum** → property: `$ai_output_tokens`
4. Breakdown by: `is_premium`
5. Date range: **Last 30 days**
6. Save as: **"LLM Tokens: Premium vs Free"**

### Insight 5.2 — LLM Latency

1. **Insights → New Insight → Trends**
2. Event: `$ai_generation`
3. Aggregation: **Property value → Average** → property: `$ai_latency`
4. Date range: **Last 7 days**
5. Save as: **"LLM Avg Latency"**

---

## Alerts (set up immediately)

Go to each insight → click "..." → **Subscribe / Alert**

| Alert | Condition | Why |
|-------|-----------|-----|
| Gravity billing failures | `gravity_forwarded = 0` count > 10% of total | Revenue loss |
| Error rate spike | Success Rate % drops below 90% | Site broken |
| Zero requests | Total Requests = 0 for 1 hour | Server down |
| LLM errors | `$ai_generation` with `$ai_is_error = true` spikes | Chat broken |

---

## Session Recordings (already enabled)

Go to **Recordings** in the left sidebar. You can:
- Watch real user sessions
- Filter by: `is_premium`, `device_type`, specific events
- See where users rage-click or get stuck
- Debug ad visibility issues

## Heatmaps (already enabled)

Go to **Heatmaps** in the left sidebar. Shows:
- Click heatmaps on any page
- Scroll depth
- Useful for optimizing ad placement

---

## Sharing with Your Boss

1. Open any dashboard
2. Click **Share** (top right)
3. Toggle **Share publicly**
4. Copy the link — anyone with the link can view (read-only, no login needed)
5. Or: **Export → PDF** for reports

---

## Quick Reference: All Events

### Server-side events (lib/posthog.ts)
| Event | When | Key properties |
|-------|------|----------------|
| `request_event` | Every article request | `hostname`, `outcome`, `duration_ms`, `cache_hit`, `error_type`, `source` |
| `ad_event` | Gravity billing only | `gravity_forwarded`, `gravity_status_code`, `placement`, `status` |
| `$ai_generation` | Every chat message | `$ai_model`, `$ai_input_tokens`, `$ai_output_tokens`, `$ai_latency`, `is_premium` |

### Client-side events (posthog-js via use-analytics.ts)
| Event | When | Key properties |
|-------|------|----------------|
| `$pageview` | Every page navigation | `$current_url` (automatic) |
| `article_submitted` | User pastes URL | `url` |
| `article_loaded` | Article renders | `hostname`, `source`, `article_title` |
| `article_error` | Fetch fails | `error_name` |
| `ad_impression` | Ad becomes visible | `placement`, `ad_provider` |
| `ad_click` | User clicks ad | `placement`, `ad_provider` |
| `ad_loaded` | Ads fetched | `ad_count`, `providers` |
| `chat_message_sent` | Chat message | (auto-enriched) |
| `tts_requested` | TTS loaded | `voice`, `article_url` |
| `tts_played` / `tts_paused` | Playback toggle | `voice`, `playback_position` |
| `article_shared` | Share button | `method` |
| `highlight_created` | Text highlighted | (auto-enriched) |
| `feature_used` | Any feature first use | `feature`, `$set_once: first_used_*` |
| `setting_changed` | Settings toggle | `setting`, `value` |
