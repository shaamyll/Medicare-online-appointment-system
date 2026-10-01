import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  User,
  Settings,
  LogOut,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const DoctorLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
    { label: 'Schedule', href: '/doctor/schedule', icon: Clock },
    { label: 'Patients', href: '/doctor/patients', icon: Users },
    { label: 'Profile', href: '/doctor/profile', icon: User },
    { label: 'Settings', href: '/doctor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Medi<span className="text-teal-600">Care</span>
            </span>
            <span className="ml-2.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-50 text-teal-700 border border-teal-200">
              Doctor Clinical Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900">{user?.name}</span>
            <span className="text-[11px] text-teal-600 font-medium">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
          <div className="p-4 space-y-6">
            <div className="px-3 py-2 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center gap-2 text-xs text-teal-800 font-medium">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Verified Physician Portal</span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/doctor/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Clinical Workspace</span>
            <span className="h-2 w-2 rounded-full bg-teal-500 inline-block"></span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
