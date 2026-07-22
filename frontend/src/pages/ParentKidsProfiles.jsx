import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {AnimatePresence} from 'framer-motion';
import {parentalAPI} from '../api/parental';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {useToast} from '../components/ToastProvider';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {KidProfilesList} from '../components/parent/KidProfilesList';
import {KidProfileFormModal} from '../components/parent/KidProfileFormModal';
import {ParentPageShell} from '../components/parent/ParentPageShell';
import {Skeleton} from '../components/ui';
import {buildKidPayload, createEmptyKidForm, kidToForm} from '../utils/kidProfiles';
import {clearKidLocalPrivacyData} from '../services/privacy/privacyStorageService';

function ParentKidsProfiles() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const {showToast} = useToast();
 const { requestConfirm, confirmDialog } = useConfirmDialog();
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
 const confirmed = await requestConfirm({
 title: t('confirmTitle'),
 message: t('parentProfilesDeleteConfirm', { name: kid.name }),
 confirmLabel: t('confirmDelete'),
 danger: true,
 });
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

 const shellProps = {
 isRtl,
 userName: user?.username || 'Parent',
 onLogout: handleLogout,
 };

 if (loading) {
 return (
 <ParentPageShell {...shellProps}>
 <div className="flex flex-col gap-space-24" aria-busy="true">
 <Skeleton className="h-20 w-full max-w-md rounded-2xl" />
 <div className="grid grid-cols-1 gap-space-16 sm:grid-cols-3">
 <Skeleton className="h-24 rounded-3xl" />
 <Skeleton className="h-24 rounded-3xl" />
 <Skeleton className="h-24 rounded-3xl" />
 </div>
 <Skeleton className="h-96 w-full rounded-3xl" />
 </div>
 </ParentPageShell>
 );
}

 return (
 <ParentPageShell {...shellProps}>
 <header className="parent-welcome-block">
 <p className="parent-welcome-kicker">{t('parentNavProfiles')}</p>
 <h1 className="parent-welcome-title">{t('parentProfilesTitle')}</h1>
 <p className="parent-welcome-copy">{t('parentProfilesDesc')}</p>
 </header>

 <div className="mb-space-32 grid grid-cols-1 gap-space-16 md:grid-cols-3">
 {stats.map((item, index) => {
 const tone = ['violet', 'mint', 'peach'][index] || 'violet';
 return (
 <div key={item.label} className={`parent-kpi-card parent-kpi-card--${tone}`}>
 <p className="parent-kpi-label">{item.label}</p>
 <p className="parent-kpi-value">{item.value}</p>
 </div>
 );
 })}
 </div>

 <KidProfilesList
 kids={kids}
 selectedKidId={selectedKidId}
 onSelect={setSelectedKid}
 onAdd={openCreateModal}
 onEdit={openEditModal}
 onDelete={handleDelete}
 />

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
 {confirmDialog}
 </ParentPageShell>
 );
}

export default ParentKidsProfiles;
