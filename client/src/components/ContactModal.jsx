import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  Mic,
  Lightbulb,
  Bug,
  Mail,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { contactAPI } from '../services/api';

const CATEGORIES = [
  {
    id: 'general',
    label: 'General Inquiry',
    icon: Mail,
    description: 'Questions about features, scoring, or general help.',
    placeholderSubject: 'How does STAR scoring work for technical questions?',
  },
  {
    id: 'audio_mic',
    label: 'Audio / Mic Issue',
    icon: Mic,
    description: 'Microphone cutouts, transcription accuracy, or permissions.',
    placeholderSubject: 'Microphone stops transcribing after 30 seconds',
  },
  {
    id: 'feature_request',
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'Suggest new interview questions, rubrics, or tools.',
    placeholderSubject: 'Suggestion: Add System Design scenario questions',
  },
  {
    id: 'bug_report',
    label: 'Bug Report',
    icon: Bug,
    description: 'Report visual glitches, scoring errors, or broken flows.',
    placeholderSubject: 'Error when retrying question from past history',
  },
];

export const ContactModal = ({
  isOpen = false,
  onClose,
  initialCategory = 'general',
}) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const [category, setCategory] = useState(initialCategory);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachTelemetry, setAttachTelemetry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize category if prop changes while modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory || 'general');
      setIsSuccess(false);
      setErrorMsg('');
      if (isAuthenticated && user) {
        setName(user.name || '');
        setEmail(user.email || '');
      }
    }
  }, [isOpen, initialCategory, isAuthenticated, user]);

  // Focus trap, Escape key, and body + html scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (isAuthenticated && user) {
        messageInputRef.current?.focus();
      } else {
        firstInputRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled')
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen, onClose, isSubmitting, isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg('Please write a message with at least 10 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const metadata = attachTelemetry
        ? {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            speechRecognitionSupported:
              typeof window !== 'undefined' &&
              Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
            screenResolution:
              typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
          }
        : undefined;

      await contactAPI.submitContact({
        name: name.trim(),
        email: email.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        metadata,
      });

      setIsSuccess(true);
      toast.success('Your message has been sent to our team!');
    } catch (err) {
      const msg = err.message || 'Failed to send message. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setMessage('');
    setSubject('');
    setIsSuccess(false);
    setErrorMsg('');
    onClose?.();
  };

  const currentCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const CategoryIcon = currentCategoryObj.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain"
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isSubmitting && onClose?.()}
            className="fixed inset-0 bg-[#1C1B17]/60 dark:bg-black/75 backdrop-blur-xs overscroll-none"
            aria-hidden="true"
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Modal Card */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-lg bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-2xl shadow-2xl overflow-hidden text-[#1C1B17] dark:text-[#FAF6EE] my-auto flex flex-col max-h-[92dvh] overscroll-contain"
          >
            {/* Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#EEF3EE] dark:bg-[#2A352C] border border-[#D9E5DA] dark:border-[#38483B] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A] flex-shrink-0">
                  <CategoryIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="contact-modal-title"
                    className="text-sm sm:text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] leading-snug truncate"
                  >
                    Candidate Support & Feedback
                  </h2>
                  <p className="text-[11px] text-[#787268] dark:text-[#A8A297] truncate">
                    Direct help with speech rubrics, audio, or features
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#787268] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:bg-[#E4DCC9]/40 dark:hover:bg-[#38342D]/60 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            {isSuccess ? (
              <div className="p-6 overflow-y-auto overscroll-contain">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 text-center space-y-3.5"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#EEF3EE] dark:bg-[#2A352C] border border-[#D9E5DA] dark:border-[#38483B] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                      Message Received!
                    </h3>
                    <p className="text-xs text-[#4A463F] dark:text-[#A8A297] leading-relaxed">
                      Thank you, <strong className="text-[#1C1B17] dark:text-[#FAF6EE]">{name}</strong>. A confirmation has been logged, and our team will review your inquiry regarding <em>{currentCategoryObj.label}</em>.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetAndClose}
                      className="px-5 py-2 bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] text-[#FAF6EE] font-medium text-xs rounded-md transition-colors cursor-pointer"
                    >
                      Continue Practicing
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4">
                  <form id="contact-modal-form" onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Category Selector Pills */}
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#787268] dark:text-[#A8A297] mb-1.5">
                        Inquiry Topic
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const isSelected = category === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.id)}
                              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#EEF3EE] dark:bg-[#2A352C] border-[#2F5233] dark:border-[#689D6A] text-[#2F5233] dark:text-[#FAF6EE] shadow-2xs font-semibold'
                                  : 'bg-[#FAF6EE] dark:bg-[#181714] border-[#E4DCC9] dark:border-[#38342D] text-[#4A463F] dark:text-[#A8A297] hover:border-[#787268]'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#2F5233] dark:text-[#689D6A]' : 'text-[#787268] dark:text-[#8E877C]'}`} />
                              <span className="truncate leading-tight text-[11px] sm:text-xs">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Authenticated user card (Structured 2-line layout, ZERO overlap) */}
                    {isAuthenticated && user ? (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D]">
                        <div className="w-8 h-8 rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center font-serif font-bold text-[#2F5233] dark:text-[#689D6A] text-xs flex-shrink-0">
                          {user.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-[#1C1B17] dark:text-[#FAF6EE] truncate">
                              {user.name || 'Candidate'}
                            </span>
                            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#2F5233] dark:text-[#689D6A] bg-[#EEF3EE] dark:bg-[#2A352C] px-1.5 py-0.5 rounded border border-[#D9E5DA] dark:border-[#38483B] flex-shrink-0">
                              Signed In
                            </span>
                          </div>
                          <p className="text-[11px] text-[#787268] dark:text-[#A8A297] truncate mt-0.5 leading-none">
                            Replies to: <span className="text-[#1C1B17] dark:text-[#FAF6EE] font-medium">{user.email}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Name & Email Inputs for Unauthenticated Guests (e.g. on Landing Page) */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] mb-1">
                            Your Name <span className="text-[#C2572B]">*</span>
                          </label>
                          <input
                            ref={firstInputRef}
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Rivera"
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] mb-1">
                            Email Address <span className="text-[#C2572B]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex@example.com"
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] mb-1">
                        Subject <span className="text-[#787268] dark:text-[#A8A297] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={currentCategoryObj.placeholderSubject}
                        maxLength={120}
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE]">
                          How can we help? <span className="text-[#C2572B]">*</span>
                        </label>
                        <span className="text-[10px] text-[#787268] dark:text-[#A8A297]">
                          {message.length} / 3000
                        </span>
                      </div>
                      <textarea
                        ref={messageInputRef}
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          category === 'audio_mic'
                            ? 'Describe your microphone behavior: browser, operating system, and any error message...'
                            : category === 'feature_request'
                            ? 'Describe the scenario question, scoring metric, or coaching feature you would like to see added...'
                            : 'Please share your feedback, question, or inquiry...'
                        }
                        maxLength={3000}
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#A8A297] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors resize-y leading-relaxed font-sans min-h-[75px]"
                      />
                    </div>

                    {/* Telemetry disclosure */}
                    <div className="p-2.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A] mt-0.5 flex-shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE]">
                          <input
                            type="checkbox"
                            checked={attachTelemetry}
                            onChange={(e) => setAttachTelemetry(e.target.checked)}
                            className="accent-[#2F5233] rounded cursor-pointer"
                          />
                          <span>Attach browser diagnostic telemetry</span>
                        </label>
                        <p className="text-[10.5px] text-[#787268] dark:text-[#A8A297] leading-tight">
                          Helps debug audio compatibility. Excludes audio recordings and personal data.
                        </p>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 bg-[#FAEEE8] dark:bg-[#321C14] border border-[#F4D8CC] dark:border-[#4E2719] rounded-md flex items-center gap-2 text-xs text-[#C2572B] dark:text-[#E07A5F]">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Pinned Footer Actions */}
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE]/80 dark:bg-[#181714]/80 flex items-center justify-end gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] hover:bg-[#F3EDE0] dark:hover:bg-[#2D2A24] text-[#1C1B17] dark:text-[#FAF6EE] text-xs font-medium rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="contact-modal-form"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] text-[#FAF6EE] font-medium text-xs rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
