import React from 'react';
import { LogOut } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    const isDoctor = user?.role === 'doctor' || window.location.pathname.startsWith('/doctor');
    const redirectPath = isDoctor ? '/doctor/login' : '/login';

    // 1. Clear React Query cache
    queryClient.clear();

    // 2. Clear token & user state in AuthProvider
    logout(false);

    // 3. Trigger toast notification
    toast('You have been logged out successfully.', 'info');

    onClose();

    // 4. Redirect to login
    navigate(redirectPath, { replace: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Logout"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to log out?
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
};
