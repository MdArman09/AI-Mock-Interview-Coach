import React from 'react';

/**
 * ShimmerButton component sourced from 21st.dev (dillionverma/shimmer-button)
 * Customized for AI Mock Interview Coach with Warm Paper & Forest Green design system.
 */
export const ShimmerButton = React.forwardRef(
  (
    {
      shimmerColor = '#A3E635',
      shimmerSize = '0.08em',
      shimmerDuration = '2.5s',
      borderRadius = '8px',
      background = '#2F5233',
      className = '',
      children,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        style={{
          '--spread': '90deg',
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background,
        }}
        className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-[#2F5233]/40 dark:border-[#689D6A]/50 px-7 py-3 text-sm font-medium text-[#FAF6EE] [background:var(--bg)] [border-radius:var(--radius)] shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${className}`}
        {...props}
      >
        {/* Spark container */}
        <div className="-z-30 blur-[1px] absolute inset-0 overflow-visible [container-type:size]">
          {/* Spark slide */}
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {/* Highlight inner gloss */}
        <div className="absolute inset-0 rounded-[inherit] px-4 py-1.5 text-sm font-medium shadow-[inset_0_-4px_8px_rgba(255,255,255,0.12)] group-hover:shadow-[inset_0_-2px_6px_rgba(255,255,255,0.2)] transition-all pointer-events-none" />

        {/* Backdrop background layer */}
        <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </div>
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';

export default ShimmerButton;
