import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { mapApiError } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Eye, EyeOff, Loader2, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  // Set meta referrer to no-referrer & extract token
  useEffect(() => {
    document.title = 'Reset Password — AI Mock Interview Coach';

    let meta = document.querySelector('meta[name="referrer"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'no-referrer';
      document.head.appendChild(meta);
    } else {
      meta.content = 'no-referrer';
    }

    const rawToken = searchParams.get('token');
    if (rawToken) {
      setToken(rawToken);
      // Immediately remove token from browser history so it cannot leak
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setIsTokenInvalid(true);
      setError('No password reset token was provided in the link.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setIsTokenInvalid(true);
      setError('Reset token is missing or has already expired.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password.length > 72) {
      setError('Password cannot exceed 72 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/?mode=login', { replace: true });
    } catch (err) {
      const friendly = mapApiError(err, 'auth');
      setError(friendly);

      if (err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
        setIsTokenInvalid(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] font-sans flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg shadow-none p-7 sm:p-8">
        <button
          type="button"
          onClick={() => navigate('/?mode=login')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] mb-5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>

        {!isTokenInvalid ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#FAF6EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] mb-3 border border-[#E4DCC9] dark:border-[#38342D]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE]">
                Set New Password
              </h1>
              <p className="text-xs text-[#787268] dark:text-[#8E877C] mt-1.5 leading-relaxed">
                Choose a strong, memorable password for your account.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md flex items-start gap-2.5 text-xs text-[#C2572B] dark:text-[#E07A5F]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8–72 characters"
                    className="w-full pl-3.5 pr-10 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268] dark:placeholder:text-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-3.5 pr-10 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268] dark:placeholder:text-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password requirement guidelines */}
              <div className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#787268] dark:text-[#8E877C] space-y-1">
                <p>• Must be <strong>8 to 72 characters</strong> in length</p>
                <p>• Must not match your email address</p>
                <p>• Avoid easily guessed passwords (e.g. "password123")</p>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F]">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              Reset Link Expired or Invalid
            </h2>

            <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
              {error || 'This password reset link has expired or has already been used. Please request a new link.'}
            </p>

            <div className="pt-2">
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all cursor-pointer"
              >
                Request a New Reset Link
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
