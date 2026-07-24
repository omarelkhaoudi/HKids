import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionsAPI } from '../../api/subscriptions';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Badge } from '../ui';
import { PremiumPackCard } from '../premium/PremiumPackCard';
import { buildPremiumDiscoverySections, hasActiveSubscription, getSubscriptionComparisonRows } from '../../utils/premiumAccess';
import { listPremiumPacks } from '../../utils/premiumPackStore';
import { premLabel } from '../../constants/premiumLabels';

/**
 * Parent-facing premium overview: status, packs, locked content, history link.
 */
export function ParentPremiumPanel({ language: languageProp }) {
  const { language: ctxLang, t } = useLanguage();
  const language = languageProp || ctxLang;
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      subscriptionsAPI.getCurrentSubscription(),
      subscriptionsAPI.getHistory({ limit: 8 }),
    ]).then(([subRes, histRes]) => {
      if (!active) return;
      if (subRes.status === 'fulfilled') {
        const data = subRes.value.data;
        setSubscription(data?.subscription ?? data ?? null);
      }
      if (histRes.status === 'fulfilled') {
        const data = histRes.value.data;
        setHistory(Array.isArray(data) ? data : (data?.items || []));
      }
    });
    return () => { active = false; };
  }, []);

  const isPremium = hasActiveSubscription(subscription);
  const packs = useMemo(() => listPremiumPacks().slice(0, 6), []);
  const sections = useMemo(() => buildPremiumDiscoverySections({ subscription }), [subscription]);
  const comparison = getSubscriptionComparisonRows((key) => premLabel(key, language));

  return (
    <section className="space-y-space-24" aria-label={premLabel('premPacksTitle', language)}>
      <header className="parent-panel p-space-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="secondary" className="mb-2 font-bold">
              {isPremium ? premLabel('premStatusActive', language) : premLabel('premStatusFree', language)}
            </Badge>
            <h3 className="text-heading-l font-black">{subscription?.plan_name || t('parentFreePlan')}</h3>
            {subscription?.current_period_end && (
              <p className="text-body text-foreground-secondary mt-1">
                {t('parentSubscriptionExpiry')}: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate('/abonnements')}>{premLabel('premManage', language)}</Button>
            <Button variant="secondary" onClick={() => navigate('/abonnements')}>{premLabel('premRestore', language)}</Button>
          </div>
        </div>
      </header>

      <div>
        <h4 className="text-heading-m font-black mb-3">{premLabel('premPacksTitle', language)}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {packs.map((pack) => {
            const locked = sections.all.find((p) => p.id === pack.id)?.access?.locked ?? !isPremium;
            return (
              <PremiumPackCard
                key={pack.id}
                pack={pack}
                language={language}
                locked={locked}
                compact
                onUnlock={() => navigate('/abonnements')}
                onOpen={() => navigate('/kids/premium')}
                onPreview={() => navigate('/kids/premium')}
              />
            );
          })}
        </div>
        {!isPremium && (
          <p className="text-caption text-foreground-muted mt-3">{premLabel('premParentLocked', language)}</p>
        )}
      </div>

      <div className="parent-panel p-space-20 overflow-x-auto">
        <h4 className="text-heading-m font-black mb-3">{premLabel('premCompareTitle', language)}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-foreground-muted">
              <th className="py-2 font-bold"> </th>
              <th className="py-2 font-bold">{premLabel('premStatusFree', language)}</th>
              <th className="py-2 font-bold">{premLabel('premNav', language)}</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.id} className="border-t border-border/60">
                <td className="py-2 font-bold">{row.label}</td>
                <td className="py-2">{row.free === true ? '✅' : row.free === 'limited' ? premLabel('premLimited', language) : '—'}</td>
                <td className="py-2">{row.premium ? '✅' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history.length > 0 && (
        <div>
          <h4 className="text-heading-m font-black mb-2">{premLabel('premParentHistory', language)}</h4>
          <ul className="space-y-2">
            {history.slice(0, 5).map((item, index) => (
              <li key={item.id || index} className="rounded-2xl bg-surface-secondary/80 px-3 py-2 text-caption font-bold">
                {item.event_type || item.status || item.plan_code || 'event'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default ParentPremiumPanel;
