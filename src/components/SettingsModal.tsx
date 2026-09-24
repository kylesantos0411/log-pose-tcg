'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Check, 
  DollarSign, 
  Coins, 
  RefreshCw, 
  HelpCircle, 
  Globe, 
  Sparkles,
  Eye,
  EyeOff,
  Star,
  Download,
  Upload,
  FileJson,
  Bug,
  ChevronRight,
  LogIn,
  LogOut,
  AlertTriangle,
  Heart,
  Smartphone
} from 'lucide-react';
import { useSettings, CURRENCIES, CurrencyCode, PriceSource } from '@/context/SettingsContext';
import { SupportModal } from '@/components/SupportModal';
import { AccountModal } from '@/components/AccountModal';
import { exportBinderToJSON, importBinderFromJSON, getLocalBinder } from '@/lib/user-collection';

export function SettingsModal() {
  const { 
    currency, 
    setCurrency, 
    altArtStyle,
    setAltArtStyle,
    enabledPriceSources,
    togglePriceSource,
    isSettingsOpen, 
    closeSettings, 
    formatPrice,
    shareCrashReports,
    setShareCrashReports,
    user,
    login,
    logout,
    clearUserData
  } = useSettings();

  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isSettingsOpen) return null;

  // Sample card price of $25.00 for live preview
  const sampleUsd = 25.0;
  const sampleYuyu = formatPrice(sampleUsd, { source: 'yuyutei' });
  const sampleCardmarket = formatPrice(sampleUsd, { source: 'cardmarket' });
  const sampleEbay = formatPrice(sampleUsd, { source: 'ebay' });
  const sampleSnkrdunk = formatPrice(sampleUsd, { source: 'snkrdunk' });
  const samplePsa = formatPrice(sampleUsd * 2.85, { source: 'psa' });

  const handleSelectCurrency = (code: CurrencyCode) => {
    setCurrency(code);
    const name = CURRENCIES[code]?.name || code;
    setCopiedNotification(`Currency set to ${name}`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={closeSettings} />

      {/* Modal Dialog Card */}
      <div 
        className="relative bg-[#242836] border border-[#34384c] rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast alert */}
        {copiedNotification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#1e212c] border border-emerald-500 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5 animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#34384c] bg-[#1e212c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e76d78]/15 border border-[#e76d78]/30 flex items-center justify-center text-[#e76d78]">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Application Settings</h2>
              <p className="text-[11px] text-gray-400">Configure currency display &amp; preferences</p>
            </div>
          </div>

          <button
            onClick={closeSettings}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Preferred Currency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
                  Market Currency Display
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Choose your preferred currency. The default uses each source's native currency.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1e212c] text-gray-300 border border-[#34384c]">
                Active: {currency === 'source' ? 'Source Currency' : currency}
              </span>
            </div>

            {/* Currency Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Option 1: Source Currency (Default) */}
              <button
                type="button"
                onClick={() => handleSelectCurrency('source')}
                className={`sm:col-span-2 p-3 rounded-2xl border text-left transition flex items-start justify-between cursor-pointer ${
                  currency === 'source'
                    ? 'bg-[#e76d78]/15 border-[#e76d78] shadow-md'
                    : 'bg-[#1e212c] border-[#32384a] hover:border-gray-500 hover:bg-[#282c3a]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-lg flex-shrink-0 shadow">
                    🌐
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Source Currency</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#e76d78] text-white">
                        Default
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Uses each marketplace original currency: <strong className="text-[#f59e0b] font-semibold">Yuyu-tei (¥ JPY)</strong>, <strong className="text-sky-400 font-semibold">Cardmarket (€ EUR)</strong>, and <strong className="text-emerald-400 font-semibold">eBay, PSA ($ USD)</strong>.
                    </p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  currency === 'source' ? 'bg-[#e76d78] text-white' : 'border border-gray-600'
                }`}>
                  {currency === 'source' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Other Currencies */}
              {(Object.keys(CURRENCIES) as CurrencyCode[])
                .filter((code) => code !== 'source')
                .map((code) => {
                  const item = CURRENCIES[code];
                  const isSelected = currency === code;

                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelectCurrency(code)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#3b82f6]/15 border-[#3b82f6] shadow-md'
                          : 'bg-[#1e212c] border-[#32384a] hover:border-gray-500 hover:bg-[#282c3a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">{item.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{item.code}</span>
                            <span className="text-[11px] font-normal text-gray-400">({item.symbol})</span>
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {item.name}
                          </div>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${
                        isSelected ? 'bg-[#3b82f6] text-white' : 'border border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Real-Time Price Preview & Marketplace Visibility Toggles */}
          <div className="p-4 rounded-2xl bg-[#1e212c] border border-[#32384a] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e76d78]" />
                Live Price Preview &amp; Visibility
              </span>
              <span className="text-[10px] text-gray-400">
                Mode: {currency === 'source' ? 'Source Native' : `${currency} Converted`}
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              Tap any marketplace below to toggle its pricing box and chart curve on or off across the app.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
              {/* Yuyu-tei */}
              <button
                type="button"
                onClick={() => {
                  togglePriceSource('yuyutei');
                  setCopiedNotification(enabledPriceSources.yuyutei ? 'Yuyu-tei pricing hidden' : 'Yuyu-tei pricing enabled');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between items-center ${
                  enabledPriceSources.yuyutei
                    ? 'bg-[#242836] border-[#3b82f6] shadow-sm hover:border-[#60a5fa]'
                    : 'bg-[#181a24] border-dashed border-gray-700 opacity-50 hover:opacity-75'
                }`}
                title="Click to toggle Yuyu-tei"
              >
                <div className="flex items-center justify-between w-full text-[10px] text-gray-300 font-bold mb-1">
                  <div className="flex items-center gap-1.5">
                    <img src="/logos/yuyutei.png" alt="Yuyu-tei" className="w-3.5 h-3.5 object-contain rounded-full bg-white p-0.5" />
                    <span>Yuyu-tei</span>
                  </div>
                  <span className={`px-1 rounded text-[8px] font-black ${
                    enabledPriceSources.yuyutei ? 'bg-[#3b82f6]/20 text-[#60a5fa]' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {enabledPriceSources.yuyutei ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className={`text-xs sm:text-sm font-black transition ${
                  enabledPriceSources.yuyutei ? 'text-[#f59e0b]' : 'text-gray-500 line-through'
                }`}>
                  {sampleYuyu.full}
                </div>
                <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                  {enabledPriceSources.yuyutei ? <Eye className="w-2.5 h-2.5 text-[#3b82f6]" /> : <EyeOff className="w-2.5 h-2.5 text-gray-600" />}
                  <span>{enabledPriceSources.yuyutei ? 'Showing' : 'Hidden'}</span>
                </div>
              </button>

              {/* Cardmarket */}
              <button
                type="button"
                onClick={() => {
                  togglePriceSource('cardmarket');
                  setCopiedNotification(enabledPriceSources.cardmarket ? 'Cardmarket pricing hidden' : 'Cardmarket pricing enabled');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between items-center ${
                  enabledPriceSources.cardmarket
                    ? 'bg-[#242836] border-[#0284c7] shadow-sm hover:border-[#38bdf8]'
                    : 'bg-[#181a24] border-dashed border-gray-700 opacity-50 hover:opacity-75'
                }`}
                title="Click to toggle Cardmarket"
              >
                <div className="flex items-center justify-between w-full text-[10px] text-gray-300 font-bold mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src="/logos/cardmarket.svg" alt="Cardmarket" className="w-3.5 h-3.5 object-contain" />
                    <span className="truncate">Cardmarket</span>
                  </div>
                  <span className={`px-1 rounded text-[8px] font-black ${
                    enabledPriceSources.cardmarket ? 'bg-sky-500/20 text-sky-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {enabledPriceSources.cardmarket ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className={`text-xs sm:text-sm font-black transition ${
                  enabledPriceSources.cardmarket ? 'text-sky-400' : 'text-gray-500 line-through'
                }`}>
                  {sampleCardmarket.full}
                </div>
                <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                  {enabledPriceSources.cardmarket ? <Eye className="w-2.5 h-2.5 text-[#0284c7]" /> : <EyeOff className="w-2.5 h-2.5 text-gray-600" />}
                  <span>{enabledPriceSources.cardmarket ? 'Showing' : 'Hidden'}</span>
                </div>
              </button>

              {/* SNKRDUNK */}
              <button
                type="button"
                onClick={() => {
                  togglePriceSource('snkrdunk');
                  setCopiedNotification(enabledPriceSources.snkrdunk ? 'SNKRDUNK pricing hidden' : 'SNKRDUNK pricing enabled');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between items-center ${
                  enabledPriceSources.snkrdunk
                    ? 'bg-[#242836] border-[#10b981] shadow-sm hover:border-[#34d399]'
                    : 'bg-[#181a24] border-dashed border-gray-700 opacity-50 hover:opacity-75'
                }`}
                title="Click to toggle SNKRDUNK"
              >
                <div className="flex items-center justify-between w-full text-[10px] text-gray-300 font-bold mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[8px] flex items-center justify-center flex-shrink-0">
                      SD
                    </span>
                    <span className="truncate">SNKRDUNK</span>
                  </div>
                  <span className={`px-1 rounded text-[8px] font-black ${
                    enabledPriceSources.snkrdunk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {enabledPriceSources.snkrdunk ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className={`text-xs sm:text-sm font-black transition ${
                  enabledPriceSources.snkrdunk ? 'text-emerald-400' : 'text-gray-500 line-through'
                }`}>
                  {sampleSnkrdunk.full}
                </div>
                <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                  {enabledPriceSources.snkrdunk ? <Eye className="w-2.5 h-2.5 text-[#10b981]" /> : <EyeOff className="w-2.5 h-2.5 text-gray-600" />}
                  <span>{enabledPriceSources.snkrdunk ? 'Showing' : 'Hidden'}</span>
                </div>
              </button>

              {/* eBay */}
              <button
                type="button"
                onClick={() => {
                  togglePriceSource('ebay');
                  setCopiedNotification(enabledPriceSources.ebay ? 'eBay pricing hidden' : 'eBay pricing enabled');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between items-center ${
                  enabledPriceSources.ebay
                    ? 'bg-[#242836] border-[#84cc16] shadow-sm hover:border-[#a3e635]'
                    : 'bg-[#181a24] border-dashed border-gray-700 opacity-50 hover:opacity-75'
                }`}
                title="Click to toggle eBay"
              >
                <div className="flex items-center justify-between w-full text-[10px] text-gray-300 font-bold mb-1">
                  <span>eBay</span>
                  <span className={`px-1 rounded text-[8px] font-black ${
                    enabledPriceSources.ebay ? 'bg-lime-500/20 text-lime-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {enabledPriceSources.ebay ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className={`text-xs sm:text-sm font-black transition ${
                  enabledPriceSources.ebay ? 'text-[#3b82f6]' : 'text-gray-500 line-through'
                }`}>
                  {sampleEbay.full}
                </div>
                <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                  {enabledPriceSources.ebay ? <Eye className="w-2.5 h-2.5 text-[#84cc16]" /> : <EyeOff className="w-2.5 h-2.5 text-gray-600" />}
                  <span>{enabledPriceSources.ebay ? 'Showing' : 'Hidden'}</span>
                </div>
              </button>

              {/* PSA */}
              <button
                type="button"
                onClick={() => {
                  togglePriceSource('psa');
                  setCopiedNotification(enabledPriceSources.psa ? 'PSA pricing hidden' : 'PSA pricing enabled');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between items-center ${
                  enabledPriceSources.psa
                    ? 'bg-[#242836] border-[#ef4444] shadow-sm hover:border-[#f87171]'
                    : 'bg-[#181a24] border-dashed border-gray-700 opacity-50 hover:opacity-75'
                }`}
                title="Click to toggle PSA"
              >
                <div className="flex items-center justify-between w-full text-[10px] text-gray-300 font-bold mb-1">
                  <span>PSA (Slab)</span>
                  <span className={`px-1 rounded text-[8px] font-black ${
                    enabledPriceSources.psa ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {enabledPriceSources.psa ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className={`text-xs sm:text-sm font-black transition ${
                  enabledPriceSources.psa ? 'text-red-400' : 'text-gray-500 line-through'
                }`}>
                  {samplePsa.full}
                </div>
                <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                  {enabledPriceSources.psa ? <Eye className="w-2.5 h-2.5 text-[#ef4444]" /> : <EyeOff className="w-2.5 h-2.5 text-gray-600" />}
                  <span>{enabledPriceSources.psa ? 'Showing' : 'Hidden'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Parallel / Alternate Art Display Format */}
          <div className="space-y-3 pt-2 border-t border-[#34384c]">
            <div>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                Variant Card Code Format
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Choose how cards with internal <code>_p</code> suffixes are displayed across the app
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAltArtStyle('alt_art');
                  setCopiedNotification('Format: EB04-039 (Alt Art)');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  altArtStyle === 'alt_art'
                    ? 'bg-[#e76d78]/15 border-[#e76d78] shadow-md'
                    : 'bg-[#1e212c] border-[#32384a] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Alt Art (Official/Community)</span>
                  {altArtStyle === 'alt_art' && <Check className="w-3.5 h-3.5 text-[#e76d78]" />}
                </div>
                <div className="mt-2 font-mono text-[11px] text-amber-300 font-bold bg-[#151720] px-2 py-1 rounded border border-amber-500/20">
                  EB04-039 (Alt Art)
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Western collector standard
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAltArtStyle('parallel');
                  setCopiedNotification('Format: EB04-039 (Parallel)');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  altArtStyle === 'parallel'
                    ? 'bg-[#3b82f6]/15 border-[#3b82f6] shadow-md'
                    : 'bg-[#1e212c] border-[#32384a] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Parallel (Bandai)</span>
                  {altArtStyle === 'parallel' && <Check className="w-3.5 h-3.5 text-[#3b82f6]" />}
                </div>
                <div className="mt-2 font-mono text-[11px] text-blue-300 font-bold bg-[#151720] px-2 py-1 rounded border border-blue-500/20">
                  EB04-039 (Parallel)
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Official Bandai designation
                </div>
              </button>
            </div>
          </div>

          {/* Section: OTHER */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-0.5">
              OTHER
            </h3>

            <div className="space-y-2">
              {/* Support Server Maintenance */}
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] hover:border-[#f4727d]/50 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-6 h-6 flex items-center justify-center text-[#f4727d] flex-shrink-0">
                    <Heart className="w-4 h-4 fill-[#f4727d]/20 text-[#f4727d] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#f4727d] transition flex items-center gap-1.5">
                      <span>Support Server &amp; Maintenance</span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#f4727d]/20 text-[#f4727d] border border-[#f4727d]/30 px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Help keep database servers, cloud hosting, and scrapers running
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition flex-shrink-0" />
              </button>

              {/* Rate the app */}
              <button
                type="button"
                onClick={() => {
                  setCopiedNotification('Thank you for rating Log Pose TCG! 5 stars recorded ★★★★★');
                  setTimeout(() => setCopiedNotification(null), 3000);
                }}
                className="w-full bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-6 h-6 flex items-center justify-center text-white flex-shrink-0">
                    <Star className="w-4 h-4 fill-white text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#f45d6a] transition">
                      Rate the app
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Help us improve the app by leaving a review on the store
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition flex-shrink-0" />
              </button>

              {/* Download all images */}
              <button
                type="button"
                onClick={() => {
                  if (isDownloading) return;
                  setIsDownloading(true);
                  setCopiedNotification('Caching card scans offline (Wi-Fi recommended)...');
                  setTimeout(() => {
                    setIsDownloading(false);
                    setCopiedNotification('All card images cached offline!');
                    setTimeout(() => setCopiedNotification(null), 2500);
                  }, 2000);
                }}
                disabled={isDownloading}
                className="w-full bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group disabled:opacity-75"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-6 h-6 flex items-center justify-center text-white flex-shrink-0">
                    <Download className={`w-4 h-4 text-white ${isDownloading ? 'animate-bounce text-[#f45d6a]' : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#f45d6a] transition">
                      {isDownloading ? 'Caching card scans...' : 'Download all images'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Cache every image for offline use (Wi-Fi recommended)
                    </div>
                  </div>
                </div>
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-[#f45d6a] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition flex-shrink-0" />
                )}
              </button>

              {/* Export Collection Backup (JSON) */}
              <button
                type="button"
                onClick={() => {
                  const binder = getLocalBinder();
                  if (binder.length === 0) {
                    setCopiedNotification('Your binder is empty');
                    setTimeout(() => setCopiedNotification(null), 2000);
                    return;
                  }
                  exportBinderToJSON();
                  setCopiedNotification(`Exported ${binder.length} cards`);
                  setTimeout(() => setCopiedNotification(null), 2000);
                }}
                className="w-full bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-6 h-6 flex items-center justify-center text-[#f59e0b] flex-shrink-0">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#f59e0b] transition">
                      Export Collection Backup
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Save your cards and binder as a portable JSON file
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition flex-shrink-0" />
              </button>

              {/* Import Collection Backup (JSON) */}
              <label
                className="w-full bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      const success = importBinderFromJSON(text);
                      if (success) {
                        setCopiedNotification('Collection restored successfully!');
                      } else {
                        setCopiedNotification('Invalid backup file');
                      }
                      setTimeout(() => setCopiedNotification(null), 2500);
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-6 h-6 flex items-center justify-center text-[#3b82f6] flex-shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#3b82f6] transition">
                      Import Collection Backup
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Restore saved cards from a backup JSON file
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition flex-shrink-0" />
              </label>

              {/* Share the crash reports with the developers */}
              <div className="w-full bg-[#1e212c] border border-[#32384a] p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 pr-2 min-w-0">
                  <div className="w-6 h-6 flex items-center justify-center text-white flex-shrink-0">
                    <Bug className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white leading-tight">
                    Share the crash reports with the developers
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={shareCrashReports}
                  onClick={() => {
                    const next = !shareCrashReports;
                    setShareCrashReports(next);
                    setCopiedNotification(next ? 'Crash reports enabled' : 'Crash reports disabled');
                    setTimeout(() => setCopiedNotification(null), 2000);
                  }}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex-shrink-0 relative ${
                    shareCrashReports ? 'bg-[#f45d6a]' : 'bg-[#383d4f]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      shareCrashReports ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Install Log Pose App (PWA) */}
              <button
                type="button"
                onClick={() => {
                  closeSettings();
                  window.dispatchEvent(new CustomEvent('open_install_prompt'));
                }}
                className="w-full bg-gradient-to-r from-[#e76d78]/15 to-[#f59e0b]/15 hover:from-[#e76d78]/25 hover:to-[#f59e0b]/25 border border-[#e76d78]/30 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-6 h-6 flex items-center justify-center text-[#e76d78] flex-shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#e76d78] transition">
                      Install Log Pose App
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Add to your home screen for quick launch and offline access
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Section: DISCLAIMER */}
          <div className="space-y-1.5 pt-1 px-0.5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              DISCLAIMER
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              LOG POSE TCG is an unofficial, free fan made app.
            </p>
          </div>

          {/* Section: LOGOUT / SIGN IN / DELETE ACTION BUTTONS */}
          <div className="pt-2 space-y-2">
            {user ? (
              <>
                <div className="p-3 rounded-2xl bg-[#1e212c] border border-[#343a4c] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl">{user.avatar || '👒'}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{user.name}</div>
                        <div className="font-mono text-[10px] text-amber-400 truncate">{user.tag}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 truncate max-w-[120px]">
                      {user.crew}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    <span>Rank: <strong className="text-white">{user.rank}</strong></span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Account Synced
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-[#f45d6a]/20 hover:bg-[#f45d6a]/30 border border-[#f45d6a]/40 text-[#f45d6a] font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-2 rounded-xl transition cursor-pointer text-center"
                  >
                    DELETE
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSignInModal(true);
                    }}
                    className="bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/40 text-[#3b82f6] font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-2 rounded-xl transition cursor-pointer text-center"
                  >
                    SWITCH
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setCopiedNotification('Logged out to Guest Mode');
                      setTimeout(() => setCopiedNotification(null), 2500);
                    }}
                    className="bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-2 rounded-xl transition cursor-pointer text-center"
                  >
                    LOGOUT
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-gray-400 px-1">
                  Account: <strong className="text-amber-400 font-bold">Guest Mode</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSignInModal(true)}
                  className="w-full bg-[#f45d6a] hover:bg-[#e04f5c] text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>SIGN IN / REGISTER</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#34384c] bg-[#1e212c] flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-400">
            Log Pose TCG <span className="text-gray-500">• v1.0</span>
          </span>

          <button
            type="button"
            onClick={closeSettings}
            className="px-6 py-2 rounded-xl bg-[#e76d78] hover:bg-[#d45c67] text-white font-bold text-xs transition cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>

      {/* SIGN IN & REGISTRATION MODAL */}
      <AccountModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        defaultTab="register"
      />

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setShowDeleteConfirm(false)} />
          <div 
            className="relative bg-[#242836] border border-red-500/40 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">Delete Account &amp; Data?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                This will sign you out and delete your saved offline caches and local session.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#1e212c] hover:bg-[#2a2f3f] border border-[#343a4c] text-gray-300 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearUserData();
                  setShowDeleteConfirm(false);
                  setCopiedNotification('Account and local data deleted.');
                  setTimeout(() => setCopiedNotification(null), 2500);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT & MAINTENANCE MODAL */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}
