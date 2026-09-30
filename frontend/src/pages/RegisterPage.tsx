import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  
  // Patient fields
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Doctor fields
  const [specialization, setSpecialization] = useState('General Medicine');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        role,
        phone,
        gender: role === 'patient' ? gender : undefined,
        dateOfBirth: role === 'patient' ? dateOfBirth : undefined,
        bloodGroup: role === 'patient' ? bloodGroup : undefined,
        specialization: role === 'doctor' ? specialization : undefined,
      });

      toast('Account created successfully!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            Medi<span className="text-emerald-600">Care</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="p-8 border-slate-200/90 shadow-md">
          {/* Account Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Register as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-2.5 px-4 rounded-lg border text-sm font-semibold transition-all ${
                  role === 'patient'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Patient Account
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`py-2.5 px-4 rounded-lg border text-sm font-semibold transition-all ${
                  role === 'doctor'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Doctor Profile
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password (min 6 characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 012-3456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            {/* Role-specific fields */}
            {role === 'patient' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {role === 'doctor' && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-6"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
