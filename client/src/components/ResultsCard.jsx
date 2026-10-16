import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  FileText,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Quote,
  Target,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import { RadialScoreGauge } from './ui/RadialScoreGauge';
import { ShimmerButton } from './ui/ShimmerButton';

/**
 * Animated numeric counter that counts up from 0 to value on mount or when value changes.
 * Driven from value prop via useEffect and guaranteed to finish on the exact target value.
 */
const CountUp = ({ value = 0, duration = 1000, decimals = 1 }) => {
  const numValue = Number(value);
  const target = !isNaN(numValue) ? numValue : 0;
  const [val, setVal] = useState(target);

  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }

    let startTime = null;
    let animId = null;

    setVal(0);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = ease * target;

      if (progress < 1) {
        setVal(current);
        animId = requestAnimationFrame(step);
      } else {
        setVal(target);
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      setVal(target);
    };
  }, [target, duration]);

  const display = typeof val === 'number' && !isNaN(val) ? val : target;
  const formatted = decimals === 0 ? Math.round(display).toString() : display.toFixed(decimals);
  return <span>{formatted}</span>;
};

export const ResultsCard = ({ session, onRetry, onNextQuestion }) => {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!session) return null;

  const {
    questionText,
    transcript,
    scores = {},
    suggestions = [],
    starBreakdown,
    strengths = [],
    improvements = [],
    improvedOpening = '',
    isGibberishOrOffTopic = false,
    modelAnswerType = 'restructure',
    wpm = 0,
    audioDuration = 0,
  } = session;

  const isGibberish = Boolean(isGibberishOrOffTopic || modelAnswerType === 'exemplary_benchmark');

  // Numeric coercions to prevent any undefined, null, or string issues
  const overall = Number(scores.overall) || 0;
  const starStructure = Number(scores.starStructure) || 0;
  const clarity = Number(scores.clarity) || 0;
  const fillerWordCount = Number(scores.fillerWordCount) || 0;
  const fillerScore = scores.fillerScore !== undefined
    ? Number(scores.fillerScore)
    : Math.max(0, 10 - fillerWordCount);

  const numWpm = Number(wpm) || 0;
  const numAudioDuration = Number(audioDuration) || 0;

  const getOverallTier = (score) => {
    if (isGibberish) {
      return {
        label: 'Incoherent / Off-Topic',
        color: 'text-[#C2572B] dark:text-[#E07A5F] bg-[#FAEEE8] dark:bg-[#2D1B16] border-[#F4D8CC] dark:border-[#523226]',
      };
    }
    if (score >= 85) {
      return {
        label: 'Excellent Delivery',
        color: 'text-[#2F5233] dark:text-[#689D6A] bg-[#EEF3EE] dark:bg-[#181714] border-[#D9E5DA] dark:border-[#38342D]',
      };
    }
    if (score >= 70) {
      return {
        label: 'Solid Performance',
        color: 'text-[#2F5233] dark:text-[#689D6A] bg-[#FAF6EE] dark:bg-[#181714] border-[#E4DCC9] dark:border-[#38342D]',
      };
    }
    if (score >= 50) {
      return {
        label: 'Needs Polish',
        color: 'text-[#C2572B] dark:text-[#E07A5F] bg-[#FAEEE8] dark:bg-[#2D1B16] border-[#F4D8CC] dark:border-[#523226]',
      };
    }
    return {
      label: 'Needs Improvement',
      color: 'text-[#C2572B] dark:text-[#E07A5F] bg-[#FAEEE8] dark:bg-[#2D1B16] border-[#F4D8CC] dark:border-[#523226]',
    };
  };

  const tier = getOverallTier(overall);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Safe list fallbacks
  const improvementsList = improvements && improvements.length > 0 ? improvements : suggestions;
  const strengthsList = Array.isArray(strengths) ? strengths : [];

  // STAR Component List
  const starKeys = [
    { key: 'situation', label: 'Situation', desc: 'Context & problem definition' },
    { key: 'task', label: 'Task', desc: 'Goal & personal responsibility' },
    { key: 'action', label: 'Action', desc: 'Specific steps taken' },
    { key: 'result', label: 'Result', desc: 'Quantified outcome & impact' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg shadow-none p-4 sm:p-7 space-y-6 transition-colors min-w-0"
    >
      {/* Top Banner: Question & Overall Score */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E4DCC9] dark:border-[#38342D] min-w-0">
        <div className="space-y-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#2F5233] dark:text-[#689D6A] bg-[#FAF6EE] dark:bg-[#181714] px-2 py-0.5 rounded border border-[#E4DCC9] dark:border-[#38342D] inline-block">
            Evaluation Results
          </span>
          <h2 className="text-lg font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] leading-snug break-words">
            {questionText}
          </h2>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] p-3 rounded-lg flex-shrink-0 min-w-0">
          <RadialScoreGauge score={overall} size={74} strokeWidth={6} />
          <div>
            <div className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#A8A297]">
              Performance
            </div>
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md border mt-1 ${tier.color}`}
            >
              {tier.label}
            </span>
          </div>
        </div>
      </div>

      {/* Incoherent or Off-Topic Diagnostic Notice */}
      {isGibberish && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#FAEEE8] dark:bg-[#2D1B16] border border-[#F4D8CC] dark:border-[#523226] rounded-lg flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-[#C2572B] dark:text-[#E07A5F] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-serif font-bold text-[#C2572B] dark:text-[#E07A5F] flex items-center gap-2">
              <span>Incoherent or Off-Topic Response Detected</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFDF8] dark:bg-[#181714] border border-[#F4D8CC] dark:border-[#523226] text-[#C2572B] dark:text-[#E07A5F]">
                Score: 0 / 100
              </span>
            </div>
            <p className="text-[11px] text-[#4A463F] dark:text-[#D5CFC7] leading-relaxed">
              The recorded transcript did not contain an intelligible answer to this interview question. We scored this attempt accordingly and generated a complete Gold-Standard STAR Model Answer below to guide your next attempt.
            </p>
          </div>
        </motion.div>
      )}

      {/* High-Score Milestone Achievement Banner */}
      {!isGibberish && overall >= 85 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 bg-gradient-to-r from-[#2F5233]/15 via-[#689D6A]/20 to-[#2F5233]/15 dark:from-[#3B663F]/25 dark:via-[#86EFAC]/20 dark:to-[#3B663F]/25 border border-[#2F5233]/40 dark:border-[#689D6A]/50 rounded-xl flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌟</span>
            <div>
              <span className="font-bold text-[#2F5233] dark:text-[#86EFAC]">
                Outstanding Delivery!
              </span>
              <p className="text-[11px] text-[#4A463F] dark:text-[#B5AFA2] mt-0.5">
                Your STAR structure, quantifiable results, and speech pacing are ready for executive-level interviews.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#2F5233] dark:bg-[#689D6A] text-[#FAF6EE] font-serif font-bold text-[10px] tracking-wider uppercase flex-shrink-0">
            Top Tier Delivery
          </span>
        </motion.div>
      )}

      {/* 4 Score Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: STAR Structure */}
        <div className="p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2">
          <div className="flex items-center justify-between text-xs text-[#4A463F] dark:text-[#A8A297]">
            <span className="font-medium">STAR Framework</span>
            <span className="font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              <CountUp value={starStructure} duration={1000} decimals={1} /> / 10
            </span>
          </div>
          <div className="w-full bg-[#E4DCC9] dark:bg-[#38342D] h-2 rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, (starStructure / 10) * 100)}%` }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 0.1 }}
              className={`h-full ${starStructure >= 7 ? 'bg-[#2F5233] dark:bg-[#689D6A]' : 'bg-[#C2572B] dark:bg-[#E07A5F]'}`}
            />
          </div>
          <p className="text-[11px] text-[#787268] dark:text-[#A8A297] leading-tight">
            Situation, Task, Action & Result
          </p>
        </div>

        {/* Metric 2: Clarity Score */}
        <div className="p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2">
          <div className="flex items-center justify-between text-xs text-[#4A463F] dark:text-[#A8A297]">
            <span className="font-medium">Clarity & Flow</span>
            <span className="font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              <CountUp value={clarity} duration={1000} decimals={1} /> / 10
            </span>
          </div>
          <div className="w-full bg-[#E4DCC9] dark:bg-[#38342D] h-2 rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, (clarity / 10) * 100)}%` }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 0.15 }}
              className={`h-full ${clarity >= 7 ? 'bg-[#2F5233] dark:bg-[#689D6A]' : 'bg-[#C2572B] dark:bg-[#E07A5F]'}`}
            />
          </div>
          <p className="text-[11px] text-[#787268] dark:text-[#A8A297] leading-tight">
            Conciseness & articulation
          </p>
        </div>

        {/* Metric 3: Filler Words */}
        <div className="p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2">
          <div className="flex items-center justify-between text-xs text-[#4A463F] dark:text-[#A8A297]">
            <span className="font-medium">Filler Words</span>
            <span className="font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              <CountUp value={fillerScore} duration={1000} decimals={1} /> / 10
            </span>
          </div>
          <div className="w-full bg-[#E4DCC9] dark:bg-[#38342D] h-2 rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, (fillerScore / 10) * 100)}%` }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
              className={`h-full ${fillerScore >= 7 ? 'bg-[#2F5233] dark:bg-[#689D6A]' : 'bg-[#C2572B] dark:bg-[#E07A5F]'}`}
            />
          </div>
          <p className="text-[11px] text-[#787268] dark:text-[#A8A297] leading-tight">
            {fillerWordCount} detected • {fillerWordCount === 0 ? 'Zero fillers' : fillerWordCount <= 3 ? 'Low filler usage' : 'High filler usage'}
          </p>
        </div>

        {/* Metric 4: Pace (WPM) & Duration */}
        <div className="p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-1.5">
          <div className="text-xs text-[#4A463F] dark:text-[#A8A297] font-medium">Speech Pace</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              {numAudioDuration > 0 && numWpm > 0 ? `${numWpm}` : '—'}
            </span>
            <span className="text-[11px] text-[#787268] dark:text-[#A8A297]">
              {numAudioDuration > 0 && numWpm > 0 ? 'wpm' : ''}
            </span>
          </div>
          <p className="text-[11px] text-[#787268] dark:text-[#A8A297] leading-tight">
            {numAudioDuration > 0
              ? `Spoken across ${formatDuration(numAudioDuration)}`
              : 'Speech pace unavailable (no recording duration)'}
          </p>
        </div>
      </div>

      {/* STAR Components Breakdown with Present/Missing Indicator & Evidence */}
      {starBreakdown && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
                STAR Structure Breakdown & Evidence Quotes
              </h3>
            </div>
            <span className="text-[11px] text-[#787268] dark:text-[#8E877C] hidden sm:inline">
              Rubric Anchors: 0-3 Missing • 4-6 Vague • 7-8 Specific • 9-10 Quantified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {starKeys.map(({ key, label, desc }) => {
              const comp = starBreakdown[key] || { present: false, score: 0, evidence: null };
              const isPresent = Boolean(comp.present);
              const scoreNum = Number(comp.score) || 0;

              return (
                <div
                  key={key}
                  className="p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-serif font-bold text-xs text-[#1C1B17] dark:text-[#FAF6EE]">
                        {label}
                      </span>
                      <p className="text-[10px] text-[#787268] dark:text-[#8E877C]">{desc}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                        {scoreNum}/10
                      </span>
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Present</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAEEE8] dark:bg-[#2D1B16] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#523226]">
                          <XCircle className="w-3 h-3" />
                          <span>Missing</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {comp.evidence ? (
                    <div className="flex items-start gap-1.5 text-xs italic text-[#4A463F] dark:text-[#C5BFB5] bg-[#FFFDF8] dark:bg-[#23211D] p-2.5 rounded border border-[#E4DCC9] dark:border-[#38342D] leading-relaxed">
                      <Quote className="w-3 h-3 text-[#787268] dark:text-[#8E877C] flex-shrink-0 mt-0.5" />
                      <span>“{comp.evidence}”</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#787268] dark:text-[#8E877C] italic bg-[#FFFDF8] dark:bg-[#23211D] p-2 rounded border border-[#E4DCC9] dark:border-[#38342D]">
                      No direct evidence detected in your spoken transcript
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What You Did Well (Strengths) */}
      {strengthsList.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
              What You Did Well
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {strengthsList.map((strength, index) => (
              <div
                key={index}
                className="p-3 bg-[#EEF3EE]/60 dark:bg-[#1E2E20]/40 border border-[#D9E5DA] dark:border-[#2D4530] rounded-md flex items-start gap-2.5 text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A] flex-shrink-0 mt-0.5" />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to Improve */}
      {improvementsList.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#C2572B] dark:text-[#E07A5F]" />
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
              What to Improve (Actionable Fixes)
            </h3>
          </div>

          <div className="space-y-2">
            {improvementsList.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md flex items-start gap-3 text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-[#C2572B] dark:text-[#E07A5F] text-[11px] font-serif font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stronger Version or Exemplary Benchmark Answer */}
      {improvedOpening && (
        <div className="p-4 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
                {isGibberish ? 'Exemplary STAR Model Answer' : 'Stronger Version (Model Restructure)'}
              </h3>
            </div>
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]">
              {isGibberish ? 'Gold-Standard Benchmark' : 'Restructured Answer'}
            </span>
          </div>
          <p className="text-[11px] text-[#787268] dark:text-[#8E877C]">
            {isGibberish
              ? 'Here is how an ideal candidate structures a high-scoring answer to this exact question using the STAR framework:'
              : 'Here is how you could restructure your weakest component into a punchy, impactful answer while keeping your exact facts:'}
          </p>
          <div className="p-3.5 bg-[#FFFDF8] dark:bg-[#23211D] border-l-2 border-l-[#2F5233] dark:border-l-[#689D6A] border-t border-r border-b border-[#E4DCC9] dark:border-[#38342D] rounded-r-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed italic">
            “{improvedOpening}”
          </div>
        </div>
      )}

      {/* Spoken Transcript Review */}
      <div className="pt-2 border-t border-[#E4DCC9] dark:border-[#38342D]">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#4A463F] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showTranscript ? 'Hide Spoken Transcript' : 'Review Spoken Transcript'}</span>
        </button>

        {showTranscript && (
          <div className="mt-3 p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed font-mono">
            {transcript}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E4DCC9] dark:border-[#38342D] min-w-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#23211D] text-[#1C1B17] dark:text-[#FAF6EE] text-xs font-medium rounded-md transition-colors cursor-pointer active:scale-[0.98] whitespace-nowrap min-w-0"
          >
            <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Try This Question Again</span>
          </button>
        )}

        {onNextQuestion && (
          <ShimmerButton
            onClick={onNextQuestion}
            className="w-full sm:w-auto"
          >
            <span className="truncate">Practice Another Question</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-1" />
          </ShimmerButton>
        )}
      </div>
    </motion.div>
  );
};

export default ResultsCard;
