import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { categoriesAPI } from '../../api/books';
import { parentalAPI } from '../../api/parental';
import { useToast } from '../ToastProvider';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion } from '../../constants/kidsMotion';
import { Button, Skeleton } from '../ui';
import { CheckIcon, LockIcon } from '../Icons';
import { ParentEmptyState } from './ParentEmptyState';

export function ParentCategoryApprovals({ kidId }) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [categories, setCategories] = useState([]);
  const [approvals, setApprovals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    if (!kidId) return;
    try {
      setLoading(true);
      setError(false);
      const [categoriesRes, approvalsRes] = await Promise.all([
        categoriesAPI.getAll(),
        parentalAPI.getApprovals(kidId),
      ]);
      const categoryRows = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      setCategories(categoryRows);
      const approvalMap = {};
      (Array.isArray(approvalsRes.data) ? approvalsRes.data : []).forEach((row) => {
        approvalMap[row.category_id] = row.approved === true;
      });
      setApprovals(approvalMap);
    } catch (loadError) {
      console.error('Could not load category approvals:', loadError);
      setError(true);
      showToast(t('parentLoadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [kidId, showToast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCategory = (categoryId) => {
    setApprovals((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  };

  const approveAll = () => {
    const next = {};
    categories.forEach((category) => {
      next[category.id] = true;
    });
    setApprovals(next);
  };

  const handleSave = async () => {
    if (!kidId) return;
    try {
      setSaving(true);
      const payload = categories.map((category) => ({
        category_id: category.id,
        approved: approvals[category.id] === true,
      }));
      await parentalAPI.bulkUpdateApprovals(kidId, payload);
      showToast(t('parentApprovalsSaved'), 'success');
      await loadData();
    } catch (saveError) {
      console.error('Could not save category approvals:', saveError);
      showToast(t('parentApprovalsError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!kidId) return null;

  if (loading) {
    return (
      <div className="rounded-32 border border-border/40 bg-card p-space-24 space-y-space-16" aria-busy="true">
        <Skeleton className="h-8 w-48 rounded-2xl" />
        <Skeleton className="h-4 w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ParentEmptyState
        emoji="📚"
        title={t('parentLoadError')}
        description={t('parentCategoryApprovalsDesc')}
        actionLabel={t('parentRetry')}
        onAction={loadData}
      />
    );
  }

  return (
    <div className="rounded-32 border border-border/40 bg-card p-space-24 md:p-space-32 shadow-card space-y-space-16">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-16">
        <div>
          <h3 className="text-heading-l font-black text-foreground">{t('parentCategoryApprovalsTitle')}</h3>
          <p className="text-body-lg text-foreground-secondary font-medium mt-1">
            {t('parentCategoryApprovalsDesc')}
          </p>
          <p className="text-caption text-accent-700 dark:text-accent-300 font-bold mt-2">
            {t('parentCategoryDefaultHint')}
          </p>
        </div>
        {categories.length > 0 && (
          <Button variant="outline" size="sm" onClick={approveAll} className="min-h-touch font-bold shrink-0">
            {t('parentApproveAll')}
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <ParentEmptyState
          emoji="🌍"
          title={t('parentNoCategories')}
          description={t('parentCategoryApprovalsDesc')}
          compact
        />
      ) : (
        <div className="flex flex-wrap gap-space-12">
          {categories.map((category) => {
            const approved = approvals[category.id] === true;
            return (
              <motion.button
                key={category.id}
                type="button"
                {...getHoverMotion(reducedMotion)}
                onClick={() => toggleCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-bold text-body transition-colors min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                  approved
                    ? 'bg-secondary-500 border-secondary-600 text-white shadow-soft'
                    : 'bg-surface-secondary border-border text-foreground-secondary'
                }`}
                aria-pressed={approved}
              >
                {approved ? (
                  <CheckIcon className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <LockIcon className="w-5 h-5 opacity-60" aria-hidden="true" />
                )}
                <span>{category.name}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving || categories.length === 0} className="min-h-touch font-bold">
        {t('parentSaveApprovals')}
      </Button>
    </div>
  );
}

export default ParentCategoryApprovals;
