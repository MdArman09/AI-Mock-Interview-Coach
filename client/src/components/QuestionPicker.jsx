import React, { useState, useEffect, useMemo, useRef } from 'react';
import hotToast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { questionAPI, resumeAPI } from '../services/api';
import { ResumeUpload } from './ResumeUpload';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { ShimmerButton } from './ui/ShimmerButton';
import {
  Search,
  CheckCircle2,
  BookOpen,
  Loader2,
  Sparkles,
  FileText,
  ChevronDown,
  Trash2,
  RotateCw,
} from 'lucide-react';

export const QuestionPicker = ({ selectedQuestion, onSelectQuestion }) => {
  const toast = useToast();
  const [bankQuestions, setBankQuestions] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumeQuestions, setResumeQuestions] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState('bank'); // 'bank' | 'resume'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [isRefreshingBank, setIsRefreshingBank] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    Basic: false,
    Intermediate: false,
    Advanced: false,
  });

  const pendingDeletionsRef = useRef(new Map());

  // Flush any pending deletions immediately before sign-out or unmount
  const flushPendingDeletions = async () => {
    const promises = [];
    pendingDeletionsRef.current.forEach((entry, targetId) => {
      clearTimeout(entry.timerId);
      if (entry.toastId) {
        hotToast.dismiss(entry.toastId);
      }
      promises.push(
        resumeAPI.deleteResume(targetId).catch((err) => {
          console.error('[QuestionPicker] Failed to flush resume deletion:', err);
        })
      );
    });
    pendingDeletionsRef.current.clear();
    await Promise.all(promises);
  };

  useEffect(() => {
    window.__flushResumeDeletions = flushPendingDeletions;
    const handleFlushEvent = () => {
      flushPendingDeletions();
    };
    window.addEventListener('app:flush-pending-deletions', handleFlushEvent);
    return () => {
      delete window.__flushResumeDeletions;
      window.removeEventListener('app:flush-pending-deletions', handleFlushEvent);
      flushPendingDeletions();
    };
  }, []);

  // Initial load
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch bank questions
        const bankRes = await questionAPI.getQuestions();
        const loadedBank =
          bankRes.success && Array.isArray(bankRes.data) ? bankRes.data : [];
        setBankQuestions(loadedBank);

        // 2. Fetch user's resumes
        let loadedResumes = [];
        try {
          const resumesRes = await resumeAPI.getResumes();
          if (resumesRes.success && Array.isArray(resumesRes.data)) {
            loadedResumes = resumesRes.data;
            setResumes(loadedResumes);
          }
        } catch {
          setResumes([]);
        }

        // 3. Fetch questions for the newest resume by default
        let loadedResumeQuestions = [];
        if (loadedResumes.length > 0) {
          const defaultResumeId = loadedResumes[0]._id;
          setSelectedResumeId(defaultResumeId);
          try {
            const qRes = await questionAPI.getResumeQuestions(defaultResumeId);
            if (qRes.success && Array.isArray(qRes.data)) {
              loadedResumeQuestions = qRes.data;
              setResumeQuestions(loadedResumeQuestions);
            }
          } catch {
            setResumeQuestions([]);
          }
        }

        // 4. Default selected question
        if (!selectedQuestion) {
          if (loadedBank.length > 0) {
            onSelectQuestion(loadedBank[0]);
          } else if (loadedResumeQuestions.length > 0) {
            onSelectQuestion(loadedResumeQuestions[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
        setError(err.message || 'Could not load interview questions');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Fetch questions when user switches resume set
  const handleResumeChange = async (newResumeId) => {
    setSelectedResumeId(newResumeId);
    try {
      const qRes = await questionAPI.getResumeQuestions(newResumeId);
      if (qRes.success && Array.isArray(qRes.data)) {
        setResumeQuestions(qRes.data);
        if (qRes.data.length > 0) {
          onSelectQuestion(qRes.data[0]);
        }
      } else {
        setResumeQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching questions for resume set:', err);
      setResumeQuestions([]);
    }
  };

  // Currently active resume
  const currentResume = useMemo(() => {
    return resumes.find((r) => r._id === selectedResumeId) || resumes[0] || null;
  }, [resumes, selectedResumeId]);

  // Format label for dropdown: clean, concise, mobile-safe
  const formatResumeOption = (r) => {
    const count = r.questionCount ?? 0;
    const countStr = `${count} question${count === 1 ? '' : 's'}`;
    if (r.isLegacy) {
      return `Earlier questions · ${countStr}`;
    }
    const rawLabel = (r.label || r.fileName || 'Resume').trim();
    // Shorten long filenames gracefully so they fit cleanly in native mobile select pickers
    const shortLabel =
      rawLabel.length > 24
        ? `${rawLabel.slice(0, 14)}...${rawLabel.slice(-7)}`
        : rawLabel;

    const dateStr = r.createdAt
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(r.createdAt))
      : '';

    return dateStr
      ? `${shortLabel} · ${dateStr} (${countStr})`
      : `${shortLabel} (${countStr})`;
  };

  // Question bank categories
  const bankCategories = useMemo(() => {
    const set = new Set(bankQuestions.map((q) => q.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [bankQuestions]);

  // Resume questions difficulty options
  const resumeDifficulties = ['All', 'Basic', 'Intermediate', 'Advanced'];

  // Current question set based on active top-level tab
  const currentQuestions = activeMainTab === 'bank' ? bankQuestions : resumeQuestions;

  // Filtered questions: searches text, type, anchor, and category/difficulty
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentQuestions.filter((q) => {
      if (activeMainTab === 'bank') {
        const matchesCategory =
          selectedCategory === 'All' || q.category === selectedCategory;
        const matchesSearch =
          !query ||
          q.text.toLowerCase().includes(query) ||
          q.category?.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      } else {
        // Resume Questions tab: filter by difficulty & search text, type, anchor
        const qDiff = q.difficulty || 'Intermediate';
        const matchesDifficulty =
          selectedDifficulty === 'All' ||
          qDiff.toLowerCase() === selectedDifficulty.toLowerCase();
        const matchesSearch =
          !query ||
          q.text.toLowerCase().includes(query) ||
          q.type?.toLowerCase().includes(query) ||
          q.anchor?.toLowerCase().includes(query) ||
          qDiff.toLowerCase().includes(query);
        return matchesDifficulty && matchesSearch;
      }
    });
  }, [
    currentQuestions,
    activeMainTab,
    selectedCategory,
    selectedDifficulty,
    searchQuery,
  ]);

  // Grouped questions:
  // For Bank: by category
  // For Resume: by difficulty (Basic, Intermediate, Advanced)
  const groupedQuestions = useMemo(() => {
    if (activeMainTab === 'bank') {
      if (selectedCategory !== 'All') {
        return { [selectedCategory]: filteredQuestions };
      }
      const groups = {};
      for (const q of filteredQuestions) {
        const cat = q.category || 'General';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(q);
      }
      return groups;
    } else {
      if (selectedDifficulty !== 'All') {
        return { [selectedDifficulty]: filteredQuestions };
      }
      const difficultyOrder = ['Basic', 'Intermediate', 'Advanced'];
      const groups = {};

      for (const diff of difficultyOrder) {
        const matched = filteredQuestions.filter(
          (q) => (q.difficulty || 'Intermediate').toLowerCase() === diff.toLowerCase()
        );
        if (matched.length > 0) {
          groups[diff] = matched;
        }
      }

      // Any other uncategorized difficulty
      const other = filteredQuestions.filter(
        (q) =>
          !difficultyOrder.some(
            (d) => d.toLowerCase() === (q.difficulty || '').toLowerCase()
          )
      );
      if (other.length > 0) {
        groups['Other'] = other;
      }

      return groups;
    }
  }, [filteredQuestions, activeMainTab, selectedCategory, selectedDifficulty]);

  const toggleSectionCollapse = (diffKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [diffKey]: !prev[diffKey],
    }));
  };

  const getDifficultyBadge = (difficulty) => {
    const diff = (difficulty || 'Medium').toLowerCase();
    if (diff === 'easy' || diff === 'basic') {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530]">
          {difficulty || 'Basic'}
        </span>
      );
    }
    if (diff === 'hard' || diff === 'advanced') {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F]">
          {difficulty || 'Advanced'}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border border-[#E4DCC9] dark:border-[#38342D]">
        {difficulty || 'Intermediate'}
      </span>
    );
  };

  // Upload complete handler: select the new set automatically
  const handleResumeSuccess = (payload) => {
    const newQuestions = payload?.questions || [];
    const newResumeId = payload?.resumeId || payload?.resume?._id;
    const newLabel = payload?.label || payload?.resume?.label || 'Resume';

    if (newResumeId && Array.isArray(newQuestions) && newQuestions.length > 0) {
      const newResumeItem = {
        _id: newResumeId,
        label: newLabel,
        fileName: payload?.resume?.fileName || newLabel,
        createdAt: payload?.resume?.createdAt || new Date(),
        questionCount: newQuestions.length,
        level: payload?.resume?.level || 'fresher',
        plannedQuestionCount: payload?.resume?.plannedQuestionCount || newQuestions.length,
      };

      setResumes((prev) => [
        newResumeItem,
        ...prev.filter((r) => r._id !== newResumeId),
      ]);
      setSelectedResumeId(newResumeId);
      setResumeQuestions(newQuestions);
      setActiveMainTab('resume');
      setIsUploadOpen(false);
      onSelectQuestion(newQuestions[0]);
    }
  };

  // Delete resume set flow with ConfirmDialog and 6s Undo toast
  const handleRequestDeleteResume = (resumeObj) => {
    if (!resumeObj) return;
    setResumeToDelete(resumeObj);
  };

  const handleConfirmDeleteResume = () => {
    if (!resumeToDelete) return;

    const targetResume = resumeToDelete;
    const targetId = targetResume._id;
    const originalIndex = resumes.findIndex((r) => r._id === targetId);
    const deletedQuestions = resumeQuestions;

    setResumeToDelete(null);

    // Optimistically remove from state
    const updatedResumes = resumes.filter((r) => r._id !== targetId);
    setResumes(updatedResumes);

    if (selectedResumeId === targetId) {
      const nextResume = updatedResumes[0] || null;
      setSelectedResumeId(nextResume ? nextResume._id : null);
      if (nextResume) {
        handleResumeChange(nextResume._id);
      } else {
        setResumeQuestions([]);
      }
    }

    const label = targetResume.isLegacy
      ? 'Earlier questions'
      : targetResume.label || targetResume.fileName || 'Resume';

    // Show 6-second custom warm-palette Undo toast
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
              {targetResume.isLegacy
                ? 'Earlier questions removed'
                : `Resume set "${label}" deleted`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUndoDeleteResume(targetId)}
            className="px-2.5 py-1 bg-[#2F5233] dark:bg-[#3B663F] hover:bg-[#244027] dark:hover:bg-[#2F5233] text-[#FAF6EE] text-xs font-semibold rounded transition-colors cursor-pointer active:scale-95 flex-shrink-0"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 6000, id: `delete-resume-${targetId}` }
    );

    // Schedule API deletion after 6 seconds
    const timerId = setTimeout(async () => {
      pendingDeletionsRef.current.delete(targetId);
      try {
        await resumeAPI.deleteResume(targetId);
      } catch (err) {
        console.error('Failed to delete resume on server:', err);
        setResumes((prev) => {
          if (prev.some((r) => r._id === targetId)) return prev;
          const copy = [...prev];
          const insertIdx = Math.min(Math.max(0, originalIndex), copy.length);
          copy.splice(insertIdx, 0, targetResume);
          return copy;
        });
        hotToast.error("Couldn't delete resume. Restored it.");
      }
    }, 6000);

    pendingDeletionsRef.current.set(targetId, {
      timerId,
      toastId,
      targetResume,
      originalIndex,
      questions: deletedQuestions,
    });
  };

  const handleUndoDeleteResume = (resumeId) => {
    const entry = pendingDeletionsRef.current.get(resumeId);
    if (!entry) return;

    clearTimeout(entry.timerId);
    hotToast.dismiss(entry.toastId);
    pendingDeletionsRef.current.delete(resumeId);

    setResumes((prev) => {
      if (prev.some((r) => r._id === resumeId)) return prev;
      const copy = [...prev];
      const insertIdx = Math.min(Math.max(0, entry.originalIndex), copy.length);
      copy.splice(insertIdx, 0, entry.targetResume);
      return copy;
    });

    setSelectedResumeId(resumeId);
    setResumeQuestions(entry.questions);
    if (entry.questions.length > 0) {
      onSelectQuestion(entry.questions[0]);
    }

    hotToast.success('Resume restored.');
  };

  const handleRefreshBankQuestions = async () => {
    try {
      setIsRefreshingBank(true);
      const res = await questionAPI.refreshBankQuestions();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setBankQuestions(res.data);
        onSelectQuestion(res.data[0]);
        toast.success(`Question bank refreshed with ${res.data.length} new STAR questions!`);
      } else {
        toast.error('Could not refresh question bank');
      }
    } catch (err) {
      console.error('Error refreshing question bank:', err);
      toast.error(err.message || 'Failed to refresh question bank');
    } finally {
      setIsRefreshingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-8 text-center shadow-none">
        <Loader2 className="w-5 h-5 animate-spin text-[#2F5233] dark:text-[#689D6A] mx-auto mb-2" />
        <p className="text-xs text-[#787268] dark:text-[#8E877C]">Loading questions bank...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-lg p-6 text-center shadow-none">
        <p className="text-xs text-[#C2572B] dark:text-[#E07A5F] font-medium mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-medium px-3 py-1.5 bg-[#FFFDF8] dark:bg-[#23211D] text-[#C2572B] dark:text-[#E07A5F] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md transition-colors active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeResumeCount = currentResume ? (currentResume.questionCount ?? 0) : 0;

  return (
    <div className="@container bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg shadow-none p-4 sm:p-6 flex flex-col h-full w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E4DCC9] dark:border-[#38342D] min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A] flex-shrink-0" />
            <h2 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] truncate">
              Select Question
            </h2>
          </div>
          <p className="text-xs text-[#787268] dark:text-[#8E877C] mt-0.5 truncate">
            Choose a question to practice your response
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full @sm:w-48 @md:w-56 flex-shrink-0 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={activeMainTab === 'resume' ? 'Search questions, skills...' : 'Search questions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268] dark:placeholder:text-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
          />
        </div>
      </div>

      {/* Controls Container: Row 1 = Full-width Segmented Tabs, Row 2 = Context Actions */}
      <div className="space-y-2.5 mb-3 pb-3 border-b border-[#E4DCC9] dark:border-[#38342D] min-w-0">
        {/* Row 1: Full-width Segmented Tabs with Spring Pill */}
        <div className="w-full flex p-1 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg gap-1 min-w-0 relative">
          <button
            type="button"
            onClick={() => {
              setActiveMainTab('bank');
              setIsUploadOpen(false);
            }}
            className={`relative flex-1 min-w-0 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 select-none ${
              activeMainTab === 'bank'
                ? 'text-[#FAF6EE]'
                : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
            }`}
          >
            {activeMainTab === 'bank' && (
              <motion.div
                layoutId="questionMainTabPill"
                className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 truncate">Question Bank</span>
            <span
              className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                activeMainTab === 'bank'
                  ? 'bg-white/20 text-[#FAF6EE]'
                  : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
              }`}
            >
              {bankQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMainTab('resume');
              setIsUploadOpen(false);
            }}
            className={`relative flex-1 min-w-0 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 select-none ${
              activeMainTab === 'resume'
                ? 'text-[#FAF6EE]'
                : 'text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
            }`}
          >
            {activeMainTab === 'resume' && (
              <motion.div
                layoutId="questionMainTabPill"
                className="absolute inset-0 bg-[#2F5233] dark:bg-[#3B663F] rounded-md shadow-xs"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 sm:hidden truncate">Resume</span>
            <span className="relative z-10 hidden sm:inline truncate">My Resume Questions</span>
            <span
              className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                activeMainTab === 'resume'
                  ? 'bg-white/20 text-[#FAF6EE]'
                  : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
              }`}
            >
              {activeResumeCount}
            </span>
          </button>
        </div>

        {/* Row 2: Contextual Action Buttons / Set Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0 w-full">
          {activeMainTab === 'bank' ? (
            <>
              {/* Refresh Bank Button */}
              <button
                type="button"
                disabled={isRefreshingBank}
                onClick={handleRefreshBankQuestions}
                aria-label="Refresh question bank"
                title="Refresh question bank with new STAR questions"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium text-[#2F5233] dark:text-[#689D6A] bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] hover:bg-[#EEF3EE] dark:hover:bg-[#1E2E20] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex-shrink-0"
              >
                <RotateCw className={`w-3.5 h-3.5 flex-shrink-0 ${isRefreshingBank ? 'animate-spin' : ''}`} />
                <span className="whitespace-nowrap">{isRefreshingBank ? 'Refreshing...' : 'Refresh Bank'}</span>
              </button>

              {/* Generate from Resume Button */}
              <button
                type="button"
                onClick={() => setIsUploadOpen(!isUploadOpen)}
                className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                  isUploadOpen
                    ? 'bg-[#2F5233] text-[#FAF6EE]'
                    : 'bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530] hover:bg-[#E2EDE2]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isUploadOpen ? 'Close Panel' : 'Generate from Resume'}</span>
              </button>
            </>
          ) : resumes.length > 0 ? (
            <div className="w-full space-y-2 min-w-0">
              {/* Dedicated Full-Width Set Selector Dropdown */}
              <div className="w-full min-w-0">
                <label htmlFor="resume-set-select" className="sr-only">
                  Select Resume Set
                </label>
                <div className="relative w-full min-w-0">
                  <select
                    id="resume-set-select"
                    value={selectedResumeId || ''}
                    onChange={(e) => handleResumeChange(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] cursor-pointer transition-colors truncate"
                  >
                    {resumes.map((r) => (
                      <option
                        key={r._id}
                        value={r._id}
                        className="bg-[#FFFDF8] dark:bg-[#23211D] text-[#1C1B17] dark:text-[#FAF6EE]"
                      >
                        {formatResumeOption(r)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Set Count Summary + Action Buttons */}
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-[#787268] dark:text-[#8E877C] truncate min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F5233] dark:bg-[#689D6A] flex-shrink-0" />
                  <span className="truncate">
                    {resumes.length} {resumes.length === 1 ? 'resume active' : 'resumes active'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Delete Resume Set Button */}
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteResume(currentResume)}
                    aria-label="Delete this resume and its questions"
                    title="Delete this resume and its questions"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#C2572B] dark:text-[#E07A5F] hover:bg-[#FAEEE8] dark:hover:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] transition-all active:scale-[0.98] cursor-pointer flex-shrink-0 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">Delete</span>
                  </button>

                  {/* Upload New Resume Button */}
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(!isUploadOpen)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                      isUploadOpen
                        ? 'bg-[#2F5233] text-[#FAF6EE]'
                        : 'bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530] hover:bg-[#E2EDE2]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{isUploadOpen ? 'Close Panel' : 'Upload New'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Empty state button to trigger upload */}
              <button
                type="button"
                onClick={() => setIsUploadOpen(!isUploadOpen)}
                className={`w-full min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                  isUploadOpen
                    ? 'bg-[#2F5233] text-[#FAF6EE]'
                    : 'bg-[#2F5233] hover:bg-[#244127] dark:bg-[#689D6A] dark:hover:bg-[#578559] text-[#FAF6EE]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isUploadOpen ? 'Close Panel' : 'Upload Resume'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expandable Resume Upload Drawer */}
      {isUploadOpen && (
        <div className="mb-4 min-w-0">
          <ResumeUpload
            onSuccess={handleResumeSuccess}
            onCancel={() => setIsUploadOpen(false)}
          />
        </div>
      )}

      {/* Empty State for Resume Questions if user has no resume sets */}
      {activeMainTab === 'resume' && resumes.length === 0 && !isUploadOpen && (
        <div className="py-10 px-4 text-center space-y-3 bg-[#FAF6EE]/50 dark:bg-[#181714]/50 border border-dashed border-[#E4DCC9] dark:border-[#38342D] rounded-lg my-auto">
          <div className="inline-flex p-3 rounded-full bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A]">
            <FileText className="w-6 h-6" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h3 className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              No resume question sets yet
            </h3>
            <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
              Upload your resume to get custom STAR interview questions tailored to your experience, projects, and skills.
            </p>
          </div>
          <ShimmerButton
            onClick={() => setIsUploadOpen(true)}
            shimmerColor="#86EFAC"
            background="#2F5233"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md shadow-xs mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upload Resume</span>
          </ShimmerButton>
        </div>
      )}

      {/* Secondary Filter Pills */}
      {activeMainTab === 'bank' ? (
        <div className="flex flex-wrap items-center gap-2 mb-3 w-full min-w-0">
          {bankCategories.map((cat) => {
            const count =
              cat === 'All'
                ? bankQuestions.length
                : bankQuestions.filter((q) => q.category === cat).length;
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-[#2F5233] text-[#FAF6EE]'
                    : 'bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border border-[#E4DCC9] dark:border-[#38342D] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full inline-block flex-shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-[#FAF6EE]'
                      : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : resumes.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-3 w-full min-w-0">
          {resumeDifficulties.map((diff) => {
            const count =
              diff === 'All'
                ? resumeQuestions.length
                : resumeQuestions.filter(
                    (q) =>
                      (q.difficulty || 'Intermediate').toLowerCase() ===
                      diff.toLowerCase()
                  ).length;
            const isActive = selectedDifficulty === diff;

            return (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-[#2F5233] text-[#FAF6EE]'
                    : 'bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border border-[#E4DCC9] dark:border-[#38342D] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                }`}
              >
                <span>{diff}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full inline-block flex-shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-[#FAF6EE]'
                      : 'bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Question List with Fast Crossfade on Set Switch and Collapsible Sections */}
      {(activeMainTab === 'bank' || resumes.length > 0) && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainTab === 'resume' ? selectedResumeId : 'bank'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-h-0"
          >
            {filteredQuestions.length === 0 ? (
              <div className="py-8 text-center text-[#787268] dark:text-[#8E877C] text-xs">
                {activeMainTab === 'resume'
                  ? 'No resume questions found matching your filter.'
                  : 'No questions matched your search criteria.'}
              </div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 flex-1 min-w-0">
                {Object.entries(groupedQuestions).map(([groupTitle, items]) => {
                  const isCollapsed = Boolean(collapsedSections[groupTitle]);

                  return (
                    <div key={groupTitle} className="space-y-2 min-w-0">
                      {/* Section Header */}
                      {activeMainTab === 'resume' ? (
                        <button
                          type="button"
                          onClick={() => toggleSectionCollapse(groupTitle)}
                          className="w-full flex items-center justify-between py-1.5 px-1 text-left text-xs font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] hover:opacity-80 transition-opacity cursor-pointer border-b border-[#E4DCC9]/60 dark:border-[#38342D]/60"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="uppercase tracking-wider text-[11px] text-[#787268] dark:text-[#8E877C]">
                              {groupTitle} Questions
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E4DCC9] dark:bg-[#38342D] text-[#4A463F] dark:text-[#FAF6EE]">
                              {items.length}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] transition-transform duration-200 flex-shrink-0 ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </button>
                      ) : (
                        <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] pt-1">
                          {groupTitle} ({items.length})
                        </div>
                      )}

                      {/* Question Items (collapsible for resume tab) */}
                      {(!isCollapsed || activeMainTab === 'bank') && (
                        <div className="grid grid-cols-1 gap-2">
                          {items.map((q) => {
                            const isSelected = selectedQuestion?._id === q._id;

                            return (
                              <button
                                key={q._id}
                                type="button"
                                onClick={() => onSelectQuestion(q)}
                                className={`w-full text-left p-3.5 rounded-md border transition-all flex items-start justify-between gap-3 cursor-pointer active:scale-[0.99] ${
                                  isSelected
                                    ? 'border-[#2F5233] dark:border-[#689D6A] bg-[#EEF3EE]/60 dark:bg-[#1E2E20]/60'
                                    : 'border-[#E4DCC9] dark:border-[#38342D] hover:border-[#2F5233]/40 dark:hover:border-[#689D6A]/40 bg-[#FFFDF8] dark:bg-[#23211D] hover:bg-[#FAF6EE] dark:hover:bg-[#1A1815]'
                                }`}
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  {/* Chip & Anchor Tags */}
                                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    {activeMainTab === 'resume' ? (
                                      <>
                                        {q.type && (
                                          <span className="text-[10px] font-semibold text-[#2F5233] dark:text-[#689D6A] bg-[#EEF3EE] dark:bg-[#1E2E20] px-1.5 py-0.5 rounded border border-[#D9E5DA] dark:border-[#2D4530]">
                                            {q.type}
                                          </span>
                                        )}
                                        {getDifficultyBadge(q.difficulty)}
                                        {q.anchor && (
                                          <span
                                            className="text-[11px] font-medium text-[#787268] dark:text-[#8E877C] truncate max-w-[200px]"
                                            title={q.anchor}
                                          >
                                            · {q.anchor}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[11px] font-medium text-[#2F5233] dark:text-[#689D6A] bg-[#FAF6EE] dark:bg-[#181714] px-2 py-0.5 rounded border border-[#E4DCC9] dark:border-[#38342D]">
                                          {q.category || 'General'}
                                        </span>
                                        {getDifficultyBadge(q.difficulty)}
                                      </>
                                    )}
                                  </div>

                                  <p
                                    className={`text-sm leading-snug line-clamp-2 ${
                                      isSelected
                                        ? 'font-medium text-[#1C1B17] dark:text-[#FAF6EE]'
                                        : 'text-[#4A463F] dark:text-[#B5AFA2]'
                                    }`}
                                  >
                                    {q.text}
                                  </p>
                                </div>

                                <div className="flex-shrink-0 pt-0.5">
                                  {isSelected ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-[#E4DCC9] dark:border-[#38342D]" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Confirmation Dialog for Deleting Resume Set */}
      <ConfirmDialog
        open={Boolean(resumeToDelete)}
        title="Delete this resume and its questions?"
        description={
          resumeToDelete
            ? resumeToDelete.isLegacy
              ? 'Earlier questions'
              : resumeToDelete.label || resumeToDelete.fileName
            : ''
        }
        note="Your past practice history will be kept."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onCancel={() => setResumeToDelete(null)}
        onConfirm={handleConfirmDeleteResume}
      />
    </div>
  );
};

export default QuestionPicker;
