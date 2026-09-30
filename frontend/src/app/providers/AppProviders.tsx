import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};
