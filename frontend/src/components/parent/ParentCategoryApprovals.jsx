import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { categoriesAPI } from '../../api/books';
import { parentalAPI } from '../../api/parental';
import { useToast } from '../ToastProvider';
import { useLanguage } from '../../context/LanguageContext';
import { Button, EmptyState, Skeleton } from '../ui';
import { CheckIcon, LockIcon } from '../Icons';

export function ParentCategoryApprovals({ kidId }) {
  const { showToast } = useToast();
  const { t } = useLanguage();
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
      <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6">
        <EmptyState
          title={t('parentLoadError')}
          description={t('parentCategoryApprovalsDesc')}
          actionLabel={t('parentRetry')}
          onAction={loadData}
        />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-foreground">{t('parentCategoryApprovalsTitle')}</h3>
          <p className="text-sm text-foreground-muted font-medium mt-1">
            {t('parentCategoryApprovalsDesc')}
          </p>
          <p className="text-xs text-accent-700 dark:text-accent-300 font-bold mt-2">
            {t('parentCategoryDefaultHint')}
          </p>
        </div>
        {categories.length > 0 && (
          <Button variant="outline" size="sm" onClick={approveAll}>
            {t('parentApproveAll')}
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState title={t('parentNoCategories')} description={t('parentCategoryApprovalsDesc')} />
      ) : (
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const approved = approvals[category.id] === true;
            return (
              <motion.button
                key={category.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-bold text-sm transition-colors min-h-[48px] ${
                  approved
                    ? 'bg-secondary-500 border-secondary-600 text-white'
                    : 'bg-surface-secondary border-border text-foreground-secondary'
                }`}
              >
                {approved ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <LockIcon className="w-5 h-5 opacity-60" />
                )}
                <span>{category.name}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving || categories.length === 0}>
        {t('parentSaveApprovals')}
      </Button>
    </div>
  );
}

export default ParentCategoryApprovals;
