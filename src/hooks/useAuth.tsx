import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in from localStorage
    const adminSession = localStorage.getItem('cft-admin-session');
    if (adminSession) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data: admin, error } = await supabase
        .from('admin')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !admin) {
        return { success: false, error: 'Invalid credentials' };
      }

      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      localStorage.setItem('cft-admin-session', JSON.stringify({
        id: admin.id,
        username: admin.username,
        loginTime: new Date().toISOString()
      }));

      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('cft-admin-session');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};