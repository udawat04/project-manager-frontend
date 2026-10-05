'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  api,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  removeStoredRefreshToken,
  refreshAccessToken,
} from '@/lib/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  isMasterAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    let token = getStoredToken();

    // If no access token, but refresh token is present, attempt silent refresh first
    if (!token && getStoredRefreshToken()) {
      token = await refreshAccessToken();
    }

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      removeStoredToken();
      removeStoredRefreshToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen for session expiration events dispatched by api.ts
    const handleSessionExpired = () => {
      removeStoredToken();
      removeStoredRefreshToken();
      setUser(null);
      toast.error('Your session has expired. Please sign in again.');
      window.location.href = '/login';
    };

    window.addEventListener('projectvault_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('projectvault_session_expired', handleSessionExpired);
    };
  }, []);

  const login = (token: string, newUser: User, refreshToken?: string) => {
    setStoredToken(token);
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
    }
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      removeStoredToken();
      removeStoredRefreshToken();
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
