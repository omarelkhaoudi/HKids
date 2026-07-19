/**
 * HKids premium motion system — subtle, calm, 200–450ms.
 * Always pair with useReducedMotion() / getMotionProps().
 */

export const KIDS_MOTION_DURATION = {
  fast: 0.2,
  base: 0.32,
  slow: 0.45,
};

const easeOut = [0.22, 1, 0.36, 1];

export const kidsPageEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: KIDS_MOTION_DURATION.base, ease: easeOut },
};

export const kidsCardAppear = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: KIDS_MOTION_DURATION.base, ease: easeOut },
};

export const kidsCarouselReveal = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: KIDS_MOTION_DURATION.slow, ease: easeOut },
};

export const kidsHoverLift = {
  whileHover: { y: -4 },
  whileTap: { scale: 0.985 },
  transition: { duration: KIDS_MOTION_DURATION.fast, ease: easeOut },
};

export const kidsTouchFeedback = {
  whileTap: { scale: 0.97 },
  transition: { duration: KIDS_MOTION_DURATION.fast },
};

export const kidsBookOpen = {
  initial: { opacity: 0, scale: 0.92, rotateY: -8 },
  animate: { opacity: 1, scale: 1, rotateY: 0 },
  transition: { duration: KIDS_MOTION_DURATION.slow, ease: easeOut },
};

export const kidsFloat = {
  animate: { y: [0, -4, 0] },
  transition: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
};

export const kidsBadgePop = {
  initial: { scale: 0.92, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: KIDS_MOTION_DURATION.base, ease: easeOut },
};

export const kidsProgressFill = {
  transition: { duration: KIDS_MOTION_DURATION.slow, ease: easeOut },
};

export const kidsRouteExit = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
  transition: { duration: KIDS_MOTION_DURATION.fast, ease: easeOut },
};

export const kidsCategoryEnter = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: KIDS_MOTION_DURATION.slow, ease: easeOut },
};

export const kidsStaggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const REDUCED = {
  initial: false,
  animate: {},
  exit: {},
  transition: { duration: 0 },
  whileHover: undefined,
  whileTap: undefined,
};

/**
 * Strip motion when prefers-reduced-motion is on.
 * @param {boolean} reduced
 * @param {Record<string, unknown>} variants
 */
export function getMotionProps(reduced, variants = kidsPageEnter) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0, x: 0, scale: 1 },
      transition: { duration: 0 },
    };
  }
  return variants;
}

export function getHoverMotion(reduced, variants = kidsHoverLift) {
  if (reduced) return {};
  return variants;
}

export function getFloatMotion(reduced, variants = kidsFloat) {
  if (reduced) return {};
  return variants;
}

export { REDUCED as kidsMotionReduced };
