import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, LogOut, User as UserIcon, Calendar } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Medi<span className="text-emerald-600">Care</span>
            </span>
            <span className="block text-[10px] font-medium text-slate-500 -mt-1 tracking-wider uppercase">
              Online Appointment System
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link
                to={getDashboardPath()}
                className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">{user.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-500 hover:text-rose-600 p-1.5 ml-1"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} leftIcon={<UserIcon className="w-4 h-4" />}>
                Book Appointment
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
