import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('interview_coach_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('interview_coach_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate token or refresh user info on mount, and handle Google OAuth redirect tokens
  useEffect(() => {
    // 1. Check for incoming Google OAuth redirect token in URL hash
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      try {
        const hash = window.location.hash.replace(/^#/, '');
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        if (accessToken) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          setLoading(true);
          authAPI.googleAuth({ accessToken })
            .then((res) => {
              if (res.token) {
                localStorage.setItem('interview_coach_token', res.token);
                localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
                setToken(res.token);
                setUser(res.user);
              }
            })
            .catch((err) => {
              console.error('Failed to authenticate Google redirect token:', err);
            })
            .finally(() => {
              setLoading(false);
            });
          return;
        }
      } catch (err) {
        console.error('Error parsing Google OAuth hash:', err);
      }
    }

    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authAPI.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('interview_coach_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email, password, onRetryStateChange) => {
    const res = await authAPI.login({ email, password }, onRetryStateChange);
    if (res.token) {
      localStorage.setItem('interview_coach_token', res.token);
      localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password, onRetryStateChange) => {
    const res = await authAPI.register({ name, email, password }, onRetryStateChange);
    if (res.token) {
      localStorage.setItem('interview_coach_token', res.token);
      localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const loginWithGoogle = async (authPayload, onRetryStateChange) => {
    const res = await authAPI.googleAuth(authPayload, onRetryStateChange);
    if (res.token) {
      localStorage.setItem('interview_coach_token', res.token);
      localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const verifyEmailOtp = async ({ email, code }) => {
    const res = await authAPI.verifyEmail({ email, code });
    if (res.token && res.user) {
      localStorage.setItem('interview_coach_token', res.token);
      localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    try {
      localStorage.removeItem('interview_coach_token');
      localStorage.removeItem('interview_coach_user');
      sessionStorage.clear();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    localStorage.setItem('interview_coach_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    loginWithGoogle,
    verifyEmailOtp,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
