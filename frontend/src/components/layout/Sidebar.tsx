import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  UserRound,
  ShieldCheck,
  LogOut,
  Stethoscope,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  onLogoutClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onClose,
  onLogoutClick,
}) => {
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
    },
    {
      label: 'Find Doctors',
      href: '/dashboard/doctors',
      icon: UserRound,
    },
  ];

  return (
    <aside
      className={cn(
        'w-64 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 ease-in-out shrink-0 z-50',
        'fixed inset-y-0 left-0 lg:static lg:translate-x-0 h-full',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}
    >
      {/* Brand Header on Mobile */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Medi<span className="text-emerald-600">Care</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Identity Tag */}
      <div className="p-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Patient Portal</span>
        </div>
      </div>

      {/* Navigation List - Scrolls internally */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
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

      {/* Pinned Bottom Logout Area */}
      <div className="p-4 border-t border-slate-100 shrink-0 mt-auto bg-white">
        <button
          type="button"
          onClick={onLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
