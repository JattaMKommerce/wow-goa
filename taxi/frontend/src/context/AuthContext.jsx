import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRoleState] = useState(() => {
    return localStorage.getItem('active_role') || user?.role || 'FLEET_ADMIN';
  });

  const setActiveRole = (role) => {
    localStorage.setItem('active_role', role);
    setActiveRoleState(role);
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('auth/login/', { username, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('active_role', userData.role || 'FLEET_ADMIN');

      setToken(access);
      setUser(userData);
      setActiveRoleState(userData.role || 'FLEET_ADMIN');
      return { success: true, user: userData };
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.detail || 'Authentication failed. Please check credentials.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('active_role');
    setToken(null);
    setUser(null);
    setActiveRoleState('FLEET_ADMIN');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, activeRole, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
