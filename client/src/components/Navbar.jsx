import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mic, History, LogOut, User, Menu, X, MessageSquare } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './ui/BrandLogo';
import { MenuToggle } from './ui/MenuToggle';

export const Navbar = ({ activeTab, onTabChange, onOpenHome, onSignOut, onOpenContact }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const tabs = [
    { id: 'practice', label: 'Practice Studio', icon: Mic },
    { id: 'history', label: 'Past Sessions', icon: History },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <>
      <header className="bg-[#FAF6EE]/95 dark:bg-[#181714]/95 backdrop-blur-md border-b border-[#E4DCC9] dark:border-[#38342D] sticky top-0 z-30 transition-colors w-full">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 flex-nowrap">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0 flex-shrink group"
            onClick={onOpenHome}
            title="View Landing Page"
          >
            <BrandLogo size={40} className="w-9 h-9 sm:w-10 sm:h-10" />
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="text-xs sm:text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] leading-tight truncate group-hover:text-[#2F5233] dark:group-hover:text-[#689D6A] transition-colors">
                <span className="hidden min-[350px]:inline">AI Mock Interview Coach</span>
                <span className="min-[350px]:hidden">AI Coach</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#787268] dark:text-[#A8A297] leading-none mt-0.5 truncate hidden lg:block">
                Real-time speech & STAR analysis
              </p>
            </div>
          </div>

          {/* Desktop Tab Navigation with 21st.dev / Framer Motion Spring Pill Indicator */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FFFDF8] dark:bg-[#23211D] p-1 rounded-lg border border-[#E4DCC9] dark:border-[#38342D] flex-shrink-0 relative">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'text-[#FAF6EE] font-semibold'
                      : 'text-[#4A463F] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTabPill"
                      className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="relative z-10 w-3.5 h-3.5 flex-shrink-0" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>


          {/* Desktop User Profile, Theme Toggle & Sign Out (Hidden below md) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <ThemeToggle />

            {onOpenContact && (
              <button
                type="button"
                onClick={() => onOpenContact('general')}
                className="p-1.5 rounded-md hover:bg-[#FFFDF8] dark:hover:bg-[#23211D] text-[#787268] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors cursor-pointer border border-transparent hover:border-[#E4DCC9] dark:hover:border-[#38342D]"
                title="Support & Feedback"
                aria-label="Support & Feedback"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-2 lg:gap-2.5 p-1.5 rounded-md hover:bg-[#FFFDF8] dark:hover:bg-[#23211D] transition-colors cursor-pointer text-left border border-transparent hover:border-[#E4DCC9] dark:hover:border-[#38342D]"
              title="Edit Candidate Profile"
              aria-label="Edit Candidate Profile"
            >
              <div className="w-7 h-7 rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A] text-xs font-serif font-bold flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : <User className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] leading-tight max-w-[120px] truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-[10px] text-[#787268] dark:text-[#A8A297] leading-none max-w-[120px] truncate mt-0.5">
                  {user?.profile?.targetJob || user?.email}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onSignOut || logout}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-medium text-[#787268] dark:text-[#A8A297] hover:text-[#C2572B] dark:hover:text-[#E07A5F] bg-[#FFFDF8] dark:bg-[#23211D] hover:bg-[#FAF6EE] dark:hover:bg-[#181714] rounded-md transition-colors border border-[#E4DCC9] dark:border-[#38342D] cursor-pointer active:scale-[0.98] whitespace-nowrap"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Actions: Support & Feedback + Candidate Profile Avatar + Hamburger Menu Button */}
          <div className="md:hidden flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {onOpenContact && (
              <button
                type="button"
                onClick={() => onOpenContact('general')}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] text-[#787268] dark:text-[#A8A297] hover:text-[#2F5233] dark:hover:text-[#689D6A] hover:border-[#2F5233]/40 transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Support & Feedback"
                aria-label="Support & Feedback"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onTabChange('profile')}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                activeTab === 'profile'
                  ? 'bg-[#2F5233] text-[#FAF6EE] border-[#2F5233]'
                  : 'bg-[#FFFDF8] dark:bg-[#23211D] border-[#E4DCC9] dark:border-[#38342D] text-[#2F5233] dark:text-[#689D6A]'
              }`}
              title="Candidate Profile & Settings"
              aria-label="Candidate Profile & Settings"
            >
              {user?.name ? (
                <span className="text-xs font-serif font-bold">{user.name[0].toUpperCase()}</span>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>

            <MenuToggle
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Right-to-Left Transition, portaled to document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Darkened backdrop overlay */}
              <motion.div
                key="navbar-mobile-backdrop"
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
                key="navbar-mobile-drawer"
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
                          Practice Studio
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
                    Your personal interview simulation cockpit. Practice answers aloud with real-time speech telemetry, STAR rubric evaluation, and tailored resume practice.
                  </p>
                </div>

                {/* Candidate Profile Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF6EE] dark:bg-[#25231F] border border-[#E4DCC9] dark:border-[#38342D]">
                  <div className="w-8 h-8 rounded-md bg-[#FFFDF8] dark:bg-[#1E1C18] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A] text-xs font-serif font-bold flex-shrink-0">
                    {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#1C1B17] dark:text-[#FAF6EE] truncate">
                      {user?.name || 'Candidate'}
                    </div>
                    <div className="text-[10px] text-[#787268] dark:text-[#8E877C] truncate mt-0.5">
                      {user?.profile?.targetJob || user?.email}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]">
                    Active
                  </span>
                </div>

                {/* Navigation items with 21st.dev staggered spring transition */}
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
                  className="flex flex-col gap-2 pt-1"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 22 },
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
                        onTabChange('practice');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
                        activeTab === 'practice'
                          ? 'bg-[#2F5233] text-[#FAF6EE] font-semibold shadow-xs'
                          : 'bg-[#FAF6EE] dark:bg-[#25231F] text-[#4A463F] dark:text-[#FAF6EE] hover:bg-[#EEF3EE] dark:hover:bg-[#1E2E20] border border-[#E4DCC9] dark:border-[#38342D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Mic className="w-4 h-4" />
                        <span>Practice Studio</span>
                      </div>
                      {activeTab === 'practice' && (
                        <span className="w-2 h-2 rounded-full bg-[#FAF6EE] animate-pulse" />
                      )}
                    </button>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 22 },
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
                        onTabChange('history');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
                        activeTab === 'history'
                          ? 'bg-[#2F5233] text-[#FAF6EE] font-semibold shadow-xs'
                          : 'bg-[#FAF6EE] dark:bg-[#25231F] text-[#4A463F] dark:text-[#FAF6EE] hover:bg-[#EEF3EE] dark:hover:bg-[#1E2E20] border border-[#E4DCC9] dark:border-[#38342D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <History className="w-4 h-4" />
                        <span>Past Sessions & Progress</span>
                      </div>
                      {activeTab === 'history' && (
                        <span className="w-2 h-2 rounded-full bg-[#FAF6EE] animate-pulse" />
                      )}
                    </button>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 22 },
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
                        onTabChange('profile');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
                        activeTab === 'profile'
                          ? 'bg-[#2F5233] text-[#FAF6EE] font-semibold shadow-xs'
                          : 'bg-[#FAF6EE] dark:bg-[#25231F] text-[#4A463F] dark:text-[#FAF6EE] hover:bg-[#EEF3EE] dark:hover:bg-[#1E2E20] border border-[#E4DCC9] dark:border-[#38342D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4" />
                        <span>Candidate Profile & Settings</span>
                      </div>
                      {activeTab === 'profile' && (
                        <span className="w-2 h-2 rounded-full bg-[#FAF6EE] animate-pulse" />
                      )}
                    </button>
                  </motion.div>

                  {onOpenContact && (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, x: 22 },
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
                          onOpenContact('general');
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] bg-[#FAF6EE] dark:bg-[#25231F] text-[#2F5233] dark:text-[#689D6A] hover:bg-[#EEF3EE] dark:hover:bg-[#1E2E20] border border-[#E4DCC9] dark:border-[#38342D]"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Support & Feedback</span>
                      </button>
                    </motion.div>
                  )}
                </motion.nav>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#E4DCC9] dark:border-[#38342D] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#787268] dark:text-[#8E877C]">Appearance:</span>
                  <ThemeToggle />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSignOut) onSignOut();
                    else logout();
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#C2572B] dark:text-[#E07A5F] bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-lg transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
);
};

export default Navbar;
