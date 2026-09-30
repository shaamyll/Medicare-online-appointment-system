import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="appointments" element={<DashboardPage />} />
        <Route path="doctors" element={<DashboardPage />} />
        <Route path="schedules" element={<DashboardPage />} />
        <Route path="patients" element={<DashboardPage />} />
        <Route path="departments" element={<DashboardPage />} />
        <Route path="staff-tasks" element={<DashboardPage />} />
        <Route path="notifications" element={<DashboardPage />} />
        <Route path="reports" element={<DashboardPage />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
