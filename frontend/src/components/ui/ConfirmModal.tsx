import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  children?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requireText,
  isLoading = false,
  onConfirm,
  children,
  maxWidth = 'md',
}) => {
  const [typedText, setTypedText] = useState('');

  // Reset verification text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedText('');
    }
  }, [isOpen]);

  const isConfirmedDisabled = requireText ? typedText !== requireText || isLoading : isLoading;

  const iconConfig = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
      bg: 'bg-rose-100 border-rose-200',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-100 border-amber-200',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    },
    primary: {
      icon: <Info className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-100 border-emerald-200',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
    },
  };

  const currentVariant = iconConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border',
              currentVariant.bg
            )}
          >
            {currentVariant.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 leading-6">{title}</h3>
            {description && (
              <div className="mt-1 text-sm text-slate-600 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {children && <div className="pt-1">{children}</div>}

        {requireText && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Please type <span className="font-mono text-rose-600 font-bold">{requireText}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requireText}
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-100"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isConfirmedDisabled}
            className={cn('text-xs font-semibold shadow-sm transition-all', currentVariant.buttonBg)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
