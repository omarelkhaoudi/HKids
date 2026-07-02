export function AdminMetricCard({ label, value, detail, icon: Icon, tone = 'bg-red-50 text-red-600' }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white/90 p-5 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-neutral-900">{value}</p>
          {detail && <p className="mt-1 text-sm font-medium text-neutral-500">{detail}</p>}
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

export function formatAdminDuration(seconds = 0) {
  const totalMinutes = Math.floor(Number(seconds || 0) / 60);
  if (totalMinutes < 1) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
}

export function formatAdminDate(value) {
  if (!value) return 'Jamais';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
