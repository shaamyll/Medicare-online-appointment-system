import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useDepartments } from '@/features/departments/hooks/useDepartments';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const { data: departments } = useDepartments();

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Patient fields
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Doctor fields
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [specialization, setSpecialization] = useState('General Medicine');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [consultationFee, setConsultationFee] = useState(80);
  const [bio, setBio] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [doctorRegistrationSubmitted, setDoctorRegistrationSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        phone,
      };

      if (role === 'patient') {
        payload.gender = gender;
        payload.dateOfBirth = dateOfBirth;
        payload.bloodGroup = bloodGroup;
      } else if (role === 'doctor') {
        payload.departmentId = departmentId;
        payload.specialization = specialization;
        payload.qualification = qualification || 'MD, General Medicine';
        payload.experienceYears = Number(experienceYears);
        payload.consultationFee = Number(consultationFee);
        payload.bio = bio;
      }

      await register(payload);

      if (role === 'doctor') {
        setDoctorRegistrationSubmitted(true);
      } else {
        toast('Account created successfully!', 'success');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  if (doctorRegistrationSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <Card className="p-8 text-center border-emerald-200 shadow-md">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Doctor Application Submitted!</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{name}</span>. Your application to join
              the medical staff has been safely submitted. In accordance with healthcare standards, your profile is
              currently <span className="font-bold text-amber-600">Pending Administrative Approval</span>.
            </p>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left mb-6 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Next Steps:
              </p>
              <p>1. The Hospital Administrator verifies your credentials and department affiliation.</p>
              <p>2. Once verified, your status will change to Approved.</p>
              <p>3. You can then log in with your email and password to access the Doctor Portal.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/login')} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Return to Login
              </Button>
              <Link to="/" className="text-xs text-slate-500 hover:text-slate-800">
                &larr; Back to Homepage
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Card className="p-8 border-slate-200/90 shadow-md">
          {/* Account Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Registration Type:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-center ${
                  role === 'patient'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Patient Account
                <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Book doctor appointments</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-center ${
                  role === 'doctor'
                    ? 'border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Doctor Profile
                <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Subject to admin verification</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder={role === 'doctor' ? 'e.g. Dr. Alex Morgan, MD' : 'e.g. John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder={role === 'doctor' ? 'alex.morgan@hospital.com' : 'john@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password (min 6 characters)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Phone Number"
                placeholder="+1 (555) 012-3456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Role-Specific Fields */}
            {role === 'patient' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              /* Doctor Registration Extended Details */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Department Affiliation *
                    </label>
                    <select
                      value={departmentId || ''}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
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

                  <Input
                    label="Specialization *"
                    placeholder="e.g. Pediatric Cardiology, Spine Orthopedics"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Qualification *"
                    placeholder="e.g. MD, MBBS, FACS"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    required
                  />

                  <Input
                    label="Years of Experience *"
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    required
                  />

                  <Input
                    label="Consultation Fee ($) *"
                    type="number"
                    min={0}
                    step="0.01"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Short Medical Bio / Experience Overview
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of clinical training, hospital affiliations, and specialties..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className={`w-full mt-6 ${role === 'doctor' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {role === 'doctor' ? 'Submit Doctor Application' : 'Create Patient Account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
