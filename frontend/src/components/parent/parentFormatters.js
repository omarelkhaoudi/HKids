export function formatParentDuration(seconds = 0) {
  const minutes = Math.floor(Number(seconds || 0) / 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export function formatParentDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatParentWeekday(value, locale) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale, { weekday: 'long' });
}
