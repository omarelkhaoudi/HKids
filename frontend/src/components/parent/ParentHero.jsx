import { Badge, Button } from '../ui';
import { PlusIcon } from '../Icons';
import { KidAvatar } from './KidAvatar';
import { KidsMascot } from '../kids/KidsMascot';
import { KidsBookCover } from '../kids/KidsBookCover';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import { motion } from 'framer-motion';

/**
 * Emotional parent home hero — visual only.
 * Reuses Kids mascot + book cover + existing translation keys.
 */
export function ParentHero({
  currentDate,
  greeting,
  subtitle,
  kidsCountLabel,
  planLabel = null,
  themeLabel = null,
  selectedKid = null,
  continueBook = null,
  onAddKid,
  t = (key) => key,
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className="parent-hero"
      aria-labelledby="parent-hero-heading"
      {...getMotionProps(reducedMotion, kidsCardAppear)}
    >
      <div className="parent-hero-glow parent-hero-glow--a" aria-hidden="true" />
      <div className="parent-hero-glow parent-hero-glow--b" aria-hidden="true" />
      <div className="parent-hero-blob parent-hero-blob--one" aria-hidden="true" />
      <div className="parent-hero-blob parent-hero-blob--two" aria-hidden="true" />

      <div className="parent-hero-grid">
        <div className="parent-hero-copy">
          <p className="parent-hero-kicker capitalize">{currentDate}</p>
          <h1 id="parent-hero-heading" className="parent-hero-title">
            {greeting}
          </h1>
          <p className="parent-hero-subtitle">{subtitle}</p>

          <div className="parent-hero-meta">
            {kidsCountLabel ? (
              <Badge variant="secondary" className="font-bold parent-hero-badge">
                {kidsCountLabel}
              </Badge>
            ) : null}
            {planLabel ? (
              <Badge variant="primary" className="font-bold parent-hero-badge">
                {planLabel}
              </Badge>
            ) : null}
            {themeLabel ? (
              <Badge variant="secondary" className="font-bold parent-hero-badge">
                {themeLabel}
              </Badge>
            ) : null}
          </div>

          {continueBook ? (
            <div className="parent-hero-continue">
              <div className="parent-hero-continue-cover">
                <KidsBookCover
                  book={continueBook}
                  alt={continueBook.title || ''}
                  imgClassName="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="parent-hero-continue-label">{t('parentHomeContinueTogether')}</p>
                <p className="parent-hero-continue-title truncate">{continueBook.title}</p>
                <p className="parent-hero-continue-progress">
                  {t('parentHomeContinueProgress', { percent: continueBook.progress_percent || 0 })}
                </p>
              </div>
            </div>
          ) : (
            <p className="parent-hero-empty-hint">{t('parentHomeContinueEmptyDesc')}</p>
          )}

          {onAddKid ? (
            <div className="parent-hero-actions">
              <Button variant="primary" onClick={onAddKid} className="min-h-touch font-bold parent-hero-cta">
                <PlusIcon className="w-5 h-5 me-2" aria-hidden="true" />
                {t('parentAddKid')}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="parent-hero-visual" aria-hidden="true">
          <div className="parent-hero-visual-ring">
            {selectedKid ? (
              <KidAvatar kid={selectedKid} size="xl" className="parent-hero-avatar" />
            ) : (
              <KidsMascot mood="wave" size="default" showBubble={false} className="parent-hero-mascot" />
            )}
          </div>
          <div className="parent-hero-mascot-float">
            <KidsMascot mood="encourage" size="small" showBubble={false} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default ParentHero;
