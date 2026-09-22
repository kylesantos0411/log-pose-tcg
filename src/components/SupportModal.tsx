'use client';

import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Server, 
  TrendingUp, 
  Star, 
  Check, 
  Coffee,
  ArrowLeft,
  Copy,
  QrCode,
  Sparkles
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowQR(false);
    setCopied(false);
    setHasCompleted(false);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText?.('0917-000-0000');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setHasCompleted(true);
    setTimeout(() => {
      handleClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#14161f]/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Main Container - Dark Navy Card with Smooth Rounded Edges */}
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

        {!showQR ? (
          /* =================== VIEW 1: TREAT ME A COFFEE OVERVIEW =================== */
          <>
            {/* Top App Icon matching Reference (Pinkish red squircle with white sash & sandy curved base) */}
            <div className="relative mt-0.5 mb-2.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#f4727d] to-[#e44d5b] p-0.5 shadow-xl shadow-[#f4727d]/20 flex items-center justify-center relative overflow-hidden">
                {/* Top-left SUPPORT sash */}
                <div className="absolute top-1.5 -left-5 bg-white text-[#e44d5b] text-[7.5px] font-black tracking-widest px-5 py-0.5 -rotate-45 shadow-sm uppercase select-none">
                  SUPPORT
                </div>

                {/* Central Coffee Icon */}
                <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-gradient-to-b from-[#f36b77] to-[#e44d5b] flex flex-col items-center justify-center">
                  <Coffee className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[2.2] drop-shadow-md" />
                  {/* Bottom sandy shore curved accent */}
                  <div className="absolute bottom-0 inset-x-0 h-3 sm:h-4 bg-[#e5c292] rounded-b-2xl sm:rounded-b-3xl opacity-90" />
                </div>
              </div>
            </div>

            {/* Title: LOG POSE SUPPORT */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center justify-center gap-1.5 uppercase">
              <span>LOG POSE SUPPORT</span>
            </h2>

            {/* Subtitle / Voluntary Clarification */}
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1 mb-3.5 max-w-[92%] leading-relaxed">
              100% free fan application. Support is voluntary and directly funds database server uptime and maintenance.
            </p>

            {/* Feature Box (Cleaned: Scanner & Fast Art CDN removed) */}
            <div className="w-full bg-[#2a2d3d] border border-[#383d52] rounded-2xl p-3.5 space-y-3 text-left mb-4 shadow-inner">
              {/* Row 1: Server Hosting */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Server Hosting &amp; Cloud Database
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Covers monthly database queries, automated backups &amp; 99.9% uptime
                  </div>
                </div>
              </div>

              {/* Row 2: Continuous Market Price Scrapers */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Continuous Market Price Scrapers
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Keeps Yuyu-tei, TCGPlayer, eBay &amp; PSA pricing fresh and synchronized
                  </div>
                </div>
              </div>

              {/* Row 3: Free & Ad-Free */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Free &amp; Completely Ad-Free for Everyone
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Your kindness keeps the application clean with zero paywalls or ads
                  </div>
                </div>
              </div>
            </div>

            {/* "Any amount will do" Note Card */}
            <div className="w-full bg-[#1e202c] border border-amber-500/20 rounded-2xl p-3 mb-4 flex items-center justify-center gap-2 text-center">
              <Sparkles className="w-4 h-4 text-[#f59e0b] flex-shrink-0 animate-pulse" />
              <p className="text-xs font-semibold text-amber-200/90 leading-snug">
                Any amount will do! Every coffee helps keep the servers running.
              </p>
            </div>

            {/* Single Button: Treat me a coffee */}
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#f4727d] to-[#e44d5b] hover:brightness-105 active:scale-95 text-white font-black text-base tracking-wide uppercase shadow-xl shadow-[#f4727d]/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 select-none"
            >
              <Coffee className="w-5 h-5 stroke-[2.5]" />
              <span>Treat me a coffee</span>
            </button>

            {/* Subtext Clarification */}
            <p className="text-[11px] text-gray-400 font-medium mt-2.5">
              Voluntary donation • Any amount is deeply appreciated
            </p>

            {/* Bottom Utility Links */}
            <div className="flex items-center justify-center gap-8 mt-4 pt-3 border-t border-[#2e3346] w-full text-xs text-gray-400">
              <button 
                type="button"
                onClick={() => setShowQR(true)}
                className="hover:text-white transition cursor-pointer flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Show QR</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  alert('Log Pose TCG is a 100% free non-profit fan project. Donations directly fund monthly cloud servers and Yuyu-tei price scrapers.');
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Transparency
              </button>
              <button 
                type="button"
                onClick={() => {
                  alert('Privacy Policy: Log Pose TCG does not collect or store banking or wallet credentials.');
                }}
                className="hover:text-white transition cursor-pointer"
              >
                Privacy
              </button>
            </div>
          </>
        ) : (
          /* =================== VIEW 2: QR CODE PAYMENT VIEW =================== */
          <div className="w-full flex flex-col items-center animate-fadeIn">
            {/* Top Back Nav */}
            <div className="w-full flex items-center justify-between pr-10 mb-3">
              <button
                type="button"
                onClick={() => setShowQR(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f4727d] bg-[#f4727d]/15 border border-[#f4727d]/30 px-2.5 py-0.5 rounded-full">
                QR Payment
              </span>
            </div>

            {/* Header */}
            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
              Send a Coffee ☕
            </h3>
            <p className="text-xs text-gray-300 font-medium mt-0.5 mb-3.5">
              Scan with <strong className="text-white">GCash, Maya, or any QRPh app</strong>. Any amount will do!
            </p>

            {/* High-Contrast White QR Card */}
            <div className="w-full max-w-[260px] bg-white rounded-3xl p-4 shadow-2xl flex flex-col items-center text-slate-900 mb-3.5 border-4 border-[#2f3448]">
              {/* Wallet Badges Header */}
              <div className="w-full flex items-center justify-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-[#0057e3] text-white text-[10px] font-black tracking-wide uppercase shadow-sm">
                  GCash
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#16c784] text-white text-[10px] font-black tracking-wide uppercase shadow-sm">
                  Maya
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#f43f5e] text-white text-[10px] font-black tracking-wide uppercase shadow-sm">
                  QRPh
                </span>
              </div>

              {/* Crisp Stylized QR Code SVG */}
              <div className="relative w-48 h-48 bg-white p-2 rounded-2xl flex items-center justify-center shadow-inner border border-gray-200">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full text-slate-900"
                  fill="currentColor"
                >
                  {/* Top-Left Position Marker */}
                  <rect x="10" y="10" width="50" height="50" rx="8" fill="none" stroke="currentColor" strokeWidth="10" />
                  <rect x="25" y="25" width="20" height="20" rx="3" fill="currentColor" />

                  {/* Top-Right Position Marker */}
                  <rect x="140" y="10" width="50" height="50" rx="8" fill="none" stroke="currentColor" strokeWidth="10" />
                  <rect x="155" y="25" width="20" height="20" rx="3" fill="currentColor" />

                  {/* Bottom-Left Position Marker */}
                  <rect x="10" y="140" width="50" height="50" rx="8" fill="none" stroke="currentColor" strokeWidth="10" />
                  <rect x="25" y="155" width="20" height="20" rx="3" fill="currentColor" />

                  {/* Timing patterns */}
                  <rect x="68" y="25" width="10" height="10" rx="2" />
                  <rect x="88" y="25" width="10" height="10" rx="2" />
                  <rect x="108" y="25" width="10" height="10" rx="2" />
                  <rect x="123" y="25" width="8" height="10" rx="2" />

                  <rect x="25" y="68" width="10" height="10" rx="2" />
                  <rect x="25" y="88" width="10" height="10" rx="2" />
                  <rect x="25" y="108" width="10" height="10" rx="2" />
                  <rect x="25" y="123" width="10" height="8" rx="2" />

                  {/* Data modules pattern */}
                  <rect x="70" y="45" width="12" height="12" rx="2" />
                  <rect x="90" y="45" width="10" height="10" rx="2" />
                  <rect x="110" y="45" width="12" height="12" rx="2" />
                  <rect x="140" y="70" width="12" height="12" rx="2" />
                  <rect x="160" y="70" width="10" height="10" rx="2" />
                  <rect x="175" y="70" width="12" height="12" rx="2" />

                  <rect x="45" y="70" width="12" height="12" rx="2" />
                  <rect x="45" y="90" width="10" height="10" rx="2" />
                  <rect x="45" y="110" width="12" height="12" rx="2" />

                  <rect x="140" y="90" width="14" height="14" rx="2" />
                  <rect x="165" y="90" width="12" height="12" rx="2" />
                  <rect x="140" y="115" width="10" height="10" rx="2" />
                  <rect x="160" y="115" width="14" height="14" rx="2" />
                  <rect x="180" y="115" width="8" height="10" rx="2" />

                  <rect x="70" y="140" width="12" height="12" rx="2" />
                  <rect x="90" y="140" width="10" height="10" rx="2" />
                  <rect x="110" y="140" width="12" height="12" rx="2" />
                  <rect x="70" y="160" width="10" height="10" rx="2" />
                  <rect x="90" y="160" width="14" height="14" rx="2" />
                  <rect x="115" y="160" width="10" height="10" rx="2" />
                  <rect x="140" y="140" width="14" height="14" rx="2" />
                  <rect x="165" y="140" width="12" height="12" rx="2" />
                  <rect x="140" y="165" width="10" height="10" rx="2" />
                  <rect x="160" y="165" width="14" height="14" rx="2" />
                  <rect x="180" y="165" width="8" height="10" rx="2" />

                  {/* Center Badge Cutout */}
                  <rect x="76" y="76" width="48" height="48" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                </svg>

                {/* Center Cute Coffee Cup Pin */}
                <div className="absolute w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f4727d] to-[#e44d5b] text-white flex items-center justify-center shadow-md">
                  <Coffee className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>

              {/* Account Label */}
              <div className="text-center mt-2">
                <div className="text-[13px] font-black text-slate-900 tracking-tight">
                  Kyle Santos
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Log Pose Server Maintenance
                </div>
              </div>
            </div>

            {/* Tap to Copy Account Number (Ideal for Mobile Users on Device) */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full bg-[#2a2d3d] hover:bg-[#34384c] border border-[#3e4358] rounded-2xl py-2.5 px-3 flex items-center justify-between text-left mb-3 transition cursor-pointer group"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Mobile / E-Wallet Number
                </div>
                <div className="text-sm font-extrabold text-white font-mono tracking-wider mt-0.5">
                  0917-000-0000
                </div>
              </div>

              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                copied 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                  : 'bg-white/10 text-gray-300 group-hover:text-white'
              }`}>
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </div>
            </button>

            {/* Action Confirmation Button */}
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f4727d] to-[#e44d5b] hover:brightness-105 active:scale-95 text-white font-black text-sm tracking-wide uppercase shadow-lg shadow-[#f4727d]/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {hasCompleted ? (
                <>
                  <Check className="w-4 h-4 stroke-[3] animate-bounce" />
                  <span>THANK YOU SO MUCH! ❤️</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  <span>I&apos;VE SENT A COFFEE ❤️</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 font-medium mt-2">
              Any amount is deeply appreciated. Thank you for keeping Log Pose online!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
