import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/admin';
import { formatAdminDate } from './AdminMetricCard';
import { CheckIcon, UserIcon, TrendingUpIcon, WarningIcon, SearchIcon, DownloadIcon } from '../Icons';
import { Badge, Button } from '../ui';

function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getSubscriptions();
        const subsArray = response.data.active_subscriptions || [];
        const formattedSubs = subsArray.map(sub => ({
          ...sub,
          user_name: sub.parent_name,
          user_email: sub.email || '',
          mrr: sub.monthly_price_cents ? sub.monthly_price_cents / 100 : 0,
        }));
        setSubscriptions(formattedSubs);
      } catch (err) {
        console.error('Error loading admin subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSubscriptions();
  }, []);

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.mrr || 0), 0);
  const activeCount = subscriptions.filter((sub) => sub.status === 'active' || sub.status === 'trialing').length;
  const canceledCount = subscriptions.filter((sub) => sub.status === 'canceled').length;

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_name?.toLowerCase().includes(search.toLowerCase()) || sub.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">Abonnements</h1>
          <p className="text-surface-500 font-medium mt-1">Gérez la facturation et le MRR.</p>
        </div>
        <Button variant="outline" className="bg-white text-surface-700 shadow-sm"><DownloadIcon className="w-4 h-4 mr-2" /> Exporter CSV</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-white rounded-[1.5rem] p-6 border border-surface-200 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex justify-between items-start mb-2">
            <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider">MRR Actuel</h3>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><TrendingUpIcon className="w-5 h-5"/></div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black text-surface-900 tracking-tight">{totalRevenue.toFixed(2)} €</span>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUpIcon className="w-3 h-3"/> +12% ce mois</p>
          </div>
        </div>
        
        <div className="bg-white rounded-[1.5rem] p-6 border border-surface-200 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex justify-between items-start mb-2">
            <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider">Abonnements Actifs</h3>
            <div className="p-2 rounded-xl bg-primary-100 text-primary-600"><CheckIcon className="w-5 h-5"/></div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black text-surface-900 tracking-tight">{activeCount}</span>
            <p className="text-xs text-surface-500 font-medium mt-1">Utilisateurs premium</p>
          </div>
        </div>
        
        <div className="bg-white rounded-[1.5rem] p-6 border border-surface-200 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex justify-between items-start mb-2">
            <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider">Désabonnements</h3>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600"><WarningIcon className="w-5 h-5"/></div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black text-surface-900 tracking-tight">{canceledCount}</span>
            <p className="text-xs text-rose-500 font-bold mt-1">Churn: 2.4%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-surface-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row items-center justify-between bg-surface-50 gap-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un parent (nom, email)..."
              className="w-full bg-white border border-surface-200 rounded-xl pl-10 pr-4 py-2 font-medium focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-surface-200 rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-primary-400"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="trialing">Essai gratuit</option>
            <option value="canceled">Annulé</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-surface-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Parent</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Renouvellement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-surface-500">Chargement...</td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-surface-500">Aucun abonnement trouvé.</td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  let badgeVariant = 'secondary';
                  let statusText = sub.status;
                  
                  if (sub.status === 'active') { badgeVariant = 'success'; statusText = 'Actif'; }
                  else if (sub.status === 'trialing') { badgeVariant = 'primary'; statusText = 'En essai'; }
                  else if (sub.status === 'canceled') { badgeVariant = 'danger'; statusText = 'Annulé'; }
                  
                  return (
                    <tr key={sub.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-400"><UserIcon className="w-4 h-4"/></div>
                          <div>
                            <p className="font-bold text-surface-900 text-sm">{sub.user_name}</p>
                            <p className="text-xs font-medium text-surface-500">{sub.user_email || 'Email non fourni'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-surface-900 text-sm">{sub.plan_name || 'Standard'}</div>
                        <div className="text-xs text-surface-500 font-medium">{sub.mrr || 0} € / mois</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={badgeVariant} className="font-bold">{statusText}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-surface-700">{formatAdminDate(sub.current_period_end)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminSubscriptions;
