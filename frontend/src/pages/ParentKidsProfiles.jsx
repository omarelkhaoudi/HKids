import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AnimatePresence} from 'framer-motion';
import {parentalAPI} from '../api/parental';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {useToast} from '../components/ToastProvider';
import {Logo} from '../components/Logo';
import {KidProfilesList} from '../components/parent/KidProfilesList';
import {KidProfileFormModal} from '../components/parent/KidProfileFormModal';
import {ParentHubNav} from '../components/parent/ParentHubNav';
import {Skeleton} from '../components/ui';
import {LogOutIcon} from '../components/Icons';
import {buildKidPayload, createEmptyKidForm, kidToForm} from '../utils/kidProfiles';
import {clearKidLocalPrivacyData} from '../services/privacy/privacyStorageService';

function ParentKidsProfiles() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const {showToast} = useToast();
 const { t, isRtl } = useLanguage();
 const [kids, setKids] = useState([]);
 const [selectedKid, setSelectedKid] = useState(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [showModal, setShowModal] = useState(false);
 const [editingKid, setEditingKid] = useState(null);
 const [form, setForm] = useState(() => createEmptyKidForm());

 const selectedKidId = selectedKid?.id || kids[0]?.id;

 useEffect(() => {
 if (!user) {
 navigate('/parent/login');
 return;
}

 if (user.role !== 'parent' && user.role !== 'admin') {
 navigate('/');
 return;
}

 loadKids();
}, [user, navigate]);

 const stats = useMemo(() => {
 const withPhoto = kids.filter((kid) => kid.photo_url || kid.avatar).length;
 const withInterests = kids.filter((kid) => Array.isArray(kid.interests) && kid.interests.length > 0).length;

 return [
 {label: t('parentProfilesStatProfiles'), value: kids.length},
 {label: t('parentProfilesStatAvatar'), value: withPhoto},
 {label: t('parentProfilesStatInterests'), value: withInterests},
 ];
}, [kids, t]);

 const loadKids = async () => {
 try {
 setLoading(true);
 const response = await parentalAPI.getKids();
 const kidsData = response.data || [];
 setKids(kidsData);
 setSelectedKid((current) => {
 if (!kidsData.length) return null;
 return kidsData.find((kid) => kid.id === current?.id) || kidsData[0];
});
} catch (error) {
 console.error('Error loading kids profiles:', error);
 showToast(t('parentProfilesLoadError'), 'error');
} finally {
 setLoading(false);
}
};

 const openCreateModal = () => {
 setEditingKid(null);
 setForm(createEmptyKidForm());
 setShowModal(true);
};

 const openEditModal = (kid) => {
 setEditingKid(kid);
 setForm(kidToForm(kid));
 setShowModal(true);
};

 const closeModal = () => {
 setShowModal(false);
 setEditingKid(null);
 setForm(createEmptyKidForm());
};

 const handleSave = async () => {
 const payload = buildKidPayload(form);

 if (!payload.name) {
 showToast(t('parentFirstNameRequired'), 'error');
 return;
}

 try {
 setSaving(true);
 const response = editingKid
 ? await parentalAPI.updateKid(editingKid.id, payload)
 : await parentalAPI.createKid(payload);

 showToast(t('parentKidSaved'), 'success');
 closeModal();
 await loadKids();
 setSelectedKid(response.data);
} catch (error) {
 console.error('Error saving kid profile:', error);
 showToast(error.response?.data?.error || t('parentProfilesSaveError'), 'error');
} finally {
 setSaving(false);
}
};

 const handleDelete = async (kid) => {
 const confirmed = window.confirm(t('parentProfilesDeleteConfirm', { name: kid.name }));
 if (!confirmed) return;

 try {
 await parentalAPI.deleteKid(kid.id);
 await clearKidLocalPrivacyData(kid.id);
 showToast(t('parentKidDeleted'), 'success');
 if (selectedKid?.id === kid.id) setSelectedKid(null);
 await loadKids();
} catch (error) {
 console.error('Error deleting kid profile:', error);
 showToast(error.response?.data?.error || t('parentProfilesSaveError'), 'error');
}
};

 const handleLogout = () => {
 logout();
 navigate('/parent/login');
};

 if (loading) {
 return (
 <div className="min-h-screen parent-home-shell bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800" dir={isRtl ? 'rtl' : 'ltr'}>
 <div className="mx-auto max-w-7xl px-space-16 py-space-32 sm:px-space-24 lg:px-space-32 flex flex-col gap-space-24">
 <Skeleton className="h-20 w-full max-w-md rounded-2xl" />
 <div className="grid grid-cols-1 gap-space-16 sm:grid-cols-3">
 <Skeleton className="h-24 rounded-3xl" />
 <Skeleton className="h-24 rounded-3xl" />
 <Skeleton className="h-24 rounded-3xl" />
 </div>
 <Skeleton className="h-96 w-full rounded-3xl" />
 </div>
 </div>
 );
}

 return (
 <div className="min-h-screen parent-home-shell bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800" dir={isRtl ? 'rtl' : 'ltr'}>
 <div className="mx-auto max-w-7xl px-space-16 py-space-32 sm:px-space-24 lg:px-space-32">
 <header className="mb-space-32 flex flex-col gap-space-16 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-space-16">
 <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-2xl">
 <Logo size="default" showText={true} />
 </Link>
 <div>
 <h1 className="text-hero font-black text-foreground tracking-tight">
 {t('parentProfilesTitle')}
 </h1>
 <p className="text-body-lg text-foreground-secondary font-medium mt-1">
 {t('parentProfilesDesc')}
 </p>
 </div>
 </div>
 <div className="flex gap-space-12">
 <Link
 to="/parent"
 className="rounded-32 bg-card px-space-16 py-space-12 font-bold text-foreground-secondary shadow-card border border-border/50 transition hover:shadow-floating min-h-touch inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
 >
 {t('parentProfilesDashboard')}
 </Link>
 <button
 type="button"
 onClick={handleLogout}
 className="inline-flex items-center gap-2 rounded-32 bg-primary-500 px-space-16 py-space-12 font-bold text-white transition hover:bg-primary-600 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
 >
 <LogOutIcon className="h-5 w-5" aria-hidden="true" />
 <span>{t('parentProfilesLogout')}</span>
 </button>
 </div>
 </header>

 <ParentHubNav className="mb-space-32" />

 <div className="mb-space-32 grid grid-cols-1 gap-space-16 md:grid-cols-3">
 {stats.map((item) => (
 <div key={item.label} className="parent-warm-card text-center md:text-start">
 <span className="text-3xl mb-space-8 block" aria-hidden="true">
 {item.label === t('parentProfilesStatProfiles') ? '👧' : item.label === t('parentProfilesStatAvatar') ? '📸' : '✨'}
 </span>
 <span className="text-caption font-bold text-foreground-muted uppercase tracking-wide">
 {item.label}
 </span>
 <span className="mt-1 block text-heading-xl font-black text-foreground">
 {item.value}
 </span>
 </div>
 ))}
 </div>

 <KidProfilesList
 kids={kids}
 selectedKidId={selectedKidId}
 onSelect={setSelectedKid}
 onAdd={openCreateModal}
 onEdit={openEditModal}
 onDelete={handleDelete}
 />
 </div>

 <AnimatePresence>
 {showModal && (
 <KidProfileFormModal
 open={showModal}
 editingKid={editingKid}
 form={form}
 onChange={setForm}
 onClose={closeModal}
 onSubmit={handleSave}
 saving={saving}
 />
 )}
 </AnimatePresence>
 </div>
 );
}

export default ParentKidsProfiles;
