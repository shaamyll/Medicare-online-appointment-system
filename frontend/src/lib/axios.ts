import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { queryClient } from './queryClient';
import { showToast } from '@/components/ui/Toast';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token & support FormData
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('medicare_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global 401 Unauthorized & 403 Deactivated Account
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.message || '';

    const isDeactivatedOrInactive =
      status === 403 &&
      (errorMsg.toLowerCase().includes('not active') ||
        errorMsg.toLowerCase().includes('deactivated') ||
        errorMsg.toLowerCase().includes('inactive') ||
        errorMsg.toLowerCase().includes('rejected') ||
        errorMsg.toLowerCase().includes('account'));

    const isAuthAttempt =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/doctor/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/doctor/register');

    if (!isAuthAttempt && (status === 401 || isDeactivatedOrInactive)) {
      localStorage.removeItem('medicare_token');
      localStorage.removeItem('medicare_user');
      queryClient.clear();
      showToast('Your session has ended or your account is no longer active', 'error');

      const isDoctorRoute = window.location.pathname.startsWith('/doctor');
      const loginPath = isDoctorRoute ? '/doctor/login' : '/login';
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = `${loginPath}?expired=true`;
        }, 150);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
