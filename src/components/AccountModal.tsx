'use client';

import React, { useState, useEffect } from 'react';
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
  Mail,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  Info,
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
    resetPassword,
    sendVerificationCode,
    isCloudConnected,
  } = useSettings();

  const [tab, setTab] = useState<'register' | 'login' | 'forgot'>(defaultTab);

  // Registration step: 'form' (enter details) -> 'verify' (enter 6-digit code)
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👒');
  const [selectedCrew, setSelectedCrew] = useState('Straw Hat Pirates');
  const [tagNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const [registerCode, setRegisterCode] = useState('');
  const [registerToken, setRegisterToken] = useState<string | null>(null);

  // Login mode: 'password' | 'code'
  const [loginMode, setLoginMode] = useState<'password' | 'code'>('password');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'enter_id' | 'verify_code'>('enter_id');
  const [loginCode, setLoginCode] = useState('');
  const [loginToken, setLoginToken] = useState<string | null>(null);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<'enter_email' | 'enter_code_and_password'>('enter_email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotToken, setForgotToken] = useState<string | null>(null);

  // Timer for resending code
  const [countdown, setCountdown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Live calculated tag
  const liveTag = `PIRATE-${(username.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CAPTAIN')}-${tagNumber}`;

  // 1. Create account / send verification code
  const handleRequestRegisterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || cleanUser.length < 2) {
      setErrorMsg('Username must be at least 2 characters long.');
      setIsSubmitting(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    // Protect against fake/placeholder domains that trigger Supabase email bounce warnings
    const domain = cleanEmail.split('@')[1];
    const invalidDomains = ['test.com', 'example.com', 'example.org', 'fake.com', 'sample.com', 'tempmail.com', 'mailinator.com', 'invalid.com'];
    if (invalidDomains.includes(domain)) {
      setErrorMsg(`Please enter a real active email address. Placeholder "@${domain}" addresses trigger Supabase mail bounce warnings.`);
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
      const res = await sendVerificationCode(cleanEmail, 'register', {
        username: cleanUser,
        password: cleanPass,
        avatar: selectedAvatar,
        crew: selectedCrew,
        tag: liveTag,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
        setIsSubmitting(false);
        return;
      }

      // If Supabase created account directly (e.g. Confirm email is turned off)
      if (res.directLogin && res.user) {
        setSuccessMsg(`Welcome aboard, ${res.user.name}! Your account has been created.`);
        setTimeout(() => {
          setSuccessMsg(null);
          setIsSubmitting(false);
          onClose();
        }, 1200);
        return;
      }

      if (res.token) {
        setRegisterToken(res.token);
      }
      setRegisterStep('verify');
      setCountdown(60);
      setSuccessMsg(`Verification code sent to ${cleanEmail}! Please check your email inbox.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit 6-digit code and complete registration
  const handleVerifyRegisterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanCode = registerCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        avatar: selectedAvatar,
        crew: selectedCrew,
        customTag: liveTag,
        code: cleanCode,
        token: registerToken || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to verify and create account.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Welcome aboard, ${res.user?.name}! Your permanent account has been created.`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  // 3. Login with password
  const handlePasswordLogin = async (e: React.FormEvent) => {
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
      const res = await login(cleanId, cleanPass);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. You can also sign in with a 6-digit code.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Welcome back, ${res.user?.name}! Loading your cards...`);
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

  // 4. Send code for login
  const handleRequestLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanId = loginIdentifier.trim().toLowerCase();
    if (!cleanId || !cleanId.includes('@')) {
      setErrorMsg('Please enter the email address associated with your account.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await sendVerificationCode(cleanId, 'login');
      if (!res.success) {
        setErrorMsg(res.error || 'No account found with this email. Please check your email or register.');
        setIsSubmitting(false);
        return;
      }

      if (res.token) {
        setLoginToken(res.token);
      }
      setLoginStep('verify_code');
      setCountdown(60);
      setSuccessMsg(`Login code sent to ${cleanId}! Please check your email.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send login code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit code for login
  const handleVerifyLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanCode = loginCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit login code.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await login(loginIdentifier.trim(), undefined, cleanCode, loginToken || undefined);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid or expired login code.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Welcome back, ${res.user?.name}! Loading your cards...`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

  // 6. Request password reset code
  const handleRequestForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await sendVerificationCode(cleanEmail, 'reset');
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to send recovery code.');
        setIsSubmitting(false);
        return;
      }

      if (res.token) {
        setForgotToken(res.token);
      }
      setForgotStep('enter_code_and_password');
      setCountdown(60);
      setSuccessMsg(`Recovery code sent to ${cleanEmail}! Please check your email.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request recovery code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Verify code and update password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanCode = forgotCode.trim();
    const cleanPass = forgotNewPassword.trim();

    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit recovery code.');
      setIsSubmitting(false);
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      setIsSubmitting(false);
      return;
    }
    if (cleanPass !== forgotConfirmPassword.trim()) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        code: cleanCode,
        newPassword: cleanPass,
        token: forgotToken || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to reset password.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Password successfully updated! Welcome back, ${res.user?.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
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
                {tab === 'register' ? selectedAvatar : tab === 'forgot' ? '🔒' : '🏴‍☠️'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white leading-tight">
                  {tab === 'register' ? 'Create Verified Account' : tab === 'forgot' ? 'Reset Password' : 'Sign In to Account'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <Cloud className="w-2.5 h-2.5" />
                  Cloud Database
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                {tab === 'register' ? 'Protected with 6-digit code verification' : tab === 'forgot' ? 'Recover your account with a 6-digit verification code' : 'Access your permanent cloud binder & cards'}
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
              tab === 'login' || tab === 'forgot'
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
          {tab === 'register' ? (
            registerStep === 'form' ? (
              /* Registration Step 1: Details Form */
              <form onSubmit={handleRequestRegisterCode} className="space-y-3.5">
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
                    Email Address <span className="text-gray-400 font-normal text-[11px]">(Real email for cloud sync & recovery)</span>
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

                {/* Generated Collector Tag Preview */}
                <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                      Generated Collector Tag
                    </span>
                    <span className="text-xs font-mono font-black text-amber-400">
                      {liveTag}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Permanent Cloud Account</span>
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#f45d6a] to-[#e64956] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#f45d6a]/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Cloud Account...' : 'Create Account'}</span>
                </button>
              </form>
            ) : (
              /* Registration Step 2: Verification Code Confirmation (Only if Confirm email is active) */
              <form onSubmit={handleVerifyRegisterCode} className="space-y-4 animate-fadeIn">
                <div className="text-center py-2 space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#f45d6a]/15 border border-[#f45d6a]/30 flex items-center justify-center text-[#f45d6a] mx-auto mb-2">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-white">
                    Enter 6-Digit Verification Code
                  </h4>
                  <p className="text-xs text-gray-400">
                    We sent a code to <span className="text-white font-bold">{email}</span>
                  </p>
                </div>

                {/* 6-Digit Code Input */}
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={registerCode}
                    onChange={(e) => setRegisterCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center tracking-[12px] text-2xl font-mono font-black bg-[#181a24] border-2 border-[#343a4c] focus:border-[#f45d6a] rounded-2xl py-3 text-amber-400 outline-none transition shadow-inner"
                  />
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || registerCode.trim().length !== 6}
                  className="w-full bg-gradient-to-r from-[#f45d6a] to-[#e64956] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#f45d6a]/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying Account...' : 'Confirm & Complete Registration'}</span>
                </button>

                {/* Helpful Troubleshooting Card for Email Delays / Bounces */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 space-y-1.5 text-left">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Didn't receive the email code?</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Supabase's default mail service has strict rate limits (3 emails/hr) and can drop or delay emails if bounce restrictions are active.
                  </p>
                  <p className="text-[11px] text-emerald-400 leading-relaxed">
                    💡 <strong>Instant fix:</strong> In Supabase Dashboard &gt; <em>Authentication &gt; Providers &gt; Email</em>, toggle OFF <strong>&quot;Confirm email&quot;</strong> to activate accounts instantly with password.
                  </p>
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setLoginMode('password'); setErrorMsg(null); }}
                      className="text-[11px] text-sky-400 hover:underline font-bold"
                    >
                      Already registered? Sign in with password &rarr;
                    </button>
                  </div>
                </div>

                {/* Footer Controls: Back & Resend */}
                <div className="flex items-center justify-between pt-2 border-t border-[#343a4c] text-xs">
                  <button
                    type="button"
                    onClick={() => { setRegisterStep('form'); setErrorMsg(null); }}
                    className="text-gray-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Edit details</span>
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || isSubmitting}
                    onClick={handleRequestRegisterCode}
                    className="text-amber-400 hover:underline disabled:text-gray-500 font-bold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{countdown > 0 ? `Resend code (${countdown}s)` : 'Resend code'}</span>
                  </button>
                </div>
              </form>
            )
          ) : tab === 'forgot' ? (
            /* Forgot Password Tab */
            <div className="space-y-4">
              {forgotStep === 'enter_email' ? (
                <form onSubmit={handleRequestForgotCode} className="space-y-3.5">
                  <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 text-xs text-gray-300 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Account Password Recovery</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Enter the email address associated with your account. We will send you a 6-digit verification code to reset your password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Your Account Email <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="e.g. pirate@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-[#181a24] border border-[#343a4c] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !forgotEmail.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending Code...' : 'Send Recovery Code'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setErrorMsg(null); }}
                      className="text-xs font-bold text-gray-400 hover:text-white transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Forgot Step 2: Enter code & new password */
                <form onSubmit={handleResetPassword} className="space-y-3.5 animate-fadeIn">
                  <div className="text-center py-1 space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-1.5">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-black text-white">Reset Account Password</h4>
                    <p className="text-xs text-gray-400">
                      Enter the 6-digit code sent to <span className="text-white font-bold">{forgotEmail}</span>
                    </p>
                  </div>

                  {/* 6-Digit Code Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      6-Digit Verification Code <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="• • • • • •"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full text-center tracking-[12px] text-2xl font-mono font-black bg-[#181a24] border-2 border-[#343a4c] focus:border-amber-400 rounded-2xl py-2.5 text-amber-400 outline-none transition shadow-inner"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      New Password (min. 6 characters) <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Enter your new password..."
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full bg-[#181a24] border border-[#343a4c] focus:border-amber-400 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Confirm New Password <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Confirm your new password..."
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full bg-[#181a24] border border-[#343a4c] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || forgotCode.trim().length !== 6 || !forgotNewPassword.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmitting ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-[#343a4c] text-xs">
                    <button
                      type="button"
                      onClick={() => { setForgotStep('enter_email'); setErrorMsg(null); }}
                      className="text-gray-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>

                    <button
                      type="button"
                      disabled={countdown > 0 || isSubmitting}
                      onClick={handleRequestForgotCode}
                      className="text-amber-400 hover:underline disabled:text-gray-500 font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{countdown > 0 ? `Resend (${countdown}s)` : 'Resend code'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Login Tab */
            <div className="space-y-3.5">
              {/* Login Method Toggle: Password vs 6-Digit Code */}
              <div className="flex rounded-xl bg-[#181a24] p-1 border border-[#343a4c]">
                <button
                  type="button"
                  onClick={() => { setLoginMode('password'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginMode === 'password'
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Password Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('code'); setErrorMsg(null); setLoginStep('enter_id'); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginMode === 'code'
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Code Sign In</span>
                </button>
              </div>

              {loginMode === 'password' ? (
                /* Method A: Password Login Form */
                <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                  {/* Saved Accounts on Device */}
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
                      placeholder="e.g. PIRATE-LUFFY-1234, Kai, or pirate@email.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
                    />
                  </div>

                  {/* Login Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-300">
                        Account Password <span className="text-[#3b82f6]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('forgot');
                          setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] font-bold text-[#3b82f6] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
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
                      <span>Permanent Cloud Database Storage</span>
                    </div>
                    <p>
                      Your account is securely saved in the database and is never lost even if you clear your browser history or cache.
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
              ) : (
                /* Method B: Login via 6-Digit Code */
                loginStep === 'enter_id' ? (
                  <form onSubmit={handleRequestLoginCode} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        Your Account Email <span className="text-[#3b82f6]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="Enter the email of your account..."
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                      />
                    </div>

                    <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 text-[11px] text-gray-400 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span>Foolproof Code Sign In</span>
                      </div>
                      <p>
                        Forgot your password or browsing data was deleted? We'll send a 6-digit login code to your email so you can sign in instantly.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !loginIdentifier.trim()}
                      className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#3b82f6]/20 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isSubmitting ? 'Sending Code...' : 'Send Login Code'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginCode} className="space-y-4 animate-fadeIn">
                    <div className="text-center py-2 space-y-1">
                      <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] mx-auto mb-2">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-white">
                        Enter 6-Digit Login Code
                      </h4>
                      <p className="text-xs text-gray-400">
                        Code sent to <span className="text-white font-bold">{loginIdentifier}</span>
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        placeholder="• • • • • •"
                        value={loginCode}
                        onChange={(e) => setLoginCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-center tracking-[12px] text-2xl font-mono font-black bg-[#181a24] border-2 border-[#343a4c] focus:border-[#3b82f6] rounded-2xl py-3 text-amber-400 outline-none transition shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || loginCode.trim().length !== 6}
                      className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#3b82f6]/20 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSubmitting ? 'Verifying Code...' : 'Verify & Sign In'}</span>
                    </button>

                    <div className="flex items-center justify-between pt-2 border-t border-[#343a4c] text-xs">
                      <button
                        type="button"
                        onClick={() => { setLoginStep('enter_id'); setErrorMsg(null); }}
                        className="text-gray-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Email</span>
                      </button>

                      <button
                        type="button"
                        disabled={countdown > 0 || isSubmitting}
                        onClick={handleRequestLoginCode}
                        className="text-amber-400 hover:underline disabled:text-gray-500 font-bold transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{countdown > 0 ? `Resend (${countdown}s)` : 'Resend code'}</span>
                      </button>
                    </div>
                  </form>
                )
              )}
            </div>
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
