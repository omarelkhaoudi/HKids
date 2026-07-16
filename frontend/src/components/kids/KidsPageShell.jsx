import { motion } from 'framer-motion';
import { PlatformShell, MagicalBackground, KidsMagicalBackground } from '../layout/PlatformShell';
import { KidsAmbientBackground } from './KidsAmbientBackground';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsPageEnter } from '../../constants/kidsMotion';

export { MagicalBackground, KidsMagicalBackground };

export function KidsPageShell({
  children,
  isRtl = false,
  variant = 'home',
  world,
  className = '',
  footer = null,
  wide = false,
}) {
  const reducedMotion = useReducedMotion();
  const shellVariant = variant === 'library' ? 'library' : 'kids';
  const ambientWorld = world || (variant === 'library' ? 'books' : 'home');

  return (
    <PlatformShell
      variant={shellVariant}
      isRtl={isRtl}
      className={`relative ${className}`}
      footer={footer}
    >
      <KidsAmbientBackground world={ambientWorld} />
      <motion.div
        className={`kids-page relative z-10 flex min-h-0 flex-1 flex-col ${wide ? 'kids-main-tablet-wide' : ''}`}
        {...getMotionProps(reducedMotion, kidsPageEnter)}
      >
        {children}
      </motion.div>
    </PlatformShell>
  );
}

export default KidsPageShell;
