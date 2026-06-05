'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiPost } from '@/lib/api/client';

interface User {
  userId: string;
  email: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    const id = localStorage.getItem('user_id');

    if (token && email && id) {
      setIsAuthenticated(true);
      setUser({ userId: id, email });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // Handle automatic redirects
  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    
    if (!isAuthenticated && !isAuthPage) {
      router.push('/login');
    } else if (isAuthenticated && isAuthPage) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiPost('/auth/login', { email, password });
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.detail || 'Login failed' };
      }
      
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('user_email', data.email);
      localStorage.setItem('user_id', data.user_id);
      
      setUser({ userId: data.user_id, email: data.email });
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Connection failed. Please check if the server is running.' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiPost('/auth/signup', { email, password });
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.detail || 'Signup failed' };
      }
      
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('user_email', data.email);
      localStorage.setItem('user_id', data.user_id);
      
      setUser({ userId: data.user_id, email: data.email });
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, error: 'Connection failed. Please check if the server is running.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
