import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  LoginCredentials,
  RegisterData,
  PatientRegisterData,
  DoctorRegisterData,
  AuthResponse,
} from '@/features/auth/types/auth.types';
import { authApi } from '@/features/auth/api/authApi';
import { queryKeys } from '@/lib/queryKeys';
import { socketClient } from '@/lib/socket';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  doctorLogin: (credentials: LoginCredentials) => Promise<User>;
  register: (data: PatientRegisterData | RegisterData) => Promise<User>;
  doctorRegister: (data: DoctorRegisterData | FormData) => Promise<AuthResponse>;
  logout: (redirect?: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medicare_token'));
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Clean up any legacy user object from localStorage; only token may stay in storage
  useEffect(() => {
    localStorage.removeItem('medicare_user');
  }, []);

  // Single Source of Truth for authenticated user via React Query
  const {
    data: authData,
    isLoading: isQueryLoading,
    refetch,
    error: authError,
  } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.me,
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Handle auth error (token invalid/expired)
  useEffect(() => {
    if (authError) {
      localStorage.removeItem('medicare_token');
      localStorage.removeItem('medicare_user');
      setToken(null);
      queryClient.setQueryData(queryKeys.auth.me, null);
    }
  }, [authError, queryClient]);

  const user = authData?.user ?? null;
  const profile = authData?.profile ?? null;
  const isAuthenticated = !!token && !!user;
  const isLoading = (!!token && isQueryLoading) || isActionLoading;

  const refreshUser = useCallback(async () => {
    if (token) {
      await refetch();
    }
  }, [token, refetch]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsActionLoading(true);
    try {
      const res = await authApi.login(credentials);
      localStorage.setItem('medicare_token', res.token);
      setToken(res.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: res.user, profile: res.profile });
      return res.user;
    } finally {
      setIsActionLoading(false);
    }
  };

  const doctorLogin = async (credentials: LoginCredentials): Promise<User> => {
    setIsActionLoading(true);
    try {
      const res = await authApi.doctorLogin(credentials);
      localStorage.setItem('medicare_token', res.token);
      setToken(res.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: res.user, profile: res.profile });
      return res.user;
    } finally {
      setIsActionLoading(false);
    }
  };

  const register = async (data: PatientRegisterData | RegisterData): Promise<User> => {
    setIsActionLoading(true);
    try {
      const res = await authApi.register(data);
      localStorage.setItem('medicare_token', res.token);
      setToken(res.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: res.user, profile: res.profile });
      return res.user;
    } finally {
      setIsActionLoading(false);
    }
  };

  const doctorRegister = async (data: DoctorRegisterData | FormData): Promise<AuthResponse> => {
    setIsActionLoading(true);
    try {
      const res = await authApi.doctorRegister(data);
      return res;
    } finally {
      setIsActionLoading(false);
    }
  };

  const logout = (redirect: boolean = true) => {
    const isDoctorPortal = window.location.pathname.startsWith('/doctor');
    localStorage.removeItem('medicare_token');
    localStorage.removeItem('medicare_user');
    setToken(null);
    socketClient.disconnect();
    queryClient.clear();

    if (redirect) {
      window.location.href = isDoctorPortal ? '/doctor/login' : '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated,
        isLoading,
        login,
        doctorLogin,
        register,
        doctorRegister,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
