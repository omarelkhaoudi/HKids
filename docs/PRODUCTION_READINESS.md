# HKids — Production Readiness

Date : 13 juillet 2026

## Statut global

| Domaine | Statut | Détails |
|---------|--------|---------|
| Tests unitaires backend | OK | 40+ tests (admin, privacy, stripe, parental, audio, support, security) |
| Tests intégration API | OK | health, auth, headers CSP, routes protégées |
| Tests unitaires frontend | OK | Vitest (utils, a11y, offline, voice nav) |
| Tests E2E Playwright | OK | smoke, critical routes, accessibility |
| CI GitHub Actions | OK | `.github/workflows/ci.yml` |
| ESLint | OK | Flat config racine |
| TypeScript check | OK | `tsc --noEmit` |
| Bundle optimisé | OK | Code splitting Vite + lazy Subscriptions |
| Accessibilité | Partiel | skip link, reduced motion, Modal focus trap |
| I18n FR/EN/AR | Partiel | Parcours enfant/parent/abonnements ; admin en FR |
| Sécurité | OK | Headers CSP API, JWT, rate limit, RGPD |
| Documentation | OK | README, DEVELOPER_GUIDE, guides existants |

## Commandes production

```bash
npm run install:all
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run ci
npm run build
```

## Tests

### Backend (`backend/tests/`)

- **Unitaires** : permissions admin, Stripe, privacy/GDPR, parental, audio, support
- **Intégration** : `integration/api.test.js`, `integration/security.test.js`

Variables test :

```bash
NODE_ENV=test
SKIP_SERVER_START=1
```

### Frontend (`frontend/src/**/__tests__/`)

- Vitest + jsdom
- Utils : API URL, profils enfant, offline sync, voice navigation, a11y focus helpers

### E2E (`e2e/`)

- `smoke.spec.js` — accueil, login parent, offline
- `critical-routes.spec.js` — abonnements, admin login, kids redirect, skip link
- `accessibility.spec.js` — landmark main, clavier, reduced motion CSS

## CI Pipeline

1. **backend** — tests + audit
2. **frontend** — lint, typecheck, tests, build + audit
3. **e2e** — Playwright (après frontend)

## Sécurité production

| Contrôle | Implémentation |
|----------|----------------|
| JWT | Secret ≥ 32 chars en prod |
| Headers | nosniff, DENY frame, HSTS, CSP API (`default-src 'none'`) |
| Rate limiting | Auth + API + privacy sensible |
| Dev endpoints | `/api/reset-rate-limit` bloqué en production |
| CORS | Whitelist production |
| Uploads | Validation MIME + taille |
| RGPD | Export, suppression, audit logs |
| CSRF | N/A — SPA Bearer token (documenté) |

## Performance

- Lazy loading : Kids*, Admin, Parent, Subscriptions
- Manual chunks : react, vendor, motion, assistant, heavy, subscriptions
- `React.memo` : `KidsMediaCard`, `BookCard`
- `prefers-reduced-motion` : CSS global + hooks composants

## Reste avant production live

1. Configurer clés Stripe live + `stripe_price_id` en base
2. I18n complète du panneau admin
3. E2E authentifiés avec backend (CI composite)
4. Migration JWT vers httpOnly cookies (optionnel, renforce XSS)
5. Tests charge / monitoring (Sentry, Datadog)

## Avancement estimé

- **Phase 6** : ~88%
- **Projet global** : ~97%
