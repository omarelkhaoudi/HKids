# HKids — Production Readiness

Date : 10 juillet 2026

## Statut global

| Domaine | Statut | Détails |
|---------|--------|---------|
| Tests unitaires backend | OK | admin, privacy, stripe, parental, audio |
| Tests intégration API | OK | health, auth validation, headers, 404 |
| Tests unitaires frontend | OK | Vitest sur utils critiques |
| Tests E2E | OK | Playwright smoke (home, login, offline) |
| CI GitHub Actions | OK | `.github/workflows/ci.yml` |
| ESLint | OK | Flat config racine |
| TypeScript check | OK | `tsc --noEmit` (allowJs, checkJs off) |
| Bundle optimisé | OK | Code splitting Vite (~374 kB main chunk) |
| Code mort supprimé | OK | `api.js`, `EmptyState.jsx`, fallback upload |
| Sécurité | OK | Headers, rate limit, JWT, permissions épurées Android |
| Documentation | OK | Ce document + guides existants |

## Commandes production

```bash
# Installation complète
npm run install:all

# Qualité
npm run lint
npm run typecheck
npm run test
npm run test:e2e

# CI locale
npm run ci

# Build
npm run build
```

## Tests

### Backend (`backend/tests/`)

- **Unitaires** : permissions admin, Stripe webhook, privacy/GDPR, âge parental, validation audio
- **Intégration** : `integration/api.test.js` via supertest (sans démarrage serveur)

Variables test :

```bash
NODE_ENV=test
SKIP_SERVER_START=1
```

### Frontend (`frontend/src/**/__tests__/`)

- Vitest + jsdom
- Utils : `buildApiUrl`, profils enfant, bibliothèque contenu

### E2E (`e2e/`)

- Playwright contre `vite preview`
- Smoke : accueil, login parent, page offline

## CI Pipeline

Déclenché sur `push` et `pull_request` vers `main` :

1. **backend** — tests + `npm audit`
2. **frontend** — lint, typecheck, tests, build + audit
3. **e2e** — Playwright smoke (après frontend)

## Sécurité production

| Contrôle | Implémentation |
|----------|----------------|
| JWT | Secret ≥ 32 chars en prod |
| Headers | X-Frame-Options, nosniff, HSTS HTTPS |
| Rate limiting | Auth + API + privacy sensible |
| CORS | Whitelist production |
| Uploads | Pas de fallback fichier manquant |
| Android | Permissions minimales, backup désactivé |
| Privacy | Export/suppression RGPD, purge locale |

## Optimisations bundle

- Lazy routes : Admin, Parent, BookReader, IA, Voices
- Chunks : react, motion, capacitor, heavy (pdf/tesseract), vendor
- Service Worker désactivé sur natif Capacitor

## Variables obligatoires production

### Backend

```bash
JWT_SECRET=<32+ chars>
DATABASE_URL=<postgres>
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.example.com
```

### Frontend / Android

```bash
VITE_API_URL=https://your-backend.example.com
```

## Checklist déploiement

- [ ] `npm run ci` vert en local
- [ ] Secrets configurés (JWT, DB, Stripe, API keys)
- [ ] `VITE_API_URL` défini au build frontend
- [ ] Keystore Android pour release
- [ ] JDK 21 pour build Gradle
- [ ] Monitoring erreurs (Sentry ou équivalent) — optionnel
- [ ] Sauvegardes base de données
- [ ] Politique de confidentialité accessible

## Risques résiduels

| Risque | Priorité | Action |
|--------|----------|--------|
| Rate limit mémoire (multi-instance) | Moyenne | Redis rate limiter |
| JWT localStorage (XSS) | Moyenne | Documenté ; httpOnly cookies futur |
| Couverture routes API partielle | Moyenne | Étendre tests intégration avec DB test |
| CSP non configurée | Basse | Ajouter Content-Security-Policy |
| JDK 25 incompatible Gradle | Haute (dev) | Utiliser JDK 21 LTS |

## Références

- [ANDROID_CAPACITOR.md](./ANDROID_CAPACITOR.md)
- [ANDROID_RELEASE_REPORT.md](./ANDROID_RELEASE_REPORT.md)
- [PRIVACY_SECURITY.md](./PRIVACY_SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
