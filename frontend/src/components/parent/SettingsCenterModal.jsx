import React, {useState, useEffect, useRef, useMemo, useId} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
 UserIcon, SearchIcon, XIcon, ShieldIcon, LockIcon, LanguageIcon,
 BellIcon, BookIcon, FontIcon, VolumeIcon, SmartphoneIcon,
 ComputerIcon, MailIcon, CheckCircleIcon, LogOutIcon, ChildIcon,
 HistoryIcon, StarIcon, ArrowRightIcon, AlertIcon
} from '../Icons';
import {Button, Badge, Switch, Input, Avatar} from '../ui';
import {useAuth} from '../../context/AuthContext';
import {useLanguage} from '../../context/LanguageContext';
import {useToast} from '../ToastProvider';
import {subscriptionsAPI} from '../../api/subscriptions';
import {supportAPI} from '../../api/support';
import {useNavigate} from 'react-router-dom';
import PrivacyCenter from './PrivacyCenter';
import { storage } from '../../utils/storage';
import {LANGUAGE_OPTIONS} from '../../utils/translations';
import {useModalA11y} from '../../hooks/useModalA11y';

const SECTION_ICONS = {
 account: UserIcon,
 appearance: SmartphoneIcon,
 profile: ChildIcon,
 privacy: ShieldIcon,
 security: LockIcon,
 language: LanguageIcon,
 reading: FontIcon,
 subscription: StarIcon,
 support: MailIcon,
};

const SUPPORT_CATEGORIES = [
 {value: 'general', key: 'parentSettingsSupportCategoryGeneral'},
 {value: 'billing', key: 'parentSettingsSupportCategoryBilling'},
 {value: 'technical', key: 'parentSettingsSupportCategoryTechnical'},
 {value: 'content', key: 'parentSettingsSupportCategoryContent'},
 {value: 'bug', key: 'parentSettingsSupportCategoryBug'},
];

export function SettingsCenterModal({isOpen, onClose}) {
 const [activeSection, setActiveSection] = useState('account');
 const [searchQuery, setSearchQuery] = useState('');
 const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
 const contentRef = useRef(null);
 const sectionRefs = useRef({});
 const titleId = useId();
 const dialogRef = useRef(null);
 const {user} = useAuth();
 const {showToast} = useToast();
 const {language, changeLanguage, t, isRtl} = useLanguage();
 const navigate = useNavigate();
 const [subscription, setSubscription] = useState(null);
 const [invoices, setInvoices] = useState([]);
 const [loadingBilling, setLoadingBilling] = useState(false);
 const [supportForm, setSupportForm] = useState({ subject: '', message: '', category: 'general' });
 const [supportTickets, setSupportTickets] = useState([]);
 const [loadingSupport, setLoadingSupport] = useState(false);
 const [submittingSupport, setSubmittingSupport] = useState(false);

 const sections = useMemo(() => ([
  {id: 'account', label: t('parentSettingsSectionAccount')},
  {id: 'appearance', label: t('parentSettingsSectionAppearance')},
  {id: 'profile', label: t('parentSettingsSectionProfile')},
  {id: 'privacy', label: t('parentSettingsSectionPrivacy')},
  {id: 'security', label: t('parentSettingsSectionSecurity')},
  {id: 'language', label: t('parentSettingsSectionLanguage')},
  {id: 'reading', label: t('parentSettingsSectionReading')},
  {id: 'subscription', label: t('parentSettingsSectionSubscription')},
  {id: 'support', label: t('parentSettingsSectionSupport')},
 ]), [t]);

 const sectionDescriptions = useMemo(() => ({
  account: t('parentSettingsAccountDesc'),
  appearance: t('parentSettingsAppearanceDesc'),
  profile: t('parentSettingsProfileDesc'),
  privacy: t('parentSettingsPrivacyDesc'),
  security: t('parentSettingsSecurityDesc'),
  language: t('parentSettingsLanguageDesc'),
  reading: t('parentSettingsReadingDesc'),
  subscription: t('parentSettingsSubscriptionDesc'),
  support: t('parentSettingsSupportDesc'),
 }), [t]);

 const dateLocale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'fr-FR';

 useModalA11y(isOpen, onClose, dialogRef);

 useEffect(() => {
 if (!isOpen || user?.role === 'kid') return;
 const loadBilling = async () => {
 try {
 setLoadingBilling(true);
 const [subResponse, invoicesResponse] = await Promise.all([
 subscriptionsAPI.getCurrentSubscription(),
 subscriptionsAPI.getInvoices({ limit: 10, offset: 0 })
 ]);
 setSubscription(subResponse.data?.subscription || null);
 setInvoices(invoicesResponse.data?.items || []);
 } catch (error) {
 console.error('Error loading billing settings:', error);
 } finally {
 setLoadingBilling(false);
 }
 };
 loadBilling();
 }, [isOpen, user?.role]);

 useEffect(() => {
 if (!isOpen || user?.role === 'kid') return;
 const loadSupport = async () => {
 try {
 setLoadingSupport(true);
 const response = await supportAPI.getMyTickets({ limit: 10 });
 setSupportTickets(response.data?.items || []);
 } catch (error) {
 console.error('Could not load support tickets:', error);
 } finally {
 setLoadingSupport(false);
 }
 };
 loadSupport();
 }, [isOpen, user?.role]);

 const submitSupportTicket = async (event) => {
 event.preventDefault();
 if (!supportForm.subject.trim() || !supportForm.message.trim()) {
 showToast(t('parentSettingsSupportFillRequired'), 'error');
 return;
 }
 try {
 setSubmittingSupport(true);
 await supportAPI.createTicket(supportForm);
 showToast(t('parentSettingsSupportSent'), 'success');
 setSupportForm({ subject: '', message: '', category: 'general' });
 const response = await supportAPI.getMyTickets({ limit: 10 });
 setSupportTickets(response.data?.items || []);
 } catch (error) {
 showToast(error.response?.data?.error || t('parentSomethingWrong'), 'error');
 } finally {
 setSubmittingSupport(false);
 }
 };

 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
} else {
 document.body.style.overflow = 'unset';
}
 return () => {document.body.style.overflow = 'unset';};
}, [isOpen]);

 const scrollToSection = (id) => {
 setActiveSection(id);
 const element = sectionRefs.current[id];
 if (element && contentRef.current) {
 contentRef.current.scrollTo({
 top: element.offsetTop - 40,
 behavior: 'smooth'
});
}
};

 const handleScroll = () => {
 if (!contentRef.current) return;
 const scrollPosition = contentRef.current.scrollTop + 100;

 let currentActive = activeSection;
 for (const section of sections) {
 const element = sectionRefs.current[section.id];
 if (element && element.offsetTop <= scrollPosition) {
 currentActive = section.id;
}
}
 if (currentActive !== activeSection) {
 setActiveSection(currentActive);
}
};

 const persistPreference = (key, value) => {
 storage.setPreference(key, value);
 showToast(t('parentChangesSaved'), 'success');
 };

 if (!isOpen) return null;

 const activeLabel = sections.find((s) => s.id === activeSection)?.label;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8" dir={isRtl ? 'rtl' : 'ltr'}>
 <motion.div
 initial={{opacity: 0}}
 animate={{opacity: 1}}
 exit={{opacity: 0}}
 className="absolute inset-0 bg-surface-900/40 backdrop-blur-md"
 onClick={onClose}
 aria-hidden="true"
 />

 <motion.div
 ref={dialogRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={titleId}
 initial={{opacity: 0, scale: 0.95, y: 20}}
 animate={{opacity: 1, scale: 1, y: 0}}
 exit={{opacity: 0, scale: 0.95, y: 20}}
 transition={{type: 'spring', damping: 25, stiffness: 300}}
 className="relative w-full max-w-6xl h-full max-h-[90vh] bg-surface-secondary rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20"
 >
 {/* Sidebar */}
 <div className="w-full md:w-72 bg-card/50 backdrop-blur-xl border-r border-border/70 flex flex-col z-10 shrink-0">
 <div className="p-6 pb-4">
 <div className="flex items-center justify-between mb-6">
 <h2 id={titleId} className="text-xl font-black tracking-tight">{t('parentSettingsTitle')}</h2>
 <button type="button" onClick={onClose} aria-label={t('parentCancel')} className="md:hidden p-2 bg-surface-secondary hover:bg-surface-200 rounded-full transition-colors">
 <XIcon className="w-5 h-5 text-foreground-secondary" />
 </button>
 </div>

 <div className="relative">
 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
 <input
 type="search"
 placeholder={t('parentSettingsSearch')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2.5 bg-surface-secondary/60 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-surface-400"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 custom-scrollbar">
 {sections.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase())).map((section) => {
 const Icon = SECTION_ICONS[section.id];
 return (
 <button
 type="button"
 key={section.id}
 onClick={() => scrollToSection(section.id)}
 className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
 activeSection === section.id
 ? 'bg-primary-50/80 text-foreground-600 shadow-sm'
 : 'text-foreground-secondary hover:bg-surface-secondary '
}`}
 >
 <Icon className={`w-5 h-5 ${activeSection === section.id ? 'text-foreground-500' : 'text-surface-400'}`} />
 {section.label}
 {activeSection === section.id && (
 <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" />
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 relative overflow-hidden bg-surface-secondary">
 <div className="absolute top-0 inset-x-0 h-16 bg-surface-secondary/80 backdrop-blur-xl border-b border-border/50 z-10 flex items-center justify-between px-8">
 <h3 className="font-bold text-foreground capitalize">{activeLabel}</h3>
 <button type="button" onClick={onClose} aria-label={t('parentCancel')} className="hidden md:flex p-2 bg-card hover:bg-surface-secondary shadow-sm border border-border rounded-full transition-colors group">
 <XIcon className="w-5 h-5 text-foreground-muted group-hover:text-foreground dark:group-hover:text-white transition-colors" />
 </button>
 </div>

 <div
 ref={contentRef}
 onScroll={handleScroll}
 className="absolute inset-0 overflow-y-auto pt-24 px-4 sm:px-8 md:px-12 pb-24 scroll-smooth custom-scrollbar"
 >
 <div className="max-w-3xl mx-auto space-y-16">

 {/* ACCOUNT */}
 <section id="account" ref={el => sectionRefs.current['account'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionAccount')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.account}</p>
 </div>

 <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border">
 <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
 <div className="relative group">
 <Avatar src={null} fallback={user?.username?.[0] || 'P'} size="2xl" className="border-4 border-surface-50 shadow-md w-32 h-32 text-4xl" />
 <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
 <span className="text-white text-xs font-bold uppercase tracking-wider">{t('parentSettingsEditPhoto')}</span>
 </div>
 </div>
 <div className="flex-1 w-full space-y-4">
 <p className="text-sm text-foreground-muted">{t('parentSettingsAccountManagedHint')}</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">{t('parentSettingsFullName')}</label>
 <Input defaultValue={user?.username || 'Parent'} readOnly className="w-full bg-surface-secondary font-medium" />
 </div>
 <div>
 <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">{t('parentSettingsEmail')}</label>
 <Input defaultValue={user?.email || ''} readOnly className="w-full bg-surface-secondary font-medium" />
 </div>
 </div>
 <div className="flex justify-end pt-2">
 <Button onClick={() => showToast(t('parentSettingsManageKidsHint'), 'info')} className="shadow-md">{t('parentSettingsSaveChanges')}</Button>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-danger-200/50">
 <h3 className="text-lg font-bold text-danger-600 mb-4">{t('parentSettingsDangerZone')}</h3>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-danger-50/50 rounded-2xl border border-danger-100/30">
 <div>
 <p className="font-bold text-danger-900">{t('parentSettingsChangePassword')}</p>
 <p className="text-sm text-danger-600/80">{t('parentSettingsChangePasswordDesc')}</p>
 </div>
 <Button disabled variant="outline" className="text-danger-600 border-danger-200">{t('parentComingSoon')}</Button>
 </div>
 <div className="flex items-center justify-between p-4 bg-danger-50/50 rounded-2xl border border-danger-100/30">
 <div>
 <p className="font-bold text-danger-900">{t('parentSettingsDeleteAccount')}</p>
 <p className="text-sm text-danger-600/80">{t('parentSettingsDeleteAccountDesc')}</p>
 </div>
 <Button
 className="bg-danger-500 hover:bg-danger-600 text-white shadow-md"
 onClick={() => scrollToSection('privacy')}
 >
 {t('parentSettingsDeleteAccount')}
 </Button>
 </div>
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* APPARENCE */}
 <section id="appearance" ref={el => sectionRefs.current['appearance'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionAppearance')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.appearance}</p>
 </div>

 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center text-foreground">
 <SmartphoneIcon className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-foreground">{t('parentSettingsDarkMode')}</h4>
 <p className="text-sm text-foreground-muted">{t('parentSettingsDarkModeDesc')}</p>
 </div>
 </div>
 <Switch
 checked={isDarkMode}
 onChange={() => {
   const newMode = !isDarkMode;
   setIsDarkMode(newMode);
   window.dispatchEvent(new CustomEvent('toggleDarkMode', { detail: newMode }));
 }}
 />
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* PROFILE */}
 <section id="profile" ref={el => sectionRefs.current['profile'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionProfile')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.profile}</p>
 </div>

 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
 <div className="flex items-start gap-4">
 <Badge variant="secondary" className="text-[10px] shrink-0">{t('parentComingSoon')}</Badge>
 <p className="text-sm text-foreground-muted">{t('parentSettingsProfileComingSoon')}</p>
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* PRIVACY */}
 <section id="privacy" ref={el => sectionRefs.current['privacy'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionPrivacy')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.privacy}</p>
 </div>

 <PrivacyCenter />
 </section>

 <hr className="border-border" />

 {/* SECURITY */}
 <section id="security" ref={el => sectionRefs.current['security'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionSecurity')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.security}</p>
 </div>

 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border flex items-center justify-between mb-4">
 <div className="flex flex-col md:flex-row md:items-center gap-4">
 <div className="w-12 h-12 bg-surface-secondary rounded-2xl flex items-center justify-center text-foreground-secondary shrink-0">
 <SmartphoneIcon className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold flex items-center gap-2">{t('parentSettings2faTitle')} <Badge variant="primary" className="text-[10px]">{t('parentComingSoon')}</Badge></h4>
 <p className="text-sm text-foreground-muted">{t('parentSettings2faDesc')}</p>
 </div>
 </div>
 <Button disabled variant="outline">{t('parentSettingsConfigure')}</Button>
 </div>

 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
 <h4 className="font-bold mb-2">{t('parentSettingsDevicesTitle')}</h4>
 <p className="text-sm text-foreground-muted mb-4">{t('parentSettingsDevicesDesc')}</p>
 <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary">
 <div className="p-3 bg-primary-50 text-foreground-600 rounded-xl"><ComputerIcon className="w-5 h-5"/></div>
 <div>
 <p className="font-bold flex items-center gap-2">{t('parentSettingsThisDevice')} <Badge variant="success" className="text-[10px]">{t('parentSettingsOnlineNow')}</Badge></p>
 </div>
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* LANGUAGE */}
 <section id="language" ref={el => sectionRefs.current['language'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionLanguage')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.language}</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {LANGUAGE_OPTIONS.map((option) => (
 <button
 type="button"
 key={option.id}
 onClick={() => changeLanguage(option.id)}
 className={`p-4 rounded-2xl border-2 cursor-pointer transition-all text-left ${
 language === option.id ? 'border-primary-500 bg-primary-50/80' : 'border-border bg-card hover:border-primary-300'
}`}
 >
 <div className="flex items-center justify-between">
 <span className={`font-bold ${language === option.id ? 'text-foreground-700' : 'text-foreground-secondary'}`}>{option.label}</span>
 {language === option.id && <CheckCircleIcon className="w-5 h-5 text-foreground-500" />}
 </div>
 </button>
 ))}
 <div className="p-4 rounded-2xl border-2 border-border bg-surface-secondary opacity-50 cursor-not-allowed">
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground-muted">{t('parentSettingsSpanish')}</span>
 <Badge variant="secondary" className="text-[10px]">{t('parentComingSoon')}</Badge>
 </div>
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* READING PREFERENCES */}
 <section id="reading" ref={el => sectionRefs.current['reading'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionReading')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.reading}</p>
 </div>

 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-8">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <h4 className="font-bold">{t('parentSettingsFontDefault')}</h4>
 <Badge variant="secondary" className="text-[10px]">{t('parentComingSoon')}</Badge>
 </div>
 <p className="text-sm text-foreground-muted">{t('parentComingSoon')}</p>
 </div>

 <div>
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-bold">{t('parentSettingsWideSpacing')}</h4>
 <Switch
 defaultChecked={storage.getPreferences().reading_wide_spacing ?? true}
 onChange={(checked) => persistPreference('reading_wide_spacing', checked)}
 />
 </div>
 <p className="text-sm text-foreground-muted">{t('parentSettingsWideSpacingDesc')}</p>
 </div>

 <div>
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-bold">{t('parentSettingsAutoAudio')}</h4>
 <Switch
 defaultChecked={storage.getPreferences().reading_auto_audio ?? false}
 onChange={(checked) => persistPreference('reading_auto_audio', checked)}
 />
 </div>
 <p className="text-sm text-foreground-muted">{t('parentSettingsAutoAudioDesc')}</p>
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* SUBSCRIPTION */}
 <section id="subscription" ref={el => sectionRefs.current['subscription'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionSubscription')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.subscription}</p>
 </div>

 <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
 <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl pointer-events-none"></div>
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-8">
 <div>
 <Badge variant="glass" className="bg-card/20 border-none font-bold mb-2">
 {subscription?.plan?.name || t('parentSettingsNoSubscription')}
 </Badge>
 <h3 className="text-4xl font-black">
 {subscription?.plan
 ? new Intl.NumberFormat(dateLocale, { style: 'currency', currency: subscription.plan.currency || 'EUR' }).format(subscription.plan.monthly_price || 0)
 : '0'}
 <span className="text-xl font-medium text-white/50"> {t('parentSettingsPerMonth')}</span>
 </h3>
 <p className="text-sm text-white/70 mt-2">
 {loadingBilling
 ? t('parentSettingsSubscriptionLoading')
 : subscription?.current_period_end
 ? `${t('parentSubscriptionExpiry')}: ${new Date(subscription.current_period_end).toLocaleDateString(dateLocale)}`
 : t('parentSettingsNoActivePlan')}
 </p>
 </div>
 <div className="p-4 bg-card/10 backdrop-blur-md rounded-2xl">
 <StarIcon className="w-8 h-8 text-accent-400" />
 </div>
 </div>

 <div className="space-y-3 mb-8">
 <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-secondary-400"/> <span>{t('parentSettingsBooksPerMonth', { count: subscription?.plan?.book_limit || 0 })}</span></div>
 <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-secondary-400"/> <span>{t('parentSettingsStatus', { status: subscription?.status || t('parentSettingsNoActivePlan') })}</span></div>
 <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-secondary-400"/> <span>{t('parentSettingsRecentInvoices', { count: invoices.length })}</span></div>
 </div>

 <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
 <Button className="bg-card text-black hover:bg-surface-secondary font-bold" onClick={() => navigate('/abonnements')}>
 {t('parentSettingsManageSubscription')}
 </Button>
 <Button variant="ghost" className="text-white hover:bg-card/10" onClick={() => navigate('/abonnements')}>
 {t('parentSettingsViewInvoices')}
 </Button>
 </div>
 </div>
 </div>
 </section>

 <hr className="border-border" />

 {/* SUPPORT */}
 <section id="support" ref={el => sectionRefs.current['support'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">{t('parentSettingsSectionSupport')}</h2>
 <p className="text-foreground-muted">{sectionDescriptions.support}</p>
 </div>

 <form onSubmit={submitSupportTicket} className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-bold mb-1">{t('parentSettingsSupportSubject')}</label>
 <Input
 required
 value={supportForm.subject}
 onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
 placeholder={t('parentSettingsSupportSubjectPlaceholder')}
 />
 </div>
 <div>
 <label className="block text-sm font-bold mb-1">{t('parentSettingsSupportCategory')}</label>
 <select
 value={supportForm.category}
 onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
 className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold"
 >
 {SUPPORT_CATEGORIES.map((cat) => (
 <option key={cat.value} value={cat.value}>{t(cat.key)}</option>
 ))}
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm font-bold mb-1">{t('parentSettingsSupportMessage')}</label>
 <textarea
 required
 rows={5}
 value={supportForm.message}
 onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
 placeholder={t('parentSettingsSupportMessagePlaceholder')}
 className="w-full p-3 rounded-xl bg-surface-secondary border border-border"
 />
 </div>
 </div>
 <Button type="submit" disabled={submittingSupport}>
 {submittingSupport ? t('parentSettingsSupportSending') : t('parentSettingsSupportSend')}
 </Button>
 </form>

 <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
 <h3 className="font-black mb-4">{t('parentSettingsSupportTickets')}</h3>
 {loadingSupport ? (
 <p className="text-sm text-foreground-muted">{t('parentSettingsLoading')}</p>
 ) : supportTickets.length === 0 ? (
 <p className="text-sm text-foreground-muted">{t('parentSettingsSupportNoTickets')}</p>
 ) : (
 <div className="space-y-3">
 {supportTickets.map((ticket) => (
 <div key={ticket.id} className="p-4 rounded-2xl bg-surface-secondary border border-border">
 <div className="flex flex-wrap gap-2 mb-2">
 <Badge variant="soft">{ticket.category}</Badge>
 <Badge variant={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'}>{ticket.status}</Badge>
 </div>
 <p className="font-bold text-sm">{ticket.subject}</p>
 <p className="text-xs text-foreground-muted mt-1 line-clamp-2">{ticket.message}</p>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="flex justify-center pt-8">
 <p className="text-xs text-surface-400 font-bold uppercase tracking-widest">HKids Version 2.4.0</p>
 </div>
 </section>

 <div className="h-12"></div>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
}
