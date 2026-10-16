import axios from 'axios';
import { mapApiError } from '../utils/apiError';

// Base API URL: uses Vite proxy by default, or an explicit env variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Automatically attach JWT token to every protected request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('interview_coach_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction and mapping
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errData = error.response?.data;
    const status = error.response?.status;
    const isAuthRoute =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');

    // Auto logout if 401 Unauthorized on protected routes
    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('interview_coach_token');
      localStorage.removeItem('interview_coach_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const friendlyMessage = mapApiError(error, isAuthRoute ? 'auth' : '');
    const customErr = new Error(friendlyMessage);
    customErr.status = status;
    customErr.code = errData?.code || error.code;
    customErr.retryAfterSeconds = errData?.retryAfterSeconds;
    customErr.data = errData;
    customErr.isNetworkOrGateway =
      !status ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED';

    return Promise.reject(customErr);
  }
);

/**
 * Execute an auth request with 15-second timeout and automatic retries for transient errors.
 * Retries up to 2 times (attempt 1 after 1500ms, attempt 2 after 3000ms) only on network errors or 502/503/504.
 * Never retries on 401 or any 4xx errors.
 */
const executeAuthWithRetry = async (fn, onRetryStateChange) => {
  const retryDelays = [1500, 3000];
  let attempt = 0;

  while (true) {
    try {
      const result = await fn();
      if (typeof onRetryStateChange === 'function') {
        onRetryStateChange(false, 0);
      }
      return result;
    } catch (err) {
      const status = err.status;
      const isClientError = status && status >= 400 && status < 500;
      const isTransient =
        !status ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err.code === 'DB_UNAVAILABLE' ||
        err.isNetworkOrGateway;

      if (!isClientError && isTransient && attempt < retryDelays.length) {
        const delay = retryDelays[attempt];
        attempt++;
        if (typeof onRetryStateChange === 'function') {
          onRetryStateChange(true, attempt);
        }
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      if (typeof onRetryStateChange === 'function') {
        onRetryStateChange(false, 0);
      }
      throw err;
    }
  }
};

export const authAPI = {
  login: async (credentials, onRetryStateChange) => {
    return executeAuthWithRetry(
      () => api.post('/api/auth/login', credentials, { timeout: 15000 }).then((res) => res.data),
      onRetryStateChange
    );
  },
  register: async (userData, onRetryStateChange) => {
    return executeAuthWithRetry(
      () => api.post('/api/auth/register', userData, { timeout: 15000 }).then((res) => res.data),
      onRetryStateChange
    );
  },
  googleAuth: async (authPayload, onRetryStateChange) => {
    return executeAuthWithRetry(
      () => api.post('/api/auth/google', authPayload, { timeout: 15000 }).then((res) => res.data),
      onRetryStateChange
    );
  },
  getMe: async () => {
    const res = await api.get('/api/auth/me', { timeout: 15000 });
    return res.data;
  },
  verifyEmail: async (token) => {
    const res = await api.post('/api/auth/verify-email', { token }, { timeout: 15000 });
    return res.data;
  },
  resendVerification: async (email) => {
    const res = await api.post('/api/auth/resend-verification', { email }, { timeout: 15000 });
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await api.post('/api/auth/forgot-password', { email }, { timeout: 15000 });
    return res.data;
  },
  resetPassword: async ({ token, password }) => {
    const res = await api.post('/api/auth/reset-password', { token, password }, { timeout: 15000 });
    return res.data;
  },
  deleteAccount: async (password) => {
    const res = await api.delete('/api/auth/account', { data: { password }, timeout: 15000 });
    return res.data;
  },
};

export const questionAPI = {
  getQuestions: async (categoryOrParams = '') => {
    let query = '';
    if (typeof categoryOrParams === 'object' && categoryOrParams !== null) {
      const params = new URLSearchParams();
      if (categoryOrParams.category && categoryOrParams.category !== 'All') {
        params.append('category', categoryOrParams.category);
      }
      if (categoryOrParams.source) {
        params.append('source', categoryOrParams.source);
      }
      const qs = params.toString();
      query = qs ? `?${qs}` : '';
    } else if (typeof categoryOrParams === 'string' && categoryOrParams && categoryOrParams !== 'All') {
      query = `?category=${encodeURIComponent(categoryOrParams)}`;
    }
    const res = await api.get(`/api/questions${query}`);
    return res.data;
  },
  getResumeQuestions: async (resumeId) => {
    const query = resumeId ? `&resumeId=${encodeURIComponent(resumeId)}` : '';
    const res = await api.get(`/api/questions?source=resume-generated${query}`);
    return res.data;
  },
  refreshBankQuestions: async () => {
    const res = await api.post('/api/questions/refresh');
    return res.data;
  },
  getQuestionById: async (id) => {
    const res = await api.get(`/api/questions/${id}`);
    return res.data;
  },
};

export const resumeAPI = {
  getResumes: async () => {
    const res = await api.get('/api/resume');
    return res.data;
  },
  uploadResume: async (fileOrFormData, label) => {
    let data = fileOrFormData;
    if (fileOrFormData instanceof File) {
      data = new FormData();
      data.append('resume', fileOrFormData);
      if (label) {
        data.append('label', label);
      }
    }
    const res = await api.post('/api/resume/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  generateQuestions: async (resumeId, sectionIds, options = {}) => {
    const payload = { resumeId, ...options };
    if (Array.isArray(sectionIds) && sectionIds.length > 0) {
      payload.sectionIds = sectionIds;
    }
    const res = await api.post('/api/resume/generate-questions', payload);
    return res.data;
  },
  getLatestResume: async () => {
    const res = await api.get('/api/resume/latest');
    return res.data;
  },
  deleteResume: async (id) => {
    const res = await api.delete(`/api/resume/${id}`);
    return res.data;
  },
  clearResumeAndQuestions: async () => {
    const res = await api.delete('/api/resume/my-questions');
    return res.data;
  },
};

export const sessionAPI = {
  analyzeAnswer: async (payload) => {
    const res = await api.post('/api/analyze', payload);
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/api/history');
    return res.data;
  },
  getSessionById: async (id) => {
    const res = await api.get(`/api/history/${id}`);
    return res.data;
  },
  deleteSession: async (id) => {
    const res = await api.delete(`/api/history/${id}`);
    return res.data;
  },
};

export const userAPI = {
  getProfile: async () => {
    const res = await api.get('/api/user/profile');
    return res.data;
  },
  updateProfile: async (profileData) => {
    const res = await api.put('/api/user/profile', profileData);
    return res.data;
  },
  changePassword: async (passwordData) => {
    const res = await api.put('/api/user/password', passwordData);
    return res.data;
  },
};

export const contactAPI = {
  submitContact: async (data) => {
    const res = await api.post('/api/contact', data);
    return res.data;
  },
};

export default api;

