import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterData } from '@/features/auth/types/auth.types';
import { authApi } from '@/features/auth/api/authApi';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('medicare_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('medicare_token');
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data.user);
      setProfile(data.profile);
      localStorage.setItem('medicare_user', JSON.stringify(data.user));
    } catch (err) {
      console.warn('Authentication check failed:', err);
      localStorage.removeItem('medicare_token');
      localStorage.removeItem('medicare_user');
      setUser(null);
      setProfile(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      localStorage.setItem('medicare_token', res.token);
      localStorage.setItem('medicare_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      localStorage.setItem('medicare_token', res.token);
      localStorage.setItem('medicare_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('medicare_token');
    localStorage.removeItem('medicare_user');
    setToken(null);
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
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
