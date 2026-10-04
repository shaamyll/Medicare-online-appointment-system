import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Pencil,
  X,
  Save,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
import {
  usePatientProfile,
  useUpdatePatientProfile,
  useChangePatientPassword,
} from '@/features/patients/hooks/usePatient';
import { LoadingState } from '@/components/ui/LoadingState';

export const PatientProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const { data: profileData, isLoading, isError, refetch } = usePatientProfile();
  const updateProfileMutation = useUpdatePatientProfile();
  const changePasswordMutation = useChangePatientPassword();

  const patient = profileData?.user || authUser;

  // Personal Info Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    dateOfBirth: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Populate form data
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        phone: patient.phone || '',
        gender: (patient.gender as any) || '',
        dateOfBirth: (patient as any).dateOfBirth || '',
      });
    }
  }, [patient]);

  // Security / Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  if (isLoading && !patient) {
    return <LoadingState message="Loading your patient profile..." />;
  }

  if (isError && !patient) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-3 shadow-xs">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-gray-900">Failed to load profile</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          We encountered an issue retrieving your patient profile. Please retry.
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Calculate if profile form changed
  const isChanged =
    formData.name !== (patient?.name || '') ||
    formData.phone !== (patient?.phone || '') ||
    formData.gender !== ((patient?.gender as any) || '') ||
    formData.dateOfBirth !== (((patient as any)?.dateOfBirth) || '');

  // Validation
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 80) {
      errors.name = 'Name must be between 2 and 80 characters';
    }

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone) {
      const cleanPhone = trimmedPhone.replace(/[\s-]/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
        errors.phone = 'Phone number must contain 10 to 15 digits';
      }
    }

    if (formData.dateOfBirth) {
      const dobDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date';
      } else if (dobDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      } else {
        const age = today.getFullYear() - dobDate.getFullYear();
        if (age < 0 || age > 120) {
          errors.dateOfBirth = 'Age must be between 0 and 120 years';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
      });
      toast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (err: any) {
      toast(
        err?.response?.data?.message || err?.message || 'Failed to update profile',
        'error'
      );
    }
  };

  const handleCancelEdit = () => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        phone: patient.phone || '',
        gender: (patient.gender as any) || '',
        dateOfBirth: (patient as any).dateOfBirth || '',
      });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Enter your current password';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Enter your new password';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      toast('Password changed successfully', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (err: any) {
      toast(
        err?.response?.data?.message || err?.message || 'Failed to change password',
        'error'
      );
    }
  };

  const memberSinceStr = patient?.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recent';

  const computedAge = (patient as any)?.age;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal identification details and account security credentials"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Summary Card */}
        <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar
              name={patient?.name}
              size="2xl"
              shape="circle"
              className="ring-4 ring-emerald-50 shadow-md"
            />
          </div>

          <div className="space-y-1 w-full">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{patient?.name}</h2>
            <p className="text-xs text-gray-500 font-mono">{patient?.email}</p>
          </div>

          <div className="w-full pt-3 border-t border-gray-100 flex flex-col gap-2.5 text-xs text-left">
            <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-gray-50">
              <span className="text-gray-500 font-medium">Account Role</span>
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Patient
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-gray-50">
              <span className="text-gray-500 font-medium">Member Since</span>
              <span className="font-semibold text-gray-700">{memberSinceStr}</span>
            </div>

            {computedAge !== undefined && computedAge !== null && (
              <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-gray-50">
                <span className="text-gray-500 font-medium">Calculated Age</span>
                <span className="font-semibold text-gray-700">{computedAge} years</span>
              </div>
            )}
          </div>

          <div className="w-full pt-2">
            <div className="flex items-center gap-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-left text-xs text-emerald-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Your medical profile is confidential and protected by healthcare privacy standards.</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Personal Info & Security Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Personal Information */}
          <Card className="rounded-2xl border-gray-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Personal Information</CardTitle>
                  <p className="text-xs text-gray-500">Update your primary contact and demographic records</p>
                </div>
              </div>

              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                >
                  Edit Profile
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {!isEditing ? (
                /* View Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Full Name
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{patient?.name || 'Not provided'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email Address (Locked)
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{patient?.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Contact Phone
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{patient?.phone || 'Not provided'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Gender
                    </span>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {patient?.gender || 'Not specified'}
                    </p>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date of Birth & Age
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {(patient as any)?.dateOfBirth
                        ? `${(patient as any).dateOfBirth} (${computedAge !== null ? `${computedAge} years old` : ''})`
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                          formErrors.name
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-gray-200 focus:ring-emerald-500'
                        }`}
                        placeholder="e.g. John Doe"
                        maxLength={80}
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Email (Disabled with Lock Icon) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-normal">
                          <Lock className="h-3 w-3" /> Cannot be changed
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={patient?.email || ''}
                          disabled
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed select-none"
                        />
                        <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Phone Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                            formErrors.phone
                              ? 'border-rose-300 focus:ring-rose-500'
                              : 'border-gray-200 focus:ring-emerald-500'
                          }`}
                          placeholder="e.g. +94771234567"
                          maxLength={15}
                        />
                        <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                      {formErrors.phone && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.phone}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value as any })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-gray-700">Date of Birth</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            setFormData({ ...formData, dateOfBirth: e.target.value });
                            if (formErrors.dateOfBirth) setFormErrors({ ...formErrors, dateOfBirth: '' });
                          }}
                          className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                            formErrors.dateOfBirth
                              ? 'border-rose-300 focus:ring-rose-500'
                              : 'border-gray-200 focus:ring-emerald-500'
                          }`}
                        />
                        <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                      {formErrors.dateOfBirth && (
                        <p className="text-[11px] text-rose-600 font-medium">{formErrors.dateOfBirth}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={updateProfileMutation.isPending}
                      leftIcon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={updateProfileMutation.isPending}
                      disabled={!isChanged || updateProfileMutation.isPending}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Security & Password */}
          <Card className="rounded-2xl border-gray-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Security Credentials</CardTitle>
                <p className="text-xs text-gray-500">Update your account login password</p>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, currentPassword: e.target.value });
                        if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                      }}
                      className={`w-full px-3 py-2 pr-9 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                        passwordErrors.currentPassword
                          ? 'border-rose-300 focus:ring-rose-500'
                          : 'border-gray-200 focus:ring-emerald-500'
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-[11px] text-rose-600 font-medium">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, newPassword: e.target.value });
                        if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                      }}
                      className={`w-full px-3 py-2 pr-9 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                        passwordErrors.newPassword
                          ? 'border-rose-300 focus:ring-rose-500'
                          : 'border-gray-200 focus:ring-emerald-500'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-[11px] text-rose-600 font-medium">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                        if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                      }}
                      className={`w-full px-3 py-2 pr-9 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                        passwordErrors.confirmPassword
                          ? 'border-rose-300 focus:ring-rose-500'
                          : 'border-gray-200 focus:ring-emerald-500'
                      }`}
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 font-medium">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={changePasswordMutation.isPending}
                    disabled={
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword ||
                      changePasswordMutation.isPending
                    }
                    leftIcon={<Lock className="h-4 w-4" />}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
