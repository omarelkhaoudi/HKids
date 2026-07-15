import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || (import.meta.env.PROD ? 'production' : 'development');
const SENTRY_RELEASE = import.meta.env.VITE_SENTRY_RELEASE || `hkids-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`;
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.2');
const SENTRY_REPLAYS_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SAMPLE_RATE || '0.1');

let initialized = false;

export function initSentry() {
  if (initialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    replaysSessionSampleRate: SENTRY_REPLAYS_SAMPLE_RATE,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
      }
      return event;
    },
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Load failed',
      'Failed to fetch',
      'NetworkError',
    ],
  });

  initialized = true;
}

export function captureException(err, context = {}) {
  if (!initialized) return;
  Sentry.captureException(err, { extra: context });
}

export function captureMessage(message, level = 'info', context = {}) {
  if (!initialized) return;
  Sentry.captureMessage(message, { level, extra: context });
}

export function setUser(user) {
  if (!initialized) return;
  Sentry.setUser(user ? { id: String(user.id), username: user.username } : null);
}

export function addBreadcrumb(breadcrumb) {
  if (!initialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}

export function isEnabled() {
  return initialized;
}

export { Sentry };
