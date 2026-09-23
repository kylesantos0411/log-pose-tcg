'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  Sparkles, 
  Compass, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'register' | 'login';
}

const PIRATE_AVATARS = [
  { emoji: '👒', name: 'Straw Hat', desc: 'Luffy' },
  { emoji: '⚔️', name: 'Three Swords', desc: 'Zoro' },
  { emoji: '🧭', name: 'Log Pose', desc: 'Nami' },
  { emoji: '👑', name: 'Emperor', desc: 'Shanks' },
  { emoji: '🐯', name: 'Heart', desc: 'Law' },
  { emoji: '🦅', name: 'Phoenix', desc: 'Marco' },
  { emoji: '🍖', name: 'Meat', desc: 'Captain' },
  { emoji: '🌸', name: 'Hana', desc: 'Robin' },
];

const PIRATE_CREWS = [
  'Straw Hat Pirates',
  'Heart Pirates',
  'Red Hair Pirates',
  'Cross Guild',
  'Whitebeard Pirates',
  'Revolutionary Army',
];

export function AccountModal({ isOpen, onClose, defaultTab = 'register' }: AccountModalProps) {
  const { 
    user, 
    accounts, 
    register, 
    login, 
    isCloudConnected,
    loginWithGoogle,
    loginWithSupabaseEmail,
    registerWithSupabaseEmail,
  } = useSettings();

  const [tab, setTab] = useState<'register' | 'login'>(defaultTab);

  // Form states - Register
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👒');
  const [selectedCrew, setSelectedCrew] = useState('Straw Hat Pirates');
  const [tagNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));

  // Form states - Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Loading & Feedback states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live calculated tag
  const liveTag = `PIRATE-${(username.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CAPTAIN')}-${tagNumber}`;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);

    if (!isCloudConnected) {
      setErrorMsg('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable Google OAuth. You can still use username/password accounts below!');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const res = await loginWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
        setIsGoogleLoading(false);
      }
      // Browser redirects to Google OAuth consent screen
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate Google Sign-In');
      setIsGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanUser = username.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanUser || cleanUser.length < 2) {
      setErrorMsg('Username must be at least 2 characters long.');
      setIsSubmitting(false);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setIsSubmitting(false);
      return;
    }
    if (cleanPass !== confirmPassword.trim()) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isCloudConnected) {
        const cloudRes = await registerWithSupabaseEmail({
          email: cleanEmail,
          password: cleanPass,
          username: cleanUser,
          avatar: selectedAvatar,
          crew: selectedCrew,
        });

        if (!cloudRes.success) {
          setErrorMsg(cloudRes.error || 'Failed to register cloud account.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Welcome aboard, ${cleanUser}! Your cloud collector account is ready.`);
      } else {
        const res = register({
          username: cleanUser,
          email: cleanEmail,
          password: cleanPass,
          avatar: selectedAvatar,
          crew: selectedCrew,
          customTag: liveTag,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account. Please try again.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMsg(`Welcome aboard, ${res.user?.name}! Your collector account is ready.`);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId) {
      setErrorMsg('Please enter your Collector Tag, username, or email.');
      setIsSubmitting(false);
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Please enter your account password.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isCloudConnected && cleanId.includes('@')) {
        const cloudRes = await loginWithSupabaseEmail(cleanId, cleanPass);
        if (cloudRes.success) {
          setSuccessMsg(`Welcome back! Loading your cloud binder...`);
          setTimeout(() => {
            setSuccessMsg(null);
            setIsSubmitting(false);
            onClose();
          }, 1200);
          return;
        }
      }

      // Local account login
      const res = login(cleanId, cleanPass);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your details or create an account.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Welcome back, ${res.user?.name}! Loading your collector binder...`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign in failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div 
        className="relative bg-[#202330] border border-[#3b4056] rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl z-10 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#f45d6a]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#343a4c] pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f45d6a] to-[#f59e0b] p-0.5 shadow-md">
              <div className="w-full h-full bg-[#1b1e2a] rounded-[14px] flex items-center justify-center text-lg">
                {tab === 'register' ? selectedAvatar : '🏴‍☠️'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white leading-tight">
                  {tab === 'register' ? 'Create Collector Account' : 'Sign In to Account'}
                </h3>
                {isCloudConnected && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <Cloud className="w-2.5 h-2.5" />
                    Cloud
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                {tab === 'register' ? 'Save your cards permanently to the cloud' : 'Access your saved cards & trade profile'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3 text-center animate-fadeIn flex-shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-3 animate-fadeIn flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#171923] p-1 border border-[#2d3244] flex-shrink-0">
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register' 
                ? 'bg-[#f45d6a] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login' 
                ? 'bg-[#3b82f6] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Form Container (Scrollable) */}
        <div className="overflow-y-auto space-y-3.5 pr-0.5 flex-1 select-none">
          {/* Prominent Google Sign-In Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-2 py-0.5">
              <div className="flex-1 h-px bg-[#343a4c]" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">or with email</span>
              <div className="flex-1 h-px bg-[#343a4c]" />
            </div>
          </div>

          {tab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Pirate Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Pirate Name / Collector Handle <span className="text-[#f45d6a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  placeholder="e.g. ZoroHunter, ShanksCollector, PirateKing"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition shadow-inner font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Email Address <span className="text-[#f45d6a]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="pirate@logpose.tcg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Account Password <span className="text-[#f45d6a]">* (Min. 6 chars)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Confirm Password <span className="text-[#f45d6a]">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Choose Pirate Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PIRATE_AVATARS.map((av) => (
                    <button
                      key={av.emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(av.emoji)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        selectedAvatar === av.emoji
                          ? 'bg-[#f45d6a]/20 border-[#f45d6a] text-white shadow-sm'
                          : 'bg-[#181a24] border-[#2d3244] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{av.emoji}</span>
                      <span className="text-[10px] font-bold truncate max-w-full">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pirate Crew */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Pirate Crew Affiliation
                </label>
                <select
                  value={selectedCrew}
                  onChange={(e) => setSelectedCrew(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  {PIRATE_CREWS.map((c) => (
                    <option key={c} value={c} className="bg-[#181a24] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview of Collector Tag */}
              <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                    Generated Collector Tag
                  </span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {liveTag}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Permanent Account</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#f45d6a] to-[#e64956] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#f45d6a]/20 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Account...' : 'Set Sail & Register'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Existing Accounts Quick Switch */}
              {accounts.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Saved Accounts on This Device
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setLoginIdentifier(acc.tag || acc.email);
                          setErrorMsg(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                          loginIdentifier === acc.tag || loginIdentifier === acc.email
                            ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-white shadow-sm'
                            : 'bg-[#181a24] border-[#2d3244] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{acc.avatar || '👒'}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{acc.username}</div>
                            <div className="font-mono text-[10px] text-amber-400 truncate">{acc.tag}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">Select &rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Login Identifier */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Collector Tag, Username, or Email <span className="text-[#3b82f6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PIRATE-LUFFY-1234 or luffy@onepiece.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
                />
              </div>

              {/* Login Password */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Account Password <span className="text-[#3b82f6]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your account password..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 text-[11px] text-gray-400 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Permanent Cloud &amp; Isolated Binder</span>
                </div>
                <p>
                  Signing in loads your account's personal card binder. Your cards are safely preserved and synchronized across all your devices.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !loginIdentifier.trim() || !loginPassword.trim()}
                className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#3b82f6]/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Signing in...' : 'Sign In to Account'}</span>
              </button>
            </form>
          )}

          {/* Guest Mode Notice */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-200 transition cursor-pointer"
            >
              Continue in Guest Mode (Offline Binder) &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
