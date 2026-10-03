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
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';

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
  const { data: unreadCount = 0 } = useUnreadCount();

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
    {
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      badge: unreadCount,
    },
  ];

  return (
    <aside
      className={cn(
        'w-64 border-r border-gray-200 bg-white flex flex-col transition-transform duration-200 ease-in-out shrink-0 z-50 shadow-sm',
        'fixed inset-y-0 left-0 lg:static lg:translate-x-0 h-full',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}
    >
      {/* Brand / Portal Header */}
      <div className="h-16 px-5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Medi<span className="text-emerald-600">Care</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Patient Portal
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role Identity Tag */}
      <div className="p-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Verified Patient Account</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
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
                    'flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors select-none',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive ? 'text-emerald-700' : 'text-gray-500'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={cn(
                          'ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold',
                          isActive
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : 'bg-rose-600 text-white'
                        )}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Pinned Bottom Logout Area */}
      <div className="p-4 border-t border-gray-200 shrink-0 mt-auto bg-white">
        <button
          type="button"
          onClick={onLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
