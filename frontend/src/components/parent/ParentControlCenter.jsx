import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Skeleton } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { parentalAPI } from '../../api/parental';
import { CONTENT_LANGUAGES, CONTENT_TYPE_OPTIONS, localizeContentOptions } from '../../constants/contentOptions';
import {
  CONTROL_AGE_OPTIONS,
  CONTROL_CENTER_TABS,
  CONTROL_THEME_OPTIONS,
  DAILY_GOAL_MINUTES,
  RECOMMENDATION_RAIL_OPTIONS,
  SCHOOL_LEVEL_OPTIONS,
  exportKidProfilePayload,
  toggleBookInLibrary,
  toggleListValue,
} from '../../constants/parentControlCenter';
import { ParentCategoryApprovals } from './ParentCategoryApprovals';
import { ParentReadingGoalCard } from './ParentReadingGoalCard';
import { ParentDashboardAnalytics } from './ParentDashboardAnalytics';
import { ParentEmptyState } from './ParentEmptyState';
import { KidsBookCover } from '../kids/KidsBookCover';
import { getHoverMotion } from '../../constants/kidsMotion';

function SoftChip({ active, onClick, children, tone = 'primary' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`parent-soft-chip ${active ? `is-active is-${tone}` : ''}`}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, subtitle, children, actions = null }) {
  return (
    <section className="parent-control-card parent-panel">
      <div className="parent-control-header">
        <div>
          <h3 className="text-heading-m font-black text-foreground mb-1">{title}</h3>
          {subtitle ? <p className="text-body text-foreground-secondary font-medium">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function ParentControlCenter({
  kid,
  rulesForm,
  setRulesForm,
  onSaveRules,
  rulesSaving = false,
  dashboardData,
  activityLoading = false,
  language = 'fr',
  onEditProfile,
  onAddKid,
  onRefreshDashboard,
  onOpenOffline = null,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { requestConfirm, confirmDialog } = useConfirmDialog();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState('content');
  const [busy, setBusy] = useState(false);
  const contentTypes = localizeContentOptions(CONTENT_TYPE_OPTIONS, language);

  const favorites = dashboardData?.favorites?.items || [];
  const history = dashboardData?.history?.items || [];
  const progress = dashboardData?.progress?.items || [];
  const continueReading = progress.filter((book) => (book.progress_percent || 0) > 0 && (book.progress_percent || 0) < 100);
  const libraryBooks = useMemo(() => {
    const map = new Map();
    [...favorites, ...history, ...progress].forEach((book) => {
      const id = book.book_id || book.id;
      if (!id || map.has(id)) return;
      map.set(id, { ...book, id });
    });
    return [...map.values()];
  }, [favorites, history, progress]);

  if (!kid) {
    return (
      <ParentEmptyState
        emoji="🎛️"
        title={t('pccEmptyTitle')}
        description={t('pccEmptyDesc')}
        actionLabel={t('parentAddKid')}
        onAction={onAddKid}
      />
    );
  }

  const patchRules = (patch) => setRulesForm((current) => ({ ...current, ...patch }));

  const handleRemoveFavorite = async (bookId) => {
    try {
      setBusy(true);
      await parentalAPI.removeKidFavorite(kid.id, bookId);
      showToast(t('pccFavoriteRemoved'), 'success');
      onRefreshDashboard?.();
    } catch (error) {
      console.error(error);
      showToast(t('pccFavoritesError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleClearActivity = async (kind) => {
    const ok = await requestConfirm({
      title: t('confirmTitle'),
      message: t('pccClearConfirm'),
      confirmLabel: t('confirmDelete'),
      danger: true,
    });
    if (!ok) return;
    try {
      setBusy(true);
      await parentalAPI.clearKidActivity(kid.id, kind);
      showToast(t('pccCleared'), 'success');
      onRefreshDashboard?.();
    } catch (error) {
      console.error(error);
      showToast(t('pccFavoritesError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleExportProfile = () => {
    const payload = exportKidProfilePayload(kid, rulesForm, dashboardData);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hkids-profile-${kid.name || kid.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(t('pccExported'), 'success');
  };

  const saveButton = (
    <Button variant="primary" onClick={onSaveRules} disabled={rulesSaving || busy} className="min-h-touch font-bold">
      {rulesSaving ? t('parentSaving') : t('parentSaveRules')}
    </Button>
  );

  return (
    <div id="control-center" className="parent-control-center space-y-space-24">
      <header className="parent-control-center-hero parent-panel">
        <div>
          <p className="parent-companion-card-label">{t('pccEyebrow')}</p>
          <h2 className="text-heading-xl font-black text-foreground">{t('pccTitle', { name: kid.name })}</h2>
          <p className="text-body-lg text-foreground-secondary font-medium mt-2 max-w-2xl">{t('pccSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onEditProfile} className="min-h-touch font-bold">{t('pccEditProfile')}</Button>
          {saveButton}
        </div>
      </header>

      <nav className="parent-control-tabs" aria-label={t('pccTitle', { name: kid.name })}>
        {CONTROL_CENTER_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`parent-control-tab ${tab === item.id ? 'is-active' : ''}`}
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            <span aria-hidden="true">{item.emoji}</span>
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-space-24"
        >
          {tab === 'content' && (
            <>
              <SectionCard title={t('pccThemesTitle')} subtitle={t('pccThemesDesc')} actions={saveButton}>
                <div className="flex flex-wrap gap-2 mb-space-16">
                  {CONTROL_THEME_OPTIONS.map((theme) => {
                    const allowed = rulesForm.allowed_themes.includes(theme.id);
                    const blocked = rulesForm.blocked_themes.includes(theme.id);
                    return (
                      <div key={theme.id} className="flex flex-col gap-1">
                        <SoftChip
                          active={allowed && !blocked}
                          tone="secondary"
                          onClick={() => {
                            if (allowed) {
                              patchRules({
                                allowed_themes: rulesForm.allowed_themes.filter((id) => id !== theme.id),
                              });
                            } else {
                              patchRules({
                                allowed_themes: [...new Set([...rulesForm.allowed_themes, theme.id])],
                                blocked_themes: rulesForm.blocked_themes.filter((id) => id !== theme.id),
                              });
                            }
                          }}
                        >
                          <span aria-hidden="true">{theme.emoji}</span> {t(theme.labelKey)}
                        </SoftChip>
                        <button
                          type="button"
                          className={`text-caption font-bold px-2 py-1 rounded-full ${blocked ? 'bg-danger-100 text-danger-700' : 'text-foreground-muted'}`}
                          onClick={() => patchRules({
                            blocked_themes: toggleListValue(rulesForm.blocked_themes, theme.id),
                            allowed_themes: rulesForm.allowed_themes.filter((id) => id !== theme.id),
                          })}
                        >
                          {blocked ? t('pccBlocked') : t('pccBlock')}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <h4 className="font-black mb-space-12">{t('parentAllowedLanguages')}</h4>
                <div className="flex flex-wrap gap-2 mb-space-16">
                  {CONTENT_LANGUAGES.map((lang) => (
                    <SoftChip
                      key={lang.id}
                      active={rulesForm.allowed_languages.includes(lang.id)}
                      onClick={() => patchRules({ allowed_languages: toggleListValue(rulesForm.allowed_languages, lang.id) })}
                    >
                      {lang.shortLabel || lang.label}
                    </SoftChip>
                  ))}
                </div>
                <h4 className="font-black mb-space-12">{t('parentAllowedContentTypes')}</h4>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <SoftChip
                      key={type.id}
                      active={rulesForm.allowed_content_types.includes(type.id)}
                      tone="secondary"
                      onClick={() => patchRules({ allowed_content_types: toggleListValue(rulesForm.allowed_content_types, type.id) })}
                    >
                      {type.label}
                    </SoftChip>
                  ))}
                </div>
              </SectionCard>
              <ParentCategoryApprovals kidId={kid.id} />
            </>
          )}

          {tab === 'ages' && (
            <SectionCard title={t('pccAgesTitle')} subtitle={t('pccAgesDesc')} actions={saveButton}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CONTROL_AGE_OPTIONS.map((age) => {
                  const active = rulesForm.allowed_age_groups.length === 0
                    || rulesForm.allowed_age_groups.includes(age.id);
                  return (
                    <SoftChip
                      key={age.id}
                      active={active && rulesForm.allowed_age_groups.includes(age.id)}
                      onClick={() => {
                        const current = rulesForm.allowed_age_groups;
                        if (current.length === 0) {
                          patchRules({
                            allowed_age_groups: CONTROL_AGE_OPTIONS.map((item) => item.id).filter((id) => id !== age.id),
                          });
                          return;
                        }
                        patchRules({ allowed_age_groups: toggleListValue(current, age.id) });
                      }}
                    >
                      <span aria-hidden="true">{age.emoji}</span> {t(age.labelKey)}
                    </SoftChip>
                  );
                })}
              </div>
              <p className="text-caption text-foreground-muted mt-space-16">{t('pccAgesHint')}</p>
              <div className="pt-space-16">
                <Button
                  variant="ghost"
                  onClick={() => patchRules({ allowed_age_groups: [] })}
                  className="min-h-touch"
                >
                  {t('pccAllowAllAges')}
                </Button>
              </div>
            </SectionCard>
          )}

          {tab === 'library' && (
            <SectionCard title={t('pccLibraryTitle')} subtitle={t('pccLibraryDesc')} actions={saveButton}>
              {libraryBooks.length === 0 ? (
                <ParentEmptyState emoji="📚" title={t('pccLibraryEmpty')} description={t('pccLibraryEmptyDesc')} compact />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-space-16">
                  {libraryBooks.slice(0, 24).map((book) => {
                    const id = Number(book.book_id || book.id);
                    const controls = rulesForm.library_controls || {};
                    const hidden = controls.hidden_book_ids?.includes(id);
                    const pinned = controls.pinned_book_ids?.includes(id);
                    const forced = controls.forced_book_ids?.includes(id);
                    const custom = controls.custom_library_ids?.includes(id);
                    return (
                      <article key={id} className="rounded-3xl border border-border/50 bg-card p-3 space-y-2">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-secondary">
                          <KidsBookCover book={book} alt={book.title || ''} imgClassName="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-bold line-clamp-2">{book.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { field: 'pinned_book_ids', active: pinned, label: t('pccPin') },
                            { field: 'forced_book_ids', active: forced, label: t('pccForce') },
                            { field: 'hidden_book_ids', active: hidden, label: t('pccHide') },
                            { field: 'custom_library_ids', active: custom, label: t('pccCustom') },
                          ].map((action) => (
                            <button
                              key={action.field}
                              type="button"
                              className={`text-caption font-bold rounded-full px-2 py-1 ${action.active ? 'bg-primary-100 text-primary-700' : 'bg-surface-secondary text-foreground-muted'}`}
                              onClick={() => patchRules({
                                library_controls: toggleBookInLibrary(controls, action.field, id),
                              })}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {tab === 'goals' && (
            <>
              <SectionCard title={t('pccGoalsQuickTitle')} subtitle={t('pccGoalsQuickDesc')}>
                <div className="flex flex-wrap gap-2">
                  {DAILY_GOAL_MINUTES.map((minutes) => (
                    <SoftChip
                      key={minutes}
                      active={Number(rulesForm.daily_screen_time_minutes) === minutes}
                      onClick={() => patchRules({ daily_screen_time_minutes: minutes })}
                    >
                      {minutes} min
                    </SoftChip>
                  ))}
                </div>
                <div className="pt-space-16 flex justify-end">{saveButton}</div>
              </SectionCard>
              <ParentReadingGoalCard
                kidId={kid.id}
                goal={dashboardData?.goal}
                onSaved={onRefreshDashboard}
              />
            </>
          )}

          {tab === 'favorites' && (
            <SectionCard
              title={t('pccFavoritesTitle')}
              subtitle={t('pccFavoritesDesc')}
              actions={(
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" disabled={busy} onClick={() => handleClearActivity('favorites')}>{t('pccClearFavorites')}</Button>
                  <Button variant="ghost" disabled={busy} onClick={() => handleClearActivity('history')}>{t('pccClearHistory')}</Button>
                  <Button variant="secondary" disabled={busy} onClick={() => handleClearActivity('all')}>{t('pccClearAll')}</Button>
                </div>
              )}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-24">
                {[
                  { title: t('yourFavorites'), items: favorites, removable: true },
                  { title: t('pccContinueReading'), items: continueReading },
                  { title: t('pccHistory'), items: history.slice(0, 12) },
                ].map((rail) => (
                  <div key={rail.title}>
                    <h4 className="font-black mb-space-12">{rail.title}</h4>
                    {rail.items.length === 0 ? (
                      <ParentEmptyState compact emoji="🍃" title={t('pccNoItems')} description="" />
                    ) : (
                      <ul className="space-y-2">
                        {rail.items.map((book) => (
                          <li key={book.book_id || book.id} className="flex items-center gap-3 rounded-2xl bg-surface-secondary/70 p-2">
                            <div className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0">
                              <KidsBookCover book={book} alt="" imgClassName="absolute inset-0 w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate">{book.title}</p>
                              {book.progress_percent ? (
                                <p className="text-caption text-foreground-muted">{Math.round(book.progress_percent)}%</p>
                              ) : null}
                            </div>
                            {rail.removable ? (
                              <button
                                type="button"
                                className="text-caption font-bold text-danger-600 min-h-touch px-2"
                                disabled={busy}
                                onClick={() => handleRemoveFavorite(book.book_id || book.id)}
                              >
                                {t('pccRemove')}
                              </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === 'rails' && (
            <SectionCard title={t('pccRailsTitle')} subtitle={t('pccRailsDesc')} actions={saveButton}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RECOMMENDATION_RAIL_OPTIONS.map((rail) => {
                  const enabled = rulesForm.recommendation_rails?.[rail.id] !== false;
                  return (
                    <button
                      key={rail.id}
                      type="button"
                      {...getHoverMotion(reducedMotion)}
                      className={`rounded-3xl border p-4 text-start min-h-touch ${enabled ? 'border-primary-300 bg-primary-50' : 'border-border/50 bg-card'}`}
                      aria-pressed={enabled}
                      onClick={() => patchRules({
                        recommendation_rails: {
                          ...rulesForm.recommendation_rails,
                          [rail.id]: !enabled,
                        },
                      })}
                    >
                      <span className="text-2xl block mb-2" aria-hidden="true">{rail.emoji}</span>
                      <p className="font-black">{t(rail.labelKey)}</p>
                      <p className="text-caption text-foreground-muted mt-1">{enabled ? t('pccEnabled') : t('pccDisabled')}</p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {tab === 'profile' && (
            <SectionCard title={t('pccProfileTitle')} subtitle={t('pccProfileDesc')}>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-space-16 mb-space-24">
                <div><dt className="text-caption text-foreground-muted">{t('parentKidFormFirstName')}</dt><dd className="font-black">{kid.name}</dd></div>
                <div><dt className="text-caption text-foreground-muted">{t('parentKidFormAge')}</dt><dd className="font-black">{kid.age ?? '—'}</dd></div>
                <div><dt className="text-caption text-foreground-muted">{t('parentKidFormLanguage')}</dt><dd className="font-black">{(kid.preferred_language || 'fr').toUpperCase()}</dd></div>
                <div><dt className="text-caption text-foreground-muted">{t('pccSchoolLevel')}</dt><dd className="font-black">{kid.school_level ? t(SCHOOL_LEVEL_OPTIONS.find((o) => o.id === kid.school_level)?.labelKey || 'pccSchoolLevel') : '—'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-caption text-foreground-muted">{t('parentKidFormInterests')}</dt><dd className="font-bold">{Array.isArray(kid.interests) ? kid.interests.join(', ') : (kid.interests || '—')}</dd></div>
              </dl>
              <Button variant="primary" onClick={onEditProfile} className="min-h-touch font-bold">{t('pccEditProfile')}</Button>
            </SectionCard>
          )}

          {tab === 'analytics' && (
            activityLoading && !dashboardData ? (
              <div className="space-y-4" aria-busy="true">
                <Skeleton className="h-40 rounded-3xl" />
                <Skeleton className="h-56 rounded-3xl" />
              </div>
            ) : (
              <ParentDashboardAnalytics
                data={dashboardData}
                loading={activityLoading}
                language={language}
                t={t}
                kidName={kid.name}
                kid={kid}
              />
            )
          )}

          {tab === 'actions' && (
            <SectionCard title={t('pccActionsTitle')} subtitle={t('pccActionsDesc')}>
              <div className="parent-quick-grid">
                <button type="button" className="parent-quick-btn" onClick={onAddKid}>{t('parentAddKid')}</button>
                <button type="button" className="parent-quick-btn" onClick={onEditProfile}>{t('pccEditProfile')}</button>
                <button type="button" className="parent-quick-btn" onClick={handleExportProfile}>{t('pccExportProfile')}</button>
                <button type="button" className="parent-quick-btn" onClick={() => onOpenOffline?.() || showToast(t('pccOfflineHint'), 'info')}>{t('pccDownloadOffline')}</button>
                <button type="button" className="parent-quick-btn" onClick={() => handleClearActivity('all')}>{t('pccResetActivity')}</button>
                <button type="button" className="parent-quick-btn" onClick={onSaveRules}>{t('parentSaveRules')}</button>
              </div>
            </SectionCard>
          )}
        </motion.div>
      </AnimatePresence>
      {confirmDialog}
    </div>
  );
}

export default ParentControlCenter;
