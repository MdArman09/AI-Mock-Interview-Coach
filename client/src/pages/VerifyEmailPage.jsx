import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { mapApiError } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Mail, RefreshCw, Terminal } from 'lucide-react';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailMode, setEmailMode] = useState(null);
  const [emailSendFailed, setEmailSendFailed] = useState(false);

  const hasVerifiedRef = useRef(false);

  // Set meta referrer to no-referrer & update page title
  useEffect(() => {
    document.title = 'Verify Email — AI Mock Interview Coach';

    let meta = document.querySelector('meta[name="referrer"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'no-referrer';
      document.head.appendChild(meta);
    } else {
      meta.content = 'no-referrer';
    }

    return () => {
      // Clean up or reset if necessary
    };
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Execute verification on mount with StrictMode ref guard
  useEffect(() => {
    if (hasVerifiedRef.current) return;

    // Read token from search params or raw URL
    const rawToken = searchParams.get('token');

    // Immediately remove token from browser history so it cannot leak
    if (rawToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!rawToken) {
      setStatus('error');
      setErrorMessage('No verification token was provided in the link.');
      return;
    }

    hasVerifiedRef.current = true;

    const performVerification = async () => {
      setStatus('verifying');
      try {
        await authAPI.verifyEmail(rawToken);
        setStatus('success');
        toast.success('Email verified successfully! You can now log in.');
      } catch (err) {
        setStatus('error');
        const friendly = mapApiError(err, 'verify');
        setErrorMessage(friendly);
      }
    };

    performVerification();
  }, [searchParams, toast]);

  const handleResend = async (e) => {
    e.preventDefault();
    const cleanEmail = resendEmail.trim();
    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setEmailSendFailed(false);
    try {
      const res = await authAPI.resendVerification(cleanEmail);
      if (res?.emailMode) {
        setEmailMode(res.emailMode);
      }
      if (res?.emailSendFailed) {
        setEmailSendFailed(true);
      }
      toast.success('Verification link sent! Check your inbox.');
      setResendCooldown(60);
    } catch (err) {
      const friendly = mapApiError(err, 'auth');
      toast.error(friendly);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] font-sans flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg shadow-none p-7 sm:p-8">
        {status === 'verifying' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-9 h-9 animate-spin text-[#2F5233] dark:text-[#689D6A] mx-auto" />
            <h1 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              Verifying Your Email Address...
            </h1>
            <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
              Please wait while we confirm your credentials.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBF2EB] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#C5D9C6] dark:border-[#2F5233]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              Email Verified Successfully
            </h1>

            <p className="text-xs text-[#4A463F] dark:text-[#B5AFA2] leading-relaxed">
              Your email address has been confirmed. You're ready to sign in and begin practicing.
            </p>

            <div className="pt-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/?mode=login')}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all cursor-pointer shadow-none"
              >
                Sign In to Your Account
              </motion.button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => navigate('/?mode=login')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F] mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>

              <h1 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                Verification Link Expired or Invalid
              </h1>

              <p className="text-xs text-[#787268] dark:text-[#8E877C] mt-1.5 leading-relaxed">
                {errorMessage || 'This link has either expired or was already used. Enter your email below to receive a new verification link.'}
              </p>
            </div>

            {/* Resend Verification Form */}
            <form onSubmit={handleResend} className="space-y-3 pt-2">
              <div>
                <label
                  htmlFor="verify-resend-email"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="verify-resend-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268] dark:placeholder:text-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-sm transition-colors"
                />
              </div>

              <motion.button
                type="submit"
                disabled={resendLoading || resendCooldown > 0}
                whileTap={{ scale: 0.96 }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Verification Link</span>
                  </>
                )}
              </motion.button>

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
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
