import {useEffect, useState, useRef} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {subscriptionsAPI} from '../api/subscriptions';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {useToast} from '../components/ToastProvider';
import {Logo} from '../components/Logo';
import {
 BookIcon, CheckIcon, ChevronLeftIcon, LockIcon, StarIcon, 
 SparklesIcon, ShieldIcon, XIcon, InfoIcon, BrainIcon, AudioIcon, HistoryIcon, ChevronUpIcon 
} from '../components/Icons';
import {Button, Card, Badge, Skeleton} from '../components/ui';

const fallbackPlans = [
 {
 code: 'one_book_monthly',
 name: 'Formule Découverte',
 description: 'Un livre au choix chaque mois pour commencer en douceur.',
 monthly_price: 2.99,
 currency: 'EUR',
 book_limit: 1,
 is_featured: false,
},
 {
 code: 'two_books_monthly',
 name: 'Formule Lecture',
 description: 'Deux livres par mois pour garder un rythme régulier.',
 monthly_price: 4.99,
 currency: 'EUR',
 book_limit: 2,
 is_featured: true,
},
 {
 code: 'three_books_monthly',
 name: 'Formule Passion',
 description: 'Trois livres par mois pour les petits lecteurs très curieux.',
 monthly_price: 6.99,
 currency: 'EUR',
 book_limit: 3,
 is_featured: false,
},
];

function formatPrice(plan) {
 return new Intl.NumberFormat('fr-FR', {
 style: 'currency',
 currency: plan.currency || 'EUR',
}).format(plan.monthly_price || 0);
}

// Confetti Component for Success State
const Confetti = () => {
 const [particles, setParticles] = useState([]);
 
 useEffect(() => {
 const newParticles = Array.from({length: 50}).map((_, i) => ({
 id: i,
 x: Math.random() * window.innerWidth,
 y: -20,
 size: Math.random() * 10 + 5,
 color: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][Math.floor(Math.random() * 5)],
 duration: Math.random() * 2 + 1,
 delay: Math.random() * 0.5
}));
 setParticles(newParticles);
}, []);

 return (
 <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
 {particles.map(p => (
 <motion.div
 key={p.id}
 initial={{x: p.x, y: p.y, opacity: 1, rotate: 0}}
 animate={{y: window.innerHeight + 20, opacity: 0, rotate: 360, x: p.x + (Math.random() * 100 - 50)}}
 transition={{duration: p.duration, delay: p.delay, ease:"easeOut"}}
 style={{position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '50%'}}
 />
 ))}
 </div>
 );
};

// Accordion Item Component
const FAQItem = ({question, answer}) => {
 const [isOpen, setIsOpen] = useState(false);
 return (
 <div className="border-b border-border py-4">
 <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left font-bold text-foreground focus:outline-none">
 <span>{question}</span>
 <motion.div animate={{rotate: isOpen ? 180 : 0}} className="text-surface-400">
 <ChevronUpIcon className="w-5 h-5 rotate-180" />
 </motion.div>
 </button>
 <AnimatePresence>
 {isOpen && (
 <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden">
 <p className="pt-4 text-foreground-secondary font-medium">{answer}</p>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};

function Subscriptions() {
 const [plans, setPlans] = useState(fallbackPlans);
 const [currentSubscription, setCurrentSubscription] = useState(null);
 const [loading, setLoading] = useState(true);
 const [subscribingPlan, setSubscribingPlan] = useState('');
 const [startingTrial, setStartingTrial] = useState(false);
 const {user, logout} = useAuth();
 const {t, language} = useLanguage();
 const {showToast} = useToast();
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();
 const isAuthenticated = Boolean(user || localStorage.getItem('token'));
 const isKidAccount = user?.role === 'kid';
 
 const subscriptionEndsAt = currentSubscription?.current_period_end ? new Date(currentSubscription.current_period_end) : null;
 const hasUsableSubscription = Boolean(
 currentSubscription &&
 ['trialing', 'active'].includes(currentSubscription.status) &&
 subscriptionEndsAt &&
 subscriptionEndsAt > new Date()
 );

 // States for Modals and Overlays
 const [checkoutModalPlan, setCheckoutModalPlan] = useState(null);
 const [termsAccepted, setTermsAccepted] = useState(false);
 const [promoCode, setPromoCode] = useState('');
 
 // Custom Status states to replace simple toasts
 const [viewState, setViewState] = useState('plans'); // 'plans', 'success', 'cancelled', 'error'
 const [errorMessage, setErrorMessage] = useState('');
 const [invoices, setInvoices] = useState([]);
 const [history, setHistory] = useState([]);
 const [billingAction, setBillingAction] = useState('');

 const handleExpiredSession = () => {
 logout();
 showToast('Votre session a expiré. Connectez-vous à nouveau.', 'info', 3500);
 navigate('/parent/login');
};

 useEffect(() => {
 const loadSubscriptions = async () => {
 try {
 setLoading(true);
 try {
 const plansResponse = await subscriptionsAPI.getPlans();
 if (Array.isArray(plansResponse.data) && plansResponse.data.length > 0) {
 setPlans(plansResponse.data);
}
} catch (error) {
 console.error('Error loading subscription plans:', error);
}

 if (isAuthenticated) {
 try {
 const subscriptionResponse = await subscriptionsAPI.getCurrentSubscription();
 setCurrentSubscription(subscriptionResponse.data.subscription);
} catch (error) {
 console.error('Error loading current subscription:', error);
 if (error.response?.status === 401) {
 handleExpiredSession();
}
}
}
} catch (error) {
 console.error('Error loading subscriptions:', error);
} finally {
 setLoading(false);
}
};

 loadSubscriptions();
}, [isAuthenticated]);

 useEffect(() => {
 if (!isAuthenticated || isKidAccount || !hasUsableSubscription) return;
 const loadBillingData = async () => {
 try {
 const [invoicesResponse, historyResponse] = await Promise.all([
 subscriptionsAPI.getInvoices({ limit: 20, offset: 0 }),
 subscriptionsAPI.getHistory({ limit: 50, offset: 0 })
 ]);
 setInvoices(invoicesResponse.data?.items || []);
 setHistory(historyResponse.data?.items || []);
 } catch (error) {
 console.error('Error loading billing data:', error);
 }
 };
 loadBillingData();
}, [isAuthenticated, isKidAccount, hasUsableSubscription, currentSubscription?.id]);

 useEffect(() => {
 const checkoutStatus = searchParams.get('checkout');
 const sessionId = searchParams.get('session_id');

 if (!isAuthenticated || !checkoutStatus) return;

 if (checkoutStatus === 'success' && sessionId) {
 const confirmCheckout = async () => {
 try {
 setLoading(true);
 const response = await subscriptionsAPI.confirmCheckout(sessionId);
 setCurrentSubscription(response.data.subscription);
 setViewState('success');
} catch (error) {
 console.error('Error confirming checkout:', error);
 if (error.response?.status === 401) {
 handleExpiredSession();
} else {
 setErrorMessage(t('subscriptionsPaymentPending'));
 setViewState('error');
}
} finally {
 setLoading(false);
 setSearchParams({});
}
};
 confirmCheckout();
} else if (checkoutStatus === 'cancelled') {
 setViewState('cancelled');
 setSearchParams({});
}
}, [isAuthenticated, searchParams, setSearchParams]);

 const openCheckoutModal = (plan) => {
 if (!isAuthenticated) {
 showToast('Connectez-vous pour choisir un abonnement.', 'info', 2500);
 navigate('/parent/login');
 return;
}
 if (isKidAccount) {
 showToast(t('subscriptionsKidAskParent'), 'info', 3500);
 return;
}
 setCheckoutModalPlan(plan);
 setTermsAccepted(false);
 setPromoCode('');
};

 const handleSubscribe = async () => {
 if (!checkoutModalPlan) return;
 try {
 setSubscribingPlan(checkoutModalPlan.code);
 const response = await subscriptionsAPI.createCheckoutSession(checkoutModalPlan.code);
 if (response.data.checkout_url) {
 window.location.href = response.data.checkout_url;
 return;
}
 throw new Error('Stripe checkout URL missing');
} catch (error) {
 console.error('Error subscribing:', error);
 setCheckoutModalPlan(null);
 if (error.response?.status === 401) {
 handleExpiredSession();
} else if (error.response?.data?.parent_required) {
 setErrorMessage(t('subscriptionsParentPaymentOnly'));
 setViewState('error');
} else if (error.response?.data?.setup_required) {
 setErrorMessage(t('subscriptionsStripeRequired'));
 setViewState('error');
} else if (error.response?.data?.error) {
 setErrorMessage(error.response.data.error);
 setViewState('error');
} else {
 setErrorMessage(t('subscriptionsPaymentFailed'));
 setViewState('error');
}
} finally {
 setSubscribingPlan('');
}
};

 const handleStartTrial = async () => {
 if (!isAuthenticated) {
 showToast(t('subscriptionsLoginToTrial'), 'info', 2500);
 navigate('/parent/login');
 return;
}
 if (isKidAccount) return;

 try {
 setStartingTrial(true);
 const response = await subscriptionsAPI.startTrial();
 setCurrentSubscription(response.data.subscription);
 setViewState('success');
} catch (error) {
 console.error('Error starting trial:', error);
 if (error.response?.status === 401) {
 handleExpiredSession();
} else {
 const msg = error.response?.data?.error || t('subscriptionsTrialError');
 setErrorMessage(msg);
 setViewState('error');
}
 } finally {
 setStartingTrial(false);
}
};

 const handleBillingPortal = async () => {
 try {
 setBillingAction('portal');
 const response = await subscriptionsAPI.createBillingPortalSession();
 if (response.data.portal_url) window.location.href = response.data.portal_url;
 } catch (error) {
 showToast(error.response?.data?.error || t('subscriptionsPortalError'), 'error');
 } finally {
 setBillingAction('');
 }
 };

 const handleCancelSubscription = async () => {
 if (!window.confirm('Annuler votre abonnement à la fin de la période en cours ?')) return;
 try {
 setBillingAction('cancel');
 const response = await subscriptionsAPI.cancelSubscription(true);
 setCurrentSubscription(response.data.subscription);
 showToast('Annulation programmée à la fin de la période.', 'success');
 } catch (error) {
 showToast(error.response?.data?.error || 'Annulation impossible.', 'error');
 } finally {
 setBillingAction('');
 }
 };

 const handleResumeSubscription = async () => {
 try {
 setBillingAction('resume');
 const response = await subscriptionsAPI.resumeSubscription();
 setCurrentSubscription(response.data.subscription);
 showToast('Abonnement réactivé.', 'success');
 } catch (error) {
 showToast(error.response?.data?.error || 'Réactivation impossible.', 'error');
 } finally {
 setBillingAction('');
 }
 };

 const formatMoney = (cents, currency = 'EUR') => new Intl.NumberFormat('fr-FR', {
 style: 'currency',
 currency: currency || 'EUR'
 }).format((Number(cents) || 0) / 100);

 if (loading && !checkoutModalPlan && viewState === 'plans') {
 return (
 <div className="min-h-screen bg-[#f8fbff] py-12 px-4">
 <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
 <Skeleton className="h-[500px] rounded-[2.5rem]" />
 <Skeleton className="h-[520px] rounded-[2.5rem]" />
 <Skeleton className="h-[500px] rounded-[2.5rem]" />
 </div>
 </div>
 );
}

 // RENDER POST-CHECKOUT STATES
 if (viewState === 'success') {
 return (
 <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center p-4">
 <Confetti />
 <motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-card rounded-[3rem] p-10 md:p-16 max-w-2xl w-full text-center shadow-2xl border border-emerald-100">
 <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
 <CheckIcon className="w-12 h-12" />
 </div>
 <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">{t('subscriptionsPaymentSuccess')}</h1>
 <p className="text-xl text-foreground-secondary font-medium mb-8">{t('subscriptionsPaymentSuccessBody')}</p>
 
 <div className="bg-surface-secondary rounded-2xl p-6 mb-8 text-left grid grid-cols-2 gap-4 border border-border">
 <div>
 <p className="text-sm font-bold text-surface-400 uppercase">{t('subscriptionsCurrentPlan')}</p>
 <p className="text-lg font-black text-foreground">{currentSubscription?.plan?.name || 'HKids'}</p>
 </div>
 <div>
 <p className="text-sm font-bold text-surface-400 uppercase">{t('subscriptionsNextRenewal')}</p>
 <p className="text-lg font-black text-foreground">{subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'en' ? 'en-GB' : 'fr-FR') : '-'}</p>
 </div>
 </div>

 <Button onClick={() => navigate('/parent')} variant="primary" size="lg" className="rounded-full shadow-xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 border-none font-black text-white px-12">
 {t('subscriptionsContinueLibrary')}
 </Button>
 </motion.div>
 </div>
 );
}

 if (viewState === 'cancelled') {
 return (
 <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center p-4">
 <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="bg-card rounded-[3rem] p-10 max-w-lg w-full text-center shadow-xl border border-border">
 <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
 <InfoIcon className="w-10 h-10" />
 </div>
 <h1 className="text-3xl font-black text-foreground mb-4">{t('subscriptionsPaymentCancelled')}</h1>
 <p className="text-foreground-secondary font-medium mb-8">{t('subscriptionsPaymentCancelledBody')}</p>
 <Button onClick={() => setViewState('plans')} variant="primary" className="rounded-full px-8 shadow-lg">{t('subscriptionsViewOffers')}</Button>
 </motion.div>
 </div>
 );
}

 if (viewState === 'error') {
 return (
 <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center p-4">
 <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="bg-card rounded-[3rem] p-10 max-w-lg w-full text-center shadow-xl border border-rose-200">
 <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
 <XIcon className="w-10 h-10" />
 </div>
 <h1 className="text-3xl font-black text-foreground mb-4">{t('subscriptionsErrorTitle')}</h1>
 <p className="text-foreground-secondary font-medium mb-8">{errorMessage}</p>
 <Button onClick={() => setViewState('plans')} variant="outline" className="rounded-full px-8 border-border font-bold">{t('subscriptionsBackToPlans')}</Button>
 </motion.div>
 </div>
 );
}

 // DEFAULT PLANS VIEW
 return (
 <div className="min-h-screen bg-[#f8fbff] text-foreground overflow-x-hidden font-sans pb-24">
 
 {/* HEADER */}
 <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
 <Link to={isAuthenticated ?"/parent" :"/"} className="flex items-center gap-2 group">
 <div className="p-2 rounded-full bg-surface-secondary group-hover:bg-surface-200 transition-colors">
 <ChevronLeftIcon className="w-5 h-5 text-foreground-secondary" />
 </div>
 <Logo size="default" />
 </Link>
 <div className="hidden md:flex gap-4">
 <div className="flex items-center gap-2 text-sm font-bold text-foreground-muted">
 <ShieldIcon className="w-4 h-4 text-emerald-500"/> {t('subscriptionsSecurePayments')}
 </div>
 </div>
 </div>
 </header>

 <main id="main-content" className="relative">
 {/* HERO SECTION */}
 <section className="pt-16 pb-12 px-4 text-center max-w-4xl mx-auto">
 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
 <Badge variant="soft" className="bg-primary-100 text-foreground-700 font-bold uppercase tracking-widest mb-6">{t('subscriptionsHeroBadge')}</Badge>
 <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight mb-6">
 {t('subscriptionsHeroTitle')}
 </h1>
 <p className="text-lg md:text-xl text-foreground-secondary font-medium max-w-2xl mx-auto">
 {t('subscriptionsHeroBody')}
 </p>
 </motion.div>
 </section>

 {!isKidAccount && !hasUsableSubscription && isAuthenticated && (
 <section className="max-w-3xl mx-auto px-4 mb-12">
 <Card className="rounded-[2rem] p-8 border-2 border-dashed border-primary-200 bg-primary-50/40 text-center">
 <Badge variant="soft" className="mb-4 bg-primary-100 text-foreground-800 font-bold">{t('subscriptionsFreeTrialBadge')}</Badge>
 <h2 className="text-2xl font-black mb-3">{t('subscriptionsFreeTrialTitle')}</h2>
 <p className="text-foreground-secondary font-medium mb-6">3 livres premium inclus, sans carte bancaire.</p>
 <Button onClick={handleStartTrial} disabled={startingTrial} variant="primary" className="rounded-full px-8 font-black">
 {startingTrial ? 'Activation...' : "Démarrer l'essai gratuit"}
 </Button>
 </Card>
 </section>
 )}

 {isAuthenticated && hasUsableSubscription && !isKidAccount && (
 <section className="max-w-5xl mx-auto px-4 mb-16">
 <Card className="rounded-[2.5rem] p-8 border border-border shadow-sm">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
 <div>
 <Badge variant="soft" className="mb-3 font-bold">Abonnement actif</Badge>
 <h2 className="text-3xl font-black">{currentSubscription?.plan?.name}</h2>
 <p className="text-foreground-secondary font-medium mt-2">
 Statut : {currentSubscription?.status}
 {currentSubscription?.cancel_at_period_end ? ' (annulation programmée)' : ''}
 </p>
 <p className="text-sm text-foreground-muted mt-1">
 {currentSubscription?.status === 'trialing' && currentSubscription?.trial_end
 ? `Fin de l'essai : ${new Date(currentSubscription.trial_end).toLocaleDateString('fr-FR')}`
 : `Prochain renouvellement : ${subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString('fr-FR') : '-'}`}
 </p>
 </div>
 <div className="flex flex-wrap gap-3">
 {currentSubscription?.provider === 'stripe' && (
 <Button onClick={handleBillingPortal} disabled={Boolean(billingAction)} variant="outline" className="rounded-full font-bold">
 Gérer la facturation
 </Button>
 )}
 {currentSubscription?.provider === 'stripe' && !currentSubscription?.cancel_at_period_end && (
 <Button onClick={handleCancelSubscription} disabled={Boolean(billingAction)} variant="ghost" className="rounded-full font-bold text-rose-600">
 Annuler
 </Button>
 )}
 {currentSubscription?.provider === 'stripe' && currentSubscription?.cancel_at_period_end && (
 <Button onClick={handleResumeSubscription} disabled={Boolean(billingAction)} variant="primary" className="rounded-full font-bold">
 Réactiver
 </Button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div>
 <h3 className="text-lg font-black mb-4 flex items-center gap-2"><HistoryIcon className="w-5 h-5"/> Historique</h3>
 <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
 {history.length === 0 ? (
 <p className="text-sm text-foreground-muted">Aucun événement pour le moment.</p>
 ) : history.map((item) => (
 <div key={item.id} className="rounded-2xl border border-border p-4 bg-surface-secondary/40">
 <p className="font-bold text-sm">{item.event_type}</p>
 <p className="text-xs text-foreground-muted mt-1">{new Date(item.created_at).toLocaleString('fr-FR')}</p>
 </div>
 ))}
 </div>
 </div>
 <div>
 <h3 className="text-lg font-black mb-4">Factures</h3>
 <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
 {invoices.length === 0 ? (
 <p className="text-sm text-foreground-muted">Aucune facture disponible.</p>
 ) : invoices.map((invoice) => (
 <div key={invoice.id} className="rounded-2xl border border-border p-4 flex items-center justify-between gap-4">
 <div>
 <p className="font-bold">{formatMoney(invoice.amount_paid, invoice.currency)}</p>
 <p className="text-xs text-foreground-muted">{invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('fr-FR') : invoice.status}</p>
 </div>
 {invoice.hosted_invoice_url && (
 <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary-600 hover:underline">
 Voir
 </a>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 </Card>
 </section>
 )}

 {/* PRICING CARDS */}
 <section className="max-w-7xl mx-auto px-4 mb-20">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative">
 {plans.map((plan, index) => {
 const isCurrent = currentSubscription?.plan?.code === plan.code && hasUsableSubscription;
 const isFeatured = plan.is_featured;

 return (
 <motion.div
 key={plan.code}
 initial={{opacity: 0, y: 30}}
 animate={{opacity: 1, y: 0}}
 transition={{delay: index * 0.1}}
 whileHover={{y: -8}}
 className={`relative rounded-[2.5rem] bg-card p-8 md:p-10 flex flex-col ${
 isFeatured 
 ? 'shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)] border-2 border-primary-400 z-10' 
 : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border mt-0 md:mt-6'
}`}
 >
 {isFeatured && (
 <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-violet-500 text-white font-black text-sm uppercase tracking-widest py-1.5 px-6 rounded-full shadow-lg">
 Recommandé
 </div>
 )}

 <div className="mb-6">
 <h3 className="text-2xl font-black text-foreground">{plan.name}</h3>
 <p className="text-foreground-muted font-medium mt-2 min-h-[48px]">{plan.description}</p>
 </div>

 <div className="mb-8 flex items-end gap-1">
 <span className="text-5xl font-black text-foreground tracking-tighter">{formatPrice(plan)}</span>
 <span className="text-foreground-muted font-bold mb-2">/mois</span>
 </div>

 <div className="flex-1 space-y-4 mb-8">
 <div className="flex items-center gap-3">
 <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
 <span className="font-bold text-foreground-secondary">{plan.book_limit} livres Premium inclus</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
 <span className="font-bold text-foreground-secondary">Génération d'histoires IA</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
 <span className="font-bold text-foreground-secondary">Studio Vocal (Clonage)</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
 <span className="font-bold text-foreground-secondary">Mode Hors Ligne</span>
 </div>
 </div>

 <Button 
 onClick={() => openCheckoutModal(plan)}
 disabled={isKidAccount || isCurrent}
 variant={isFeatured ? 'primary' : 'outline'}
 className={`w-full rounded-full py-4 text-lg font-black ${isFeatured ? 'shadow-xl shadow-primary-500/30' : 'border-border'} ${isCurrent ? 'opacity-50 cursor-not-allowed bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
 >
 {isCurrent ? 'Formule Actuelle' : isKidAccount ? 'Réservé aux parents' : 'Choisir cette formule'}
 </Button>
 </motion.div>
 );
})}
 </div>
 </section>

 {/* COMPARISON TABLE */}
 <section className="max-w-5xl mx-auto px-4 mb-24">
 <div className="text-center mb-10">
 <h2 className="text-3xl font-black text-foreground">Comparez nos formules</h2>
 <p className="text-foreground-muted font-medium mt-2">Tout ce dont vous avez besoin pour des lectures magiques.</p>
 </div>
 <div className="overflow-x-auto rounded-3xl border border-border shadow-sm bg-card">
 <table className="w-full text-left border-collapse min-w-[600px]">
 <thead>
 <tr className="bg-surface-secondary border-b border-border">
 <th className="p-6 font-bold text-foreground-muted w-1/3 sticky left-0 bg-surface-secondary z-10">Fonctionnalités</th>
 {plans.map(p => (
 <th key={p.code} className="p-6 font-black text-foreground text-center">{p.name}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {[
 {label:"Livres générés par mois", keys: plans.map(p => p.book_limit)},
 {label:"Clonage Vocal IA", keys: [<CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>]},
 {label:"Mode hors ligne", keys: [<CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>]},
 {label:"Statistiques de lecture", keys: [<span className="text-surface-300">-</span>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>]},
 {label:"Profils enfants multiples", keys: [<span className="text-surface-300">-</span>, <span className="text-surface-300">-</span>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>]},
 ].map((row, i) => (
 <tr key={i} className="border-b border-border hover:bg-surface-secondary transition-colors">
 <td className="p-4 pl-6 font-bold text-foreground-secondary sticky left-0 bg-card/80 backdrop-blur z-10">{row.label}</td>
 {row.keys.map((val, j) => (
 <td key={j} className="p-4 text-center font-black text-foreground">{val}</td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>

 {/* TRUST SECTION */}
 <section className="bg-surface-900 text-white py-16 mb-24">
 <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
 <div className="flex flex-col items-center">
 <ShieldIcon className="w-10 h-10 text-emerald-400 mb-4" />
 <h4 className="font-black mb-2">Paiements Sécurisés</h4>
 <p className="text-sm text-surface-400 font-medium">Transactions chiffrées gérées par Stripe.</p>
 </div>
 <div className="flex flex-col items-center">
 <XIcon className="w-10 h-10 text-foreground-400 mb-4" />
 <h4 className="font-black mb-2">Annulation Flexible</h4>
 <p className="text-sm text-surface-400 font-medium">Annulez votre abonnement à tout moment en 1 clic.</p>
 </div>
 <div className="flex flex-col items-center">
 <LockIcon className="w-10 h-10 text-violet-400 mb-4" />
 <h4 className="font-black mb-2">Confidentialité</h4>
 <p className="text-sm text-surface-400 font-medium">Vos données et voix sont strictement privées.</p>
 </div>
 <div className="flex flex-col items-center">
 <SparklesIcon className="w-10 h-10 text-amber-400 mb-4" />
 <h4 className="font-black mb-2">Sans Frais Cachés</h4>
 <p className="text-sm text-surface-400 font-medium">Vous payez exactement le prix affiché.</p>
 </div>
 </div>
 </section>

 {/* FAQ SECTION */}
 <section className="max-w-3xl mx-auto px-4 mb-24">
 <h2 className="text-3xl font-black text-foreground text-center mb-10">Questions Fréquentes</h2>
 <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
 <FAQItem question="Puis-je annuler à tout moment ?" answer="Oui, absolument. Vous pouvez annuler votre abonnement à tout moment depuis les paramètres de votre compte. Vous continuerez à avoir accès aux fonctionnalités premium jusqu'à la fin de votre période de facturation." />
 <FAQItem question="Comment fonctionne l'essai gratuit ?" answer="Si vous êtes éligible, vous bénéficiez de 7 jours pour tester l'application. Vous pouvez générer jusqu'à 3 livres. Aucun paiement ne vous sera demandé avant de choisir volontairement une formule." />
 <FAQItem question="Puis-je changer de formule plus tard ?" answer="Oui, vous pouvez passer à une formule supérieure ou inférieure à tout moment. Le changement sera appliqué immédiatement ou au prochain cycle de facturation." />
 <FAQItem question="Le paiement est-il sécurisé ?" answer="Tous nos paiements sont traités par Stripe, l'un des leaders mondiaux du paiement en ligne. Nous ne stockons aucune de vos informations bancaires." />
 </div>
 </section>

 </main>

 {/* PRE-CHECKOUT MODAL */}
 <AnimatePresence>
 {checkoutModalPlan && (
 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
 <motion.div initial={{scale: 0.95, y: 20, opacity: 0}} animate={{scale: 1, y: 0, opacity: 1}} exit={{scale: 0.95, y: 20, opacity: 0}} className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative flex flex-col max-h-[90vh]">
 
 <div className="bg-surface-secondary p-6 md:p-8 border-b border-border flex justify-between items-start">
 <div>
 <Badge variant="soft" className="bg-primary-100 text-foreground-800 font-bold mb-2">Résumé de la commande</Badge>
 <h2 className="text-2xl font-black text-foreground">{checkoutModalPlan.name}</h2>
 </div>
 <button onClick={() => setCheckoutModalPlan(null)} className="p-2 bg-card hover:bg-surface-secondary rounded-full text-foreground-muted shadow-sm">
 <XIcon className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 md:p-8 overflow-y-auto">
 <div className="flex justify-between items-center mb-6 pb-6 border-b border-border">
 <span className="font-bold text-foreground-secondary">Abonnement Mensuel</span>
 <span className="text-xl font-black text-foreground">{formatPrice(checkoutModalPlan)}</span>
 </div>

 <div className="flex justify-between items-center mb-8">
 <span className="font-black text-lg text-foreground">Total à payer aujourd'hui</span>
 <span className="text-3xl font-black text-foreground">{formatPrice(checkoutModalPlan)}</span>
 </div>

 <div className="mb-6">
 <label className="text-sm font-bold text-foreground-secondary mb-2 block">Code promotionnel (optionnel)</label>
 <div className="flex gap-2">
 <input 
 value={promoCode}
 onChange={(e) => setPromoCode(e.target.value)}
 placeholder="Entrez votre code" 
 className="w-full rounded-2xl border-2 border-border px-4 py-3 font-bold outline-none focus:border-primary-400 bg-surface-secondary focus:bg-card"
 />
 <Button variant="outline" className="rounded-2xl font-bold px-6 border-border bg-card">Appliquer</Button>
 </div>
 </div>

 <label className="flex items-start gap-3 p-4 bg-surface-secondary rounded-2xl border border-border cursor-pointer mb-8 hover:bg-surface-secondary transition-colors">
 <input
 type="checkbox"
 checked={termsAccepted}
 onChange={(e) => setTermsAccepted(e.target.checked)}
 className="mt-1 w-5 h-5 accent-emerald-500"
 />
 <span className="text-sm font-bold text-foreground-secondary leading-tight">
 J'accepte les conditions générales de vente et je consens à ce que le paiement récurrent soit débité chaque mois. Je peux annuler à tout moment.
 </span>
 </label>

 <Button 
 onClick={handleSubscribe} 
 disabled={!termsAccepted || subscribingPlan === checkoutModalPlan.code} 
 variant="primary" 
 className="w-full rounded-full py-4 text-lg font-black shadow-xl shadow-primary-500/20 bg-gradient-to-r from-primary-500 to-violet-500 border-none"
 >
 {subscribingPlan === checkoutModalPlan.code ? 'Redirection sécurisée...' : 'Procéder au paiement sécurisé'}
 </Button>

 <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-surface-400">
 <ShieldIcon className="w-4 h-4" />
 Paiement sécurisé par Stripe
 </div>
 </div>

 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 );
}

export default Subscriptions;
