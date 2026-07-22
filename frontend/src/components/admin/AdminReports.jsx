import {useCallback, useEffect, useState} from 'react';
import {adminAPI} from '../../api/admin';
import {Badge, Button, Dialog, Input} from '../ui';
import {SearchIcon, WarningIcon} from '../Icons';
import {formatAdminDate, getAdminDateLocale} from './AdminMetricCard';
import { useLanguage } from '../../context/LanguageContext';
import { AdminListSkeleton } from './AdminListSkeleton';

function AdminReports() {
 const { t, language } = useLanguage();
 const [reports, setReports] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [filters, setFilters] = useState({q: '', status: 'open', priority: 'all', type: 'all'});
 const [pendingUpdate, setPendingUpdate] = useState(null);
 const [noteDraft, setNoteDraft] = useState('');

 const loadReports = useCallback(async () => {
 try {
 setLoading(true);
 const response = await adminAPI.getReports({...filters, limit: 100, offset: 0});
 setReports(response.data?.items || []);
 setError('');
} catch (err) {
 setError(err.response?.data?.error || t('adminReportsLoadError'));
} finally {
 setLoading(false);
}
}, [filters]);

 useEffect(() => {
 const timer = setTimeout(loadReports, 250);
 return () => clearTimeout(timer);
}, [loadReports]);

 const applyUpdate = async (report, status, priority = report.priority, resolutionNote = '') => {
 try {
 await adminAPI.updateReport(report.id, {
 status,
 priority,
 resolution_note: resolutionNote || report.resolution_note || '',
 assign_to_self: status === 'reviewing'
});
 await loadReports();
} catch (err) {
 setError(err.response?.data?.error || t('adminReportsUpdateError'));
}
};

 const update = async (report, status, priority = report.priority) => {
 if (['resolved', 'dismissed'].includes(status)) {
 setNoteDraft(report.resolution_note || '');
 setPendingUpdate({ report, status, priority });
 return;
 }
 await applyUpdate(report, status, priority);
 };

 const confirmPendingUpdate = async () => {
 if (!pendingUpdate) return;
 await applyUpdate(pendingUpdate.report, pendingUpdate.status, pendingUpdate.priority, noteDraft);
 setPendingUpdate(null);
 setNoteDraft('');
 };

 return (
 <div className="space-y-6 pb-12">
 <div>
 <h1 className="text-3xl font-black tracking-tight">{t('adminReportsTitle')}</h1>
 <p className="text-foreground-muted font-medium mt-1">{t('adminReportsSubtitle')}</p>
 </div>

 <div className="bg-card rounded-2xl border border-border p-4 flex flex-col xl:flex-row gap-3">
 <div className="relative flex-1">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input value={filters.q} onChange={(event) => setFilters((current) => ({...current, q: event.target.value}))} placeholder={t('adminReportsSearchPlaceholder')} className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none" />
 </div>
 {[
 ['status', [['open', t('adminReportsOpen')], ['reviewing', t('adminReportsInProgress')], ['resolved', t('adminReportsResolved')], ['dismissed', t('adminReportsDismissed')], ['all', t('adminReportsAllStatuses')]]],
 ['priority', [['all', t('adminReportsAllPriorities')], ['urgent', t('adminSupportUrgent')], ['high', t('adminSupportHigh')], ['normal', t('adminSupportNormal')], ['low', t('adminSupportLow')]]],
 ['type', [['all', t('adminReportsAllTargets')], ['book', t('adminReportsBooks')], ['generated_story', t('adminReportsAiStories')], ['user', t('adminReportsUsers')]]]
 ].map(([key, options]) => (
 <select key={key} value={filters[key]} onChange={(event) => setFilters((current) => ({...current, [key]: event.target.value}))} className="bg-surface-secondary border border-border rounded-xl px-4 py-2 font-bold">
 {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
 </select>
 ))}
 </div>

 {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{error}</div>}

 <div className="grid gap-4">
 {loading ? (
 <AdminListSkeleton rows={4} />
 ) : reports.length === 0 ? (
 <div className="bg-card border border-border rounded-3xl p-12 text-center">
 <WarningIcon className="w-10 h-10 mx-auto text-surface-300 mb-3" />
 <p className="font-black">{t('adminReportsNoReports')}</p>
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
 <p className="text-sm text-foreground-muted mt-1">{report.details || t('adminReportsNoDetails')}</p>
 <div className="text-xs text-surface-400 mt-3">
 {t('adminReportsTarget')} {report.target_label || `#${report.target_id}`} · {t('adminReportsBy').replace('{name}', report.reporter_name || t('adminReportsDeletedUser'))} · {formatAdminDate(report.created_at, t, getAdminDateLocale(language))}
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
 {report.status === 'open' && <Button variant="outline" onClick={() => update(report, 'reviewing')}>{t('adminReportsTakeOver')}</Button>}
 {!['resolved', 'dismissed'].includes(report.status) && (
 <>
 <Button variant="primary" onClick={() => update(report, 'resolved')}>{t('adminReportsResolve')}</Button>
 <Button variant="ghost" onClick={() => update(report, 'dismissed')}>{t('adminReportsDismiss')}</Button>
 </>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 <Dialog
 isOpen={Boolean(pendingUpdate)}
 onClose={() => setPendingUpdate(null)}
 title={t('confirmTitle')}
 primaryLabel={t('adminConfirm')}
 secondaryLabel={t('adminCancel')}
 primaryVariant="danger"
 onPrimary={confirmPendingUpdate}
 onSecondary={() => setPendingUpdate(null)}
 >
 <label className="block text-sm font-medium text-foreground-secondary mb-2" htmlFor="admin-report-note">
 {t('adminReportsResolutionNote')}
 </label>
 <Input
 id="admin-report-note"
 value={noteDraft}
 onChange={(e) => setNoteDraft(e.target.value)}
 />
 </Dialog>
 </div>
 );
}

export default AdminReports;
