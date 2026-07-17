import { motion } from 'framer-motion';

const BLOB_PRESETS = {
  kids: [
    {
      className: 'bg-primary-200/20 dark:bg-primary-500/10',
      position: 'top-10 left-10 w-80 h-80',
      animate: { x: [0, 16, 0], y: [0, -10, 0] },
      transition: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-primary-100/25 dark:bg-primary-500/8',
      position: 'top-24 right-16 w-[26rem] h-[26rem]',
      animate: { x: [0, -14, 0], y: [0, 14, 0] },
      transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
    },
  ],
  library: [
    {
      className: 'bg-primary-100/22 dark:bg-primary-500/8',
      position: 'top-10 right-10 w-80 h-80',
      animate: { x: [0, 14, 0], y: [0, -10, 0] },
      transition: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-surface-200/30 dark:bg-primary-500/6',
      position: 'top-40 left-20 w-[26rem] h-[26rem]',
      animate: { x: [0, -12, 0], y: [0, 12, 0] },
      transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
    },
  ],
  platform: [
    {
      className: 'bg-primary-100/18 dark:bg-primary-500/8',
      position: 'top-0 -left-20 w-[24rem] h-[24rem]',
      animate: { x: [0, 12, 0], y: [0, -8, 0] },
      transition: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-primary-50/30 dark:bg-primary-500/6',
      position: 'top-32 right-0 w-[20rem] h-[20rem]',
      animate: { x: [0, -12, 0], y: [0, 10, 0] },
      transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
    },
  ],
};

export function MagicalBackground({ preset = 'platform' }) {
  const blobs = BLOB_PRESETS[preset] || BLOB_PRESETS.platform;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {blobs.map((blob) => (
        <motion.div
          key={blob.position}
          animate={blob.animate}
          transition={blob.transition}
          className={`absolute rounded-full blur-3xl ${blob.className} ${blob.position}`}
        />
      ))}
    </div>
  );
}

/** @deprecated Use MagicalBackground — kept for existing kids imports */
export function KidsMagicalBackground({ variant = 'home' }) {
  return <MagicalBackground preset={variant === 'library' ? 'library' : 'kids'} />;
}

export function PlatformShell({
  children,
  variant = 'platform',
  className = '',
  isRtl = false,
  footer = null,
}) {
  const isKids = variant === 'kids' || variant === 'library';
  const bgClass = isKids ? 'bg-background-kids' : 'bg-background';
  const blobPreset = variant === 'library' ? 'library' : isKids ? 'kids' : 'platform';

  return (
    <div
      className={`min-h-screen ${bgClass} text-foreground overflow-x-hidden font-sans ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <MagicalBackground preset={blobPreset} />
      {children}
      {footer}
    </div>
  );
}

export default PlatformShell;
