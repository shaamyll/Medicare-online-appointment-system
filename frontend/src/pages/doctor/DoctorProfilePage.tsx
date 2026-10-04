import React, { useState, useEffect } from 'react';
import { User, Phone, Save, FileBadge, Lock, UploadCloud, X as CloseIcon, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useDoctorProfile, useUpdateDoctorProfile, useDoctorChangePassword } from '@/features/doctors/hooks/useDoctors';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { Avatar } from '@/components/ui/Avatar';

export const DoctorProfilePage: React.FC = () => {
  const { toast } = useToast();
  const { data: doctor, isLoading } = useDoctorProfile();
  const { data: departments } = useDepartments();
  const updateProfileMutation = useUpdateDoctorProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [consultationFee, setConsultationFee] = useState(0);
  const [roomNumber, setRoomNumber] = useState('');
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Photo management state
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Password change state
  const changePasswordMutation = useDoctorChangePassword();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Enter your current password';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Enter a new password';
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
      toast('Password changed successfully!', 'success');
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

  useEffect(() => {
    if (doctor) {
      setName(doctor.user?.name || '');
      setPhone(doctor.user?.phone || '');
      setSpecialization(doctor.specialization || '');
      setDepartmentId(doctor.department?.id);
      setQualification(doctor.qualification || '');
      setExperienceYears(doctor.experienceYears || 0);
      setConsultationFee(doctor.consultationFee || 0);
      setRoomNumber(doctor.roomNumber || '');
      setBio(doctor.bio || '');
      setLicenseNumber(doctor.licenseNumber || '');
    }
  }, [doctor]);

  const handlePhotoSelect = (file: File | null | undefined) => {
    setPhotoError(null);
    if (!file) {
      setNewPhoto(null);
      setNewPhotoPreview(null);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Invalid image format. Allowed formats: JPG, JPEG, PNG, WebP.');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      setPhotoError('Image exceeds the maximum allowed size of 2 MB.');
      return;
    }

    setNewPhoto(file);
    const objectUrl = URL.createObjectURL(file);
    setNewPhotoPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('specialization', specialization);
      if (departmentId) formData.append('departmentId', String(departmentId));
      formData.append('qualification', qualification);
      formData.append('experienceYears', String(experienceYears));
      formData.append('consultationFee', String(consultationFee));
      formData.append('roomNumber', roomNumber);
      formData.append('bio', bio);

      if (newPhoto) {
        formData.append('profilePhoto', newPhoto);
      }

      await updateProfileMutation.mutateAsync(formData);
      toast('Professional profile updated successfully!', 'success');
      setNewPhoto(null);
      setNewPhotoPreview(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      toast(msg, 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your clinical profile..." />;
  }

  const currentPhoto = newPhotoPreview || doctor?.thumbnailPath || doctor?.imagePath;

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...(departments?.map((d) => ({
      value: String(d.id),
      label: d.name,
    })) || []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physician Professional Profile"
        subtitle="Public doctor credentials, consultation fees, and clinical room information shown to patients"
      />

      <Card className="max-w-4xl p-6 sm:p-8 border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Photo Section with Preview */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Profile Photo & Avatar
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Avatar
                src={currentPhoto}
                name={name || doctor?.user?.name}
                size="2xl"
                shape="rounded"
                version={doctor?.user?.updatedAt || (doctor as any)?.updatedAt}
                className="ring-4 ring-white shadow-md shrink-0"
              />

              <div className="flex-1 space-y-2 w-full">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handlePhotoSelect(e.dataTransfer.files?.[0]);
                  }}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-gray-300 hover:border-emerald-400 bg-white'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 pointer-events-none text-xs text-gray-600">
                    <UploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      {newPhoto ? newPhoto.name : 'Click or drag new photo to replace'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 pointer-events-none">
                    JPG, JPEG, PNG, or WebP &bull; Maximum 2 MB
                  </p>
                </div>

                {newPhotoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhoto(null);
                      setNewPhotoPreview(null);
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 underline inline-flex items-center gap-1"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                    Cancel new photo selection
                  </button>
                )}

                {photoError && <p className="text-xs text-rose-600">{photoError}</p>}
              </div>
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-gray-400" />}
              required
            />

            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
              placeholder="+1 (555) 019-2831"
            />
          </div>

          {/* Read-Only Medical License Number & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileBadge className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Medical License Number (Read-Only)</span>
                </label>
                <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3 text-gray-400" />
                  Locked
                </span>
              </div>
              <input
                type="text"
                value={licenseNumber || 'Not assigned'}
                disabled
                className="w-full h-10 rounded-lg border border-gray-200 bg-gray-100 px-3 text-xs text-gray-600 font-mono cursor-not-allowed select-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Official medical council license is verified upon registration and cannot be modified.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Clinical Department
              </label>
              <Select
                value={departmentId ? String(departmentId) : ''}
                onChange={(val) => setDepartmentId(val ? Number(val) : undefined)}
                options={departmentOptions}
                placeholder="Select Department"
              />
            </div>
          </div>

          {/* Specialization & Qualification & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Medical Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Interventional Cardiology, Spine Surgery"
              required
            />

            <Input
              label="Qualifications / Degrees"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. MD, FACC, MBBS"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Experience (Years)"
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              min={0}
              required
            />

            <Input
              label="Consultation Fee ($)"
              type="number"
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              min={0}
              required
            />
          </div>

          <Input
            label="Room / Clinic Wing Location"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. Suite 402, West Wing Floor 4"
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
              Doctor Professional Biography & Clinical Focus
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summary of medical expertise, research credentials, clinical experience..."
              className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              type="submit"
              isLoading={updateProfileMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Update Profile Information
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password Change */}
      <Card className="max-w-4xl p-6 sm:p-8 border-gray-200">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Account Security & Password</h3>
            <p className="text-xs text-gray-500">
              Update your clinical portal password. Minimum 8 characters with at least one letter and one number.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
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
                placeholder="Enter your current password"
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

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
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
      </Card>
    </div>
  );
};
