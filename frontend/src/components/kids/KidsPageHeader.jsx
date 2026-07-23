import { Navbar } from '../ui/Navbar';
import { Logo } from '../Logo';
import { Link } from 'react-router-dom';
import { playKidsUiSound } from '../../utils/kidsUiSound';
import { KIDS_PICTOGRAMS } from '../../utils/kidsGuidePhrases';

/**
 * Consistent kids page chrome — pictogram-first for non-readers.
 */
export function KidsPageHeader({
  backTo = '/kids',
  onBack,
  showLogo = true,
  emoji,
  title,
  trailing = null,
  className = '',
  pictogramMode = true,
}) {
  const resolvedEmoji = emoji || KIDS_PICTOGRAMS.library;

  return (
    <div className={`kids-premium-panel mx-space-16 sm:mx-space-24 mt-space-8 ${className}`}>
      <Navbar
        backTo={onBack ? undefined : backTo}
        onBack={onBack ? () => {
          playKidsUiSound('tap');
          onBack();
        } : undefined}
        emoji={resolvedEmoji}
        title={pictogramMode ? undefined : title}
        trailing={trailing}
        brand={
          showLogo ? (
            <Link
              to="/kids"
              className="shrink-0 transition-transform hover:scale-105 active:scale-95"
              onClick={() => playKidsUiSound('tap')}
              aria-label="HKids"
            >
              <Logo size="default" showText={false} />
            </Link>
          ) : null
        }
      />
      {pictogramMode && title ? <span className="sr-only">{title}</span> : null}
    </div>
  );
}

export default KidsPageHeader;
