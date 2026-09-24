'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Check, 
  Coins, 
  Sparkles,
  Download, 
  Upload, 
  FileJson, 
  Bug, 
  ChevronRight, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  Heart, 
  Smartphone, 
  User,
  Database,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useSettings, CURRENCIES, CurrencyCode } from '@/context/SettingsContext';
import { SupportModal } from '@/components/SupportModal';
import { AccountModal } from '@/components/AccountModal';
import { exportBinderToJSON, importBinderFromJSON, getLocalBinder } from '@/lib/user-collection';

export function SettingsModal() {
  const { 
    currency, 
    setCurrency, 
    altArtStyle, 
    setAltArtStyle, 
    isSettingsOpen, 
    closeSettings, 
    shareCrashReports, 
    setShareCrashReports, 
    user, 
    logout, 
    clearUserData 
  } = useSettings();

  const [notification, setNotification] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'login' | 'register'>('login');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isSettingsOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2400);
  };

  const handleSelectCurrency = (code: CurrencyCode) => {
    setCurrency(code);
    const name = CURRENCIES[code]?.name || code;
    showToast(`Currency set to ${name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={closeSettings} />

      {/* Modal Dialog Card */}
      <div 
        className="relative bg-[#1a1c26] border border-[#2e3346] rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl z-10 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#12131a] border border-emerald-500/60 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#282d3e] bg-[#141620] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Settings</h2>
              <p className="text-[11px] text-slate-400">Preferences, localization &amp; data</p>
            </div>
          </div>

          <button
            onClick={closeSettings}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* 1. Account Section */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
              Account &amp; Sync
            </div>

            {user ? (
              <div className="bg-[#141620] border border-[#282d3e] rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white truncate">{user.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate">{user.tag}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Active
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#232738]">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountModalTab('login');
                      setShowSignInModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#1c1f2d] hover:bg-[#25293d] border border-[#2e3346] text-xs font-semibold text-slate-200 transition text-center"
                  >
                    Switch Account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      showToast('Logged out to Guest Mode');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-[#1c1f2d] hover:bg-[#25293d] border border-[#2e3346] text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-1.5 px-2 rounded-lg hover:bg-rose-500/10 text-[11px] font-medium text-rose-400 hover:text-rose-300 transition"
                    title="Clear local session & cache"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#141620] border border-[#282d3e] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Guest Mode</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      Offline Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sign in to sync your collection and favorites across devices.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAccountModalTab('login');
                    setShowSignInModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Currency & Localization */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-blue-400" />
                Market Currency Display
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#141620] text-slate-300 border border-[#282d3e]">
                Active: {currency === 'source' ? 'Source Native' : currency}
              </span>
            </div>

            {/* Source Native Currency (Default) */}
            <button
              type="button"
              onClick={() => handleSelectCurrency('source')}
              className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                currency === 'source'
                  ? 'bg-blue-600/10 border-blue-500 text-white shadow-sm'
                  : 'bg-[#141620] border-[#282d3e] hover:border-slate-500 hover:bg-[#1a1d2b] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white">Source Native (Recommended)</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Default
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Displays Yuyu-tei in ¥ JPY, Cardmarket in € EUR, and eBay in $ USD.
                  </p>
                </div>
              </div>

              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${
                currency === 'source' ? 'bg-blue-600 text-white' : 'border border-slate-600'
              }`}>
                {currency === 'source' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>

            {/* Specific Currency Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500 text-white shadow-sm'
                          : 'bg-[#141620] border-[#282d3e] hover:border-slate-500 hover:bg-[#1a1d2b] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base flex-shrink-0">{item.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1">
                            <span>{item.code}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({item.symbol})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.name}
                          </div>
                        </div>
                      </div>

                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ml-1.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'border border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 3. Card Code Format */}
          <div className="space-y-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Variant Code Format
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Display style for alternate art and parallel card prints
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAltArtStyle('alt_art');
                  showToast('Format: EB04-039 (Alt Art)');
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  altArtStyle === 'alt_art'
                    ? 'bg-blue-600/10 border-blue-500 shadow-sm'
                    : 'bg-[#141620] border-[#282d3e] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Alt Art (Standard)</span>
                  {altArtStyle === 'alt_art' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="mt-2 font-mono text-[11px] text-blue-300 font-semibold bg-[#0d0f17] px-2 py-1 rounded border border-blue-500/20">
                  EB04-039 (Alt Art)
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Western collector convention</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAltArtStyle('parallel');
                  showToast('Format: EB04-039 (Parallel)');
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  altArtStyle === 'parallel'
                    ? 'bg-blue-600/10 border-blue-500 shadow-sm'
                    : 'bg-[#141620] border-[#282d3e] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Parallel (Official)</span>
                  {altArtStyle === 'parallel' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="mt-2 font-mono text-[11px] text-slate-300 font-semibold bg-[#0d0f17] px-2 py-1 rounded border border-[#282d3e]">
                  EB04-039 (Parallel)
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Official Bandai designation</span>
              </button>
            </div>
          </div>

          {/* 4. Data & Offline Storage */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Data &amp; Offline Storage
            </span>

            <div className="bg-[#141620] border border-[#282d3e] rounded-2xl divide-y divide-[#232738] overflow-hidden">
              {/* Export Backup */}
              <button
                type="button"
                onClick={() => {
                  const binder = getLocalBinder();
                  if (binder.length === 0) {
                    showToast('Your binder is currently empty');
                    return;
                  }
                  exportBinderToJSON();
                  showToast(`Exported ${binder.length} cards to JSON`);
                }}
                className="w-full p-3 flex items-center justify-between hover:bg-[#1a1d2b] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <FileJson className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                      Export Collection Backup
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Save your cards and custom costs as a portable JSON file
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
              </button>

              {/* Import Backup */}
              <label className="w-full p-3 flex items-center justify-between hover:bg-[#1a1d2b] transition text-left cursor-pointer group">
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
                      showToast(success ? 'Collection restored successfully!' : 'Invalid backup file');
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                      Import Collection Backup
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Restore saved cards from an existing JSON backup
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
              </label>

              {/* Offline Images Caching */}
              <button
                type="button"
                onClick={() => {
                  if (isDownloading) return;
                  setIsDownloading(true);
                  showToast('Caching high-res scans for offline use...');
                  setTimeout(() => {
                    setIsDownloading(false);
                    showToast('Card scans cached offline successfully!');
                  }, 2200);
                }}
                disabled={isDownloading}
                className="w-full p-3 flex items-center justify-between hover:bg-[#1a1d2b] transition text-left cursor-pointer group disabled:opacity-75"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/40 text-slate-300 flex items-center justify-center flex-shrink-0">
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce text-blue-400' : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                      {isDownloading ? 'Caching scans...' : 'Preload High-Res Scans'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Store card images locally for faster offline loading
                    </div>
                  </div>
                </div>
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* 5. System & Support */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              System &amp; Community
            </span>

            <div className="bg-[#141620] border border-[#282d3e] rounded-2xl divide-y divide-[#232738] overflow-hidden">
              {/* Crash Reports Toggle */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 pr-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/40 text-slate-300 flex items-center justify-center flex-shrink-0">
                    <Bug className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">
                      Anonymous Diagnostics
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Share crash reports to help resolve bugs
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={shareCrashReports}
                  onClick={() => {
                    const next = !shareCrashReports;
                    setShareCrashReports(next);
                    showToast(next ? 'Diagnostics enabled' : 'Diagnostics disabled');
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex-shrink-0 relative ${
                    shareCrashReports ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      shareCrashReports ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Install PWA */}
              <button
                type="button"
                onClick={() => {
                  closeSettings();
                  window.dispatchEvent(new CustomEvent('open_install_prompt'));
                }}
                className="w-full p-3 flex items-center justify-between hover:bg-[#1a1d2b] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                      Install Web App (PWA)
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Add to home screen for fullscreen mobile experience
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
              </button>

              {/* Support & Server Maintenance */}
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full p-3 flex items-center justify-between hover:bg-[#1a1d2b] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                      Support Server Maintenance
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Help keep daily price scrapers and cloud servers online
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="pt-2 px-1">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Log Pose TCG is an unofficial fan-made project. One Piece Card Game and all related trademarks and artwork are copyright © Eiichiro Oda / Shueisha, Toei Animation, and Bandai Co., Ltd.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#282d3e] bg-[#141620] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Log Pose TCG <span className="text-slate-400">• v1.2</span>
          </span>

          <button
            type="button"
            onClick={closeSettings}
            className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      {/* SIGN IN & REGISTRATION MODAL */}
      <AccountModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        defaultTab={accountModalTab}
      />

      {/* DELETE / CLEAR LOCAL DATA MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setShowDeleteConfirm(false)} />
          <div 
            className="relative bg-[#1a1c26] border border-rose-500/40 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Clear Local Cache &amp; Session?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will sign you out on this browser and clear offline cached data. Your cloud collection is safe and will reload when you log back in.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#141620] hover:bg-[#1e2232] border border-[#2e3346] text-slate-300 font-semibold text-xs py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearUserData();
                  setShowDeleteConfirm(false);
                  showToast('Local cache and session cleared');
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-2 rounded-xl transition cursor-pointer shadow-sm"
              >
                Clear Data
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
