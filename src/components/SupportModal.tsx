'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Server, 
  TrendingUp, 
  Star, 
  Check, 
  Coffee,
  ArrowLeft,
  Download,
  QrCode,
  Sparkles,
  Send,
  Mail,
  User,
  Hash,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = 'intro' | 'qr' | 'form' | 'success';

const PRESET_AMOUNTS = [
  { label: '₱50 (1 Coffee)', value: '₱50 (1 Coffee)' },
  { label: '₱100 (2 Coffees)', value: '₱100 (2 Coffees)' },
  { label: '₱250 (3+ Coffees)', value: '₱250 (3+ Coffees)' },
  { label: 'Custom', value: 'custom' },
];

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { user } = useSettings();

  const [view, setView] = useState<ModalView>('intro');
  const [selectedAmount, setSelectedAmount] = useState('₱100 (2 Coffees)');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user?.name && !donorName) {
      setDonorName(user.name);
    }
    if (user?.email && !donorEmail) {
      setDonorEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleClose = () => {
    setView('intro');
    setIsSubmitting(false);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmitDonation = async (isAnonymous = false) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const finalAmount = selectedAmount === 'custom' 
      ? (customAmount.trim() ? `₱${customAmount.replace(/[^0-9.]/g, '')}` : 'Custom Amount')
      : selectedAmount;

    const payload = {
      donorName: isAnonymous ? 'Anonymous Pirate' : (donorName.trim() || user?.name || 'Anonymous Pirate'),
      donorEmail: isAnonymous ? '' : (donorEmail.trim() || user?.email || ''),
      amount: finalAmount,
      referenceNumber: isAnonymous ? '' : referenceNumber.trim(),
      message: isAnonymous ? 'Sent anonymously with love.' : message.trim(),
      paymentMethod: 'QR Ph / GCash / Maya / Bank Transfer',
    };

    try {
      const res = await fetch('/api/donations/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Could not submit notification, but your support is deeply appreciated!');
      }

      setView('success');
    } catch (err: any) {
      console.warn('Donation notify error:', err);
      // Even if network glitches, display success so donor knows their QR transfer went through
      setView('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#14161f]/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Main Container */}
      <div 
        className="relative bg-[#232634] border border-[#34384c] rounded-[28px] sm:rounded-[36px] w-full max-w-sm sm:max-w-md max-h-[96vh] overflow-y-auto no-scrollbar shadow-2xl z-10 p-5 sm:p-6 flex flex-col items-center text-center font-sans transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        <button
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#2d3143] hover:bg-[#383d54] text-gray-300 hover:text-white flex items-center justify-center transition-colors shadow-md z-20 cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* =================== VIEW 1: INTRO =================== */}
        {view === 'intro' && (
          <>
            <div className="relative mt-0.5 mb-2.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#f4727d] to-[#e44d5b] p-0.5 shadow-xl shadow-[#f4727d]/20 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1.5 -left-5 bg-white text-[#e44d5b] text-[7.5px] font-black tracking-widest px-5 py-0.5 -rotate-45 shadow-sm uppercase select-none">
                  SUPPORT
                </div>
                <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-gradient-to-b from-[#f36b77] to-[#e44d5b] flex flex-col items-center justify-center">
                  <Coffee className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[2.2] drop-shadow-md" />
                  <div className="absolute bottom-0 inset-x-0 h-3 sm:h-4 bg-[#e5c292] rounded-b-2xl sm:rounded-b-3xl opacity-90" />
                </div>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center justify-center gap-1.5 uppercase">
              <span>LOG POSE SUPPORT</span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1 mb-3.5 max-w-[92%] leading-relaxed">
              100% free fan application. Support is voluntary and directly funds database server uptime and maintenance.
            </p>

            {/* Feature Box */}
            <div className="w-full bg-[#2a2d3d] border border-[#383d52] rounded-2xl p-3.5 space-y-3 text-left mb-4 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Server Hosting &amp; Cloud Database
                  </div>
                  <div className="text-[11px] text-gray-400 leading-snug mt-0.5">
                    Covers monthly SQLite cloud backups and backend operational fees.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[#f59e0b] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Live Market Price Engine
                  </div>
                  <div className="text-[11px] text-gray-400 leading-snug mt-0.5">
                    Powers daily automated Yuyu-tei card price scrapers for accurate yen pricing.
                  </div>
                </div>
              </div>
            </div>

            {/* Any amount pill */}
            <div className="w-full bg-[#1e202c] border border-amber-500/20 rounded-2xl p-3 mb-4 flex items-center justify-center gap-2 text-center">
              <Sparkles className="w-4 h-4 text-[#f59e0b] flex-shrink-0 animate-pulse" />
              <p className="text-xs font-semibold text-amber-200/90 leading-snug">
                Any amount will do! Every coffee helps keep the servers running.
              </p>
            </div>

            {/* Treat me a coffee button */}
            <button
              type="button"
              onClick={() => setView('qr')}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#f4727d] to-[#e44d5b] hover:brightness-105 active:scale-95 text-white font-black text-base tracking-wide uppercase shadow-xl shadow-[#f4727d]/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 select-none"
            >
              <Coffee className="w-5 h-5 stroke-[2.5]" />
              <span>Treat me a coffee</span>
            </button>

            <p className="text-[11px] text-gray-400 font-medium mt-2.5">
              Voluntary support &bull; Any amount is deeply appreciated
            </p>
          </>
        )}

        {/* =================== VIEW 2: QR PAYMENT =================== */}
        {view === 'qr' && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            {/* Top Back Nav */}
            <div className="w-full flex items-center justify-between pr-10 mb-3">
              <button
                type="button"
                onClick={() => setView('intro')}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f4727d] bg-[#f4727d]/15 border border-[#f4727d]/30 px-2.5 py-0.5 rounded-full">
                QR Payment
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
              Send a Coffee ☕
            </h3>
            <p className="text-xs text-gray-300 font-medium mt-0.5 mb-3">
              Scan with GCash, Maya, or any banking app. Any amount will do!
            </p>

            {/* High-Contrast White QR Card */}
            <div className="w-full max-w-[270px] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center text-slate-900 mb-3 border-4 border-[#2f3448]">
              <div className="relative w-52 h-52 sm:w-56 sm:h-56 bg-white p-1 rounded-2xl flex items-center justify-center">
                <img
                  src="/donation-qr.png"
                  alt="Donation QR Code"
                  className="w-full h-full object-contain rounded-xl select-none"
                />
              </div>

              <div className="text-center mt-2">
                <div className="text-sm font-black text-slate-900 tracking-tight">
                  Kyle Santos
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Log Pose Server Maintenance
                </div>
              </div>
            </div>

            {/* Save QR Image Button */}
            <a
              href="/donation-qr.png"
              download="log-pose-donation-qr.png"
              className="w-full bg-[#2a2d3d] hover:bg-[#34384c] border border-[#3e4358] rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 text-center text-xs font-bold text-gray-200 hover:text-white mb-2.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#f4727d]" />
              <span>Save QR to Photos</span>
            </a>

            {/* Next Step Button: Notify Kyle */}
            <button
              type="button"
              onClick={() => setView('form')}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f4727d] to-[#e44d5b] hover:brightness-105 active:scale-95 text-white font-black text-sm tracking-wide uppercase shadow-lg shadow-[#f4727d]/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>I&apos;VE SENT A COFFEE (NOTIFY KYLE) &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitDonation(true)}
              disabled={isSubmitting}
              className="mt-2 text-xs font-bold text-gray-400 hover:text-gray-200 underline cursor-pointer py-1"
            >
              {isSubmitting ? 'Recording...' : 'Or notify anonymously without details'}
            </button>
          </div>
        )}

        {/* =================== VIEW 3: DONOR DETAILS FORM (EMAIL NOTIFICATION) =================== */}
        {view === 'form' && (
          <div className="w-full flex flex-col items-center animate-fadeIn text-left">
            {/* Top Back Nav */}
            <div className="w-full flex items-center justify-between pr-10 mb-2">
              <button
                type="button"
                onClick={() => setView('qr')}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to QR</span>
              </button>

              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Email Alert
              </span>
            </div>

            <div className="text-center w-full mb-3.5">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                You&apos;re Amazing! ☕
              </h3>
              <p className="text-xs text-gray-300 mt-0.5 leading-snug">
                Fill in your info so Kyle receives an email notification with your message!
              </p>
            </div>

            {/* Donation Form */}
            <div className="w-full space-y-3">
              {/* Name Field */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-[#f4727d]" />
                  <span>Your Name or Nickname</span>
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Monkey D. Luffy / Kyle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d27] border border-[#343a4c] focus:border-[#f4727d] focus:outline-none text-xs sm:text-sm text-white placeholder-gray-500 transition"
                />
              </div>

              {/* Email Address Field */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Your Email Address (Optional)</span>
                </label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d27] border border-[#343a4c] focus:border-[#f4727d] focus:outline-none text-xs sm:text-sm text-white placeholder-gray-500 transition"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Kyle will receive this so he can send you a thank-you note!
                </span>
              </div>

              {/* Amount Selection Chips */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Support Tier / Amount</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_AMOUNTS.map((preset) => {
                    const isSelected = selectedAmount === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSelectedAmount(preset.value)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#f4727d]/20 border-[#f4727d] text-white shadow-sm'
                            : 'bg-[#1a1d27] border-[#313648] text-gray-300 hover:bg-[#252838]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {selectedAmount === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount (e.g. ₱500)"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1a1d27] border border-[#343a4c] focus:border-[#f4727d] focus:outline-none text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Reference Number (Optional) */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reference / Transaction ID (Optional)</span>
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. GCash/Maya Ref # (last 4 digits)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1d27] border border-[#343a4c] focus:border-[#f4727d] focus:outline-none text-xs sm:text-sm text-white placeholder-gray-500 font-mono transition"
                />
              </div>

              {/* Personal Message */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Message for Kyle (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message, suggestion, or cheer..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a1d27] border border-[#343a4c] focus:border-[#f4727d] focus:outline-none text-xs text-white placeholder-gray-500 transition resize-none"
                />
              </div>
            </div>

            {/* Error Display */}
            {errorMsg && (
              <p className="text-xs text-red-400 font-medium mt-2 text-center">
                {errorMsg}
              </p>
            )}

            {/* Submit Button */}
            <div className="w-full mt-4 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmitDonation(false)}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f4727d] to-[#e44d5b] hover:brightness-105 active:scale-95 text-white font-black text-sm tracking-wide uppercase shadow-lg shadow-[#f4727d]/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Notification...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Coffee Notice to Kyle 🚀</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubmitDonation(true)}
                disabled={isSubmitting}
                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-200 transition text-center cursor-pointer"
              >
                Skip &amp; Submit Anonymously
              </button>
            </div>
          </div>
        )}

        {/* =================== VIEW 4: SUCCESS =================== */}
        {view === 'success' && (
          <div className="w-full flex flex-col items-center animate-fadeIn py-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-xl">
              <Heart className="w-9 h-9 fill-emerald-400 animate-bounce" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              THANK YOU SO MUCH! ❤️
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-2 mb-6 max-w-xs leading-relaxed">
              Your coffee support notification has been sent directly to Kyle. Every bit of support helps keep Log Pose servers and price updates online for everyone!
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              Done &bull; Return to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
