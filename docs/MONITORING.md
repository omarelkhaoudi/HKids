# HKids — Production Monitoring (Sentry)

## Overview

HKids uses **Sentry** for production error tracking and performance monitoring on both
frontend (React/Vite) and backend (Node.js/Express).

Monitoring is **opt-in**: it activates only when a valid `SENTRY_DSN` (backend) or
`VITE_SENTRY_DSN` (frontend) environment variable is set. Without it, the application
runs identically but without external reporting.

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Frontend (React)           │
│  • React ErrorBoundary → captureException│
│  • BrowserTracing  (navigation + perf)  │
│  • Session Replay (masked, 10 % / 100 %)│
│  • Auth context → Sentry.setUser        │
└────────────────────┬────────────────────┘
                     │  HTTPS
                     ▼
┌─────────────────────────────────────────┐
│              Backend (Express)          │
│  • Express integration (spans per route)│
│  • HTTP integration (outbound requests) │
│  • Postgres integration (query spans)   │
│  • AI logger → Sentry breadcrumbs/errors│
│  • Error handler → captureException     │
│  • uncaughtException / unhandledRejection│
└─────────────────────────────────────────┘
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | _(empty)_ | Sentry project DSN. Leave empty to disable. |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Environment tag (`production`, `staging`, etc.) |
| `SENTRY_RELEASE` | `hkids-backend@<version>` | Release identifier for source map association. |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.2` | % of transactions to send (0.0 – 1.0). |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SENTRY_DSN` | _(empty)_ | Sentry project DSN. Leave empty to disable. |
| `VITE_SENTRY_ENVIRONMENT` | auto (`production`/`development`) | Environment tag. |
| `VITE_SENTRY_RELEASE` | `hkids-frontend@1.0.0` | Release identifier. |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0.2` | % of page-load/navigation transactions. |
| `VITE_SENTRY_REPLAYS_SAMPLE_RATE` | `0.1` | % of sessions to record (Session Replay). |

---

## What is Monitored

### Frontend

| Area | How |
|------|-----|
| **React errors** | `ErrorBoundary.componentDidCatch` → `captureException` |
| **Navigation** | `browserTracingIntegration` traces page loads and route changes |
| **Performance** | Web Vitals (LCP, FID, CLS) captured automatically |
| **Session Replay** | `replayIntegration` records 10 % of sessions, 100 % on error |
| **User context** | `AuthContext` sets/clears Sentry user on login/logout |

### Backend

| Area | How |
|------|-----|
| **Express exceptions** | `setupExpressErrorHandler` + `errorHandler` middleware |
| **API performance** | `expressIntegration` creates spans per route |
| **HTTP calls** | `httpIntegration` traces outbound fetch/http requests |
| **PostgreSQL** | `postgresIntegration` traces `pg` pool queries |
| **AI services** | `aiLogger` sends errors as Sentry exceptions, events as breadcrumbs |
| **Pool errors** | `pool.on('error')` → `captureException` |
| **Uncaught errors** | `uncaughtException` / `unhandledRejection` → `captureException` |

---

## Privacy

- Authorization and Cookie headers are stripped from events (`beforeSend`).
- Session Replay masks all text and blocks all media by default.
- User data sent to Sentry is limited to `id`, `username`, and `role`.

---

## Quick Start

1. Create a Sentry project at https://sentry.io
2. Copy the DSN
3. Set environment variables:

```bash
# Backend
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Frontend
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

4. Deploy — errors and performance data will appear in the Sentry dashboard.

---

## Source Maps

The Vite build is configured with `sourcemap: 'hidden'` so that source maps are
generated but not served to the browser. Upload them to Sentry using:

```bash
npx @sentry/cli sourcemaps upload --release=<RELEASE> ./dist
```

Or use the `@sentry/vite-plugin` for automatic uploads during CI builds.
