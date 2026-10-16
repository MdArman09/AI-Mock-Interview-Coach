import React, { useState, useEffect, useRef } from 'react';
import { resumeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  Briefcase,
  Code2,
  FolderGit2,
  Lightbulb,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import ShimmerButton from './ui/ShimmerButton';

const STAGED_MESSAGES = [
  'Reading your resume…',
  'Planning your questions…',
  'Writing questions…',
];

export const ResumeUpload = ({ onSuccess, onCancel }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'analyzing' | 'snapshot' | 'generating'
  const [snapshotData, setSnapshotData] = useState(null);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [error, setError] = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [failedSections, setFailedSections] = useState([]);
  const [partialSuccessData, setPartialSuccessData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Countdown timer for rate-limit cooldown
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  // Cycle staged loading messages during generation
  useEffect(() => {
    if (step !== 'generating') return;
    setLoadingStageIndex(0);
    const interval = setInterval(() => {
      setLoadingStageIndex((prev) => (prev + 1) % STAGED_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [step]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    setError('');
    if (!selected) return;

    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some((ext) =>
      selected.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError('Please upload a valid PDF (.pdf) or Word document (.docx).');
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller file.');
      setFile(null);
      return;
    }

    setFile(selected);
    if (!label.trim()) {
      setLabel(selected.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    validateAndSetFile(dropped);
  };

  // Stage 1: Upload and extract analysis snapshot
  const handleUploadAndAnalyze = async () => {
    if (!isAuthenticated) {
      setError('Please log in or create an account to upload your resume.');
      toast.error('Authentication required to generate resume questions');
      return;
    }

    if (!file) {
      setError('Please select a resume file first.');
      return;
    }

    try {
      setStep('analyzing');
      setError('');
      setFailedSections([]);
      setPartialSuccessData(null);

      const formData = new FormData();
      formData.append('resume', file);
      if (label.trim()) {
        formData.append('label', label.trim());
      }

      const uploadRes = await resumeAPI.uploadResume(formData);
      if (!uploadRes.success || !uploadRes.data?.resumeId) {
        throw new Error(uploadRes.message || 'Failed to extract text from resume');
      }

      setSnapshotData(uploadRes.data);
      setStep('snapshot');
    } catch (err) {
      console.error('Resume analysis error:', err);
      const errMsg =
        err.message ||
        'Failed to process resume. Please ensure it is a text-based PDF or DOCX.';
      setError(errMsg);
      toast.error(errMsg);
      setStep('upload');
    }
  };

  // Stage 2: Generate questions from the analyzed resume (with double-submit protection)
  const handleGenerateQuestions = async (sectionIdsToRetry = null) => {
    if (isGenerating || step === 'generating' || retryCountdown > 0) return;
    if (!snapshotData?.resumeId) return;

    try {
      setIsGenerating(true);
      setStep('generating');
      setError('');

      const isRetryingSections = Array.isArray(sectionIdsToRetry) && sectionIdsToRetry.length > 0;
      const genRes = await resumeAPI.generateQuestions(
        snapshotData.resumeId,
        isRetryingSections ? sectionIdsToRetry : undefined
      );

      if (!genRes.success || !Array.isArray(genRes.data)) {
        throw new Error(genRes.message || 'Failed to generate interview questions');
      }

      const questionCount = genRes.count || genRes.data.length || 0;
      const resumeLabel = genRes.resume?.label || snapshotData.label || file?.name || 'Resume';
      const returnedFailed = Array.isArray(genRes.failedSections) ? genRes.failedSections : [];

      if (returnedFailed.length > 0) {
        // Partial success: keep user on snapshot with retry banner
        setFailedSections(returnedFailed);
        setPartialSuccessData({
          questions: genRes.data,
          resume: genRes.resume,
          resumeId: snapshotData.resumeId,
          label: resumeLabel,
          count: questionCount,
        });
        setStep('snapshot');
        toast.success(`Generated ${questionCount} questions. ${returnedFailed.length} section(s) can be retried.`);
      } else {
        // Full success
        setFailedSections([]);
        setPartialSuccessData(null);
        toast.success(`Generated ${questionCount} questions from ${resumeLabel}`);

        if (onSuccess) {
          onSuccess({
            questions: genRes.data,
            resume: genRes.resume || {
              _id: snapshotData.resumeId,
              label: resumeLabel,
              fileName: snapshotData.fileName,
              questionCount,
              level: snapshotData.level,
              plannedQuestionCount: snapshotData.plannedQuestionCount,
              createdAt: new Date(),
            },
            resumeId: snapshotData.resumeId,
            label: resumeLabel,
            count: questionCount,
          });
        }
      }
    } catch (err) {
      console.error('Question generation error:', err);
      setStep('snapshot');

      // Map error codes to friendly human messages
      if (err.code === 'AI_RATE_LIMITED' || err.status === 429) {
        const seconds = err.retryAfterSeconds || 10;
        setRetryCountdown(seconds);
        setError(`The AI service is busy right now. You can try again in about ${seconds} seconds.`);
      } else if (err.code === 'AI_TIMEOUT' || err.status === 504) {
        setError('The AI request timed out. Please try again.');
      } else if (err.code === 'AI_BAD_RESPONSE' || err.status === 502) {
        setError('The AI service returned an unusable response. Please try again.');
      } else {
        const rawMsg = err.message || '';
        if (rawMsg.toLowerCase().includes('status code')) {
          setError('The AI service is temporarily unavailable. Please try again in a few moments.');
        } else {
          setError(rawMsg || 'Unable to generate questions at this time. Please try again.');
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatLevel = (lvl) => {
    switch ((lvl || '').toLowerCase()) {
      case 'senior':
        return 'Senior';
      case 'mid':
        return 'Mid-level';
      case 'junior':
        return 'Junior';
      default:
        return 'Fresher';
    }
  };

  /**
   * Formats role title for display: only the first segment before any |, •, –, —, or /,
   * trimmed and capped at 60 characters. Original full string remains stored in analysis.roleTitle.
   */
  const formatDisplayRoleTitle = (rawTitle) => {
    if (!rawTitle || typeof rawTitle !== 'string') return '';
    const firstSegment = rawTitle.split(/[|•–—/]/)[0] || '';
    const trimmed = firstSegment.trim();
    return trimmed.length > 60 ? trimmed.slice(0, 60) : trimmed;
  };

  const pluralize = (count, singular, plural = `${singular}s`) => {
    const num = Number(count) || 0;
    return `${num} ${num === 1 ? singular : plural}`;
  };

  const formatGentleTip = (spot) => {
    if (!spot) return null;
    const lower = spot.toLowerCase();
    if (lower.includes('quantified') || lower.includes('metric')) {
      return 'Tip: adding quantified results will give you stronger practice material.';
    }
    if (lower.includes('project')) {
      return 'Tip: highlighting project deliverables will give you richer technical scenarios.';
    }
    if (lower.includes('skill') || lower.includes('context')) {
      return 'Tip: connecting key skills to real project milestones helps target specific questions.';
    }
    return `Tip: addressing ${spot} will give you stronger practice material.`;
  };

  const analysis = snapshotData?.analysis || {};
  const weakSpots = analysis.weakSpots || [];
  const gentleTip = weakSpots.length > 0 ? formatGentleTip(weakSpots[0]) : null;

  return (
    <div className="bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] rounded-lg p-5 sm:p-6 shadow-sm min-w-0">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E4DCC9] dark:border-[#38342D] mb-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] truncate">
              {step === 'snapshot' ? 'Resume Analysis Snapshot' : 'Generate Questions from Resume'}
            </h3>
            <p className="text-xs text-[#787268] dark:text-[#8E877C] truncate">
              {step === 'snapshot'
                ? 'Review verified resume insights before generating custom questions'
                : 'Upload your CV to extract tailored STAR interview questions'}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={step === 'analyzing' || step === 'generating'}
            className="p-1 text-[#787268] hover:text-[#1C1B17] dark:text-[#8E877C] dark:hover:text-[#FAF6EE] rounded-md transition-colors flex-shrink-0 disabled:opacity-40"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading State with Staged Loading Text */}
      {step === 'analyzing' || step === 'generating' ? (
        <div className="py-8 px-4 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-medium text-[#1C1B17] dark:text-[#FAF6EE] transition-all">
              {step === 'analyzing'
                ? 'Reading & Analyzing Resume Structure…'
                : STAGED_MESSAGES[loadingStageIndex]}
            </h4>
            <p className="text-xs text-[#787268] dark:text-[#8E877C] max-w-sm mx-auto">
              {step === 'analyzing'
                ? 'Extracting roles, projects, technologies, and metrics from your document.'
                : 'Synthesizing tailored STAR questions grounded in your real background.'}
            </p>
          </div>

          <div className="w-full max-w-xs mx-auto bg-[#FAF6EE] dark:bg-[#181714] rounded-full h-1.5 overflow-hidden border border-[#E4DCC9] dark:border-[#38342D]">
            <div
              className={`h-full bg-[#2F5233] dark:bg-[#689D6A] transition-all duration-700 ${
                step === 'analyzing' ? 'w-2/5 animate-pulse' : 'w-4/5 animate-pulse'
              }`}
            />
          </div>
        </div>
      ) : step === 'snapshot' && snapshotData ? (
        /* Stage 1: Analysis Snapshot Card */
        <div className="space-y-4 min-w-0 w-full overflow-hidden">
          <div className="p-3 sm:p-4 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] space-y-3 min-w-0 w-full overflow-hidden">
            {/* Header Banner: Level Badge & Estimate on their own line, Title full width below */}
            <div className="pb-2.5 border-b border-[#E4DCC9] dark:border-[#38342D] space-y-1.5 min-w-0 w-full">
              <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] border border-[#D9E5DA] dark:border-[#2D4530] flex-shrink-0">
                  {formatLevel(snapshotData.level)}
                </span>
                <span className="text-xs font-semibold text-[#2F5233] dark:text-[#689D6A] flex-shrink-0">
                  ~{snapshotData.plannedQuestionCount} questions planned
                </span>
              </div>
              {analysis.roleTitle && (
                <h4
                  title={analysis.roleTitle}
                  className="text-xs font-semibold text-[#1C1B17] dark:text-[#FAF6EE] min-w-0 w-full break-words line-clamp-2"
                >
                  {formatDisplayRoleTitle(analysis.roleTitle)}
                </h4>
              )}
            </div>

            {/* Metrics Breakdown: Responsive grid with correct pluralization */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 min-w-0 w-full">
              <div className="p-2 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-center min-w-0 overflow-hidden">
                <p className="text-[11px] text-[#787268] dark:text-[#8E877C] truncate">Experience</p>
                <p className="text-xs font-bold text-[#1C1B17] dark:text-[#FAF6EE] break-words">
                  {pluralize(analysis.experienceCount ?? (analysis.experience?.length || 0), 'role')}
                </p>
              </div>
              <div className="p-2 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-center min-w-0 overflow-hidden">
                <p className="text-[11px] text-[#787268] dark:text-[#8E877C] truncate">Projects</p>
                <p className="text-xs font-bold text-[#1C1B17] dark:text-[#FAF6EE] break-words">
                  {pluralize(analysis.projectsCount ?? (analysis.projects?.length || 0), 'project')}
                </p>
              </div>
              <div className="p-2 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-center min-w-0 overflow-hidden">
                <p className="text-[11px] text-[#787268] dark:text-[#8E877C] truncate">Evidenced Skills</p>
                <p className="text-xs font-bold text-[#1C1B17] dark:text-[#FAF6EE] break-words">
                  {pluralize(analysis.evidencedSkillsCount ?? (analysis.skills?.evidenced?.length || 0), 'skill')}
                </p>
              </div>
              <div className="p-2 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-center min-w-0 overflow-hidden">
                <p className="text-[11px] text-[#787268] dark:text-[#8E877C] truncate">Total Years</p>
                <p className="text-xs font-bold text-[#1C1B17] dark:text-[#FAF6EE] break-words">
                  {analysis.totalYearsExperience ?? 0} {Number(analysis.totalYearsExperience) === 1 ? 'yr' : 'yrs'}
                </p>
              </div>
            </div>

            {/* Gentle Tip if Weak Spot detected */}
            {gentleTip && (
              <div className="flex items-start gap-2 p-2.5 rounded bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] text-xs text-[#787268] dark:text-[#8E877C] min-w-0 break-words">
                <Lightbulb className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A] flex-shrink-0 mt-0.5" />
                <p className="leading-snug break-words min-w-0 flex-1">{gentleTip}</p>
              </div>
            )}
          </div>

          {/* Partial Success Notice with Retry missing sections */}
          {failedSections.length > 0 && partialSuccessData && (
            <div className="p-3 rounded-md bg-[#FAF4E8] dark:bg-[#2A2418] border border-[#E8D9B8] dark:border-[#4A3E25] text-xs text-[#8A6218] dark:text-[#E2B755] space-y-2.5 min-w-0 break-words">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#8A6218] dark:text-[#E2B755]" />
                <p className="font-medium min-w-0 break-words flex-1 leading-snug">
                  Generated {partialSuccessData.count} questions. {failedSections.length}{' '}
                  {failedSections.length === 1 ? 'section' : 'sections'} couldn’t be generated.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5 min-w-0">
                <button
                  type="button"
                  disabled={isGenerating || retryCountdown > 0}
                  onClick={() => handleGenerateQuestions(failedSections.map((s) => s.id))}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#8A6218] hover:bg-[#735113] text-[#FAF6EE] text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Retry missing sections'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onSuccess && onSuccess(partialSuccessData)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-[#8A6218] text-[#8A6218] dark:text-[#E2B755] text-xs font-medium hover:bg-[#8A6218]/10 transition-colors cursor-pointer"
                >
                  <span>Continue with {partialSuccessData.count} questions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Error Message if generation failed */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] text-xs text-[#C2572B] dark:text-[#E07A5F] min-w-0 break-words">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 break-words">
                <p className="font-medium break-words">{error}</p>
              </div>
            </div>
          )}

          {/* Snapshot Action Buttons: Stacks cleanly at narrow widths */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 min-w-0 w-full">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => {
                setStep('upload');
                setSnapshotData(null);
                setFailedSections([]);
                setPartialSuccessData(null);
                setError('');
                setRetryCountdown(0);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#787268] hover:text-[#1C1B17] dark:text-[#8E877C] dark:hover:text-[#FAF6EE] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Resume</span>
            </button>

            <ShimmerButton
              disabled={isGenerating || retryCountdown > 0}
              onClick={() => handleGenerateQuestions()}
              shimmerColor="#86EFAC"
              background="#2F5233"
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-md shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating…</span>
                </>
              ) : retryCountdown > 0 ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Retry in {retryCountdown}s</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate {snapshotData.plannedQuestionCount} Questions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </ShimmerButton>
          </div>
        </div>
      ) : (
        /* Upload & File Selection Step */
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#2F5233] dark:border-[#689D6A] bg-[#EEF3EE]/40 dark:bg-[#1E2E20]/40'
                : 'border-[#E4DCC9] dark:border-[#38342D] hover:border-[#2F5233]/60 dark:hover:border-[#689D6A]/60 bg-[#FAF6EE]/50 dark:bg-[#181714]/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-md bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A]">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1C1B17] dark:text-[#FAF6EE] truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-[#787268] dark:text-[#8E877C]">
                    {(file.size / 1024).toFixed(1)} KB • Click or drop to replace
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex p-2.5 rounded-full bg-[#FAF6EE] dark:bg-[#181714] text-[#787268] dark:text-[#8E877C] border border-[#E4DCC9] dark:border-[#38342D]">
                  <UploadCloud className="w-5 h-5 text-[#2F5233] dark:text-[#689D6A]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE]">
                    Drag & drop your resume, or{' '}
                    <span className="text-[#2F5233] dark:text-[#689D6A] underline">browse</span>
                  </p>
                  <p className="text-[11px] text-[#787268] dark:text-[#8E877C] mt-0.5">
                    Supports text-based PDF or DOCX (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Optional Resume Label */}
          {file && (
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#787268] dark:text-[#8E877C]">
                Resume Label (optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                className="w-full px-3 py-1.5 bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md text-xs text-[#1C1B17] dark:text-[#FAF6EE] placeholder:text-[#787268]/60 focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] text-xs text-[#C2572B] dark:text-[#E07A5F]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 text-xs font-medium text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] rounded-md transition-colors"
              >
                Cancel
              </button>
            )}

            <ShimmerButton
              disabled={!file}
              onClick={handleUploadAndAnalyze}
              shimmerColor="#86EFAC"
              background="#2F5233"
              className="px-5 py-2 text-xs font-semibold rounded-md shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upload & Analyze</span>
            </ShimmerButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
