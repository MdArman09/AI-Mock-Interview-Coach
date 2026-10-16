import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * 21st.dev inspired RadialScoreGauge component
 * Animated circular SVG score meter with count-up number and dynamic color tiering.
 */
export const RadialScoreGauge = ({
  score = 0,
  size = 110,
  strokeWidth = 8,
  className = '',
  empty = false,
}) => {
  const numScore = empty ? 0 : Math.max(0, Math.min(100, Number(score) || 0));
  const [displayScore, setDisplayScore] = useState(0);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = empty ? circumference : circumference - (numScore / 100) * circumference;

  useEffect(() => {
    if (empty) {
      setDisplayScore(0);
      return;
    }

    let startTime = null;
    let animId = null;
    const duration = 1200;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
      setDisplayScore(Math.round(ease * numScore));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayScore(numScore);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [numScore, empty]);

  // Determine dynamic stroke color based on score tier
  const getColor = () => {
    if (empty) return '#E4DCC9';
    if (numScore >= 85) return '#2F5233'; // Deep Forest
    if (numScore >= 70) return '#4A7A4E'; // Olive Forest
    if (numScore >= 50) return '#D97706'; // Warm Amber
    return '#C2572B'; // Burnt Sienna
  };

  const getDarkColor = () => {
    if (empty) return '#38342D';
    if (numScore >= 85) return '#689D6A'; // Emerald
    if (numScore >= 70) return '#8EC07C';
    if (numScore >= 50) return '#FABD2F';
    return '#E07A5F';
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 overflow-visible"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-[#E4DCC9] dark:text-[#38342D]"
        />

        {/* Animated Progress circle */}
        {!empty && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
            className="transition-colors duration-500"
            style={{
              stroke: 'var(--gauge-color, #2F5233)',
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center select-none"
        style={{
          '--gauge-color': getColor(),
        }}
      >
        <div className="flex items-baseline">
          <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] leading-none">
            {empty ? '—' : displayScore}
          </span>
          <span className="text-[10px] sm:text-xs text-[#787268] dark:text-[#A8A297] font-medium ml-0.5">
            /100
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-[#787268] dark:text-[#A8A297] mt-0.5">
          {empty ? 'Unrated' : 'Score'}
        </span>
      </div>
    </div>
  );
};

export default RadialScoreGauge;
