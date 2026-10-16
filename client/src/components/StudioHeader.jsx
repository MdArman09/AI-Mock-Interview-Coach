import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Target,
  Flame,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import RadialScoreGauge from './ui/RadialScoreGauge';
import { sessionAPI } from '../services/api';

export const StudioHeader = ({ user, onNavigateToHistory, onNavigateToProfile, onOpenContact }) => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    streak: 1,
    recentScore: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchQuickStats = async () => {
      try {
        const res = await sessionAPI.getHistory();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const sessions = res.data;
          const count = sessions.length;
          const avg =
            count > 0
              ? Math.round(
                  sessions.reduce((acc, s) => acc + (s.scores?.overall || 0), 0) / count
                )
              : 0;
          const latest = count > 0 ? sessions[0]?.scores?.overall || 0 : null;
          setStats({
            totalSessions: count,
            avgScore: avg,
            streak: count > 0 ? Math.min(count, 5) : 1,
            recentScore: latest,
          });
        }
      } catch (err) {
        console.warn('Could not fetch quick stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuickStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours(); // 0 to 23

    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    }
    if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    }
    if (hour >= 17 && hour < 21) {
      return 'Good evening';
    }
    // hour >= 21 || hour < 5 (Night)
    return 'Good night';
  };

  const greeting = getGreeting();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Candidate';
  const targetJob = user?.profile?.targetJob || 'Software Engineer';
  const coachPersona = user?.profile?.coachPreference || 'Balanced STAR';
  const experienceLevel = user?.profile?.experienceLevel || 'Mid Level';

  const readinessScore = stats.avgScore > 0 ? stats.avgScore : 0;
  const isFirstTime = stats.totalSessions === 0;

  return (
    <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] p-4 sm:p-6 lg:p-7 shadow-sm w-full relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,_#2F5233_0%,_transparent_70%)] opacity-5 dark:opacity-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Candidate Welcome & Goal Info */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-xs font-semibold text-[#2F5233] dark:text-[#689D6A]">
              <span className="w-2 h-2 rounded-full bg-[#2F5233] dark:bg-[#689D6A] animate-pulse" />
              <span>Interview Cockpit Active</span>
            </span>

            {/* Target Job Badge */}
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-xs text-[#4A463F] dark:text-[#A8A297] hover:border-[#2F5233]/40 transition-colors cursor-pointer"
              title="Click to edit target job in profile"
            >
              <Target className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
              <span className="font-medium text-[#1C1B17] dark:text-[#FAF6EE]">{targetJob}</span>
              <span className="text-[10px] text-[#787268] dark:text-[#A8A297]">({experienceLevel})</span>
            </button>

            {/* Coach Persona Badge */}
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] text-xs text-[#4A463F] dark:text-[#A8A297] hover:border-[#2F5233]/40 transition-colors cursor-pointer"
              title="Click to change coach persona in profile"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
              <span>{coachPersona}</span>
            </button>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1C1B17] dark:text-[#FAF6EE]">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#787268] dark:text-[#A8A297] leading-relaxed">
              {isFirstTime
                ? 'Select any question below, click "Start Answering", and speak naturally into your microphone for real-time STAR feedback.'
                : `You have completed ${stats.totalSessions} practice session${stats.totalSessions === 1 ? '' : 's'} with an average STAR score of ${stats.avgScore}/100. Keep your momentum going!`}
            </p>
          </div>

          {/* Quick micro badges */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-[#787268] dark:text-[#A8A297]">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#C2572B] dark:text-[#E07A5F]" />
              <span className="font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">
                {stats.streak}-Day Consistency
              </span>
            </span>
            <span className="text-[#E4DCC9] dark:text-[#38342D] hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
              <span>Target: 120–150 WPM Pacing</span>
            </span>
            <span className="text-[#E4DCC9] dark:text-[#38342D] hidden sm:inline">•</span>
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="text-[#2F5233] dark:text-[#689D6A] font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Past Sessions ({stats.totalSessions})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            {onOpenContact && (
              <>
                <span className="text-[#E4DCC9] dark:text-[#38342D] hidden sm:inline">•</span>
                <button
                  type="button"
                  onClick={() => onOpenContact('general')}
                  className="hidden sm:inline-flex items-center gap-1 text-[#787268] dark:text-[#A8A297] hover:text-[#2F5233] dark:hover:text-[#689D6A] font-medium cursor-pointer transition-colors"
                  title="Have feedback or need assistance?"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Support & Feedback</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Readiness Score Gauge Widget */}
        <div className="flex items-center gap-3.5 sm:gap-5 p-3.5 sm:p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex-shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
          <RadialScoreGauge
            score={readinessScore}
            empty={isFirstTime}
            size={76}
            strokeWidth={6}
          />
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787268] dark:text-[#A8A297] block">
              Candidate Readiness
            </span>
            <div className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              {isFirstTime
                ? 'Ready to Begin'
                : readinessScore >= 85
                ? 'Executive Tier'
                : readinessScore >= 70
                ? 'Interview Ready'
                : 'Needs Practice'}
            </div>
            <p className="text-[11px] text-[#787268] dark:text-[#A8A297]">
              {isFirstTime ? 'Complete 1st session to get scored' : `Based on ${stats.totalSessions} session${stats.totalSessions === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioHeader;
