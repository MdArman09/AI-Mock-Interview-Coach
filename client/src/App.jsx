import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { QuestionPicker } from './components/QuestionPicker';
import { Recorder } from './components/Recorder';
import { ResultsCard } from './components/ResultsCard';
import { ResultsCardSkeleton } from './components/ResultsCardSkeleton';
import { HistoryTab } from './components/HistoryTab';
import { EditProfile } from './components/EditProfile';
import { StudioHeader } from './components/StudioHeader';
import { ContactModal } from './components/ContactModal';
import { MobileBottomNav } from './components/ui/MobileBottomNav';
import { Loader2, Zap, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

function App() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('practice');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authMode, setAuthMode] = useState(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode === 'login' || mode === 'signup' ? mode : null;
  }); // null = LandingPage, 'login' | 'signup' = AuthScreen
  const [showLanding, setShowLanding] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState('general');
  const prevAuthRef = useRef(isAuthenticated);

  const handleOpenContact = (cat = 'general') => {
    setContactCategory(cat);
    setContactModalOpen(true);
  };

  // Synchronize URL mode param if updated via route transitions
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login' || mode === 'signup') {
      setAuthMode(mode);
    }
  }, [searchParams]);

  // Reset scroll to top instantly on tab switch so user doesn't land mid-page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Reset authMode on authentication transitions and display sign-out toast
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setAuthMode(null);
      setShowLanding(false);
      toast.success('Signed out');
    } else if (!prevAuthRef.current && isAuthenticated) {
      setAuthMode(null);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, toast]);

  const handleSignOut = async () => {
    if (window.__isRecordingActive) {
      toast.error('🎙️ Active recording in progress! Please stop or finish your answer before signing out.');
      return;
    }
    // 1. Halt active speech recognition and recording tracks
    window.dispatchEvent(new CustomEvent('app:stop-recording'));

    // 2. Immediately flush any pending undo deletions before clearing auth
    const flushes = [];
    if (typeof window.__flushHistoryDeletions === 'function') {
      flushes.push(window.__flushHistoryDeletions());
    }
    if (typeof window.__flushResumeDeletions === 'function') {
      flushes.push(window.__flushResumeDeletions());
    }
    window.dispatchEvent(new CustomEvent('app:flush-pending-deletions'));

    if (flushes.length > 0) {
      try {
        await Promise.allSettled(flushes);
      } catch (err) {
        console.warn('Error flushing pending deletions:', err);
      }
    }

    // 3. Clear all local studio state
    setSelectedQuestion(null);
    setCurrentResult(null);
    setIsAnalyzing(false);
    setActiveTab('practice');
    setAuthMode(null);
    setShowLanding(false);

    // 4. Clear auth token and user object
    logout();
  };

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setCurrentResult(null);
  };

  const handleAnalysisComplete = (sessionData) => {
    setIsAnalyzing(false);
    setCurrentResult(sessionData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetrySameQuestion = () => {
    setCurrentResult(null);
    setIsAnalyzing(false);
  };

  const handlePracticeAnotherQuestion = () => {
    setCurrentResult(null);
    setIsAnalyzing(false);
  };

  const handleOpenHome = () => {
    if (window.__isRecordingActive) {
      toast.error('🎙️ Active recording in progress! Please stop or finish your response before leaving the studio.');
      return;
    }
    setShowLanding(true);
  };

  const handleTabChange = (newTab) => {
    if (window.__isRecordingActive && newTab !== activeTab) {
      toast.error('🎙️ Active recording in progress! Please stop or finish your response before switching tabs.');
      return;
    }
    setActiveTab(newTab);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#181714] flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F5233] dark:text-[#689D6A] mb-3" />
          <p className="text-sm font-serif text-[#4A463F] dark:text-[#B5AFA2]">
            Opening AI Mock Interview Coach...
          </p>
        </div>
      );
    }

    if (!isAuthenticated) {
      if (authMode) {
        return (
          <AuthScreen
            initialMode={authMode}
            onBack={() => setAuthMode(null)}
          />
        );
      }
      return (
        <LandingPage
          onLogin={() => setAuthMode('login')}
          onSignUp={() => setAuthMode('signup')}
        />
      );
    }

    if (showLanding) {
      return (
        <LandingPage
          onGoToStudio={() => setShowLanding(false)}
        />
      );
    }

    return (
      <div
        key={user?._id || 'studio'}
        className="min-h-screen bg-[#FAF6EE] dark:bg-[#181714] text-[#1C1B17] dark:text-[#FAF6EE] flex flex-col selection:bg-[#2F5233] selection:text-[#FAF6EE] w-full overflow-x-clip"
      >
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenHome={handleOpenHome}
          onSignOut={handleSignOut}
          onOpenContact={handleOpenContact}
        />

        <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="min-h-[70dvh] w-full"
            >
              {activeTab === 'practice' && (
                <div className="space-y-8">
                  {/* Candidate Readiness Cockpit Header */}
                  {!currentResult && !isAnalyzing && (
                    <StudioHeader
                      user={user}
                      onNavigateToHistory={() => setActiveTab('history')}
                      onNavigateToProfile={() => setActiveTab('profile')}
                      onOpenContact={handleOpenContact}
                    />
                  )}

                  {currentResult ? (
                    <div className="max-w-4xl mx-auto min-w-0">
                      <ResultsCard
                        key={currentResult._id || currentResult.createdAt || 'result-' + (currentResult.audioDuration || 0)}
                        session={currentResult}
                        onRetry={handleRetrySameQuestion}
                        onNextQuestion={handlePracticeAnotherQuestion}
                      />
                    </div>
                  ) : (
                    <>
                      {isAnalyzing && (
                        <div className="max-w-4xl mx-auto min-w-0">
                          <ResultsCardSkeleton />
                        </div>
                      )}
                      <div className={`grid grid-cols-1 lg:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] gap-6 items-stretch min-w-0 ${isAnalyzing ? 'hidden' : ''}`}>
                        {/* Question selection column */}
                        <div className="order-2 lg:order-1 flex flex-col min-w-0">
                          <QuestionPicker
                            selectedQuestion={selectedQuestion}
                            onSelectQuestion={handleSelectQuestion}
                          />
                        </div>

                        {/* Recorder and live transcription column */}
                        <div className="order-1 lg:order-2 flex flex-col min-w-0">
                          <Recorder
                            selectedQuestion={selectedQuestion}
                            onAnalysisStart={() => setIsAnalyzing(true)}
                            onAnalysisComplete={handleAnalysisComplete}
                            onAnalysisError={() => setIsAnalyzing(false)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="max-w-5xl mx-auto">
                  <HistoryTab
                    onSelectQuestionToRetry={(q) => {
                      setSelectedQuestion(q);
                      setActiveTab('practice');
                      setCurrentResult(null);
                    }}
                  />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="max-w-5xl mx-auto">
                  <EditProfile
                    onBack={() => setActiveTab('practice')}
                    onOpenContact={handleOpenContact}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Persistent Responsive Bottom Navigation for Mobile & Tablet */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenContact={handleOpenContact}
        />

        <ContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          initialCategory={contactCategory}
        />
      </div>
    );
  };

  return (
    <>
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          duration: 3500,
          className: 'warm-paper-toast',
          style: {
            background: '#FFFDF8',
            color: '#1C1B17',
            border: '1px solid #E4DCC9',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '10px 14px',
            boxShadow: '0 4px 14px rgba(28, 27, 23, 0.08)',
            maxWidth: '380px',
          },
          success: {
            duration: 3500,
            iconTheme: {
              primary: '#2F5233',
              secondary: '#FFFDF8',
            },
            style: {
              border: '1px solid #2F5233',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#C2572B',
              secondary: '#FFFDF8',
            },
            style: {
              border: '1px solid #C2572B',
            },
          },
        }}
      />
      {renderContent()}
    </>
  );
}

export default App;
