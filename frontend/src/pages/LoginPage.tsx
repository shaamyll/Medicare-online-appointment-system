import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts = [
    { label: 'Admin', email: 'admin@medicare.local', password: 'password123', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { label: 'Doctor', email: 'doctor@medicare.local', password: 'password123', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Patient', email: 'patient@medicare.local', password: 'password123', color: 'bg-sky-50 border-sky-200 text-sky-700' },
    { label: 'Staff', email: 'staff@medicare.local', password: 'password123', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      await login({ email, password });
      toast('Signed in successfully!', 'success');
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  const handleFillDemo = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Or{' '}
          <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
            create a new patient account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 border-slate-200/90 shadow-md">
          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Test Account Fill:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleFillDemo(acc.email, acc.password)}
                  className={`text-[11px] font-semibold py-1 px-2 rounded border transition-all text-center ${acc.color} hover:opacity-85`}
                >
                  {acc.label}
                </button>
              ))}
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
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <div className="flex justify-end mt-1.5">
                <a href="#forgot" onClick={(e) => { e.preventDefault(); toast('Password reset link has been dispatched to email in production.', 'info'); }} className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
