import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || `hkids-backend@${process.env.npm_package_version || '1.0.0'}`;
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2');

let initialized = false;

export function initSentry() {
  if (initialized || !SENTRY_DSN) {
    if (!SENTRY_DSN && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  SENTRY_DSN is not set — Sentry monitoring is disabled');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    profilesSampleRate: 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.postgresIntegration(),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
    ignoreErrors: [
      'ECONNRESET',
      'EPIPE',
      'Not allowed by CORS',
    ],
  });

  initialized = true;
  console.log(`✅ Sentry initialized (env=${SENTRY_ENVIRONMENT})`);
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
  Sentry.setUser(user ? { id: String(user.id), username: user.username, role: user.role } : null);
}

export function addBreadcrumb(breadcrumb) {
  if (!initialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}

export function startSpan(name, op, callback) {
  if (!initialized) return callback();
  return Sentry.startSpan({ name, op }, callback);
}

export function isEnabled() {
  return initialized;
}

export { Sentry };
