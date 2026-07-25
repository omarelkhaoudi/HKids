import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { Button, Badge } from '../ui';
import { cdLabel } from '../../constants/contentDeliveryLabels';
import { formatBytes, formatEta, getJob, subscribeDownloadQueue } from '../../services/contentDelivery/downloadQueueService';
import {
  categorizeHistory,
  getLocalCatalogState,
  getUpdateHistory,
  rollbackLocalCatalog,
} from '../../services/contentDelivery/catalogDeliveryService';
import {
  cancelPackDownload,
  downloadContentPack,
  listAvailablePacks,
  listDownloadedPacks,
  packDownloadId,
  pausePackDownload,
  redownloadPack,
  removePack,
  resumePackDownload,
} from '../../services/contentDelivery/contentPackDownloadService';
import {
  clearAllOfflineCache,
  getStorageStats,
  optimizeStorage,
} from '../../services/contentDelivery/storageStatsService';

function HistoryList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h5 className="text-caption font-black text-foreground-muted mb-2">{title}</h5>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map((entry) => (
          <li key={entry.id} className="rounded-xl bg-surface-secondary/70 px-3 py-2 text-caption font-bold">
            {entry.summary}
            {entry.version ? <span className="text-foreground-muted"> · v{entry.version}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ParentContentDeliveryPanel({ language: languageProp }) {
  const { language: ctxLang } = useLanguage();
  const language = languageProp || ctxLang;
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [packs, setPacks] = useState([]);
  const [downloaded, setDownloaded] = useState([]);
  const [history, setHistory] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [queueTick, setQueueTick] = useState(0);
  const [busy, setBusy] = useState('');

  const refresh = useCallback(async () => {
    const [nextStats, available, localPacks, hist, local] = await Promise.all([
      getStorageStats(),
      listAvailablePacks(),
      listDownloadedPacks(),
      getUpdateHistory({ limit: 50 }),
      getLocalCatalogState(),
    ]);
    setStats(nextStats);
    setPacks(available);
    setDownloaded(localPacks);
    setHistory(hist);
    setCatalog(local);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    return subscribeDownloadQueue(() => setQueueTick((n) => n + 1));
  }, [refresh]);

  useEffect(() => {
    if (queueTick > 0) refresh().catch(() => {});
  }, [queueTick, refresh]);

  const downloadedMap = Object.fromEntries(downloaded.map((p) => [p.sourceId, p]));
  const groups = categorizeHistory(history);

  const run = async (key, fn, successKey) => {
    try {
      setBusy(key);
      await fn();
      await refresh();
      if (successKey) showToast(cdLabel(successKey, language), 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(error?.message || cdLabel('cdFailed', language), 'error');
      }
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="space-y-space-24" aria-label={cdLabel('cdStorageTitle', language)}>
      <header className="parent-panel p-space-24">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="secondary" className="mb-2 font-bold">
              {cdLabel('cdCatalogVersion', language)} {catalog?.active?.version ? `v${catalog.active.version}` : '—'}
            </Badge>
            <h3 className="text-heading-l font-black">{cdLabel('cdStorageTitle', language)}</h3>
            <p className="text-body text-foreground-secondary mt-1">
              {cdLabel('cdLastSync', language)}: {stats?.lastSync ? new Date(stats.lastSync).toLocaleString() : '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(busy)}
              onClick={() => run('optimize', () => optimizeStorage(), 'cdApplied')}
            >
              {cdLabel('cdOptimize', language)}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={Boolean(busy)}
              onClick={() => run('clear', () => clearAllOfflineCache(), 'cdApplied')}
            >
              {cdLabel('cdClearCache', language)}
            </Button>
            {catalog?.previous && (
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => run('rollback', () => rollbackLocalCatalog(), 'cdRolledBack')}
              >
                {cdLabel('cdRollback', language)}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-secondary/80 p-3">
            <p className="text-caption text-foreground-muted font-bold">{cdLabel('cdDownloadedSize', language)}</p>
            <p className="text-heading-m font-black">{stats?.downloadedBytesLabel || '—'}</p>
          </div>
          <div className="rounded-2xl bg-surface-secondary/80 p-3">
            <p className="text-caption text-foreground-muted font-bold">{cdLabel('cdAvailableStorage', language)}</p>
            <p className="text-heading-m font-black">{stats?.availableBytesLabel || '—'}</p>
          </div>
        </div>
      </header>

      <div>
        <h4 className="text-heading-m font-black mb-3">{cdLabel('cdPacksTitle', language)}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {packs.map((pack) => {
            const local = downloadedMap[pack.id];
            const job = getJob(packDownloadId(pack.id));
            const status = job?.status || local?.status;
            const progress = job?.progress ?? local?.progress ?? 0;
            return (
              <article key={pack.id} className="parent-panel p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-2xl" aria-hidden="true">{pack.emoji || '📦'}</p>
                    <h5 className="font-black capitalize">{pack.id}</h5>
                    <p className="text-caption text-foreground-muted font-bold">
                      {formatBytes(pack.estimated_bytes || 0)}
                    </p>
                  </div>
                  {status && <Badge variant="soft" className="font-bold">{status}</Badge>}
                </div>
                {(status === 'downloading' || status === 'paused') && (
                  <div className="mb-3">
                    <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <div className="h-full bg-primary-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-caption mt-1 font-bold">
                      {cdLabel('cdProgress', language, { percent: progress })}
                      {job?.etaSeconds != null ? ` · ${cdLabel('cdEta', language, { eta: formatEta(job.etaSeconds) })}` : ''}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {status === 'downloading' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => pausePackDownload(pack.id)}>{cdLabel('cdPause', language)}</Button>
                      <Button size="sm" variant="ghost" onClick={() => cancelPackDownload(pack.id).then(refresh)}>{cdLabel('cdCancel', language)}</Button>
                    </>
                  )}
                  {status === 'paused' && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy === pack.id}
                      onClick={() => run(pack.id, () => resumePackDownload(pack))}
                    >
                      {cdLabel('cdResume', language)}
                    </Button>
                  )}
                  {status === 'downloaded' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => run(`re-${pack.id}`, () => redownloadPack(pack))}>
                        {cdLabel('cdRedownload', language)}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => run(`rm-${pack.id}`, () => removePack(pack.id))}>
                        {cdLabel('cdRemovePack', language)}
                      </Button>
                    </>
                  )}
                  {!status || status === 'failed' || status === 'cancelled' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy === pack.id}
                      onClick={() => run(pack.id, () => downloadContentPack(pack))}
                    >
                      {cdLabel('cdDownloadPack', language)}
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
          {!packs.length && (
            <p className="text-caption text-foreground-muted font-bold col-span-full">{cdLabel('cdNoHistory', language)}</p>
          )}
        </div>
      </div>

      <div className="parent-panel p-space-20 space-y-4">
        <h4 className="text-heading-m font-black">{cdLabel('cdHistoryTitle', language)}</h4>
        {!history.length ? (
          <p className="text-caption text-foreground-muted font-bold">{cdLabel('cdNoHistory', language)}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HistoryList title={cdLabel('cdRecentlyAdded', language)} items={groups.added} />
            <HistoryList title={cdLabel('cdUpdatedStories', language)} items={groups.updated} />
            <HistoryList title={cdLabel('cdRemovedStories', language)} items={groups.removed} />
            <HistoryList title={cdLabel('cdNewQuizzes', language)} items={groups.quizzes} />
            <HistoryList title={cdLabel('cdNewGames', language)} items={groups.games} />
            <HistoryList title={cdLabel('cdNewWorlds', language)} items={groups.worlds} />
          </div>
        )}
      </div>
    </section>
  );
}

export default ParentContentDeliveryPanel;
