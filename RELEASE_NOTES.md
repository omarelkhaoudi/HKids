# HKids v1.0 — Release Notes

**Product:** HKids / Le Lit Qui Lit  
**Version:** `1.0.0`  
**Date:** 25 July 2026  
**Status:** Production polish / release candidate for demonstration

This release consolidates the reading, learning, premium, and live-content delivery platforms into a polished, offline-capable, multilingual experience ready for partner demos and staged deployment.

---

## Highlights since RC1

### Learning & discovery
- **Educational Worlds** — themed paths, challenges, XP, badges, parent progress panel
- **Personalization Engine** — dynamic Kids Home shelves, continue rail, favorites collections, achievement strip
- **Learning Universe / Explorer** — immersive `/kids/explore` hub, mini-games, post-story quizzes, daily rewards, avatars

### Premium subscription ecosystem
- Config-driven **premium packs** (dinosaurs, space, seasonal, AI stories, …)
- Kids **Premium discovery** page with locked / preview / unlock CTAs
- Centralized **feature flags** (AI stories, seasonal packs, games, narrators, …)
- Improved **Subscriptions** UX (Free vs Premium comparison, restore purchases)
- Parent premium panel + admin pack management (publish / feature / archive)

### Content delivery & live updates
- **Catalog versioning** (`v1.0.0` → patch/minor/major) with changelog and package size
- Startup **update detection** with non-forced “New stories available” banner
- **Downloadable content packs** with pause / resume / cancel, progress %, ETA
- Incremental downloads (reuse unchanged assets) and **safe local rollback**
- Parent **storage & update history**; admin **catalog versions** UI (publish / rollback / schedule)

### Platform quality
- Offline-first library, sync bridge, parental policy cache
- FR / EN / AR translations aligned; RTL via global `dir` on `html`/`body`
- Accessibility: focusable CTAs, ARIA progressbars on downloads, touch targets
- Dead-code cleanup (orphan components, unused imports)
- Fixed stale unit expectation for kid profile payload

---

## Surfaces

| Audience | Routes / areas |
|----------|----------------|
| Kids | `/kids`, library, explore, learning, audio, premium, AI stories, reader |
| Parent | `/parent`, control center, voices, subscriptions, privacy, content delivery |
| Admin | `/admin/*` CMS, learning, moderation, subscriptions, premium packs, catalog versions |
| Auth | Parent / admin login & signup |

---

## Validation (v1.0 polish)

| Check | Result |
|-------|--------|
| Frontend typecheck | Pass |
| Frontend unit tests | Pass (148) |
| Backend tests | Pass (131) |
| Frontend production build | Pass |
| Catalog versioning tests | Pass (create / publish / rollback / archive / schedule) |

---

## Production readiness checklist

- [x] Core kid / parent / admin journeys functional
- [x] Offline downloads + sync bridge
- [x] Premium discovery + gating helpers
- [x] Catalog version publish / rollback path
- [x] Stripe subscription flows documented (`docs/STRIPE_PRODUCTION.md`)
- [x] Env examples updated (`backend/env.example`, `frontend/.env.example`)
- [x] README + release notes current
- [ ] Production secrets rotated (`JWT_SECRET`, Stripe live keys, admin seed password)
- [ ] `ADMIN_SIGNUP_ENABLED=false` after onboarding
- [ ] Sentry DSNs configured for frontend + backend
- [ ] Android release signed with production keystore (`docs/ANDROID_CAPACITOR.md`)
- [ ] Partner demo data seeded (`npm run seed:catalog` in backend)
- [ ] Smoke-test FR / EN / AR + RTL on tablet viewport

---

## Upgrade notes

1. Pull `main` and run `npm run install:all`.
2. Apply `backend/env.example` additions (`CATALOG_VERSIONS_PATH`, rate-limit vars if customizing).
3. Catalog versions persist under `backend/data/` (gitignored) or `CATALOG_VERSIONS_PATH`.
4. No database migration required for catalog versioning (file-backed store).
5. Rebuild frontend (`npm run build`) before Capacitor sync.

---

## Related docs

- [docs/CHANGELOG_RC1.md](./docs/CHANGELOG_RC1.md) — prior RC1 baseline
- [docs/PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/CLOUD_SYNC.md](./docs/CLOUD_SYNC.md)
- [docs/CONTENT_CATALOG.md](./docs/CONTENT_CATALOG.md)
