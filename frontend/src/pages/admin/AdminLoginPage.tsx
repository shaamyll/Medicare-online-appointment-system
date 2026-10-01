import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both admin email and password.');
      return;
    }

    try {
      await login({ email, password });
      
      // Verify user returned has admin role
      const storedUser = localStorage.getItem('medicare_user');
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      
      if (userObj?.role !== 'admin') {
        logout();
        setErrorMessage('Access denied. This login portal is restricted strictly to administrators.');
        toast('Access denied. Administrator privileges required.', 'error');
        return;
      }

      toast('Welcome to Admin Portal', 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Hospital Administration</h2>
        <p className="mt-2 text-xs text-slate-400">
          Authorized personnel only &bull; Central Control & Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 bg-slate-800/90 border-slate-700/80 shadow-2xl backdrop-blur">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@medicare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                className="bg-slate-900/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Secure Password
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                className="bg-slate-900/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Admin Portal
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <Link to="/login" className="hover:text-emerald-400 transition-colors">
              &larr; Patient & Doctor Portal
            </Link>
            <Link to="/" className="hover:text-emerald-400 transition-colors">
              Public Homepage
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
