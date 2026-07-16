import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * Confirm-style dialog built on Modal — title, body, primary/secondary actions.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  primaryLabel = 'OK',
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryVariant = 'primary',
  maxWidth = 'max-w-md',
}) {
  const handlePrimary = () => {
    onPrimary?.();
    if (!onPrimary) onClose?.();
  };

  const handleSecondary = () => {
    onSecondary?.();
    if (!onSecondary) onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={maxWidth}>
      <div className="space-y-24">
        {children ? <div className="text-body">{children}</div> : null}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-12">
          {secondaryLabel ? (
            <Button variant="ghost" onClick={handleSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
          <Button variant={primaryVariant} onClick={handlePrimary}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
