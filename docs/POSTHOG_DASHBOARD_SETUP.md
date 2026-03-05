# PostHog Dashboard Setup Guide

Complete step-by-step guide to create all PostHog dashboards for SMRY.

**Current events:** 11 custom events + heatmaps (no $pageview — DataBuddy handles visitors).

**All events are auto-enriched with:** `is_premium`, `device_type`, `locale`.

---

## Before You Start

1. Open **PostHog** → log in at `us.posthog.com` (or your project URL)
2. Make sure you see your project name in the top-left
3. Confirm events are flowing: go to **Activity** (left sidebar) → you should see `article_loaded`, `ad_click`, etc. If you see nothing, PostHog isn't receiving events yet — fix that first

---

## Quick Reference: All 11 Events

| Event | When it fires | Key Properties |
|-------|---------------|----------------|
| `article_loaded` | Article renders successfully | `source`, `hostname`, `fetch_ms`, `classified`, `classification_outcome`, `sources_succeeded`, `sources_failed` (comma-separated string) |
| `article_error` | All extraction sources fail | `error_name`, `hostname` |
| `ad_click` | User clicks an ad | `placement`, `ad_provider` |
| `chat_message_sent` | User sends a chat message | `message_length`, `language` |
| `article_shared` | User shares an article | `method` (copy_link / native / x_twitter / linkedin / reddit) |
| `highlight_created` | User highlights text | `text_length`, `color` |
| `tts_requested` | User requests text-to-speech | `voice`, `article_url` |
| `theme_changed` | User switches theme | `theme` |
| `view_mode_changed` | User switches view mode | `view_mode` (markdown / html / iframe) |
| `toolbar_click` | Floating toolbar button clicked | `action` (open_original / listen / history / reader_settings / settings) |
| `annotation_action` | Highlight edit, delete, export | `action` (edit_note / delete / export), `highlight_count` |

---

## Dashboard 1: SMRY Overview (daily health check)

**Purpose:** "Is everything working? How many users today?"

### Step 1 — Create the dashboard

1. Left sidebar → click **Dashboards**
2. Top-right → click **+ New dashboard**
3. Select **Blank dashboard**
4. Name it: `SMRY Overview`
5. Click **Save**

### Step 2 — Add "Active Users" insight

1. You're now inside the empty dashboard. Click **+ Add insight** (top-right)
2. Click **+ New insight**
3. You'll see the insight builder. The insight type should already be **Trends** (default). If not, click "Trends" at the top
4. Under **Series**, you'll see "Event: Pageview" — click on the **Pageview** text
5. A dropdown opens → type `article_loaded` → select it
6. To the right of the event name, you'll see **Total count** — click on it
7. Change to **Unique users** (this counts distinct people, not repeat loads)
8. Top-right of the chart area → click **Date range** → select **Last 30 days**
9. The chart should now show a line of unique users per day
10. Click **Save & add to dashboard** (bottom or top-right)
11. Name it: `Active Users`
12. Make sure your `SMRY Overview` dashboard is selected
13. Click **Save**

### Step 3 — Add "Success vs Error" insight

1. Back on the dashboard → **+ Add insight** → **+ New insight**
2. Insight type: **Trends**
3. Under **Series**:
   - Event 1: click the event dropdown → select `article_loaded`
   - Click the pencil icon (or the event name text) → rename to `Success`
4. Click **+ Add graph series** (below the first event)
   - Event 2: select `article_error`
   - Rename to `Error`
5. Date range: **Last 7 days**
6. Display: it defaults to Line chart — that's fine
7. **Save & add to dashboard** → name: `Success vs Error` → select `SMRY Overview` → Save

### Step 4 — Add "Premium vs Free" insight

1. **+ Add insight** → **+ New insight**
2. Insight type: **Trends**
3. Event: `article_loaded`, Aggregation: **Unique users**
4. Click **+ Add breakdown** (below the series section)
5. Select **Event property** → type `is_premium` → select it
6. Date range: **Last 30 days**
7. You'll see two lines — one for `true` (premium), one for `false` (free)
8. **Save & add to dashboard** → name: `Premium vs Free` → select `SMRY Overview` → Save

**Dashboard 1 done — 3 cards.**

---

## Dashboard 2: Top Sites & Source Reliability

**Purpose:** "Which websites do users read? What's the success rate? Which extraction source wins?"

Example insight: "nytimes.com has 95% success rate, avg latency 2.3s, winning source is smry-fast"

### Step 1 — Create the dashboard

1. Left sidebar → **Dashboards** → **+ New dashboard** → **Blank dashboard**
2. Name: `Top Sites`
3. Save

### Step 2 — "Top Sites by Volume"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `article_loaded`, Aggregation: **Total count**
3. Click **+ Add breakdown** → select **Event property** → type `hostname` → select it
4. Date range: **Last 7 days**
5. **Chart type**: click the chart icon row above the chart → select **Table** (grid icon)
6. You'll see a table: hostname and count — your top visited sites
7. **Save & add to dashboard** → name: `Top Sites by Volume` → add to `Top Sites`

### Step 3 — "Success Rate by Site"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event A: `article_loaded` → rename to `Success`
3. **+ Add graph series** → Event B: `article_error` → rename to `Error`
4. Look for **Enable formula mode** (toggle or button below the series) → click it
5. In the formula field, type: `A / (A + B) * 100`
6. **+ Add breakdown** → `hostname`
7. Date range: **Last 7 days**
8. Display: **Table**
9. **Save** → name: `Success Rate by Site` → add to `Top Sites`

### Step 4 — "Avg Latency by Site"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `article_loaded`
3. Click **Total count** (the aggregation) → change to **Property value** → then **Average**
4. A property picker appears → type `fetch_ms` → select it
5. **+ Add breakdown** → `hostname`
6. Date range: **Last 7 days**, Display: **Table**
7. **Save** → name: `Avg Latency by Site` → add to `Top Sites`

### Step 5 — "Winning Source Distribution"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `article_loaded`, Aggregation: **Total count**
3. **+ Add breakdown** → `source`
4. Date range: **Last 7 days**
5. Display: **Pie chart** (click the pie icon above the chart)
6. Shows which extraction source (smry-fast, smry-slow, wayback) wins most often
7. **Save** → name: `Winning Source` → add to `Top Sites`

### Step 6 — "Source by Site" (double breakdown)

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `article_loaded`, Aggregation: **Total count**
3. **+ Add breakdown** → `hostname`
4. **+ Add breakdown** again → `source` (yes, two breakdowns are supported)
5. Date range: **Last 7 days**, Display: **Table**
6. **Save** → name: `Source by Site` → add to `Top Sites`

### Step 7 — "Source Failures"

`sources_failed` is a comma-separated string (e.g., `"smry-slow,wayback"`). PostHog's "contains" text filter works on this format.

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event A: `article_loaded`
   - Click the **filter icon** (funnel) next to the event
   - Property: `sources_failed` → operator: **contains** → value: `smry-fast`
   - Rename the series to: `smry-fast failures`
3. **+ Add graph series** → Event B: `article_loaded`
   - Filter: `sources_failed` contains `smry-slow`
   - Rename to: `smry-slow failures`
4. **+ Add graph series** → Event C: `article_loaded`
   - Filter: `sources_failed` contains `wayback`
   - Rename to: `wayback failures`
5. Date range: **Last 7 days**
6. **Save** → name: `Source Failures` → add to `Top Sites`

### Step 8 — "Classifier Coverage"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event A: `article_loaded`
   - Filter: `classified` → operator: **equals** → value: `true`
   - Rename to: `Classified`
3. **+ Add graph series** → Event B: `article_loaded`
   - Filter: `classified` equals `false`
   - Rename to: `Unclassified`
4. Date range: **Last 7 days**
5. **Save** → name: `Classifier Coverage` → add to `Top Sites`

**Dashboard 2 done — 7 cards.**

---

## Dashboard 3: Ad Clicks (revenue optimization)

**Purpose:** "Which ad slots get clicked most? Which provider performs better? How does ZeroClick compare to Gravity?"

> **Important:** If you see old placement names like `home`, `Homepage`, `Article - Sidebar`, `sidebar`, `inline`, etc., those are historical events from before the March 2026 naming fix. PostHog is write-only — old events can't be renamed. Filter your date range to **after the fix was deployed** to see only clean data. Current placement names are all snake_case (see below).

### How ad click tracking works

`ad_click` events are tracked inside `fireClick()` in `lib/hooks/use-gravity-ad.ts`. This is the **single source of truth** — components only call `fireClick(ad, "placement_name", index)` and the hook handles PostHog tracking. No duplicate tracking possible.

### Step 1 — Create the dashboard

1. **Dashboards** → **+ New dashboard** → **Blank dashboard** → name: `Ad Clicks` → Save

### Step 2 — "Clicks by Placement"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `ad_click`, Aggregation: **Total count**
3. **+ Add breakdown** → `placement`
4. Date range: **Last 7 days**
5. **Save** → name: `Clicks by Placement` → add to `Ad Clicks`

Placement values (all snake_case):

| Placement | Location |
|-----------|----------|
| `homepage` | Landing page |
| `article_sidebar` | Desktop right sidebar |
| `article_inline` | Mid-article |
| `article_footer` | End of article |
| `chat_top` | Above chat messages (desktop) |
| `chat_middle` | Between chat messages (desktop) |
| `chat_input` | Above prompt input (desktop) |
| `mobile_article_bottom` | Fixed bottom bar on mobile article |
| `mobile_chat_top` | Chat header on mobile |
| `mobile_chat_middle` | Between chat messages on mobile |

### Step 3 — "Clicks by Provider"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `ad_click`, Aggregation: **Total count**
3. **+ Add breakdown** → `ad_provider`
4. Date range: **Last 7 days**
5. **Save** → name: `Clicks by Provider` → add to `Ad Clicks`

Shows ZeroClick vs Gravity performance. ZeroClick is the primary ad provider.

### Step 4 — "Clicks by Device"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `ad_click`, Aggregation: **Total count**
3. **+ Add breakdown** → `device_type`
4. Date range: **Last 7 days**
5. **Save** → name: `Clicks by Device` → add to `Ad Clicks`

Shows mobile vs tablet vs desktop click rates.

### Step 5 — "Clicks by Provider per Placement"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `ad_click`, Aggregation: **Total count**
3. **+ Add breakdown** → `placement`
4. **+ Add breakdown** again → `ad_provider` (double breakdown)
5. Date range: **Last 7 days**, Display: **Table**
6. **Save** → name: `Provider per Placement` → add to `Ad Clicks`

Shows which provider gets more clicks per slot — useful for optimizing the ZeroClick/Gravity split.

**Dashboard 3 done — 4 cards.**

---

## Dashboard 4: Feature Adoption

**Purpose:** "Which features do people actually use? Is chat growing?"

### Step 1 — Create the dashboard

1. **Dashboards** → **+ New dashboard** → **Blank dashboard** → name: `Feature Adoption` → Save

### Step 2 — "Feature Usage (unique users)"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Add 4 events as separate series:
   - Event 1: `chat_message_sent` → rename to `Chat`
   - **+ Add graph series** → Event 2: `article_shared` → rename to `Share`
   - **+ Add graph series** → Event 3: `highlight_created` → rename to `Highlights`
   - **+ Add graph series** → Event 4: `tts_requested` → rename to `TTS`
3. **Important**: Change aggregation for ALL four to **Unique users**
   - Click the **Total count** next to each event → change to **Unique users**
4. Date range: **Last 30 days**
5. **Save** → name: `Feature Usage (unique users)` → add to `Feature Adoption`

### Step 3 — "Share Methods"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `article_shared`, Aggregation: **Total count**
3. **+ Add breakdown** → `method`
4. Date range: **Last 30 days**
5. **Save** → name: `Share Methods` → add to `Feature Adoption`

Shows copy_link vs native vs x_twitter vs linkedin vs reddit.

### Step 4 — "Chat Engagement"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event A: `chat_message_sent` → Aggregation: **Total count** → rename to `Messages`
3. **+ Add graph series** → Event B: `chat_message_sent` → Aggregation: **Unique users** → rename to `Users`
4. Date range: **Last 30 days**
5. **Save** → name: `Chat Engagement` → add to `Feature Adoption`

High messages-per-user = engaged chatters.

### Step 5 — "TTS by Voice"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `tts_requested`, Aggregation: **Unique users**
3. **+ Add breakdown** → `voice`
4. Date range: **Last 30 days**
5. **Save** → name: `TTS by Voice` → add to `Feature Adoption`

Shows which voices are most popular.

### Step 6 — "Theme Usage"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `theme_changed`, Aggregation: **Total count**
3. **+ Add breakdown** → `theme`
4. Date range: **Last 30 days**
5. Display: **Pie chart**
6. **Save** → name: `Theme Usage` → add to `Feature Adoption`

### Step 7 — "View Mode Usage"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `view_mode_changed`, Aggregation: **Total count**
3. **+ Add breakdown** → `view_mode`
4. Date range: **Last 30 days**
5. Display: **Pie chart**
6. **Save** → name: `View Mode Usage` → add to `Feature Adoption`

### Step 8 — "Toolbar Engagement"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `toolbar_click`, Aggregation: **Total count**
3. **+ Add breakdown** → `action`
4. Date range: **Last 30 days**
5. **Save** → name: `Toolbar Engagement` → add to `Feature Adoption`

### Step 9 — "Annotation Activity"

1. **+ Add insight** → **+ New insight** → **Trends**
2. Event: `annotation_action`, Aggregation: **Total count**
3. **+ Add breakdown** → `action`
4. Date range: **Last 30 days**
5. **Save** → name: `Annotation Activity` → add to `Feature Adoption`

**Dashboard 4 done — 8 cards.**

---

## Dashboard 5: Retention

**Purpose:** "Are users coming back? Which features retain users?"

### Step 1 — Create the dashboard

1. **Dashboards** → **+ New dashboard** → **Blank dashboard** → name: `Retention` → Save

### Step 2 — "Weekly Retention"

1. **+ Add insight** → **+ New insight**
2. **Change insight type**: click **Retention** at the top (NOT Trends — look for it in the insight type tabs)
3. You'll see two fields:
   - **Performed** (start event): select `article_loaded`
   - **And then came back and performed** (return event): select `article_loaded`
4. **Period**: change to **Week** (dropdown next to the return event)
5. You'll see a retention table — Week 0 is 100%, then it drops off. This shows how many users come back each week
6. **Save** → name: `Weekly Retention` → add to `Retention`

### Step 3 — "Chat Retention"

1. **+ Add insight** → **+ New insight** → select **Retention** insight type
2. Start event: `chat_message_sent`
3. Return event: `chat_message_sent`
4. Period: **Week**
5. **Save** → name: `Chat Retention` → add to `Retention`

**Dashboard 5 done — 2 cards.**

---

## Dashboard 6: Heatmaps (built-in, no setup needed)

**Purpose:** "Where do users click? How far do they scroll?"

1. Left sidebar → click **Heatmaps** (it's a built-in feature, not a custom dashboard)
2. Enter your site URL (e.g., `https://smry.ai`)
3. PostHog will show:
   - **Click heatmap** — where users click on each page
   - **Scroll depth** — how far down users scroll
   - **Rage clicks** — where users click repeatedly (frustration signal)
4. Use the page selector at the top to switch between pages (home page, article view, etc.)

No cards to create — it works automatically since `enable_heatmaps: true` is set.

**Use this to:**
- Optimize ad placement (put ads where users look/scroll to)
- Find UI elements users try to click but can't (dead clicks)
- See if users scroll past important content

---

## Setting Up Alerts

Alerts notify you when something breaks or degrades.

### Alert 1 — Error Spike

1. Go to **Dashboard 1: SMRY Overview**
2. Click the **Success vs Error** insight card to open it
3. Click the **...** menu (three dots, top-right of the insight)
4. Click **Subscribe** or **Alerts**
5. Set condition: **When `article_error` total count is greater than 50 in a day**
6. Delivery: your email
7. Save

### Alert 2 — Latency Spike

1. Go to **Dashboard 2: Top Sites**
2. Open the **Avg Latency by Site** insight
3. **...** → **Subscribe/Alerts**
4. Condition: **Average `fetch_ms` is greater than 10000** (10 seconds)
5. Save

### Alert 3 — Source Degradation

1. Open the **Source Failures** insight
2. **...** → **Subscribe/Alerts**
3. Condition: **When any series total count spikes above normal** (use anomaly detection if available, or set a threshold like 100)
4. Save

---

## Summary

| # | Dashboard | Cards | What it answers |
|---|-----------|-------|-----------------|
| 1 | SMRY Overview | 3 | Is everything working? How many users? |
| 2 | Top Sites | 7 | Which sites work/fail? Which source wins? |
| 3 | Ad Clicks | 4 | Which ads get clicked? Provider comparison |
| 4 | Feature Adoption | 8 | Which features do people use? |
| 5 | Retention | 2 | Are users coming back? |
| 6 | Heatmaps | built-in | Where do users click/scroll? |

**Total: 24 insight cards across 5 custom dashboards + built-in heatmaps.**
