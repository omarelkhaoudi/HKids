import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { syncOrQueueKidMutation } from '../../services/parental/kidActivitySyncService';

function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `screen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function KidScreenTimeTracker() {
  const { user } = useAuth();
  const sessionRef = useRef(null);

  useEffect(() => {
    if (user?.role !== 'kid' || !user.kid_profile_id) {
      sessionRef.current = null;
      return undefined;
    }

    const now = Date.now();
    const session = {
      id: createSessionId(),
      day: localDayKey(),
      startedAt: new Date(now).toISOString(),
      activeSince: document.visibilityState === 'visible' ? now : null,
      accumulatedMs: 0,
      lastSentSeconds: -1
    };
    sessionRef.current = session;

    const pause = () => {
      if (session.activeSince === null) return;
      session.accumulatedMs += Math.max(0, Date.now() - session.activeSince);
      session.activeSince = null;
    };

    const resume = () => {
      if (session.activeSince === null) session.activeSince = Date.now();
    };

    const activeSeconds = () => {
      const runningMs = session.activeSince === null ? 0 : Math.max(0, Date.now() - session.activeSince);
      return Math.floor((session.accumulatedMs + runningMs) / 1000);
    };

    const sendCurrentSession = () => {
      const seconds = activeSeconds();
      if (seconds <= 0 || seconds === session.lastSentSeconds) return;
      session.lastSentSeconds = seconds;
      const localKey = `hkids_screen_time_daily:kid:${user.kid_profile_id}:${session.day}`;
      const previous = Number(localStorage.getItem(localKey) || 0);
      localStorage.setItem(localKey, String(Math.max(previous, seconds)));
      void syncOrQueueKidMutation('screen_time', {
        client_session_id: session.id,
        duration_seconds: seconds,
        started_at: session.startedAt
      }, `screen:${session.id}`);
    };

    const flush = () => {
      const today = localDayKey();
      if (today !== session.day) {
        pause();
        sendCurrentSession();
        session.id = createSessionId();
        session.day = today;
        session.startedAt = new Date().toISOString();
        session.accumulatedMs = 0;
        session.lastSentSeconds = -1;
        if (document.visibilityState === 'visible') resume();
      }
      sendCurrentSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') resume();
      else {
        pause();
        flush();
      }
    };
    const onPageHide = () => {
      pause();
      flush();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    const intervalId = window.setInterval(flush, 60_000);
    let appStateListener = null;
    import('@capacitor/app')
      .then(({ App }) => App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) resume();
        else {
          pause();
          flush();
        }
      }))
      .then((listener) => {
        appStateListener = listener;
      })
      .catch(() => {});

    return () => {
      pause();
      flush();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      appStateListener?.remove();
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [user?.id, user?.kid_profile_id, user?.role]);

  return null;
}
