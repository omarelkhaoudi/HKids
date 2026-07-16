import { Chip } from '../ui/Chip';

/**
 * Kids theme filter pill — Chip with large emoji affordance.
 */
export function KidsThemePill({ theme, isActive, onClick }) {
  return (
    <Chip
      selected={isActive}
      onClick={onClick}
      tone="primary"
      emoji={theme.pictogram}
      aria-label={theme.shortLabel || theme.label}
      className={`!min-h-touch-kids !text-lg ${
        isActive && theme.gradient
          ? `!bg-gradient-to-r ${theme.gradient} !text-white !border-white/60`
          : ''
      }`}
    >
      <span className="hidden md:inline font-black">{theme.shortLabel || theme.label}</span>
    </Chip>
  );
}

export default KidsThemePill;
