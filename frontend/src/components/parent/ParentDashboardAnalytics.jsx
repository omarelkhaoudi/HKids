import { Skeleton } from '../ui';
import { ParentTodaySummary } from './ParentTodaySummary';
import { ParentReadingInsights } from './ParentReadingInsights';
import { ParentReadingProgress } from './ParentReadingProgress';
import { ParentRecommendations } from './ParentRecommendations';
import { ParentReadingJourney } from './ParentReadingJourney';
import { ParentLibraryRails } from './ParentLibraryRails';
import { ParentEmptyState } from './ParentEmptyState';

export function ParentDashboardAnalytics({
  data,
  loading,
  language = 'fr',
  t = (key) => key,
  kidName = '',
  kid = null,
}) {
  if (loading && !data) {
    return (
      <div className="space-y-space-32" aria-busy="true" aria-label={t('parentProfilesLoading')}>
        <Skeleton className="h-56 rounded-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-16">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-32 rounded-32" />
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
      <ParentReadingInsights data={data} kidName={kidName} t={t} language={language} />
      <ParentReadingProgress data={data} kidName={kidName} t={t} language={language} />
      <ParentRecommendations data={data} kid={kid} t={t} language={language} />
      <ParentReadingJourney data={data} t={t} language={language} />
      <ParentLibraryRails data={data} t={t} />
    </div>
  );
}

export default ParentDashboardAnalytics;
