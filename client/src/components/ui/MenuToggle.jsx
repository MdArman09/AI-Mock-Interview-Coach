import React from 'react';

/**
 * MenuToggle component sourced from 21st.dev (efferd/menu-toggle)
 * Modern SVG animated 3-lines hamburger that morphs smoothly into an X
 */
export function MenuToggle({
  open,
  onOpenChange,
  className = '',
  size = 20,
  strokeWidth = 2.4,
  ...props
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenChange(!open)}
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={open}
      className={`relative flex items-center justify-center w-9 h-9 rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] text-[#1C1B17] dark:text-[#FAF6EE] hover:bg-[#FAF6EE] dark:hover:bg-[#2D2A24] hover:text-[#2F5233] dark:hover:text-[#689D6A] transition-all cursor-pointer shadow-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2F5233]/20 ${className}`}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-500 ease-out ${open ? '-rotate-45' : ''}`}
      >
        <path
          className={`transition-all duration-500 ease-out ${
            open
              ? '[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]'
              : '[stroke-dasharray:12_63]'
          }`}
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
        />
        <path
          d="M7 16 27 16"
          className={`transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100'}`}
        />
      </svg>
    </button>
  );
}

export default MenuToggle;
