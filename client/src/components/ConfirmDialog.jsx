import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable accessible confirmation dialog
 * Matches Paper & Ink editorial aesthetic
 */
export const ConfirmDialog = ({
  open = false,
  title = 'Delete this session?',
  description,
  note = 'This will remove the transcript and feedback for this attempt.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'danger', // 'danger' | 'primary'
  confirmDisabled = false,
  children,
}) => {
  const cancelBtnRef = useRef(null);
  const dialogRef = useRef(null);

  // Focus trap, Escape key handling, and initial focus on Cancel button
  useEffect(() => {
    if (!open) return;

    // Lock body and html scroll while open
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Initial focus on Cancel button
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 40);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled')
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-contain"
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          {/* Dimmed, slightly blurred backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm overscroll-none"
            aria-hidden="true"
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Dialog Modal */}
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-5 sm:p-6 shadow-xl space-y-4 text-[#1C1B17] dark:text-[#FAF6EE] transition-colors"
          >
            {/* Title */}
            <div className="space-y-1.5">
              <h3
                id="confirm-dialog-title"
                className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] leading-snug"
              >
                {title}
              </h3>

              {/* Optional description or question preview */}
              {description && (
                <div
                  id="confirm-dialog-desc"
                  className="p-2.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs font-serif font-medium text-[#1C1B17] dark:text-[#FAF6EE] truncate"
                  title={typeof description === 'string' ? description : undefined}
                >
                  {description}
                </div>
              )}

              {/* Explanatory note */}
              {note && (
                <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
                  {note}
                </p>
              )}

              {/* Optional child inputs/content */}
              {children && <div className="pt-2">{children}</div>}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-2 border-t border-[#E4DCC9] dark:border-[#38342D]">
              <motion.button
                ref={cancelBtnRef}
                type="button"
                onClick={onCancel}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto text-center px-4 py-2 border border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#2D2A24] text-[#1C1B17] dark:text-[#FAF6EE] text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                {cancelLabel}
              </motion.button>

              <motion.button
                type="button"
                disabled={confirmDisabled}
                onClick={onConfirm}
                whileTap={{ scale: confirmDisabled ? 1 : 0.97 }}
                className={`w-full sm:w-auto text-center px-4 py-2 text-white text-xs font-medium rounded-md transition-colors ${
                  confirmDisabled
                    ? 'opacity-50 cursor-not-allowed bg-[#787268] dark:bg-[#8E877C]'
                    : confirmVariant === 'danger'
                    ? 'bg-[#C2572B] hover:bg-[#A94821] cursor-pointer'
                    : 'bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] cursor-pointer'
                }`}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
