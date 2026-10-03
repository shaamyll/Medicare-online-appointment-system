import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  UserCheck,
  Users,
  Building2,
  Calendar,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { cn } from '@/lib/utils';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Doctor Requests', href: '/admin/doctor-requests', icon: UserCheck },
    { label: 'Patients', href: '/admin/patients', icon: Users },
    { label: 'Departments', href: '/admin/departments', icon: Building2 },
    { label: 'Appointments', href: '/admin/appointments', icon: Calendar },
    { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-full overflow-hidden flex bg-gray-100">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Full-Height Sidebar */}
      <aside
        className={cn(
          'w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out shrink-0 z-50 shadow-md',
          'fixed inset-y-0 left-0 lg:static lg:translate-x-0 h-full',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand / Admin Portal Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-xs">
              M
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">
                Medi<span className="text-emerald-400">Care</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Administration
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Badge */}
        <div className="p-4 pb-2 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-300 font-medium">
            <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Full System Oversight</span>
          </div>
        </div>

        {/* Internal Scrollable Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/admin/dashboard'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors select-none',
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive ? 'text-slate-950' : 'text-slate-400'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {typeof (item as any).badge === 'number' && (item as any).badge > 0 && (
                        <span
                          className={cn(
                            'ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold',
                            isActive
                              ? 'bg-slate-950 text-emerald-400'
                              : 'bg-rose-600 text-white'
                          )}
                        >
                          {(item as any).badge > 99 ? '99+' : (item as any).badge}
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
        <div className="p-4 border-t border-slate-800 shrink-0 mt-auto bg-slate-900">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden bg-gray-100">
        {/* Sticky Top Header */}
        <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{user?.name || 'Administrator'}</span>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 ml-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* The ONLY scrolling region */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 sm:p-6 lg:p-8 bg-gray-100">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
};
