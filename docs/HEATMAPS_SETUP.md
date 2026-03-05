# PostHog Heatmaps Setup — SMRY

How to enable, configure, and use heatmaps for understanding user behavior on article pages and homepage.

**Last updated: March 2026**

---

## Prerequisites

Code-side configuration is already done in `components/providers/posthog-provider.tsx`:

```typescript
posthog.init(token, {
  autocapture: false,       // Blocks autocapture events (saves ~$750/month at 30K DAU)
  enable_heatmaps: true,    // Sends only heatmap coordinates (mouse position + scroll depth)
});
```

`autocapture: false` + `enable_heatmaps: true` means only lightweight heatmap data is sent — no full autocapture events. Cost impact: ~$1-2/month extra.

---

## Step 1: Enable Data Collection (Project Settings)

1. In PostHog, go to **Settings** (gear icon) > **Project Settings**
2. Under **Autocapture**, toggle **"Enable autocapture for web"** to **ON**
3. Click **Save**

This enables the server-side pipeline that processes heatmap data. Your code-level `autocapture: false` still blocks autocapture events from being sent — only heatmap coordinates flow through.

### Other settings (leave as-is)

| Setting | Status | Why |
|---------|--------|-----|
| Web vitals autocapture | OFF | Not needed — use Lighthouse/DataBuddy for performance |
| Dead clicks autocapture | OFF | Nice-to-have but adds events. Enable later if needed |

---

## Step 2: Add Your Domain to the Toolbar

1. In PostHog left sidebar, click **"Toolbar"**
2. Click **"+ Add authorized URL"**
3. Add your production URL: `https://smry.ai`
4. Also add `http://localhost:3000` for local testing

---

## Step 3: Launch the Toolbar

1. On the Toolbar page, click **"Launch"** next to your URL
2. Your site opens with a PostHog floating toolbar overlaid at the bottom
3. The toolbar has icons for: Inspect, Heatmap, Actions, Feature Flags

---

## Step 4: View Heatmaps via the Toolbar

Click the **heatmap icon** on the toolbar. Three views are available:

| View | What it shows | Use for |
|------|-------------|---------|
| **Heatmap** | Mouse movements, clicks, dead clicks, rage clicks | See where users hover and interact |
| **Scrollmap** | How far users scroll down the page | "Are users reading the full article?" |
| **Clickmap** | Which elements users actually click | "Are users finding the share button? The TTS button?" |

---

## Step 5: View Heatmaps Inside PostHog (No Toolbar Needed)

For persistent, shareable heatmaps that aggregate data across sessions:

1. Go to **Heatmaps** in the PostHog sidebar
2. Click **"+ New heatmap"**
3. In **"Display URL"**, enter a specific page URL (e.g., `https://smry.ai/article/example`)
4. In **"Heatmap data URL"**, use wildcards to combine data from similar pages:
   - `https://smry.ai/article/*` — aggregates ALL article pages into one heatmap
   - `https://smry.ai/` — homepage only
5. Choose type: Heatmap, Scrollmap, or Clickmap
6. Click **Save**

---

## Recommended Heatmaps for SMRY

Create these 3 heatmaps:

| Name | Data URL (wildcard) | Type | What you learn |
|------|-------------------|------|---------------|
| **Article Scroll Depth** | `https://smry.ai/article/*` | Scrollmap | Do users reach inline ads? Footer ads? Where do they stop reading? |
| **Article Clicks** | `https://smry.ai/article/*` | Clickmap | Which features get clicked (TTS, share, chat, ads) |
| **Homepage Clicks** | `https://smry.ai/` | Clickmap | Do users click the homepage ad? Where do they click? |

---

## What Each Heatmap Answers

### Article Scroll Depth (Scrollmap) — Most Valuable

Directly answers:
- "Are users reading the whole article or leaving in between?"
- "Do users scroll to where the inline ad is placed?"
- "Do users reach the footer ad?"
- "Should I move the inline ad higher?"

**Action**: If <30% of users reach the `article_footer` ad, consider moving it higher or removing it.

### Article Clicks (Clickmap)

Directly answers:
- "Are users clicking the TTS button?"
- "Is anyone using the share button?"
- "Which ad placements get the most clicks?"
- "Are users opening the chat sidebar?"

**Action**: If a feature button gets <1% click rate, consider making it more prominent or removing it.

### Homepage Clicks (Clickmap)

Directly answers:
- "Do users click the homepage ad?"
- "Are users using the URL input or browsing suggested articles?"

**Action**: Optimize homepage ad placement based on click density.

---

## Timeline

- **Immediately**: Data collection starts after enabling
- **A few hours**: Enough data for basic click patterns
- **1-2 days**: Meaningful scrollmap data (~100+ sessions needed)
- **1 week**: Statistically reliable patterns for optimization decisions

---

## Cost Impact

| Metric | Value |
|--------|-------|
| Extra events | ~0 (heatmap data = metadata on existing collection) |
| Extra cost | ~$1-2/month |
| Budget impact | $140 → $142/month at 30K DAU |

Heatmaps do NOT generate discrete events. They attach coordinate data to the existing heatmap collection pipeline. With `autocapture: false` in code, no autocapture events are sent.

---

## Troubleshooting

### "No heatmap data" after enabling
- Ensure **"Enable autocapture for web"** is ON in project settings
- Verify `enable_heatmaps: true` is in your PostHog init config
- Wait at least a few hours for data to accumulate

### Toolbar doesn't appear on site
- Check that your domain is added to authorized URLs in Toolbar settings
- Try clearing browser cache or using incognito mode
- Ensure PostHog JS is loading (check Network tab for `posthog` requests)

### Heatmap shows no clicks on a specific element
- The element might be inside an iframe (PostHog can't track inside iframes)
- The element might be dynamically rendered after page load — heatmap may need more data
