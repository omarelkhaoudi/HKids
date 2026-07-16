import { Link } from 'react-router-dom';
import { HomeIcon } from '../Icons';
import { Logo } from '../Logo';

export function KidsPageHeader({
  backTo = '/kids',
  onBack,
  showLogo = true,
  emoji,
  title,
  trailing = null,
  className = '',
}) {
  return (
    <header className={`relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 kids-premium-panel mx-4 sm:mx-6 mt-2 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="kids-touch-target grid h-14 w-14 place-items-center rounded-full bg-white dark:bg-surface-800 text-primary-500 shadow-md border-2 border-primary-100 shrink-0"
            aria-label="Back"
          >
            <HomeIcon className="h-7 w-7" />
          </button>
        ) : (
          <Link
            to={backTo}
            className="kids-touch-target grid h-14 w-14 place-items-center rounded-full bg-white dark:bg-surface-800 text-primary-500 shadow-md border-2 border-primary-100 shrink-0"
            aria-label="Back"
          >
            <HomeIcon className="h-7 w-7" />
          </Link>
        )}
        {showLogo && (
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105">
            <Logo size="default" showText={false} />
          </Link>
        )}
        {(emoji || title) && (
          <div className="min-w-0 flex items-center gap-2">
            {emoji && <span className="text-3xl" aria-hidden="true">{emoji}</span>}
            {title && <span className="font-black text-lg text-foreground truncate hidden sm:inline">{title}</span>}
          </div>
        )}
      </div>
      {trailing}
    </header>
  );
}

export default KidsPageHeader;
