import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscriptionsAPI } from '../api/subscriptions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Logo } from '../components/Logo';
import { BookIcon, CheckIcon, ChevronLeftIcon, LockIcon, StarIcon } from '../components/Icons';

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
  const subscriptionEndsAt = currentSubscription?.current_period_end
    ? new Date(currentSubscription.current_period_end)
    : null;
  const hasUsableSubscription = Boolean(
    currentSubscription &&
    ['trialing', 'active'].includes(currentSubscription.status) &&
    subscriptionEndsAt &&
    subscriptionEndsAt > new Date()
  );

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

    if (!isAuthenticated || checkoutStatus !== 'success' || !sessionId) {
      if (checkoutStatus === 'cancelled') {
        showToast('Paiement annulé. Vous pouvez choisir une formule quand vous voulez.', 'info', 3000);
        setSearchParams({});
      }
      return;
    }

    const confirmCheckout = async () => {
      try {
        setLoading(true);
        const response = await subscriptionsAPI.confirmCheckout(sessionId);
        setCurrentSubscription(response.data.subscription);
        showToast('Paiement confirmé, abonnement activé.', 'success', 3500);
      } catch (error) {
        console.error('Error confirming checkout:', error);
        if (error.response?.status === 401) {
          handleExpiredSession();
        } else {
          showToast("Paiement reçu, mais confirmation HKids impossible pour le moment.", 'error', 4000);
        }
      } finally {
        setLoading(false);
        setSearchParams({});
      }
    };

    confirmCheckout();
  }, [isAuthenticated, searchParams, setSearchParams, showToast]);

  const handleSubscribe = async (planCode) => {
    if (!isAuthenticated) {
      showToast('Connectez-vous pour choisir un abonnement.', 'info', 2500);
      navigate('/parent/login');
      return;
    }

    if (isKidAccount) {
      showToast("Demande a ton parent de choisir une formule pour toi.", 'info', 3500);
      return;
    }

    try {
      setSubscribingPlan(planCode);
      const response = await subscriptionsAPI.createCheckoutSession(planCode);
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
        return;
      }
      throw new Error('Stripe checkout URL missing');
    } catch (error) {
      console.error('Error subscribing:', error);
      if (error.response?.status === 401) {
        handleExpiredSession();
      } else if (error.response?.data?.parent_required) {
        showToast("Le paiement doit etre fait par un compte parent.", 'info', 3500);
      } else if (error.response?.data?.setup_required) {
        showToast('Stripe doit être configuré sur le serveur avant le paiement.', 'error', 4500);
      } else if (error.response?.data?.error) {
        showToast(error.response.data.error, 'error', 3500);
      } else {
        showToast("Le paiement n'a pas pu démarrer.", 'error', 3000);
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

    if (isKidAccount) {
      showToast("Demande a ton parent d'activer l'essai gratuit.", 'info', 3500);
      return;
    }

    try {
      setStartingTrial(true);
      const response = await subscriptionsAPI.startTrial();
      setCurrentSubscription(response.data.subscription);
      showToast('Essai gratuit activé : 3 livres offerts pendant 7 jours.', 'success', 3500);
    } catch (error) {
      console.error('Error starting trial:', error);
      if (error.response?.status === 401) {
        handleExpiredSession();
      } else if (error.response?.data?.parent_required) {
        showToast("L'essai doit etre active par un compte parent.", 'info', 3500);
      } else if (error.response?.status === 409) {
        const message = error.response?.data?.error === 'User already has an active subscription'
          ? 'Vous avez déjà un abonnement ou un essai actif.'
          : "L'essai gratuit a déjà été utilisé sur ce compte.";
        showToast(message, 'info', 3500);
      } else if (error.response?.data?.error) {
        showToast(error.response.data.error, 'error', 3500);
      } else {
        showToast("Impossible de démarrer l'essai gratuit.", 'error', 3000);
      }
    } finally {
      setStartingTrial(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-pink-50/30">
      <header className="sticky top-0 z-40 shadow-md bg-neutral-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-bold hover:bg-red-50 transition-colors shadow-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute left-10 top-16 h-40 w-40 rounded-full bg-pink-200 blur-3xl"></div>
          <div className="absolute right-10 bottom-16 h-48 w-48 rounded-full bg-orange-200 blur-3xl"></div>
        </div>

        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-full text-sm font-bold mb-5 border border-orange-100 shadow-sm">
              <StarIcon className="w-4 h-4" />
              Abonnements mensuels
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-neutral-900 leading-tight">
              {isKidAccount ? 'Un parent choisit tes livres' : 'Choisissez le rythme de lecture de votre enfant'}
            </h1>
            <p className="mt-5 text-lg text-neutral-600 leading-relaxed">
              {isKidAccount
                ? "Les abonnements et les paiements sont geres par ton parent. Tu peux lire les livres qu'il autorise."
                : "Des formules simples, pensées pour débloquer 1, 2 ou 3 livres par mois selon l'envie et l'âge de votre enfant."}
            </p>
          </motion.div>

          {!isAuthenticated && (
            <div className="mt-8 mx-auto max-w-2xl rounded-2xl bg-white/90 border border-orange-100 p-4 text-center text-neutral-700 shadow-sm">
              <LockIcon className="inline-block w-5 h-5 text-orange-500 mr-2" />
              Connectez-vous pour activer une formule. Les offres restent visibles pour vous aider à choisir.
            </div>
          )}

          {isKidAccount && (
            <div className="mt-8 mx-auto max-w-2xl rounded-2xl bg-white/90 border border-orange-100 p-5 text-center text-neutral-700 shadow-sm">
              <LockIcon className="inline-block w-5 h-5 text-orange-500 mr-2" />
              Les paiements sont reserves aux parents. Si un livre est bloque, demande a ton parent d'activer une formule depuis son espace.
              <div className="mt-4">
                <Link
                  to="/kids"
                  className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
                >
                  Retour a mes livres
                </Link>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl bg-neutral-900 text-white p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-orange-200">
                <StarIcon className="w-4 h-4" />
                Essai gratuit
              </div>
              <h2 className="mt-4 text-3xl font-extrabold">Essayez HKids gratuitement</h2>
              <p className="mt-2 text-neutral-300 max-w-2xl">
                7 jours pour découvrir le lecteur, avec 3 livres offerts. Aucun paiement Stripe nécessaire pour démarrer.
              </p>
            </div>
            <button
              onClick={handleStartTrial}
              disabled={isKidAccount || startingTrial || loading || hasUsableSubscription}
              className="shrink-0 rounded-full bg-white px-7 py-4 font-extrabold text-neutral-900 shadow-lg transition-colors hover:bg-orange-50 disabled:cursor-default disabled:opacity-70"
            >
              {hasUsableSubscription && currentSubscription?.status === 'trialing'
                ? 'Essai gratuit actif'
                : hasUsableSubscription && currentSubscription?.status === 'active'
                ? 'Abonnement actif'
                : isKidAccount
                ? 'Reserve aux parents'
                : startingTrial
                ? 'Activation...'
                : "Commencer l'essai gratuit"}
            </button>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, index) => {
              const isCurrent = currentSubscription?.plan?.code === plan.code && hasUsableSubscription;
              const isBusy = subscribingPlan === plan.code;

              return (
                <motion.article
                  key={plan.code}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative rounded-3xl bg-white p-6 shadow-xl border-2 ${
                    plan.is_featured ? 'border-pink-400 md:-translate-y-4' : 'border-white'
                  }`}
                >
                  {plan.is_featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                      Recommandé
                    </div>
                  )}

                  <div className="flex h-full flex-col">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-5">
                      <BookIcon className="w-7 h-7 text-pink-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-neutral-900">{plan.name}</h2>
                    <p className="mt-3 text-neutral-600 leading-relaxed min-h-[72px]">{plan.description}</p>

                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-extrabold text-neutral-900">{formatPrice(plan)}</span>
                      <span className="pb-2 text-neutral-500 font-semibold">/ mois</span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-3 text-neutral-800">
                        <CheckIcon className="w-5 h-5 text-green-500" />
                        <span className="font-semibold">
                          {plan.book_limit} {plan.book_limit > 1 ? 'livres inclus' : 'livre inclus'} chaque mois
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-800">
                        <CheckIcon className="w-5 h-5 text-green-500" />
                        <span>Lecture et écoute dans le lecteur HKids</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-800">
                        <CheckIcon className="w-5 h-5 text-green-500" />
                        <span>Formule mensuelle modifiable</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.code)}
                      disabled={isKidAccount || isBusy || isCurrent || loading}
                      className={`mt-8 w-full rounded-full px-6 py-4 font-bold shadow-lg transition-all ${
                        isCurrent
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-xl'
                      } disabled:opacity-70`}
                    >
                      {isCurrent && currentSubscription?.status === 'trialing'
                        ? 'Essai gratuit actif'
                        : isCurrent
                        ? 'Abonnement actif'
                        : isKidAccount
                        ? 'Demander a un parent'
                        : isBusy
                        ? 'Redirection Stripe...'
                        : "Choisir cette formule"}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-10 rounded-3xl bg-neutral-900 text-white p-6 md:p-8 shadow-xl">
            <h2 className="text-2xl font-extrabold mb-3">Paiement sécurisé avec Stripe</h2>
            <p className="text-neutral-300 leading-relaxed">
              Les formules payantes passent par Stripe Checkout et doivent etre activees par un parent ou un adulte responsable. L'essai gratuit permet de tester HKids avant de choisir un abonnement mensuel.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Subscriptions;
