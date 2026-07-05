import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/admin';
import { AdminMetricCard, formatAdminDate, formatAdminDuration } from './AdminMetricCard';
import { AudioIcon, BookIcon, ClockIcon, HistoryIcon, UserIcon } from '../Icons';

function BarRow({ label, value, max, detail }) {
  const width = max > 0 ? Math.max(4, Math.round((Number(value || 0) / max) * 100)) : 0;

  return (
    <div className="space-y-2 rounded-3xl bg-surface-50 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-surface-900">{label}</span>
        <span className="font-bold text-primary-600">{value || 0}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-200">
        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${width}%` }} />
      </div>
      {detail && <p className="text-xs text-surface-500">{detail}</p>}
    </div>
  );
}

function AdminStatistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getStatistics();
        setData(response.data);
      } catch (err) {
        console.error('Error loading admin statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-surface-500">Chargement des statistiques...</div>;
  }

  const summary = data?.summary || {};
  const maxBookListens = Math.max(0, ...(data?.top_books || []).map((item) => Number(item.listens_count || 0)));
  const maxCategoryListens = Math.max(0, ...(data?.top_categories || []).map((item) => Number(item.listens_count || 0)));

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-surface-900">Statistiques</h1>
        <p className="mt-2 text-surface-500">Ecoutes, contenus populaires et utilisateurs actifs.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Ecoutes" value={summary.total_listens || 0} detail="sessions totales" icon={AudioIcon} tone="bg-purple-50 text-purple-600" />
        <AdminMetricCard label="Temps total" value={formatAdminDuration(summary.total_listening_seconds)} detail="ecoute cumulee" icon={ClockIcon} tone="bg-accent-50 text-accent-600" />
        <AdminMetricCard label="Temps moyen" value={formatAdminDuration(summary.average_listening_seconds)} detail="par session" icon={HistoryIcon} tone="bg-primary-50 text-primary-600" />
        <AdminMetricCard label="Utilisateurs actifs" value={summary.active_children || 0} detail="enfants avec activite" icon={UserIcon} tone="bg-green-50 text-green-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Histoires les plus ecoutees</h2>
          <div className="mt-4 space-y-3">
            {(data?.top_books || []).map((book) => (
              <BarRow
                key={book.id}
                label={book.title}
                value={book.listens_count}
                max={maxBookListens}
                detail={formatAdminDuration(book.listening_seconds)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Categories populaires</h2>
          <div className="mt-4 space-y-3">
            {(data?.top_categories || []).map((category) => (
              <BarRow
                key={category.id}
                label={category.name}
                value={category.listens_count}
                max={maxCategoryListens}
                detail={formatAdminDuration(category.listening_seconds)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="text-lg font-black text-surface-900">Utilisateurs actifs</h2>
          <div className="mt-4 space-y-3">
            {(data?.active_users || []).map((kid) => (
              <div key={kid.id} className="rounded-3xl bg-surface-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-surface-900">{kid.name}</p>
                    <p className="text-xs text-surface-500">Parent: {kid.parent_name}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-600 shadow-sm">
                    {kid.sessions_count || 0} session(s)
                  </span>
                </div>
                <p className="mt-2 text-xs text-surface-500">Derniere activite: {formatAdminDate(kid.last_activity_at)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
          <h2 className="flex items-center gap-2 text-lg font-black text-surface-900">
            <BookIcon className="h-5 w-5 text-primary-500" />
            Dernieres activites
          </h2>
          <div className="mt-4 space-y-3">
            {(data?.recent_activity || []).map((item) => (
              <div key={item.id} className="rounded-3xl bg-surface-50 p-4">
                <p className="font-bold text-surface-900">{item.kid_name} - {item.book_title}</p>
                <p className="text-xs text-surface-500">{formatAdminDuration(item.duration_seconds)} - {formatAdminDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminStatistics;
