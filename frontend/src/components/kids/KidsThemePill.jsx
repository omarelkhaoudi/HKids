/**
 * Elegant glass theme filter for the kids library.
 * Soft selected state — no emoji game pills.
 */
export function KidsThemePill({ theme, isActive, onClick }) {
  const label = theme.shortLabel || theme.label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={label}
      className={`kids-library-filter-pill kids-touch-target ${isActive ? 'is-active' : ''}`}
    >
      <span>{label}</span>
    </button>
  );
}

export default KidsThemePill;
