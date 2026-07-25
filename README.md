# HKids — Le Lit Qui Lit

HKids is a production-ready kids learning and reading platform (FR / EN / AR) with immersive stories, educational worlds, premium packs, offline-first sync, and parent/admin controls.

## Product highlights

- **Kids experience** — Home, library, explore, audio, AI stories, learning quizzes/games, premium discovery
- **Educational Worlds** — Themed learning paths, challenges, XP and badges
- **Personalization** — Smart shelves, continue rail, favorites, achievement strip
- **Learning Universe** — Explorer hub with mini-games, quizzes, daily rewards
- **Premium ecosystem** — Subscription plans, themed packs, feature flags, Free vs Premium comparison
- **Content delivery** — Catalog versioning, live updates without app releases, downloadable packs, safe rollback
- **Offline-first** — IndexedDB downloads, mutation queue, cloud sync, parental policy cache
- **Parent space** — Dashboard, control center, privacy, voices, subscriptions, storage & update history
- **Admin** — CMS, learning content, moderation, subscriptions, premium packs, catalog versions
- **Platforms** — Web (Vite) + Android (Capacitor)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router, Tailwind, Framer Motion |
| Backend | Node.js, Express, PostgreSQL, JWT |
| Payments | Stripe (checkout, portal, webhooks) |
| Offline | IndexedDB, service worker (web), Capacitor Network |
| i18n | FR / EN / AR with RTL |

## Repository layout

```
HKids/
├── frontend/          # React app (Vite + Capacitor)
├── backend/           # Express API + content seed
├── docs/              # Architecture, deploy, product docs
├── scripts/windows/   # Local start helpers
├── RELEASE_NOTES.md   # v1.0 release summary
└── README.md
```

## Quick start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or a hosted `DATABASE_URL`)

### Install

```bash
npm run install:all
```

### Configure

```bash
cp backend/env.example backend/.env
# Set DATABASE_URL, JWT_SECRET, CORS_ORIGIN / FRONTEND_URL
# Optional: Stripe, AI, Sentry, Redis — see backend/env.example

cp frontend/.env.example frontend/.env.local
# Optional locally (Vite proxies /api). Required for Android: VITE_API_URL
```

### Run

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Or on Windows: `scripts/windows/start.ps1`

- App: http://localhost:5173  
- API: http://localhost:3000  
- Admin login: `/admin/login`

Seed demo catalog (optional):

```bash
cd backend
npm run seed:catalog
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install root + backend + frontend deps |
| `npm run dev:backend` / `dev:frontend` | Local servers |
| `npm run build` | Production frontend build |
| `npm test` | Backend + frontend tests |
| `npm run typecheck` | TypeScript check |
| `npm run ci` | Lint + typecheck + test + build |

## Environment variables

### Backend (`backend/env.example`)

Core: `PORT`, `NODE_ENV`, `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `FRONTEND_URL`  
Also documented: Stripe, AI providers, voice/TTS, Supabase, Sentry, Redis, rate limits, `CATALOG_VERSIONS_PATH`.

### Frontend (`frontend/.env.example`)

- `VITE_API_URL` — required for Capacitor / production API host  
- `VITE_ANDROID_KIOSK_IDLE_MS` — kiosk idle return  
- `VITE_ADMIN_SIGNUP_CODE` — optional admin signup gate  
- `VITE_APP_VERSION` — release label (Sentry)  
- `VITE_SENTRY_*` — optional monitoring  

## Documentation

| Doc | Topic |
|-----|--------|
| [RELEASE_NOTES.md](./RELEASE_NOTES.md) | v1.0 release summary |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Day-1 setup & contributing |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deploy (Vercel / Render / Fly) |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture |
| [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | REST API |
| [docs/CLOUD_SYNC.md](./docs/CLOUD_SYNC.md) | Offline & cloud sync |
| [docs/CONTENT_CATALOG.md](./docs/CONTENT_CATALOG.md) | Catalog seed |
| [docs/STRIPE_PRODUCTION.md](./docs/STRIPE_PRODUCTION.md) | Subscriptions |
| [docs/ANDROID_CAPACITOR.md](./docs/ANDROID_CAPACITOR.md) | Android builds |
| [docs/PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md) | Go-live checklist |

## License

MIT
