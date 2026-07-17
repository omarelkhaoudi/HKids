import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../ui';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ToastProvider';
import { parentalAPI } from '../../api/parental';

const GOAL_TYPES = [
  { id: 'minutes', labelKey: 'parentGoalMinutes' },
  { id: 'completed_books', labelKey: 'parentGoalBooks' },
  { id: 'sessions', labelKey: 'parentGoalSessions' },
];

const PERIODS = [
  { id: 'daily', labelKey: 'parentGoalDaily' },
  { id: 'weekly', labelKey: 'parentGoalWeekly' },
  { id: 'monthly', labelKey: 'parentGoalMonthly' },
];

export function ParentReadingGoalCard({ kidId, goal, onSaved }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    goal_type: 'minutes',
    target_value: 30,
    period: 'weekly',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setForm({
        goal_type: goal.goal_type || 'minutes',
        target_value: goal.target_value || 30,
        period: goal.period || 'weekly',
      });
    }
  }, [goal]);

  const handleSave = async () => {
    if (!kidId) return;
    try {
      setSaving(true);
      await parentalAPI.saveReadingGoal(kidId, form);
      showToast(t('parentGoalSaved'), 'success');
      onSaved?.();
    } catch (error) {
      console.error('Reading goal save error:', error);
      showToast(t('parentGoalError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!kidId) return;
    try {
      setSaving(true);
      await parentalAPI.clearReadingGoal(kidId);
      setForm({ goal_type: 'minutes', target_value: 30, period: 'weekly' });
      showToast(t('parentGoalCleared'), 'success');
      onSaved?.();
    } catch (error) {
      console.error('Reading goal clear error:', error);
      showToast(t('parentGoalError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!kidId) return null;

  return (
    <Card className="p-space-24 md:p-space-32 rounded-32 shadow-card border border-border/40">
      <h2 className="text-heading-l font-black text-foreground mb-2">{t('parentReadingGoal')}</h2>
      <p className="text-body-lg text-foreground-secondary font-medium mb-space-24">{t('parentReadingGoalDesc')}</p>
      {goal && (
        <div className="mb-space-24 rounded-32 bg-surface-secondary/60 p-space-16 border border-border/40">
          <p className="text-body font-bold text-primary-600">
            {goal.progress_value} / {goal.target_value} · {Math.round(goal.progress_percent || 0)}%
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-16 mb-space-24">
        <div>
          <label className="block text-sm font-bold mb-1">{t('parentGoalType')}</label>
          <select
            value={form.goal_type}
            onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
            className="w-full rounded-2xl border border-border bg-surface-secondary px-3 py-2.5 font-bold min-h-touch"
          >
            {GOAL_TYPES.map((type) => (
              <option key={type.id} value={type.id}>{t(type.labelKey)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">{t('parentGoalTarget')}</label>
          <Input
            type="number"
            min={1}
            max={999}
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) || 1 })}
            className="font-bold"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">{t('parentGoalPeriod')}</label>
          <select
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            className="w-full rounded-2xl border border-border bg-surface-secondary px-3 py-2.5 font-bold min-h-touch"
          >
            {PERIODS.map((period) => (
              <option key={period.id} value={period.id}>{t(period.labelKey)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-space-12 justify-end">
        {goal && (
          <Button variant="outline" onClick={handleClear} disabled={saving} className="min-h-touch font-bold">
            {t('parentClearGoal')}
          </Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={saving} className="min-h-touch font-bold">
          {saving ? t('parentSaving') : t('parentSaveGoal')}
        </Button>
      </div>
    </Card>
  );
}

export default ParentReadingGoalCard;
