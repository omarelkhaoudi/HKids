import { useCallback, useState } from 'react';
import { Dialog } from '../components/ui/Dialog';
import { useLanguage } from '../context/LanguageContext';

/**
 * Promise-based confirm dialog — replaces window.confirm().
 * Usage: const { requestConfirm, confirmDialog } = useConfirmDialog();
 *        if (!(await requestConfirm({ title, message, danger: true }))) return;
 *        // render {confirmDialog} once in the tree
 */
export function useConfirmDialog() {
  const { t } = useLanguage();
  const [state, setState] = useState(null);

  const requestConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || t('confirmTitle'),
        message: options.message || '',
        confirmLabel: options.confirmLabel || t('confirmContinue'),
        cancelLabel: options.cancelLabel || t('adminCancel'),
        danger: Boolean(options.danger),
        resolve,
      });
    });
  }, [t]);

  const close = useCallback((result) => {
    setState((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const confirmDialog = (
    <Dialog
      isOpen={Boolean(state)}
      onClose={() => close(false)}
      title={state?.title}
      primaryLabel={state?.confirmLabel}
      secondaryLabel={state?.cancelLabel}
      primaryVariant={state?.danger ? 'danger' : 'primary'}
      onPrimary={() => close(true)}
      onSecondary={() => close(false)}
    >
      {state?.message}
    </Dialog>
  );

  return { requestConfirm, confirmDialog };
}
