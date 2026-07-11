import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { categoriesAPI } from '../../api/books';
import { parentalAPI } from '../../api/parental';
import { useToast } from '../ToastProvider';
import { Button } from '../ui';
import { CheckIcon, LockIcon } from '../Icons';

export function ParentCategoryApprovals({ kidId }) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [approvals, setApprovals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!kidId) return;
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Could not load category approvals:', error);
      showToast('Impossible de charger les autorisations de catégories', 'error');
    } finally {
      setLoading(false);
    }
  }, [kidId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCategory = (categoryId) => {
    setApprovals((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
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
      showToast('Autorisations de catégories enregistrées', 'success');
      await loadData();
    } catch (error) {
      console.error('Could not save category approvals:', error);
      showToast('Erreur lors de la sauvegarde des autorisations', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!kidId) return null;

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-foreground-muted">
        Chargement des catégories autorisées...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-xl font-black text-foreground">Catégories autorisées</h3>
        <p className="text-sm text-foreground-muted font-medium mt-1">
          Choisissez les catégories de livres visibles pour cet enfant.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-foreground-muted">Aucune catégorie disponible pour le moment.</p>
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
        Enregistrer les autorisations
      </Button>
    </div>
  );
}

export default ParentCategoryApprovals;
