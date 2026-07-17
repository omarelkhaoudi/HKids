import { motion } from 'framer-motion';
import {
  AudioIcon, BookIcon, BrainIcon, HeartIcon, SparklesIcon,
} from '../Icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionProps, kidsCardAppear } from '../../constants/kidsMotion';
import { formatParentWeekday } from './parentFormatters';
import { ParentEmptyState } from './ParentEmptyState';

const EVENT_META = {
  reading: { icon: BookIcon, emoji: '📖', tone: 'primary' },
  favorite: { icon: HeartIcon, emoji: '💛', tone: 'orange' },
  quiz: { icon: BrainIcon, emoji: '✨', tone: 'magic' },
  listen: { icon: AudioIcon, emoji: '🎧', tone: 'secondary' },
  story: { icon: SparklesIcon, emoji: '🪄', tone: 'magic' },
};

function eventLabel(event, t) {
  if (event.type === 'quiz') return t('parentJourneyQuiz', { title: event.title });
  if (event.type === 'favorite') return t('parentJourneyFavorite', { title: event.title });
  if (event.type === 'listen') return t('parentJourneyListen', { title: event.title });
  if (event.type === 'story') return t('parentJourneyStory', { title: event.title });
  return t('parentJourneyRead', { title: event.title });
}

function groupTimelineByDay(items, locale) {
  const groups = [];
  const seen = new Map();

  items.forEach((item) => {
    const dayKey = new Date(item.occurred_at).toDateString();
    if (!seen.has(dayKey)) {
      seen.set(dayKey, { day: item.occurred_at, items: [] });
      groups.push(seen.get(dayKey));
    }
    seen.get(dayKey).items.push(item);
  });

  return groups.slice(0, 7).map((group) => ({
    ...group,
    label: formatParentWeekday(group.day, locale),
  }));
}

function JourneyDay({ day, items, t, locale, index }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.li
      {...getMotionProps(reducedMotion, {
        ...kidsCardAppear,
        transition: { ...kidsCardAppear.transition, delay: index * 0.06 },
      })}
      className="parent-journey-day relative ps-space-32"
    >
      <span className="parent-journey-dot" aria-hidden="true" />
      <div className="parent-journey-card rounded-32 shadow-card bg-card p-space-24 border border-border/50">
        <p className="text-heading-m font-black text-foreground mb-space-16">{day.label}</p>
        <ul className="space-y-space-16">
          {items.map((event, eventIndex) => {
            const meta = EVENT_META[event.type] || EVENT_META.reading;
            const Icon = meta.icon;
            return (
              <li key={`${event.type}-${event.occurred_at}-${eventIndex}`} className="flex items-start gap-space-16">
                <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-surface-secondary shrink-0 text-xl" aria-hidden="true">
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-body-lg font-bold text-foreground leading-snug">{eventLabel(event, t)}</p>
                  <p className="text-caption text-foreground-muted mt-1 flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {new Date(event.occurred_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.li>
  );
}

export function ParentReadingJourney({ data, t, language = 'fr' }) {
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';
  const timeline = data?.timeline?.items || [];
  const history = data?.history?.items || [];

  const merged = [
    ...timeline,
    ...history.slice(0, 3).map((item) => ({
      type: 'reading',
      title: item.title,
      occurred_at: item.last_opened_at,
    })),
  ].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

  const days = groupTimelineByDay(merged, locale);

  return (
    <section className="parent-section" aria-labelledby="parent-journey-heading">
      <header className="mb-space-24">
        <h2 id="parent-journey-heading" className="text-heading-xl font-black text-foreground">
          {t('parentJourneyTitle')}
        </h2>
        <p className="text-body-lg text-foreground-secondary font-medium mt-1">{t('parentJourneySubtitle')}</p>
      </header>

      {days.length === 0 ? (
        <ParentEmptyState
          emoji="🌱"
          title={t('parentJourneyEmptyTitle')}
          description={t('parentJourneyEmptyDesc')}
          compact
        />
      ) : (
        <ol className="parent-journey-list space-y-space-24 list-none m-0 p-0">
          {days.map((day, index) => (
            <JourneyDay
              key={day.label + day.day}
              day={day}
              items={day.items}
              t={t}
              locale={locale}
              index={index}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

export default ParentReadingJourney;
