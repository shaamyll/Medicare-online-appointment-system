import React, { useState } from 'react';
import { Copy, Check, KeyRound, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient';
  tempPassword: string;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  title,
  name,
  email,
  role,
  tempPassword,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = tempPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const modalTitle =
    title || (role === 'doctor' ? 'Doctor Account Created' : 'Patient Account Created');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="md">
      <div className="space-y-5 py-1">
        {/* Success Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-emerald-950">
              {role === 'doctor' ? 'Doctor credentials generated' : 'Patient credentials generated'}
            </h4>
            <p className="text-xs text-emerald-800">
              An active account has been provisioned successfully.
            </p>
          </div>
        </div>

        {/* User Summary Info */}
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Full Name</span>
            <span className="text-gray-900 font-semibold">{name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Login Email</span>
            <span className="text-gray-900 font-mono font-semibold">{email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Account Role</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-200 text-gray-800 uppercase tracking-wide">
              {role}
            </span>
          </div>
        </div>

        {/* Temporary Password Monospace Box */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Temporary Password
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-base font-bold text-gray-900 tracking-wider select-all">
              {tempPassword}
            </div>
            <Button
              type="button"
              variant={copied ? 'primary' : 'secondary'}
              onClick={handleCopy}
              className="shrink-0 h-11 px-4"
              leftIcon={copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Caution Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Important:</strong> This password is shown only once. Share it with the user; they can change it from their profile settings.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
