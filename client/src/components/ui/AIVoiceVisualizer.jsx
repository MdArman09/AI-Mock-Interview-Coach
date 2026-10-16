import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';

/**
 * AIVoiceVisualizer component sourced & adapted from 21st.dev (kokonutd/ai-voice-input)
 * Enhanced for AI Mock Interview Coach with real-time waveform bars, speech telemetry, and interview state transitions.
 */
export const AIVoiceVisualizer = ({
  visualizerBars = 36,
  onStateChange,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(true);
  const [seconds, setSeconds] = useState(14);
  const [wpm, setWpm] = useState(136);

  // Timer simulation
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => (prev >= 90 ? 1 : prev + 1));
        // Subtle realistic WPM drift
        setWpm((prev) => Math.min(155, Math.max(125, prev + (Math.random() > 0.5 ? 2 : -2))));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    const nextState = !isRecording;
    setIsRecording(nextState);
    if (onStateChange) onStateChange(nextState);
  };

  return (
    <div
      className={`rounded-lg p-4 sm:p-5 border border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Interactive Mic & Status */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? 'Click to pause simulation' : 'Click to start voice recording'}
            className={`relative flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-300 cursor-pointer ${
              isRecording
                ? 'bg-[#2F5233] text-[#FAF6EE] shadow-sm ring-2 ring-[#2F5233]/20 dark:ring-[#689D6A]/30'
                : 'bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-[#787268] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
            }`}
          >
            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C2572B] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C2572B]" />
              </span>
            )}
            <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2F5233] dark:text-[#689D6A]">
                {isRecording ? 'Listening Out Loud' : 'Voice Paused'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-[#787268] dark:text-[#A8A297]">
                {formatTime(seconds)}
              </span>
            </div>
            <p className="text-xs text-[#4A463F] dark:text-[#A8A297] mt-0.5">
              {isRecording ? 'Click mic to pause or test response' : 'Click mic to resume live audio test'}
            </p>
          </div>
        </div>

        {/* Center: Dynamic Audio Waveform (21st.dev visualizer bars) */}
        <div className="flex items-center justify-center gap-1 h-8 px-3 py-1 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] w-full sm:w-auto overflow-hidden">
          {[...Array(visualizerBars)].map((_, i) => {
            // Generate varied heights for authentic audio waveform
            const baseHeights = [25, 45, 80, 60, 95, 40, 75, 90, 50, 70, 85, 30, 65, 95, 45, 80, 55, 90];
            const height = isRecording ? baseHeights[i % baseHeights.length] : 15;
            const delay = (i * 0.04).toFixed(2);

            return (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-200 ${
                  isRecording
                    ? 'bg-[#2F5233] dark:bg-[#689D6A]'
                    : 'bg-[#E4DCC9] dark:bg-[#38342D]'
                }`}
                style={{
                  height: `${height}%`,
                  animation: isRecording ? `soundwave 0.9s ease-in-out infinite ${delay}s` : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Right: Live Telemetry Pill */}
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#2F5233] dark:text-[#689D6A] bg-[#EEF3EE] dark:bg-[#23211D] px-2.5 py-1.5 rounded border border-[#D9E5DA] dark:border-[#38483B] flex-shrink-0">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{wpm} WPM • Optimal</span>
        </div>
      </div>
    </div>
  );
};

export default AIVoiceVisualizer;
