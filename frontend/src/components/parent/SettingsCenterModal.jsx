import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
 UserIcon, SearchIcon, XIcon, ShieldIcon, LockIcon, LanguageIcon, 
 BellIcon, BookIcon, FontIcon, VolumeIcon, SmartphoneIcon, 
 ComputerIcon, MailIcon, CheckCircleIcon, LogOutIcon, ChildIcon, 
 HistoryIcon, StarIcon, ArrowRightIcon, AlertIcon
} from '../Icons';
import {Button, Badge, Switch, Input, Avatar} from '../ui';
import {useAuth} from '../../context/AuthContext';
import {useToast} from '../ToastProvider';
import {subscriptionsAPI} from '../../api/subscriptions';
import {supportAPI} from '../../api/support';
import {useNavigate} from 'react-router-dom';
import PrivacyCenter from './PrivacyCenter';
import { storage } from '../../utils/storage';

const SECTIONS = [
 {id: 'account', label: 'Compte', icon: UserIcon},
 {id: 'appearance', label: 'Apparence', icon: SmartphoneIcon},
 {id: 'profile', label: 'Profil', icon: ChildIcon},
 {id: 'notifications', label: 'Notifications', icon: BellIcon},
 {id: 'privacy', label: 'Confidentialité', icon: ShieldIcon},
 {id: 'security', label: 'Sécurité', icon: LockIcon},
 {id: 'language', label: 'Langues', icon: LanguageIcon},
 {id: 'reading', label: 'Lecture', icon: FontIcon},
 {id: 'subscription', label: 'Abonnement', icon: StarIcon},
 {id: 'support', label: 'Support', icon: MailIcon},
];

export function SettingsCenterModal({isOpen, onClose}) {
 const [activeSection, setActiveSection] = useState('account');
 const [searchQuery, setSearchQuery] = useState('');
 const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
 const contentRef = useRef(null);
 const sectionRefs = useRef({});
 const {user} = useAuth();
 const {showToast} = useToast();
 const navigate = useNavigate();
 const [subscription, setSubscription] = useState(null);
 const [invoices, setInvoices] = useState([]);
 const [loadingBilling, setLoadingBilling] = useState(false);
 const [supportForm, setSupportForm] = useState({ subject: '', message: '', category: 'general' });
 const [supportTickets, setSupportTickets] = useState([]);
 const [loadingSupport, setLoadingSupport] = useState(false);
 const [submittingSupport, setSubmittingSupport] = useState(false);

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
 showToast('Veuillez remplir le sujet et le message.', 'error');
 return;
 }
 try {
 setSubmittingSupport(true);
 await supportAPI.createTicket(supportForm);
 showToast('Votre demande a été envoyée au support.', 'success');
 setSupportForm({ subject: '', message: '', category: 'general' });
 const response = await supportAPI.getMyTickets({ limit: 10 });
 setSupportTickets(response.data?.items || []);
 } catch (error) {
 showToast(error.response?.data?.error || 'Envoi impossible.', 'error');
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
 for (const section of SECTIONS) {
 const element = sectionRefs.current[section.id];
 if (element && element.offsetTop <= scrollPosition) {
 currentActive = section.id;
}
}
 if (currentActive !== activeSection) {
 setActiveSection(currentActive);
}
};

 const persistPreference = (key, value, label) => {
 storage.setPreference(key, value);
 showToast(`${label} enregistrée`, 'success');
 };

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
 <motion.div 
 initial={{opacity: 0}} 
 animate={{opacity: 1}} 
 exit={{opacity: 0}} 
 className="absolute inset-0 bg-surface-900/40 backdrop-blur-md"
 onClick={onClose}
 />
 
 <motion.div 
 initial={{opacity: 0, scale: 0.95, y: 20}}
 animate={{opacity: 1, scale: 1, y: 0}}
 exit={{opacity: 0, scale: 0.95, y: 20}}
 transition={{type: 'spring', damping: 25, stiffness: 300}}
 className="relative w-full max-w-6xl h-full max-h-[90vh] bg-surface-secondary rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 /50"
 >
 {/* Sidebar */}
 <div className="w-full md:w-72 bg-card/50 /50 backdrop-blur-xl border-r border-border flex flex-col z-10 shrink-0">
 <div className="p-6 pb-4">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-black tracking-tight">Paramètres</h2>
 <button onClick={onClose} className="md:hidden p-2 bg-surface-secondary hover:bg-surface-200 rounded-full transition-colors">
 <XIcon className="w-5 h-5 text-foreground-secondary" />
 </button>
 </div>
 
 <div className="relative">
 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
 <input 
 type="text" 
 placeholder="Rechercher..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2.5 bg-surface-secondary/50 /50 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-surface-400"
 />
 </div>
 </div>
 
 <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 custom-scrollbar">
 {SECTIONS.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase())).map((section) => (
 <button
 key={section.id}
 onClick={() => scrollToSection(section.id)}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
 activeSection === section.id 
 ? 'bg-primary-50 /10 text-foreground-600 shadow-sm' 
 : 'text-foreground-secondary hover:bg-surface-secondary '
}`}
 >
 <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-foreground-500' : 'text-surface-400'}`} />
 {section.label}
 {activeSection === section.id && (
 <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" />
 )}
 </button>
 ))}
 </div>
 </div>
 
 {/* Content Area */}
 <div className="flex-1 relative overflow-hidden bg-surface-secondary">
 {/* Header Sticky */}
 <div className="absolute top-0 inset-x-0 h-16 bg-surface-secondary/80 /80 backdrop-blur-xl border-b border-border/50 /50 z-10 flex items-center justify-between px-8">
 <h3 className="font-bold text-foreground capitalize">{SECTIONS.find(s => s.id === activeSection)?.label}</h3>
 <button onClick={onClose} className="hidden md:flex p-2 bg-card hover:bg-surface-secondary shadow-sm border border-border rounded-full transition-colors group">
 <XIcon className="w-5 h-5 text-foreground-muted group-hover:text-foreground dark:group-hover:text-white transition-colors" />
 </button>
 </div>
 
 {/* Scrollable Settings */}
 <div 
 ref={contentRef} 
 onScroll={handleScroll}
 className="absolute inset-0 overflow-y-auto pt-24 px-4 sm:px-8 md:px-12 pb-24 scroll-smooth custom-scrollbar"
 >
 <div className="max-w-3xl mx-auto space-y-16">
 
 {/* ACCOUNT */}
 <section id="account" ref={el => sectionRefs.current['account'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Compte</h2>
 <p className="text-foreground-muted">Gérez vos informations personnelles et préférences de sécurité.</p>
 </div>
 
 <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border">
 <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
 <div className="relative group cursor-pointer">
 <Avatar src={null} fallback={user?.username?.[0] || 'P'} size="2xl" className="border-4 border-surface-50 shadow-md w-32 h-32 text-4xl" />
 <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
 <span className="text-white text-xs font-bold uppercase tracking-wider">Modifier</span>
 </div>
 </div>
 <div className="flex-1 w-full space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Nom complet</label>
 <Input defaultValue={user?.username || 'Parent'} className="w-full bg-surface-secondary font-medium" />
 </div>
 <div>
 <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Email</label>
 <Input defaultValue={user?.email || 'parent@hkids.com'} className="w-full bg-surface-secondary font-medium" />
 </div>
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Téléphone (Optionnel)</label>
 <Input placeholder="+33 6 12 34 56 78" className="w-full bg-surface-secondary font-medium" />
 </div>
 </div>
 <div className="flex justify-end pt-2">
 <Button onClick={() => showToast('Gérez les profils enfants depuis le tableau de bord parent.', 'info')} className="shadow-md">Enregistrer les modifications</Button>
 </div>
 </div>
 </div>
 </div>
 
 <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-danger-200 /50">
 <h3 className="text-lg font-bold text-danger-600 mb-4">Zone de danger</h3>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-danger-50/50 /10 rounded-2xl border border-danger-100 /30">
 <div>
 <p className="font-bold text-danger-900">Modifier le mot de passe</p>
 <p className="text-sm text-danger-600/80 /80">Il est recommandé de le changer régulièrement.</p>
 </div>
 <Button variant="outline" className="text-danger-600 border-danger-200 hover:bg-danger-50">Modifier</Button>
 </div>
 <div className="flex items-center justify-between p-4 bg-danger-50/50 /10 rounded-2xl border border-danger-100 /30">
 <div>
 <p className="font-bold text-danger-900">Supprimer le compte</p>
 <p className="text-sm text-danger-600/80 /80">Cette action est irréversible et supprimera toutes vos données.</p>
 </div>
 <Button
 className="bg-danger-500 hover:bg-danger-600 text-white shadow-md"
 onClick={() => scrollToSection('privacy')}
 >
 Supprimer
 </Button>
 </div>
 </div>
 </div>
 </section>
 
 <hr className="border-border" />

 {/* APPARENCE */}
 <section id="appearance" ref={el => sectionRefs.current['appearance'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Apparence</h2>
 <p className="text-foreground-muted">Personnalisez l'apparence visuelle de HKids.</p>
 </div>
 
 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center text-foreground">
 <SmartphoneIcon className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-foreground">Mode Sombre</h4>
 <p className="text-sm text-foreground-muted">Un thème sombre élégant et reposant pour les yeux.</p>
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
 <h2 className="text-2xl font-black tracking-tight mb-2">Profil</h2>
 <p className="text-foreground-muted">Gérez les préférences globales de votre famille.</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
 <h4 className="font-bold mb-4">Fuseau horaire</h4>
 <select className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20">
 <option>Europe/Paris (GMT+2)</option>
 <option>Europe/London (GMT+1)</option>
 <option>America/New_York (GMT-4)</option>
 </select>
 </div>
 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
 <h4 className="font-bold mb-4">Pays de résidence</h4>
 <select className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20">
 <option>France</option>
 <option>Canada</option>
 <option>Suisse</option>
 <option>Belgique</option>
 </select>
 </div>
 </div>
 </section>
 
 <hr className="border-border" />
 
 {/* NOTIFICATIONS */}
 <section id="notifications" ref={el => sectionRefs.current['notifications'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Notifications</h2>
 <p className="text-foreground-muted">Choisissez comment et quand vous souhaitez être contacté.</p>
 </div>
 
 <div className="bg-card rounded-3xl p-2 shadow-sm border border-border divide-y divide-border /50">
 {[
 {title:"Rapports hebdomadaires", desc:"Recevez un résumé de l'activité de lecture de vos enfants.", key: 'notify_weekly_reports', default: true},
 {title:"Rappels de lecture", desc:"Soyez notifié si l'objectif de lecture n'est pas atteint.", key: 'notify_reading_reminders', default: true},
 {title:"Nouvelles histoires IA", desc:"Alertes lorsqu'une nouvelle histoire générée est prête.", key: 'notify_ai_stories', default: true},
 {title:"Mises à jour des abonnements", desc:"Factures, renouvellements et offres.", key: 'notify_billing', default: false},
 {title:"Nouveautés catalogue", desc:"Soyez le premier informé des nouveaux livres ajoutés.", key: 'notify_catalog', default: true},
 ].map((item) => (
 <div key={item.key} className="flex items-center justify-between p-4 hover:bg-surface-secondary /30 transition-colors rounded-2xl">
 <div>
 <p className="font-bold text-foreground">{item.title}</p>
 <p className="text-sm text-foreground-muted">{item.desc}</p>
 </div>
 <Switch
 defaultChecked={storage.getPreferences()[item.key] ?? item.default}
 onChange={(checked) => persistPreference(item.key, checked, item.title)}
 />
 </div>
 ))}
 </div>
 </section>
 
 <hr className="border-border" />
 
 {/* PRIVACY */}
 <section id="privacy" ref={el => sectionRefs.current['privacy'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Confidentialité</h2>
 <p className="text-foreground-muted">Contrôlez vos données et celles de vos enfants de manière transparente.</p>
 </div>
 
 <PrivacyCenter />
 </section>
 
 <hr className="border-border" />
 
 {/* SECURITY */}
 <section id="security" ref={el => sectionRefs.current['security'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Sécurité</h2>
 <p className="text-foreground-muted">Protégez l'accès à votre compte familial.</p>
 </div>
 
 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border flex items-center justify-between mb-4">
 <div className="flex flex-col md:flex-row md:items-center gap-4">
 <div className="w-12 h-12 bg-surface-secondary rounded-2xl flex items-center justify-center text-foreground-secondary shrink-0">
 <SmartphoneIcon className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold flex items-center gap-2">Authentification à deux facteurs <Badge variant="primary" className="text-[10px]">Prochainement</Badge></h4>
 <p className="text-sm text-foreground-muted">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
 </div>
 </div>
 <Button disabled variant="outline">Configurer</Button>
 </div>
 
 <h4 className="font-bold mt-8 mb-4">Appareils connectés</h4>
 <div className="bg-card rounded-3xl p-2 shadow-sm border border-border divide-y divide-border /50">
 <div className="flex items-center justify-between p-4 rounded-2xl">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary-50 text-foreground-600 rounded-xl"><ComputerIcon className="w-5 h-5"/></div>
 <div>
 <p className="font-bold flex items-center gap-2">MacBook Pro <Badge variant="success" className="text-[10px]">Cet appareil</Badge></p>
 <p className="text-xs text-foreground-muted">Paris, France • En ligne maintenant</p>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-between p-4 rounded-2xl">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-surface-secondary text-foreground-muted rounded-xl"><SmartphoneIcon className="w-5 h-5"/></div>
 <div>
 <p className="font-bold">iPhone 13</p>
 <p className="text-xs text-foreground-muted">Paris, France • Actif il y a 2 heures</p>
 </div>
 </div>
 <button className="text-xs font-bold text-danger-500 hover:text-danger-600 transition-colors">Déconnecter</button>
 </div>
 </div>
 </section>
 
 <hr className="border-border" />
 
 {/* LANGUAGE */}
 <section id="language" ref={el => sectionRefs.current['language'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Langues</h2>
 <p className="text-foreground-muted">Gérez les langues de l'interface et du contenu.</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {['Français', 'English', 'العربية'].map((lang, i) => (
 <div key={i} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${i === 0 ? 'border-primary-500 bg-primary-50 /10' : 'border-border bg-card hover:border-primary-300'}`}>
 <div className="flex items-center justify-between">
 <span className={`font-bold ${i === 0 ? 'text-foreground-700 ' : 'text-foreground-secondary '}`}>{lang}</span>
 {i === 0 && <CheckCircleIcon className="w-5 h-5 text-foreground-500" />}
 </div>
 </div>
 ))}
 <div className="p-4 rounded-2xl border-2 border-border bg-surface-secondary opacity-50 cursor-not-allowed">
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground-muted">Español</span>
 <Badge variant="secondary" className="text-[10px]">Bientôt</Badge>
 </div>
 </div>
 </div>
 </section>
 
 <hr className="border-border" />
 
 {/* READING PREFERENCES */}
 <section id="reading" ref={el => sectionRefs.current['reading'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Préférences de Lecture</h2>
 <p className="text-foreground-muted">Personnalisez l'affichage pour un confort optimal.</p>
 </div>
 
 <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-8">
 <div>
 <h4 className="font-bold mb-4">Police par défaut</h4>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-4 rounded-2xl border-2 border-primary-500 bg-primary-50 /10 flex items-center justify-center cursor-pointer">
 <span className="font-bold font-sans">Classique (Inter)</span>
 </div>
 <div className="p-4 rounded-2xl border-2 border-border hover:border-primary-300 bg-card flex items-center justify-center cursor-pointer">
 <span className="font-bold font-serif">Ludique (Comic)</span>
 </div>
 <div className="p-4 rounded-2xl border-2 border-border hover:border-primary-300 bg-card flex items-center justify-center cursor-pointer relative overflow-hidden">
 <span className="font-bold" style={{fontFamily: 'OpenDyslexic, sans-serif'}}>Dyslexie</span>
 <div className="absolute top-0 right-0 w-8 h-8 bg-blue-100 rounded-bl-2xl"></div>
 </div>
 </div>
 </div>
 
 <div>
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-bold">Interligne large</h4>
 <Switch
 defaultChecked={storage.getPreferences().reading_wide_spacing ?? true}
 onChange={(checked) => persistPreference('reading_wide_spacing', checked, 'Interligne')}
 />
 </div>
 <p className="text-sm text-foreground-muted">Augmente l'espace entre les lignes pour faciliter la lecture.</p>
 </div>
 
 <div>
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-bold">Lecture audio automatique</h4>
 <Switch
 defaultChecked={storage.getPreferences().reading_auto_audio ?? false}
 onChange={(checked) => persistPreference('reading_auto_audio', checked, 'Lecture audio')}
 />
 </div>
 <p className="text-sm text-foreground-muted">Démarre la voix off automatiquement à l'ouverture d'un livre.</p>
 </div>
 </div>
 </section>
 
 <hr className="border-border" />
 
 {/* SUBSCRIPTION */}
 <section id="subscription" ref={el => sectionRefs.current['subscription'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Abonnement</h2>
 <p className="text-foreground-muted">Gérez votre facturation et votre plan actuel.</p>
 </div>
 
 <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
 <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none"></div>
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-8">
 <div>
 <Badge variant="glass" className="bg-card/20 border-none font-bold mb-2">
 {subscription?.plan?.name || 'Sans abonnement actif'}
 </Badge>
 <h3 className="text-4xl font-black">
 {subscription?.plan
 ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: subscription.plan.currency || 'EUR' }).format(subscription.plan.monthly_price || 0)
 : '0,00 €'}
 <span className="text-xl font-medium text-white/50"> / mois</span>
 </h3>
 <p className="text-sm text-white/70 mt-2">
 {loadingBilling
 ? 'Chargement...'
 : subscription?.current_period_end
 ? `Échéance : ${new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}`
 : 'Aucune formule active'}
 </p>
 </div>
 <div className="p-4 bg-card/10 backdrop-blur-md rounded-2xl">
 <StarIcon className="w-8 h-8 text-yellow-400" />
 </div>
 </div>
 
 <div className="space-y-3 mb-8">
 <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>{subscription?.plan?.book_limit || 0} livre(s) premium / mois</span></div>
 <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>Statut : {subscription?.status || 'inactif'}</span></div>
 <div className="flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>{invoices.length} facture(s) récente(s)</span></div>
 </div>
 
 <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
 <Button className="bg-card text-black hover:bg-surface-secondary font-bold" onClick={() => navigate('/abonnements')}>
 Gérer l'abonnement
 </Button>
 <Button variant="ghost" className="text-white hover:bg-card/10" onClick={() => navigate('/abonnements')}>
 Voir l'historique des factures
 </Button>
 </div>
 </div>
 </div>
 </section>
 
 <hr className="border-border" />
 
 {/* SUPPORT */}
 <section id="support" ref={el => sectionRefs.current['support'] = el} className="scroll-mt-24 space-y-6">
 <div>
 <h2 className="text-2xl font-black tracking-tight mb-2">Support</h2>
 <p className="text-foreground-muted">Besoin d'aide ? Contactez notre équipe.</p>
 </div>

 <form onSubmit={submitSupportTicket} className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-bold mb-1">Sujet</label>
 <Input
 required
 value={supportForm.subject}
 onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
 placeholder="Décrivez brièvement votre demande"
 />
 </div>
 <div>
 <label className="block text-sm font-bold mb-1">Catégorie</label>
 <select
 value={supportForm.category}
 onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
 className="w-full p-3 rounded-xl bg-surface-secondary border border-border font-bold"
 >
 <option value="general">Général</option>
 <option value="billing">Facturation</option>
 <option value="technical">Technique</option>
 <option value="content">Contenu</option>
 <option value="bug">Signaler un bug</option>
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm font-bold mb-1">Message</label>
 <textarea
 required
 rows={5}
 value={supportForm.message}
 onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
 placeholder="Détaillez votre demande..."
 className="w-full p-3 rounded-xl bg-surface-secondary border border-border"
 />
 </div>
 </div>
 <Button type="submit" disabled={submittingSupport}>
 {submittingSupport ? 'Envoi...' : 'Envoyer au support'}
 </Button>
 </form>

 <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
 <h3 className="font-black mb-4">Mes demandes</h3>
 {loadingSupport ? (
 <p className="text-sm text-foreground-muted">Chargement...</p>
 ) : supportTickets.length === 0 ? (
 <p className="text-sm text-foreground-muted">Aucune demande envoyée pour le moment.</p>
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
