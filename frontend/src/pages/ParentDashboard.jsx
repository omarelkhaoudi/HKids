import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge, Button, Input, Skeleton, Avatar} from '../components/ui';

import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {parentalAPI} from '../api/parental';
import {useToast} from '../components/ToastProvider';
import {clearKidLocalPrivacyData} from '../services/privacy/privacyStorageService';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {getMotionProps, kidsPageEnter} from '../constants/kidsMotion';
import {CONTENT_LANGUAGES, CONTENT_THEMES, CONTENT_TYPE_OPTIONS, localizeContentOptions} from '../constants/contentOptions';
import {buildKidPayload, createEmptyKidForm, kidToForm} from '../utils/kidProfiles';
import {
 PlusIcon, XIcon, SettingsIcon, ClockIcon, SparklesIcon, CategoryIcon, StarIcon, BookIcon
} from '../components/Icons';
import {KidAvatar} from '../components/parent/KidAvatar';
import {KidProfileFormModal} from '../components/parent/KidProfileFormModal';
import {SettingsCenterModal} from '../components/parent/SettingsCenterModal';
import {ParentCategoryApprovals} from '../components/parent/ParentCategoryApprovals';
import {ParentDashboardAnalytics} from '../components/parent/ParentDashboardAnalytics';
import {ParentHubNav} from '../components/parent/ParentHubNav';
import {ParentReadingGoalCard} from '../components/parent/ParentReadingGoalCard';
import {ParentChildProfilePanel} from '../components/parent/ParentChildProfilePanel';
import {ParentFamilySection} from '../components/parent/ParentFamilySection';
import {ParentEmptyState} from '../components/parent/ParentEmptyState';
import { PlatformShell } from '../components/layout/PlatformShell';
import { BRAND_HERO_GRADIENT } from '../constants/brandTheme';
import { collectFavoriteThemes, getThemeLabel, getTodayReadingSeconds } from '../utils/parentInsights';

const bedtimeLanguages = CONTENT_LANGUAGES.map((language) => ({
 id: language.id,
 label: language.shortLabel,
}));

const bedtimeThemes = CONTENT_THEMES.map((theme) => ({
 id: theme.id,
 label: theme.libraryLabel || theme.label,
}));

function getGreetingKey(hour) {
 if (hour < 12) return 'goodMorning';
 if (hour < 18) return 'goodAfternoon';
 return 'goodEvening';
}

function ParentDashboard() {
 const {user, logout} = useAuth();
 const navigate = useNavigate();
 const {showToast} = useToast();
 const { language, t, isRtl } = useLanguage();
 const reducedMotion = useReducedMotion();
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
 const kid = kids.find((item) => item.id === kidId);
 if (!window.confirm(t('parentProfilesDeleteConfirm', { name: kid?.name || kid?.username || t('parentDefaultName') }))) return;
 
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
 const todayReadMinutes = Math.floor(getTodayReadingSeconds(dashboardData) / 60);
 const greetingKey = getGreetingKey(new Date().getHours());
 const progressItems = dashboardData?.progress?.items || [];
 const continueBook = progressItems.find((book) => (book.progress_percent || 0) > 0 && (book.progress_percent || 0) < 100) || progressItems[0] || null;
 const favoriteThemes = collectFavoriteThemes(dashboardData, 3);
 const topThemeLabel = favoriteThemes[0] ? getThemeLabel(favoriteThemes[0].id) : null;
 const summary = dashboardData?.summary || {};
 const selectedLanguagesCount = rulesForm.allowed_languages.length || bedtimeLanguages.length;
 const selectedThemesCount = rulesForm.allowed_themes.length || bedtimeThemes.length;
 const selectedContentTypesCount = rulesForm.allowed_content_types.length || contentTypeOptions.length;
 const heroSubtitle = selectedKid
 ? (todayReadMinutes > 0
 ? t('parentHomeHeroReadToday', { name: selectedKid.name, minutes: todayReadMinutes })
 : t('parentHomeHeroNoReadToday', { name: selectedKid.name }))
 : t('parentHomeTagline');
 
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
 <PlatformShell variant="platform" isRtl={isRtl} className="pb-24 parent-home-shell">
 <motion.div {...getMotionProps(reducedMotion, kidsPageEnter)}>
 {/* Parent Home Hero */}
 <header className={`relative bg-gradient-to-br ${BRAND_HERO_GRADIENT} text-white pb-space-32 pt-space-24 px-space-24 md:px-space-32 overflow-hidden`}>
 <div className="absolute inset-0 parent-hero-glow pointer-events-none" aria-hidden="true" />
 
 <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-space-24">
 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-24">
 <div className="flex items-center gap-space-24">
 <Avatar src={null} fallback={user?.username?.[0] || 'P'} size="xl" className="border-4 border-white/25 shadow-floating" />
 <div>
 <p className="text-body-lg text-white/85 font-medium capitalize">{currentDate}</p>
 <h1 className="text-hero font-black tracking-tight mb-space-8">
 {t(greetingKey)}, {user?.username || 'Parent'} 👋
 </h1>
 <p className="text-body-lg text-white/90 font-semibold max-w-xl leading-relaxed">
 {heroSubtitle}
 </p>
 <p className="text-body text-white/80 font-medium mt-space-12 max-w-2xl">
 {t('parentInsightsSubtitle', { name: selectedKid?.name || t('parentChild') })}
 </p>
 <div className="flex flex-wrap items-center gap-3 mt-space-16">
 <Badge variant="glass" className="bg-card/20 text-white border-none font-bold">
 {t('parentKidsCount').replace('{count}', String(kids.length))}
 </Badge>
 {dashboardData?.subscription && (
 <Badge variant="glass" className="bg-secondary-500/80 text-white border-none font-bold">
 {dashboardData.subscription.plan_name}
 </Badge>
 )}
 {topThemeLabel ? (
 <Badge variant="glass" className="bg-card/15 text-white border-none font-bold">
 {topThemeLabel}
 </Badge>
 ) : null}
 </div>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row gap-space-12 w-full lg:w-auto">
 <Button variant="glass" onClick={() => setShowSettingsModal(true)} className="bg-card/10 hover:bg-card/20 text-white font-bold border-none shrink-0 min-h-touch">
 <SettingsIcon className="w-5 h-5 me-2" /> {t('parentSettings')}
 </Button>
 <Button variant="glass" onClick={handleLogout} className="bg-card/10 hover:bg-card/20 text-white font-bold border-none shrink-0 min-h-touch">{t('parentLogout')}</Button>
 <Button variant="glass" onClick={() => {setEditingKid(null); setKidForm(emptyKidForm); setShowKidModal(true);}} className="bg-card hover:bg-surface-secondary text-foreground-600 font-bold border-none shadow-floating shrink-0 min-h-touch">
 <PlusIcon className="w-5 h-5 me-2" /> {t('parentAddKid')}
 </Button>
 </div>
 </div>
 <div className="parent-companion-hero-grid">
 <article className="parent-companion-hero-card parent-companion-hero-card--warm">
 <div className="parent-companion-hero-icon" aria-hidden="true">
 <SparklesIcon className="w-5 h-5" />
 </div>
 <p className="parent-companion-card-label">{t('parentHomeTodaySubtitle')}</p>
 <p className="parent-companion-card-value">
 {todayReadMinutes > 0 ? t('parentHomeHeroReadToday', { name: selectedKid?.name || t('parentChild'), minutes: todayReadMinutes }) : t('parentHomeTagline')}
 </p>
 </article>

 <article className="parent-companion-hero-card">
 <div className="parent-companion-hero-icon" aria-hidden="true">
 <BookIcon className="w-5 h-5" />
 </div>
 <p className="parent-companion-card-label">{t('parentProgressCurrentStory')}</p>
 <p className="parent-companion-card-value">{continueBook?.title || t('parentHomeContinueEmpty')}</p>
 <p className="parent-companion-card-subtle">
 {continueBook ? t('parentHomeContinueProgress', { percent: continueBook.progress_percent || 0 }) : t('parentHomeContinueEmptyDesc')}
 </p>
 </article>

 <article className="parent-companion-hero-card">
 <div className="parent-companion-hero-icon" aria-hidden="true">
 <CategoryIcon className="w-5 h-5" />
 </div>
 <p className="parent-companion-card-label">{t('parentProfileCategories')}</p>
 <p className="parent-companion-card-value">{topThemeLabel || t('parentProfileCategoriesEmpty')}</p>
 <p className="parent-companion-card-subtle">{t('parentHomeCategoriesHint')}</p>
 </article>

 <article className="parent-companion-hero-card">
 <div className="parent-companion-hero-icon" aria-hidden="true">
 <StarIcon className="w-5 h-5" />
 </div>
 <p className="parent-companion-card-label">{t('parentHomeStreakLabel')}</p>
 <p className="parent-companion-card-value">
 {Number(summary.reading_streak_days || 0) > 0 ? t('parentHomeStreakDays', { days: summary.reading_streak_days }) : '—'}
 </p>
 <p className="parent-companion-card-subtle">{t('parentHomeBooksStarted', { count: progressItems.length || 0 })}</p>
 </article>
 </div>
 </div>
 </header>

 <div className="max-w-7xl mx-auto px-space-16 md:px-space-32 py-space-32 flex flex-col gap-space-32">

 {/* Kid selector */}
 {kids.length > 0 && (
 <section aria-label={t('parentKidProfiles')}>
 <h2 className="sr-only">{t('parentKidProfiles')}</h2>
 <div className="flex gap-space-12 overflow-x-auto parent-discovery-rail pb-space-4">
 {kids.map((kid) => {
 const active = selectedKid?.id === kid.id;
 return (
 <button
 key={kid.id}
 type="button"
 onClick={() => handleSelectKid(kid)}
 className={`flex items-center gap-space-12 shrink-0 rounded-32 px-space-16 py-space-12 min-h-touch border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
 active
 ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30 shadow-card'
 : 'border-border/60 bg-card hover:shadow-card'
 }`}
 aria-pressed={active}
 >
 <KidAvatar kid={kid} size="sm" />
 <span className="font-black text-foreground pe-space-8">{kid.name}</span>
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
 onAction={() => { setEditingKid(null); setKidForm(emptyKidForm); setShowKidModal(true); }}
 />
 ) : selectedKid && (
 <>
 <ParentDashboardAnalytics
 data={dashboardData}
 loading={activityLoading}
 language={language}
 t={t}
 kidName={selectedKid.name}
 kid={selectedKid}
 />

 <ParentChildProfilePanel
 kid={selectedKid}
 data={dashboardData}
 t={t}
 isSelected
 onEdit={() => { setEditingKid(selectedKid); setKidForm(kidToForm(selectedKid)); setShowKidModal(true); }}
 onAccount={() => setShowAccountModal(true)}
 onDelete={() => handleDeleteKid(selectedKid.id)}
 />

 <ParentFamilySection
 t={t}
 kidName={selectedKid.name}
 streakDays={dashboardData?.summary?.reading_streak_days || 0}
 />

 <section aria-labelledby="parent-explore-heading">
 <h2 id="parent-explore-heading" className="text-heading-xl font-black text-foreground mb-space-16">{t('parentExploreTitle')}</h2>
 <ParentHubNav />
 </section>

 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="grid grid-cols-1 lg:grid-cols-3 gap-space-32">
 
 <div className="lg:col-span-2 flex flex-col gap-space-32">
 <section className="parent-control-card" aria-labelledby="parent-peace-heading">
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

 <section className="parent-control-card" aria-labelledby="parent-permissions-heading">
 <div className="parent-control-header">
 <div>
 <h2 id="parent-permissions-heading" className="text-heading-l font-black text-foreground mb-2">{t('parentReadingPermissions')}</h2>
 <p className="text-body-lg text-foreground-secondary font-medium">{t('parentPeacePermissionsDesc')}</p>
 </div>
 <div className="parent-control-counts" aria-hidden="true">
 <span className="parent-control-count">{selectedLanguagesCount}</span>
 <span className="parent-control-count">{selectedThemesCount}</span>
 <span className="parent-control-count">{selectedContentTypesCount}</span>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-space-24">
 <div>
 <h3 className="font-black mb-space-12">{t('parentAllowedLanguages')}</h3>
 <div className="flex flex-wrap gap-2">
 {bedtimeLanguages.map(lang => (
 <button key={lang.id} type="button" onClick={() => toggleRuleValue('allowed_languages', lang.id)} className={`parent-soft-chip ${rulesForm.allowed_languages.includes(lang.id) ? 'is-active is-primary' : ''}`} aria-pressed={rulesForm.allowed_languages.includes(lang.id)}>
 {lang.label}
 </button>
 ))}
 </div>
 </div>
 <div>
 <h3 className="font-black mb-space-12">{t('parentAllowedThemes')}</h3>
 <div className="flex flex-wrap gap-2">
 {bedtimeThemes.map(theme => (
 <button key={theme.id} type="button" onClick={() => toggleRuleValue('allowed_themes', theme.id)} className={`parent-soft-chip ${rulesForm.allowed_themes.includes(theme.id) ? 'is-active is-secondary' : ''}`} aria-pressed={rulesForm.allowed_themes.includes(theme.id)}>
 {theme.label}
 </button>
 ))}
 </div>
 </div>
 </div>
 <div className="mt-space-24">
 <h3 className="font-black mb-space-12">{t('parentAllowedContentTypes')}</h3>
 <div className="flex flex-wrap gap-2">
 {contentTypeOptions.map((type) => (
 <button key={type.id} type="button" onClick={() => toggleRuleValue('allowed_content_types', type.id)} className={`parent-soft-chip ${rulesForm.allowed_content_types.includes(type.id) ? 'is-active is-secondary' : ''}`} aria-pressed={rulesForm.allowed_content_types.includes(type.id)}>
 {type.label}
 </button>
 ))}
 </div>
 </div>
 <div className="pt-space-16 border-t border-border/50 flex justify-end mt-space-24">
 <Button variant="primary" onClick={handleSaveRules} disabled={rulesSaving} className="min-h-touch font-bold">
 {rulesSaving ? t('parentSaving') : t('parentSaveRules')}
 </Button>
 </div>
 </section>

 <ParentReadingGoalCard
 kidId={selectedKid?.id}
 goal={dashboardData?.goal}
 onSaved={() => loadKidDashboard(selectedKid.id)}
 />

 <ParentCategoryApprovals kidId={selectedKid?.id} />
 </div>

 <div className="flex flex-col gap-space-24">
 <div className={`bg-gradient-to-br ${BRAND_HERO_GRADIENT} text-white p-space-24 md:p-space-32 rounded-32 shadow-floating relative overflow-hidden`}>
 <div className="absolute top-0 end-0 w-32 h-32 bg-accent-500/20 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
 <Badge variant="glass" className="bg-card/20 text-white border-none font-bold mb-space-16">
 {dashboardData?.subscription?.status || t('parentFreePlan')}
 </Badge>
 <h2 className="text-heading-l font-black mb-1">{dashboardData?.subscription?.plan_name || t('parentFreePlan')}</h2>
 {dashboardData?.subscription?.current_period_end && (
 <p className="text-white/75 text-body mb-space-24">{t('parentSubscriptionExpiry')} : {formatDate(dashboardData.subscription.current_period_end)}</p>
 )}
 <Button variant="outline" fullWidth onClick={() => navigate('/abonnements')} className="bg-card hover:bg-surface-secondary text-foreground font-bold border-none min-h-touch">{t('parentManageSubscription')}</Button>
 </div>
 <article className="parent-aside-note">
 <p className="parent-companion-card-label">{t('parentExploreTitle')}</p>
 <p className="parent-companion-card-value">
 {selectedKid ? t('parentHomeTodayTitle', { name: selectedKid.name }) : t('parentHomeTagline')}
 </p>
 <p className="parent-companion-card-subtle">{t('parentHomeNoDataDesc')}</p>
 </article>
 </div>

 </motion.div>
 </>
 )}
 </div>
 </motion.div>

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
