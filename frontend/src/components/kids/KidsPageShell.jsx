import { motion } from 'framer-motion';
import { PlatformShell, MagicalBackground, KidsMagicalBackground } from '../layout/PlatformShell';

export { MagicalBackground, KidsMagicalBackground };

export function KidsPageShell({
  children,
  isRtl = false,
  variant = 'home',
  className = '',
  footer = null,
}) {
  const shellVariant = variant === 'library' ? 'library' : 'kids';

  return (
    <PlatformShell
      variant={shellVariant}
      isRtl={isRtl}
      className={className}
      footer={footer}
    >
      {children}
    </PlatformShell>
  );
}

export default KidsPageShell;
