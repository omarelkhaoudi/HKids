import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function OfflineStatusBanner() {
  const { online, changedAt } = useNetworkStatus();
  const [visible, setVisible] = useState(!online);

  useEffect(() => {
    setVisible(true);
    if (!online) return undefined;

    const timeout = window.setTimeout(() => setVisible(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [online, changedAt]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-md items-center justify-center rounded-2xl px-4 py-3 text-sm font-black shadow-lg ${
        online ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {online ? 'Connexion retablie - synchronisation en cours' : 'Mode hors connexion - contenus telecharges disponibles'}
    </div>
  );
}
