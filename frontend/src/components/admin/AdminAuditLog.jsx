import {useCallback, useEffect, useState} from 'react';
import {adminAPI} from '../../api/admin';
import {Badge} from '../ui';
import {HistoryIcon, SearchIcon} from '../Icons';
import {formatAdminDate} from './AdminMetricCard';

function AdminAuditLog() {
 const [logs, setLogs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [filters, setFilters] = useState({action: '', resource_type: ''});

 const loadLogs = useCallback(async () => {
 try {
 setLoading(true);
 const response = await adminAPI.getAuditLogs({...filters, limit: 100, offset: 0});
 setLogs(response.data?.items || []);
 setError('');
} catch (err) {
 setError(err.response?.data?.error || 'Impossible de charger le journal.');
} finally {
 setLoading(false);
}
}, [filters]);

 useEffect(() => {
 const timer = setTimeout(loadLogs, 250);
 return () => clearTimeout(timer);
}, [loadLogs]);

 return (
 <div className="space-y-6 pb-12">
 <div>
 <h1 className="text-3xl font-black tracking-tight">Journal des actions</h1>
 <p className="text-foreground-muted font-medium mt-1">Traçabilité des opérations sensibles et administratives.</p>
 </div>

 <div className="bg-card rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-3">
 <div className="relative flex-1">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input value={filters.action} onChange={(event) => setFilters((current) => ({...current, action: event.target.value}))} placeholder="Rechercher une action..." className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none" />
 </div>
 <select value={filters.resource_type} onChange={(event) => setFilters((current) => ({...current, resource_type: event.target.value}))} className="bg-surface-secondary border border-border rounded-xl px-4 py-2 font-bold">
 <option value="">Toutes ressources</option>
 <option value="user">Utilisateurs</option>
 <option value="book">Livres</option>
 <option value="generated_story">Histoires IA</option>
 <option value="subscription">Abonnements</option>
 <option value="content_report">Signalements</option>
 <option value="admin">Permissions</option>
 </select>
 </div>

 {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{error}</div>}

 <div className="bg-card rounded-[2rem] border border-border overflow-hidden">
 {loading ? (
 <div className="p-10 text-center text-foreground-muted">Chargement...</div>
 ) : logs.length === 0 ? (
 <div className="p-12 text-center"><HistoryIcon className="w-10 h-10 mx-auto text-surface-300 mb-3" /><p className="font-black">Aucune action enregistrée.</p></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-surface-secondary border-b border-border">
 <tr>
 <th className="p-4 text-xs uppercase text-surface-400">Date</th>
 <th className="p-4 text-xs uppercase text-surface-400">Administrateur</th>
 <th className="p-4 text-xs uppercase text-surface-400">Action</th>
 <th className="p-4 text-xs uppercase text-surface-400">Ressource</th>
 <th className="p-4 text-xs uppercase text-surface-400">IP</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {logs.map((log) => (
 <tr key={log.id} className="hover:bg-surface-secondary/50">
 <td className="p-4 whitespace-nowrap text-sm">{formatAdminDate(log.created_at)}</td>
 <td className="p-4 font-bold">{log.actor_name || log.actor_role || 'Système'}</td>
 <td className="p-4"><Badge variant="soft">{log.action}</Badge></td>
 <td className="p-4 text-sm">{log.resource_type || '-'} {log.resource_id ? `#${log.resource_id}` : ''}</td>
 <td className="p-4 text-xs text-foreground-muted">{log.ip_address || '-'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}

export default AdminAuditLog;
