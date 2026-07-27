import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { booksAPI } from '../api/books';
import { subscriptionsAPI } from '../api/subscriptions';
import { KidsPageShell } from '../components/kids/KidsPageShell';
import { KidsPageHeader } from '../components/kids/KidsPageHeader';
import { KidsBottomNav } from '../components/kids/KidsBottomNav';
import { KidsHero } from '../components/kids/KidsHero';
import { PremiumPackCard } from '../components/premium/PremiumPackCard';
import { VoiceAssistant } from '../components/kids/VoiceAssistant';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { buildPremiumDiscoverySections, hasActiveSubscription } from '../utils/premiumAccess';
import { premLabel } from '../constants/premiumLabels';
import { BookGridSkeleton } from '../components/SkeletonLoader';
import { KidsEmptyState } from '../components/kids/KidsEmptyState';

function Section({ title, packs, language, lockedDefault, onUnlock, onOpen, onPreview, reducedMotion }) {
  if (!packs?.length) return null;
  return (
    <section className="mb-space-32">
      <h2 className="kids-type-h2 mb-space-16 px-1">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-16">
        {packs.map((pack) => (
          <PremiumPackCard
            key={pack.id}
            pack={pack}
            language={language}
            locked={pack.access?.locked ?? lockedDefault}
            reducedMotion={reducedMotion}
            onUnlock={() => onUnlock(pack)}
            onOpen={() => onOpen(pack)}
            onPreview={() => onPreview(pack)}
          />
        ))}
      </div>
    </section>
  );
}

function KidsPremium() {
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [books, setBooks] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewPack, setPreviewPack] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [booksRes, subRes] = await Promise.allSettled([
          booksAPI.getPublishedBooks({ language }),
          user ? subscriptionsAPI.getCurrentSubscription() : Promise.resolve({ data: null }),
        ]);
        if (!active) return;
        if (booksRes.status === 'fulfilled') setBooks(booksRes.value.data || []);
        if (subRes.status === 'fulfilled') {
          const data = subRes.value.data;
          setSubscription(data?.subscription ?? data ?? null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [language, user]);

  const sections = useMemo(
    () => buildPremiumDiscoverySections({ books, subscription }),
    [books, subscription],
  );
  const isPremium = hasActiveSubscription(subscription);
  const hasAnyPack = useMemo(() => {
    return Object.values(sections || {}).some((list) => Array.isArray(list) && list.length > 0);
  }, [sections]);

  const goUnlock = () => navigate('/abonnements');
  const openPack = (pack) => {
    if (pack.ai) {
      navigate('/kids/ai-stories');
      return;
    }
    const theme = pack.themes?.[0];
    navigate(theme ? `/kids/library?theme=${encodeURIComponent(theme)}` : '/kids/library');
  };

  return (
    <KidsPageShell isRtl={isRtl} variant="library" world="home" className="pb-space-32" footer={<KidsBottomNav />}>
      <KidsPageHeader backTo="/kids" emoji="✨" title={premLabel('premNav', language)} />
      <div className="kids-main kids-main-tablet-wide relative z-10">
        <KidsHero
          modality="books"
          emoji="💎"
          badge={premLabel('premNav', language)}
          title={premLabel('premHeroTitle', language)}
          subtitle={premLabel('premHeroBody', language)}
          className="mb-space-24"
        />

        <div className="mb-space-24 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-4 py-2 text-caption font-black min-h-touch inline-flex items-center ${isPremium ? 'bg-success-100 text-success-800' : 'bg-surface-secondary text-foreground'}`}>
            {isPremium ? premLabel('premStatusActive', language) : premLabel('premStatusFree', language)}
          </span>
          <Link
            to="/abonnements"
            className="min-h-touch inline-flex items-center rounded-full bg-primary-600 text-white px-4 font-black text-caption shadow-soft hover:shadow-card transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            {isPremium ? premLabel('premManage', language) : premLabel('premUnlock', language)}
          </Link>
        </div>

        {loading ? (
          <BookGridSkeleton count={6} />
        ) : !hasAnyPack ? (
          <KidsEmptyState
            emoji="💎"
            title={premLabel('premHeroTitle', language)}
            description={premLabel('premHeroBody', language)}
            actionLabel={t('goToLibrary')}
            onAction={() => navigate('/kids/library')}
            showMascot
            mascotMood="encourage"
          />
        ) : (
          <>
            <Section title={premLabel('premPopular', language)} packs={sections.popular} language={language} lockedDefault={!isPremium} onUnlock={goUnlock} onOpen={openPack} onPreview={setPreviewPack} reducedMotion={reducedMotion} />
            <Section title={premLabel('premNew', language)} packs={sections.newPremium} language={language} lockedDefault={!isPremium} onUnlock={goUnlock} onOpen={openPack} onPreview={setPreviewPack} reducedMotion={reducedMotion} />
            <Section title={premLabel('premSeasonal', language)} packs={sections.seasonal} language={language} lockedDefault={!isPremium} onUnlock={goUnlock} onOpen={openPack} onPreview={setPreviewPack} reducedMotion={reducedMotion} />
            <Section title={premLabel('premAi', language)} packs={sections.aiStories} language={language} lockedDefault={!isPremium} onUnlock={goUnlock} onOpen={openPack} onPreview={setPreviewPack} reducedMotion={reducedMotion} />
            <Section title={premLabel('premCollections', language)} packs={sections.collections} language={language} lockedDefault={!isPremium} onUnlock={goUnlock} onOpen={openPack} onPreview={setPreviewPack} reducedMotion={reducedMotion} />
            <Section title={premLabel('premRecommended', language)} packs={sections.recommended} language={language} lockedDefault={!isPremium} onUnlock={goUnlock} onOpen={openPack} onPreview={setPreviewPack} reducedMotion={reducedMotion} />
          </>
        )}

        {previewPack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewPack(null)}
            role="dialog"
            aria-modal="true"
            aria-label={premLabel('premPreview', language)}
          >
            <div
              className="bg-card rounded-32 p-space-24 max-w-md w-full shadow-floating border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-4xl mb-3 leading-none" aria-hidden="true">{previewPack.emoji}</p>
              <h3 className="kids-type-h2 mb-2">{t(previewPack.labelKey) !== previewPack.labelKey ? t(previewPack.labelKey) : premLabel(previewPack.labelKey, language)}</h3>
              <p className="text-body text-foreground-secondary mb-4">{premLabel(previewPack.descKey, language)}</p>
              <p className="text-caption text-foreground-muted mb-4">
                {(previewPack.sampleBooks || []).slice(0, 3).map((b) => b.title).join(' · ') || premLabel('premPreview', language)}
              </p>
              <div className="flex gap-2">
                <button type="button" className="flex-1 min-h-touch rounded-24 bg-primary-600 text-white font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300" onClick={goUnlock}>
                  {premLabel('premUnlock', language)}
                </button>
                <button type="button" className="min-h-touch rounded-24 border border-border px-4 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300" onClick={() => setPreviewPack(null)}>
                  OK
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <VoiceAssistant onNavigate={navigate} />
    </KidsPageShell>
  );
}

export default KidsPremium;
