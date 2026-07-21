/**
 * Elegant glass theme filter for the kids library.
 * Pictogram + label for visual discovery without reading.
 */
export function KidsThemePill({ theme, isActive, onClick }) {
  const label = theme.shortLabel || theme.label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={label}
      className={`kids-library-filter-pill kids-touch-target touch-manipulation ${isActive ? 'is-active' : ''}`}
    >
      {theme.pictogram ? (
        <span className="kids-library-filter-pictogram" aria-hidden="true">
          {theme.pictogram}
        </span>
      ) : null}
      <span>{label}</span>
    </button>
  );
}

export default KidsThemePill;
