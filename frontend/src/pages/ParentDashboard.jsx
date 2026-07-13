import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Card, Button, Badge, Input, Skeleton, Avatar, EmptyState} from '../components/ui';

import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {parentalAPI} from '../api/parental';
import {useToast} from '../components/ToastProvider';
import {CONTENT_LANGUAGES, CONTENT_THEMES, CONTENT_TYPE_OPTIONS, localizeContentOptions} from '../constants/contentOptions';
import {buildKidPayload, createEmptyKidForm, kidToForm} from '../utils/kidProfiles';
import {
 PlusIcon, XIcon, LockIcon, EditIcon, TrashIcon
} from '../components/Icons';
import {KidAvatar} from '../components/parent/KidAvatar';
import {KidProfileFormModal} from '../components/parent/KidProfileFormModal';
import {SettingsCenterModal} from '../components/parent/SettingsCenterModal';
import {ParentCategoryApprovals} from '../components/parent/ParentCategoryApprovals';
import {ParentDashboardAnalytics} from '../components/parent/ParentDashboardAnalytics';
import {ParentHubNav} from '../components/parent/ParentHubNav';
import {ParentReadingGoalCard} from '../components/parent/ParentReadingGoalCard';
import {SettingsIcon} from '../components/Icons';
import { PlatformShell } from '../components/layout/PlatformShell';
import { BRAND_HERO_GRADIENT } from '../constants/brandTheme';

const bedtimeLanguages = CONTENT_LANGUAGES.map((language) => ({
 id: language.id,
 label: language.shortLabel,
}));

const bedtimeThemes = CONTENT_THEMES.map((theme) => ({
 id: theme.id,
 label: theme.libraryLabel || theme.label,
}));

function ParentDashboard() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const {showToast} = useToast();
 const { language, t, isRtl } = useLanguage();
 const contentTypeOptions = localizeContentOptions(CONTENT_TYPE_OPTIONS, language);
 const dashboardRequestRef = useRef(0);
 const rulesRequestRef = useRef(0);
 const [kids, setKids] = useState([]);
 const [selectedKid, setSelectedKid] = useState(null);
 const [dashboardData, setDashboardData] = useState(null);
 const [activityLoading, setActivityLoading] = useState(false);
 const [rulesSaving, setRulesSaving] = useState(false);
 const [loading, setLoading] = useState(true);
 const [showKidModal, setShowKidModal] = useState(false);
 const [showAccountModal, setShowAccountModal] = useState(false);
 const [showSettingsModal, setShowSettingsModal] = useState(false);
 const [editingKid, setEditingKid] = useState(null);
 const emptyKidForm = createEmptyKidForm();
 const [kidForm, setKidForm] = useState(emptyKidForm);
 const [accountForm, setAccountForm] = useState({username: '', password: ''});
 const [kidSaving, setKidSaving] = useState(false);
 const [rulesForm, setRulesForm] = useState({
 daily_screen_time_minutes: 30,
 quiet_start_time: '19:00',
 quiet_end_time: '21:00',
 allowed_languages: [],
 allowed_themes: [],
 allowed_content_types: []
});

 useEffect(() => {
 if (!user) {
 navigate('/parent/login');
 return;
}
 if (user.role !== 'parent' && user.role !== 'admin') {
 navigate('/');
 return;
}
 loadData();
}, [user, navigate]);

 const loadData = async () => {
 try {
 setLoading(true);
 const kidsRes = await parentalAPI.getKids();
 const kidsData = kidsRes.data || [];
 setKids(kidsData);

 const activeKid = kidsData.find((kid) => kid.id === selectedKid?.id) || kidsData[0] || null;
 setSelectedKid(activeKid);
 if (activeKid) {
 loadKidDashboard(activeKid.id);
 loadRules(activeKid.id);
 } else {
 setDashboardData(null);
}
} catch (error) {
 console.error('Error loading data:', error);
 showToast(t('parentLoadDataError'), 'error');
} finally {
 setLoading(false);
}
};

 const loadKidDashboard = async (kidId) => {
 const requestId = ++dashboardRequestRef.current;
 try {
 setActivityLoading(true);
 const response = await parentalAPI.getKidDashboard(kidId);
 if (requestId !== dashboardRequestRef.current) return;
 setDashboardData(response.data);
} catch (error) {
 if (requestId !== dashboardRequestRef.current) return;
 console.error('Parent dashboard data unavailable:', error);
 setDashboardData(null);
 showToast(t('parentStatsError'), 'error');
} finally {
 if (requestId === dashboardRequestRef.current) setActivityLoading(false);
}
};

 const loadRules = async (kidId) => {
 const requestId = ++rulesRequestRef.current;
 try {
 const res = await parentalAPI.getRules(kidId);
 if (requestId !== rulesRequestRef.current) return;
 setRulesForm({
 daily_screen_time_minutes: res.data?.daily_screen_time_minutes ?? 30,
 quiet_start_time: res.data?.quiet_start_time || '19:00',
 quiet_end_time: res.data?.quiet_end_time || '21:00',
 allowed_languages: res.data?.allowed_languages || [],
 allowed_themes: res.data?.allowed_themes || [],
 allowed_content_types: res.data?.allowed_content_types || []
});
} catch (error) {
 if (requestId !== rulesRequestRef.current) return;
 console.error('Error loading parental rules:', error);
 showToast(t('parentRulesError'), 'error');
}
};

 const handleSelectKid = (kid) => {
 setSelectedKid(kid);
 setDashboardData(null);
 loadKidDashboard(kid.id);
 loadRules(kid.id);
};

 const handleSaveKid = async () => {
 const payload = buildKidPayload(kidForm);

 if (!payload.name) {
 showToast(t('parentFirstNameRequired'), 'error');
 return;
}

 try {
 setKidSaving(true);
 if (editingKid) {
 await parentalAPI.updateKid(editingKid.id, payload);
 showToast(t('parentKidSaved'), 'success');
} else {
 await parentalAPI.createKid(payload);
 showToast(t('parentKidSaved'), 'success');
}
 setShowKidModal(false);
 setEditingKid(null);
 setKidForm(emptyKidForm);
 loadData();
} catch (error) {
 console.error('Error saving kid:', error);
 showToast(error.response?.data?.error || t('parentRulesError'), 'error');
} finally {
 setKidSaving(false);
}
};

 const handleDeleteKid = async (kidId) => {
 if (!window.confirm('Supprimer définitivement ce profil et toutes ses données ?')) return;
 
 try {
 await parentalAPI.deleteKid(kidId);
 await clearKidLocalPrivacyData(kidId);
 showToast(t('parentKidDeleted'), 'success');
 if (selectedKid?.id === kidId) {
 setSelectedKid(null);
 setDashboardData(null);
}
 loadData();
} catch (error) {
 console.error('Error deleting kid:', error);
 showToast(error.response?.data?.error || 'Erreur lors de la suppression', 'error');
}
};

 const handleCreateAccount = async () => {
 try {
 await parentalAPI.createKidAccount(selectedKid.id, accountForm.username, accountForm.password);
 showToast(t('parentAccountCreated'), 'success');
 setShowAccountModal(false);
 setAccountForm({username: '', password: ''});
} catch (error) {
 console.error('Error creating account:', error);
 showToast(error.response?.data?.error || 'Erreur lors de la création du compte', 'error');
}
};

 const handleLogout = () => {
 logout();
 navigate('/parent/login');
};

 const toggleRuleValue = (field, value) => {
 setRulesForm((current) => {
 const values = current[field] || [];
 const nextValues = values.includes(value)
 ? values.filter((item) => item !== value)
 : [...values, value];

 return {...current, [field]: nextValues};
});
};

 const handleSaveRules = async () => {
 if (!selectedKid) return;

 try {
 setRulesSaving(true);
 const res = await parentalAPI.saveRules(selectedKid.id, rulesForm);
 setRulesForm({
 daily_screen_time_minutes: res.data?.daily_screen_time_minutes ?? rulesForm.daily_screen_time_minutes,
 quiet_start_time: res.data?.quiet_start_time || rulesForm.quiet_start_time,
 quiet_end_time: res.data?.quiet_end_time || rulesForm.quiet_end_time,
 allowed_languages: res.data?.allowed_languages || [],
 allowed_themes: res.data?.allowed_themes || [],
 allowed_content_types: res.data?.allowed_content_types || []
});
 showToast(t('parentRulesSaved'), 'success');
 await loadKidDashboard(selectedKid.id);
} catch (error) {
 console.error('Error saving parental rules:', error);
 showToast(t('parentRulesError'), 'error');
} finally {
 setRulesSaving(false);
}
};

 const formatDate = (value) => {
 if (!value) return t('parentNever');
 const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';
 return new Date(value).toLocaleDateString(locale, {
 day: '2-digit',
 month: 'short',
 hour: '2-digit',
 minute: '2-digit'
});
};

 const currentDate = new Date().toLocaleDateString(
 language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR',
 {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}
);
 
 if (loading) {
 return (
 <PlatformShell variant="platform" className="p-8 flex flex-col gap-6">
 <Skeleton className="h-48 w-full rounded-3xl" />
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <Skeleton className="h-32 w-full rounded-3xl" />
 <Skeleton className="h-32 w-full rounded-3xl" />
 <Skeleton className="h-32 w-full rounded-3xl" />
 <Skeleton className="h-32 w-full rounded-3xl" />
 </div>
 </PlatformShell>
 );
}

 return (
 <PlatformShell variant="platform" isRtl={isRtl} className="pb-24">
 {/* 1. Dashboard Hero */}
 <div className={`relative bg-gradient-to-r ${BRAND_HERO_GRADIENT} text-white pb-24 pt-8 px-6 md:px-12 overflow-hidden shadow-lg`}>
 {/* Animated background elements */}
 <motion.div animate={{rotate: 360}} transition={{duration: 150, repeat: Infinity, ease: 'linear'}} className="absolute -top-32 -right-32 w-96 h-96 bg-card/10 rounded-full blur-3xl pointer-events-none" />
 <motion.div animate={{rotate: -360}} transition={{duration: 200, repeat: Infinity, ease: 'linear'}} className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-card/10 rounded-full blur-3xl pointer-events-none" />
 
 <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-6">
 <Avatar src={null} fallback={user?.username?.[0] || 'P'} size="xl" className="border-4 border-white/20 shadow-xl" />
 <div>
 <p className="text-white/80 font-medium capitalize">{currentDate}</p>
 <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">{t('parentGreeting')}, {user?.username || 'Parent'} !</h1>
 <div className="flex items-center gap-3">
 <Badge variant="glass" className="bg-card/20 text-white border-none font-bold">
 {t('parentKidsCount').replace('{count}', String(kids.length))}
 </Badge>
 {dashboardData?.subscription && (
 <Badge variant="glass" className="bg-secondary-500/80 text-white border-none font-bold">
 {dashboardData.subscription.plan_name}
 </Badge>
 )}
 </div>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row gap-3">
 <Button variant="glass" onClick={() => setShowSettingsModal(true)} className="bg-card/10 hover:bg-card/20 text-white font-bold border-none shrink-0">
 <SettingsIcon className="w-5 h-5 mr-2" /> {t('parentSettings')}
 </Button>
 <Button variant="glass" onClick={handleLogout} className="bg-card/10 hover:bg-card/20 text-white font-bold border-none shrink-0">{t('parentLogout')}</Button>
 <Button variant="glass" onClick={() => {setEditingKid(null); setKidForm(emptyKidForm); setShowKidModal(true);}} className="bg-card hover:bg-surface-secondary text-foreground-600 font-bold border-none shadow-xl shrink-0">
 <PlusIcon className="w-5 h-5 mr-2" /> {t('parentAddKid')}
 </Button>
 </div>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-16 relative z-20 flex flex-col gap-8">

 <ParentHubNav />

 {selectedKid && <ParentDashboardAnalytics data={dashboardData} loading={activityLoading} language={language} t={t} />}

 {/* 3. Children Profiles Grid */}
 <div>
 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">{t('parentKidProfiles')}</h2>
 {kids.length === 0 ? (
 <EmptyState 
 title={t('parentNoKids')} 
 description={t('parentNoKidsDesc')} 
 actionLabel={t('parentAddKid')} 
 onAction={() => {setEditingKid(null); setKidForm(emptyKidForm); setShowKidModal(true);}}
 />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {kids.map(kid => (
 <Card 
 key={kid.id} 
 className={`p-0 overflow-hidden shadow-floating transition-all ${selectedKid?.id === kid.id ? 'ring-4 ring-primary-500' : 'hover:shadow-xl'}`}
 onClick={() => handleSelectKid(kid)}
 >
 <div className="p-6 cursor-pointer bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-800/80">
 <div className="flex items-start justify-between mb-6">
 <div className="flex items-center gap-4">
 <KidAvatar kid={kid} size="lg" />
 <div>
 <h3 className="text-xl font-bold">{kid.name}</h3>
 <div className="flex gap-2 mt-1">
 {kid.age && <Badge variant="secondary">{kid.age} ans</Badge>}
 </div>
 </div>
 </div>
 </div>
 
 <div className="space-y-4">
 {selectedKid?.id === kid.id && (
 <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="pt-4 grid grid-cols-2 gap-2 border-t border-border">
 <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); setEditingKid(kid); setKidForm(kidToForm(kid)); setShowKidModal(true);}} className="font-bold text-xs"><EditIcon className="w-4 h-4 mr-1"/> {t('parentEditKid')}</Button>
 <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); setShowAccountModal(true);}} className="font-bold text-xs"><LockIcon className="w-4 h-4 mr-1"/> {t('parentKidAccount')}</Button>
 <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); handleDeleteKid(kid.id);}} className="font-bold text-xs text-danger-500 hover:bg-danger-50 hover:text-danger-600 col-span-2 border border-transparent hover:border-danger-200"><TrashIcon className="w-4 h-4 mr-1"/> {t('parentDeleteKid')}</Button>
 </motion.div>
 )}
 </div>
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>

 {selectedKid && (
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 <div className="lg:col-span-2 flex flex-col gap-8">
 {/* 5. Parental Controls */}
 <Card className="p-6 shadow-floating">
 <h2 className="text-xl font-bold mb-6">{t('parentRulesTitle')}</h2>
 <div className="space-y-6">
 <div className="flex items-center justify-between p-4 bg-surface-secondary/50 rounded-2xl">
 <div>
 <h4 className="font-bold">{t('parentScreenTime')}</h4>
 <p className="text-sm text-foreground-muted">{t('parentScreenTimeDesc')}</p>
 </div>
 <Input 
 type="number" 
 value={rulesForm.daily_screen_time_minutes} 
 onChange={(e) => {
 const value = Number.parseInt(e.target.value, 10);
 setRulesForm({...rulesForm, daily_screen_time_minutes: Number.isNaN(value) ? 30 : value});
 }}
 className="w-24 text-center font-bold"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-surface-secondary/50 rounded-2xl">
 <h4 className="font-bold mb-2">{t('parentQuietStart')}</h4>
 <Input type="time" value={rulesForm.quiet_start_time} onChange={(e) => setRulesForm({...rulesForm, quiet_start_time: e.target.value})} className="w-full font-bold" />
 </div>
 <div className="p-4 bg-surface-secondary/50 rounded-2xl">
 <h4 className="font-bold mb-2">{t('parentQuietEnd')}</h4>
 <Input type="time" value={rulesForm.quiet_end_time} onChange={(e) => setRulesForm({...rulesForm, quiet_end_time: e.target.value})} className="w-full font-bold" />
 </div>
 </div>

 <div className="pt-4 border-t border-border flex justify-end">
 <Button variant="primary" onClick={handleSaveRules} disabled={rulesSaving}>
 {rulesSaving ? t('parentSaving') : t('parentSaveRules')}
 </Button>
 </div>
 </div>
 </Card>

 {/* Theme & Language Permissions */}
 <Card className="p-6 shadow-floating">
 <h2 className="text-xl font-bold mb-6">{t('parentReadingPermissions')}</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h4 className="font-bold mb-3">{t('parentAllowedLanguages')}</h4>
 <div className="flex flex-wrap gap-2">
 {bedtimeLanguages.map(lang => (
 <div key={lang.id} onClick={() => toggleRuleValue('allowed_languages', lang.id)} className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors border-2 ${rulesForm.allowed_languages.includes(lang.id) ? 'bg-primary-500 border-primary-500 text-white' : 'bg-transparent border-border text-foreground-secondary hover:border-primary-300'}`}>
 {lang.label}
 </div>
 ))}
 </div>
 </div>
 <div>
 <h4 className="font-bold mb-3">{t('parentAllowedThemes')}</h4>
 <div className="flex flex-wrap gap-2">
 {bedtimeThemes.map(theme => (
 <div key={theme.id} onClick={() => toggleRuleValue('allowed_themes', theme.id)} className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors border-2 ${rulesForm.allowed_themes.includes(theme.id) ? 'bg-secondary-500 border-secondary-500 text-white' : 'bg-transparent border-border text-foreground-secondary hover:border-secondary-300'}`}>
 {theme.label}
 </div>
 ))}
 </div>
 </div>
 </div>
 <div className="mt-6">
 <h4 className="font-bold mb-3">{t('parentAllowedContentTypes')}</h4>
 <div className="flex flex-wrap gap-2">
 {contentTypeOptions.map((type) => (
 <div key={type.id} onClick={() => toggleRuleValue('allowed_content_types', type.id)} className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors border-2 ${rulesForm.allowed_content_types.includes(type.id) ? 'bg-secondary-500 border-secondary-600 text-white' : 'bg-transparent border-border text-foreground-secondary hover:border-secondary-300'}`}>
 {type.label}
 </div>
 ))}
 </div>
 </div>
 <div className="pt-4 border-t border-border flex justify-end">
 <Button variant="primary" onClick={handleSaveRules} disabled={rulesSaving}>
 {rulesSaving ? t('parentSaving') : t('parentSaveRules')}
 </Button>
 </div>
 </Card>

 <ParentReadingGoalCard
 kidId={selectedKid?.id}
 goal={dashboardData?.goal}
 onSaved={() => loadKidDashboard(selectedKid.id)}
 />

 <ParentCategoryApprovals kidId={selectedKid?.id} />
 </div>

 {/* Sidebar (Right) */}
 <div className="flex flex-col gap-8">
 <div className={`bg-gradient-to-br ${BRAND_HERO_GRADIENT} text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden`}>
 <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/20 rounded-full blur-2xl"></div>
 <Badge variant="glass" className="bg-card/20 text-white border-none font-bold mb-4">
 {dashboardData?.subscription?.status || 'Sans abonnement actif'}
 </Badge>
 <h2 className="text-2xl font-black mb-1">{dashboardData?.subscription?.plan_name || t('parentFreePlan')}</h2>
 {dashboardData?.subscription?.current_period_end && (
 <p className="text-white/70 text-sm mb-6">{t('parentSubscriptionExpiry')} : {formatDate(dashboardData.subscription.current_period_end)}</p>
 )}
 <Button variant="outline" fullWidth onClick={() => navigate('/abonnements')} className="bg-card hover:bg-surface-secondary text-black border-none font-bold">{t('parentManageSubscription')}</Button>
 </div>
 </div>

 </motion.div>
 )}
 </div>

 {/* Kid profile modal */}
 <KidProfileFormModal
 open={showKidModal}
 editingKid={editingKid}
 form={kidForm}
 onChange={setKidForm}
 onClose={() => { setShowKidModal(false); setEditingKid(null); }}
 onSubmit={handleSaveKid}
 saving={kidSaving}
 />

 <AnimatePresence>
 {showAccountModal && (
 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAccountModal(false)}>
 <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} onClick={(e) => e.stopPropagation()} className="bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-2xl font-black">{t('parentAccountTitle').replace('{name}', selectedKid?.name || '')}</h3>
 <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-surface-secondary rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold mb-2">{t('parentUsername')}</label>
 <Input type="text" value={accountForm.username} onChange={(e) => setAccountForm({...accountForm, username: e.target.value})} placeholder="Nom d'utilisateur" className="w-full" />
 </div>
 <div>
 <label className="block text-sm font-bold mb-2">{t('parentPassword')}</label>
 <Input type="password" value={accountForm.password} onChange={(e) => setAccountForm({...accountForm, password: e.target.value})} placeholder="Mot de passe (min. 6 caractères)" className="w-full" />
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="ghost" className="flex-1" onClick={() => setShowAccountModal(false)}>{t('parentCancel')}</Button>
 <Button variant="primary" className="flex-1" onClick={handleCreateAccount}>{t('parentCreateAccount')}</Button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 
 <SettingsCenterModal 
 isOpen={showSettingsModal}
 onClose={() => setShowSettingsModal(false)}
 />
 </PlatformShell>
 );
}

export default ParentDashboard;
