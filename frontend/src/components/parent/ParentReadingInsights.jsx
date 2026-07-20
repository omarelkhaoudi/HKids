import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  getHoverMotion,
  getMotionProps,
  kidsCardAppear,
  kidsStaggerContainer,
} from '../../constants/kidsMotion';
import { buildParentInsights } from '../../utils/parentInsights';

const TONE_CLASS = {
  warm: 'parent-insight-card--warm',
  night: 'parent-insight-card--night',
  success: 'parent-insight-card--success',
  soft: 'parent-insight-card--soft',
  discover: 'parent-insight-card--discover',
  orange: 'parent-insight-card--orange',
};

function resolveTimeLabel(timeKey, t) {
  const map = {
    morning: t('parentInsightTimeMorning'),
    afternoon: t('parentInsightTimeAfternoon'),
    evening: t('parentInsightTimeEvening'),
    night: t('parentInsightTimeNight'),
  };
  return map[timeKey] || timeKey;
}

export function ParentReadingInsights({ data, kidName, t, language = 'fr' }) {
  const reducedMotion = useReducedMotion();
  const insights = buildParentInsights(data, kidName);

  return (
    <section className="parent-section" aria-labelledby="parent-insights-heading">
      <header className="mb-space-24">
        <h2 id="parent-insights-heading" className="text-heading-xl font-black text-foreground">
          {t('parentInsightsTitle')}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">
          {t('parentInsightsSubtitle', { name: kidName || t('parentChild') })}
        </p>
      </header>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-space-16"
        {...(reducedMotion ? {} : kidsStaggerContainer)}
      >
        {insights.map((insight, index) => {
          const params = { ...insight.params };
          if (params.time) params.time = resolveTimeLabel(params.time, t);
          return (
            <motion.article
              key={insight.id}
              {...getMotionProps(reducedMotion, {
                ...kidsCardAppear,
                transition: { ...kidsCardAppear.transition, delay: index * 0.05 },
              })}
              {...getHoverMotion(reducedMotion)}
              className={`parent-insight-card ${TONE_CLASS[insight.tone] || TONE_CLASS.warm}`}
            >
              <span className="parent-insight-emoji" aria-hidden="true">{insight.emoji}</span>
              <p className="parent-insight-message">{t(insight.messageKey, params)}</p>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

export default ParentReadingInsights;
