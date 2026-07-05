import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/admin';
import { AdminMetricCard, formatAdminDate, formatAdminDuration } from './AdminMetricCard';
import { AudioIcon, BookIcon, CheckIcon, ChildIcon, ClockIcon, HistoryIcon, UserIcon } from '../Icons';

function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getOverview();
        setData(response.data);
        setError('');
      } catch (err) {
        console.error('Error loading admin overview:', err);
        setError("Impossible de charger la vue d'ensemble.");
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-surface-500">Chargement du tableau de bord...</div>;
  }

  if (error) {
    return <div className="m-6 rounded-3xl bg-primary-50 p-4 font-bold text-primary-700">{error}</div>;
  }

  const summary = data?.summary || {};
  const metrics = [
    ['Parents', summary.total_parents, 'comptes parents', UserIcon, 'bg-primary-50 text-primary-600'],
    ['Enfants', summary.total_children, 'profils enfants', ChildIcon, 'bg-green-50 text-green-600'],
    ['Histoires', summary.total_stories, 'contenus crees', BookIcon, 'bg-primary-50 text-primary-600'],
    ['Ecoutes', summary.total_listens, 'sessions enregistrees', AudioIcon, 'bg-purple-50 text-purple-600'],
    ['Abonnements actifs', summary.active_subscriptions, 'trialing ou active', CheckIcon, 'bg-emerald-50 text-emerald-600'],
    ['Temps total', formatAdminDuration(summary.total_listening_seconds), "temps d'ecoute", ClockIcon, 'bg-accent-50 text-accent-600'],
    ['Temps moyen', formatAdminDuration(summary.average_listening_seconds), 'par session', HistoryIcon, 'bg-secondary-50 text-secondary-600'],
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-surface-900">Vue d'ensemble</h1>
        <p className="mt-2 text-surface-500">Pilotage global de HKids vers Le Lit Qui Lit.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail, icon, tone]) => (
          <AdminMetricCard key={label} label={label} value={value ?? 0} detail={detail} icon={icon} tone={tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg xl:col-span-1">
          <h2 className="text-lg font-black text-surface-900">Activite recente</h2>
          <div className="mt-4 space-y-3">
            {data?.recent_activity?.length > 0 ? data.recent_activity.map((item) => (
              <div key={item.id} className="rounded-3xl bg-surface-50 p-3">
                <p className="font-bold text-surface-900">{item.kid_name} a ecoute {item.book_title}</p>
                <p className="text-xs text-surface-500">{formatAdminDuration(item.duration_seconds)} - {formatAdminDate(item.created_at)}</p>
              </div>
            )) : (
              <p className="text-sm text-surface-500">Aucune activite recente.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Derniers utilisateurs</h2>
          <div className="mt-4 space-y-3">
            {data?.latest_users?.length > 0 ? data.latest_users.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-3xl bg-surface-50 p-3">
                <div>
                  <p className="font-bold text-surface-900">{item.username}</p>
                  <p className="text-xs text-surface-500">{item.role} - {formatAdminDate(item.created_at)}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-600 shadow-sm">
                  {item.children_count || 0} enfant(s)
                </span>
              </div>
            )) : (
              <p className="text-sm text-surface-500">Aucun utilisateur recent.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Derniers contenus</h2>
          <div className="mt-4 space-y-3">
            {data?.latest_books?.length > 0 ? data.latest_books.map((item) => (
              <div key={item.id} className="rounded-3xl bg-surface-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-surface-900">{item.title}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-surface-200 text-surface-600'}`}>
                    {item.is_published ? 'Publie' : 'Brouillon'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-surface-500">{item.category_name || 'Sans categorie'} - {item.audio_url ? 'audio pret' : 'audio manquant'}</p>
              </div>
            )) : (
              <p className="text-sm text-surface-500">Aucun contenu recent.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminOverview;
