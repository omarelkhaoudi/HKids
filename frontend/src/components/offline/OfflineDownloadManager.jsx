import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Button, Badge } from '../ui';
import { cdLabel } from '../../constants/contentDeliveryLabels';
import {
  cancelJob,
  formatEta,
  getQueueSnapshot,
  pauseJob,
  subscribeDownloadQueue,
} from '../../services/contentDelivery/downloadQueueService';
import { drainQueue, resumeBookJob } from '../../services/contentDelivery/smartDownloadService';

/**
 * Compact global download manager — shows active/queued jobs with pause/cancel.
 */
export function OfflineDownloadManager({ compact = false, className = '' }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { online } = useNetworkStatus();
  const [queue, setQueue] = useState(() => getQueueSnapshot());

  useEffect(() => subscribeDownloadQueue(setQueue), []);

  const visibleJobs = useMemo(() => {
    const ordered = queue.ordered || Object.entries(queue.jobs || {}).map(([id, job]) => ({ id, ...job }));
    return ordered.filter((job) =>
      ['queued', 'downloading', 'paused', 'failed'].includes(job.status),
    );
  }, [queue]);

  if (!user || visibleJobs.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-sm ${compact ? 'p-3' : 'p-4'} ${className}`}
      aria-label={cdLabel('cdDownloadManager', language)}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black">{cdLabel('cdDownloadManager', language)}</h3>
          {!online && (
            <Badge variant="soft" className="font-bold text-[10px]">
              {cdLabel('cdOfflineIndicator', language)}
            </Badge>
          )}
        </div>
        <div className="flex gap-1 text-[10px] font-bold text-foreground-muted">
          {queue.activeCount > 0 && <span>{queue.activeCount}↓</span>}
          {queue.queuedCount > 0 && <span>{queue.queuedCount}⏳</span>}
          {queue.pausedCount > 0 && <span>{queue.pausedCount}⏸</span>}
        </div>
      </div>

      <ul className="space-y-2 max-h-56 overflow-y-auto pe-1">
        {visibleJobs.slice(0, compact ? 4 : 12).map((job) => (
          <li key={job.id} className="rounded-xl bg-surface-secondary/70 px-3 py-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-caption font-black truncate">{job.label || job.id}</p>
              <Badge variant="soft" className="shrink-0 font-bold text-[10px] uppercase">
                {job.status}
              </Badge>
            </div>
            {(job.status === 'downloading' || job.status === 'paused' || job.status === 'queued') && (
              <div
                className="h-1.5 rounded-full bg-surface-200 overflow-hidden mb-2"
                role="progressbar"
                aria-valuenow={job.progress || 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${Math.max(2, job.progress || 0)}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-foreground-muted">
                {job.status === 'downloading'
                  ? cdLabel('cdEta', language, { eta: formatEta(job.etaSeconds) })
                  : job.reason
                    ? cdLabel('cdPriority', language, { priority: job.reason })
                    : null}
              </span>
              <div className="flex gap-1">
                {job.status === 'downloading' && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-bold" onClick={() => pauseJob(job.id)}>
                    {cdLabel('cdPause', language)}
                  </Button>
                )}
                {job.status === 'paused' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px] font-bold"
                    onClick={() => {
                      resumeBookJob(job.id).catch(() => drainQueue().catch(() => {}));
                    }}
                  >
                    {cdLabel('cdResume', language)}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] font-bold text-rose-600"
                  onClick={() => cancelJob(job.id)}
                >
                  {cdLabel('cdCancel', language)}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
