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
    // read token from localStorage and validate by calling /auth/me
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Always refresh user from server to get latest roles
      api
        .get('/auth/me')
        .then((res) => {
          if (res.data && res.data.user) {
            setUserState(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch((err) => {
          // token invalid or other error -> clear
          console.warn('auth/me failed, clearing token', err?.response?.data);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          setUserState(null);
        });
    } else {
      const u = localStorage.getItem('user');
      if (u) {
        try {
          setUserState(JSON.parse(u));
        } catch (e) {
          setUserState(null);
        }
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
