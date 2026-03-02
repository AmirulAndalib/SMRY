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
3. This is used for both server-side and client-side SDKs

```bash
POSTHOG_API_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here  # same key
```

## 3. Get Your Host URL

The host URL is shown under the API key in Project Settings.

```bash
POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## 4. Get Your Project ID

1. Look at your browser URL bar when inside your PostHog project
2. The URL looks like: `https://us.posthog.com/project/12345/...`
3. The number (`12345`) is your Project ID

```bash
POSTHOG_PROJECT_ID=12345
```

## 5. Create a Personal API Key

This is required for HogQL queries (admin dashboard).

1. Click your **user avatar** (bottom-left) → **Personal API Keys**
2. Click **Create Personal API Key**
3. Name it (e.g., "SMRY Server")
4. Under **Scopes**, enable **Query → Read**
5. Click **Create Key** and copy it — starts with `phx_`

```bash
POSTHOG_PERSONAL_API_KEY=phx_your_key_here
```

> The Personal API Key is only shown once. Store it securely.

## 6. Verify Your Setup

After setting all env vars, verify everything works:

```bash
# Start the server
bun dev

# Check health endpoint
curl http://localhost:3001/health

# Check admin endpoint (requires ADMIN_SECRET)
curl -H "Authorization: Bearer $ADMIN_SECRET" http://localhost:3001/api/admin
```

In PostHog, go to **Activity → Live Events** — you should see `request_event` entries appearing.

---

## Railway Deployment

Set all six env vars in your Railway service settings:

| Variable | Value |
|----------|-------|
| `POSTHOG_API_KEY` | `phc_...` |
| `POSTHOG_HOST` | `https://us.i.posthog.com` |
| `POSTHOG_PROJECT_ID` | Your numeric project ID |
| `POSTHOG_PERSONAL_API_KEY` | `phx_...` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Same as `POSTHOG_API_KEY` |
| `NEXT_PUBLIC_POSTHOG_HOST` | Same as `POSTHOG_HOST` |

> Railway injects `PORT` automatically. The Elysia server reads `API_PORT` with a fallback to `PORT`, so no extra config is needed.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No events in PostHog | Missing or wrong `POSTHOG_API_KEY` | Check Project Settings for the correct `phc_` key |
| Admin dashboard returns empty arrays | Missing `POSTHOG_PERSONAL_API_KEY` | Create a Personal API Key with Query Read scope |
| Admin dashboard 500 errors | Wrong `POSTHOG_PROJECT_ID` | Check URL bar in PostHog for the numeric ID |
| Client-side events missing | `NEXT_PUBLIC_` vars not set | These must be prefixed with `NEXT_PUBLIC_` for Next.js |
| Events go to wrong project | Different keys for server/client | Ensure `POSTHOG_API_KEY` and `NEXT_PUBLIC_POSTHOG_KEY` are from the same project |
| HogQL queries timeout | Large time range or complex query | Reduce the `range` query param (e.g., `?range=1h` instead of `7d`) |
| `eu.i.posthog.com` 403 errors | Using US key with EU host (or vice versa) | Match host region to where you created the project |
