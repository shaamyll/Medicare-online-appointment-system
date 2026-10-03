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
    <div className="h-screen w-full overflow-hidden flex bg-slate-100">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Full-Height Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Admin Portal Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black shadow">
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Badge */}
        <div className="p-4 pb-2 shrink-0">
          <div className="px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-300 font-medium">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Full System Oversight</span>
          </div>
        </div>

        {/* Internal Scrollable Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/90 hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {typeof (item as any).badge === 'number' && (item as any).badge > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-slate-950 text-emerald-400' : 'bg-rose-600 text-white'
                          }`}
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
        {/* Sticky Top Header */}
        <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* The ONLY scrolling region */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 sm:p-6 lg:p-8">
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
