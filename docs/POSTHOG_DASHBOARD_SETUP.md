# PostHog Dashboard Setup Guide

Step-by-step guide to create PostHog dashboards for SMRY.

**Current events:** 7 custom events + heatmaps (no $pageview — DataBuddy handles visitors).

---

## Dashboard 1: SMRY Overview (daily check)

> Dashboards -> New Dashboard -> name: "SMRY Overview"

### 1.1 — Active Users

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded`
3. Aggregation: **Unique users**
4. Date range: **Last 30 days**
5. Display: **Line chart**
6. Save as: **"Active Users"**

Note: Visitor count and bounce rate are in DataBuddy. This tracks users who actually loaded an article.

### 1.2 — Error Rate

1. **Insights -> New Insight -> Trends**
2. Event A: `article_loaded` -> rename: "Success"
3. Event B: `article_error` -> rename: "Error"
4. Date range: **Last 7 days**
5. Display: **Line chart**
6. Save as: **"Success vs Error"**

### 1.3 — Premium vs Free

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded`
3. Aggregation: **Unique users**
4. Breakdown by: `is_premium`
5. Date range: **Last 30 days**
6. Save as: **"Premium vs Free"**

---

## Dashboard 2: Top Sites & Source Reliability

> Dashboards -> New Dashboard -> name: "Top Sites"

This tells you: "nytimes.com success rate is 95%, avg latency 2.3s, winning source is smry-fast."

### 2.1 — Top 10 Sites by Volume

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded`
3. Aggregation: **Total count**
4. Breakdown by: `hostname`
5. Date range: **Last 7 days**
6. Display: **Table**
7. Save as: **"Top Sites"**

### 2.2 — Success Rate by Site

1. **Insights -> New Insight -> Trends**
2. Event A: `article_loaded` -> rename: "Success"
3. Event B: `article_error` -> rename: "Error"
4. Enable formula -> type: `A / (A + B) * 100`
5. Breakdown by: `hostname`
6. Date range: **Last 7 days**
7. Display: **Table**
8. Save as: **"Success Rate by Site"**

### 2.3 — Average Latency by Site

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded`
3. Aggregation: **Property value -> Average** -> property: `fetch_ms`
4. Breakdown by: `hostname`
5. Date range: **Last 7 days**
6. Display: **Table**
7. Save as: **"Avg Latency by Site"**

### 2.4 — Winning Source by Site

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded`
3. Aggregation: **Total count**
4. Breakdown by: `hostname`, then add second breakdown: `source`
5. Date range: **Last 7 days**
6. Display: **Table**
7. Save as: **"Source by Site"**

### 2.5 — Winning Source Distribution (overall)

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded`
3. Aggregation: **Total count**
4. Breakdown by: `source`
5. Date range: **Last 7 days**
6. Display: **Pie chart**
7. Save as: **"Winning Source"**

### 2.6 — Which Sources Fail Most

1. **Insights -> New Insight -> Trends**
2. Event: `article_loaded` -> Filter: `sources_failed contains smry-fast` -> rename: "smry-fast failures"
3. Add series: `article_loaded` -> Filter: `sources_failed contains smry-slow` -> rename: "smry-slow failures"
4. Add series: `article_loaded` -> Filter: `sources_failed contains wayback` -> rename: "wayback failures"
5. Date range: **Last 7 days**
6. Save as: **"Source Failures"**

### 2.7 — Classifier Coverage

1. **Insights -> New Insight -> Trends**
2. Event A: `article_loaded` -> Filter: `classified equals true` -> rename: "Classified"
3. Event B: `article_loaded` -> Filter: `classified equals false` -> rename: "Unclassified"
4. Date range: **Last 7 days**
5. Save as: **"Classifier Coverage"**

---

## Dashboard 3: Ad Clicks (placement optimization)

> Dashboards -> New Dashboard -> name: "Ad Clicks"

### 3.1 — Clicks by Placement

1. **Insights -> New Insight -> Trends**
2. Event: `ad_click`
3. Aggregation: **Total count**
4. Breakdown by: `placement`
5. Date range: **Last 7 days**
6. Save as: **"Clicks by Placement"**

This tells you which ad slots get clicked most. Optimize for the top placements.

### 3.2 — Clicks by Provider

1. **Insights -> New Insight -> Trends**
2. Event: `ad_click`
3. Aggregation: **Total count**
4. Breakdown by: `ad_provider`
5. Date range: **Last 7 days**
6. Save as: **"Clicks by Provider"**

### 3.3 — Clicks by Device

1. **Insights -> New Insight -> Trends**
2. Event: `ad_click`
3. Aggregation: **Total count**
4. Breakdown by: `device_type`
5. Date range: **Last 7 days**
6. Save as: **"Clicks by Device"**

---

## Dashboard 4: Feature Adoption

> Dashboards -> New Dashboard -> name: "Feature Adoption"

### 4.1 — All Features Overview

1. **Insights -> New Insight -> Trends**
2. Add these events (each as a separate series):
   - `chat_message_sent` -> rename: "Chat"
   - `article_shared` -> rename: "Share"
   - `highlight_created` -> rename: "Highlights"
   - `tts_requested` -> rename: "TTS"
3. Aggregation: **Unique users**
4. Date range: **Last 30 days**
5. Save as: **"Feature Usage (unique users)"**

### 4.2 — Share Method Breakdown

1. **Insights -> New Insight -> Trends**
2. Event: `article_shared`
3. Aggregation: **Total count**
4. Breakdown by: `method`
5. Date range: **Last 30 days**
6. Save as: **"Share Methods"**

### 4.3 — Chat Engagement

1. **Insights -> New Insight -> Trends**
2. Event A: `chat_message_sent` -> Aggregation: **Total count** -> rename: "Messages"
3. Event B: `chat_message_sent` -> Aggregation: **Unique users** -> rename: "Users"
4. Date range: **Last 30 days**
5. Save as: **"Chat Engagement"**

### 4.4 — TTS Usage by Voice

1. **Insights -> New Insight -> Trends**
2. Event: `tts_requested`
3. Aggregation: **Unique users**
4. Breakdown by: `voice`
5. Date range: **Last 30 days**
6. Save as: **"TTS by Voice"**

---

## Dashboard 5: Heatmaps

> Go to **Heatmaps** in the PostHog left sidebar (not a custom dashboard)

PostHog heatmaps show:
- **Click heatmaps** — where users click on each page
- **Scroll depth** — how far down users scroll
- **Rage clicks** — where users click repeatedly (frustration signal)

Use this to:
- Optimize ad placement (put ads where users look)
- Find UI elements users try to click but can't
- See if users scroll past important content

---

## Dashboard 6: Retention

> Dashboards -> New Dashboard -> name: "Retention"

### 6.1 — Weekly Retention

1. **Insights -> New Insight -> Retention**
2. Start event: `article_loaded` (first load)
3. Return event: `article_loaded` (subsequent load)
4. Period: **Weekly**
5. Save as: **"Weekly Retention"**

### 6.2 — Feature Retention

1. **Insights -> New Insight -> Retention**
2. Start event: `chat_message_sent`
3. Return event: `chat_message_sent`
4. Period: **Weekly**
5. Save as: **"Chat Retention"**

---

## Alerts

Go to each insight -> click "..." -> **Subscribe / Alert**

| Alert | Condition | Why |
|-------|-----------|-----|
| Error spike | `article_error` count > 20% of `article_loaded` | Something is broken |
| Source degradation | `sources_succeeded` average drops below 1.5 | Multiple sources failing |
| Latency spike | `fetch_ms` average > 10000 | Performance issue |

---

## Quick Reference: All Events

| Event | When | Key Properties |
|-------|------|----------------|
| `article_loaded` | Article renders | `source`, `hostname`, `fetch_ms`, `classified`, `sources_succeeded`, `sources_failed` |
| `article_error` | All sources fail | `error_name`, `hostname` |
| `ad_click` | Ad clicked | `placement`, `ad_provider` |
| `chat_message_sent` | Chat message | `message_length`, `language` |
| `article_shared` | Share action | `method` (copy_link/native/x_twitter/linkedin/reddit) |
| `highlight_created` | Text highlighted | `text_length`, `color` |
| `tts_requested` | TTS loaded | `voice`, `article_url` |

All events are auto-enriched with: `is_premium`, `device_type`, `locale`.
