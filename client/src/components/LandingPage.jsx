// Every number or claim on this page must be derivable from the code or verifiably true. No unsupported absolutes (100%, zero, always, never) unless the code guarantees it.
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Mic,
  Zap,
  ChevronDown,
  ArrowRight,
  Clock,
  BarChart3,
  Lock,
  Play,
  Compass,
  BrainCircuit,
  Sliders,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ShimmerButton } from './ui/ShimmerButton';
import { AIVoiceVisualizer } from './ui/AIVoiceVisualizer';
import { Marquee } from './ui/Marquee';
import { BentoGrid, BentoCard } from './ui/BentoGrid';
import { InteractiveDemoSimulator } from './ui/InteractiveDemoSimulator';
import { StatsCounterBar } from './ui/StatsCounterBar';
import { ComparisonGrid } from './ui/ComparisonGrid';
import { BrandLogo } from './ui/BrandLogo';
import { Footer } from './Footer';
import { ContactModal } from './ContactModal';
import { MenuToggle } from './ui/MenuToggle';

/* ========================================================================= */
/* 1. REUSABLE SUB-COMPONENT: FeatureCard (Warm Paper Editorial Card)        */
/* ========================================================================= */
export const FeatureCard = ({
  icon,
  title,
  badge,
  description,
  footerLabel = 'Learn more',
}) => {
  return (
    <div className="group relative rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 sm:p-7 shadow-none hover:border-[#2F5233]/60 dark:hover:border-[#689D6A]/60 transition-colors flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A]">
            {icon}
          </div>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#FAF6EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] border border-[#E4DCC9] dark:border-[#38342D]">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] group-hover:text-[#2F5233] dark:group-hover:text-[#689D6A] transition-colors">
          {title}
        </h3>

        <p className="text-sm text-[#4A463F] dark:text-[#A8A297] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-5 mt-5 border-t border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-between text-xs font-medium text-[#787268] dark:text-[#A8A297] group-hover:text-[#2F5233] dark:group-hover:text-[#689D6A] transition-colors">
        <span>{footerLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 text-[#2F5233] dark:text-[#689D6A]" />
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 2. REUSABLE SUB-COMPONENT: HowItWorks (Calm Editorial Steps)             */
/* ========================================================================= */
export const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Select a Topic',
      category: 'Question Bank',
      description:
        'Choose from curated behavioral (STAR), system architecture, or leadership dilemmas matched to real hiring bars.',
      icon: <Compass className="w-5 h-5 text-[#2F5233] dark:text-[#689D6A]" />,
      badges: ['STAR Matrix', 'Curated Bank', 'Real Rubrics'],
    },
    {
      number: '02',
      title: 'Answer with Voice',
      category: 'Browser Speech API',
      description:
        'Speak directly into your browser microphone. Web Speech API captures your words in real time with live frequency feedback and pacing telemetry.',
      icon: <Mic className="w-5 h-5 text-[#2F5233] dark:text-[#689D6A]" />,
      badges: ['In-Browser API', 'Live Soundwave', 'WPM Telemetry'],
    },
    {
      number: '03',
      title: 'Get Structured Feedback',
      category: 'AI STAR Scoring',
      description:
        'Receive rubric breakdown for Situation, Task, Action, and Result, pacing analysis, filler word audits, and executive phrasing tips.',
      icon: <BarChart3 className="w-5 h-5 text-[#2F5233] dark:text-[#689D6A]" />,
      badges: ['Rapid Analysis', 'Filler Word Tracker', 'STAR Scoring'],
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 px-6 lg:px-8 max-w-7xl mx-auto relative border-t border-[#E4DCC9] dark:border-[#38342D]"
    >
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE]">
          How It Works
        </h2>
        <p className="text-[#4A463F] dark:text-[#A8A297] text-base sm:text-lg">
          A focused, low-friction preparation loop engineered for deliberate interview mastery.
        </p>
      </div>

      <motion.div
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 relative"
      >
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            variants={{
              hidden: { opacity: 0, y: 30 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: 'easeOut' },
              },
            }}
            className="relative rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 sm:p-7 shadow-none hover:border-[#2F5233]/60 dark:hover:border-[#689D6A]/60 transition-colors overflow-hidden flex flex-col justify-between group"
          >
            <span className="text-7xl font-serif font-bold text-[#E4DCC9]/70 dark:text-[#38342D]/80 absolute -top-3 -right-2 select-none pointer-events-none">
              {step.number}
            </span>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="font-mono text-xs text-[#2F5233] dark:text-[#689D6A] uppercase tracking-wider font-semibold">
                  {step.category}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-[#4A463F] dark:text-[#A8A297] leading-relaxed mt-2">
                  {step.description}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {step.badges.map((b, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#A8A297] border border-[#E4DCC9] dark:border-[#38342D]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-between text-xs text-[#787268] dark:text-[#A8A297]">
              <span className="font-mono">Step {step.number}</span>
              <span className="text-[#2F5233] dark:text-[#689D6A] font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Explore flow <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

/* ========================================================================= */
/* 3. REUSABLE SUB-COMPONENT: AccordionItem (Smooth Framer Motion Height)   */
/* ========================================================================= */
export const AccordionItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] hover:border-[#2F5233]/40 dark:hover:border-[#689D6A]/40 transition-colors overflow-hidden shadow-none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 sm:px-6 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
      >
        <span className="text-base font-serif font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-6 h-6 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center flex-shrink-0 text-[#4A463F] dark:text-[#A8A297]"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Smooth height expand transition with Framer Motion */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#4A463F] dark:text-[#A8A297] leading-relaxed px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-[#E4DCC9] dark:border-[#38342D]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ========================================================================= */
/* 3.5. REUSABLE SUB-COMPONENT: ScoreCounter (Scroll-triggered CountUp)      */
/* ========================================================================= */
export const ScoreCounter = ({ target = 0, start = false, duration = 1.2, delay = 0, decimals = 1 }) => {
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    let animId = null;
    let startTime = null;
    const durationMs = duration * 1000;
    const delayMs = delay * 1000;

    const timer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Cubic ease-out: 1 - (1 - progress)^3
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = ease * target;

        if (progress < 1) {
          setVal(current);
          animId = requestAnimationFrame(step);
        } else {
          setVal(target);
        }
      };

      animId = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [start, target, duration, delay]);

  const display = decimals === 0 ? Math.round(val) : val.toFixed(decimals);
  return <span>{display}</span>;
};

/* ========================================================================= */
/* 4. MASTER COMPONENT: LandingPage                                          */
/* ========================================================================= */
export const LandingPage = ({ onLogin, onSignUp, onOpenAuth, onGoToStudio }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState('general');
  const [evalInView, setEvalInView] = useState(false);
  const evalCardRef = useRef(null);
  const isHookInView = useInView(evalCardRef, { once: true, margin: '-100px' });
  const isEvalInView = evalInView || isHookInView;

  const handleOpenContact = (cat = 'general') => {
    setContactCategory(cat);
    setContactModalOpen(true);
  };

  // Lock body and html scroll while mobile menu drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [mobileMenuOpen]);

  const handleAuthAction = (mode = 'login') => {
    if (mode === 'signup' && onSignUp) {
      onSignUp();
    } else if (mode === 'login' && onLogin) {
      onLogin();
    } else if (onOpenAuth) {
      onOpenAuth(mode);
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenAudioFaq = () => {
    setActiveFaqIndex(1);
    const element = document.getElementById('faq');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      question: 'How does the AI evaluate my interview responses?',
      answer:
        'Our coach analyzes your transcript using the STAR framework (Situation, Task, Action, Result). Built on high-speed LLM inference (Llama 3.3 70B), it evaluates your answer on structure, conciseness, pacing (words per minute), and detects filler words to provide actionable suggestions in seconds.',
    },
    {
      question: 'Is my microphone audio recorded or stored on remote servers?',
      answer:
        'Our servers never receive or store your audio. They only receive the text transcript of what you said. Speech-to-text itself is done by your browser’s built-in Web Speech API. In most browsers (such as Chrome and Edge) this works by sending audio to the browser vendor’s speech service, so avoid practicing with confidential company information. If you prefer, switch to Type Answer mode and no audio is used at all.',
    },
    {
      question: 'What types of interview questions are covered?',
      answer:
        'We support curated practice questions spanning Behavioral (conflict resolution, leadership, failure), Situational dilemmas, and Technical Problem Solving, plus up to 40 more generated from your own resume.',
    },
    {
      question: 'Can I type my response manually if I do not have a microphone?',
      answer:
        'Yes. While spoken practice is recommended to simulate real interview pressure and track speaking pace (WPM), you can switch to text editing mode anytime to refine or paste written answers.',
    },
    {
      question: 'What speech pace (WPM) is recommended for interviews?',
      answer:
        'The ideal conversational pace for professional interviews is between 120 to 150 words per minute. Our live telemetry tracks your duration and word count to help you avoid rushing or dragging.',
    },
    {
      question: 'Can I review my past interview practice sessions and scores?',
      answer:
        'Yes. All completed sessions are automatically saved to your private history dashboard with timestamps, category tags, STAR scores, filler word tallies, and suggestions so you can measure your progress over time.',
    },
    {
      question: 'What happens to my uploaded resume?',
      answer:
        'Your resume is processed only to generate personalized interview questions. The extracted text is stored securely and tied to your account - it is never shared, sold, or used for any other purpose.',
    },
  ];

  const coreFeatures = [
    {
      icon: <BrainCircuit className="w-5 h-5" />,
      title: 'STAR Rubric Grading',
      badge: 'Evaluation',
      description:
        'Detailed evaluation across Situation, Task, Action, and Result to ensure your responses are concrete and metric-backed.',
    },
    {
      icon: <Mic className="w-5 h-5" />,
      title: 'In-Browser Speech API',
      badge: 'Web Speech API',
      description:
        'Real-time voice transcription using the Web Speech API, with live frequency indicators.',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Pacing & WPM Gauge',
      badge: 'Telemetry',
      description:
        'Tracks your words-per-minute speed and answer duration to keep your delivery precisely within the optimal 1-2 minute conversational window.',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Ultra-Fast AI Scoring',
      badge: 'Fast Scoring',
      description:
        'Generates rich, actionable feedback and structural suggestions in just a few seconds the moment you conclude speaking.',
    },
    {
      icon: <Sliders className="w-5 h-5" />,
      title: 'Filler Word Heatmap',
      badge: 'Clarity Audit',
      description:
        'Detects subconscious filler patterns like "um", "like", and "basically" so you can build polished executive communication presence.',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Private Candidate Dashboard',
      badge: 'Authenticated',
      description:
        "All interview history, transcriptions, and scoring analytics are only visible to you once you're logged in.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] font-sans selection:bg-[#2F5233] selection:text-[#FAF6EE] relative transition-colors duration-200 w-full overflow-x-clip">
      {/* ========================================================= */}
      {/* 1. HEADER (WARM PAPER & INK)                             */}
      {/* ========================================================= */}
      <header
        className="sticky top-0 z-40 bg-[#FAF6EE]/95 dark:bg-[#181714]/95 backdrop-blur-md border-b border-[#E4DCC9] dark:border-[#38342D] transition-colors w-full"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3 flex-nowrap">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0 flex-shrink"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <BrandLogo size={40} className="w-9 h-9 sm:w-10 sm:h-10" />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-sm sm:text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] block leading-snug truncate">
                AI Mock Interview Coach
              </span>
              <p className="text-[10px] sm:text-[11px] text-[#787268] dark:text-[#A8A297] leading-tight mt-0.5 truncate hidden sm:block">
                STAR Analytics & Real-Time Speech AI
              </p>
            </div>
          </div>

          {/* Desktop Nav Links (Hidden below md) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A463F] dark:text-[#A8A297]">
            <button
              onClick={() => scrollToSection('demo')}
              className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer flex items-center gap-1 text-[#2F5233] dark:text-[#689D6A] font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('compare')}
              className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer"
            >
              Comparison
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => handleOpenContact('general')}
              className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Action Buttons (Hidden below md) */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-[#4A463F] dark:text-[#A8A297]">
                  Hi, {user?.name ? user.name.split(' ')[0] : 'Candidate'}
                </span>
                {onGoToStudio && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={onGoToStudio}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-[#FAF6EE] bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] rounded-md transition-colors cursor-pointer"
                  >
                    Go to Studio →
                  </motion.button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium text-[#787268] hover:text-[#1C1B17] dark:text-[#A8A297] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleAuthAction('login')}
                  className="px-4 py-2 text-sm font-medium text-[#4A463F] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors duration-200 cursor-pointer"
                >
                  Login
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleAuthAction('signup')}
                  className="px-4 py-2 text-sm font-medium text-[#FAF6EE] bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] rounded-md transition-colors cursor-pointer"
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Actions: Support & Feedback + MenuToggle */}
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleOpenContact('general')}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] text-[#787268] dark:text-[#A8A297] hover:text-[#2F5233] dark:hover:text-[#689D6A] hover:border-[#2F5233]/40 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Support & Feedback"
              aria-label="Support & Feedback"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <MenuToggle
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            />
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer (Right-to-Left Transition, portaled to document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Darkened backdrop overlay */}
              <motion.div
                key="landing-mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs md:hidden overscroll-none"
                aria-hidden="true"
                onWheel={(e) => e.preventDefault()}
                onTouchMove={(e) => e.preventDefault()}
              />

              {/* Slide-over panel (Right-to-Left) */}
              <motion.div
                key="landing-mobile-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 z-[80] w-[84vw] max-w-xs sm:max-w-sm bg-[#FFFDF8] dark:bg-[#1E1C18] border-l border-[#E4DCC9] dark:border-[#38342D] shadow-2xl flex flex-col justify-between p-5 sm:p-6 md:hidden overflow-y-auto overscroll-contain text-left"
              >
                <div className="space-y-4">
                  {/* Drawer Header: Web Page Name + Purpose Brief */}
                  <div className="pb-3.5 border-b border-[#E4DCC9] dark:border-[#38342D] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BrandLogo size={32} className="w-8 h-8 flex-shrink-0" showSparkle={false} />
                        <div className="min-w-0">
                          <h2 className="font-serif font-bold text-sm sm:text-base text-[#1C1B17] dark:text-[#FAF6EE] leading-tight truncate">
                            AI Mock Interview Coach
                          </h2>
                          <span className="inline-block text-[10px] font-mono font-medium text-[#2F5233] dark:text-[#689D6A] uppercase tracking-wider">
                            Methodical STAR Practice
                          </span>
                        </div>
                      </div>
                      <MenuToggle
                        open={mobileMenuOpen}
                        onOpenChange={setMobileMenuOpen}
                      />
                    </div>

                    {/* Simple, professional brief about the page */}
                    <p className="text-xs text-[#787268] dark:text-[#A8A297] leading-relaxed pt-1">
                      Master behavioral interviews with real-time speech telemetry, pacing analytics, and structured STAR framework grading.
                    </p>
                  </div>

                  {/* Navigation Links with 21st.dev staggered spring transition */}
                  <motion.nav
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.06,
                          delayChildren: 0.08,
                        },
                      },
                    }}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-1 text-sm font-medium text-[#4A463F] dark:text-[#A8A297]"
                  >
                    {[
                      { id: 'how-it-works', label: 'How It Works', action: () => scrollToSection('how-it-works') },
                      { id: 'features', label: 'Features', action: () => scrollToSection('features') },
                      { id: 'compare', label: 'Comparison', action: () => scrollToSection('compare') },
                      { id: 'faq', label: 'FAQ', action: () => scrollToSection('faq') },
                      { id: 'contact', label: 'Contact & Feedback', highlight: true, action: () => handleOpenContact('general') },
                    ].map((item) => (
                      <motion.div
                        key={item.id}
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          show: {
                            opacity: 1,
                            x: 0,
                            transition: { type: 'spring', stiffness: 350, damping: 26 },
                          },
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            item.action();
                          }}
                          className={`w-full text-left py-2.5 px-3.5 rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
                            item.highlight
                              ? 'bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] font-semibold border border-[#D9E5DA] dark:border-[#2D4530]'
                              : 'hover:bg-[#FAF6EE] dark:hover:bg-[#25231F] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                          }`}
                        >
                          {item.label}
                        </button>
                      </motion.div>
                    ))}
                  </motion.nav>
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-[#E4DCC9] dark:border-[#38342D] space-y-3.5">
                  {/* Theme Switcher Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#787268] dark:text-[#8E877C]">Appearance:</span>
                    <ThemeToggle />
                  </div>

                  <div className="flex flex-col gap-2">
                    {isAuthenticated ? (
                      <>
                        {onGoToStudio && (
                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              onGoToStudio();
                            }}
                            className="w-full py-2.5 text-center text-xs font-medium text-[#FAF6EE] bg-[#2F5233] hover:bg-[#244027] rounded-lg active:scale-[0.98] transition-colors shadow-xs cursor-pointer"
                          >
                            Go to Studio →
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logout();
                          }}
                          className="w-full py-2 text-center text-xs font-medium text-[#C2572B] dark:text-[#E07A5F] bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-lg transition-colors cursor-pointer"
                        >
                          Log Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleAuthAction('login');
                          }}
                          className="w-full py-2.5 text-center text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] bg-[#FAF6EE] dark:bg-[#25231F] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg active:scale-[0.98] cursor-pointer"
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleAuthAction('signup');
                          }}
                          className="w-full py-2.5 text-center text-xs font-medium text-[#FAF6EE] bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] rounded-lg active:scale-[0.98] transition-colors shadow-xs cursor-pointer"
                        >
                          Create Free Account
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
          </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 2. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative pt-16 sm:pt-20 pb-16 px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient subtle grid mesh background (ui-ux-pro-max + 21st.dev style) */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-40 dark:opacity-20 pointer-events-none">
          <div className="w-[800px] h-[450px] bg-[radial-gradient(ellipse_at_center,_#2F5233_0%,_transparent_70%)] opacity-10 dark:opacity-25 blur-3xl" />
        </div>
        <div 
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#E4DCC9_1px,transparent_1px),linear-gradient(to_bottom,#E4DCC9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38342D_1px,transparent_1px),linear-gradient(to_bottom,#38342D_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 dark:opacity-20 pointer-events-none" 
        />

        <motion.div
          variants={{
            initial: {},
            animate: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="initial"
          animate="animate"
          className="text-center max-w-4xl mx-auto space-y-6"
        >
          {/* 1. Animated Chip Badge */}
          <motion.div
            variants={{
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
            className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-[11px] sm:text-xs text-[#4A463F] dark:text-[#A8A297] shadow-sm hover:border-[#2F5233]/40 dark:hover:border-[#689D6A]/50 transition-colors"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F5233] dark:bg-[#689D6A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F5233] dark:bg-[#689D6A]" />
            </span>
            <span className="font-medium truncate">Instant AI Evaluation</span>
            <span className="text-[#E4DCC9] dark:text-[#38342D] shrink-0">•</span>
            <span className="text-[#2F5233] dark:text-[#689D6A] font-semibold truncate">Real-Time STAR Telemetry</span>
          </motion.div>

          {/* 2. Main Headline */}
          <motion.h1
            variants={{
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
            className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE] leading-[1.15]"
          >
            Ace Every Interview with Calm, Methodical AI Voice Coaching
          </motion.h1>

          {/* 3. Subtext paragraph */}
          <motion.p
            variants={{
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
            className="text-base sm:text-lg text-[#4A463F] dark:text-[#A8A297] max-w-2xl mx-auto leading-relaxed"
          >
            Practice behavioral and technical questions out loud. Get constructive feedback on your{' '}
            <strong className="text-[#1C1B17] dark:text-[#FAF6EE] font-semibold">STAR method</strong> delivery, speech pacing (WPM), clarity, and filler words before talking to real interviewers.
          </motion.p>

          {/* 4. Button row */}
          <motion.div
            variants={{
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
            className="space-y-6"
          >
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ShimmerButton
                onClick={() => {
                  if (isAuthenticated && onGoToStudio) {
                    onGoToStudio();
                  } else {
                    handleAuthAction('signup');
                  }
                }}
                className="w-full sm:w-auto"
              >
                <span>{isAuthenticated ? 'Go to Practice Studio' : 'Start Free Practice'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </ShimmerButton>

              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto px-7 py-3 rounded-md border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] hover:bg-[#FAF6EE] dark:hover:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] font-medium text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-none"
              >
                <Play className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A] fill-[#2F5233] dark:fill-[#689D6A]" />
                <span>See How It Works</span>
              </motion.button>
            </div>

            <div className="pt-8 pb-2 border-t border-[#E4DCC9] dark:border-[#38342D] max-w-2xl mx-auto text-center">
              <p className="text-xs text-[#787268] dark:text-[#A8A297] font-medium tracking-wide">
                Structured behavioral & technical questions designed around industry hiring bars.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ========================================================= */}
        {/* HERO LIVE DEMO CARD (21st.dev Interactive Voice Visualizer)*/}
        {/* ========================================================= */}
        <motion.div
          id="preview"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.55 }}
          className="mt-12 max-w-5xl mx-auto"
        >
          <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-6 sm:p-8 shadow-none text-[#1C1B17] dark:text-[#FAF6EE]">
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E4DCC9] dark:border-[#38342D] gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4DCC9] dark:bg-[#38342D] shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4DCC9] dark:bg-[#38342D] shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4DCC9] dark:bg-[#38342D] shrink-0" />
                <span className="ml-1 sm:ml-2 text-xs font-mono text-[#787268] dark:text-[#A8A297] truncate">
                  AI Interview Studio <span className="hidden sm:inline">— Live Session</span>
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 rounded-full bg-[#EEF3EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] text-xs border border-[#D9E5DA] dark:border-[#38483B] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F5233] dark:bg-[#689D6A] animate-pulse shrink-0" />
                <span className="hidden sm:inline">Interactive Live Preview</span>
                <span className="sm:hidden">Live Demo</span>
              </div>
            </div>

            {/* Workspace Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Question & Audio Wave */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-4 bg-[#FAF6EE] dark:bg-[#181714] rounded-md border border-[#E4DCC9] dark:border-[#38342D] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#2F5233] dark:text-[#689D6A] font-medium uppercase tracking-wider text-[11px]">
                      Behavioral Interview • Conflict Resolution
                    </span>
                    <span className="text-[#787268] dark:text-[#A8A297] font-mono text-[11px]">Target: ~90s</span>
                  </div>
                  <h4 className="text-base font-serif font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                    "Tell me about a time you disagreed with a colleague on a project decision. How did you resolve it?"
                  </h4>
                </div>

                {/* 21st.dev Interactive Voice Visualizer */}
                <AIVoiceVisualizer visualizerBars={28} />
              </div>

              {/* Instant Score Card Preview */}
              <motion.div
                ref={evalCardRef}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-100px' }}
                onViewportEnter={() => setEvalInView(true)}
                className="md:col-span-5 bg-[#FAF6EE] dark:bg-[#181714] p-5 rounded-md border border-[#E4DCC9] dark:border-[#38342D] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-serif font-bold tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
                    AI Evaluation
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#EEF3EE] dark:bg-[#23211D] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#38483B]">
                    <ScoreCounter target={88} start={isEvalInView} duration={1.5} delay={0} decimals={0} /> / 100 • Strong
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[#4A463F] dark:text-[#A8A297] mb-1">
                      <span>STAR Framework</span>
                      <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                        <ScoreCounter target={9.0} start={isEvalInView} duration={1.2} delay={0.15} decimals={1} /> / 10
                      </span>
                    </div>
                    <div className="w-full bg-[#E4DCC9] dark:bg-[#38342D] h-1.5 rounded-sm overflow-hidden">
                      <motion.div
                        variants={{
                          initial: { width: '0%' },
                          animate: {
                            width: '90%',
                            transition: { duration: 1.2, ease: 'easeOut', delay: 0.15 },
                          },
                        }}
                        className="bg-[#2F5233] dark:bg-[#689D6A] h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#4A463F] dark:text-[#A8A297] mb-1">
                      <span>Clarity & Flow</span>
                      <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                        <ScoreCounter target={8.5} start={isEvalInView} duration={1.2} delay={0.3} decimals={1} /> / 10
                      </span>
                    </div>
                    <div className="w-full bg-[#E4DCC9] dark:bg-[#38342D] h-1.5 rounded-sm overflow-hidden">
                      <motion.div
                        variants={{
                          initial: { width: '0%' },
                          animate: {
                            width: '85%',
                            transition: { duration: 1.2, ease: 'easeOut', delay: 0.3 },
                          },
                        }}
                        className="bg-[#2F5233] dark:bg-[#689D6A] h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#4A463F] dark:text-[#A8A297] mb-1">
                      <span>Filler Words Detected</span>
                      <span className="font-semibold text-[#2F5233] dark:text-[#689D6A]">
                        <ScoreCounter target={1} start={isEvalInView} duration={1.2} delay={0.45} decimals={0} /> (Minimal)
                      </span>
                    </div>
                    <div className="w-full bg-[#E4DCC9] dark:bg-[#38342D] h-1.5 rounded-sm overflow-hidden">
                      <motion.div
                        variants={{
                          initial: { width: '0%' },
                          animate: {
                            width: '95%',
                            transition: { duration: 1.2, ease: 'easeOut', delay: 0.45 },
                          },
                        }}
                        className="bg-[#2F5233] dark:bg-[#689D6A] h-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-between text-[11px] text-[#787268] dark:text-[#A8A297]">
                  <span>⚡ Evaluated in ~1-2s</span>
                  <button
                    type="button"
                    onClick={() => handleAuthAction('signup')}
                    className="text-[#2F5233] dark:text-[#689D6A] hover:underline font-semibold cursor-pointer"
                  >
                    Try it yourself →
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================= */}
      {/* 2.2 IMPACT METRICS COUNTER BAR                            */}
      {/* ========================================================= */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto -mt-6 sm:-mt-10 mb-14 relative z-20">
        <StatsCounterBar onOpenAudioFaq={handleOpenAudioFaq} />
      </section>

      {/* ========================================================= */}
      {/* 2.3 INTERACTIVE LIVE DEMO SIMULATOR                       */}
      {/* ========================================================= */}
      <section id="demo" className="px-6 lg:px-8 max-w-7xl mx-auto mb-16 relative z-20">
        <InteractiveDemoSimulator onGetStarted={() => handleAuthAction('signup')} />
      </section>

      {/* ========================================================= */}
      {/* 2.5 21ST.DEV INFINITE TOPIC & RUBRIC MARQUEE              */}
      {/* ========================================================= */}
      <section className="py-6 border-y border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8]/70 dark:bg-[#23211D]/70 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FAF6EE] dark:from-[#181714] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FAF6EE] dark:from-[#181714] to-transparent z-10 pointer-events-none" />
        
        <Marquee pauseOnHover duration="38s" gap="1.5rem">
          {[
            { label: 'Amazon Leadership Principles', tag: 'Behavioral' },
            { label: 'STAR Framework Scoring', tag: 'Rubric' },
            { label: 'Sub-Second AI Evaluation', tag: 'Fast AI' },
            { label: 'In-Browser Speech API', tag: 'NO AUDIO STORED' },
            { label: 'Live Speech Pacing (WPM)', tag: 'Telemetry' },
            { label: 'Automated Filler Word Audits', tag: 'Clarity' },
            { label: 'System Architecture & Scalability', tag: 'Technical' },
            { label: 'Resume-Tailored Questions', tag: 'Personalized' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] shadow-2xs hover:border-[#2F5233]/40 transition-colors whitespace-nowrap cursor-default"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F5233] dark:bg-[#689D6A]" />
              <span>{item.label}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-[#787268] dark:text-[#A8A297]">
                {item.tag}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ========================================================= */}
      {/* 3. HOW IT WORKS TIMELINE                                  */}
      {/* ========================================================= */}
      <HowItWorks />

      {/* ========================================================= */}
      {/* 4. 21ST.DEV BENTO GRID FEATURES                           */}
      {/* ========================================================= */}
      <section id="features" className="py-20 px-6 lg:px-8 max-w-7xl mx-auto relative border-t border-[#E4DCC9] dark:border-[#38342D]">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-xs text-[#2F5233] dark:text-[#689D6A] font-medium">
            <span>Production-Grade Practice</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE]">
            Engineered for Deliberate Interview Mastery
          </h2>
          <p className="text-[#4A463F] dark:text-[#A8A297] text-base sm:text-lg">
            Every score and suggestion comes from an authentic evaluation of what you actually said — no gimmicks.
          </p>
        </div>

        <BentoGrid>
          {/* Card 1 (Span 2): In-Browser Speech Recognition */}
          <BentoCard
            name="In-Browser Voice & Waveform Telemetry"
            className="md:col-span-2"
            Icon={Mic}
            badge="No Audio Stored"
            description="Speak into your microphone and watch live waveform feedback. Your audio is transcribed by your browser’s built-in speech recognition, and only the text is sent to our servers."
            cta="Try voice studio"
            background={
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-36 flex items-center justify-end pr-8 gap-1.5 opacity-30">
                {[30, 60, 90, 45, 80, 100, 70, 40, 85, 95, 50, 75, 40, 90, 60].map((h, i) => (
                  <div key={i} className="w-1.5 bg-[#2F5233] dark:bg-[#689D6A] rounded-full" style={{ height: `${h}%` }} />
                ))}
              </div>
            }
          />

          {/* Card 2 (Span 1): STAR Rubric Scoring */}
          <BentoCard
            name="STAR Framework Scoring"
            className="md:col-span-1"
            Icon={BarChart3}
            badge="Methodical Rubric"
            description="Get structured breakdown of Situation, Task, Action, and Result with quantifiable strength scores."
            cta="See rubric breakdown"
            background={
              <div className="absolute inset-0 bg-radial from-[#2F5233]/10 to-transparent" />
            }
          />

          {/* Card 3 (Span 1): Resume-Tailored Questions */}
          <BentoCard
            name="Resume-Tailored Questions"
            className="md:col-span-1"
            Icon={BrainCircuit}
            badge="Personalized"
            description="Upload your CV to extract key technical skills and auto-generate questions tailored to your exact career tier."
            cta="View resume studio"
            background={
              <div className="absolute inset-0 bg-radial from-[#C2572B]/10 to-transparent" />
            }
          />

          {/* Card 4 (Span 2): Speech Pacing & Filler Detection */}
          <BentoCard
            name="Pacing Telemetry & Filler Word Audits"
            className="md:col-span-2"
            Icon={Sliders}
            badge="Executive Delivery"
            description="Track your Words Per Minute against industry standards (130-160 WPM). Automatically identify filler words like 'um', 'like', and 'basically'."
            cta="Explore speech metrics"
            background={
              <div className="absolute right-6 top-8 px-4 py-2 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-xs font-mono text-[#2F5233] dark:text-[#689D6A]">
                138 WPM • 0 fillers
              </div>
            }
          />
        </BentoGrid>
      </section>

      {/* ========================================================= */}
      {/* 4.5 COMPARISON GRID                                       */}
      {/* ========================================================= */}
      <section id="compare" className="py-20 px-6 lg:px-8 max-w-7xl mx-auto relative border-t border-[#E4DCC9] dark:border-[#38342D]">
        <ComparisonGrid />
      </section>

      {/* ========================================================= */}
      {/* 5. FAQ ACCORDION (Animated height with Framer Motion)     */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 px-6 lg:px-8 max-w-4xl mx-auto relative border-t border-[#E4DCC9] dark:border-[#38342D]">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE]">
            Frequently Asked Questions
          </h2>
          <p className="text-[#4A463F] dark:text-[#A8A297] text-sm sm:text-base">
            Everything you need to know about our scoring rubrics, speech transcription, and privacy.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              question={faq.question}
              answer={faq.answer}
              isOpen={activeFaqIndex === idx}
              onToggle={() => setActiveFaqIndex(activeFaqIndex === idx ? -1 : idx)}
            />
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CALL TO ACTION (21st.dev Shimmer Banner)               */}
      {/* ========================================================= */}
      <section className="py-20 px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="relative rounded-2xl bg-[#FFFDF8] dark:bg-[#23211D] p-8 sm:p-14 text-center border border-[#E4DCC9] dark:border-[#38342D] overflow-hidden shadow-sm">
          {/* Subtle ambient spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_top,_#2F5233_0%,_transparent_70%)] opacity-15 dark:opacity-25 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EEF3EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#38483B]">
              Ready When You Are
            </span>

            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] tracking-tight">
              Start Practicing Your Next Mock Interview Today
            </h2>
            <p className="text-[#4A463F] dark:text-[#A8A297] text-base leading-relaxed">
              Practice your spoken responses, sharpen your STAR framework delivery, and eliminate speech fillers before talking to real interviewers.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ShimmerButton
                onClick={() => handleAuthAction('signup')}
                className="w-full sm:w-auto"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </ShimmerButton>

              <button
                type="button"
                onClick={() => handleAuthAction('login')}
                className="w-full sm:w-auto px-6 py-3 bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#23211D] text-[#1C1B17] dark:text-[#FAF6EE] font-medium text-sm rounded-md border border-[#E4DCC9] dark:border-[#38342D] transition-colors cursor-pointer"
              >
                Sign In to Existing Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. ENHANCED FOOTER & CONTACT MODAL                        */}
      {/* ========================================================= */}
      <Footer
        onOpenContact={handleOpenContact}
        onNavigateTab={onGoToStudio ? () => onGoToStudio() : undefined}
        onScrollToSection={scrollToSection}
        variant="landing"
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialCategory={contactCategory}
      />
    </div>
  );
};

export default LandingPage;
