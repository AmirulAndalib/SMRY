# PostHog Setup Guide — SMRY

Step-by-step guide to set up PostHog analytics for SMRY.

---

## 1. Create a PostHog Project

1. Sign up at [posthog.com](https://posthog.com)
2. Create a new project (e.g., "SMRY" or "SMRY Production")
3. Choose your region: **US** (`us.i.posthog.com`) or **EU** (`eu.i.posthog.com`)

## 2. Get Your Project API Key

1. Go to **Project Settings** (gear icon in sidebar)
2. Copy the **Project API Key** — starts with `phc_`

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## 3. Set Environment Variables

Only 2 env vars needed (client-side only — no server-side PostHog SDK):

| Variable | Value | Where to find |
|----------|-------|---------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` | Project Settings -> Project API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Project Settings -> under API Key |

## 4. Verify Your Setup

After setting env vars:

```bash
bun dev
```

1. Open the app in your browser
2. Open DevTools -> Network tab -> filter by `posthog`
3. You should see batch requests to `i.posthog.com`
4. In PostHog: **Activity -> Live Events** — you should see `article_loaded` events (note: `$pageview` is disabled, DataBuddy handles visitor tracking)

---

## Railway Deployment

Set these 2 env vars in your Railway service settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No events in PostHog | Missing or wrong `NEXT_PUBLIC_POSTHOG_KEY` | Check Project Settings for the correct `phc_` key |
| Client events missing | `NEXT_PUBLIC_` prefix missing | Must be prefixed with `NEXT_PUBLIC_` for Next.js |
| `eu.i.posthog.com` 403 | Using US key with EU host | Match host region to where you created the project |
| No user identification | Clerk not loaded | Check Clerk is initialized before PostHog identify runs |
