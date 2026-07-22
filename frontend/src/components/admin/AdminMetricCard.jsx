export function AdminMetricCard({label, value, detail, icon: Icon, tone = 'bg-primary-50 text-foreground-600'}) {
 return (
 <div className="rounded-2xl border border-primary-100 bg-card/90 p-5 shadow-lg backdrop-blur">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">{label}</p>
 <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
 {detail && <p className="mt-1 text-sm font-medium text-foreground-muted">{detail}</p>}
 </div>
 {Icon && (
 <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
 <Icon className="h-6 w-6" />
 </span>
 )}
 </div>
 </div>
 );
}

export function formatAdminDuration(seconds = 0, t = (k) => k) {
 const totalMinutes = Math.floor(Number(seconds || 0) / 60);
 if (totalMinutes < 1) return t('adminMetricMinutes').replace('{m}', '0');
 const hours = Math.floor(totalMinutes / 60);
 const minutes = totalMinutes % 60;
 return hours > 0 ? t('adminMetricHoursMinutes').replace('{h}', String(hours)).replace('{m}', String(minutes)) : t('adminMetricMinutes').replace('{m}', String(minutes));
}

export function formatAdminDate(value, t = (k) => k, locale = 'fr-FR') {
 if (!value) return t('adminMetricNever');
 return new Date(value).toLocaleDateString(locale, {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
});
}

export function getAdminDateLocale(language) {
 if (language === 'ar') return 'ar';
 if (language === 'en') return 'en-US';
 return 'fr-FR';
}
