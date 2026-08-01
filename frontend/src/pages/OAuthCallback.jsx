import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertIcon, LoadingSpinnerIcon } from '../components/Icons';
import { Logo } from '../components/Logo';

function isSafeReturnTo(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('\\');
}

export default function OAuthCallback() {
  const [error, setError] = useState('');
  const startedRef = useRef(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (startedRef.current) return undefined;
    startedRef.current = true;

    let cancelled = false;

    const finishOAuth = async () => {
      const providerError = searchParams.get('error') || searchParams.get('oauth_error');
      if (providerError) {
        setError(t('authOAuthFailed'));
        return;
      }

      const token = searchParams.get('token');
      const result = await completeOAuthLogin(token);

      if (cancelled) return;

      if (!result.success) {
        setError(result.error || t('authOAuthFailed'));
        return;
      }

      const returnTo = searchParams.get('return_to');
      const fallbackPath = result.user?.role === 'kid' ? '/kids' : '/parent';
      navigate(isSafeReturnTo(returnTo) ? returnTo : fallbackPath, { replace: true });
    };

    finishOAuth();

    return () => {
      cancelled = true;
    };
  }, [completeOAuthLogin, navigate, searchParams, t]);

  return (
    <main className="min-h-screen bg-background-kids flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary-50">
          <Logo size="small" showText={true} />
        </div>

        {error ? (
          <div className="space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-hkids-brown-soft text-hkids-brown">
              <AlertIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">{t('authOAuthFailed')}</h1>
              <p className="mt-2 text-sm font-semibold text-foreground-secondary">{error}</p>
            </div>
            <Link
              to="/parent/login"
              className="inline-flex w-full items-center justify-center rounded-[1.5rem] bg-primary-600 px-5 py-3 font-extrabold text-white transition hover:bg-primary-700"
            >
              {t('parentLoginSubmit')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4" role="status" aria-live="polite">
            <LoadingSpinnerIcon className="mx-auto h-10 w-10 animate-spin text-primary-600" />
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">{t('authOAuthLoading')}</h1>
              <p className="mt-2 text-sm font-semibold text-foreground-secondary">{t('authOAuthRedirecting')}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
