import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Same signed login as the rest of WOW GOA (the existing login screens issue it).
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user') || localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) { return null; }
  });
  const [token, setToken] = useState(() => getAuthToken() || null);
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
      // Verified by the WOW GOA server (registered credentials); a signed token is stored by loginUser().
      const userData = await loginUser(username, password);
      const role = String(userData?.role || '').toLowerCase();
      const taxiRole = (role === 'driver' || role === 'chauffeur') ? 'DRIVER' : (role === 'dispatcher' ? 'DISPATCHER' : 'FLEET_ADMIN');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('active_role', taxiRole);
      setToken(getAuthToken() || null);
      setUser(userData);
      setActiveRoleState(taxiRole);
      return { success: true, user: userData };
    } catch (err) {
      console.error('Login error:', err);
      const message = err?.message || 'Authentication failed. Please check credentials.';
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
