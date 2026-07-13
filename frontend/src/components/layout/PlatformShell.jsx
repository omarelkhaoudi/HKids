import { motion } from 'framer-motion';

const BLOB_PRESETS = {
  kids: [
    {
      className: 'bg-primary-300/30 dark:bg-primary-500/15',
      position: 'top-10 left-10 w-96 h-96',
      animate: { x: [0, 30, 0], y: [0, -20, 0] },
      transition: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-secondary-300/28 dark:bg-secondary-500/12',
      position: 'top-20 right-20 w-[30rem] h-[30rem]',
      animate: { x: [0, -30, 0], y: [0, 30, 0] },
      transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
    },
  ],
  library: [
    {
      className: 'bg-accent-300/25 dark:bg-accent-500/12',
      position: 'top-10 right-10 w-96 h-96',
      animate: { x: [0, 30, 0], y: [0, -20, 0] },
      transition: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-primary-200/30 dark:bg-primary-500/10',
      position: 'top-40 left-20 w-[30rem] h-[30rem]',
      animate: { x: [0, -30, 0], y: [0, 30, 0] },
      transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
    },
  ],
  platform: [
    {
      className: 'bg-primary-200/22 dark:bg-primary-500/10',
      position: 'top-0 -left-20 w-[28rem] h-[28rem]',
      animate: { x: [0, 20, 0], y: [0, -15, 0] },
      transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-secondary-200/18 dark:bg-secondary-500/8',
      position: 'top-32 right-0 w-[24rem] h-[24rem]',
      animate: { x: [0, -25, 0], y: [0, 20, 0] },
      transition: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
    },
    {
      className: 'bg-accent-200/16 dark:bg-accent-500/8',
      position: 'bottom-0 left-1/3 w-[20rem] h-[20rem]',
      animate: { x: [0, 15, 0], y: [0, -10, 0] },
      transition: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
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
