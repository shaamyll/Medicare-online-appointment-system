import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();

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
  };

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state (Patients only)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regDateOfBirth, setRegDateOfBirth] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick fill helper for patient demo testing (strictly patient only - NO admin hint or mention)
  const handleFillPatientDemo = () => {
    setLoginEmail('patient@medicare.com');
    setLoginPassword('Patient123!');
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      const user = await login({ email: loginEmail, password: loginPassword });
      toast('Signed in successfully!', 'success');

      // Seamless role redirect:
      // Patients -> /dashboard (or redirect origin if valid)
      // Admins   -> /admin/dashboard
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname;
        const targetPath = from && !from.startsWith('/admin') && !from.startsWith('/doctor') ? from : '/dashboard';
        navigate(targetPath, { replace: true });
      }
    } catch (err: any) {
      // Backend returns identical generic message ("Invalid email or password.")
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please complete your name, email, and password.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
        gender: regGender,
        bloodGroup: regBloodGroup,
        dateOfBirth: regDateOfBirth || undefined,
      });

      toast('Welcome to Medi-Care! Account created.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            Medi<span className="text-emerald-600">Care</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {activeTab === 'login' ? 'Welcome back' : 'Create your patient account'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {activeTab === 'login'
            ? 'Sign in to access your appointments and health records'
            : 'Book appointments and consult verified doctors in minutes'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-7 sm:p-8 border-slate-200/90 shadow-md">
          {/* Tabs Navigation */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' ? (
            <div>
              {/* Quick Demo Fill (strictly patient) */}
              <div className="mb-5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Demo Patient:</span>
                <button
                  type="button"
                  onClick={handleFillPatientDemo}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 hover:underline text-[11px]"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Auto-fill demo
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  required
                />

                <Button
                  type="submit"
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </form>
            </div>
          ) : (
            /* TAB 2: REGISTER (PATIENTS ONLY) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <Input
                label="Full Name *"
                placeholder="e.g. Johnathan Doe"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="john@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password (min 6 chars) *"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  required
                />

                <Input
                  label="Phone Number"
                  placeholder="+1 555-0123"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                  <Select
                    value={regGender}
                    onChange={(val) => setRegGender(val)}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Blood Group</label>
                  <Select
                    value={regBloodGroup}
                    onChange={(val) => setRegBloodGroup(val)}
                    options={[
                      { value: 'A+', label: 'A+' },
                      { value: 'A-', label: 'A-' },
                      { value: 'B+', label: 'B+' },
                      { value: 'B-', label: 'B-' },
                      { value: 'AB+', label: 'AB+' },
                      { value: 'AB-', label: 'AB-' },
                      { value: 'O+', label: 'O+' },
                      { value: 'O-', label: 'O-' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regDateOfBirth}
                    onChange={(e) => setRegDateOfBirth(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Patient Account
              </Button>
            </form>
          )}

          {/* Cross-Link to Doctor Portal */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Are you a doctor?{' '}
              <Link
                to="/doctor/login"
                className="font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1"
              >
                Go to the Doctor Portal &rarr;
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
