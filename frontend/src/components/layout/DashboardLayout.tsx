import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, LogOut, Stethoscope, Activity, User, ChevronDown } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-gray-100">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogoutClick={() => setShowLogoutModal(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden bg-gray-100">
        {/* Sticky Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile App Name and Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-gray-900">
                Medi<span className="text-emerald-600">Care</span>
              </span>
            </div>

            {/* Desktop Station Badge (matching Doctor & Admin) */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>Patient Consultation Center</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Header User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors focus:outline-none"
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                <Avatar
                  name={user?.name}
                  size="sm"
                  shape="circle"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-gray-500" />
                    <span>My Profile</span>
                  </Link>

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
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
