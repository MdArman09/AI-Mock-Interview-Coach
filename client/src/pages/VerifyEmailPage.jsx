import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { mapApiError } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw, Terminal, ShieldCheck } from 'lucide-react';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateUser } = useAuth();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'code_entry'
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [code, setCode] = useState(() => searchParams.get('code') || '');
  const [submitting, setSubmitting] = useState(false);
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
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Execute verification on mount with StrictMode ref guard if query parameters exist
  useEffect(() => {
    if (hasVerifiedRef.current) return;

    const rawToken = searchParams.get('token');
    const queryEmail = searchParams.get('email');
    const queryCode = searchParams.get('code');

    // Immediately remove sensitive params from browser history URL
    if (rawToken || queryCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!rawToken && (!queryEmail || !queryCode)) {
      setStatus('code_entry');
      return;
    }

    hasVerifiedRef.current = true;

    const performAutoVerification = async () => {
      setStatus('verifying');
      try {
        const payload = queryEmail && queryCode ? { email: queryEmail, code: queryCode } : rawToken;
        const res = await authAPI.verifyEmail(payload);
        if (res?.token && res?.user) {
          localStorage.setItem('interview_coach_token', res.token);
          localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
          if (typeof updateUser === 'function') {
            updateUser(res.user);
          }
        }
        setStatus('success');
        toast.success('Email verified successfully! You can now access your studio.');
      } catch (err) {
        setStatus('code_entry');
        const friendly = mapApiError(err, 'verify');
        setErrorMessage(friendly);
      }
    };

    performAutoVerification();
  }, [searchParams, toast, updateUser]);

  const handleManualVerify = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await authAPI.verifyEmail({ email: cleanEmail, code: cleanCode });
      if (res?.token && res?.user) {
        localStorage.setItem('interview_coach_token', res.token);
        localStorage.setItem('interview_coach_user', JSON.stringify(res.user));
        if (typeof updateUser === 'function') {
          updateUser(res.user);
        }
      }
      setStatus('success');
      toast.success('Email verified successfully!');
    } catch (err) {
      const friendly = mapApiError(err, 'verify');
      setErrorMessage(friendly);
      toast.error(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error('Please enter your email address first');
      return;
    }

    setResendLoading(true);
    setEmailSendFailed(false);
    try {
      const res = await authAPI.resendVerification(cleanEmail);
      if (res?.emailMode) setEmailMode(res.emailMode);
      if (res?.emailSendFailed) setEmailSendFailed(true);
      toast.success('A new 6-digit verification code has been sent!');
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
              Verifying Your Credentials...
            </h1>
            <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
              Please wait while we activate your account.
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
              Your account is active. You are now ready to practice in your studio.
            </p>

            <div className="pt-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/')}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all cursor-pointer shadow-none"
              >
                Go to Interview Studio
              </motion.button>
            </div>
          </div>
        )}

        {status === 'code_entry' && (
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EEF3EE] dark:bg-[#1B2F1E] border border-[#D9E5DA] dark:border-[#2C4A2F] text-[#2F5233] dark:text-[#689D6A] mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h1 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                Verify Your Account
              </h1>

              <p className="text-xs text-[#787268] dark:text-[#8E877C] mt-1.5 leading-relaxed">
                Enter your email address and the 6-digit code sent to your inbox to activate your account.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md text-xs text-[#C2572B] dark:text-[#E07A5F] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualVerify} className="space-y-3.5 pt-1">
              <div>
                <label
                  htmlFor="verify-email-input"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1"
                >
                  Email Address
                </label>
                <input
                  id="verify-email-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] text-sm focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A]"
                />
              </div>

              <div>
                <label
                  htmlFor="verify-code-input"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1"
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="verify-code-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] text-center font-mono font-bold text-lg tracking-widest focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A]"
                />
              </div>

              <motion.button
                type="submit"
                disabled={submitting || !code || code.length !== 6}
                whileTap={{ scale: 0.97 }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] font-medium text-sm rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Enter Studio</span>
                )}
              </motion.button>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[#787268] dark:text-[#8E877C]">Didn't get the code?</span>
                <button
                  type="button"
                  disabled={resendLoading || resendCooldown > 0}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1 font-medium text-[#2F5233] dark:text-[#689D6A] hover:underline disabled:opacity-60 cursor-pointer"
                >
                  {resendLoading ? (
                    <span>Sending...</span>
                  ) : resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </>
                  )}
                </button>
              </div>

              {emailSendFailed && (
                <div className="p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md text-xs text-[#C2572B] dark:text-[#E07A5F] text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C2572B] dark:text-[#E07A5F]" />
                  <span className="leading-snug">Email delivery delayed or blocked. Check server / Render logs for your code.</span>
                </div>
              )}

              {emailMode === 'console' && (
                <div className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#2F5233] dark:text-[#689D6A] text-left flex items-start gap-2.5">
                  <Terminal className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2F5233] dark:text-[#689D6A]" />
                  <span className="font-mono text-[11px] leading-snug">
                    Dev mode: check the server terminal for your 6-digit code.
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
