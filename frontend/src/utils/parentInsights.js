import { deriveBookTheme } from './bookCover';
import { CONTENT_THEMES } from '../constants/contentOptions';

/**
 * Narrative parent insights from existing dashboard payload.
 * Frontend-only — no API changes.
 */

function toDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function getTodayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function getTodayReadingSeconds(data, now = new Date()) {
  const today = getTodayKey(now);
  const days = data?.daily_activity || [];
  const match = days.find((row) => toDateKey(row.day || row.date) === today);
  if (match) return Number(match.reading_seconds || 0);
  return 0;
}

export function getThemeLabel(themeId) {
  const theme = CONTENT_THEMES.find((item) => item.id === themeId);
  if (!theme) return themeId;
  return theme.libraryLabel || theme.label || themeId;
}

export function collectFavoriteThemes(data = {}, limit = 4) {
  const books = [
    ...(data?.favorites?.items || []),
    ...(data?.progress?.items || []),
    ...(data?.history?.items || []),
  ];
  const counts = new Map();
  books.forEach((book) => {
    const fromMeta = Array.isArray(book.themes) ? book.themes : [];
    const derived = deriveBookTheme(book);
    const ids = fromMeta.length > 0 ? fromMeta : (derived ? [derived] : []);
    ids.forEach((id) => {
      if (!id) return;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

function favoriteReadingHourBucket(data = {}) {
  const events = [
    ...(data?.timeline?.items || []),
    ...(data?.history?.items || []),
  ];
  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  events.forEach((event) => {
    const stamp = event.created_at || event.last_read_at || event.favorited_at;
    if (!stamp) return;
    const hour = new Date(stamp).getHours();
    if (hour >= 5 && hour < 12) buckets.morning += 1;
    else if (hour >= 12 && hour < 17) buckets.afternoon += 1;
    else if (hour >= 17 && hour < 21) buckets.evening += 1;
    else buckets.night += 1;
  });
  const ranked = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  if (!ranked[0] || ranked[0][1] === 0) return null;
  return ranked[0][0];
}

/**
 * Build calm narrative insight cards for the parent home.
 * Returns translation key + params + tone for each insight.
 */
export function buildParentInsights(data = {}, kidName = '') {
  const name = kidName || '…';
  const summary = data?.summary || {};
  const themes = collectFavoriteThemes(data, 3);
  const topTheme = themes[0];
  const completed = Number(summary.books_completed || 0);
  const streak = Number(summary.reading_streak_days || 0);
  const timeBucket = favoriteReadingHourBucket(data);
  const insights = [];

  if (topTheme) {
    insights.push({
      id: 'loves-theme',
      tone: 'warm',
      emoji: '🌿',
      messageKey: 'parentInsightLovesTheme',
      params: { name, theme: getThemeLabel(topTheme.id) },
    });
  }

  if (completed > 0) {
    const bedtimeCount = (data?.progress?.items || [])
      .filter((book) => book.completed && deriveBookTheme(book) === 'bedtime')
      .length;
    if (bedtimeCount > 0) {
      insights.push({
        id: 'bedtime',
        tone: 'night',
        emoji: '🌙',
        messageKey: 'parentInsightBedtimeBooks',
        params: { name, count: bedtimeCount },
      });
    } else {
      insights.push({
        id: 'completed',
        tone: 'success',
        emoji: '📖',
        messageKey: 'parentInsightBooksCompleted',
        params: { name, count: completed },
      });
    }
  }

  if (timeBucket) {
    insights.push({
      id: 'time-of-day',
      tone: 'soft',
      emoji: timeBucket === 'evening' || timeBucket === 'night' ? '✨' : '☀️',
      messageKey: 'parentInsightFavoriteTime',
      params: { name, time: timeBucket },
    });
  }

  if (themes[1]) {
    insights.push({
      id: 'discovering',
      tone: 'discover',
      emoji: '🚀',
      messageKey: 'parentInsightDiscovering',
      params: { name, theme: getThemeLabel(themes[1].id) },
    });
  }

  if (streak >= 2) {
    insights.push({
      id: 'streak',
      tone: 'orange',
      emoji: '💛',
      messageKey: 'parentInsightStreak',
      params: { name, days: streak },
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'encourage',
      tone: 'warm',
      emoji: '🌱',
      messageKey: 'parentInsightEncourage',
      params: { name },
    });
  }

  return insights.slice(0, 4);
}

export function buildWeeklyProgress(data = {}, days = 7) {
  const rows = [...(data?.daily_activity || [])]
    .map((row) => ({
      day: toDateKey(row.day || row.date),
      readingSeconds: Number(row.reading_seconds || 0),
      screenSeconds: Number(row.screen_seconds || 0),
      quizSeconds: Number(row.quiz_seconds || 0),
    }))
    .filter((row) => row.day)
    .sort((a, b) => a.day.localeCompare(b.day));

  const sliced = rows.slice(-Math.max(1, days));
  const maxReading = Math.max(1, ...sliced.map((row) => row.readingSeconds));
  const totalReading = sliced.reduce((sum, row) => sum + row.readingSeconds, 0);
  const totalListening = totalReading; // listening tracked via reading sessions in current payload
  const booksCompleted = Number(data?.summary?.books_completed || 0);

  return {
    days: sliced.map((row) => ({
      ...row,
      heightPercent: Math.round((row.readingSeconds / maxReading) * 100),
    })),
    totalReadingSeconds: totalReading,
    totalListeningSeconds: totalListening,
    booksCompleted,
    maxReadingSeconds: maxReading,
  };
}

export function buildMonthlyReadingSeconds(data = {}) {
  const rows = data?.daily_activity || [];
  // Period endpoint is typically 7 days; use available window as monthly proxy when longer.
  return rows.reduce((sum, row) => sum + Number(row.reading_seconds || 0), 0);
}

export default buildParentInsights;
