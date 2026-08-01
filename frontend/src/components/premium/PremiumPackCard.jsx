import { motion } from 'framer-motion';
import { premLabel, packDisplayTitle, packDisplayDesc, packIncludesLabels } from '../../constants/premiumLabels';
import { getHoverMotion } from '../../constants/kidsMotion';

export function PremiumRibbon({ language = 'fr', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-hkids-brown to-hkids-brown px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-normal text-white shadow-soft ${className}`}>
      ✨ {premLabel('premRibbon', language)}
    </span>
  );
}

export function PremiumPackCard({
  pack,
  language = 'fr',
  locked = true,
  onUnlock,
  onOpen,
  onPreview,
  reducedMotion = false,
  compact = false,
}) {
  if (!pack) return null;
  const includes = packIncludesLabels(pack, language);

  return (
    <motion.article
      {...getHoverMotion(reducedMotion)}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${pack.gradient || 'from-primary-400 to-primary-600'} text-white shadow-card ${compact ? 'min-h-[10rem] p-4' : 'min-h-[14rem] p-5'}`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-4xl" aria-hidden="true">{pack.emoji || '⭐'}</span>
          <PremiumRibbon language={language} />
        </div>
        <h3 className="text-heading-m font-black leading-tight">{packDisplayTitle(pack, language)}</h3>
        {!compact && (
          <p className="text-caption mt-2 opacity-90 line-clamp-2">{packDisplayDesc(pack, language)}</p>
        )}
        {includes.length > 0 && !compact && (
          <p className="text-caption mt-2 opacity-80">
            {premLabel('premIncludes', language)}: {includes.slice(0, 3).join(' · ')}
          </p>
        )}
        <div className="mt-auto pt-4 flex flex-wrap gap-2">
          {locked ? (
            <>
              <button
                type="button"
                onClick={onUnlock}
                className="min-h-[44px] rounded-full bg-white text-foreground px-4 font-black text-caption"
              >
                🔒 {premLabel('premUnlock', language)}
              </button>
              {onPreview && (
                <button
                  type="button"
                  onClick={onPreview}
                  className="min-h-[44px] rounded-full bg-white/20 border border-white/40 px-4 font-bold text-caption"
                >
                  {premLabel('premPreview', language)}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="min-h-[44px] rounded-full bg-white text-foreground px-4 font-black text-caption"
            >
              {premLabel('premOpen', language)}
            </button>
          )}
        </div>
      </div>
      {locked && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />
      )}
    </motion.article>
  );
}

export default PremiumPackCard;
