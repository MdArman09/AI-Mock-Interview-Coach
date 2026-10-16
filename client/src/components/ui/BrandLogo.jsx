import React from 'react';

/**
 * AI Mock Interview Coach Official Brand Logo Mark
 * 
 * Concept: "The Acoustic STAR"
 * Merges a studio condenser microphone and acoustic voice ripples with the 4-point
 * STAR framework compass sparkle (Situation, Task, Action, Result).
 * 
 * Designed to fit seamlessly into the Warm Paper & Deep Forest Green design system,
 * fully reactive to light and dark modes with crisp vector scaling.
 */
export const BrandLogo = ({
  size = 40,
  className = '',
  showSparkle = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-xl bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] shadow-xs group-hover:border-[#2F5233]/60 dark:group-hover:border-[#689D6A]/60 transition-colors flex-shrink-0 select-none ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        <defs>
          {/* Deep Forest Gradient for Light Mode */}
          <linearGradient id="logoForestLight" x1="12" y1="8" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2F5233" />
            <stop offset="100%" stopColor="#1E3821" />
          </linearGradient>

          {/* Emerald Gradient for Dark Mode */}
          <linearGradient id="logoEmeraldDark" x1="12" y1="8" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8EC07C" />
            <stop offset="100%" stopColor="#689D6A" />
          </linearGradient>

          {/* Warm Amber Spark Gradient */}
          <linearGradient id="logoSparkAmber" x1="26" y1="4" x2="33" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E07A5F" />
            <stop offset="100%" stopColor="#C2572B" />
          </linearGradient>
        </defs>

        {/* 1. Left Acoustic Soundwave Arcs */}
        <path
          d="M10.5 15.5C9.2 17 9.2 19 10.5 20.5"
          className="stroke-[#2F5233] dark:stroke-[#689D6A]"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M7.5 13.5C5.5 16 5.5 20 7.5 22.5"
          className="stroke-[#2F5233]/45 dark:stroke-[#689D6A]/50"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* 2. Right Acoustic Soundwave Arcs */}
        <path
          d="M29.5 15.5C30.8 17 30.8 19 29.5 20.5"
          className="stroke-[#2F5233] dark:stroke-[#689D6A]"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M32.5 13.5C34.5 16 34.5 20 32.5 22.5"
          className="stroke-[#2F5233]/45 dark:stroke-[#689D6A]/50"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* 3. Studio Condenser Mic Body */}
        {/* Main Mic Capsule */}
        <rect
          x="16.5"
          y="10"
          width="7"
          height="12"
          rx="3.5"
          className="fill-[#2F5233] dark:fill-[#689D6A]"
        />

        {/* Capsule Horizontal Grille Lines */}
        <line
          x1="18"
          y1="14"
          x2="22"
          y2="14"
          className="stroke-[#FFFDF8] dark:stroke-[#181714]"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="17"
          x2="22"
          y2="17"
          className="stroke-[#FFFDF8] dark:stroke-[#181714]"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* 4. Shockmount Cradle Arc */}
        <path
          d="M13.5 17C13.5 21.2 16.2 24.5 20 24.5C23.8 24.5 26.5 21.2 26.5 17"
          className="stroke-[#2F5233] dark:stroke-[#689D6A]"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* 5. Mic Stem & Pedestal Base */}
        <path
          d="M20 24.5V28.5M15.5 28.5H24.5"
          className="stroke-[#2F5233] dark:stroke-[#689D6A]"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 6. AI STAR Framework 4-Point Compass Jewel (Top Right) */}
        {showSparkle && (
          <path
            d="M30 4C30 7.5 33.5 7.5 33.5 7.5C33.5 7.5 30 7.5 30 11C30 7.5 26.5 7.5 26.5 7.5C26.5 7.5 30 7.5 30 4Z"
            fill="url(#logoSparkAmber)"
            className="filter drop-shadow-xs"
          />
        )}
      </svg>
    </div>
  );
};

export default BrandLogo;
