/**
 * Circular progress ring for parent goals / analytics.
 */
export function ParentProgressRing({
  percent = 0,
  size = 112,
  stroke = 10,
  label = '',
  valueLabel = '',
  tone = 'primary',
}) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const strokeColor = tone === 'success'
    ? 'var(--color-success-500, #22c55e)'
    : tone === 'orange'
      ? 'var(--color-orange-500, #b99d88)'
      : 'var(--color-primary-500, #92B3A5)';

  return (
    <div className="parent-progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--color-border) 55%, transparent)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="parent-progress-ring-label">
        <strong>{valueLabel || `${Math.round(safe)}%`}</strong>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}

export default ParentProgressRing;
