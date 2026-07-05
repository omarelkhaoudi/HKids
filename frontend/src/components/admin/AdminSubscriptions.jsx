import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/admin';
import { AdminMetricCard, formatAdminDate } from './AdminMetricCard';
import { CheckIcon, ClockIcon, UserIcon } from '../Icons';

function AdminSubscriptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getSubscriptions();
        setData(response.data);
      } catch (err) {
        console.error('Error loading admin subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-surface-500">Chargement des abonnements...</div>;
  }

  const summary = data?.summary || {};

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-surface-900">Abonnements</h1>
        <p className="mt-2 text-surface-500">Consultation des plans et abonnements actifs.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminMetricCard label="Gratuit" value={summary.free_subscribers || 0} detail="parents sans abonnement actif" icon={UserIcon} tone="bg-surface-100 text-surface-600" />
        <AdminMetricCard label="Premium" value={summary.premium_subscribers || 0} detail="parents abonnes" icon={CheckIcon} tone="bg-green-50 text-green-600" />
        <AdminMetricCard label="Actifs" value={summary.active_subscriptions || 0} detail="abonnements actifs" icon={ClockIcon} tone="bg-primary-50 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Plans disponibles</h2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {(data?.plans || []).map((plan) => (
              <div key={plan.id} className="rounded-3xl bg-surface-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-surface-900">{plan.name}</p>
                    <p className="mt-1 text-sm text-surface-500">{plan.description || 'Sans description'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-600 shadow-sm">
                    {(Number(plan.monthly_price_cents || 0) / 100).toFixed(2)} {plan.currency}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold text-surface-500">{plan.book_limit} livre(s) par periode</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Abonnements actifs</h2>
          <div className="mt-4 space-y-3">
            {(data?.active_subscriptions || []).length > 0 ? data.active_subscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-3xl bg-surface-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-surface-900">{subscription.parent_name}</p>
                    <p className="text-sm text-surface-500">{subscription.plan_name}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    {subscription.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-surface-500 sm:grid-cols-2">
                  <span>Debut: {formatAdminDate(subscription.current_period_start || subscription.started_at)}</span>
                  <span>Expiration: {formatAdminDate(subscription.current_period_end)}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-surface-500">Aucun abonnement actif.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
        <h2 className="text-lg font-black text-surface-900">Fonctionnalites futures preparees</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ['Paiement', 'Connecter Stripe en production.'],
            ['Renouvellement', 'Afficher les cycles et echeances.'],
            ['Annulation', 'Preparer une action admin controlee.'],
            ['Changement de formule', 'Prevoir la migration de plan.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-primary-50 p-4">
              <p className="font-bold text-primary-700">{title}</p>
              <p className="mt-1 text-sm text-surface-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminSubscriptions;
