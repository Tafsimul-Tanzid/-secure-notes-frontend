'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // JWT is stateless so logout just throws the token away on this side.
  // It stops working on the server once it expires anyway.
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // restore the session on page load
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('GET', '/api/auth/me')
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  async function login(email, password) {
    const data = await api('POST', '/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(fields) {
    const data = await api('POST', '/api/auth/register', fields);
    setToken(data.token);
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
