import {useCallback, useEffect, useState} from 'react';
import {adminAPI} from '../../api/admin';
import {Badge, Button} from '../ui';
import {SearchIcon, WarningIcon} from '../Icons';
import {formatAdminDate} from './AdminMetricCard';

function AdminReports() {
 const [reports, setReports] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [filters, setFilters] = useState({q: '', status: 'open', priority: 'all', type: 'all'});

 const loadReports = useCallback(async () => {
 try {
 setLoading(true);
 const response = await adminAPI.getReports({...filters, limit: 100, offset: 0});
 setReports(response.data?.items || []);
 setError('');
} catch (err) {
 setError(err.response?.data?.error || 'Impossible de charger les signalements.');
} finally {
 setLoading(false);
}
}, [filters]);

 useEffect(() => {
 const timer = setTimeout(loadReports, 250);
 return () => clearTimeout(timer);
}, [loadReports]);

 const update = async (report, status, priority = report.priority) => {
 const resolutionNote = ['resolved', 'dismissed'].includes(status)
 ? window.prompt('Note de résolution', report.resolution_note || '')
 : '';
 if (resolutionNote === null && ['resolved', 'dismissed'].includes(status)) return;
 try {
 await adminAPI.updateReport(report.id, {
 status,
 priority,
 resolution_note: resolutionNote || report.resolution_note || '',
 assign_to_self: status === 'reviewing'
});
 await loadReports();
} catch (err) {
 setError(err.response?.data?.error || 'Mise à jour impossible.');
}
};

 return (
 <div className="space-y-6 pb-12">
 <div>
 <h1 className="text-3xl font-black tracking-tight">Signalements</h1>
 <p className="text-foreground-muted font-medium mt-1">Traitez les contenus et comptes signalés par les utilisateurs.</p>
 </div>

 <div className="bg-card rounded-2xl border border-border p-4 flex flex-col xl:flex-row gap-3">
 <div className="relative flex-1">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input value={filters.q} onChange={(event) => setFilters((current) => ({...current, q: event.target.value}))} placeholder="Motif, utilisateur..." className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none" />
 </div>
 {[
 ['status', [['open', 'Ouverts'], ['reviewing', 'En cours'], ['resolved', 'Résolus'], ['dismissed', 'Classés'], ['all', 'Tous statuts']]],
 ['priority', [['all', 'Toutes priorités'], ['urgent', 'Urgent'], ['high', 'Haute'], ['normal', 'Normale'], ['low', 'Faible']]],
 ['type', [['all', 'Toutes cibles'], ['book', 'Livres'], ['generated_story', 'Histoires IA'], ['user', 'Utilisateurs']]]
 ].map(([key, options]) => (
 <select key={key} value={filters[key]} onChange={(event) => setFilters((current) => ({...current, [key]: event.target.value}))} className="bg-surface-secondary border border-border rounded-xl px-4 py-2 font-bold">
 {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
 </select>
 ))}
 </div>

 {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{error}</div>}

 <div className="grid gap-4">
 {loading ? (
 <div className="p-10 text-center text-foreground-muted">Chargement...</div>
 ) : reports.length === 0 ? (
 <div className="bg-card border border-border rounded-3xl p-12 text-center">
 <WarningIcon className="w-10 h-10 mx-auto text-surface-300 mb-3" />
 <p className="font-black">Aucun signalement.</p>
 </div>
 ) : reports.map((report) => (
 <div key={report.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
 <div className="flex flex-col lg:flex-row lg:items-start gap-4">
 <div className="flex-1">
 <div className="flex flex-wrap gap-2 mb-3">
 <Badge variant={report.priority === 'urgent' || report.priority === 'high' ? 'danger' : 'secondary'}>{report.priority}</Badge>
 <Badge variant="soft">{report.target_type}</Badge>
 <Badge variant={report.status === 'resolved' ? 'success' : 'primary'}>{report.status}</Badge>
 </div>
 <h2 className="font-black text-lg">{report.reason}</h2>
 <p className="text-sm text-foreground-muted mt-1">{report.details || 'Aucun détail complémentaire.'}</p>
 <div className="text-xs text-surface-400 mt-3">
 Cible : {report.target_label || `#${report.target_id}`} · Par {report.reporter_name || 'Utilisateur supprimé'} · {formatAdminDate(report.created_at)}
 </div>
 </div>
 <div className="flex flex-wrap gap-2">
 <select
 value={report.priority}
 onChange={(event) => update(report, report.status, event.target.value)}
 className="bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold"
 >
 {['urgent', 'high', 'normal', 'low'].map((value) => (
 <option key={value} value={value}>{value}</option>
 ))}
 </select>
 {report.status === 'open' && <Button variant="outline" onClick={() => update(report, 'reviewing')}>Prendre en charge</Button>}
 {!['resolved', 'dismissed'].includes(report.status) && (
 <>
 <Button variant="primary" onClick={() => update(report, 'resolved')}>Résoudre</Button>
 <Button variant="ghost" onClick={() => update(report, 'dismissed')}>Classer</Button>
 </>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}

export default AdminReports;
