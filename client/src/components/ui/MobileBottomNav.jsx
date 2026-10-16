import React from 'react';
import { motion } from 'framer-motion';
import { Mic, History, User, MessageSquare } from 'lucide-react';

/**
 * MobileBottomNav
 * Persistent responsive bottom navigation bar for authenticated studio on mobile/tablet devices (< md).
 * Features 21st.dev / Framer Motion spring active pill and tactile micro-interactions.
 */
export const MobileBottomNav = ({ activeTab, onTabChange, onOpenContact }) => {
  const tabs = [
    {
      id: 'practice',
      label: 'Practice',
      icon: Mic,
      ariaLabel: 'Open Practice Studio',
      onClick: () => onTabChange('practice'),
      isActive: activeTab === 'practice',
    },
    {
      id: 'history',
      label: (
        <>
          <span className="hidden min-[360px]:inline">Past </span>
          <span>Sessions</span>
        </>
      ),
      icon: History,
      ariaLabel: 'Open Past Sessions and History',
      onClick: () => onTabChange('history'),
      isActive: activeTab === 'history',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      ariaLabel: 'Open Candidate Profile and Settings',
      onClick: () => onTabChange('profile'),
      isActive: activeTab === 'profile',
    },
  ];

  if (onOpenContact) {
    tabs.push({
      id: 'support',
      label: 'Support',
      icon: MessageSquare,
      ariaLabel: 'Open Support & Feedback modal',
      onClick: () => onOpenContact('general'),
      isActive: false,
    });
  }

  const gridColsClass = tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-[#FAF6EE]/95 dark:bg-[#181714]/95 border-t border-[#E4DCC9] dark:border-[#38342D] backdrop-blur-md px-2 sm:px-3 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-lg transition-colors select-none"
    >
      <div className={`max-w-md mx-auto grid ${gridColsClass} gap-1 relative`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isActive;

          return (
            <motion.button
              key={tab.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={tab.onClick}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-medium transition-colors cursor-pointer min-w-0 ${
                isActive
                  ? 'text-[#2F5233] dark:text-[#689D6A] font-semibold'
                  : 'text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
              }`}
            >
              {/* 21st.dev Floating Spring Active Indicator Pill */}
              {isActive && (
                <motion.div
                  layoutId="mobileBottomNavActivePill"
                  className="absolute inset-0 bg-[#2F5233]/10 dark:bg-[#689D6A]/15 border border-[#2F5233]/20 dark:border-[#689D6A]/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center mb-0.5">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
              </div>

              <span className="relative z-10 text-[10.5px] leading-tight truncate max-w-full">
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
