# HKids — Developer Guide

## Prerequisites

- Node.js 18+
- PostgreSQL (local or Supabase)
- npm

## Install

```bash
npm run install:all
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | ≥ 32 characters in production |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `24h`) |
| `CORS_ORIGIN` | Prod | Allowed frontend origin |
| `STRIPE_SECRET_KEY` | Billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Billing | Webhook signing secret |
| `REDIS_URL` | No | Optional parent dashboard cache |
| `NODE_ENV` | No | `development`, `test`, `production` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Prod | API base URL (e.g. `https://api.example.com/api`) |

## Run locally

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Windows helper: `scripts/windows/start-dev.ps1`

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run ci
npm run build
```

## Architecture overview

- **Frontend**: React 18 + Vite + Tailwind + custom i18n (`LanguageContext`)
- **Backend**: Express REST API + PostgreSQL
- **Auth**: JWT Bearer tokens, role-based (`parent`, `kid`, `admin`)
- **Offline**: Service worker + IndexedDB + cloud sync
- **Billing**: Stripe checkout, webhooks, customer portal

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Testing strategy

| Layer | Tool | Location |
|-------|------|----------|
| Backend unit/integration | Node test runner + supertest | `backend/tests/` |
| Frontend unit | Vitest + jsdom | `frontend/src/**/__tests__/` |
| E2E | Playwright | `e2e/` |

Critical paths covered: health/auth validation, admin permissions, privacy/GDPR, Stripe webhooks, offline sync utils, voice navigation, security headers, smoke routes.

## Admin access

- URL: `/admin/login`
- Permissions are granular (`support.read`, `content.read`, etc.)
- See [ADMIN_PANEL.md](./ADMIN_PANEL.md)

## Production checklist

1. Set strong `JWT_SECRET` and Stripe keys
2. Configure `CORS_ORIGIN` and `VITE_API_URL`
3. Run `npm run ci` and `npm run test:e2e`
4. Review [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
5. Review [STRIPE_PRODUCTION.md](./STRIPE_PRODUCTION.md)

## Contributing

- Match existing code style and file layout
- Reuse components and APIs — avoid duplicates
- Add tests for new routes and critical UI flows
- Keep FR/EN/AR translations in `frontend/src/utils/translations.js`
