import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cx } from './cx.js';

/**
 * Glass modal built on Radix Dialog, so focus trapping, Escape, scroll locking
 * and aria wiring come for free.
 */
export function Modal({ open, onOpenChange, title, description, footer, size = 'md', children }) {
  const width = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }[size];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-fadeIn" />
        <Dialog.Content
          className={cx(
            'fixed left-1/2 top-1/2 z-[91]',
            'w-[min(94vw,var(--modal-w))] max-h-[88vh] overflow-y-auto custom-scrollbar',
            'glass-strong glass-edge rounded-[var(--radius-xl)] animate-modalIn',
            width
          )}
          style={{ '--modal-w': '56rem' }}
        >
          {/* Champagne hairline along the top edge */}
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
            aria-hidden="true"
          />

          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-2xl text-content m-0 leading-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-[13px] text-content-secondary mt-1.5 m-0">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                className="shrink-0 grid place-items-center h-9 w-9 rounded-[var(--radius-sm)] bg-transparent border border-transparent text-content-muted hover:text-content hover:bg-surface-elevated hover:border-line transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-6 pb-6">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-subtle bg-surface-sunken/50 flex flex-wrap justify-end gap-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
