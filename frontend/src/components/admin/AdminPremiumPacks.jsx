import { useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { Button, Badge, Input } from '../ui';
import {
  archivePack,
  createCustomPack,
  featurePack,
  getFeatureFlags,
  listPremiumPacks,
  publishPack,
  savePackOverride,
  setFeatureFlag,
} from '../../utils/premiumPackStore';
import { PREMIUM_FEATURE_FLAGS } from '../../constants/premiumPacks';
import { premLabel, packDisplayTitle } from '../../constants/premiumLabels';

export function AdminPremiumPacks() {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [tick, setTick] = useState(0);
  const [title, setTitle] = useState('');
  const [themes, setThemes] = useState('adventure');
  const packs = useMemo(
    () => listPremiumPacks({ includeArchived: true, onlyPublished: false }),
    [tick],
  );
  const flags = useMemo(() => getFeatureFlags(), [tick]);

  const refresh = () => setTick((n) => n + 1);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">{premLabel('premAdminTitle', language)}</h1>
        <p className="text-foreground-muted font-medium mt-1">{premLabel('premAdminSubtitle', language)}</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-heading-m font-black">{premLabel('premFlagsTitle', language)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.keys(PREMIUM_FEATURE_FLAGS).map((flagId) => (
            <button
              key={flagId}
              type="button"
              onClick={() => {
                setFeatureFlag(flagId, !flags[flagId]);
                refresh();
                showToast(t('saved') || 'OK', 'success');
              }}
              className={`rounded-2xl border p-4 text-start min-h-touch ${flags[flagId] ? 'border-success-300 bg-success-50' : 'border-border bg-surface-secondary'}`}
            >
              <p className="font-black text-sm">{flagId}</p>
              <p className="text-caption text-foreground-muted mt-1">{flags[flagId] ? premLabel('premYes', language) : premLabel('premNo', language)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-heading-m font-black">{premLabel('premCreate', language)}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pack title" className="flex-1" />
          <Input value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="themes,comma,separated" className="flex-1" />
          <Button
            variant="primary"
            onClick={() => {
              if (!title.trim()) return;
              createCustomPack({
                title: title.trim(),
                description: title.trim(),
                themes: themes.split(',').map((s) => s.trim()).filter(Boolean),
                published: false,
                seasonal: false,
              });
              setTitle('');
              refresh();
              showToast(premLabel('premCreate', language), 'success');
            }}
          >
            {premLabel('premCreate', language)}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {packs.map((pack) => (
          <article key={pack.id} className="rounded-3xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-2xl">{pack.emoji}</span>
                <h3 className="font-black">{packDisplayTitle(pack, language)}</h3>
                {pack.published && <Badge variant="soft">{premLabel('premPublish', language)}</Badge>}
                {pack.archived && <Badge variant="secondary">{premLabel('premArchive', language)}</Badge>}
                {pack.featured && <Badge variant="soft" className="bg-amber-100 text-amber-800">{premLabel('premFeature', language)}</Badge>}
                {pack.seasonal && <Badge variant="soft">{premLabel('premSeasonalMark', language)}</Badge>}
              </div>
              <p className="text-caption text-foreground-muted truncate">{pack.id} · {(pack.themes || []).join(', ')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => { publishPack(pack.id); refresh(); }}>{premLabel('premPublish', language)}</Button>
              <Button size="sm" variant="secondary" onClick={() => { featurePack(pack.id, !pack.featured); refresh(); }}>
                {pack.featured ? premLabel('premUnfeature', language) : premLabel('premFeature', language)}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  savePackOverride(pack.id, { seasonal: !pack.seasonal, seasonId: pack.seasonId || 'summer' });
                  refresh();
                }}
              >
                {premLabel('premSeasonalMark', language)}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { archivePack(pack.id); refresh(); }}>{premLabel('premArchive', language)}</Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default AdminPremiumPacks;
