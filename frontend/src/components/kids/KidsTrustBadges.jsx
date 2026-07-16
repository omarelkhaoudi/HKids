import { memo } from 'react';

const DEFAULT_BADGES = [
  { id: 'safe', emoji: '🛡️', labelKey: 'trustSafe' },
  { id: 'noAds', emoji: '🚫', labelKey: 'trustNoAds' },
  { id: 'edu', emoji: '📚', labelKey: 'trustEducational' },
  { id: 'offline', emoji: '📴', labelKey: 'trustOffline' },
  { id: 'parent', emoji: '👨‍👩‍👧', labelKey: 'trustParentApproved' },
];

/**
 * Decorative parent-trust indicators only — no business logic.
 */
export const KidsTrustBadges = memo(function KidsTrustBadges({
  t,
  badges = DEFAULT_BADGES,
  className = '',
  compact = false,
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
      role="list"
      aria-label={t?.('trustStripLabel') || 'Trust'}
    >
      {badges.map((badge) => (
        <span
          key={badge.id}
          role="listitem"
          className={`inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/70 backdrop-blur-sm shadow-sm text-foreground font-bold ${
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
          }`}
          title={t?.(badge.labelKey) || badge.id}
        >
          <span aria-hidden="true">{badge.emoji}</span>
          {!compact && <span className="line-clamp-1">{t?.(badge.labelKey) || badge.id}</span>}
        </span>
      ))}
    </div>
  );
});

export default KidsTrustBadges;
