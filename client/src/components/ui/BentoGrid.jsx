import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * 21st.dev / Magic UI BentoGrid & BentoCard
 * Modern responsive bento layout with ambient hover gradients and tactile borders.
 */
export const BentoGrid = ({ children, className = '' }) => {
  return (
    <div
      className={`grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-5 ${className}`}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  name,
  className = '',
  background,
  Icon,
  description,
  href,
  cta = 'Explore feature',
  badge,
}) => {
  return (
    <div
      key={name}
      className={`group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 shadow-none transition-all duration-300 hover:border-[#2F5233]/60 dark:hover:border-[#689D6A]/60 ${className}`}
    >
      {/* Background Graphic / Preview Area */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500">
        {background}
      </div>

      {/* Top Header & Icon */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A] group-hover:scale-105 transition-transform">
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-[#FAF6EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] border border-[#E4DCC9] dark:border-[#38342D]">
            {badge}
          </span>
        )}
      </div>

      {/* Content & Description */}
      <div className="relative z-10 space-y-2 mt-auto">
        <h3 className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] group-hover:text-[#2F5233] dark:group-hover:text-[#689D6A] transition-colors">
          {name}
        </h3>
        <p className="text-sm text-[#4A463F] dark:text-[#A8A297] leading-relaxed max-w-lg">
          {description}
        </p>
      </div>

      {/* Footer Link / CTA */}
      <div className="relative z-10 pt-4 mt-3 border-t border-[#E4DCC9]/60 dark:border-[#38342D]/60 flex items-center justify-between text-xs font-semibold text-[#2F5233] dark:text-[#689D6A]">
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  );
};

export default { BentoGrid, BentoCard };
