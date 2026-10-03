import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { DoctorLoginPage } from '@/pages/doctor/DoctorLoginPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage';
import { AdminDoctorRequestsPage } from '@/pages/admin/AdminDoctorRequestsPage';
import { AdminPatientsPage } from '@/pages/admin/AdminPatientsPage';
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage';
import { AdminAppointmentsPage } from '@/pages/admin/AdminAppointmentsPage';
import { AdminFeedbackPage } from '@/pages/admin/AdminFeedbackPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

// Doctor Pages
import { DoctorDashboardPage } from '@/pages/doctor/DoctorDashboardPage';
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage';
import { DoctorReviewsPage } from '@/pages/doctor/DoctorReviewsPage';
import { DoctorSchedulePage } from '@/pages/doctor/DoctorSchedulePage';
import { DoctorPatientsPage } from '@/pages/doctor/DoctorPatientsPage';
import { DoctorProfilePage } from '@/pages/doctor/DoctorProfilePage';

// Patient Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientAppointmentsPage } from '@/pages/patient/PatientAppointmentsPage';
import { DoctorsBrowsePage } from '@/pages/patient/DoctorsBrowsePage';

// Notifications Page (Shared across all roles)
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';

// Layouts & Route Guards
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DoctorLayout } from '@/components/layout/DoctorLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages - Exactly TWO Auth Portals */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />
      <Route path="/doctor/login" element={<DoctorLoginPage />} />

      {/* Patient / Normal User Portal */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['patient']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="doctors" element={<DoctorsBrowsePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Doctor Clinical Portal */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['doctor']}>
              <DoctorLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="reviews" element={<DoctorReviewsPage />} />
        <Route path="schedule" element={<DoctorSchedulePage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
        <Route path="settings" element={<DoctorProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="doctor-requests" element={<AdminDoctorRequestsPage />} />
        <Route path="patients" element={<AdminPatientsPage />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="feedback" element={<AdminFeedbackPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
