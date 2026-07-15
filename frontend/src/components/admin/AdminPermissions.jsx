import {useEffect, useState} from 'react';
import {adminAPI} from '../../api/admin';
import {useAuth} from '../../context/AuthContext';
import {Badge, Button} from '../ui';
import {ShieldIcon, UserIcon} from '../Icons';
import { useLanguage } from '../../context/LanguageContext';

function AdminPermissions() {
 const {user} = useAuth();
 const { t } = useLanguage();
 const PERMISSION_LABELS = {
  'overview.read': t('adminPermViewDashboard'),
  'users.read': t('adminPermViewUsers'),
  'users.delete': t('adminPermDeleteUsers'),
  'content.read': t('adminPermViewModeration'),
  'content.moderate': t('adminPermModerateContent'),
  'books.validate': t('adminPermValidateBooks'),
  'subscriptions.read': t('adminPermViewSubscriptions'),
  'subscriptions.manage': t('adminPermManageSubscriptions'),
  'reports.read': t('adminPermViewReports'),
  'reports.manage': t('adminPermManageReports'),
  'audit.read': t('adminPermViewAudit'),
  'permissions.manage': t('adminPermManagePermissions'),
  'search.use': t('adminPermAdvancedSearch'),
 };
 const [admins, setAdmins] = useState([]);
 const [available, setAvailable] = useState([]);
 const [drafts, setDrafts] = useState({});
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [savingId, setSavingId] = useState(null);

 const load = async () => {
 try {
 setLoading(true);
 const response = await adminAPI.getPermissions();
 const nextAdmins = response.data?.admins || [];
 setAdmins(nextAdmins);
 setAvailable(response.data?.available_permissions || []);
 setDrafts(Object.fromEntries(nextAdmins.map((admin) => [admin.id, {
 unrestricted: admin.unrestricted,
 permissions: [...(admin.permissions || [])]
}])));
 setError('');
} catch (err) {
 setError(err.response?.data?.error || t('adminPermissionsLoadError'));
} finally {
 setLoading(false);
}
};

 useEffect(() => {load();}, []);

 const togglePermission = (adminId, permission) => {
 setDrafts((current) => {
 const draft = current[adminId];
 const permissions = draft.permissions.includes(permission)
 ? draft.permissions.filter((item) => item !== permission)
 : [...draft.permissions, permission];
 return {...current, [adminId]: {...draft, unrestricted: false, permissions}};
});
};

 const save = async (adminId) => {
 const draft = drafts[adminId];
 try {
 setSavingId(adminId);
 await adminAPI.setPermissions(adminId, draft.unrestricted ? null : draft.permissions);
 await load();
} catch (err) {
 setError(err.response?.data?.error || t('adminPermissionsSaveError'));
} finally {
 setSavingId(null);
}
};

 return (
 <div className="space-y-6 pb-12">
 <div>
 <h1 className="text-3xl font-black tracking-tight">{t('adminPermissionsTitle')}</h1>
 <p className="text-foreground-muted font-medium mt-1">{t('adminPermissionsSubtitle')}</p>
 </div>

 {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">{error}</div>}

 {loading ? (
 <div className="p-10 text-center text-foreground-muted">{t('adminLoading')}</div>
 ) : (
 <div className="grid gap-5">
 {admins.map((admin) => {
 const draft = drafts[admin.id] || {unrestricted: false, permissions: []};
 const isSelf = Number(admin.id) === Number(user?.id);
 return (
 <div key={admin.id} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-xl bg-surface-secondary flex items-center justify-center"><UserIcon className="w-5 h-5 text-surface-400" /></div>
 <div>
 <h2 className="font-black text-lg">{admin.username}</h2>
 <div className="flex gap-2 mt-1">
 {isSelf && <Badge variant="primary">{t('adminPermissionsYou')}</Badge>}
 {draft.unrestricted && <Badge variant="success">{t('adminPermissionsFullAccess')}</Badge>}
 </div>
 </div>
 </div>
 {!isSelf && (
 <label className="flex items-center gap-2 font-bold text-sm">
 <input
 type="checkbox"
 checked={draft.unrestricted}
 onChange={(event) => setDrafts((current) => ({
 ...current,
 [admin.id]: {
 ...current[admin.id],
 unrestricted: event.target.checked,
 permissions: event.target.checked ? [...available] : current[admin.id].permissions
}
}))}
 />
 {t('adminPermissionsFullAccessToggle')}
 </label>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
 {available.map((permission) => (
 <label key={permission} className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-medium ${draft.permissions.includes(permission) ? 'border-primary-200 bg-primary-50' : 'border-border bg-surface-secondary'}`}>
 <input
 type="checkbox"
 disabled={isSelf || draft.unrestricted}
 checked={draft.permissions.includes(permission)}
 onChange={() => togglePermission(admin.id, permission)}
 />
 <span>{PERMISSION_LABELS[permission] || permission}</span>
 </label>
 ))}
 </div>

 {!isSelf && (
 <div className="flex justify-end mt-5">
 <Button variant="primary" onClick={() => save(admin.id)} disabled={savingId === admin.id}>
 <ShieldIcon className="w-4 h-4 mr-2" /> {savingId === admin.id ? t('adminPermissionsSaving') : t('adminSave')}
 </Button>
 </div>
 )}
 </div>
 );
})}
 </div>
 )}
 </div>
 );
}

export default AdminPermissions;
