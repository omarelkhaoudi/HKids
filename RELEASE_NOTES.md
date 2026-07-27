# HKids — Release Notes

**Version:** `v1.0.0` (Release Candidate — maintenance mode)  
**Date:** July 27, 2026  
**Latest commit:** `184a491` — RC remediation (security, offline, premium gating, demo polish)  
**Status:** Entering **maintenance mode** while API integrations (OpenAI, ElevenLabs) and the AI Agents platform are prepared.

---

## Executive Summary

HKids is a multilingual children's reading platform (FR / EN / AR) with kids, parent, and admin experiences; premium subscriptions; offline reading; Android kiosk support; and AI-assisted story generation and voice features.

After the production-readiness audit and RC remediation pass, the platform is **~88% production-ready** (up from ~73% pre-remediation). It is **ready for controlled online web partner demos** and **staged production deployment** once environment secrets and third-party API keys are configured. Android kiosk / offline tablet demos require field validation on target hardware.

---

## Major Sprints (chronological)

| Sprint | Commit theme | Highlights |
|--------|--------------|------------|
| **Library expansion** | `feat: add 100 premium books…` | 277-title catalog; premium tier content |
| **Kids Mode polish** | `polish: make Kids Mode a true non-reader pictogram experience` | Pictogram-first navigation, age filtering |
| **Kids Library** | `polish: elevate Kids Library into a premium discovery experience` | Discovery UX, unified age-group model |
| **Parent Control Center** | `feat: add Advanced Parent Control Center…` | Screen time, categories, themes, kid permissions |
| **Educational Worlds** | `feat: add Educational Worlds with paths, challenges…` | Learning paths, parent progress visibility |
| **Personalization** | `feat: add Intelligent Personalization Engine for Kids Home` | Surface-aware recommendations |
| **Learning Universe** | `feat: add Learning Universe Explorer…` | Games, quizzes, rewards |
| **Premium ecosystem** | `feat: add Premium subscription ecosystem…` | Stripe, packs, discovery, paywall UI |
| **Content delivery** | `feat: add live content delivery with catalog versioning` | Catalog versioning, update banners |
| **RC1 polish** | `chore: polish HKids for v1.0 release candidate` | QA fixes, demo readiness |
| **Multilingual** | `feat: complete FR/EN/AR multilingual platform with RTL polish` | 2,296 i18n keys, RTL layout |
| **Offline upgrade** | `feat: upgrade offline mode with smart downloads and cache control` | Download queue, IndexedDB, sync bridge |
| **Android kiosk** | `feat: complete Android production kiosk for dedicated tablets` | Lock Task, device owner, boot recovery |
| **Production catalog** | `feat: complete production catalog with metadata, search…` | Full catalog metadata, search, recommendations |
| **Unified discovery** | `feat: unify discovery and recommendations across all kid surfaces` | Shared recommendation engine |
| **Premium contract** | `feat: unify premium contract and feature flag access` | Consistent backend/frontend premium gating |
| **Catalog audio** | `chore: add generated catalog audio assets` | Multilingual audio for catalog titles |
| **RC remediation** | `fix: RC remediation — security, offline, premium gating…` | P0/P1 audit blockers closed (this release) |

---

## Completed Features

### Kids experience
- Pictogram-first home with mascot « Le Lit », thematic categories, and personalized recommendations
- Library, book reader (pages, audio, TTS, favorites, reading preferences)
- Audio hub (comptines and narrated content)
- Learning Universe: quizzes, memory games, scoring, rewards
- AI Story Studio and generated-stories gallery
- Voice assistant (keyword navigation + conversational mode)
- Family voice messages from parents
- Bottom navigation, category browsing, medals / achievements
- Cloud sync: favorites, history, progress, offline downloads

### Parent experience
- Signup/login, kid profiles, child accounts
- Dashboard: analytics, reading goals, screen time, activity
- Parental controls: schedules, limits, content categories, themes, premium gating
- Category approvals, family voice cloning (ElevenLabs), voice messages
- Privacy center (GDPR export, deletion, audit log)
- Support tickets, subscription management (Stripe)
- Dedicated-tablet / kiosk configuration from parent dashboard

### Admin experience
- Full admin panel: CMS (books, categories), quiz/game management, users
- Moderation, reports, support tickets, subscriptions
- Statistics, audit log, granular RBAC permissions
- Catalog and content delivery management

### Platform & infrastructure
- JWT multi-role auth (parent / kid / admin) with bcrypt-12 and security audit log
- REST API with rate limiting, security headers, upload validation
- Premium subscription contract (Stripe checkout, webhooks, idempotency)
- Unified recommendation engine (backend scoring + frontend sections)
- PWA offline: service worker, IndexedDB, smart downloads, catalog versioning
- AI abstraction layer: OpenAI, Gemini, Anthropic providers; story generation, assistant, recommendations
- Voice stack: ElevenLabs TTS, STT, cloning; family voices and narrations
- i18n FR / EN / AR (2,296 keys with parity)
- Sentry observability with consent gating and PII scrubbing
- Android Capacitor build with production kiosk (Lock Task, device owner, boot receiver)
- CI: lint, typecheck, unit tests (backend 147, frontend 175), build

---

## RC Remediation (July 2026)

### P0 — Security & mobile blockers (resolved)

| Item | Fix |
|------|-----|
| Open admin self-signup on Vercel | Removed `ADMIN_SIGNUP_ENABLED` from `vercel.json`; prod must set `ADMIN_SIGNUP_ENABLED=false` |
| Premium content API bypass | `bookAccessService.js` enforces premium on list, detail, and `/uploads/books/*` asset routes |
| Offline reading broken on Android | Full book + page assets in IndexedDB; reader resolves offline blobs when network unavailable |
| `VITE_API_URL` unset on native builds | `validate-native-env.mjs` gates `android:release` / `android:bundle` |
| Catalog “apply update” metadata-only | `applyCatalogUpdate()` enqueues pack/book downloads |
| PDF.js worker from CDN | Worker bundled via Vite `?url` import (offline + CSP safe) |
| Weak default kiosk exit code | No default in bundle; 6–8 digit codes generated on first kiosk enable |

### P1 — Demo polish & hardening (resolved)

| Item | Fix |
|------|-----|
| Missing `premiumLocked` i18n key | Added FR/EN/AR + ErrorBoundary and parental restriction keys |
| Stale token renders protected routes | AuthContext waits for `/auth/me` before `loading=false` |
| Admin permissions fail-open | AdminDashboard fails closed on permission load error |
| Skip-link target missing | `#main-content` on kids, parent, and admin shells |
| `users.role` defaults to `admin` | Default changed to `parent` |
| `past_due` grants premium | Restricted to `active` / `trialing` subscriptions |
| Kid favorites/history skip premium | Parental + premium checks on favorites and history |
| Per-IP rate limit only | Per-username login lockout (5 attempts / 15 min) |
| Upload path traversal | `path.basename()` + reject `..` on book asset routes |
| Sync queue bloat | Synced mutations deleted instead of retained |
| Download queue not resumed | `resumePausedDownloads()` on app boot via OfflineSyncBridge |

### Validation (post-remediation)

| Suite | Result |
|-------|--------|
| Backend `npm test` | **147/147 passed** |
| Frontend `npm test -- --run` | **175/175 passed** |
| Root `npm run typecheck` | **Passed** |
| Frontend `npm run build` | **Passed** |
| Playwright e2e | Not re-run in remediation pass (specs exist under `e2e/`) |

---

## Production Readiness

| Domain | Score | Notes |
|--------|-------|-------|
| Security & auth | **~85%** | P0 signup/premium bypass fixed; Redis rate limiting still recommended for serverless scale |
| Core workflows (web) | **~92%** | Auth, library, reader, recommendations, parent/admin journeys validated |
| Kids / parent / admin UX | **~88%** | Strong shells; minor i18n gaps in AudioPlayer, BookDetails |
| Offline / Android | **~78%** | Offline path implemented; field-test on dedicated tablets recommended |
| Localization (FR/EN/AR) | **~90%** | Key parity restored; reader TTS voice selection still French-biased |
| Accessibility | **~82%** | Skip links added; explore tabs lack full WAI-ARIA tab semantics |
| Performance | **~82%** | Lazy routes, chunk splitting; `heavy` chunk ~445 KB (pdfjs + tesseract) |
| Tests / CI | **~90%** | 322 unit tests green; e2e not run in final pass |

**Overall: ~88%** — suitable for **staged web production** and **controlled partner demos**. Full public launch and Android kiosk fleet deployment should wait for P2 backlog triage and E2E validation.

### Partner demo verdict

| Demo type | Ready? | Conditions |
|-----------|--------|------------|
| Web partner demo (online) | **Yes** | Staging or prod with secrets configured; active parent subscription for premium showcase |
| Multilingual (EN/AR) demo | **Yes** | FR most polished; verify locale on reader TTS |
| Premium / subscription showcase | **Yes** | P0-2 fixed; ensure Stripe test/live keys configured |
| Android dedicated-tablet / kiosk | **Partial** | Provision device owner; field-test offline read cycle |
| Accessibility-focused review | **Partial** | Skip links present; tab semantics and admin FR remain |

---

## Remaining P2 Items (maintenance backlog)

These are **non-blocking** for staged launch but should be tracked during maintenance:

- Hardcoded French in `AudioPlayer.jsx`, `BookDetails.jsx` subscription toasts, `KidsLearning.jsx` errors
- Recommendation fallback section titles in English (`recommendationEngine.js`)
- Reader TTS/narration French-only voice selection (`BookReader.jsx`)
- `unlockBook` called on every reader open (should be on explicit start only)
- Single global `ErrorBoundary`; no route-level recovery
- Wildcard route silently redirects home (`App.jsx`)
- Explore tabs lack WAI-ARIA tab semantics
- `getOfflineBlobUrl` object URLs not always revoked (memory on long tablet sessions)
- Redis-backed rate limiting for serverless (currently in-memory per instance)
- Android `versionCode` CI bump and required release keystore in CI
- 1,200+ ESLint warnings (mostly `no-unused-vars`)
- Documentation drift in `docs/ANDROID_RELEASE_REPORT.md` vs current kiosk implementation (exit code length)
- Playwright e2e suite not executed in final remediation pass

---

## Deployment Prerequisites

### Required environment variables

**Backend** (`backend/.env` or Vercel project env):

```env
NODE_ENV=production
JWT_SECRET=<strong-random-32+chars>
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://...?sslmode=require
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Storage (required on Vercel — no local disk)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET=hkids-books

# Stripe (subscriptions)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Security — MUST be false in production
ADMIN_SIGNUP_ENABLED=false
# Optional one-time bootstrap only:
# ADMIN_SIGNUP_CODE=<strong-random-code>
```

**Frontend** (Vercel or build env):

```env
VITE_API_URL=https://your-api.vercel.app/api
VITE_SENTRY_DSN=          # optional
```

**Native Android release** (CI or local):

```env
VITE_API_URL=https://your-api.vercel.app/api   # required — build fails if unset
# Optional kiosk:
VITE_ANDROID_KIOSK_IDLE_MS=600000
VITE_KIOSK_AUTO_ENABLE=false
```

### Deployment checklist

1. **Database:** PostgreSQL 12+ (Neon, Supabase, Render, etc.). Tables auto-initialize on first backend start.
2. **Backend:** Deploy `backend/` to Vercel (serverless) or Node host. Verify `GET /api/health`.
3. **Frontend:** Deploy `frontend/` to Vercel. Confirm SPA rewrites in `frontend/vercel.json`.
4. **Secrets:** Never commit `.env`. Rotate `JWT_SECRET` and admin password after first deploy.
5. **Admin bootstrap:** Create first admin via controlled signup with `ADMIN_SIGNUP_CODE` once, then disable.
6. **Stripe:** Configure live/test keys, webhook endpoint (`/api/stripe/webhook`), and `stripe_price_id` in DB.
7. **Storage:** Upload book assets to Supabase bucket; verify `/uploads/books/*` serves with premium gating.
8. **Smoke test:** Run `node backend/scripts/qa-db-check.js`; execute `backend/tests/qa/role-journeys.test.js` against staging.
9. **Monitoring:** Set `SENTRY_DSN` on backend and `VITE_SENTRY_DSN` on frontend for production error tracking.

### Commands

```bash
npm run install:all
npm run lint && npm run typecheck && npm run test
cd frontend && npm run build
cd backend && npm test

# Android release (requires VITE_API_URL)
cd frontend && npm run android:release
```

---

## OpenAI Integration

HKids uses a provider abstraction (`backend/services/ai/`). Routes never call OpenAI directly.

### What OpenAI powers

| Feature | Service | API route |
|---------|---------|-----------|
| Personalized story generation | `StoryGenerationService.js` | `POST /api/generated-stories/generate` |
| Voice assistant (conversation) | `voiceAssistantService.js` | `POST /api/ai/assistant` |
| Book recommendations (LLM fallback) | `RecommendationService.js` | Internal / admin |
| Cover image generation | `coverImageService.js` | Admin CMS |
| Transcription (optional) | `OpenAIProvider.js` | When `AI_TRANSCRIPTION_PROVIDER=openai` |

### Configuration steps

1. Create an OpenAI API key at [platform.openai.com](https://platform.openai.com).
2. Set backend environment variables:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MAX_RETRIES=2
OPENAI_CACHE_TTL_MS=300000
OPENAI_MAX_CACHE_ENTRIES=200
AI_TIMEOUT_MS=20000
AI_MAX_RETRIES=2
```

3. Restart the backend. Verify with a test story generation from Kids Story Studio or `POST /api/generated-stories/generate`.
4. **Without `OPENAI_API_KEY`:** Assistant and story features run in **demo mode** (template responses). UI remains functional for partner demos.

### Alternative providers

Set `AI_PROVIDER=gemini` or `AI_PROVIDER=anthropic` with corresponding keys. Anthropic does not support audio transcription natively — set `AI_TRANSCRIPTION_PROVIDER=openai` or `elevenlabs`.

See `docs/AI_ABSTRACTION_ARCHITECTURE.md` for architecture details.

---

## ElevenLabs Integration

ElevenLabs powers family voice cloning, narrations, TTS for the voice assistant, and optional speech-to-text.

### What ElevenLabs powers

| Feature | Location | API route |
|---------|----------|-----------|
| Parent voice cloning | `FamilyVoices.jsx` | `POST /api/voices/profiles` |
| Family voice messages | `KidsFamilyMessages.jsx` | `POST /api/voices/messages` |
| Book narrations | Voice narrations table | `POST /api/voices/narrate` |
| Assistant TTS | `voiceAssistantService.js` | `POST /api/ai/speak` |
| Speech-to-text (optional) | `ai.js` routes | When `AI_TRANSCRIPTION_PROVIDER=elevenlabs` |

### Configuration steps

1. Create an ElevenLabs API key at [elevenlabs.io](https://elevenlabs.io).
2. Set backend environment variables:

```env
VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1
ELEVENLABS_MODEL=eleven_multilingual_v2
ELEVENLABS_STT_MODEL=scribe_v1
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
ELEVENLABS_MAX_RETRIES=2
ELEVENLABS_MONTHLY_CHARACTER_LIMIT=200000
ELEVENLABS_MONTHLY_STT_BYTES_LIMIT=104857600

# Default assistant voices (ElevenLabs voice IDs per locale)
ELEVENLABS_DEFAULT_VOICE_ID=
ELEVENLABS_DEFAULT_VOICE_FR=
ELEVENLABS_DEFAULT_VOICE_EN=
ELEVENLABS_DEFAULT_VOICE_AR=

# Optional: use ElevenLabs for STT when main AI provider lacks audio
AI_TRANSCRIPTION_PROVIDER=elevenlabs
```

3. Restart the backend.
4. From the parent dashboard → **Voix familiales**: record consent audio, create a voice profile, send a test message to a kid profile.
5. **Without `ELEVENLABS_API_KEY`:** Voice cloning UI is visible but profile creation fails gracefully. Browser TTS fallback may apply for assistant speech.

### Privacy & consent

Voice cloning requires explicit parental consent recorded in the app. Uploaded samples are stored securely; deletion is available from the parent privacy center. See `docs/PRIVACY_SECURITY.md`.

---

## Android Kiosk Prerequisites

HKids supports two kiosk levels: **supervised** (screen pinning) and **dedicated** (device owner + Lock Task). See `docs/ANDROID_KIOSK.md` for full documentation.

### Before provisioning

| Requirement | Details |
|-------------|---------|
| **Signed release APK/AAB** | `cd frontend && npm run android:release` (requires `VITE_API_URL`) |
| **Release keystore** | Configure in `frontend/android/app/build.gradle`; do not ship debug builds to schools |
| **Factory-reset tablet** | No Google or other accounts — required for `dpm set-device-owner` |
| **Unique kiosk exit code** | Generated automatically (6–8 digits) on first kiosk enable; configure in parent dashboard |
| **Parent account** | Log in before enabling kiosk; kid profile seeded for demo |
| **Offline content** | Pre-download books via parent dashboard; verify offline read after Wi‑Fi drop |

### Device owner provisioning

**ADB (workshop):**

```powershell
cd frontend\android\kiosk
.\provision-device-owner.ps1 -ApkPath ..\app\build\outputs\apk\release\app-release.apk
```

**QR code (fleet deployment):** Edit `frontend/android/kiosk/qr-provisioning.json` with APK URL and signing cert checksum, encode as QR, scan on factory-reset tablet (tap home screen 6 times).

### Post-provisioning validation matrix

- [ ] `adb reboot` → HKids launches alone in Lock Task
- [ ] Home, Recents, Settings have no effect
- [ ] Status bar and keyguard disabled
- [ ] APK update (`adb install -r`) → app relaunches in Lock Task
- [ ] Long-press corner (3 s) + parent exit code → returns to Android
- [ ] 3 wrong codes → 30 s lockout
- [ ] 30 min audio playback without screen off (wake lock)
- [ ] Offline read of a pre-downloaded book after disabling Wi‑Fi

### Kiosk exit (post-remediation)

- Default code `1379` **removed** from production bundle
- Codes are **6–8 digits**, generated on first `enableKiosk()`
- Parent configures code in dashboard → **Tablette dédiée**
- `VITE_KIOSK_EXIT_CODE` is for development only — never ship a known code in production builds

### References

- `docs/ANDROID_KIOSK.md` — provisioning, policies, recovery
- `docs/ANDROID_CAPACITOR.md` — Capacitor build workflow
- `docs/KIOSK_MODE.md` — JS API overview
- `frontend/android/kiosk/` — provisioning scripts

---

## Maintenance Mode

As of this release, **HKids feature development is paused**. Ongoing work is limited to:

- Critical security fixes and dependency updates
- OpenAI and ElevenLabs API key configuration and smoke testing
- Android kiosk field validation on partner hardware
- P2 backlog triage as capacity allows

New platform investment shifts to the **AI Agents platform**. HKids remains deployable and demo-ready on the web with proper environment configuration.

---

## References

| Document | Purpose |
|----------|---------|
| `docs/DEPLOYMENT.md` | Deployment guide |
| `docs/PRODUCTION_READINESS.md` | Readiness checklist |
| `docs/CHANGELOG_RC1.md` | RC1 feature and bug list |
| `docs/STRIPE_PRODUCTION.md` | Stripe live setup |
| `docs/AI_ABSTRACTION_ARCHITECTURE.md` | AI provider layer |
| `docs/PRIVACY_SECURITY.md` | GDPR and security |
| `docs/CONTENT_CATALOG.md` | Catalog structure |
| `backend/env.example` | Full environment variable reference |

---

*Generated at RC remediation completion — July 27, 2026.*
