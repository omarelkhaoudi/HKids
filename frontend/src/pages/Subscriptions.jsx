import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionsAPI } from '../api/subscriptions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Logo } from '../components/Logo';
import { 
  BookIcon, CheckIcon, ChevronLeftIcon, LockIcon, StarIcon, 
  SparklesIcon, ShieldIcon, XIcon, InfoIcon, BrainIcon, AudioIcon, HistoryIcon, ChevronUpIcon 
} from '../components/Icons';
import { Button, Card, Badge, Skeleton } from '../components/ui';

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
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
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
          initial={{ x: p.x, y: p.y, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: 0, rotate: 360, x: p.x + (Math.random() * 100 - 50) }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '50%' }}
        />
      ))}
    </div>
  );
};

// Accordion Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-surface-200 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left font-bold text-surface-900 focus:outline-none">
        <span>{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-surface-400">
          <ChevronUpIcon className="w-5 h-5 rotate-180" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pt-4 text-surface-600 font-medium">{answer}</p>
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
  const { user, logout } = useAuth();
  const { showToast } = useToast();
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
            setErrorMessage("Paiement reçu, mais la confirmation n'a pas pu aboutir immédiatement.");
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
      showToast("Demande à ton parent de choisir une formule pour toi.", 'info', 3500);
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
        setErrorMessage("Le paiement doit être fait par un compte parent.");
        setViewState('error');
      } else if (error.response?.data?.setup_required) {
        setErrorMessage("Stripe doit être configuré sur le serveur avant le paiement.");
        setViewState('error');
      } else if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
        setViewState('error');
      } else {
        setErrorMessage("Le paiement n'a pas pu démarrer.");
        setViewState('error');
      }
    } finally {
      setSubscribingPlan('');
    }
  };

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      showToast("Connectez-vous pour démarrer l'essai gratuit.", 'info', 2500);
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
        const msg = error.response?.data?.error || "Impossible de démarrer l'essai gratuit.";
        setErrorMessage(msg);
        setViewState('error');
      }
    } finally {
      setStartingTrial(false);
    }
  };

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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 md:p-16 max-w-2xl w-full text-center shadow-2xl border border-emerald-100">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-4">Paiement Réussi !</h1>
          <p className="text-xl text-surface-600 font-medium mb-8">Votre abonnement est maintenant actif. Préparez-vous à des histoires magiques.</p>
          
          <div className="bg-surface-50 rounded-2xl p-6 mb-8 text-left grid grid-cols-2 gap-4 border border-surface-100">
            <div>
              <p className="text-sm font-bold text-surface-400 uppercase">Formule Actuelle</p>
              <p className="text-lg font-black text-surface-900">{currentSubscription?.plan?.name || "Abonnement HKids"}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-surface-400 uppercase">Prochain Renouvellement</p>
              <p className="text-lg font-black text-surface-900">{subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString('fr-FR') : '-'}</p>
            </div>
          </div>

          <Button onClick={() => navigate('/parent')} variant="primary" size="lg" className="rounded-full shadow-xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 border-none font-black text-white px-12">
            Continuer vers la bibliothèque
          </Button>
        </motion.div>
      </div>
    );
  }

  if (viewState === 'cancelled') {
    return (
      <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-xl border border-surface-200">
          <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <InfoIcon className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-surface-900 mb-4">Paiement Annulé</h1>
          <p className="text-surface-600 font-medium mb-8">Vous n'avez pas été débité. Vous pouvez choisir une formule quand vous serez prêt.</p>
          <Button onClick={() => setViewState('plans')} variant="primary" className="rounded-full px-8 shadow-lg">Voir les offres</Button>
        </motion.div>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-xl border border-rose-200">
          <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XIcon className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-surface-900 mb-4">Erreur</h1>
          <p className="text-surface-600 font-medium mb-8">{errorMessage}</p>
          <Button onClick={() => setViewState('plans')} variant="outline" className="rounded-full px-8 border-surface-200 font-bold">Retour aux abonnements</Button>
        </motion.div>
      </div>
    );
  }

  // DEFAULT PLANS VIEW
  return (
    <div className="min-h-screen bg-[#f8fbff] text-surface-900 overflow-x-hidden font-sans pb-24">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to={isAuthenticated ? "/parent" : "/"} className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-surface-100 group-hover:bg-surface-200 transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-surface-600" />
            </div>
            <Logo size="default" />
          </Link>
          <div className="hidden md:flex gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-surface-500">
              <ShieldIcon className="w-4 h-4 text-emerald-500"/> Paiements Sécurisés
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* HERO SECTION */}
        <section className="pt-16 pb-12 px-4 text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="soft" className="bg-primary-100 text-primary-700 font-bold uppercase tracking-widest mb-6">Abonnements HKids</Badge>
            <h1 className="text-4xl md:text-6xl font-black text-surface-900 leading-tight mb-6">
              Investissez dans l'imagination de vos enfants.
            </h1>
            <p className="text-lg md:text-xl text-surface-600 font-medium max-w-2xl mx-auto">
              Des histoires personnalisées illimitées, le clonage vocal, et des fonctionnalités éducatives premium. Annulable à tout moment.
            </p>
          </motion.div>
        </section>

        {/* PRICING CARDS */}
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative">
            {plans.map((plan, index) => {
              const isCurrent = currentSubscription?.plan?.code === plan.code && hasUsableSubscription;
              const isFeatured = plan.is_featured;

              return (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={`relative rounded-[2.5rem] bg-white p-8 md:p-10 flex flex-col ${
                    isFeatured 
                      ? 'shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)] border-2 border-primary-400 z-10' 
                      : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-200 mt-0 md:mt-6'
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-violet-500 text-white font-black text-sm uppercase tracking-widest py-1.5 px-6 rounded-full shadow-lg">
                      Recommandé
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-surface-900">{plan.name}</h3>
                    <p className="text-surface-500 font-medium mt-2 min-h-[48px]">{plan.description}</p>
                  </div>

                  <div className="mb-8 flex items-end gap-1">
                    <span className="text-5xl font-black text-surface-900 tracking-tighter">{formatPrice(plan)}</span>
                    <span className="text-surface-500 font-bold mb-2">/mois</span>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
                      <span className="font-bold text-surface-700">{plan.book_limit} livres Premium inclus</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
                      <span className="font-bold text-surface-700">Génération d'histoires IA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
                      <span className="font-bold text-surface-700">Studio Vocal (Clonage)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4"/></div>
                      <span className="font-bold text-surface-700">Mode Hors Ligne</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => openCheckoutModal(plan)}
                    disabled={isKidAccount || isCurrent}
                    variant={isFeatured ? 'primary' : 'outline'}
                    className={`w-full rounded-full py-4 text-lg font-black ${isFeatured ? 'shadow-xl shadow-primary-500/30' : 'border-surface-200'} ${isCurrent ? 'opacity-50 cursor-not-allowed bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
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
            <h2 className="text-3xl font-black text-surface-900">Comparez nos formules</h2>
            <p className="text-surface-500 font-medium mt-2">Tout ce dont vous avez besoin pour des lectures magiques.</p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-surface-200 shadow-sm bg-white">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="p-6 font-bold text-surface-500 w-1/3 sticky left-0 bg-surface-50 z-10">Fonctionnalités</th>
                  {plans.map(p => (
                    <th key={p.code} className="p-6 font-black text-surface-900 text-center">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Livres générés par mois", keys: plans.map(p => p.book_limit) },
                  { label: "Clonage Vocal IA", keys: [<CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>] },
                  { label: "Mode hors ligne", keys: [<CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>] },
                  { label: "Statistiques de lecture", keys: [<span className="text-surface-300">-</span>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>] },
                  { label: "Profils enfants multiples", keys: [<span className="text-surface-300">-</span>, <span className="text-surface-300">-</span>, <CheckIcon className="w-5 h-5 mx-auto text-emerald-500"/>] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-surface-700 sticky left-0 bg-white/80 backdrop-blur z-10">{row.label}</td>
                    {row.keys.map((val, j) => (
                      <td key={j} className="p-4 text-center font-black text-surface-900">{val}</td>
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
              <XIcon className="w-10 h-10 text-primary-400 mb-4" />
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
          <h2 className="text-3xl font-black text-surface-900 text-center mb-10">Questions Fréquentes</h2>
          <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-sm">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative flex flex-col max-h-[90vh]">
              
              <div className="bg-surface-50 p-6 md:p-8 border-b border-surface-200 flex justify-between items-start">
                <div>
                  <Badge variant="soft" className="bg-primary-100 text-primary-800 font-bold mb-2">Résumé de la commande</Badge>
                  <h2 className="text-2xl font-black text-surface-900">{checkoutModalPlan.name}</h2>
                </div>
                <button onClick={() => setCheckoutModalPlan(null)} className="p-2 bg-white hover:bg-surface-100 rounded-full text-surface-500 shadow-sm">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-surface-100">
                  <span className="font-bold text-surface-600">Abonnement Mensuel</span>
                  <span className="text-xl font-black text-surface-900">{formatPrice(checkoutModalPlan)}</span>
                </div>

                <div className="flex justify-between items-center mb-8">
                  <span className="font-black text-lg text-surface-900">Total à payer aujourd'hui</span>
                  <span className="text-3xl font-black text-surface-900">{formatPrice(checkoutModalPlan)}</span>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold text-surface-600 mb-2 block">Code promotionnel (optionnel)</label>
                  <div className="flex gap-2">
                    <input 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Entrez votre code" 
                      className="w-full rounded-2xl border-2 border-surface-100 px-4 py-3 font-bold outline-none focus:border-primary-400 bg-surface-50 focus:bg-white"
                    />
                    <Button variant="outline" className="rounded-2xl font-bold px-6 border-surface-200 bg-white">Appliquer</Button>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 bg-surface-50 rounded-2xl border border-surface-200 cursor-pointer mb-8 hover:bg-surface-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-emerald-500"
                  />
                  <span className="text-sm font-bold text-surface-700 leading-tight">
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
