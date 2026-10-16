import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { sessionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Mic,
  Square,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  Volume2,
  Keyboard,
  Lightbulb,
} from 'lucide-react';
import ShimmerButton from './ui/ShimmerButton';

export const Recorder = ({
  selectedQuestion,
  onAnalysisComplete,
  onAnalysisStart,
  onAnalysisError,
}) => {
  const toast = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'type'
  const [showRubricHints, setShowRubricHints] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(0);

  const detectedCues = useMemo(() => {
    const text = (transcript + ' ' + interimTranscript).toLowerCase();
    const hasS = /\b(when|time|project|company|team|working|at my|role|situation|context)\b/i.test(text);
    const hasT = /\b(goal|task|responsibility|needed to|assigned|objective|challenge|had to)\b/i.test(text);
    const hasA = /\b(i decided|i built|i designed|i created|i proposed|i led|i wrote|i spoke|i initiated|implemented|action)\b/i.test(text);
    const hasR = /\b(result|outcome|improved|increased|reduced|delivered|achieved|saved|percent|%|impact)\b/i.test(text);
    return { hasS, hasT, hasA, hasR };
  }, [transcript, interimTranscript]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setInputMode('type');
      setError(
        'Speech recognition is not supported in this browser. Manual typing mode is activated below.'
      );
    }
  }, []);

  useEffect(() => {
    const handleStopAppRecording = () => {
      stopRecordingSession();
      startTimeRef.current = null;
      durationRef.current = 0;
      setDuration(0);
      setTranscript('');
      setInterimTranscript('');
      setError('');
    };

    window.addEventListener('app:stop-recording', handleStopAppRecording);
    return () => {
      window.removeEventListener('app:stop-recording', handleStopAppRecording);
      window.__isRecordingActive = false;
      stopRecordingSession();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      stopRecordingSession();
    }
    startTimeRef.current = null;
    durationRef.current = 0;
    setDuration(0);
    setTranscript('');
    setInterimTranscript('');
    setError('');
  }, [selectedQuestion?._id]);

  const startRecording = () => {
    setError('');
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setInputMode('type');
      toast.info('Microphone API unavailable. Switched to typing mode.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        window.__isRecordingActive = true;
        setIsRecording(true);
        if (!startTimeRef.current) {
          startTimeRef.current = Date.now() - (durationRef.current * 1000);
        }
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            if (startTimeRef.current) {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              durationRef.current = elapsed;
              setDuration(elapsed);
            }
          }, 500);
        }
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => (prev ? `${prev.trim()} ${final.trim()}` : final.trim()));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError(
            'Microphone permission was denied. You can type your answer manually below.'
          );
          setInputMode('type');
          toast.error('Microphone permission denied. Switched to typing mode.');
          stopRecordingSession();
        } else if (event.error === 'no-speech') {
          // Normal timeout if user pauses
        } else {
          setError(`Speech recognition issue: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current && isRecording) {
          try {
            recognition.start();
          } catch {
            // Silently ignore browser re-initialization race condition
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setError('Could not start microphone recording. You can type your answer below.');
      setInputMode('type');
      stopRecordingSession();
    }
  };

  const stopRecording = () => {
    stopRecordingSession();
  };

  const stopRecordingSession = () => {
    window.__isRecordingActive = false;
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      durationRef.current = elapsed;
      setDuration(elapsed);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setInterimTranscript('');
  };

  const handleReset = () => {
    stopRecordingSession();
    startTimeRef.current = null;
    durationRef.current = 0;
    setDuration(0);
    setTranscript('');
    setInterimTranscript('');
    setError('');
  };

  const handleAnalyze = async () => {
    const fullTranscript = transcript.trim();
    if (!fullTranscript) {
      const msg = 'Please record a longer answer before submitting';
      setError(msg);
      toast.error(msg);
      return;
    }

    const words = fullTranscript.split(/\s+/).filter(Boolean);
    if (words.length < 5) {
      const msg = 'Please record a longer answer before submitting';
      setError(msg);
      toast.error(msg);
      return;
    }

    let elapsedSec = durationRef.current || duration || 0;
    if (isRecording && startTimeRef.current) {
      elapsedSec = Math.max(elapsedSec, Math.floor((Date.now() - startTimeRef.current) / 1000));
    }

    if (isRecording) {
      stopRecordingSession();
    }

    setIsAnalyzing(true);
    if (onAnalysisStart) onAnalysisStart();
    setError('');

    try {
      const payload = {
        questionId: selectedQuestion?._id,
        questionText: selectedQuestion?.text || 'Custom Interview Question',
        transcript: fullTranscript,
        audioDuration: Number(elapsedSec) || 0,
        category: selectedQuestion?.category || 'Behavioral',
      };

      const response = await sessionAPI.analyzeAnswer(payload);
      if (response.success && response.data) {
        toast.success('Feedback ready!');
        onAnalysisComplete(response.data);
      } else {
        const msg = response.message || 'Something went wrong — please try again';
        setError(msg);
        toast.error(msg);
        if (onAnalysisError) onAnalysisError();
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      const msg = err.message || 'Something went wrong — please try again';
      setError(msg);
      toast.error(msg);
      if (onAnalysisError) onAnalysisError();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = transcript.trim()
    ? transcript.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg shadow-none p-4 sm:p-6 flex flex-col h-full w-full justify-between transition-colors min-w-0">
      {/* Active Question Display */}
      <div className="mb-5 p-4 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#2F5233] dark:text-[#689D6A] bg-[#FFFDF8] dark:bg-[#23211D] px-2 py-0.5 rounded border border-[#E4DCC9] dark:border-[#38342D] flex-shrink-0">
            {selectedQuestion?.category || 'Interview Question'}
          </span>
          <span className="text-xs text-[#787268] dark:text-[#A8A297] flex-shrink-0">Target Time: ~1-2 min</span>
        </div>
        <h3 className="text-base font-serif font-semibold text-[#1C1B17] dark:text-[#FAF6EE] leading-snug break-words">
          {selectedQuestion?.text || 'Please select a question from the list to begin.'}
        </h3>

        {/* Collapsible Rubric Guidance Drawer */}
        <div className="mt-3 pt-2.5 border-t border-[#E4DCC9]/70 dark:border-[#38342D]/70">
          <button
            type="button"
            onClick={() => setShowRubricHints(!showRubricHints)}
            className="inline-flex items-center gap-1.5 text-xs text-[#2F5233] dark:text-[#689D6A] font-semibold hover:underline cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showRubricHints ? "Hide Interviewer's Checklist" : "View Interviewer's Secret Checklist"}</span>
          </button>

          {showRubricHints && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2.5 p-3 rounded-lg bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] space-y-1.5 text-xs text-[#4A463F] dark:text-[#B5AFA2]"
            >
              <div className="font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] text-xs">
                What Top Interviewers Look For:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li><strong className="text-[#1C1B17] dark:text-[#FAF6EE]">Situation:</strong> Establish context and technical stakes concisely (&lt;30s).</li>
                <li><strong className="text-[#1C1B17] dark:text-[#FAF6EE]">Action:</strong> Emphasize <em>your</em> individual initiatives, not just "we".</li>
                <li><strong className="text-[#1C1B17] dark:text-[#FAF6EE]">Result:</strong> Quantify outcomes with measurable impact (latency, bugs, team velocity).</li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-[#FAEEE8] dark:bg-[#2D1B16] border border-[#F4D8CC] dark:border-[#523226] rounded-md flex items-start gap-2.5 text-xs text-[#C2572B] dark:text-[#E07A5F]">
          <AlertCircle className="w-4 h-4 text-[#C2572B] dark:text-[#E07A5F] flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* SKELETON LOADER STATE: Rendered smoothly during analysis */}
      {isAnalyzing ? (
        <div className="py-6 space-y-5 animate-pulse">
          <div className="flex items-center justify-between p-4 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#2F5233] dark:text-[#689D6A]" />
              <span className="text-xs font-serif font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                Evaluating your response with AI Coach...
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#787268] dark:text-[#A8A297]">
              Analyzing STAR structure & pacing
            </span>
          </div>

          {/* Skeleton metrics preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2"
              >
                <div className="h-2.5 w-16 bg-[#E4DCC9] dark:bg-[#38342D] rounded" />
                <div className="h-4 w-10 bg-[#E4DCC9] dark:bg-[#38342D] rounded" />
                <div className="h-1.5 w-full bg-[#E4DCC9] dark:bg-[#38342D] rounded" />
              </div>
            ))}
          </div>

          {/* Skeleton suggestions */}
          <div className="p-4 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md space-y-2.5">
            <div className="h-3 w-40 bg-[#E4DCC9] dark:bg-[#38342D] rounded" />
            <div className="h-2.5 w-full bg-[#E4DCC9] dark:bg-[#38342D] rounded" />
            <div className="h-2.5 w-4/5 bg-[#E4DCC9] dark:bg-[#38342D] rounded" />
          </div>
        </div>
      ) : (
        <>
          {/* Controls Bar & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E4DCC9] dark:border-[#38342D]">
            {/* Mode selection tabs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-[#FAF6EE] dark:bg-[#181714] p-1 rounded-lg border border-[#E4DCC9] dark:border-[#38342D]">
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  disabled={!isSupported}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    inputMode === 'voice'
                      ? 'text-[#1C1B17] dark:text-[#FAF6EE]'
                      : 'text-[#787268] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                  } ${!isSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={isSupported ? 'Speak with microphone' : 'Microphone unavailable in this browser'}
                >
                  {inputMode === 'voice' && (
                    <motion.div
                      layoutId="recorderInputModePill"
                      className="absolute inset-0 bg-[#FFFDF8] dark:bg-[#23211D] rounded-md border border-[#E4DCC9] dark:border-[#38342D] shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Mic className="relative z-10 w-3.5 h-3.5" />
                  <span className="relative z-10">Voice Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) stopRecordingSession();
                    setInputMode('type');
                  }}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    inputMode === 'type'
                      ? 'text-[#1C1B17] dark:text-[#FAF6EE]'
                      : 'text-[#787268] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                  }`}
                  title="Type your answer manually"
                >
                  {inputMode === 'type' && (
                    <motion.div
                      layoutId="recorderInputModePill"
                      className="absolute inset-0 bg-[#FFFDF8] dark:bg-[#23211D] rounded-md border border-[#E4DCC9] dark:border-[#38342D] shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Keyboard className="relative z-10 w-3.5 h-3.5" />
                  <span className="relative z-10">Type Answer</span>
                </button>
              </div>

              {inputMode === 'voice' && (
                <span className="text-[11px] text-[#787268] dark:text-[#A8A297]">
                  Prefer not to use your microphone?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecording) stopRecordingSession();
                      setInputMode('type');
                    }}
                    className="text-[#2F5233] dark:text-[#689D6A] font-semibold hover:underline cursor-pointer"
                  >
                    Switch to Type Answer.
                  </button>
                </span>
              )}
            </div>

            {/* Recording Controls when in Voice Mode */}
            {inputMode === 'voice' && (
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <motion.button
                    type="button"
                    onClick={stopRecording}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    whileTap={{ scale: 0.94 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#C2572B] hover:bg-[#A94821] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop</span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={startRecording}
                    disabled={!isSupported || !selectedQuestion}
                    whileTap={{ scale: 0.94 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] disabled:bg-[#E4DCC9] dark:disabled:bg-[#38342D] disabled:text-[#787268] text-[#FAF6EE] text-xs font-medium rounded-md transition-colors disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{transcript ? 'Resume Mic' : 'Start Answering'}</span>
                  </motion.button>
                )}

                {transcript && !isRecording && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#23211D] text-[#4A463F] dark:text-[#A8A297] border border-[#E4DCC9] dark:border-[#38342D] text-xs font-medium rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                    title="Reset answer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}

            {/* Stats: Timer & Word count */}
            <div className="flex items-center gap-3 text-xs font-medium text-[#787268] dark:text-[#A8A297]">
              {inputMode === 'voice' && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#787268] dark:text-[#A8A297]" />
                  <span className={isRecording ? 'text-[#C2572B] dark:text-[#E07A5F] font-mono font-semibold' : 'font-mono text-[#1C1B17] dark:text-[#FAF6EE]'}>
                    {formatTime(duration)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#787268] dark:text-[#A8A297]" />
                <span className="text-[#1C1B17] dark:text-[#FAF6EE]">{wordCount} words</span>
              </div>

              {isRecording && (
                <div className="flex items-center gap-1.5 text-[#C2572B] dark:text-[#E07A5F]">
                  <span className="h-2 w-2 rounded-full bg-[#C2572B] dark:bg-[#E07A5F] animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold">Live Mic</span>
                </div>
              )}
            </div>
          </div>

          {/* Transcript / Input Area */}
          <div className="flex-1 flex flex-col">
            {/* Live STAR Structure Coverage HUD */}
            <div className="flex items-center justify-between px-3.5 py-2 mb-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#787268] dark:text-[#A8A297]">
                Live STAR Coverage
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: 'hasS', letter: 'S', label: 'Situation' },
                  { key: 'hasT', letter: 'T', label: 'Task' },
                  { key: 'hasA', letter: 'A', label: 'Action' },
                  { key: 'hasR', letter: 'R', label: 'Result' },
                ].map((item) => {
                  const active = detectedCues[item.key];
                  return (
                    <span
                      key={item.key}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        active
                          ? 'bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]'
                          : 'bg-[#FFFDF8] dark:bg-[#23211D] text-[#787268] dark:text-[#8E877C] border border-[#E4DCC9] dark:border-[#38342D] opacity-60'
                      }`}
                      title={`${item.label}: ${active ? 'Cues Detected ✓' : 'Listening for transition keywords...'}`}
                    >
                      <span>{item.letter}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                      {active && <span>✓</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Live Audio Visualizer Banner when recording */}
            {isRecording && (
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 mb-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#2F5233]/40 dark:border-[#689D6A]/40 rounded-lg shadow-xs overflow-hidden relative min-w-0">
                <div className="flex items-center gap-1 h-6 sm:h-7 flex-shrink-0">
                  {[24, 14, 28, 18, 30, 20, 26, 12, 30, 22, 16, 28, 20, 30, 14, 26, 18, 30].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [`${Math.max(4, h * 0.25)}px`, `${h}px`, `${Math.max(4, h * 0.35)}px`],
                        opacity: [0.65, 1, 0.75],
                      }}
                      transition={{
                        duration: 0.55 + (i % 6) * 0.12,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: (i % 8) * 0.06,
                      }}
                      className={`w-1 bg-gradient-to-t from-[#2F5233] to-[#689D6A] dark:from-[#3B663F] dark:to-[#86EFAC] rounded-full ${
                        i >= 10 ? 'hidden xs:block' : ''
                      } ${i >= 14 ? 'hidden sm:block' : ''}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center sm:justify-start">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C2572B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C2572B]" />
                  </span>
                  <span className="text-xs font-medium text-[#2F5233] dark:text-[#689D6A] truncate">
                    <span className="hidden sm:inline">Listening live • Speak naturally</span>
                    <span className="sm:hidden">Listening live</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#C2572B]/10 dark:bg-[#E07A5F]/15 text-[10px] font-bold uppercase tracking-wider text-[#C2572B] dark:text-[#E07A5F] flex-shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C2572B] dark:bg-[#E07A5F]" />
                  <span>REC</span>
                </div>
              </div>
            )}

            {inputMode === 'type' ? (
              <div className="flex-1 flex flex-col space-y-2">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Type or paste your answer here... (minimum 5 words for STAR evaluation)"
                  rows={8}
                  className="w-full flex-1 p-3.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268] dark:placeholder:text-[#A8A297] text-sm focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors resize-none leading-relaxed"
                />
                <p className="text-[11px] text-[#787268] dark:text-[#A8A297]">
                  Manual text fallback mode: Your written answer is graded on the same STAR criteria, clarity, and phrasing rubric.
                </p>
              </div>
            ) : (
              <div className="min-h-[180px] max-h-[320px] flex-1 overflow-y-auto p-4 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-sm leading-relaxed">
                {transcript || interimTranscript ? (
                  <p className="text-[#1C1B17] dark:text-[#FAF6EE]">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-[#787268] dark:text-[#A8A297] italic"> {interimTranscript}</span>
                    )}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-[#787268] dark:text-[#A8A297] text-center">
                    <Volume2 className="w-6 h-6 mb-1 text-[#E4DCC9] dark:text-[#38342D]" />
                    <p className="text-xs">
                      {isRecording
                        ? 'Listening... Speak directly into your microphone.'
                        : 'Click "Start Speaking" or switch to "Type Answer" above.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit / Analyze button */}
          <div className="mt-5 pt-4 border-t border-[#E4DCC9] dark:border-[#38342D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="text-[11px] text-[#787268] dark:text-[#A8A297] min-w-0">
              Evaluates STAR structure, clarity, filler words & pacing.
            </div>

            <ShimmerButton
              onClick={handleAnalyze}
              disabled={isAnalyzing || wordCount < 5}
              shimmerColor="#86EFAC"
              background="#2F5233"
              className="self-end sm:self-auto px-5 py-2 text-xs font-semibold rounded-md shadow-xs flex-shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Answer</span>
                </>
              )}
            </ShimmerButton>
          </div>
        </>
      )}
    </div>
  );
};

export default Recorder;
