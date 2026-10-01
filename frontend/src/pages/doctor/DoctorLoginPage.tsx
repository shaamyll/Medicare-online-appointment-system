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
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>(5);
  const [consultationFee, setConsultationFee] = useState<number | ''>(100);
  const [bio, setBio] = useState('');

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please provide your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!specialization.trim()) {
      setErrorMessage('Please enter your primary medical specialization.');
      return;
    }

    try {
      await doctorRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        specialization: specialization.trim(),
        qualification: qualification.trim() || 'MD / MBBS',
        experienceYears: Number(experienceYears) || 0,
        consultationFee: Number(consultationFee) || 0,
        bio: bio.trim() || undefined,
      });

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
              been submitted to Medi-Care. In compliance with hospital governance, your account is currently{' '}
              <span className="font-bold text-amber-400">Pending Administrative Approval</span>.
            </p>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                What happens next?
              </p>
              <p className="text-slate-300">1. Hospital Administration verifies your license and department affiliation.</p>
              <p className="text-slate-300">2. Upon review, your doctor account will be transitioned to Approved.</p>
              <p className="text-slate-300">3. You can then log in using your email and password to start consulting.</p>
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
          Physician & Clinical Portal
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {activeTab === 'login' ? 'Doctor Clinical Sign In' : 'Join as a Medical Specialist'}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {activeTab === 'login'
            ? 'Manage appointments, patient history, and weekly schedules'
            : 'Register your medical credentials for hospital appointment booking'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="p-7 sm:p-8 bg-slate-800/95 border-slate-700/80 shadow-2xl text-slate-100">
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
                    type="email"
                    placeholder="doctor@medicare.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Doctor Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
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
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name & Title *</label>
                  <Input
                    placeholder="Dr. Sarah Jenkins, MD"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Official Email *</label>
                  <Input
                    type="email"
                    placeholder="dr.jenkins@medicare.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 6) *</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                  <Input
                    placeholder="+1 555-019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-700/60">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department Affiliation *</label>
                  <select
                    value={departmentId || ''}
                    onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Specialization *</label>
                  <Input
                    placeholder="e.g. Interventional Cardiology"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Qualification *</label>
                  <Input
                    placeholder="MD, FACC"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    leftIcon={<GraduationCap className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Experience (Yrs) *</label>
                  <Input
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fee ($) *</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value === '' ? '' : Number(e.target.value))}
                    leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/70 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bio / Profile Summary</label>
                <textarea
                  rows={2}
                  placeholder="Brief clinical background, specialties, and hospital achievements..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-200">
                Notice: All doctor applications undergo administrative review before clinical access is granted.
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/20"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit Doctor Application
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
