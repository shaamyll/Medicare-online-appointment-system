import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Stethoscope,
  GraduationCap,
  Award,
  DollarSign,
  MapPin,
  FileBadge,
  UploadCloud,
  X as CloseIcon,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useCreateDoctor } from '@/features/admin/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { AdminDoctor } from '@/features/admin/api/adminApi';

export interface DoctorCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doctor: AdminDoctor & { tempPassword: string }) => void;
}

export const DoctorCreateModal: React.FC<DoctorCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: departments } = useDepartments();
  const createDoctorMutation = useCreateDoctor();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | string>(0);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState<number | string>(0);
  const [bio, setBio] = useState('');

  // Photo
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoSelect = (file: File | null | undefined) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photo;
      return next;
    });

    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Invalid image format. Allowed: JPG, PNG, WebP.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image exceeds the maximum allowed size of 2 MB.' }));
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = 'Doctor name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errs.name = 'Name must be between 2 and 100 characters';
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
        errs.phone = 'Phone must contain 10 to 15 digits';
      }
    }

    const trimmedLicense = licenseNumber.trim();
    if (!trimmedLicense) {
      errs.licenseNumber = 'Medical license number is required';
    } else if (!/^[A-Za-z0-9\-\/]{5,30}$/.test(trimmedLicense)) {
      errs.licenseNumber = '5–30 characters, alphanumeric with hyphens or slashes only';
    }

    if (!specialization.trim()) {
      errs.specialization = 'Specialization is required';
    }

    if (!qualification.trim()) {
      errs.qualification = 'Medical qualification is required';
    }

    if (Number(experienceYears) < 0) {
      errs.experienceYears = 'Experience must be 0 or greater';
    }

    if (Number(consultationFee) < 0) {
      errs.consultationFee = 'Fee must be 0 or greater';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      if (phone.trim()) formData.append('phone', phone.trim());
      if (departmentId) formData.append('department_id', departmentId);
      formData.append('specialization', specialization.trim());
      formData.append('qualification', qualification.trim());
      formData.append('experience', String(Number(experienceYears) || 0));
      formData.append('consultation_fee', String(Number(consultationFee) || 0));
      formData.append('license_number', licenseNumber.trim());
      if (roomNumber.trim()) formData.append('room_number', roomNumber.trim());
      if (bio.trim()) formData.append('bio', bio.trim());

      if (photo) {
        formData.append('photo', photo);
      }

      const created = await createDoctorMutation.mutateAsync(formData);
      toast('Doctor created and activated successfully', 'success');
      onSuccess(created);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to create doctor';
      const status = err?.response?.status;

      if (status === 409) {
        if (serverMsg.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: serverMsg }));
          return;
        }
        if (serverMsg.toLowerCase().includes('license')) {
          setErrors((prev) => ({ ...prev, licenseNumber: serverMsg }));
          return;
        }
      }

      toast(serverMsg, 'error');
    }
  };

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...(departments?.map((d) => ({
      value: String(d.id),
      label: d.name,
    })) || []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Doctor"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-6">
          {/* Section 1: Basic Account Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-1 border-b border-gray-100">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Basic Information</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="Dr. Sarah Jenkins, MD"
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
                label="Login Email Address *"
                type="email"
                placeholder="dr.jenkins@medicare.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                placeholder="+1 (555) 234-5678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                error={errors.phone}
                leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <Select
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  options={departmentOptions}
                  placeholder="Select Clinical Department"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Professional & Credentials */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-1 border-b border-gray-100">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>Professional Credentials</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Medical Specialization *"
                placeholder="e.g. Interventional Cardiology"
                value={specialization}
                onChange={(e) => {
                  setSpecialization(e.target.value);
                  if (errors.specialization) setErrors((prev) => ({ ...prev, specialization: '' }));
                }}
                error={errors.specialization}
                leftIcon={<Stethoscope className="w-4 h-4 text-gray-400" />}
                required
              />

              <Input
                label="Medical Qualifications *"
                placeholder="e.g. MBBS, MD, FACC"
                value={qualification}
                onChange={(e) => {
                  setQualification(e.target.value);
                  if (errors.qualification) setErrors((prev) => ({ ...prev, qualification: '' }));
                }}
                error={errors.qualification}
                leftIcon={<GraduationCap className="w-4 h-4 text-gray-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Medical License Number *"
                placeholder="e.g. MD-98214/CA"
                value={licenseNumber}
                onChange={(e) => {
                  setLicenseNumber(e.target.value);
                  if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }));
                }}
                error={errors.licenseNumber}
                leftIcon={<FileBadge className="w-4 h-4 text-gray-400" />}
                required
              />

              <Input
                label="Clinic / Room Location"
                placeholder="e.g. Suite 402, West Wing"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Experience (Years)"
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                error={errors.experienceYears}
                leftIcon={<Award className="w-4 h-4 text-gray-400" />}
              />

              <Input
                label="Consultation Fee ($)"
                type="number"
                min={0}
                step="0.01"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                error={errors.consultationFee}
                leftIcon={<DollarSign className="w-4 h-4 text-gray-400" />}
              />
            </div>
          </div>

          {/* Section 3: Profile Photo & Bio */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-1 border-b border-gray-100">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Profile & Biography</span>
            </h4>

            {/* Photo Upload with Preview */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Doctor Profile Photo (Optional)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {photoPreview ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handlePhotoSelect(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600 transition-colors"
                      title="Remove image"
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                    <User className="w-8 h-8" />
                  </div>
                )}

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
                  className={`flex-1 w-full border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors relative ${
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
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">
                      {photo ? photo.name : 'Upload portrait photo or leave empty for default'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 pointer-events-none">
                    JPG, PNG, or WebP &bull; Max 2 MB
                  </p>
                </div>
              </div>
              {errors.photo && <p className="text-xs text-rose-600 mt-2">{errors.photo}</p>}
            </div>

            {/* Bio with Character Counter */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Biography & Clinical Expertise
                </label>
                <span className="text-[11px] text-gray-400">
                  {bio.length} / 1000 characters
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Overview of medical expertise, research credentials, and clinical focus..."
                className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 bg-white sticky bottom-0">
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
              isLoading={createDoctorMutation.isPending}
            >
              Create Doctor
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
