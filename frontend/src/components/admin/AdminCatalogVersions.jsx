import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { Button, Badge, Input } from '../ui';
import { adminAPI } from '../../api/admin';
import { cdLabel } from '../../constants/contentDeliveryLabels';
import { formatBytes } from '../../services/contentDelivery/downloadQueueService';

function statusLabel(status, language) {
  const map = {
    draft: 'cdStatusDraft',
    published: 'cdStatusPublished',
    scheduled: 'cdStatusScheduled',
    archived: 'cdStatusArchived',
  };
  return cdLabel(map[status] || 'cdStatusDraft', language);
}

export function AdminCatalogVersions() {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [data, setData] = useState({ versions: [], currentVersionId: null, packs: [] });
  const [changelog, setChangelog] = useState('');
  const [bump, setBump] = useState('patch');
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const response = await adminAPI.getCatalogVersions();
    setData(response.data || { versions: [], currentVersionId: null, packs: [] });
  };

  useEffect(() => {
    refresh().catch((error) => {
      showToast(error.response?.data?.error || 'Failed to load catalog versions', 'error');
    });
  }, []);

  const run = async (fn) => {
    try {
      setBusy(true);
      await fn();
      await refresh();
      showToast('OK', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || error.message || 'Error', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">{cdLabel('cdAdminTitle', language)}</h1>
        <p className="text-foreground-muted font-medium mt-1">{cdLabel('cdAdminSubtitle', language)}</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-heading-m font-black">{cdLabel('cdCreateVersion', language)}</h2>
        <div className="flex flex-wrap gap-2">
          {['patch', 'minor', 'major'].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={bump === value ? 'primary' : 'secondary'}
              onClick={() => setBump(value)}
            >
              {cdLabel(value === 'patch' ? 'cdBumpPatch' : value === 'minor' ? 'cdBumpMinor' : 'cdBumpMajor', language)}
            </Button>
          ))}
        </div>
        <Input
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          placeholder={cdLabel('cdChangelogHint', language)}
        />
        <Input
          type="datetime-local"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
        />
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => run(async () => {
            await adminAPI.createCatalogVersion({
              bump,
              changelog: changelog.trim()
                ? [{ type: 'added', category: 'stories', summary: changelog.trim() }]
                : [{ type: 'updated', category: 'stories', summary: `Catalog ${bump} bump` }],
              scheduled_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
            });
            setChangelog('');
            setScheduleAt('');
          })}
        >
          {cdLabel('cdCreateVersion', language)}
        </Button>
        <Button
          variant="outline"
          disabled={busy || !data.previousVersionId}
          onClick={() => run(() => adminAPI.rollbackCatalogVersion())}
        >
          {cdLabel('cdRollback', language)}
        </Button>
      </section>

      <section className="space-y-3">
        {(data.versions || []).map((version) => {
          const isCurrent = version.id === data.currentVersionId;
          return (
            <article key={version.id} className="rounded-3xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-black text-lg">v{version.version}</h3>
                  <Badge variant="soft">{statusLabel(version.status, language)}</Badge>
                  {isCurrent && <Badge variant="secondary">{cdLabel('cdCurrent', language)}</Badge>}
                  {version.featured && <Badge variant="soft" className="bg-amber-100 text-amber-800">{cdLabel('cdFeature', language)}</Badge>}
                </div>
                <p className="text-caption text-foreground-muted">
                  {cdLabel('cdPackageSize', language)}: {formatBytes(version.packageBytes || 0)}
                  {version.publishedAt ? ` · ${new Date(version.publishedAt).toLocaleString()}` : ''}
                  {version.scheduledAt ? ` · ${cdLabel('cdSchedule', language)} ${new Date(version.scheduledAt).toLocaleString()}` : ''}
                </p>
                <p className="text-caption mt-1 line-clamp-2">
                  {(version.changelog || []).map((c) => c.summary).join(' · ') || '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy || isCurrent} onClick={() => run(() => adminAPI.publishCatalogVersion(version.id))}>
                  {cdLabel('cdPublish', language)}
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => adminAPI.featureCatalogVersion(version.id, true))}>
                  {cdLabel('cdFeature', language)}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    const when = window.prompt('ISO datetime (or leave blank for +1h)');
                    const scheduled = when || new Date(Date.now() + 3600_000).toISOString();
                    return run(() => adminAPI.scheduleCatalogVersion(version.id, scheduled));
                  }}
                >
                  {cdLabel('cdSchedule', language)}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy || isCurrent} onClick={() => run(() => adminAPI.archiveCatalogVersion(version.id))}>
                  {cdLabel('cdArchive', language)}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default AdminCatalogVersions;
