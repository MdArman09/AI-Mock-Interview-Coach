import React from 'react';

/**
 * Pulsing skeleton placeholder matching the exact layout and visual weight of ResultsCard
 */
export const ResultsCardSkeleton = () => {
  return (
    <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-6 sm:p-7 space-y-6 animate-pulse max-w-4xl mx-auto shadow-none">
      {/* Top Banner Skeleton: Question Title & Overall Score */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E4DCC9] dark:border-[#38342D]">
        <div className="space-y-2.5 flex-1">
          <div className="h-4 w-28 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded"></div>
          <div className="h-6 w-3/4 bg-[#FAF6EE] dark:bg-[#181714] rounded"></div>
        </div>
        <div className="w-40 h-14 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md"></div>
      </div>

      {/* 4 Score Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2.5"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-[#E4DCC9] dark:bg-[#38342D] rounded"></div>
              <div className="h-3 w-8 bg-[#E4DCC9] dark:bg-[#38342D] rounded"></div>
            </div>
            <div className="h-2 w-full bg-[#E4DCC9] dark:bg-[#38342D] rounded-sm"></div>
            <div className="h-2.5 w-24 bg-[#E4DCC9]/60 dark:bg-[#38342D]/60 rounded"></div>
          </div>
        ))}
      </div>

      {/* Actionable Feedback Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-52 bg-[#FAF6EE] dark:bg-[#181714] rounded"></div>
        <div className="space-y-2.5">
          <div className="h-14 w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md"></div>
          <div className="h-14 w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md"></div>
          <div className="h-14 w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md"></div>
        </div>
      </div>

      {/* Transcript Review Row Skeleton */}
      <div className="pt-2 border-t border-[#E4DCC9] dark:border-[#38342D]">
        <div className="h-4 w-40 bg-[#FAF6EE] dark:bg-[#181714] rounded"></div>
      </div>

      {/* Bottom Action Buttons Skeleton */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E4DCC9] dark:border-[#38342D]">
        <div className="h-9 w-36 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md"></div>
        <div className="h-9 w-44 bg-[#2F5233]/20 dark:bg-[#689D6A]/20 rounded-md"></div>
      </div>
    </div>
  );
};

export default ResultsCardSkeleton;
