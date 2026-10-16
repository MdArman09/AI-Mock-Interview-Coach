import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Minus } from 'lucide-react';

export const ComparisonGrid = () => {
  const comparisonRows = [
    {
      feature: 'Real-Time Spoken Mic Audio',
      traditional: 'Yes, with human',
      genericAi: 'No (Typing only)',
      coach: 'Yes, In-browser Web Speech API',
      coachHighlight: true,
    },
    {
      feature: 'Speech Pacing (WPM) & Duration Gauge',
      traditional: 'Subjective guess',
      genericAi: 'None',
      coach: 'Live 120-150 WPM telemetry',
      coachHighlight: true,
    },
    {
      feature: 'Rigorous STAR Rubric Diagnostics',
      traditional: 'Varies wildly by interviewer',
      genericAi: 'Generic text wall',
      coach: 'Dedicated S-T-A-R breakdown',
      coachHighlight: true,
    },
    {
      feature: 'Filler Word Audit ("um", "like")',
      traditional: 'Easily overlooked',
      genericAi: 'Cannot track speech',
      coach: 'Automated frequency heatmap',
      coachHighlight: true,
    },
    {
      feature: 'Questions Tailored to Your Real CV',
      traditional: 'Rarely pre-read in depth',
      genericAi: 'Requires manual prompt craft',
      coach: '1-click resume parsing & extraction',
      coachHighlight: true,
    },
    {
      feature: 'Cost & Scheduling',
      traditional: '$100–$250/hr, days in advance',
      genericAi: 'Monthly subscription',
      coach: 'Instant, on-demand practice 24/7',
      coachHighlight: true,
    },
    {
      feature: 'Social Pressure & Judgment',
      traditional: 'High anxiety',
      genericAi: 'Low pressure (text only)',
      coach: 'Private, judgment-free practice space',
      coachHighlight: true,
    },
  ];

  return (
    <div className="w-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-2xl p-6 sm:p-8 shadow-sm overflow-hidden">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF3EE] dark:bg-[#1E2E20] border border-[#D9E5DA] dark:border-[#2D4530] text-[11px] font-semibold text-[#2F5233] dark:text-[#689D6A]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Why This Works Better</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
          How We Compare to Other Prep Methods
        </h3>
        <p className="text-xs sm:text-sm text-[#787268] dark:text-[#A8A297]">
          Engineered specifically for the nuances of spoken technical & behavioral interviews.
        </p>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[540px]">
          <thead>
            <tr className="border-b border-[#E4DCC9] dark:border-[#38342D]">
              <th className="py-3.5 px-4 font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] w-2/5">
                Capability
              </th>
              <th className="py-3.5 px-3 font-medium text-[#787268] dark:text-[#A8A297] text-center w-1/5">
                Human Peer Mocks
              </th>
              <th className="py-3.5 px-3 font-medium text-[#787268] dark:text-[#A8A297] text-center w-1/5">
                Generic ChatGPT
              </th>
              <th className="py-3.5 px-4 font-serif font-bold text-[#2F5233] dark:text-[#689D6A] text-center bg-[#EEF3EE]/50 dark:bg-[#1E2E20]/50 rounded-t-xl w-1/5">
                AI Mock Coach
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4DCC9]/70 dark:divide-[#38342D]/70">
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#181714]/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#1C1B17] dark:text-[#FAF6EE]">
                  {row.feature}
                </td>
                <td className="py-3.5 px-3 text-center text-xs text-[#787268] dark:text-[#A8A297]">
                  {row.traditional}
                </td>
                <td className="py-3.5 px-3 text-center text-xs text-[#787268] dark:text-[#A8A297]">
                  {row.genericAi}
                </td>
                <td className="py-3.5 px-4 text-center font-semibold text-xs text-[#2F5233] dark:text-[#689D6A] bg-[#EEF3EE]/30 dark:bg-[#1E2E20]/30">
                  <span className="inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A] flex-shrink-0" />
                    <span>{row.coach}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonGrid;
