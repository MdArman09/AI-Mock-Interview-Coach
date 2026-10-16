import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Layers, Clock, ShieldCheck } from 'lucide-react';

export const StatsCounterBar = () => {
  const capabilities = [
    {
      value: '50+',
      label: 'Curated Question Bank',
      subtext: 'Behavioral, situational, and technical prompts across 3 seniority tiers',
      icon: <BookOpen className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Question Bank',
    },
    {
      value: '4',
      label: 'STAR Rubric Pillars',
      subtext: 'Dedicated scoring breakdown for Situation, Task, Action, and Result',
      icon: <Layers className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Rubric Analysis',
    },
    {
      value: '120–150',
      label: 'Target WPM Pacing',
      subtext: 'Live words-per-minute speech telemetry to keep your delivery conversational',
      icon: <Clock className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Speech Telemetry',
    },
    {
      value: '100%',
      label: 'Client-Side Audio Privacy',
      subtext: 'Processed in-browser via Web Speech API — zero audio stored remotely',
      icon: <ShieldCheck className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Privacy First',
    },
  ];

  return (
    <div className="w-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-[#E4DCC9] dark:divide-[#38342D]">
        {capabilities.map((cap, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className={`space-y-2 ${idx > 0 ? 'pt-4 sm:pt-0 lg:pl-6' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#EEF3EE] dark:bg-[#1E2E20] border border-[#D9E5DA] dark:border-[#2D4530]">
                {cap.icon}
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#2F5233] dark:text-[#689D6A]">
                {cap.pill}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] tracking-tight">
              {cap.value}
            </div>

            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                {cap.label}
              </h4>
              <p className="text-[11px] text-[#787268] dark:text-[#A8A297] leading-relaxed">
                {cap.subtext}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StatsCounterBar;
