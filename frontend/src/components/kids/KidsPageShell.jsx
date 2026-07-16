import { PlatformShell, MagicalBackground, KidsMagicalBackground } from '../layout/PlatformShell';
import { KidsAmbientBackground } from './KidsAmbientBackground';

export { MagicalBackground, KidsMagicalBackground };

export function KidsPageShell({
  children,
  isRtl = false,
  variant = 'home',
  world,
  className = '',
  footer = null,
}) {
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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </PlatformShell>
  );
}

export default KidsPageShell;
