import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'admin_auth_token';
const AUTH_EXPIRY_KEY = 'admin_auth_expiry';
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if token is valid on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        setState({ isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      // Token expired, clear it
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_EXPIRY_KEY);
    }

    setState({ isAuthenticated: false, isLoading: false, error: null });
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/admin?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const expiryTime = Date.now() + EXPIRY_DURATION;
        localStorage.setItem(AUTH_STORAGE_KEY, data.token);
        localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
        setState({ isAuthenticated: true, isLoading: false, error: null });
        return true;
      }

      setState({
        isAuthenticated: false,
        isLoading: false,
        error: data.error || 'Mot de passe incorrect',
      });
      return false;
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Erreur de connexion au serveur',
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    setState({ isAuthenticated: false, isLoading: false, error: null });
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }, []);

  return {
    ...state,
    login,
    logout,
    getToken,
  };
}
