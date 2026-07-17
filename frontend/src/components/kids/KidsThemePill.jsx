import { Chip } from '../ui/Chip';

/**
 * Kids theme filter pill — calm destination chip.
 */
export function KidsThemePill({ theme, isActive, onClick }) {
  return (
    <Chip
      selected={isActive}
      onClick={onClick}
      tone="primary"
      emoji={theme.pictogram}
      aria-label={theme.shortLabel || theme.label}
      className={`!min-h-touch-kids !text-sm !font-semibold ${
        isActive
          ? '!bg-primary-50 !text-primary-800 !border-primary-200 !shadow-soft'
          : '!bg-card/90 !border-border/50 !text-foreground-secondary'
      }`}
    >
      <span className="hidden sm:inline">{theme.shortLabel || theme.label}</span>
    </Chip>
  );
}

export default KidsThemePill;
