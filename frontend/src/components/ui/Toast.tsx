import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  onClick?: () => void;
}

interface ToastOptions {
  title?: string;
  onClick?: () => void;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        message,
        title: options?.title,
        onClick: options?.onClick,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  React.useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType }>;
      if (customEvent.detail) {
        toast(customEvent.detail.message, customEvent.detail.type || 'info');
      }
    };
    window.addEventListener('app:toast', handleCustomToast);
    return () => window.removeEventListener('app:toast', handleCustomToast);
  }, [toast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              if (t.onClick) {
                t.onClick();
                removeToast(t.id);
              }
            }}
            className={cn(
              'pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-lg border text-sm transition-all animate-in slide-in-from-bottom-2',
              t.onClick && 'cursor-pointer hover:shadow-xl',
              t.type === 'success' && 'bg-white border-emerald-200 text-emerald-950',
              t.type === 'error' && 'bg-white border-rose-200 text-rose-950',
              t.type === 'warning' && 'bg-white border-amber-200 text-amber-950',
              t.type === 'info' && 'bg-white border-sky-200 text-sky-950'
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                {t.title && <div className="font-semibold text-slate-900 leading-snug">{t.title}</div>}
                <div className={cn("text-slate-700 leading-snug", t.title ? "text-xs mt-0.5 text-slate-600" : "font-medium")}>
                  {t.message}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              className="text-slate-400 hover:text-slate-600 ml-2 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Global toast dispatcher for use outside React component lifecycles (e.g. Axios interceptors)
 */
export function showToast(message: string, type: ToastType = 'info'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

