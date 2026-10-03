import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  User,
  Settings,
  LogOut,
  Stethoscope,
  Menu,
  X,
  Activity,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';

export const DoctorLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
    { label: 'Schedule', href: '/doctor/schedule', icon: Clock },
    { label: 'Patients', href: '/doctor/patients', icon: Users },
    { label: 'Notifications', href: '/doctor/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', href: '/doctor/profile', icon: User },
    { label: 'Settings', href: '/doctor/settings', icon: Settings },
  ];

  const photoPath =
    profile?.thumbnail_path ||
    profile?.image_path ||
    profile?.thumbnailPath ||
    profile?.imagePath ||
    (user as any)?.thumbnailPath ||
    (user as any)?.imagePath ||
    (user as any)?.thumbnail_path ||
    (user as any)?.image_path;

  const photoVersion =
    (user as any)?.updatedAt ||
    (user as any)?.updated_at ||
    (profile as any)?.updatedAt ||
    (profile as any)?.updated_at;

  return (
    <div className="h-screen w-full overflow-hidden flex bg-slate-50">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Portal Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Medi<span className="text-teal-600">Care</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Doctor Portal
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor Identity in Sidebar */}
        <div className="p-4 pb-2 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100/80">
            <Avatar
              src={photoPath}
              name={user?.name}
              size="md"
              shape="rounded"
              version={photoVersion}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-teal-700 font-medium truncate">
                {profile?.specialization || 'Clinical Specialist'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrolls Internally if taller than screen */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/doctor/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
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
                            isActive ? 'bg-white text-teal-800' : 'bg-rose-600 text-white'
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

        {/* Pinned Logout Button at Bottom */}
        <div className="p-4 border-t border-slate-200 shrink-0 mt-auto bg-white">
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
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 hidden sm:flex">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Verified Clinical Station</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900">{user?.name}</span>
              <span className="text-[11px] text-teal-600 font-medium">{user?.email}</span>
            </div>
            <Avatar
              src={photoPath}
              name={user?.name}
              size="sm"
              shape="circle"
              version={photoVersion}
            />
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
