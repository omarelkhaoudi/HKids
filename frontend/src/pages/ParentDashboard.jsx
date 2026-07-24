import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge, Button, Input, Skeleton} from '../components/ui';

import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {parentalAPI} from '../api/parental';
import {useToast} from '../components/ToastProvider';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {clearKidLocalPrivacyData} from '../services/privacy/privacyStorageService';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {buildKidPayload, createEmptyKidForm, kidToForm} from '../utils/kidProfiles';
import {
 PlusIcon, XIcon, ClockIcon, AudioIcon, SettingsIcon, ShieldIcon,
} from '../components/Icons';
import {KidAvatar} from '../components/parent/KidAvatar';
import {KidProfileFormModal} from '../components/parent/KidProfileFormModal';
import {SettingsCenterModal} from '../components/parent/SettingsCenterModal';
import {ParentDashboardAnalytics} from '../components/parent/ParentDashboardAnalytics';
import {ParentOverviewBoard} from '../components/parent/ParentOverviewBoard';
import {ParentChildProfilePanel} from '../components/parent/ParentChildProfilePanel';
import {ParentFamilySection} from '../components/parent/ParentFamilySection';
import {ParentEmptyState} from '../components/parent/ParentEmptyState';
import {ParentPageShell} from '../components/parent/ParentPageShell';
import {ParentHero} from '../components/parent/ParentHero';
import {ParentControlCenter} from '../components/parent/ParentControlCenter';
import { normalizeRulesForm } from '../constants/parentControlCenter';
import { collectFavoriteThemes, getThemeLabel, getTodayReadingSeconds } from '../utils/parentInsights';

function getGreetingKey(hour) {
 if (hour < 12) return 'goodMorning';
 if (hour < 18) return 'goodAfternoon';
 return 'goodEvening';
}

function ParentDashboard() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const {showToast} = useToast();
 const { requestConfirm, confirmDialog } = useConfirmDialog();
 const { language, t, isRtl } = useLanguage();
 const reducedMotion = useReducedMotion();
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
 const [rulesForm, setRulesForm] = useState(() => normalizeRulesForm({
 daily_screen_time_minutes: 30,
 quiet_start_time: '19:00',
 quiet_end_time: '21:00',
}));

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
 setRulesForm(normalizeRulesForm(res.data));
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
 const kid = kids.find((item) => item.id === kidId);
 const ok = await requestConfirm({
 title: t('confirmTitle'),
 message: t('parentProfilesDeleteConfirm', { name: kid?.name || kid?.username || t('parentDefaultName') }),
 confirmLabel: t('confirmDelete'),
 danger: true,
 });
 if (!ok) return;
 
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
 showToast(error.response?.data?.error || t('parentDeleteError'), 'error');
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
 showToast(error.response?.data?.error || t('parentCreateAccountError'), 'error');
}
};

 const handleLogout = () => {
 logout();
 navigate('/parent/login');
};

 const handleSaveRules = async () => {
 if (!selectedKid) return;

 try {
 setRulesSaving(true);
 const res = await parentalAPI.saveRules(selectedKid.id, rulesForm);
 setRulesForm(normalizeRulesForm(res.data));
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
 const todayReadMinutes = Math.floor(getTodayReadingSeconds(dashboardData) / 60);
 const greetingKey = getGreetingKey(new Date().getHours());
 const progressItems = dashboardData?.progress?.items || [];
 const continueBook = progressItems.find((book) => (book.progress_percent || 0) > 0 && (book.progress_percent || 0) < 100) || progressItems[0] || null;
 const favoriteThemes = collectFavoriteThemes(dashboardData, 3);
 const topThemeLabel = favoriteThemes[0] ? getThemeLabel(favoriteThemes[0].id) : null;
 const heroSubtitle = selectedKid
 ? (todayReadMinutes > 0
 ? t('parentHomeHeroReadToday', { name: selectedKid.name, minutes: todayReadMinutes })
 : t('parentHomeHeroNoReadToday', { name: selectedKid.name }))
 : t('parentHomeTagline');

 const openAddKid = () => {
 setEditingKid(null);
 setKidForm(emptyKidForm);
 setShowKidModal(true);
 };

 const shellProps = {
 isRtl,
 userName: user?.username || 'Parent',
 onSettings: () => setShowSettingsModal(true),
 onLogout: handleLogout,
 subscriptionLabel: dashboardData?.subscription?.plan_name || null,
 };
 
 if (loading) {
 return (
 <ParentPageShell {...shellProps}>
 <div className="flex flex-col gap-6" aria-busy="true" aria-label={t('parentProfilesLoading')}>
 <Skeleton className="h-28 w-full max-w-xl rounded-3xl" />
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <Skeleton className="h-28 w-full rounded-3xl" />
 <Skeleton className="h-28 w-full rounded-3xl" />
 <Skeleton className="h-28 w-full rounded-3xl" />
 <Skeleton className="h-28 w-full rounded-3xl" />
 </div>
 <Skeleton className="h-64 w-full rounded-3xl" />
 </div>
 </ParentPageShell>
 );
}

 return (
 <ParentPageShell {...shellProps}>
 <ParentHero
 currentDate={currentDate}
 greeting={`${t(greetingKey)}, ${user?.username || 'Parent'}`}
 subtitle={heroSubtitle}
 kidsCountLabel={t('parentKidsCount').replace('{count}', String(kids.length))}
 planLabel={dashboardData?.subscription?.plan_name || null}
 themeLabel={topThemeLabel}
 selectedKid={selectedKid}
 continueBook={continueBook}
 onAddKid={openAddKid}
 t={t}
 />

 {kids.length > 0 && (
 <section aria-label={t('parentKidProfiles')} className="mb-space-24">
 <h2 className="sr-only">{t('parentKidProfiles')}</h2>
 <div className="parent-child-rail">
 {kids.map((kid) => {
 const active = selectedKid?.id === kid.id;
 return (
 <button
 key={kid.id}
 type="button"
 onClick={() => handleSelectKid(kid)}
 className={`parent-child-chip ${active ? 'is-active' : ''}`}
 aria-pressed={active}
 >
 <KidAvatar kid={kid} size="sm" />
 <div className="min-w-0">
 <p className="parent-child-chip-name truncate">{kid.name}</p>
 <p className="parent-child-chip-sub">
 {kid.age ? t('parentKidAgeYears', { age: kid.age }) : t('parentKidAgeUnknown')}
 </p>
 </div>
 </button>
 );
 })}
 </div>
 </section>
 )}

 {kids.length === 0 ? (
 <ParentEmptyState
 emoji="🌱"
 title={t('parentNoKids')}
 description={t('parentNoKidsDesc')}
 actionLabel={t('parentAddKid')}
 onAction={openAddKid}
 />
 ) : selectedKid && (
 <>
 <div id="insights">
 <ParentOverviewBoard
 kids={kids}
 selectedKid={selectedKid}
 data={dashboardData}
 language={language}
 t={t}
 />
 </div>

 <section className="parent-kids-showcase" aria-label={t('parentKidProfiles')}>
 {kids.map((kid) => {
 const active = selectedKid?.id === kid.id;
 const storyTitle = active && continueBook ? continueBook.title : null;
 return (
 <button
 key={kid.id}
 type="button"
 className={`parent-kid-showcase-card ${active ? 'is-active' : ''}`}
 onClick={() => handleSelectKid(kid)}
 aria-pressed={active}
 >
 <div className="flex justify-center mb-space-16">
 <KidAvatar kid={kid} size="lg" className="!w-24 !h-24 ring-4 ring-white/80 shadow-floating" />
 </div>
 <h3 className="text-heading-m font-black text-foreground">{kid.name}</h3>
 <p className="text-body text-foreground-secondary font-medium mt-1">
 {kid.age ? t('parentKidAgeYears', { age: kid.age }) : t('parentKidAgeUnknown')}
 </p>
 {active && topThemeLabel ? (
 <span className="parent-kid-showcase-world">{topThemeLabel}</span>
 ) : null}
 {storyTitle ? (
 <p className="parent-kid-showcase-story">{t('parentProgressCurrentStory')}: {storyTitle}</p>
 ) : active && dashboardData ? (
 <p className="parent-kid-showcase-story">
 {t('parentHomeBooksStarted', { count: dashboardData?.progress?.items?.length || 0 })}
 </p>
 ) : null}
 </button>
 );
 })}
 <button type="button" className="parent-kid-showcase-card parent-kid-showcase-add" onClick={openAddKid}>
 <PlusIcon className="w-8 h-8" aria-hidden="true" />
 <span>{t('parentAddKid')}</span>
 </button>
 </section>

 <ParentChildProfilePanel
 kid={selectedKid}
 data={dashboardData}
 t={t}
 isSelected
 onEdit={() => { setEditingKid(selectedKid); setKidForm(kidToForm(selectedKid)); setShowKidModal(true); }}
 onAccount={() => setShowAccountModal(true)}
 onDelete={() => handleDeleteKid(selectedKid.id)}
 />

 <ParentDashboardAnalytics
 data={dashboardData}
 loading={activityLoading}
 language={language}
 t={t}
 kidName={selectedKid.name}
 kid={selectedKid}
 />

 <ParentFamilySection
 t={t}
 kidName={selectedKid.name}
 streakDays={dashboardData?.summary?.reading_streak_days || 0}
 />

 <section aria-labelledby="parent-explore-heading" className="mb-space-32">
 <h2 id="parent-explore-heading" className="text-heading-xl font-black text-foreground mb-space-16">
 {t('parentExploreTitle')}
 </h2>
 <div className="parent-quick-grid">
 <button type="button" className="parent-quick-btn" onClick={openAddKid}>
 <PlusIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
 <span>{t('parentAddKid')}</span>
 </button>
 <button type="button" className="parent-quick-btn" onClick={() => document.getElementById('control-center')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })}>
 <ShieldIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
 <span>{t('pccEyebrow')}</span>
 </button>
 <button type="button" className="parent-quick-btn" onClick={() => navigate('/parent/voices')}>
 <AudioIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
 <span>{t('parentNavVoices')}</span>
 </button>
 <button type="button" className="parent-quick-btn" onClick={() => setShowSettingsModal(true)}>
 <SettingsIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
 <span>{t('parentSettings')}</span>
 </button>
 </div>
 </section>

 <ParentControlCenter
 kid={selectedKid}
 rulesForm={rulesForm}
 setRulesForm={setRulesForm}
 onSaveRules={handleSaveRules}
 rulesSaving={rulesSaving}
 dashboardData={dashboardData}
 activityLoading={activityLoading}
 language={language}
 onEditProfile={() => { setEditingKid(selectedKid); setKidForm(kidToForm(selectedKid)); setShowKidModal(true); }}
 onAddKid={openAddKid}
 onRefreshDashboard={() => loadKidDashboard(selectedKid.id)}
 onOpenOffline={() => navigate('/kids/library')}
 />

 <div id="peace" className="grid grid-cols-1 lg:grid-cols-3 gap-space-24">
 <div className="lg:col-span-2 flex flex-col gap-space-24">
 <section className="parent-control-card parent-panel" aria-labelledby="parent-peace-heading">
 <div className="parent-control-header">
 <div>
 <h2 id="parent-peace-heading" className="text-heading-l font-black text-foreground mb-2">{t('parentPeaceTitle')}</h2>
 <p className="text-body-lg text-foreground-secondary font-medium">{t('parentPeaceSubtitle')}</p>
 </div>
 <div className="parent-control-badge">
 <ClockIcon className="w-4 h-4" aria-hidden="true" />
 <span>{rulesForm.daily_screen_time_minutes} min</span>
 </div>
 </div>
 <div className="space-y-space-24">
 <div className="parent-control-row">
 <div>
 <h3 className="font-black text-foreground">{t('parentScreenTime')}</h3>
 <p className="text-body text-foreground-muted mt-1">{t('parentScreenTimeDesc')}</p>
 </div>
 <Input 
 type="number" 
 value={rulesForm.daily_screen_time_minutes} 
 onChange={(e) => {
 const value = Number.parseInt(e.target.value, 10);
 setRulesForm({...rulesForm, daily_screen_time_minutes: Number.isNaN(value) ? 30 : value});
 }}
 className="w-28 text-center font-bold min-h-touch"
 aria-label={t('parentScreenTime')}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-16">
 <div className="parent-control-row !flex-col !items-stretch">
 <h3 className="font-black mb-space-8">{t('parentQuietStart')}</h3>
 <p className="text-body text-foreground-muted mb-space-8">{t('parentQuietStartDesc')}</p>
 <Input type="time" value={rulesForm.quiet_start_time} onChange={(e) => setRulesForm({...rulesForm, quiet_start_time: e.target.value})} className="w-full font-bold min-h-touch" />
 </div>
 <div className="parent-control-row !flex-col !items-stretch">
 <h3 className="font-black mb-space-8">{t('parentQuietEnd')}</h3>
 <p className="text-body text-foreground-muted mb-space-8">{t('parentQuietEndDesc')}</p>
 <Input type="time" value={rulesForm.quiet_end_time} onChange={(e) => setRulesForm({...rulesForm, quiet_end_time: e.target.value})} className="w-full font-bold min-h-touch" />
 </div>
 </div>

 <div className="pt-space-16 border-t border-border/50 flex justify-end">
 <Button variant="primary" onClick={handleSaveRules} disabled={rulesSaving} className="min-h-touch font-bold">
 {rulesSaving ? t('parentSaving') : t('parentSaveRules')}
 </Button>
 </div>
 </div>
 </section>
 </div>

 <div className="flex flex-col gap-space-24">
 <article className="parent-panel">
 <div className="flex items-center gap-3 mb-space-12">
 <div className="parent-kpi-icon parent-kpi-icon--violet" aria-hidden="true">
 <ShieldIcon className="w-5 h-5" />
 </div>
 <Badge variant="secondary" className="font-bold">
 {dashboardData?.subscription?.status || t('parentFreePlan')}
 </Badge>
 </div>
 <h2 className="text-heading-l font-black mb-1 text-foreground">
 {dashboardData?.subscription?.plan_name || t('parentFreePlan')}
 </h2>
 {dashboardData?.subscription?.current_period_end && (
 <p className="text-foreground-secondary text-body mb-space-24">
 {t('parentSubscriptionExpiry')} : {formatDate(dashboardData.subscription.current_period_end)}
 </p>
 )}
 <Button variant="primary" fullWidth onClick={() => navigate('/abonnements')} className="min-h-touch font-bold">
 {t('parentManageSubscription')}
 </Button>
 </article>
 <article className="parent-aside-note parent-panel">
 <p className="parent-companion-card-label">{t('pccEyebrow')}</p>
 <p className="parent-companion-card-value">
 {t('pccTitle', { name: selectedKid.name })}
 </p>
 <p className="parent-companion-card-subtle">{t('pccSubtitle')}</p>
 </article>
 </div>
 </div>
 </>
 )}

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
 <button type="button" onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-surface-secondary rounded-full transition-colors min-h-touch min-w-touch" aria-label={t('parentCancel')}><XIcon className="w-5 h-5" /></button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold mb-2">{t('parentUsername')}</label>
 <Input type="text" value={accountForm.username} onChange={(e) => setAccountForm({...accountForm, username: e.target.value})} placeholder={t('parentAccountUsernamePlaceholder')} className="w-full" />
 </div>
 <div>
 <label className="block text-sm font-bold mb-2">{t('parentPassword')}</label>
 <Input type="password" value={accountForm.password} onChange={(e) => setAccountForm({...accountForm, password: e.target.value})} placeholder={t('parentAccountPasswordPlaceholder')} className="w-full" />
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
 {confirmDialog}
 </ParentPageShell>
 );
}

export default ParentDashboard;
