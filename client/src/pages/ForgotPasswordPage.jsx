import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { mapApiError } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Sparkles, ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, Terminal } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailMode, setEmailMode] = useState(null);
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  const [error, setError] = useState('');

  // Set document title
  useEffect(() => {
    document.title = 'Forgot Password — AI Mock Interview Coach';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(cleanEmail);
      setEmailMode(res?.emailMode || null);
      setEmailSendFailed(Boolean(res?.emailSendFailed));
      setSubmitted(true);

      if (res?.emailSendFailed) {
        toast.error('Email sending failed. Check the server logs.');
      } else if (res?.emailMode === 'console') {
        toast.success('Dev mode: reset link printed in server terminal.');
      } else {
        toast.success('Reset link requested.');
      }
    } catch (err) {
      const friendly = mapApiError(err, 'auth');
      setError(friendly);
      toast.error(friendly);
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

        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#FAF6EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] mb-3 border border-[#E4DCC9] dark:border-[#38342D]">
                <Mail className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE]">
                Forgot Your Password?
              </h1>
              <p className="text-xs text-[#787268] dark:text-[#8E877C] mt-1.5 leading-relaxed">
                Enter your email address below. If an account exists, we'll send you a link to reset your password.
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
                  htmlFor="forgot-email"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268] dark:placeholder:text-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-sm transition-colors"
                />
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
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBF2EB] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#C5D9C6] dark:border-[#2F5233]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              Check Your Inbox
            </h2>

            <p className="text-xs text-[#4A463F] dark:text-[#B5AFA2] leading-relaxed">
              If an account is associated with <strong className="text-[#1C1B17] dark:text-[#FAF6EE]">{email}</strong>, we've sent password reset instructions.
            </p>

            <div className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#787268] dark:text-[#8E877C] text-left space-y-1">
              <p>• The reset link will expire in <strong>30 minutes</strong>.</p>
              <p>• If you don't see the email, check your spam or junk folder.</p>
            </div>

            {/* Dev-mode failure or console notice */}
            {emailSendFailed && (
              <div className="p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md text-xs text-[#C2572B] dark:text-[#E07A5F] text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C2572B] dark:text-[#E07A5F]" />
                <span className="leading-snug">Email sending failed. Check the server logs.</span>
              </div>
            )}

            {emailMode === 'console' && (
              <div className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#2F5233] dark:text-[#689D6A] text-left flex items-start gap-2.5">
                <Terminal className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2F5233] dark:text-[#689D6A]" />
                <span className="font-mono text-[11px] leading-snug">
                  Dev mode: no real email was sent. Check the server terminal for your link.
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/?mode=login')}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
