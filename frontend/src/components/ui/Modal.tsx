import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white border border-gray-200 p-6 shadow-2xl transition-all z-10 animate-in fade-in zoom-in-95 duration-200',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-none">
                {title}
              </h3>
            )}
            {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
          </div>
          <IconButton
            icon={<X className="h-4 w-4" />}
            aria-label="Close modal"
            title="Close modal"
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="-mr-1.5 -mt-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          />
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
