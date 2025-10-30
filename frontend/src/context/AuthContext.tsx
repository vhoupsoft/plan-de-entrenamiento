import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

type User = {
  id: number;
  nombre?: string;
  usuario?: string;
  esAlumno?: boolean;
  esEntrenador?: boolean;
  roles?: string[];
};

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    // read user and token from localStorage on init
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    if (u) {
      try {
        setUserState(JSON.parse(u));
      } catch (e) {
        setUserState(null);
      }
    }
  }, []);

  const setUser = (u: User | null) => {
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
    setUserState(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUserState(null);
  };

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
