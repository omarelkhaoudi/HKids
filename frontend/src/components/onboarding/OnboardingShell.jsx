import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { KidsMascot } from '../kids/KidsMascot';
import { getMotionProps, kidsPageEnter } from '../../constants/kidsMotion';

export function OnboardingShell({
  children,
  step,
  totalSteps = 7,
  showMascot = true,
  mascotMood = 'wave',
  onSkip,
  skipLabel,
}) {
  const reducedMotion = useReducedMotion();
  const progress = Math.min(100, Math.round((step / totalSteps) * 100));

  return (
    <div className="hkids-onboarding-shell min-h-screen flex flex-col relative overflow-hidden">
      <div className="hkids-onboarding-glow hkids-onboarding-glow--a" aria-hidden="true" />
      <div className="hkids-onboarding-glow hkids-onboarding-glow--b" aria-hidden="true" />
      {!reducedMotion && (
        <div className="hkids-onboarding-particles" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} className={`hkids-onboarding-particle hkids-onboarding-particle--${index % 4}`} />
          ))}
        </div>
      )}

      <header className="relative z-20 flex items-center justify-between gap-4 px-space-16 md:px-space-32 py-space-16">
        <div className="min-w-[5rem]">
          {step > 1 && (
            <span className="kids-type-caption text-foreground-muted">
              {step}/{totalSteps}
            </span>
          )}
        </div>
        <div
          className="hkids-onboarding-progress flex-1 max-w-xs"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}%`}
        >
          <div className="hkids-onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="kids-type-meta font-semibold text-primary-700 min-h-touch-kids px-space-12 rounded-full hover:bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            {skipLabel}
          </button>
        ) : (
          <div className="min-w-[5rem]" />
        )}
      </header>

      <motion.main
        key={step}
        {...getMotionProps(reducedMotion, kidsPageEnter)}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-space-16 md:px-space-32 pb-space-32"
      >
        {showMascot && (
          <div className="mb-space-16">
            <KidsMascot mood={mascotMood} size="small" showBubble={false} />
          </div>
        )}
        {children}
      </motion.main>
    </div>
  );
}

export default OnboardingShell;
