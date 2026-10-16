import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookOpen, Layers, Clock, ShieldCheck } from 'lucide-react';
import { questionAPI } from '../../services/api';
import { SEEDED_QUESTION_BANK_COUNT } from '../../data/questionBankConfig';

const CountUp = ({ end, start = false, duration = 1.2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (end === 0) {
      setCount(0);
      return;
    }
    let startTime = null;
    let animId;
    const durationMs = duration * 1000;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * end));
      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [end, start, duration]);

  return <span>{count}</span>;
};

export const StatsCounterBar = ({ onOpenAudioFaq }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-40px' });
  const [questionCount, setQuestionCount] = useState(SEEDED_QUESTION_BANK_COUNT);

  useEffect(() => {
    let active = true;
    questionAPI
      .getQuestionCount?.()
      .then((count) => {
        if (active && typeof count === 'number' && count > 0) {
          setQuestionCount(count);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const capabilities = [
    {
      numeric: true,
      target: questionCount,
      label: 'Curated Practice Questions',
      subtext: 'Behavioral, situational, and technical prompts, plus up to 40 more generated from your own resume.',
      icon: <BookOpen className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Question Bank',
    },
    {
      numeric: true,
      target: 4,
      label: 'STAR Rubric Pillars',
      subtext: 'Dedicated scoring breakdown for Situation, Task, Action, and Result',
      icon: <Layers className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Rubric Analysis',
    },
    {
      numeric: false,
      value: '120–150',
      label: 'Target Words Per Minute',
      subtext: 'Your speaking pace is measured on every answer and compared against a conversational 120–150 WPM target.',
      icon: <Clock className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Speech Telemetry',
    },
    {
      numeric: true,
      target: 0,
      label: 'Audio Files Stored by Us',
      subtext: 'Speech-to-text runs through your browser’s built-in recognition. We only receive the text transcript.',
      icon: <ShieldCheck className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />,
      pill: 'Your Audio',
      hasFaqLink: true,
    },
  ];

  const handleFaqClick = (e) => {
    e.preventDefault();
    if (onOpenAudioFaq) {
      onOpenAudioFaq();
    } else {
      const el = document.getElementById('faq');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-2xl p-6 sm:p-8 shadow-sm"
    >
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
              {cap.numeric ? (
                <CountUp end={cap.target} start={isInView} duration={1.2} />
              ) : (
                cap.value
              )}
            </div>

            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                {cap.label}
              </h4>
              <p className="text-[11px] text-[#787268] dark:text-[#A8A297] leading-relaxed">
                {cap.subtext}
              </p>
            </div>

            {cap.hasFaqLink && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleFaqClick}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#2F5233] dark:text-[#689D6A] font-semibold hover:underline cursor-pointer transition-colors"
                >
                  <span>How speech recognition works →</span>
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StatsCounterBar;
