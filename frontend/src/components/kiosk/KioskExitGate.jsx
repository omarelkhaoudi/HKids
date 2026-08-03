import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getKioskExitCode, getKioskStatus, requestKioskExit } from '../../services/mobile/kioskService';

const HOLD_DURATION_MS = 3000;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30000;
const MIN_CODE_LENGTH = 4;
const MAX_CODE_LENGTH = 8;

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/**
 * The single authorised way out of kiosk mode.
 *
 * A child cannot trigger it by accident: it needs a deliberate 3 second hold on an
 * invisible corner target, then the parent code. Everything else (back, home, recents,
 * task switching) is blocked natively.
 */
export function KioskExitGate() {
  const { t } = useLanguage();
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [codeLength, setCodeLength] = useState(MIN_CODE_LENGTH);

  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getKioskStatus().then((status) => {
      if (!cancelled) setKioskEnabled(Boolean(status.kioskEnabled));
    });
    const expectedCode = getKioskExitCode();
    if (expectedCode) {
      setCodeLength(Math.min(MAX_CODE_LENGTH, Math.max(MIN_CODE_LENGTH, expectedCode.length)));
    }
    return () => { cancelled = true; };
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
    setHoldProgress(0);
  }, []);

  useEffect(() => clearHold, [clearHold]);

  const startHold = useCallback(() => {
    if (open) return;
    clearHold();

    const startedAt = Date.now();
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(Math.min(1, (Date.now() - startedAt) / HOLD_DURATION_MS));
    }, 100);

    holdTimerRef.current = setTimeout(() => {
      clearHold();
      setCode('');
      setError('');
      setOpen(true);
    }, HOLD_DURATION_MS);
  }, [clearHold, open]);

  const closeGate = useCallback(() => {
    setOpen(false);
    setCode('');
    setError('');
    clearHold();
  }, [clearHold]);

  const submit = useCallback(async (candidate) => {
    const remainingLockout = lockedUntil - Date.now();
    if (remainingLockout > 0) {
      setError(t('kioskExitTooManyAttempts', { seconds: Math.ceil(remainingLockout / 1000) }));
      setCode('');
      return;
    }

    const result = await requestKioskExit(candidate);
    if (result.exited) {
      setKioskEnabled(false);
      closeGate();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setCode('');

    if (result.reason === 'invalid_code') {
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        setError(t('kioskExitTooManyAttempts', { seconds: Math.ceil(LOCKOUT_MS / 1000) }));
      } else {
        setError(t('kioskExitInvalidCode'));
      }
      return;
    }

    setError(t('kioskExitFailed'));
  }, [attempts, closeGate, lockedUntil, t]);

  const pressKey = useCallback((key) => {
    if (key === '') return;
    setError('');

    if (key === '⌫') {
      setCode((current) => current.slice(0, -1));
      return;
    }

    setCode((current) => {
      const next = (current + key).slice(0, codeLength);
      if (next.length === codeLength) submit(next);
      return next;
    });
  }, [codeLength, submit]);

  if (!kioskEnabled) return null;

  return (
    <>
      {/*
        Invisible hold target in the top-start corner. Kept out of the tab order and hidden
        from assistive tech so it never competes with the kids navigation.
      */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        title={t('kioskExitUnlockHint')}
        onPointerDown={startHold}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
        className="fixed top-0 start-0 z-[60] h-14 w-14 cursor-default bg-transparent opacity-0"
      />

      {holdProgress > 0 && !open && (
        <div
          className="fixed top-2 start-2 z-[61] h-10 w-10 rounded-full border-2 border-primary-500/40"
          aria-hidden="true"
        >
          <div
            className="h-full w-full rounded-full bg-primary-500/30 transition-transform"
            style={{ transform: `scale(${holdProgress})` }}
          />
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('kioskExitTitle')}
        >
          <div className="w-full max-w-xs rounded-3xl bg-card p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">{t('kioskExitTitle')}</h2>
            <p className="mt-1 text-sm text-foreground-muted">{t('kioskExitSubtitle')}</p>

            <div
              className="mt-4 flex justify-center gap-3"
              role="status"
              aria-label={t('kioskExitCodeLabel')}
            >
              {Array.from({ length: codeLength }).map((_, index) => (
                <span
                  key={index}
                  className={`h-4 w-4 rounded-full border-2 ${
                    index < code.length ? 'border-primary-500 bg-primary-500' : 'border-border'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="mt-3 text-center text-sm font-semibold text-danger-600" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {KEYPAD.map((key, index) => (
                <button
                  key={`${key}-${index}`}
                  type="button"
                  disabled={key === ''}
                  onClick={() => pressKey(key)}
                  className={`h-12 rounded-2xl text-lg font-semibold ${
                    key === ''
                      ? 'invisible'
                      : 'bg-surface text-foreground hover:bg-surface-secondary active:scale-95'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={closeGate}
              className="mt-4 w-full rounded-2xl bg-surface py-3 text-sm font-semibold text-foreground-muted"
            >
              {t('confirmCancel')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default KioskExitGate;
