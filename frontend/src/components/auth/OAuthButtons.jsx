import { motion } from 'framer-motion';
import { buildApiUrl } from '../../config/api.js';
import { useLanguage } from '../../context/LanguageContext';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-hkids-green" aria-hidden="true">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-hkids-brown" fill="currentColor" aria-hidden="true">
      <path d="M17.63 13.1c-.02-2.22 1.82-3.3 1.9-3.35-1.04-1.52-2.65-1.73-3.21-1.75-1.35-.14-2.66.8-3.35.8-.7 0-1.77-.78-2.91-.76-1.49.02-2.88.89-3.65 2.25-1.56 2.71-.4 6.69 1.1 8.88.75 1.07 1.62 2.26 2.77 2.22 1.12-.05 1.54-.71 2.89-.71 1.34 0 1.73.71 2.91.69 1.21-.02 1.98-1.08 2.7-2.16.86-1.23 1.2-2.44 1.22-2.5-.03-.01-2.35-.9-2.37-3.61z" />
      <path d="M15.44 6.57c.61-.76 1.02-1.79.91-2.83-.88.04-1.98.61-2.62 1.35-.57.66-1.08 1.73-.94 2.73.99.08 2.01-.5 2.65-1.25z" />
    </svg>
  );
}

export function OAuthButtons({ mode = 'login', returnTo = '/parent', className = '' }) {
  const { t } = useLanguage();

  const startOAuth = (provider) => {
    const params = new URLSearchParams({
      role: 'parent',
      mode,
      return_to: returnTo,
    });

    window.location.assign(`${buildApiUrl(`/auth/oauth/${provider}`)}?${params.toString()}`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4 text-sm font-bold text-foreground-muted">
        <div className="h-px flex-1 bg-border" />
        <span>{t('authOr')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => startOAuth('google')}
        className="flex w-full items-center justify-center gap-4 rounded-[1.5rem] bg-primary-50 px-5 py-3.5 text-base font-extrabold text-foreground-700 shadow-sm ring-1 ring-primary-100 transition hover:bg-primary-100 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
      >
        <GoogleIcon />
        <span>{t('authContinueWithGoogle')}</span>
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => startOAuth('apple')}
        className="flex w-full items-center justify-center gap-4 rounded-[1.5rem] bg-surface-secondary px-5 py-3.5 text-base font-extrabold text-foreground-700 shadow-sm ring-1 ring-border transition hover:bg-surface-200 focus:outline-none focus:ring-4 focus:ring-secondary-500/20"
      >
        <AppleIcon />
        <span>{t('authContinueWithApple')}</span>
      </motion.button>
    </div>
  );
}
