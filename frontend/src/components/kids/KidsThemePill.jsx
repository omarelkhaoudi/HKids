import { Chip } from '../ui/Chip';

/**
 * Kids theme filter pill — elegant, calm selection.
 */
export function KidsThemePill({ theme, isActive, onClick }) {
  return (
    <Chip
      selected={isActive}
      onClick={onClick}
      tone="primary"
      emoji={theme.pictogram}
      aria-label={theme.shortLabel || theme.label}
      className={`!min-h-touch-kids !text-base !font-bold ${
        isActive
          ? '!bg-primary-50 !text-primary-800 !border-primary-300 !shadow-soft ring-2 ring-primary-200/60'
          : '!bg-card !border-border/70'
      }`}
    >
      <span className="hidden md:inline">{theme.shortLabel || theme.label}</span>
    </Chip>
  );
}

export default KidsThemePill;
