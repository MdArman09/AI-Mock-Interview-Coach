import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userAPI, authAPI } from '../services/api';
import { ConfirmDialog } from './ConfirmDialog';
import ShimmerButton from './ui/ShimmerButton';
import {
  User,
  Mail,
  Briefcase,
  Award,
  Shield,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  Check,
  Building2,
  Trash2,
  MessageSquare,
} from 'lucide-react';

export const EditProfile = ({ onBack, onOpenContact }) => {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  // Profile metadata state
  const [formData, setFormData] = useState({
    name: user?.profile?.name || user?.name || '',
    targetJob: user?.profile?.targetJob || '',
    experienceLevel: user?.profile?.experienceLevel || 'Mid Level',
    coachPreference: user?.profile?.coachPreference || 'Balanced',
  });

  // Security password state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Visibility toggles for password fields
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Account deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isGoogleUser = user?.authProvider === 'google';

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    if (!isGoogleUser && !deletePassword) {
      setDeleteError('Please enter your current password');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');
    try {
      await authAPI.deleteAccount(isGoogleUser ? undefined : deletePassword);
      setIsDeleteDialogOpen(false);
      toast.success('Your account has been permanently deleted.');
      window.dispatchEvent(new CustomEvent('app:stop-recording'));
      logout();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const experienceLevels = [
    { value: 'Entry Level', label: 'Entry Level (0-2 years exp)' },
    { value: 'Mid Level', label: 'Mid Level (3-5 years exp)' },
    { value: 'Senior', label: 'Senior (6-9 years exp)' },
    { value: 'Staff / Principal', label: 'Staff / Principal (10+ years exp)' },
    { value: 'Engineering Manager', label: 'Engineering Manager / Lead' },
  ];

  const coachPreferences = [
    {
      value: 'Balanced',
      title: 'Balanced Coach',
      desc: 'Constructive STAR feedback, speech pacing telemetry, and balanced guidance.',
    },
    {
      value: 'Strict FAANG Bar Raiser',
      title: 'FAANG Bar Raiser',
      desc: 'Uncompromising scrutiny on metrics, leadership principles, and depth.',
    },
    {
      value: 'Encouraging Mentor',
      title: 'Encouraging Mentor',
      desc: 'Focuses on confidence building, articulation polish, and supportive suggestions.',
    },
    {
      value: 'Rapid-fire Technical',
      title: 'Direct & Technical',
      desc: 'Punchy feedback zeroing in on architecture, system trade-offs, and conciseness.',
    },
  ];

  const popularRoles = [
    'Frontend Engineer',
    'Full Stack Developer',
    'Backend Systems Engineer',
    'AI / ML Engineer',
    'Product Manager',
    'DevOps / SRE',
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = localStorage.getItem('interview_coach_token');
        if (!token) return;

        const res = await userAPI.getProfile();
        if (isMounted && res.success && res.user) {
          const u = res.user;
          setFormData({
            name: u.profile?.name || u.name || '',
            targetJob: u.profile?.targetJob || '',
            experienceLevel: u.profile?.experienceLevel || 'Mid Level',
            coachPreference: u.profile?.coachPreference || 'Balanced',
          });
          updateUser(u);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchLatestProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!formData.name.trim()) {
      const msg = 'Name cannot be empty.';
      setProfileError(msg);
      toast.error(msg);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await userAPI.updateProfile({
        name: formData.name.trim(),
        targetJob: formData.targetJob.trim(),
        experienceLevel: formData.experienceLevel,
        coachPreference: formData.coachPreference,
      });

      if (res.success && res.user) {
        updateUser(res.user);
        const msg = 'Profile details saved successfully!';
        setProfileSuccess(msg);
        toast.success(msg);
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        throw new Error(res.message || 'Failed to update profile');
      }
    } catch (err) {
      const msg = err.message || 'Error updating profile';
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecuritySuccess('');
    setSecurityError('');

    if (!securityData.currentPassword) {
      const msg = 'Please enter your current password.';
      setSecurityError(msg);
      toast.error(msg);
      return;
    }

    if (securityData.newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters long.';
      setSecurityError(msg);
      toast.error(msg);
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      const msg = 'New password and confirmation do not match.';
      setSecurityError(msg);
      toast.error(msg);
      return;
    }

    setSavingPassword(true);
    try {
      const res = await userAPI.changePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        confirmPassword: securityData.confirmPassword,
      });

      if (res.success) {
        const msg = 'Password successfully updated!';
        setSecuritySuccess(msg);
        toast.success(msg);
        setSecurityData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSecuritySuccess(''), 4000);
      } else {
        throw new Error(res.message || 'Failed to update password');
      }
    } catch (err) {
      const msg = err.message || 'Error updating password';
      setSecurityError(msg);
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="w-full rounded-lg bg-[#FFFDF8] dark:bg-[#23211D] text-[#1C1B17] dark:text-[#FAF6EE] font-sans relative overflow-hidden py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border border-[#E4DCC9] dark:border-[#38342D] shadow-none min-w-0">
      <div className="max-w-5xl mx-auto space-y-8 min-w-0">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4DCC9] dark:border-[#38342D] min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-md bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#2D2A24] text-[#4A463F] dark:text-[#B5AFA2] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] border border-[#E4DCC9] dark:border-[#38342D] transition-colors cursor-pointer group active:scale-[0.98] flex-shrink-0"
                title="Return to Studio"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </button>
            )}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF6EE] dark:bg-[#181714] text-[#2F5233] dark:text-[#689D6A] border border-[#E4DCC9] dark:border-[#38342D] text-xs font-medium mb-1">
                <Sparkles className="w-3 h-3 text-[#2F5233] dark:text-[#689D6A]" />
                <span>Account & Preferences</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE] truncate">
                Candidate Profile & Security
              </h1>
            </div>
          </div>

          {/* Quick User Identity Badge */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex-shrink-0 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-md bg-[#FFFDF8] dark:bg-[#23211D] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A] font-serif font-bold text-sm flex-shrink-0">
              {formData.name ? formData.name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] leading-tight truncate sm:max-w-[220px]">
                {formData.name || user?.name || 'Candidate'}
              </div>
              <div className="text-[11px] text-[#787268] dark:text-[#8E877C] leading-none mt-0.5 truncate sm:max-w-[220px]">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#787268] dark:text-[#8E877C]">
            <Loader2 className="w-6 h-6 animate-spin text-[#2F5233] dark:text-[#689D6A] mb-2" />
            <p className="text-xs font-medium">Fetching candidate profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT / MAIN COLUMN */}
            <div className="lg:col-span-7 space-y-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* 1. PERSONAL DETAILS CARD */}
                <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 shadow-none">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4DCC9] dark:border-[#38342D]">
                    <div className="w-8 h-8 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                        Personal Details
                      </h2>
                      <p className="text-xs text-[#787268] dark:text-[#8E877C]">
                        Your candidate identity across the interview coach
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g. Alex Chen"
                          className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-3.5 py-2 text-sm text-[#1C1B17] dark:text-[#FAF6EE] placeholder-[#787268] dark:placeholder-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider">
                          Email Address
                        </label>
                        <span className="text-[11px] text-[#787268] dark:text-[#8E877C] flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-3.5 py-2 text-sm text-[#787268] dark:text-[#8E877C] cursor-not-allowed select-none opacity-80"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PROFESSIONAL CONTEXT CARD */}
                <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 shadow-none">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4DCC9] dark:border-[#38342D]">
                    <div className="w-8 h-8 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A]">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                        Professional Context
                      </h2>
                      <p className="text-xs text-[#787268] dark:text-[#8E877C]">
                        Tailors the AI evaluation rubric to your target role
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider mb-1.5">
                        Target Job Title
                      </label>
                      <div className="relative mb-2.5">
                        <Building2 className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={formData.targetJob}
                          onChange={(e) =>
                            setFormData({ ...formData, targetJob: e.target.value })
                          }
                          placeholder="e.g. Senior Frontend Engineer"
                          className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-3.5 py-2 text-sm text-[#1C1B17] dark:text-[#FAF6EE] placeholder-[#787268] dark:placeholder-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-[#787268] dark:text-[#8E877C] self-center mr-1">
                          Quick Fill:
                        </span>
                        {popularRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setFormData({ ...formData, targetJob: role })}
                            className={`px-2 py-0.5 rounded-md text-xs transition-colors cursor-pointer border active:scale-[0.98] ${
                              formData.targetJob === role
                                ? 'bg-[#2F5233] text-[#FAF6EE] border-[#2F5233] font-medium'
                                : 'bg-[#FAF6EE] dark:bg-[#181714] text-[#4A463F] dark:text-[#B5AFA2] border-[#E4DCC9] dark:border-[#38342D] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider mb-1.5">
                        Seniority & Experience Level
                      </label>
                      <div className="relative">
                        <Award className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={formData.experienceLevel}
                          onChange={(e) =>
                            setFormData({ ...formData, experienceLevel: e.target.value })
                          }
                          className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-9 py-2 text-sm text-[#1C1B17] dark:text-[#FAF6EE] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors appearance-none cursor-pointer"
                        >
                          {experienceLevels.map((lvl) => (
                            <option key={lvl.value} value={lvl.value} className="bg-[#FFFDF8] dark:bg-[#23211D] text-[#1C1B17] dark:text-[#FAF6EE]">
                              {lvl.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#787268] dark:text-[#8E877C] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider mb-1.5">
                        AI Coach Persona Preference
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {coachPreferences.map((pref) => {
                          const isSelected = formData.coachPreference === pref.value;
                          return (
                            <div
                              key={pref.value}
                              onClick={() =>
                                setFormData({ ...formData, coachPreference: pref.value })
                              }
                              className={`relative p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-[#EEF3EE]/80 dark:bg-[#1E2E20]/80 border-[#2F5233] dark:border-[#689D6A] shadow-xs'
                                  : 'bg-[#FAF6EE] dark:bg-[#181714] border-[#E4DCC9] dark:border-[#38342D] hover:border-[#2F5233]/40 dark:hover:border-[#689D6A]/40'
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="coachPreferenceIndicator"
                                  className="absolute inset-0 rounded-lg border-2 border-[#2F5233] dark:border-[#689D6A] pointer-events-none"
                                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                              )}
                              <div className="relative z-10 flex items-center justify-between mb-1.5">
                                <span className={`text-xs font-serif font-bold ${isSelected ? 'text-[#2F5233] dark:text-[#689D6A]' : 'text-[#1C1B17] dark:text-[#FAF6EE]'}`}>
                                  {pref.title}
                                </span>
                                {isSelected && (
                                  <span className="p-0.5 rounded-full bg-[#2F5233] dark:bg-[#689D6A] text-[#FAF6EE]">
                                    <Check className="w-3 h-3 flex-shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="relative z-10 text-[11px] text-[#4A463F] dark:text-[#B5AFA2] leading-snug">
                                {pref.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="p-3.5 rounded-md bg-[#EEF3EE] dark:bg-[#1E2E20] border border-[#D9E5DA] dark:border-[#2D4530] text-[#2F5233] dark:text-[#689D6A] text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="p-3.5 rounded-md bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] text-[#C2572B] dark:text-[#E07A5F] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-4 py-2 text-xs font-medium text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE] transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                  )}
                  <ShimmerButton
                    type="submit"
                    disabled={savingProfile}
                    shimmerColor="#86EFAC"
                    background="#2F5233"
                    className="px-5 py-2 text-xs font-medium rounded-md shadow-xs"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Edits</span>
                      </>
                    )}
                  </ShimmerButton>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Security */}
            <div className="lg:col-span-5 space-y-6">
              {isGoogleUser ? (
                <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 shadow-none space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#E4DCC9] dark:border-[#38342D]">
                    <div className="w-8 h-8 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#2F5233] dark:text-[#689D6A]" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                        Security & Credentials
                      </h2>
                      <p className="text-xs text-[#787268] dark:text-[#8E877C]">
                        Authentication managed via Google Single Sign-On
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span className="text-xs font-semibold text-[#1C1B17] dark:text-[#FAF6EE]">Google Account Linked</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] font-bold border border-[#D9E5DA] dark:border-[#2D4530]">
                        Verified SSO
                      </span>
                    </div>
                    <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
                      You are signed in with Google (<strong className="text-[#1C1B17] dark:text-[#FAF6EE]">{user?.email}</strong>). Your credentials, two-factor authentication, and password security are managed directly through Google.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSecuritySubmit}>
                  <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-6 shadow-none">
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E4DCC9] dark:border-[#38342D]">
                      <div className="w-8 h-8 rounded-md bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] flex items-center justify-center text-[#2F5233] dark:text-[#689D6A]">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                          Security & Credentials
                        </h2>
                        <p className="text-xs text-[#787268] dark:text-[#8E877C]">
                          Bcrypt salted hash encryption
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider mb-1.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <Key className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            required
                            value={securityData.currentPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                currentPassword: e.target.value,
                              })
                            }
                            placeholder="••••••••"
                            className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-9 py-2 text-sm text-[#1C1B17] dark:text-[#FAF6EE] placeholder-[#787268] dark:placeholder-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={securityData.newPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="Min 6 characters"
                            className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-9 py-2 text-sm text-[#1C1B17] dark:text-[#FAF6EE] placeholder-[#787268] dark:placeholder-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-serif font-bold text-[#787268] dark:text-[#8E877C] uppercase tracking-wider">
                            Confirm New Password
                          </label>
                          {securityData.newPassword && securityData.confirmPassword && (
                            <span
                              className={`text-[10px] font-medium ${
                                securityData.newPassword === securityData.confirmPassword
                                  ? 'text-[#2F5233] dark:text-[#689D6A]'
                                  : 'text-[#C2572B] dark:text-[#E07A5F]'
                              }`}
                            >
                              {securityData.newPassword === securityData.confirmPassword
                                ? 'Match'
                                : 'Mismatch'}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-[#787268] dark:text-[#8E877C] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={securityData.confirmPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder="Repeat new password"
                            className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md pl-9 pr-9 py-2 text-sm text-[#1C1B17] dark:text-[#FAF6EE] placeholder-[#787268] dark:placeholder-[#8E877C] focus:outline-none focus:border-[#2F5233] dark:focus:border-[#689D6A] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#787268] dark:text-[#8E877C] hover:text-[#1C1B17] dark:hover:text-[#FAF6EE]"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {securitySuccess && (
                        <div className="p-3 rounded-md bg-[#EEF3EE] dark:bg-[#1E2E20] border border-[#D9E5DA] dark:border-[#2D4530] text-[#2F5233] dark:text-[#689D6A] text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{securitySuccess}</span>
                        </div>
                      )}
                      {securityError && (
                        <div className="p-3 rounded-md bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] text-[#C2572B] dark:text-[#E07A5F] text-xs flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{securityError}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={savingPassword}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#1C1B17] dark:text-[#FAF6EE] bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#F3EDE0] dark:hover:bg-[#2D2A24] rounded-md border border-[#E4DCC9] dark:border-[#38342D] transition-all disabled:opacity-60 cursor-pointer shadow-none active:scale-[0.98]"
                        >
                          {savingPassword ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F5233] dark:text-[#689D6A]" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-3.5 h-3.5 text-[#2F5233] dark:text-[#689D6A]" />
                              <span>Update Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Account Telemetry Summary Card */}
              <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-5 space-y-2.5 text-xs text-[#787268] dark:text-[#8E877C]">
                <div className="flex items-center justify-between text-[#1C1B17] dark:text-[#FAF6EE] font-medium">
                  <span>MongoDB Atlas Link</span>
                  <span className="flex items-center gap-1.5 text-[#2F5233] dark:text-[#689D6A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F5233] dark:bg-[#689D6A]" />
                    Synchronized
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Target Interview Bar</span>
                  <span className="text-[#1C1B17] dark:text-[#FAF6EE] font-medium">{formData.experienceLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Coach Mode</span>
                  <span className="text-[#1C1B17] dark:text-[#FAF6EE] font-medium">{formData.coachPreference}</span>
                </div>
              </div>

              {/* Support & Feedback Section */}
              {onOpenContact && (
                <div className="rounded-lg border border-[#E4DCC9] dark:border-[#38342D] bg-[#FFFDF8] dark:bg-[#23211D] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#2F5233] dark:text-[#689D6A]">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <h3 className="text-sm font-serif font-bold text-[#1C1B17] dark:text-[#FAF6EE]">
                        Support & Feedback
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF3EE] dark:bg-[#1E2E20] text-[#2F5233] dark:text-[#689D6A] font-semibold">
                      Direct Help
                    </span>
                  </div>
                  <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
                    Have feedback, need assistance with microphone permissions, or want to suggest a new feature? Send our team a message anytime.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenContact('general')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#2F5233] dark:text-[#689D6A] bg-[#FAF6EE] dark:bg-[#181714] hover:bg-[#EEF3EE] dark:hover:bg-[#1E2E20] border border-[#E4DCC9] dark:border-[#38342D] rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact Support & Feedback</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone: Account Deletion */}
              <div className="rounded-lg border border-[#F4D8CC] dark:border-[#4E271F] bg-[#FFFDF8] dark:bg-[#23211D] p-5 space-y-3">
                <div className="flex items-center gap-2 text-[#C2572B] dark:text-[#E07A5F]">
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  <h3 className="text-sm font-serif font-bold">Delete Account</h3>
                </div>
                <p className="text-xs text-[#787268] dark:text-[#8E877C] leading-relaxed">
                  Permanently delete your account and all associated practice data, transcripts, STAR scores, uploaded resumes, and generated questions. This action cannot be undone.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setDeletePassword('');
                      setDeleteConfirmText('');
                      setIsDeleteDialogOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#C2572B] dark:text-[#E07A5F] hover:text-white hover:bg-[#C2572B] dark:hover:bg-[#C2572B] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete My Account</span>
                  </button>
                </div>
              </div>

              {/* ConfirmDialog Modal for Account Deletion */}
              <ConfirmDialog
                open={isDeleteDialogOpen}
                title="Delete Your Account Permanently?"
                note="This action is permanent and cannot be reversed."
                confirmLabel={deletingAccount ? 'Deleting...' : 'Delete My Account'}
                confirmVariant="danger"
                confirmDisabled={deleteConfirmText !== 'DELETE' || (!isGoogleUser && !deletePassword) || deletingAccount}
                onCancel={() => {
                  if (!deletingAccount) setIsDeleteDialogOpen(false);
                }}
                onConfirm={handleDeleteAccount}
              >
                <div className="space-y-3.5 text-left pt-1">
                  <div className="p-3 bg-[#FAEEE8] dark:bg-[#2B1B17] border border-[#F4D8CC] dark:border-[#4E271F] rounded-md text-xs text-[#C2572B] dark:text-[#E07A5F] space-y-1.5">
                    <p className="font-semibold text-xs">The following data will be permanently deleted:</p>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                      <li>Your account profile, credentials, and settings</li>
                      <li>All practice interview sessions, speech pacing metrics, and feedback</li>
                      <li>All uploaded resumes and extracted text</li>
                      <li>All custom interview questions generated for your profile</li>
                    </ul>
                  </div>

                  {!isGoogleUser && (
                    <div>
                      <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md px-3 py-2 text-xs text-[#1C1B17] dark:text-[#FAF6EE] focus:outline-none focus:border-[#C2572B] transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#787268] dark:text-[#8E877C] mb-1">
                      Type <span className="font-mono text-[#C2572B] dark:text-[#E07A5F] font-bold">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full bg-[#FAF6EE] dark:bg-[#181714] border border-[#E4DCC9] dark:border-[#38342D] rounded-md px-3 py-2 text-xs text-[#1C1B17] dark:text-[#FAF6EE] focus:outline-none focus:border-[#C2572B] transition-colors font-mono"
                    />
                  </div>

                  {deleteError && (
                    <div className="p-2.5 bg-[#FAEEE8] dark:bg-[#2B1B17] text-[#C2572B] dark:text-[#E07A5F] text-xs rounded border border-[#F4D8CC] dark:border-[#4E271F] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{deleteError}</span>
                    </div>
                  )}
                </div>
              </ConfirmDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
