import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Briefcase,
  GraduationCap,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UploadCloud,
  FileBadge,
  MapPin,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useDepartments } from '@/features/departments/hooks/useDepartments';

export const DoctorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { doctorLogin, doctorRegister, isLoading } = useAuth();
  const { toast } = useToast();
  const { data: departments } = useDepartments();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    tabParam === 'register' ? 'register' : 'login'
  );

  useEffect(() => {
    if (tabParam === 'register' && activeTab !== 'register') {
      setActiveTab('register');
    } else if (tabParam === 'login' && activeTab !== 'login') {
      setActiveTab('login');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setSearchParams(tab === 'register' ? { tab: 'register' } : {});
    setErrorMessage(null);
    setStatusInfo(null);
  };

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state (Doctors only)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [specialization, setSpecialization] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>(5);
  const [consultationFee, setConsultationFee] = useState<number | ''>(100);
  const [bio, setBio] = useState('');

  // Two mandatory registration credential fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<{
    type: 'pending' | 'rejected' | 'inactive';
    message: string;
  } | null>(null);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  // Quick fill helper for testing approved doctor
  const handleFillDoctorDemo = () => {
    setLoginEmail('dr.sarah@medicare.com');
    setLoginPassword('Doctor123!');
    setErrorMessage(null);
    setStatusInfo(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusInfo(null);

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please enter both doctor email and password.');
      return;
    }

    try {
      await doctorLogin({ email: loginEmail, password: loginPassword });
      toast('Welcome to the Doctor Clinical Portal', 'success');
      navigate('/doctor/dashboard', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      const msg: string = err.response?.data?.message || err.message || 'Login failed.';

      // Check status checks returned from server
      if (status === 403) {
        if (msg.toLowerCase().includes('pending')) {
          setStatusInfo({ type: 'pending', message: msg });
        } else if (msg.toLowerCase().includes('reject')) {
          setStatusInfo({ type: 'rejected', message: msg });
        } else {
          setStatusInfo({ type: 'inactive', message: msg });
        }
      } else {
        // Generic error message for wrong password, non-existent user, or wrong portal (patient/admin)
        setErrorMessage(msg);
        toast(msg, 'error');
      }
    }
  };

  const handlePhotoSelect = (file: File | null | undefined) => {
    setPhotoError(null);
    if (!file) {
      setProfilePhoto(null);
      setPhotoPreview(null);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Invalid image format. Allowed formats: JPG, JPEG, PNG, WebP.');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      setPhotoError('Profile photo exceeds the maximum size limit of 2 MB.');
      return;
    }

    setProfilePhoto(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleLicenseChange = (value: string) => {
    setLicenseNumber(value);
    setLicenseError(null);
    const trimmed = value.trim();
    if (trimmed && !/^[A-Za-z0-9\-\/]{5,30}$/.test(trimmed)) {
      setLicenseError('Must be 5-30 characters (letters, numbers, hyphens, and slashes only).');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLicenseError(null);
    setPhotoError(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please provide your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // License number validation
    const trimmedLicense = licenseNumber.trim();
    if (!trimmedLicense) {
      setLicenseError('Medical license number is required.');
      setErrorMessage('Please enter your official medical license number.');
      return;
    }

    if (!/^[A-Za-z0-9\-\/]{5,30}$/.test(trimmedLicense)) {
      setLicenseError('License number must be 5-30 characters containing only letters, numbers, hyphens, and slashes.');
      setErrorMessage('Invalid medical license number format.');
      return;
    }

    // Profile photo validation
    if (!profilePhoto) {
      setPhotoError('Profile photo is required (max 2 MB).');
      setErrorMessage('Please upload your professional profile photo.');
      return;
    }

    if (!specialization.trim()) {
      setErrorMessage('Please enter your primary medical specialization.');
      return;
    }

    if (!clinicAddress.trim()) {
      setErrorMessage('Please enter your clinic or practice address.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      if (phone.trim()) formData.append('phone', phone.trim());
      if (departmentId) formData.append('departmentId', String(departmentId));
      formData.append('specialization', specialization.trim());
      formData.append('clinicAddress', clinicAddress.trim());
      formData.append('roomNumber', clinicAddress.trim());
      formData.append('location', clinicAddress.trim());
      formData.append('qualification', qualification.trim() || 'MD / MBBS');
      formData.append('licenseNumber', trimmedLicense);
      formData.append('experienceYears', String(experienceYears || 0));
      formData.append('consultationFee', String(consultationFee || 0));
      if (bio.trim()) formData.append('bio', bio.trim());
      formData.append('profilePhoto', profilePhoto);

      await doctorRegister(formData);
      setRegistrationSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Doctor application failed.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  // If application was just submitted, display confirmation view
  if (registrationSubmitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <Card className="p-8 text-center bg-slate-800 border-teal-500/40 text-white shadow-2xl">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Doctor Application Submitted!</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Thank you, <span className="font-semibold text-teal-300">{name}</span>. Your clinical credentials have
              been submitted to Medi-Care. In compliance with platform medical credentialing, your account is currently{' '}
              <span className="font-bold text-amber-400">Pending Administrative Approval</span>.
            </p>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                What happens next?
              </p>
              <p className="text-slate-300">1. Platform Administration verifies your medical license and practice credentials.</p>
              <p className="text-slate-300">2. Upon review, your provider account will be transitioned to Approved.</p>
              <p className="text-slate-300">3. You can then log in using your email and password to manage your practice.</p>
            </div>

            <Button
              onClick={() => {
                setRegistrationSubmitted(false);
                handleTabChange('login');
              }}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold"
            >
              Return to Doctor Login
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Medi<span className="text-teal-400">Care</span>
          </span>
        </Link>
        <div className="inline-block px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-2">
          Physician & Provider Portal
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {activeTab === 'login' ? 'Doctor Clinical Sign In' : 'Register as a Healthcare Provider'}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {activeTab === 'login'
            ? 'Manage appointments, patient history, and weekly schedules'
            : 'Register your medical credentials to receive patient consultation bookings'}
        </p>
      </div>

      <div className={`mt-8 sm:mx-auto sm:w-full transition-all duration-300 px-4 sm:px-0 ${activeTab === 'register' ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <Card className="p-7 sm:p-9 bg-slate-800/95 border-slate-700/80 shadow-2xl text-slate-100 rounded-2xl">
          {/* Tabs Navigation */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Doctor Login
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Doctor Registration
            </button>
          </div>

          {/* Pending / Rejected / Inactive Status Alert */}
          {statusInfo && (
            <div
              className={`mb-5 p-4 rounded-xl text-xs leading-relaxed border flex items-start gap-3 ${
                statusInfo.type === 'pending'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  : statusInfo.type === 'rejected'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                  : 'bg-slate-700/60 border-slate-600 text-slate-300'
              }`}
            >
              {statusInfo.type === 'pending' ? (
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold mb-1">
                  {statusInfo.type === 'pending'
                    ? 'Application Pending Review'
                    : statusInfo.type === 'rejected'
                    ? 'Application Not Approved'
                    : 'Account Deactivated'}
                </p>
                <p className="text-slate-300">{statusInfo.message}</p>
              </div>
            </div>
          )}

          {/* Generic Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-500/15 border border-rose-500/40 p-3.5 text-xs text-rose-300 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {/* TAB 1: DOCTOR LOGIN */}
          {activeTab === 'login' ? (
            <div>
              {/* Quick Fill Demo */}
              <div className="mb-5 p-2.5 rounded-lg bg-teal-950/60 border border-teal-800/60 flex items-center justify-between text-xs">
                <span className="text-teal-300 font-medium">Approved Doctor Demo:</span>
                <button
                  type="button"
                  onClick={handleFillDoctorDemo}
                  className="font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 hover:underline text-[11px]"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Auto-fill demo
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Doctor Email Address
                  </label>
                  <Input
                    variant="dark"
                    type="email"
                    placeholder="doctor@medicare.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Doctor Password
                  </label>
                  <Input
                    variant="dark"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2 bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/20"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Doctor Portal
                </Button>
              </form>
            </div>
          ) : (
            /* TAB 2: DOCTOR REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-6 text-slate-200">
              {/* Section 1: Account Information */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/60">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">1</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Provider & Account Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name & Title *</label>
                    <Input
                      variant="dark"
                      placeholder="Dr. Sarah Jenkins, MD"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Official Doctor Email *</label>
                    <Input
                      variant="dark"
                      type="email"
                      placeholder="dr.jenkins@medicare.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Password (min 6 characters) *</label>
                    <Input
                      variant="dark"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Contact Phone Number</label>
                    <Input
                      variant="dark"
                      placeholder="+1 (555) 019-2831"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Verification Credentials & Headshot Photo */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/60">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">2</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Credentials & Profile Headshot</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Medical License Number *
                    </label>
                    <Input
                      variant="dark"
                      placeholder="e.g. MED-CA-2024-1049"
                      value={licenseNumber}
                      onChange={(e) => handleLicenseChange(e.target.value)}
                      leftIcon={<FileBadge className="w-4 h-4 text-slate-400" />}
                      required
                    />
                    {licenseError ? (
                      <p className="text-[11px] text-rose-400 mt-1">{licenseError}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">Official national/state medical board ID</p>
                    )}
                  </div>

                  {/* Profile Photo Upload - Prominent & Professional */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Profile Headshot * <span className="text-[10px] text-slate-400 font-normal">(Max 2 MB)</span>
                    </label>
                    {photoPreview ? (
                      <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700">
                        <div className="relative shrink-0">
                          <img
                            src={photoPreview}
                            alt="Doctor Headshot Preview"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-teal-500/60 shadow-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-teal-500 text-slate-950 p-1.5 rounded-full shadow-md">
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                              {profilePhoto?.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {profilePhoto ? `${(profilePhoto.size / 1024).toFixed(0)} KB` : ''} • Image verified
                          </p>
                          <div className="mt-2.5 flex items-center gap-3">
                            <label className="text-xs font-medium text-teal-400 hover:text-teal-300 cursor-pointer hover:underline">
                              Change photo
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setProfilePhoto(null);
                                setPhotoPreview(null);
                              }}
                              className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(true);
                        }}
                        onDragLeave={() => setIsDraggingPhoto(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(false);
                          const file = e.dataTransfer.files?.[0];
                          handlePhotoSelect(file);
                        }}
                        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                          isDraggingPhoto
                            ? 'border-teal-400 bg-teal-500/10'
                            : 'border-slate-700 hover:border-teal-500/60 bg-slate-900/60 hover:bg-slate-900/80'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          required={!profilePhoto}
                        />
                        <div className="flex flex-col items-center justify-center gap-1 pointer-events-none py-1">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-0.5">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-200">
                            Upload Doctor Photo
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Drag & drop or browse (JPG, PNG, WebP)
                          </span>
                        </div>
                      </div>
                    )}
                    {photoError && <p className="text-[11px] text-rose-400 mt-1">{photoError}</p>}
                  </div>
                </div>
              </div>

              {/* Section 3: Practice, Specialty & Location */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/60">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">3</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Practice, Specialty & Location</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Department Affiliation *</label>
                    <Select
                      variant="dark"
                      value={departmentId ? String(departmentId) : ''}
                      onChange={(val) => setDepartmentId(val ? Number(val) : undefined)}
                      options={[
                        { value: '', label: 'Select Department' },
                        ...(departments?.map((d) => ({
                          value: String(d.id),
                          label: d.name,
                        })) || []),
                      ]}
                      placeholder="Select Department"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Specialization *</label>
                    <Input
                      variant="dark"
                      placeholder="e.g. Interventional Cardiology"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Clinic / Practice Address & Location *
                    </label>
                    <Input
                      variant="dark"
                      placeholder="e.g. Suite 402, Metro Health Center, 120 Medical Center Blvd, New York"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Independent clinic, practice office, or hospital room address visible to patients when scheduling visits.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Medical Qualification *</label>
                    <Input
                      variant="dark"
                      placeholder="MD, FACC, MBBS"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      leftIcon={<GraduationCap className="w-4 h-4 text-slate-400" />}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Experience (Yrs) *</label>
                      <Input
                        variant="dark"
                        type="number"
                        min={0}
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Consultation Fee ($) *</label>
                      <Input
                        variant="dark"
                        type="number"
                        min={0}
                        step="0.01"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value === '' ? '' : Number(e.target.value))}
                        leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Bio / Clinical Profile Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Brief clinical background, clinical interests, certifications, and affiliations..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 p-3 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Platform Provider Verification:</strong> All healthcare provider registrations undergo administrative credential review before appointment bookings are activated.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/20"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit Provider Application
              </Button>
            </form>
          )}

          {/* Cross-Link to Patient Portal */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Looking for patient login?{' '}
              <Link
                to="/login"
                className="font-semibold text-teal-400 hover:text-teal-300 hover:underline inline-flex items-center gap-1"
              >
                Go to the Patient Portal &rarr;
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
