import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useNetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [changedAt, setChangedAt] = useState(() => Date.now());

  useEffect(() => {
    const update = (nextOnline = navigator.onLine) => {
      setOnline(nextOnline);
      setChangedAt(Date.now());
    };

    const handleOnline = () => update(true);
    const handleOffline = () => update(false);
    const handleNativeStatus = (event) => {
      update(Boolean(event.detail?.online));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('hkids:network-status', handleNativeStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hkids:network-status', handleNativeStatus);
    };
  }, []);

  return { online, offline: !online, changedAt, isNative: Capacitor.isNativePlatform() };
}
