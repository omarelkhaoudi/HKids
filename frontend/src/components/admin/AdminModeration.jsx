import {useCallback, useEffect, useState} from 'react';
import {adminAPI} from '../../api/admin';
import {Badge, Button} from '../ui';
import {BookIcon, CheckIcon, SearchIcon, XIcon} from '../Icons';
import { useLanguage } from '../../context/LanguageContext';
import { AdminListSkeleton } from './AdminListSkeleton';

function AdminModeration() {
 const { t } = useLanguage();
 const STATUS_LABELS = {
  pending: t('adminModerationPending'),
  approved: t('adminModerationApproved'),
  rejected: t('adminModerationRejected'),
 };
 const [items, setItems] = useState([]);
 const [loading, setLoading] = useState(true);
 const [busyId, setBusyId] = useState(null);
 const [filters, setFilters] = useState({q: '', type: 'all', status: 'pending'});
 const [error, setError] = useState('');

 const loadItems = useCallback(async () => {
 try {
 setLoading(true);
 setError('');
 const response = await adminAPI.getModeration({...filters, limit: 100, offset: 0});
 setItems(response.data?.items || []);
} catch (err) {
 setError(err.response?.data?.error || t('adminModerationLoadError'));
} finally {
 setLoading(false);
}
}, [filters]);

 useEffect(() => {
 const timer = setTimeout(loadItems, 250);
 return () => clearTimeout(timer);
}, [loadItems]);

 const moderate = async (item, status) => {
 const note = window.prompt(
 status === 'rejected' ? t('adminModerationRejectPrompt') : t('adminModerationApproveNote'),
 item.moderation_note || ''
 );
 if (note === null) return;
 try {
 setBusyId(`${item.type}:${item.id}`);
 await adminAPI.moderateContent(item.type, item.id, {
 status,
 note,
 publish: item.type === 'book' && status === 'approved'
});
 await loadItems();
} catch (err) {
 setError(err.response?.data?.error || t('adminModerationDecisionError'));
} finally {
 setBusyId(null);
}
};

 return (
 <div className="space-y-6 pb-12">
 <div>
 <h1 className="text-3xl font-black text-foreground tracking-tight">{t('adminModerationTitle')}</h1>
 <p className="text-foreground-muted font-medium mt-1">{t('adminModerationSubtitle')}</p>
 </div>

 <div className="bg-card rounded-2xl border border-border p-4 flex flex-col lg:flex-row gap-3">
 <div className="relative flex-1">
 <SearchIcon className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 value={filters.q}
 onChange={(event) => setFilters((current) => ({...current, q: event.target.value}))}
 placeholder={t('adminModerationSearchPlaceholder')}
 className="w-full bg-surface-secondary border border-border rounded-xl pl-10 pr-4 py-2 font-medium outline-none focus:border-primary-400"
 />
 </div>
 <select value={filters.type} onChange={(event) => setFilters((current) => ({...current, type: event.target.value}))} className="bg-surface-secondary border border-border rounded-xl px-4 py-2 font-bold">
 <option value="all">{t('adminModerationAllContent')}</option>
 <option value="book">{t('adminModerationBooks')}</option>
 <option value="generated_story">{t('adminModerationAiStories')}</option>
 </select>
 <select value={filters.status} onChange={(event) => setFilters((current) => ({...current, status: event.target.value}))} className="bg-surface-secondary border border-border rounded-xl px-4 py-2 font-bold">
 <option value="pending">{t('adminModerationPending')}</option>
 <option value="approved">{t('adminModerationApproved')}</option>
 <option value="rejected">{t('adminModerationRejected')}</option>
 <option value="all">{t('adminModerationAllStatuses')}</option>
 </select>
 </div>

 {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-bold">{error}</div>}

 <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
 {loading ? (
 <AdminListSkeleton rows={5} />
 ) : items.length === 0 ? (
 <div className="p-12 text-center">
 <BookIcon className="w-10 h-10 text-surface-300 mx-auto mb-3" />
 <p className="font-black">{t('adminModerationNoContent')}</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {items.map((item) => {
 const key = `${item.type}:${item.id}`;
 return (
 <div key={key} className="p-5 flex flex-col xl:flex-row xl:items-center gap-4 hover:bg-surface-secondary/50">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <Badge variant={item.moderation_status === 'approved' ? 'success' : item.moderation_status === 'rejected' ? 'danger' : 'secondary'}>
 {STATUS_LABELS[item.moderation_status] || item.moderation_status}
 </Badge>
 <Badge variant="soft">{item.type === 'book' ? t('adminModerationBook') : t('adminModerationAiStory')}</Badge>
 {item.is_published && <Badge variant="primary">{t('adminPublished')}</Badge>}
 </div>
 <h2 className="text-lg font-black truncate">{item.title}</h2>
 <p className="text-sm text-foreground-muted line-clamp-2 mt-1">{item.description || t('adminModerationNoDescription')}</p>
 {item.moderation_note && <p className="text-xs text-foreground-secondary mt-2">{t('adminModerationNote')}{item.moderation_note}</p>}
 </div>
 <div className="flex gap-2 shrink-0">
 <Button
 variant="outline"
 disabled={busyId === key}
 onClick={() => moderate(item, 'rejected')}
 className="text-rose-600 border-rose-200"
 >
 <XIcon className="w-4 h-4 mr-2" /> {t('adminModerationReject')}
 </Button>
 <Button
 variant="primary"
 disabled={busyId === key}
 onClick={() => moderate(item, 'approved')}
 >
 <CheckIcon className="w-4 h-4 mr-2" /> {item.type === 'book' ? t('adminModerationValidatePublish') : t('adminModerationApprove')}
 </Button>
 </div>
 </div>
 );
})}
 </div>
 )}
 </div>
 </div>
 );
}

export default AdminModeration;
