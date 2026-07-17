import { Skeleton } from '../ui';
import { ParentTodaySummary } from './ParentTodaySummary';
import { ParentReadingJourney } from './ParentReadingJourney';
import { ParentLibraryRails } from './ParentLibraryRails';
import { ParentEmptyState } from './ParentEmptyState';

export function ParentDashboardAnalytics({ data, loading, language = 'fr', t = (key) => key, kidName = '' }) {
  if (loading && !data) {
    return (
      <div className="space-y-space-32" aria-busy="true" aria-label={t('parentProfilesLoading')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-16">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-40 rounded-32" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-32" />
        <Skeleton className="h-48 rounded-32" />
      </div>
    );
  }

  if (!data) {
    return (
      <ParentEmptyState
        emoji="🌿"
        title={t('parentAnalyticsNoData')}
        description={t('parentHomeNoDataDesc')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-space-32">
      <ParentTodaySummary data={data} kidName={kidName} t={t} language={language} />
      <ParentReadingJourney data={data} t={t} language={language} />
      <ParentLibraryRails data={data} t={t} />
    </div>
  );
}

export default ParentDashboardAnalytics;
