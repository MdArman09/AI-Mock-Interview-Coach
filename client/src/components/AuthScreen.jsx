import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { ThemeToggle } from './ThemeToggle';
import { ShimmerButton } from './ui/ShimmerButton';
import { BrandLogo } from './ui/BrandLogo';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mic,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Terminal,
  Clock,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

// Official multi-color Google 'G' icon SVG
const GoogleIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// Real features strictly supported in codebase, framed for the rotating "Built for" showcase
const SHOWCASE_FEATURES = [
  {
    id: 'speech',
    builtFor: 'Real-time voice practice',
    title: 'In-Browser Speech Recognition',
    description: 'We never store your audio. Speech-to-text is handled by your browser’s built-in recognition.',
    icon: Mic,
    badge: 'Browser Speech API • No Audio Stored',
  },
  {
    id: 'star',
    builtFor: 'Structured STAR mastery',
    title: 'STAR Framework Evaluation',
    description: 'Instant scoring across Situation, Task, Action, and Result with rubric feedback.',
    icon: CheckCircle2,
    badge: 'Concrete Rubrics',
  },
  {
    id: 'pacing',
    builtFor: 'Pacing & speech clarity',
    title: 'Pacing & Filler Word Audit',
    description: 'Monitors 120–150 words per minute and flags verbal fillers like "um" and "like".',
    icon: Clock,
    badge: 'Live Cadence Tracking',
  },
  {
    id: 'resume',
    builtFor: 'Resume-matched questions',
    title: 'Resume-Based Question Generation',
    description: 'Upload your PDF/DOCX resume to generate targeted questions matched to your experience.',
    icon: FileText,
    badge: 'Personalized Prompts',
  },
];

export const AuthScreen = ({ initialMode = 'login', onBack }) => {
  const { login, register, loginWithGoogle, verifyEmailOtp } = useAuth();
  const toast = useToast();
  const [isRegister, setIsRegister] = useState(initialMode === 'signup' || initialMode === 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // 6-digit OTP verification state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpInputRefs = useRef([]);

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [tempGoogleClientId, setTempGoogleClientId] = useState(() => {
    return localStorage.getItem('temp_google_client_id') || '';
  });

  // Option A Feature Showcase rotation state (cycles every ~2.2s, pause on hover)
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % SHOWCASE_FEATURES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Post-registration "Check your email" screen state
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [emailMode, setEmailMode] = useState(null);
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Auto-focus first digit input when OTP view is shown
  useEffect(() => {
    if (showCheckEmail && otpInputRefs.current[0]) {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCheckEmail]);

  // Unverified email error state during login
  const [isUnverifiedError, setIsUnverifiedError] = useState(false);
  const [loginResendCooldown, setLoginResendCooldown] = useState(0);
  const [loginResending, setLoginResending] = useState(false);

  // Countdown timer for registration resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Countdown timer for login inline unverified resend button
  useEffect(() => {
    if (loginResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setLoginResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loginResendCooldown]);

  const getEffectiveGoogleClientId = () => {
    const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envId && envId.trim() && envId !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return envId.trim();
    }
    const stored = localStorage.getItem('temp_google_client_id');
    return stored ? stored.trim() : '';
  };

  const tokenClientRef = useRef(null);

  // Pre-initialize Google token client when Google scripts are ready to ensure direct user-gesture compliance
  useEffect(() => {
    const initClient = () => {
      const clientId = getEffectiveGoogleClientId();
      if (!clientId || !window.google?.accounts?.oauth2 || tokenClientRef.current) return;

      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          error_callback: (err) => {
            setGoogleLoading(false);
            console.warn('[Google OAuth error_callback]:', err);
            if (err?.type === 'popup_failed_to_open') {
              toast.error('Google popup was blocked by your browser. Please allow popups for this site in your address bar.');
            } else if (err?.type === 'popup_closed') {
              toast.info('Google Sign-In was cancelled.');
            } else {
              toast.error(err?.message || 'Google Sign-In was cancelled or blocked.');
            }
          },
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setGoogleLoading(false);
              if (tokenResponse.error !== 'access_denied') {
                toast.error(`Google Sign-In failed: ${tokenResponse.error}`);
              }
              return;
            }
            try {
              await loginWithGoogle({ accessToken: tokenResponse.access_token });
              toast.success('Successfully authenticated with Google!');
            } catch (err) {
              toast.error(err.message || 'Failed to authenticate with Google');
            } finally {
              setGoogleLoading(false);
            }
          },
        });
      } catch (e) {
        console.warn('[Google OAuth init error]:', e);
      }
    };

    if (window.google?.accounts?.oauth2) {
      initClient();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          initClient();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoogleLogin = () => {
    const clientId = getEffectiveGoogleClientId();
    if (!clientId) {
      setShowGoogleConfigModal(true);
      return;
    }

    if (!window.google?.accounts) {
      toast.error('Google Sign-In is still initializing. Please click again in a moment.');
      return;
    }

    setGoogleLoading(true);

    // Watchdog timer: ensure loading state resets after 25s if Google popup is closed or blocked
    const watchdogTimer = setTimeout(() => {
      setGoogleLoading((current) => {
        if (current) {
          console.warn('[Google OAuth] Timed out waiting for response.');
          toast.info('Google Sign-In window took too long to respond. Please ensure popups are allowed and try again.');
          return false;
        }
        return current;
      });
    }, 25000);

    try {
      if (window.google.accounts.oauth2) {
        if (!tokenClientRef.current) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            error_callback: (err) => {
              clearTimeout(watchdogTimer);
              setGoogleLoading(false);
              console.warn('[Google OAuth error_callback]:', err);
              if (err?.type === 'popup_failed_to_open') {
                toast.error('Google popup was blocked. Look at the address bar and click "Always allow popups" to sign in.');
              } else if (err?.type === 'popup_closed') {
                toast.info('Google Sign-In was cancelled.');
              } else {
                toast.error(err?.message || 'Google Sign-In failed or was cancelled.');
              }
            },
            callback: async (tokenResponse) => {
              clearTimeout(watchdogTimer);
              if (tokenResponse.error) {
                setGoogleLoading(false);
                if (tokenResponse.error !== 'access_denied') {
                  toast.error(`Google Sign-In failed: ${tokenResponse.error}`);
                }
                return;
              }
              try {
                await loginWithGoogle({ accessToken: tokenResponse.access_token });
                toast.success('Successfully authenticated with Google!');
              } catch (err) {
                toast.error(err.message || 'Failed to authenticate with Google');
              } finally {
                setGoogleLoading(false);
              }
            },
          });
        }
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      } else if (window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            clearTimeout(watchdogTimer);
            try {
              await loginWithGoogle({ credential: response.credential });
              toast.success('Successfully authenticated with Google!');
            } catch (err) {
              toast.error(err.message || 'Failed to authenticate with Google');
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            clearTimeout(watchdogTimer);
            setGoogleLoading(false);
            console.warn('[Google OneTap]:', notification.getNotDisplayedReason() || notification.getSkippedReason());
          }
        });
      }
    } catch (err) {
      clearTimeout(watchdogTimer);
      console.error('[Google OAuth Error]:', err);
      setGoogleLoading(false);
      toast.error('Failed to initialize Google Sign-In.');
    }
  };

  const handleSaveTempClientId = () => {
    if (!tempGoogleClientId.trim()) return;
    localStorage.setItem('temp_google_client_id', tempGoogleClientId.trim());
    setShowGoogleConfigModal(false);
    toast.success('Google Client ID saved! Initiating sign-in...');
    setTimeout(() => {
      handleGoogleLogin();
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUnverifiedError(false);

    if (isRegister && !name.trim()) {
      const msg = 'Please provide your full name';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!email.trim() || !password) {
      const msg = 'Please fill in all required fields';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length > 72) {
      const msg = 'Password cannot exceed 72 characters';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (isRegister && password.trim().toLowerCase() === email.trim().toLowerCase()) {
      const msg = 'Password cannot be the same as your email address';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setIsConnecting(false);
    try {
      const handleRetryState = (retrying) => {
        setIsConnecting(retrying);
      };

      if (isRegister) {
        const regRes = await register(name.trim(), email.trim(), password, handleRetryState);
        setRegisteredEmail(email.trim());
        setEmailMode(regRes?.emailMode || null);
        setEmailSendFailed(Boolean(regRes?.emailSendFailed));
        setShowCheckEmail(true);
        setResendCooldown(60);

        if (regRes?.emailSendFailed) {
          toast.error('Email sending failed. Check the server logs for your code.');
        } else if (regRes?.emailMode === 'console') {
          toast.success('Dev mode: check server terminal for your 6-digit code.');
        } else {
          toast.success('Verification code sent! Please check your email.');
        }
      } else {
        await login(email.trim(), password, handleRetryState);
        toast.success('Welcome back!');
      }
    } catch (err) {
      const errMsg = err.message || 'Something went wrong — please try again';
      setError(errMsg);

      if (err.code === 'EMAIL_NOT_VERIFIED' || err.data?.code === 'EMAIL_NOT_VERIFIED') {
        setIsUnverifiedError(true);
      }

      toast.error(errMsg);
    } finally {
      setLoading(false);
      setIsConnecting(false);
    }
  };

  const handleVerifyOtp = async (codeOverride) => {
    const code = (codeOverride !== undefined ? codeOverride : otpDigits.join('')).trim();
    if (!code || code.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');
    try {
      await verifyEmailOtp({ email: registeredEmail, code });
      toast.success('Email verified successfully! Opening your interview studio...');
    } catch (err) {
      const msg = err.message || 'Incorrect verification code. Please try again.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOtpDigitChange = (index, val) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      setOtpError('');
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const updated = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < 6) updated[index + i] = c;
      });
      setOtpDigits(updated);
      setOtpError('');
      const nextIdx = Math.min(5, index + chars.length);
      otpInputRefs.current[nextIdx]?.focus();
      if (updated.every((d) => d.length === 1)) {
        handleVerifyOtp(updated.join(''));
      }
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleaned[0];
    setOtpDigits(updated);
    setOtpError('');

    if (index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }

    if (updated.every((d) => d.length === 1)) {
      handleVerifyOtp(updated.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    const updated = ['', '', '', '', '', ''];
    digits.split('').forEach((d, i) => {
      updated[i] = d;
    });
    setOtpDigits(updated);
    setOtpError('');

    const nextFocus = Math.min(5, digits.length);
    otpInputRefs.current[nextFocus]?.focus();

    if (digits.length === 6) {
      handleVerifyOtp(digits);
    }
  };

  const handleResendFromCheckEmail = async () => {
    if (resendCooldown > 0 || resending || !registeredEmail) return;
    setResending(true);
    setOtpError('');
    try {
      const res = await authAPI.resendVerification(registeredEmail);
      if (res?.emailMode) setEmailMode(res.emailMode);
      if (res?.emailSendFailed) {
        setEmailSendFailed(true);
        toast.error('Email sending failed. Check the server logs.');
      } else {
        setEmailSendFailed(false);
        if (res?.emailMode === 'console') {
          toast.success('Dev mode: verification code printed in server terminal.');
        } else {
          toast.success('Verification code resent! Check your inbox.');
        }
      }
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleResendFromLoginNotice = async () => {
    if (loginResendCooldown > 0 || loginResending || !email.trim()) return;
    setLoginResending(true);
    try {
      const res = await authAPI.resendVerification(email.trim());
      if (res?.emailMode === 'console') {
        toast.success('Dev mode: verification code printed in server terminal.');
      } else {
        toast.success('Verification code resent! Please check your inbox.');
      }
      setLoginResendCooldown(60);
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setLoginResending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setShowCheckEmail(false);
    setEmail('');
    setPassword('');
    setError('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
  };

  const activeFeature = SHOWCASE_FEATURES[activeFeatureIndex];
  const ActiveIcon = activeFeature.icon;

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] font-sans flex flex-col justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8 relative selection:bg-[#2F5233] selection:text-[#FAF6EE]">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#C5BCAB 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-1.5 sm:py-2 gap-2">
        <div
          onClick={onBack}
          className={`flex items-center gap-2 sm:gap-2.5 min-w-0 ${onBack ? 'cursor-pointer group' : ''}`}
          title={onBack ? 'Back to Overview' : 'AI Mock Interview Coach'}
        >
          <BrandLogo size={32} className="w-8 h-8 flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-serif font-bold text-sm sm:text-base text-[#1C1B17] dark:text-[#FAF6EE] block leading-tight group-hover:text-[#2F5233] dark:group-hover:text-[#689D6A] transition-colors truncate">
              <span className="hidden min-[360px]:inline">AI Mock Interview Coach</span>
              <span className="min-[360px]:hidden">AI Coach</span>
            </span>
            <span className="text-[10px] text-[#787268] dark:text-[#A8A297] leading-none hidden sm:block">
              STAR Method & Speech Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#4A463F] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content: Split-Card Container (Entire card visible without scrolling) */}
      <main className="relative z-10 w-full max-w-5xl mx-auto my-2 sm:my-3">
        <div className="rounded-2xl border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* ========================================================= */}
          {/* MOBILE ONLY: Sleek Forest Green Brand Crown (< lg)        */}
          {/* ========================================================= */}
          <div className="lg:hidden col-span-1 bg-[#2F5233] dark:bg-[#1B2F1E] text-[#FAF6EE] px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#244027] dark:border-[#132315] relative overflow-hidden flex items-center justify-between gap-3">
            {/* Subtle ambient light glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#A3E635] flex-shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-xs sm:text-sm text-white tracking-tight leading-tight truncate">
                    Master the interview.
                  </span>
                  <span className="text-white/60 font-serif italic text-xs hidden min-[360px]:inline">
                    Speak with conviction.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-white/80">
                  <span className="text-[#A3E635] font-semibold uppercase font-mono tracking-wider text-[10px]">
                    STAR Telemetry
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/70 truncate">Real-Time Voice Coaching</span>
                </div>
              </div>
            </div>

            {/* Micro rotating showcase pill on mobile (>= 400px) */}
            <div className="relative z-10 hidden min-[400px]:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/15 text-[10.5px] font-medium flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
              <div className="h-4 overflow-hidden flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeFeature.builtFor}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="truncate max-w-[120px] text-[10.5px] font-semibold text-white/95"
                  >
                    {activeFeature.builtFor}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* LEFT / PRIMARY COLUMN: Interactive Auth Form (58% on lg)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-8 flex flex-col justify-between">
            <div>
              {/* Top Tag Pill (Hidden on mobile since Crown banner is on top) */}
              <div className="hidden lg:inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-[#FAF6EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] border border-[#E4DCC9] dark:border-[#38342D] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F5233] dark:bg-[#689D6A] shrink-0" />
                <span className="truncate">Web Speech API • Real-Time STAR Feedback</span>
              </div>

              {/* Title & Eyebrow */}
              <div className="space-y-1 mb-4 sm:mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C]">
                  {isRegister ? 'Candidate Onboarding' : 'Welcome Back'}
                </span>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] tracking-tight">
                  {isRegister ? 'Create your practice account' : 'Sign in to your practice studio'}
                </h1>
                <p className="text-xs text-[#4A463F] dark:text-[#B5AFA2] leading-relaxed">
                  {isRegister
                    ? 'Start building interview confidence with voice telemetry and structured STAR rubrics.'
                    : 'Access your saved practice sessions, speech pace telemetry, and interview history.'}
                </p>
              </div>

              {/* Post-Registration 6-Digit OTP Verification Screen */}
              {showCheckEmail ? (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-[#EEF3EE] dark:bg-[#1B2F1E] border border-[#D9E5DA] dark:border-[#2C4A2F] text-[#2F5233] dark:text-[#689D6A] flex items-center justify-center mx-auto shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                      Enter Verification Code
                    </h2>
                    <p className="text-xs text-[#4A463F] dark:text-[#B5AFA2]">
                      We sent a 6-digit code to:
                    </p>
                    <div className="flex items-center justify-center gap-1.5 pt-0.5">
                      <span className="text-xs font-semibold text-[#1C1B17] dark:text-[#FAF6EE] bg-[#FAF6EE] dark:bg-[#181714] py-1 px-3 rounded-md border border-[#E4DCC9] dark:border-[#38342D] font-mono">
                        {registeredEmail}
                      </span>
                      <button
                        type="button"
                        onClick={handleUseDifferentEmail}
                        className="text-[11px] text-[#2F5233] dark:text-[#689D6A] hover:underline cursor-pointer ml-1"
                        title="Use different email"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* 6 Digits Input Row */}
                  <div className="py-2">
                    <div
                      className="flex items-center justify-center gap-2 sm:gap-2.5"
                      onPaste={handleOtpPaste}
                    >
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          disabled={otpVerifying}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-xl font-bold font-mono rounded-lg border bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] shadow-xs transition-all focus:outline-none disabled:opacity-50 ${
                            digit
                              ? 'border-[#2F5233] dark:border-[#689D6A] ring-1 ring-[#2F5233]/20 dark:ring-[#689D6A]/20'
                              : 'border-[#E4DCC9] dark:border-[#38342D] focus:border-[#2F5233] dark:focus:border-[#689D6A] focus:ring-2 focus:ring-[#2F5233]/20'
                          }`}
                          aria-label={`Digit ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <p className="text-[11px] text-[#787268] dark:text-[#A8A297] mt-2">
                      Enter the 6 digits sent to your inbox. Code expires in <strong>15 minutes</strong>.
                    </p>
                  </div>

                  {/* OTP Error message if any */}
                  {otpError && (
                    <div className="p-2.5 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md text-xs text-[#C2572B] dark:text-[#E07A5F] text-left flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C2572B] dark:text-[#E07A5F]" />
                      <span className="leading-snug">{otpError}</span>
                    </div>
                  )}

                  {emailSendFailed && (
                    <div className="p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md text-xs text-[#C2572B] dark:text-[#E07A5F] text-left flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C2572B] dark:text-[#E07A5F]" />
                      <span className="leading-snug">Email delivery delayed or blocked. Check server / Render logs for your 6-digit code.</span>
                    </div>
                  )}

                  {emailMode === 'console' && (
                    <div className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#2F5233] dark:text-[#689D6A] text-left flex items-start gap-2.5">
                      <Terminal className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2F5233] dark:text-[#689D6A]" />
                      <span className="font-mono text-[11px] leading-snug">
                        Dev mode: 6-digit verification code is printed in your server terminal.
                      </span>
                    </div>
                  )}

                  {/* Submit & Resend Controls */}
                  <div className="space-y-2 pt-1">
                    <motion.button
                      type="button"
                      disabled={otpVerifying || otpDigits.some((d) => !d)}
                      onClick={() => handleVerifyOtp()}
                      whileTap={{ scale: 0.97 }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] text-[#FAF6EE] font-medium text-xs rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                    >
                      {otpVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <span>Verify & Enter Studio</span>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-[#787268] dark:text-[#8E877C]">
                        Didn't get the code?
                      </span>
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || resending}
                        onClick={handleResendFromCheckEmail}
                        className="inline-flex items-center gap-1.5 font-medium text-[#2F5233] dark:text-[#689D6A] hover:underline disabled:opacity-60 disabled:no-underline cursor-pointer"
                      >
                        {resending ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Sending...</span>
                          </>
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

                    <button
                      type="button"
                      onClick={handleUseDifferentEmail}
                      className="w-full text-xs text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] py-1 transition-colors cursor-pointer"
                    >
                      Use a different email
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#E4DCC9] dark:border-[#38342D]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCheckEmail(false);
                        setIsRegister(false);
                      }}
                      className="text-xs font-medium text-[#2F5233] dark:text-[#689D6A] hover:underline cursor-pointer"
                    >
                      Already verified? Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mode Tab Switcher */}
                  <div className="flex p-1 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] mb-3.5 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setError('');
                      }}
                      className={`relative flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer select-none text-center ${
                        !isRegister
                          ? 'text-[#FAF6EE] font-semibold'
                          : 'text-[#787268] hover:text-[#1C1B17] dark:text-[#A8A297] dark:hover:text-[#FAF6EE]'
                      }`}
                    >
                      {!isRegister && (
                        <motion.div
                          layoutId="authTabPill"
                          className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">Sign In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setError('');
                      }}
                      className={`relative flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer select-none text-center ${
                        isRegister
                          ? 'text-[#FAF6EE] font-semibold'
                          : 'text-[#787268] hover:text-[#1C1B17] dark:text-[#A8A297] dark:hover:text-[#FAF6EE]'
                      }`}
                    >
                      {isRegister && (
                        <motion.div
                          layoutId="authTabPill"
                          className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">Create Account</span>
                    </button>
                  </div>

                  {/* Google OAuth Button ("Continue with Google") */}
                  <button
                    type="button"
                    disabled={googleLoading || loading}
                    onClick={handleGoogleLogin}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#25231F] text-[#1C1B17] dark:text-[#FAF6EE] font-medium text-xs shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mb-3"
                  >
                    {googleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#2F5233] dark:text-[#689D6A]" />
                        <span>Connecting to Google...</span>
                      </>
                    ) : (
                      <>
                        <GoogleIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#E4DCC9] dark:border-[#38342D]" />
                    </div>
                    <div className="relative px-3 bg-[#FFFDF8] dark:bg-[#23211D] text-[10px] uppercase tracking-wider text-[#787268] dark:text-[#8E877C] font-mono">
                      or continue with email
                    </div>
                  </div>

                  {/* Error banner */}
                  {error && (
                    <div className="mb-4 p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md flex items-start gap-2.5 text-xs text-[#C2572B] dark:text-[#E07A5F]">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="leading-snug block">{error}</span>

                        {isUnverifiedError && (
                          <div className="mt-2.5 pt-2 border-t border-[#F4D8CC] dark:border-[#4E271F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <span className="text-[11px] text-[#787268] dark:text-[#B5AFA2]">
                              Account requires verification.
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRegisteredEmail(email.trim());
                                  setShowCheckEmail(true);
                                  setOtpDigits(['', '', '', '', '', '']);
                                  setOtpError('');
                                  setResendCooldown(0);
                                }}
                                className="inline-flex items-center gap-1 font-semibold text-[#2F5233] dark:text-[#689D6A] hover:underline cursor-pointer text-xs"
                              >
                                Enter 6-Digit Code
                              </button>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <button
                                type="button"
                                disabled={loginResendCooldown > 0 || loginResending}
                                onClick={handleResendFromLoginNotice}
                                className="inline-flex items-center gap-1 font-medium text-[#2F5233] dark:text-[#689D6A] hover:underline disabled:opacity-60 disabled:no-underline cursor-pointer text-xs"
                              >
                                {loginResending ? (
                                  <span>Sending...</span>
                                ) : loginResendCooldown > 0 ? (
                                  <span>Resend ({loginResendCooldown}s)</span>
                                ) : (
                                  <span>Resend Code</span>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auth Form Fields */}
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                    {isRegister && (
                      <div>
                        <label
                          htmlFor="full-name"
                          className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1"
                        >
                          Full Name <span className="text-[#C2572B]">*</span>
                        </label>
                        <input
                          id="full-name"
                          type="text"
                          autoComplete="name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full px-3 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-xs transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="email-address"
                        className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1"
                      >
                        Email Address <span className="text-[#C2572B]">*</span>
                      </label>
                      <input
                        id="email-address"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-xs transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="auth-password"
                          className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C]"
                        >
                          Password <span className="text-[#C2572B]">*</span>
                        </label>
                        {!isRegister && (
                          <Link
                            to="/forgot-password"
                            className="text-[11px] text-[#2F5233] dark:text-[#689D6A] hover:underline focus:outline-none cursor-pointer"
                          >
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={isRegister ? 'new-password' : 'current-password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                          className="w-full pl-3 pr-9 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] text-xs transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] focus:outline-none cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {isRegister && password.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex gap-1 h-1 w-full">
                            <div className={`h-full rounded-full flex-1 transition-colors ${password.length >= 8 ? 'bg-[#2F5233] dark:bg-[#689D6A]' : 'bg-[#C2572B]'}`} />
                            <div className={`h-full rounded-full flex-1 transition-colors ${password.length >= 10 && /[0-9]/.test(password) ? 'bg-[#2F5233] dark:bg-[#689D6A]' : 'bg-[#E4DCC9] dark:bg-[#38342D]'}`} />
                            <div className={`h-full rounded-full flex-1 transition-colors ${password.length >= 12 && /[^A-Za-z0-9]/.test(password) ? 'bg-[#2F5233] dark:bg-[#689D6A]' : 'bg-[#E4DCC9] dark:bg-[#38342D]'}`} />
                          </div>
                          <span className="text-[10px] text-[#787268] dark:text-[#8E877C]">
                            {password.length < 8
                              ? 'Minimum 8 characters'
                              : password.length >= 12 && /[^A-Za-z0-9]/.test(password)
                              ? 'Strong password'
                              : 'Good password'}
                          </span>
                        </div>
                      )}
                    </div>

                    <ShimmerButton
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            {isConnecting
                              ? 'Connecting...'
                              : isRegister
                              ? 'Creating Account...'
                              : 'Signing In...'}
                          </span>
                        </div>
                      ) : (
                        <span>{isRegister ? 'Create Account' : 'Sign In to Studio'}</span>
                      )}
                    </ShimmerButton>
                  </form>

                  {/* Mode switcher link */}
                  <div className="pt-3 mt-4 text-center border-t border-[#E4DCC9] dark:border-[#38342D] text-xs text-[#787268] dark:text-[#A8A297]">
                    {isRegister ? (
                      <p>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegister(false);
                            setError('');
                          }}
                          className="font-semibold text-[#2F5233] dark:text-[#689D6A] hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </p>
                    ) : (
                      <p>
                        Don't have an account yet?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegister(true);
                            setError('');
                          }}
                          className="font-semibold text-[#2F5233] dark:text-[#689D6A] hover:underline cursor-pointer"
                        >
                          Create one free
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Mobile Trust Strip */}
                  <div className="lg:hidden pt-3 mt-3 border-t border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-between text-[11px] text-[#787268] dark:text-[#8E877C]">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                      <span>Private Candidate History</span>
                    </div>
                    <span>Llama 3.3 70B AI</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Rich Forest Brand Showcase (Desktop lg+)    */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#2F5233] dark:bg-[#1B2F1E] text-[#FAF6EE] p-6 sm:p-8 lg:p-8 flex-col justify-between relative overflow-hidden">
            {/* Subtle ambient glow inside panel */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>AI Interview Coaching Studio</span>
              </div>

              {/* Editorial Two-Line Title */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-tight">
                  Master the interview.
                </h2>
                <p className="text-base sm:text-lg font-serif italic text-white/80 leading-snug">
                  Speak with conviction.
                </p>
              </div>

              {/* "Built for" Section Header with Animated Rotating Focus */}
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                    Built for
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <div className="h-5 overflow-hidden flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={activeFeature.builtFor}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-semibold text-white/95"
                      >
                        {activeFeature.builtFor}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Dynamic Feature Showcase Card (Option A: cycles every ~2.2s, pause on hover) */}
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="p-4 rounded-xl bg-white/10 dark:bg-black/25 border border-white/15 backdrop-blur-sm shadow-md transition-all relative overflow-hidden min-h-[140px] flex flex-col justify-between"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-[#A3E635] flex-shrink-0 shadow-xs border border-white/10">
                          <ActiveIcon className="w-4 h-4" />
                        </div>
                        <strong className="block text-white font-medium text-xs sm:text-sm">
                          {activeFeature.title}
                        </strong>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/20 text-[#A3E635] border border-white/10 font-mono hidden sm:inline-block whitespace-nowrap">
                        {activeFeature.badge}
                      </span>
                    </div>

                    <p className="text-white/80 text-xs leading-relaxed pt-0.5">
                      {activeFeature.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Segmented indicator bars (Clickable + visual progress per feature) */}
                <div className="pt-3 mt-2 border-t border-white/10 flex items-center gap-1.5">
                  {SHOWCASE_FEATURES.map((feat, idx) => (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => setActiveFeatureIndex(idx)}
                      className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/20 hover:bg-white/35 transition-colors cursor-pointer"
                      title={`Show ${feat.title}`}
                    >
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          idx === activeFeatureIndex
                            ? 'bg-[#A3E635] w-full'
                            : 'bg-transparent w-0'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom trust strip */}
            <div className="pt-4 mt-5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/70 relative z-10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>Private Candidate History</span>
              </div>
              <span>Llama 3.3 70B AI</span>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer Spacer (Revealed when scrolling down) */}
      <footer className="relative z-10 py-3 text-center text-xs text-[#787268] dark:text-[#8E877C] mt-2 sm:mt-4">
        <p>© 2026 AI Mock Interview Coach • Methodical STAR Practice</p>
      </footer>

      {/* Google OAuth Setup Guidance Modal */}
      <AnimatePresence>
        {showGoogleConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#FFFDF8] dark:bg-[#23211D] rounded-2xl border border-[#E4DCC9] dark:border-[#38342D] shadow-2xl p-6 space-y-4 relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center shadow-xs">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1C1B17] dark:text-[#FAF6EE]">
                      Google Sign-In Setup
                    </h3>
                    <p className="text-[11px] text-[#787268] dark:text-[#8E877C]">
                      OAuth 2.0 Web Client Configuration
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleConfigModal(false)}
                  className="text-[#787268] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] text-sm p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[#4A463F] dark:text-[#B5AFA2] space-y-2.5 leading-relaxed bg-[#FAF6EE] dark:bg-[#181714] p-3.5 rounded-xl border border-[#E4DCC9] dark:border-[#38342D]">
                <p className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                  To activate real Google Sign-In:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2F5233] dark:text-[#689D6A] underline inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                  <li>
                    Add Authorized JavaScript origin:{' '}
                    <code className="bg-[#E4DCC9] dark:bg-[#38342D] px-1 py-0.5 rounded font-mono text-[10px]">
                      http://localhost:5173
                    </code>
                  </li>
                  <li>Paste your <strong>Client ID</strong> below or into <code className="bg-[#E4DCC9] dark:bg-[#38342D] px-1 py-0.5 rounded font-mono text-[10px]">client/.env</code>.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C]">
                  Quick Test: Paste Google Client ID
                </label>
                <input
                  type="text"
                  value={tempGoogleClientId}
                  onChange={(e) => setTempGoogleClientId(e.target.value)}
                  placeholder="123456789-xyz.apps.googleusercontent.com"
                  className="w-full px-3 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs font-mono text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4DCC9] dark:border-[#38342D]">
                <button
                  type="button"
                  onClick={() => setShowGoogleConfigModal(false)}
                  className="px-3 py-1.5 text-xs text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTempClientId}
                  disabled={!tempGoogleClientId.trim()}
                  className="px-4 py-1.5 text-xs font-medium bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save & Connect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthScreen;
