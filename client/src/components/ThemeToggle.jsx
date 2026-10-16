import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme mode switcher"
      className={`inline-flex items-center p-0.5 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] relative ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        title="Switch to Warm Paper"
        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer select-none ${
          theme === 'light'
            ? 'text-[#1C1B17] font-semibold'
            : 'text-[#787268] hover:text-[#1C1B17] dark:text-[#A8A297] dark:hover:text-[#FAF6EE]'
        }`}
      >
        {theme === 'light' && (
          <motion.div
            layoutId="activeThemePill"
            className="absolute inset-0 bg-[#FFFDF8] border border-[#E4DCC9] rounded-md shadow-xs"
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
          />
        )}
        <Sun className="relative z-10 w-3.5 h-3.5 text-[#2F5233]" />
        <span className="relative z-10 hidden sm:inline">Paper</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        title="Switch to Warm Ink"
        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer select-none ${
          theme === 'dark'
            ? 'text-[#FAF6EE] font-semibold'
            : 'text-[#787268] hover:text-[#1C1B17] dark:text-[#A8A297] dark:hover:text-[#FAF6EE]'
        }`}
      >
        {theme === 'dark' && (
          <motion.div
            layoutId="activeThemePill"
            className="absolute inset-0 bg-[#23211D] border border-[#38342D] rounded-md shadow-xs"
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
          />
        )}
        <Moon className="relative z-10 w-3.5 h-3.5 text-[#689D6A]" />
        <span className="relative z-10 hidden sm:inline">Ink</span>
      </button>
    </div>
  );
};

export default ThemeToggle;

