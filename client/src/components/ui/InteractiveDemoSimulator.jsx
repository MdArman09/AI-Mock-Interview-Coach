import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  FileText,
  Volume2,
  ArrowRight,
  Sliders,
  Check,
} from 'lucide-react';
import ShimmerButton from './ShimmerButton';
import RadialScoreGauge from './RadialScoreGauge';

const SAMPLE_STRONG_ANSWER =
  "At my previous company, our team was divided on whether to migrate our core auth service from REST to gRPC. The tech lead favored keeping REST for simplicity, while I advocated for gRPC due to our strict 50ms inter-service SLA during peak traffic. Rather than debating opinions, I built a quick prototype benchmark measuring throughput and latency under 10,000 concurrent requests. The data showed a 42% reduction in p99 latency with gRPC. I presented these benchmarks in a blameless RFC session, highlighting how it aligned with our quarterly latency goals. The team agreed with the data-driven proposal, we completed the phased rollout over two sprints, and we achieved zero downtime while cutting tail latency by 38%.";

const SAMPLE_WEAK_ANSWER =
  "Um, so basically, we had this big argument about switching to gRPC. My lead wanted to stay with REST because he was used to it, and I really wanted gRPC because it's newer and faster. We had lots of meetings and kind of argued back and forth for like two weeks. Eventually he just said fine, do whatever you want. So I wrote the code and deployed it. It was pretty fast afterwards and people liked it, but yeah, it was kind of stressful.";

export const InteractiveDemoSimulator = ({ onGetStarted }) => {
  const [selectedSample, setSelectedSample] = useState('strong');
  const [answerText, setAnswerText] = useState(SAMPLE_STRONG_ANSWER);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(true);

  const handleSelectSample = (type) => {
    setSelectedSample(type);
    setAnswerText(type === 'strong' ? SAMPLE_STRONG_ANSWER : SAMPLE_WEAK_ANSWER);
    setHasEvaluated(true);
  };

  const handleAnalyze = () => {
    setIsSimulating(true);
    setHasEvaluated(false);
    setTimeout(() => {
      setIsSimulating(false);
      setHasEvaluated(true);
    }, 800);
  };

  const isStrong = selectedSample === 'strong';
  const overallScore = isStrong ? 92 : 54;
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedWpm = isStrong ? 134 : 162;
  const fillerCount = isStrong ? 0 : 5;

  return (
    <div className="w-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#2F5233]/5 dark:bg-[#689D6A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#C2572B]/5 dark:bg-[#E07A5F]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4DCC9] dark:border-[#38342D] relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EEF3EE] dark:bg-[#1E2E20] border border-[#D9E5DA] dark:border-[#2D4530] text-[11px] font-semibold text-[#2F5233] dark:text-[#689D6A]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Live Simulator</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
            Test the AI Coach in Action
          </h3>
          <p className="text-xs sm:text-sm text-[#787268] dark:text-[#A8A297]">
            See how the engine scores STAR structure, delivery pacing, and detects filler patterns in real time.
          </p>
        </div>

        {/* Quick Sample Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSelectSample('strong')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              selectedSample === 'strong'
                ? 'bg-[#2F5233] text-[#FAF6EE] shadow-xs'
                : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
            }`}
          >
            <span>Strong Answer (92)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectSample('weak')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              selectedSample === 'weak'
                ? 'bg-[#C2572B] text-[#FAF6EE] shadow-xs'
                : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
            }`}
          >
            <span>Weak Answer (54)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Prompt & Input on Left, Live STAR Diagnostics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 relative z-10">
        {/* Left Column: Question & Candidate Answer */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Question Card */}
          <div className="p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#2F5233] dark:text-[#689D6A] uppercase tracking-wider text-[10px]">
                Target Behavioral Question
              </span>
              <span className="px-2 py-0.5 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-[#787268] dark:text-[#A8A297] text-[10px] font-medium">
                Senior / Lead Level
              </span>
            </div>
            <p className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] leading-snug">
              “Tell me about a time you had a technical disagreement with a teammate or lead. How did you resolve it?”
            </p>
          </div>

          {/* Answer Input Box */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs text-[#787268] dark:text-[#A8A297]">
              <span className="font-medium text-[#1C1B17] dark:text-[#FAF6EE]">
                Candidate Spoken Transcript
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {wordCount} words
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  ~{estimatedWpm} WPM
                </span>
              </div>
            </div>

            <textarea
              value={answerText}
              onChange={(e) => {
                setAnswerText(e.target.value);
                setSelectedSample('custom');
              }}
              rows={7}
              className="w-full flex-1 p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-xl text-xs sm:text-sm text-[#1C1B17] dark:text-[#FAF6EE] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors resize-none leading-relaxed font-sans"
              placeholder="Type or edit your response here to test live evaluation..."
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <p className="text-[11px] text-[#787268] dark:text-[#A8A297]">
              Try editing words or clicking the Strong/Weak buttons above.
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isSimulating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2F5233] hover:bg-[#244027] text-[#FAF6EE] text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Analyzing...' : 'Re-Evaluate Answer'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live AI STAR Breakdown Diagnostics */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4DCC9] dark:border-[#38342D]">
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#A8A297]">
              Real-Time AI STAR Analysis
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isStrong
                  ? 'bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]'
                  : 'bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F]'
              }`}
            >
              {isStrong ? 'Executive Ready' : 'Needs Structure'}
            </span>
          </div>

          {/* Score Header with RadialGauge */}
          <div className="flex items-center justify-around py-2">
            <RadialScoreGauge score={overallScore} size={90} strokeWidth={7} />
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#787268] dark:text-[#A8A297]">Speech Pacing:</span>
                <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                  {estimatedWpm} WPM {isStrong ? '(Optimal)' : '(Rushed)'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#787268] dark:text-[#A8A297]">Filler Words:</span>
                <span
                  className={`font-semibold ${
                    fillerCount === 0
                      ? 'text-[#2F5233] dark:text-[#689D6A]'
                      : 'text-[#C2572B] dark:text-[#E07A5F]'
                  }`}
                >
                  {fillerCount} detected
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#787268] dark:text-[#A8A297]">STAR Completeness:</span>
                <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                  {isStrong ? '100% Coverage' : '35% Coverage'}
                </span>
              </div>
            </div>
          </div>

          {/* 4 STAR Pillars Diagnostic Checklist */}
          <div className="space-y-2 pt-2 border-t border-[#E4DCC9] dark:border-[#38342D]">
            {[
              {
                letter: 'S',
                name: 'Situation',
                status: isStrong ? 'High' : 'Weak',
                detail: isStrong
                  ? 'Concrete 50ms SLA conflict during peak load'
                  : 'Vague disagreement without measurable stakes',
              },
              {
                letter: 'T',
                name: 'Task',
                status: isStrong ? 'High' : 'Missing',
                detail: isStrong
                  ? 'Responsible for verifying architecture tradeoffs'
                  : 'Unclear role responsibility or goal',
              },
              {
                letter: 'A',
                name: 'Action',
                status: isStrong ? 'High' : 'Weak',
                detail: isStrong
                  ? 'Benchmarked prototype with 10k requests & led blameless RFC'
                  : 'Argued for two weeks until teammate gave up',
              },
              {
                letter: 'R',
                name: 'Result',
                status: isStrong ? 'High' : 'Weak',
                detail: isStrong
                  ? 'Zero downtime, cut p99 tail latency by 38%'
                  : 'Subjective mention that people liked it',
              },
            ].map((pillar) => (
              <div
                key={pillar.name}
                className="p-2 rounded-lg bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] flex items-start gap-2.5 text-xs"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                    pillar.status === 'High'
                      ? 'bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A]'
                      : 'bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F]'
                  }`}
                >
                  {pillar.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                      {pillar.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        pillar.status === 'High'
                          ? 'text-[#2F5233] dark:text-[#689D6A]'
                          : 'text-[#C2572B] dark:text-[#E07A5F]'
                      }`}
                    >
                      {pillar.status === 'High' ? 'Validated ✓' : 'Underdeveloped ✗'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#787268] dark:text-[#A8A297] truncate mt-0.5">
                    {pillar.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Callout & Shimmer CTA */}
          <div className="pt-2">
            <ShimmerButton
              onClick={onGetStarted}
              shimmerColor="#86EFAC"
              background="#2F5233"
              className="w-full py-2.5 text-xs font-semibold rounded-lg shadow-sm"
            >
              <span>Practice With Your Own Voice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </ShimmerButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDemoSimulator;
