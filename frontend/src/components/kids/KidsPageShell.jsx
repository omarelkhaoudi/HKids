import { motion } from 'framer-motion';

const BLOB_VARIANTS = {
  sky: {
    className: 'bg-sky-300/35 dark:bg-sky-400/15',
    animate: { x: [0, 30, 0], y: [0, -20, 0] },
    transition: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
    position: 'top-10 left-10 w-96 h-96',
  },
  amber: {
    className: 'bg-amber-200/30 dark:bg-amber-300/12',
    animate: { x: [0, -30, 0], y: [0, 30, 0] },
    transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
    position: 'top-20 right-20 w-[30rem] h-[30rem]',
  },
  purple: {
    className: 'bg-purple-200/35 dark:bg-purple-400/12',
    animate: { x: [0, 30, 0], y: [0, -20, 0] },
    transition: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
    position: 'top-10 right-10 w-96 h-96',
  },
  cyan: {
    className: 'bg-sky-200/35 dark:bg-cyan-400/12',
    animate: { x: [0, -30, 0], y: [0, 30, 0] },
    transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
    position: 'top-40 left-20 w-[30rem] h-[30rem]',
  },
};

export function KidsMagicalBackground({ variant = 'home' }) {
  const blobs = variant === 'library'
    ? [BLOB_VARIANTS.purple, BLOB_VARIANTS.cyan]
    : [BLOB_VARIANTS.sky, BLOB_VARIANTS.amber];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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

export function KidsPageShell({
  children,
  isRtl = false,
  variant = 'home',
  className = '',
  footer = null,
}) {
  return (
    <div
      className={`min-h-screen bg-background-kids text-foreground overflow-x-hidden font-sans ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <KidsMagicalBackground variant={variant} />
      {children}
      {footer}
    </div>
  );
}
