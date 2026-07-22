import { useEffect } from 'react';
import { trapFocus } from '../utils/a11y';

export function useModalA11y(isOpen, onClose, panelRef) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const releaseTrap = panelRef?.current ? trapFocus(panelRef.current, onClose) : undefined;

    return () => {
      document.body.style.overflow = previousOverflow || 'unset';
      releaseTrap?.();
    };
  }, [isOpen, onClose, panelRef]);
}
