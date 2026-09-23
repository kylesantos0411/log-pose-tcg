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
  Crown,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useSettings, generateCollectorTag } from '@/context/SettingsContext';

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
  const { user, register, login } = useSettings();
  const [tab, setTab] = useState<'register' | 'login'>(defaultTab);

  // Form states - Register
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👒');
  const [selectedCrew, setSelectedCrew] = useState('Straw Hat Pirates');
  const [customTag, setCustomTag] = useState('');
  const [tagNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));

  // Form states - Login
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // Notification state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live calculated tag
  const liveTag = `PIRATE-${(username.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CAPTAIN')}-${tagNumber}`;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const registered = register({
      name: username.trim(),
      email: email.trim() || undefined,
      avatar: selectedAvatar,
      crew: selectedCrew,
      tag: liveTag,
    });

    setSuccessMsg(`Welcome aboard, ${registered.name}! Your tag is ${registered.tag}`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1600);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) return;

    login(loginIdentifier.trim());
    setSuccessMsg('Signed in successfully! Loading your profile...');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1400);
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
              <h3 className="text-base font-black text-white leading-tight">
                {tab === 'register' ? 'Join the Grand Line' : 'Welcome Back, Pirate'}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                {tab === 'register' ? 'Create your official collector account' : 'Sign in to access your saved binder'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3 text-center animate-fadeIn">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#171923] p-1 border border-[#2d3244] flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('register')}
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
            onClick={() => setTab('login')}
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
        <div className="overflow-y-auto space-y-4 pr-0.5 flex-1 select-none">
          {tab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Choose Crew Crest / Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PIRATE_AVATARS.map((av) => (
                    <button
                      key={av.emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(av.emoji)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        selectedAvatar === av.emoji
                          ? 'bg-[#f45d6a]/20 border-[#f45d6a] text-white shadow-md scale-105'
                          : 'bg-[#181a24] border-[#2d3244] text-gray-400 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{av.emoji}</span>
                      <span className="text-[10px] font-bold leading-none">{av.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pirate Crew Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Affiliated Pirate Crew
                </label>
                <select
                  value={selectedCrew}
                  onChange={(e) => setSelectedCrew(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition font-medium cursor-pointer"
                >
                  {PIRATE_CREWS.map((c) => (
                    <option key={c} value={c} className="bg-[#181a24] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Unique Collector Tag Preview */}
              <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-gray-400">
                  <span>Your Permanent Tag</span>
                  <span className="text-[#3ed57a] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Auto-Generated
                  </span>
                </div>
                <div className="font-mono text-sm sm:text-base font-black text-amber-400 tracking-wider">
                  {liveTag}
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Friends use this code to add you, view your showcase binder, and propose card trades.
                </p>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Email Address <span className="text-gray-500 text-[10px] font-normal">(Optional, for profile backup)</span>
                </label>
                <input
                  type="email"
                  placeholder="pirate@logpose.tcg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#f45d6a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!username.trim()}
                className="w-full bg-gradient-to-r from-[#f45d6a] to-[#e76d78] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#f45d6a]/20 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Create Pirate Account</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Collector Tag or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PIRATE-LUFFY-1234 or your@email.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
                />
              </div>

              <div className="bg-[#181a24] border border-[#343a4c] rounded-2xl p-3 text-[11px] text-gray-400 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Local Profile &amp; Data Control</span>
                </div>
                <p>
                  Entering your Collector Tag sets up your profile and trade identity on this device. Your card binder remains safely stored locally, and can be exported as JSON anytime from My Collection.
                </p>
              </div>

              <button
                type="submit"
                disabled={!loginIdentifier.trim()}
                className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-[#3b82f6]/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>
            </form>
          )}

          {/* Guest Mode Notice */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-200 transition"
            >
              Continue in Guest Mode (Offline Binder) &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
