import { Navbar } from '../ui/Navbar';
import { Logo } from '../Logo';
import { Link } from 'react-router-dom';

/**
 * Consistent kids page chrome — wraps shared Navbar with HKids branding.
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
    <div className={`kids-premium-panel mx-16 sm:mx-24 mt-8 ${className}`}>
      <Navbar
        backTo={onBack ? undefined : backTo}
        onBack={onBack}
        emoji={emoji}
        title={title}
        trailing={trailing}
        brand={
          showLogo ? (
            <Link to="/kids" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
              <Logo size="default" showText={false} />
            </Link>
          ) : null
        }
      />
    </div>
  );
}

export default KidsPageHeader;
