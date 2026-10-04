
import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreatePatient } from '@/features/admin/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { AdminPatient } from '@/features/admin/api/adminApi';

export interface PatientCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: AdminPatient & { tempPassword: string }) => void;
}

export const PatientCreateModal: React.FC<PatientCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const createPatientMutation = useCreatePatient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = 'Patient full name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 80) {
      errs.name = 'Name must be between 2 and 80 characters';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Enter a valid email address';
    }

    if (phone.trim()) {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 10 || cleanDigits.length > 15) {
        errs.phone = 'Phone number must contain between 10 and 15 digits';
      }
    }

    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        errs.dateOfBirth = 'Please select a valid date';
      } else if (dobDate > today) {
        errs.dateOfBirth = 'Date of birth cannot be in the future';
      } else {
        const age = today.getFullYear() - dobDate.getFullYear();
        if (age < 0 || age > 120) {
          errs.dateOfBirth = 'Age must be between 0 and 120 years';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const created = await createPatientMutation.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });

      toast('Patient registered and activated successfully', 'success');
      onSuccess(created);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to create patient';
      const status = err?.response?.status;

      if (status === 409 && serverMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: serverMsg }));
        return;
      }

      toast(serverMsg, 'error');
    }
  };

  const genderOptions = [
    { value: '', label: 'Select Gender (Optional)' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Patient"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4">
          <Input
            label="Patient Full Name *"
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            leftIcon={<User className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="jane.doe@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />

          <Input
            label="Contact Phone"
            placeholder="+1 (555) 345-6789"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
            error={errors.phone}
            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <Select
                value={gender}
                onChange={(val) => setGender(val)}
                options={genderOptions}
                placeholder="Select Gender"
              />
            </div>

            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
              }}
              error={errors.dateOfBirth}
              leftIcon={<Calendar className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 bg-white sticky bottom-0">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-gray-400" />
            Temporary password will be generated automatically.
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createPatientMutation.isPending}
            >
              Create Patient
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
