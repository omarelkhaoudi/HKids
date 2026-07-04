import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [changedAt, setChangedAt] = useState(() => Date.now());

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setChangedAt(Date.now());
    };

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return { online, offline: !online, changedAt };
}
