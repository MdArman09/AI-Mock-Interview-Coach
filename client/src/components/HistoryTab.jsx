import React, { useState, useEffect, useMemo, useRef } from 'react';
import hotToast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionAPI } from '../services/api';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  Loader2,
  Calendar,
  Sparkles,
  RefreshCw,
  Target,
  ThumbsUp,
  CheckCircle2,
} from 'lucide-react';
import RadialScoreGauge from './ui/RadialScoreGauge';

export const HistoryTab = ({ onSelectQuestionToRetry }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'bank' | 'resume'
  const [selectedResumeLabel, setSelectedResumeLabel] = useState('all');

  // Map of active pending deletions: sessionId -> { timerId, toastId, session, originalIndex }
  const pendingDeletionsRef = useRef(new Map());

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await sessionAPI.getHistory();
      if (response.success && Array.isArray(response.data)) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError(err.message || 'Could not load your session history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Flush any pending deletions immediately before sign-out or unmount
  const flushPendingDeletions = async () => {
    const promises = [];
    pendingDeletionsRef.current.forEach((entry, sessionId) => {
      clearTimeout(entry.timerId);
      if (entry.toastId) {
        hotToast.dismiss(entry.toastId);
      }
      promises.push(
        sessionAPI.deleteSession(sessionId).catch((err) => {
          console.error('[HistoryTab] Failed to flush deletion:', err);
        })
      );
    });
    pendingDeletionsRef.current.clear();
    await Promise.all(promises);
  };

  useEffect(() => {
    window.__flushHistoryDeletions = flushPendingDeletions;
    const handleFlushEvent = () => {
      flushPendingDeletions();
    };
    window.addEventListener('app:flush-pending-deletions', handleFlushEvent);
    return () => {
      delete window.__flushHistoryDeletions;
      window.removeEventListener('app:flush-pending-deletions', handleFlushEvent);
      flushPendingDeletions();
    };
  }, []);

  /**
   * Handle Confirm from the ConfirmDialog:
   * Optimistically removes the session from state, animates out, shows 6s Undo toast,
   * and schedules the API call for after the timer expires.
   */
  const handleConfirmDelete = () => {
    if (!sessionToDelete) return;

    const session = sessionToDelete;
    const sessionId = session._id;
    const originalIndex = history.findIndex((s) => s._id === sessionId);

    // Close the confirmation modal
    setSessionToDelete(null);

    // Collapse row if currently expanded
    if (expandedId === sessionId) {
      setExpandedId(null);
    }

    // 1. Optimistically remove from state (triggers animate-out and stats recalculation)
    setHistory((prev) => prev.filter((item) => item._id !== sessionId));

    // 2. Render custom warm-palette Undo toast (visible for 6 seconds)
    const toastId = hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } max-w-sm w-full bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] shadow-lg rounded-lg pointer-events-auto flex items-center justify-between p-3.5 gap-3 text-xs transition-all duration-200`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#C2572B] flex-shrink-0" />
            <span className="text-[#1C1B17] dark:text-[#FAF6EE] font-medium truncate">
              Session deleted
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUndoDelete(sessionId)}
            className="px-2.5 py-1 bg-[#2F5233] dark:bg-[#3B663F] hover:bg-[#244027] dark:hover:bg-[#2F5233] text-[#FAF6EE] text-xs font-semibold rounded transition-colors cursor-pointer active:scale-95 flex-shrink-0"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 6000, id: `delete-toast-${sessionId}` }
    );

    // 3. Start 6-second timer before sending DELETE request to server
    const timerId = setTimeout(async () => {
      pendingDeletionsRef.current.delete(sessionId);
      try {
        await sessionAPI.deleteSession(sessionId);
      } catch (err) {
        console.error('Failed to delete session on server:', err);
        // Restore session in list on server failure
        setHistory((prev) => {
          if (prev.some((s) => s._id === sessionId)) return prev;
          const copy = [...prev];
          const insertIdx = Math.min(Math.max(0, originalIndex), copy.length);
          copy.splice(insertIdx, 0, session);
          return copy;
        });
        hotToast.error("Couldn't delete session. Restored it.");
      }
    }, 6000);

    // Register in pending map
    pendingDeletionsRef.current.set(sessionId, {
      timerId,
      toastId,
      session,
      originalIndex,
    });
  };

  /**
   * Handle Undo: cancels the timer, dismisses the toast, restores the session at its
   * original position, and avoids calling the server DELETE API.
   */
  const handleUndoDelete = (sessionId) => {
    const entry = pendingDeletionsRef.current.get(sessionId);
    if (!entry) return;

    // 1. Cancel timer & dismiss toast
    clearTimeout(entry.timerId);
    hotToast.dismiss(entry.toastId);
    pendingDeletionsRef.current.delete(sessionId);

    // 2. Restore session into state at original position
    setHistory((prev) => {
      if (prev.some((s) => s._id === sessionId)) return prev;
      const copy = [...prev];
      const insertIdx = Math.min(Math.max(0, entry.originalIndex), copy.length);
      copy.splice(insertIdx, 0, entry.session);
      return copy;
    });

    hotToast.success('Session restored.');
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDifficultyBadge = (difficulty) => {
    if (!difficulty) return null;
    const diff = difficulty.toLowerCase();
    if (diff === 'easy' || diff === 'basic') {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]">
          {difficulty}
        </span>
      );
    }
    if (diff === 'hard' || diff === 'advanced') {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F]">
          {difficulty}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border border-[#E4DCC9] dark:border-[#38342D]">
        {difficulty}
      </span>
    );
  };

  // Extract unique resume labels from history for secondary dropdown
  const resumeLabels = useMemo(() => {
    const labels = new Set();
    history.forEach((s) => {
      if (s.questionSource === 'resume' && s.resumeLabel) {
        labels.add(s.resumeLabel);
      }
    });
    return Array.from(labels);
  }, [history]);

  // Client-side filtering by questionSource and specific resume label
  const filteredHistory = useMemo(() => {
    return history.filter((session) => {
      const isResume = session.questionSource === 'resume';
      if (sourceFilter === 'bank' && isResume) return false;
      if (sourceFilter === 'resume') {
        if (!isResume) return false;
        if (selectedResumeLabel !== 'all' && session.resumeLabel !== selectedResumeLabel) {
          return false;
        }
      }
      return true;
    });
  }, [history, sourceFilter, selectedResumeLabel]);

  // Stats always derived dynamically from the filtered visible history
  const totalSessions = filteredHistory.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(
          filteredHistory.reduce((acc, s) => acc + (s.scores?.overall || 0), 0) /
            totalSessions
        )
      : 0;

  if (loading) {
    return (
      <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-10 text-center shadow-none min-h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#2F5233] dark:text-[#689D6A] mx-auto mb-2" />
        <p className="text-xs text-[#787268] dark:text-[#8E877C]">Loading your session history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-lg p-6 text-center shadow-none">
        <p className="text-xs text-[#C2572B] dark:text-[#E07A5F] font-medium mb-3">{error}</p>
        <button
          onClick={fetchHistory}
          className="text-xs font-medium px-3.5 py-1.5 bg-[#FFFDF8] dark:bg-[#23211D] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md transition-colors active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Unified History Header & Filter Controls Card */}
      <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-xl p-4 sm:p-6 shadow-none space-y-4 min-w-0">
        {/* Top Row: Title, Subtitle & Sessions/Score Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-lg font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] truncate">
              Interview Practice History
            </h2>
            <p className="text-xs text-[#787268] dark:text-[#8E877C] mt-0.5 truncate">
              Review past mock interview responses and track progress over time
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 min-w-0 self-start sm:self-auto">
            <div className="flex items-center gap-2.5 sm:gap-3 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-md text-xs">
              <div>
                <span className="text-[#787268] dark:text-[#8E877C] block text-[10px] uppercase font-serif font-bold">
                  Sessions
                </span>
                <span className="font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] text-sm">
                  {totalSessions}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#E4DCC9] dark:bg-[#38342D]" />
              <div>
                <span className="text-[#787268] dark:text-[#8E877C] block text-[10px] uppercase font-serif font-bold">
                  Avg Score
                </span>
                <span className="font-serif font-bold text-[#2F5233] dark:text-[#689D6A] text-sm">
                  {avgScore}/100
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              className="p-2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#2D2A24] border border-[#E4DCC9] dark:border-[#38342D] rounded-md transition-colors cursor-pointer active:scale-[0.98] flex-shrink-0"
              title="Refresh History"
              aria-label="Refresh History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Source Segmented Tabs + Optional Secondary Resume Dropdown */}
        <div className="pt-3.5 border-t border-[#E4DCC9] dark:border-[#38342D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 flex-wrap">
          {/* Responsive Segmented Control: 3 equal grid columns on mobile, auto flex on sm+ */}
          <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 min-w-0 bg-[#FAF6EE] dark:bg-[#181714] p-1 rounded-lg border border-[#E4DCC9] dark:border-[#38342D] w-full sm:w-auto">
            {/* Tab 1: All */}
            <button
              type="button"
              onClick={() => {
                setSourceFilter('all');
                setSelectedResumeLabel('all');
              }}
              className={`relative px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                sourceFilter === 'all'
                  ? 'text-[#FAF6EE]'
                  : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
              }`}
            >
              {sourceFilter === 'all' && (
                <motion.div
                  layoutId="historySourceFilterPill"
                  className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 truncate">All</span>
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                  sourceFilter === 'all'
                    ? 'bg-white/20 text-[#FAF6EE]'
                    : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
                }`}
              >
                {history.length}
              </span>
            </button>

            {/* Tab 2: Question Bank */}
            <button
              type="button"
              onClick={() => {
                setSourceFilter('bank');
                setSelectedResumeLabel('all');
              }}
              className={`relative px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                sourceFilter === 'bank'
                  ? 'text-[#FAF6EE]'
                  : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
              }`}
            >
              {sourceFilter === 'bank' && (
                <motion.div
                  layoutId="historySourceFilterPill"
                  className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 sm:hidden truncate">Bank</span>
              <span className="relative z-10 hidden sm:inline truncate">Question Bank</span>
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                  sourceFilter === 'bank'
                    ? 'bg-white/20 text-[#FAF6EE]'
                    : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
                }`}
              >
                {history.filter((s) => s.questionSource !== 'resume').length}
              </span>
            </button>

            {/* Tab 3: From Resume */}
            <button
              type="button"
              onClick={() => {
                setSourceFilter('resume');
                setSelectedResumeLabel('all');
              }}
              className={`relative px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                sourceFilter === 'resume'
                  ? 'text-[#FAF6EE]'
                  : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
              }`}
            >
              {sourceFilter === 'resume' && (
                <motion.div
                  layoutId="historySourceFilterPill"
                  className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 sm:hidden truncate">Resume</span>
              <span className="relative z-10 hidden sm:inline truncate">From Resume</span>
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                  sourceFilter === 'resume'
                    ? 'bg-white/20 text-[#FAF6EE]'
                    : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
                }`}
              >
                {history.filter((s) => s.questionSource === 'resume').length}
              </span>
            </button>
          </div>

          {/* Secondary dropdown: Only when "From Resume" is active AND there is more than 1 resume label */}
          {sourceFilter === 'resume' && resumeLabels.length > 1 && (
            <div className="relative w-full sm:w-56 min-w-0 flex-shrink-0">
              <label htmlFor="history-resume-select" className="sr-only">
                Filter by resume
              </label>
              <select
                id="history-resume-select"
                value={selectedResumeLabel}
                onChange={(e) => setSelectedResumeLabel(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-1.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] cursor-pointer transition-colors truncate"
              >
                <option value="all">All Resumes ({resumeLabels.length})</option>
                {resumeLabels.map((lbl) => (
                  <option key={lbl} value={lbl}>
                    {lbl}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Sessions list */}
      {history.length === 0 ? (
        <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-10 text-center shadow-none space-y-3">
          <div className="w-10 h-10 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-[#2F5233] dark:text-[#689D6A] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
            No Interview Sessions Yet
          </h3>
          <p className="text-xs text-[#787268] dark:text-[#8E877C] max-w-sm mx-auto">
            Pick a question from the Practice tab, record your answer, and receive real-time AI feedback on your performance!
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-8 text-center shadow-none">
          <p className="text-xs text-[#787268] dark:text-[#8E877C]">
            {sourceFilter === 'resume'
              ? 'No resume-based practice yet. Upload a resume to get personalized questions.'
              : sourceFilter === 'bank'
              ? 'No question bank practice yet. Select a question from the Question Bank in Practice to get started.'
              : 'No interview sessions match the current filter.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${sourceFilter}-${selectedResumeLabel}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="space-y-3 min-w-0"
          >
            <AnimatePresence initial={false}>
              {filteredHistory.map((session) => {
                const isExpanded = expandedId === session._id;
                const overall = Number(session.scores?.overall) || 0;
                const star = Number(session.scores?.starStructure) || 0;
                const clarity = Number(session.scores?.clarity) || 0;
                const filler = Number(session.scores?.fillerWordCount) || 0;
                const fillerScore =
                  session.scores?.fillerScore !== undefined
                    ? Number(session.scores.fillerScore)
                    : Math.max(0, 10 - filler);
                const starBreakdown = session.starBreakdown;
                const strengths = session.strengths || [];
                const improvements =
                  session.improvements?.length > 0
                    ? session.improvements
                    : session.suggestions || [];
                const improvedOpening = session.improvedOpening;
                const isGibberish = Boolean(session.isGibberishOrOffTopic || session.modelAnswerType === 'exemplary_benchmark');

                const starKeys = [
                  { key: 'situation', label: 'Situation' },
                  { key: 'task', label: 'Task' },
                  { key: 'action', label: 'Action' },
                  { key: 'result', label: 'Result' },
                ];

                const isResume = session.questionSource === 'resume';

                return (
                  <motion.div
                    key={session._id}
                    layout="position"
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg shadow-none overflow-hidden transition-colors hover:border-[#2F5233]/40 dark:hover:border-[#689D6A]/40"
                  >
                    {/* Session Summary Row */}
                    <div
                      onClick={() => toggleExpand(session._id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Source Chip & Metadata Row */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#787268] dark:text-[#8E877C] min-w-0">
                          {isGibberish && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAEEE8] dark:bg-[#2D1B16] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#523226] flex-shrink-0">
                              Incoherent / Off-topic
                            </span>
                          )}
                          {isResume ? (
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530] flex-shrink-0">
                                Resume
                              </span>
                              {session.resumeLabel && (
                                <span
                                  className="text-[11px] text-[#787268] dark:text-[#8E877C] font-medium truncate max-w-[140px] sm:max-w-[200px]"
                                  title={session.resumeLabel}
                                >
                                  {session.resumeLabel}
                                </span>
                              )}
                              {session.questionType && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border border-[#E4DCC9] dark:border-[#38342D] flex-shrink-0">
                                  {session.questionType}
                                </span>
                              )}
                              {getDifficultyBadge(session.difficulty)}
                              {session.anchor && (
                                <span
                                  className="text-[11px] text-[#787268] dark:text-[#8E877C] italic truncate max-w-[140px] sm:max-w-[180px]"
                                  title={session.anchor}
                                >
                                  · {session.anchor}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border border-[#E4DCC9] dark:border-[#38342D] flex-shrink-0">
                              Question Bank
                            </span>
                          )}

                          <span className="text-[#E4DCC9] dark:text-[#38342D] flex-shrink-0">•</span>

                          <div className="flex items-center gap-1 text-xs flex-shrink-0">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{formatDate(session.createdAt)}</span>
                          </div>

                          {session.audioDuration > 0 && (
                            <>
                              <span className="text-[#E4DCC9] dark:text-[#38342D] flex-shrink-0">•</span>
                              <span className="font-mono text-xs flex-shrink-0">
                                {session.audioDuration}s
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-sm font-serif font-semibold text-[#1C1B17] dark:text-[#FAF6EE] leading-snug line-clamp-2 break-words">
                          {session.questionText}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-shrink-0 min-w-0">
                        {/* Score badges */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                          <div className="px-2 py-0.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#4A463F] dark:text-[#B5AFA2] whitespace-nowrap">
                            <span className="text-[#787268] dark:text-[#8E877C] text-[10px] mr-1">STAR</span>
                            <span className="font-medium text-[#1C1B17] dark:text-[#FAF6EE]">{star}/10</span>
                          </div>
                          <div className="px-2 py-0.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#4A463F] dark:text-[#B5AFA2] whitespace-nowrap">
                            <span className="text-[#787268] dark:text-[#8E877C] text-[10px] mr-1">Clarity</span>
                            <span className="font-medium text-[#1C1B17] dark:text-[#FAF6EE]">{clarity}/10</span>
                          </div>
                          <div className="px-2.5 py-0.5 bg-[#EEF3EE] dark:bg-[#1E2E20] border border-[#D9E5DA] dark:border-[#2D4530] rounded-md text-xs text-[#2F5233] dark:text-[#689D6A] font-serif font-bold whitespace-nowrap">
                            {overall}/100
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(session);
                            }}
                            className="p-1.5 text-[#787268] dark:text-[#8E877C] hover:text-[#C2572B] dark:hover:text-[#E07A5F] rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                            title="Delete Session"
                            aria-label="Delete Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="p-1 text-[#787268] dark:text-[#8E877C]">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Session Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] space-y-4">
                        {/* Resume Metadata Context Bar (if from Resume) */}
                        {isResume && (
                          <div className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="text-[10px] uppercase font-serif font-bold text-[#787268] dark:text-[#8E877C]">
                                Source:
                              </span>
                              <span className="font-semibold text-[#2F5233] dark:text-[#689D6A] bg-[#EEF3EE] dark:bg-[#1E2E20] px-1.5 py-0.2 rounded border border-[#D9E5DA] dark:border-[#2D4530] text-[10px]">
                                Resume
                              </span>
                              {session.resumeLabel && (
                                <span
                                  className="text-[#1C1B17] dark:text-[#FAF6EE] font-medium truncate max-w-[220px] sm:max-w-[320px]"
                                  title={session.resumeLabel}
                                >
                                  {session.resumeLabel}
                                </span>
                              )}
                              {session.questionType && (
                                <span className="text-[#787268] dark:text-[#8E877C]">
                                  • Type: {session.questionType}
                                </span>
                              )}
                              {session.difficulty && (
                                <span className="text-[#787268] dark:text-[#8E877C]">
                                  • Difficulty: {session.difficulty}
                                </span>
                              )}
                              {session.anchor && (
                                <span
                                  className="text-[#787268] dark:text-[#8E877C] italic truncate max-w-[200px]"
                                  title={session.anchor}
                                >
                                  • Anchor: {session.anchor}
                                </span>
                              )}
                            </div>
                            {onSelectQuestionToRetry && (
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectQuestionToRetry({
                                    _id: session.questionId,
                                    text: session.questionText,
                                    category: session.category,
                                    difficulty: session.difficulty,
                                    type: session.questionType,
                                    anchor: session.anchor,
                                    resumeId: session.resumeId,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] text-[#FAF6EE] text-[11px] font-semibold rounded transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Practice Again</span>
                              </button>
                            )}
                          </div>
                        )}

                        {!isResume && onSelectQuestionToRetry && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectQuestionToRetry({
                                  _id: session.questionId,
                                  text: session.questionText,
                                  category: session.category,
                                  difficulty: session.difficulty,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] text-[#FAF6EE] text-[11px] font-semibold rounded transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Practice Again</span>
                            </button>
                          </div>
                        )}

                        {/* Scores Detail Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-center">
                            <div className="text-[10px] uppercase font-serif font-bold text-[#787268] dark:text-[#8E877C]">
                              STAR Score
                            </div>
                            <div className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                              {star} / 10
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-center">
                            <div className="text-[10px] uppercase font-serif font-bold text-[#787268] dark:text-[#8E877C]">
                              Clarity
                            </div>
                            <div className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                              {clarity} / 10
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-center">
                            <div className="text-[10px] uppercase font-serif font-bold text-[#787268] dark:text-[#8E877C]">
                              Filler Score
                            </div>
                            <div className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                              {fillerScore} / 10
                            </div>
                            <div className="text-[10px] text-[#787268] dark:text-[#8E877C]">
                              {filler} detected
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-center">
                            <div className="text-[10px] uppercase font-serif font-bold text-[#787268] dark:text-[#8E877C]">
                              Pace
                            </div>
                            <div className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                              {session.audioDuration > 0 && session.wpm > 0 ? `${session.wpm} wpm` : '—'}
                            </div>
                          </div>
                        </div>

                        {/* STAR Breakdown if present */}
                        {starBreakdown && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                              <span>STAR Breakdown & Evidence Quotes</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {starKeys.map(({ key, label }) => {
                                const comp = starBreakdown[key];
                                if (!comp) return null;
                                const isPresent = Boolean(comp.present);
                                return (
                                  <div
                                    key={key}
                                    className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">{label}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[11px] font-bold">{comp.score}/10</span>
                                        {isPresent ? (
                                          <span className="px-1.5 py-0.2 bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] text-[10px] rounded font-medium">
                                            Present
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.2 bg-[#FAEEE8] dark:bg-[#2D1B16] text-[#C2572B] dark:text-[#E07A5F] text-[10px] rounded font-medium">
                                            Missing
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {comp.evidence ? (
                                      <p className="italic text-[11px] text-[#4A463F] dark:text-[#C5BFB5]">
                                        “{comp.evidence}”
                                      </p>
                                    ) : (
                                      <p className="italic text-[10px] text-[#787268] dark:text-[#8E877C]">
                                        No evidence in transcript
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* What You Did Well (Strengths) */}
                        {strengths.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] flex items-center gap-1.5">
                              <ThumbsUp className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                              <span>What You Did Well</span>
                            </div>
                            <div className="space-y-1.5">
                              {strengths.map((str, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-[#EEF3EE]/60 dark:bg-[#1E2E20]/40 border border-[#D9E5DA] dark:border-[#2D4530] rounded-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed flex items-start gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A] flex-shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* What to Improve */}
                        {improvements.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-[#C2572B] dark:text-[#E07A5F]" />
                              <span>What to Improve</span>
                            </div>
                            <div className="space-y-1.5">
                              {improvements.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed flex items-start gap-2"
                                >
                                  <span className="w-4 h-4 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-[#C2572B] dark:text-[#E07A5F] text-[10px] font-serif font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stronger Version or Benchmark Model Answer */}
                        {improvedOpening && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                                <span>{isGibberish ? 'Exemplary STAR Model Answer' : 'Stronger Version (Model Restructure)'}</span>
                              </div>
                              {isGibberish && (
                                <span className="text-[9px] font-serif font-bold px-1.5 py-0.5 rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]">
                                  Benchmark
                                </span>
                              )}
                            </div>
                            <div className="p-3 bg-[#FFFDF8] dark:bg-[#23211D] border-l-2 border-l-[#2F5233] dark:border-l-[#689D6A] border-t border-r border-b border-[#E4DCC9] dark:border-[#38342D] rounded-r-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed italic">
                              “{improvedOpening}”
                            </div>
                          </div>
                        )}

                        {/* Transcript */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C]" />
                            <span>Recorded Transcript</span>
                          </div>
                          <div className="p-3 bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] leading-relaxed max-h-40 overflow-y-auto font-mono">
                            {session.transcript}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Confirmation Dialog for Session Deletion */}
      <ConfirmDialog
        open={Boolean(sessionToDelete)}
        title="Delete this session?"
        description={sessionToDelete?.questionText || 'Interview Question'}
        note="This will remove the transcript and feedback for this attempt."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onCancel={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default HistoryTab;
