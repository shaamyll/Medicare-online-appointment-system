import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserRound,
  Building2,
  Clock,
  ClipboardList,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'patient';

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'patient', 'staff'],
    },
    {
      label: 'Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
      roles: ['admin', 'doctor', 'patient', 'staff'],
    },
    {
      label: 'Find Doctors',
      href: '/dashboard/doctors',
      icon: UserRound,
      roles: ['admin', 'patient'],
    },
    {
      label: 'Schedules & Slots',
      href: '/dashboard/schedules',
      icon: Clock,
      roles: ['admin', 'doctor'],
    },
    {
      label: 'Patients',
      href: '/dashboard/patients',
      icon: Users,
      roles: ['admin', 'doctor', 'staff'],
    },
    {
      label: 'Departments',
      href: '/dashboard/departments',
      icon: Building2,
      roles: ['admin'],
    },
    {
      label: 'Staff Tasks',
      href: '/dashboard/staff-tasks',
      icon: ClipboardList,
      roles: ['admin', 'staff'],
    },
    {
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      roles: ['admin', 'doctor', 'patient', 'staff'],
    },
    {
      label: 'Analytics & Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      roles: ['admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Role Identity Tag */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="capitalize">{role} Portal</span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon className="w-4 h-4 text-inherit" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Settings className="w-3.5 h-3.5" />
          <span>Medi-Care Core v1.0</span>
        </div>
      </div>
    </aside>
  );
};
