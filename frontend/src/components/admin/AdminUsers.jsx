import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/admin';
import { AdminMetricCard, formatAdminDate, formatAdminDuration } from './AdminMetricCard';
import { ChildIcon, ClockIcon, HistoryIcon, UserIcon } from '../Icons';

function AdminUsers() {
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadParents = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getUsers();
        setParents(response.data || []);
      } catch (err) {
        console.error('Error loading admin users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadParents();
  }, []);

  const openParent = async (parent) => {
    try {
      setSelectedParent(parent);
      setDetailLoading(true);
      const response = await adminAPI.getUserDetail(parent.id);
      setDetail(response.data);
    } catch (err) {
      console.error('Error loading parent detail:', err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalChildren = detail?.kids?.length || selectedParent?.children_count || 0;
  const totalTime = detail?.kids?.reduce((sum, kid) => sum + Number(kid.total_time_seconds || 0), 0) || 0;
  const lastActivity = detail?.kids?.map((kid) => kid.last_activity_at).filter(Boolean).sort().reverse()[0] || null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-surface-900">Utilisateurs</h1>
        <p className="mt-2 text-surface-500">Parents, profils enfants et activite en lecture seule.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg xl:col-span-3">
          <h2 className="text-lg font-black text-surface-900">Liste des parents</h2>
          {loading ? (
            <p className="py-8 text-center text-surface-500">Chargement...</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-3xl border border-surface-200">
              <table className="min-w-full divide-y divide-surface-200 text-sm">
                <thead className="bg-primary-50 text-left text-xs font-bold uppercase text-primary-700">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Inscription</th>
                    <th className="px-4 py-3">Enfants</th>
                    <th className="px-4 py-3">Abonnement</th>
                    <th className="px-4 py-3">Derniere connexion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 bg-white">
                  {parents.map((parent) => (
                    <tr
                      key={parent.id}
                      onClick={() => openParent(parent)}
                      className={`cursor-pointer transition hover:bg-primary-50 ${selectedParent?.id === parent.id ? 'bg-primary-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-bold text-surface-900">{parent.name}</td>
                      <td className="px-4 py-3 text-surface-500">{parent.email || '-'}</td>
                      <td className="px-4 py-3 text-surface-500">{formatAdminDate(parent.created_at)}</td>
                      <td className="px-4 py-3 text-surface-700">{parent.children_count || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${parent.subscription_status === 'free' ? 'bg-surface-100 text-surface-600' : 'bg-green-100 text-green-700'}`}>
                          {parent.subscription_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-surface-500">{formatAdminDate(parent.last_login_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-lg">
            <h2 className="text-lg font-black text-surface-900">Detail parent</h2>
            {!selectedParent ? (
              <p className="mt-4 text-sm text-surface-500">Selectionnez un parent pour consulter ses profils enfants.</p>
            ) : detailLoading ? (
              <p className="mt-4 text-sm text-surface-500">Chargement du detail...</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xl font-black text-surface-900">{detail?.parent?.name || selectedParent.name}</p>
                  <p className="text-sm text-surface-500">Inscrit le {formatAdminDate(detail?.parent?.created_at || selectedParent.created_at)}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <AdminMetricCard label="Enfants" value={totalChildren} icon={ChildIcon} tone="bg-green-50 text-green-600" />
                  <AdminMetricCard label="Temps" value={formatAdminDuration(totalTime)} icon={ClockIcon} tone="bg-accent-50 text-accent-600" />
                  <AdminMetricCard label="Activite" value={formatAdminDate(lastActivity)} icon={HistoryIcon} tone="bg-primary-50 text-primary-600" />
                </div>
                <div className="space-y-3">
                  {detail?.kids?.length > 0 ? detail.kids.map((kid) => (
                    <div key={kid.id} className="rounded-3xl bg-surface-50 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                          <UserIcon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-bold text-surface-900">{kid.name}</p>
                          <p className="text-xs text-surface-500">{kid.age ? `${kid.age} ans` : 'Age non renseigne'} - {kid.preferred_language || 'fr'}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-surface-600">
                        {kid.total_sessions || 0} session(s), {formatAdminDuration(kid.total_time_seconds)}
                      </p>
                    </div>
                  )) : (
                    <p className="text-sm text-surface-500">Aucun profil enfant.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AdminUsers;
