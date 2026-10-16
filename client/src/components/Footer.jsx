import React from 'react';
import {
  Mic,
  Sparkles,
  ShieldCheck,
  Mail,
  Bug,
  Lightbulb,
  ArrowUp,
  Volume2,
} from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';

export const Footer = ({
  onOpenContact,
  onNavigateTab,
  onScrollToSection,
  variant = 'landing',
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStudio = variant === 'studio';

  return (
    <footer className="border-t border-[#E4DCC9] dark:border-[#38342D] bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] pt-14 pb-8 px-4 sm:px-6 lg:px-8 transition-colors mt-auto w-full">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Highlight Banner: Interactive Contact & Support Prompt */}
        <div className="rounded-xl border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2F5233] dark:bg-[#689D6A]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2F5233] dark:text-[#689D6A]">
                Candidate Support & Continuous Feedback
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
              Spot an audio glitch or have an interview question to suggest?
            </h3>
            <p className="text-xs sm:text-sm text-[#4A463F] dark:text-[#A8A297] leading-relaxed">
              We actively calibrate our speech telemetry and STAR rubrics based on real candidate experience. Your input directly influences future practice prompts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenContact?.('audio_mic')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#2D2A24] text-[#1C1B17] dark:text-[#FAF6EE] rounded-md border border-[#E4DCC9] dark:border-[#38342D] transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
              <span>Report Audio Issue</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenContact?.('general')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#2F5233] hover:bg-[#244027] dark:bg-[#3B663F] dark:hover:bg-[#2F5233] text-[#FAF6EE] rounded-md transition-colors cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Get in Touch</span>
            </button>
          </div>
        </div>

        {/* 4-Column Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pt-2">
          {/* Brand & Editorial Column (spans 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={scrollToTop}
              className="flex items-center gap-3 cursor-pointer group inline-flex"
            >
              <BrandLogo size={36} className="w-8 h-8 sm:w-9 sm:h-9" />
              <span className="font-serif font-bold text-base sm:text-lg text-[#1C1B17] dark:text-[#FAF6EE] group-hover:text-[#2F5233] dark:group-hover:text-[#689D6A] transition-colors">
                AI Mock Interview Coach
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#4A463F] dark:text-[#A8A297] leading-relaxed max-w-sm">
              Methodical STAR interview preparation engineered with client-side speech telemetry, words-per-minute pacing metrics, and actionable rubric feedback.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-[#787268] dark:text-[#A8A297]">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D]">
                <Volume2 className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                <span>Web Speech API v2</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D]">
                <Sparkles className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                <span>Llama 3.3 70B</span>
              </div>
            </div>
          </div>

          {/* Column 1: Practice & Studio */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
              Practice Studio
            </h4>
            <ul className="space-y-2 text-xs text-[#4A463F] dark:text-[#A8A297]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('practice') : onScrollToSection?.('demo')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Voice Practice Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('practice') : onScrollToSection?.('features')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Curated Question Bank
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('practice') : onScrollToSection?.('features')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Resume Question Matcher
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('history') : onScrollToSection?.('how-it-works')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Past Attempts & Scoring
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: STAR Framework & Guides */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
              Frameworks & Guides
            </h4>
            <ul className="space-y-2 text-xs text-[#4A463F] dark:text-[#A8A297]">
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection ? onScrollToSection('how-it-works') : onOpenContact?.('general')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  The STAR Rubric (S-T-A-R)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection ? onScrollToSection('compare') : onOpenContact?.('general')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Pacing Guide (120–150 WPM)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection ? onScrollToSection('features') : onOpenContact?.('general')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Filler Word Audit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection ? onScrollToSection('faq') : onOpenContact?.('general')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left"
                >
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B17] dark:text-[#FAF6EE]">
              Support & Trust
            </h4>
            <ul className="space-y-2 text-xs text-[#4A463F] dark:text-[#A8A297]">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenContact?.('general')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left flex items-center gap-1.5 text-[#2F5233] dark:text-[#689D6A] font-semibold"
                >
                  <Mail className="w-3 h-3" />
                  <span>Contact Team</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenContact?.('audio_mic')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Bug className="w-3 h-3 text-[#C2572B]" />
                  <span>Report Audio / Mic Bug</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenContact?.('feature_request')}
                  className="hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] hover:underline transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3 h-3 text-[#2F5233] dark:text-[#689D6A]" />
                  <span>Suggest a Question</span>
                </button>
              </li>
              <li className="pt-1">
                <div className="flex items-center gap-1 text-[11px] text-[#787268] dark:text-[#A8A297]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A] flex-shrink-0" />
                  <span>Audio stays 100% in browser</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, System Health & Back to Top */}
        <div className="border-t border-[#E4DCC9] dark:border-[#38342D] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#787268] dark:text-[#A8A297]">
          <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
            <span>© 2026 AI Mock Interview Coach.</span>
            <span className="hidden sm:inline">•</span>
            <span>Methodical STAR Preparation.</span>
            <span className="hidden sm:inline">•</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF3EE] dark:bg-[#181714] border border-[#D9E5DA] dark:border-[#38483B] text-[11px] font-medium text-[#2F5233] dark:text-[#689D6A]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F5233] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F5233] dark:bg-[#689D6A]"></span>
              </span>
              <span>All Systems Operational</span>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-[#4A463F] dark:text-[#A8A297] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors cursor-pointer"
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
