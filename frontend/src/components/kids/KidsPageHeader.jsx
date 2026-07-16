import { Link } from 'react-router-dom';
import { HomeIcon } from '../Icons';
import { Logo } from '../Logo';

/**
 * Consistent kids page chrome — icon-first back, optional emoji title.
 */
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
    <header className={`relative z-10 kids-premium-panel mx-4 sm:mx-6 mt-2 px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button type="button" onClick={onBack} className="kids-icon-action" aria-label="Back">
            <HomeIcon />
          </button>
        ) : (
          <Link to={backTo} className="kids-icon-action" aria-label="Back">
            <HomeIcon />
          </Link>
        )}
        {showLogo && (
          <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            <Logo size="default" showText={false} />
          </Link>
        )}
        {(emoji || title) && (
          <div className="min-w-0 flex items-center gap-2">
            {emoji && <span className="text-3xl md:text-4xl leading-none" aria-hidden="true">{emoji}</span>}
            {title && (
              <span className="font-black text-base md:text-lg text-foreground truncate hidden sm:inline line-clamp-1">
                {title}
              </span>
            )}
          </div>
        )}
      </div>
      {trailing}
    </header>
  );
}

export default KidsPageHeader;
