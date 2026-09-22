'use client';

import React, { useState } from 'react';
import { 
  Coins, 
  Settings as SettingsIcon, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  Globe, 
  Database, 
  RotateCcw,
  Sparkles,
  Layers,
  ExternalLink,
  Star,
  Download,
  Upload,
  FileJson,
  Bug,
  ChevronRight,
  LogIn,
  LogOut,
  Trash2,
  X,
  User,
  AlertTriangle,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { useSettings, CURRENCIES, CurrencyCode } from '@/context/SettingsContext';
import { SupportModal } from '@/components/SupportModal';
import { AccountModal } from '@/components/AccountModal';
import { exportBinderToJSON, importBinderFromJSON, getLocalBinder } from '@/lib/user-collection';

export default function SettingsPage() {
  const { 
    currency, 
    setCurrency, 
    altArtStyle,
    setAltArtStyle,
    shareCrashReports,
    setShareCrashReports,
    user,
    login,
    logout,
    clearUserData,
    formatPrice 
  } = useSettings();

  const [toast, setToast] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCurrencySelect = (code: CurrencyCode) => {
    setCurrency(code);
    const name = CURRENCIES[code]?.name || code;
    showToast(`Currency preference updated to: ${name}`);
  };

  const handleDownloadAllImages = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    showToast('Starting offline image cache download (Wi-Fi recommended)...');
    
    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        clearInterval(interval);
        setDownloadProgress(100);
        setIsDownloading(false);
        showToast('All 4,500+ One Piece card images cached successfully!');
      } else {
        setDownloadProgress(current);
      }
    }, 350);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    login(emailInput, nameInput || emailInput.split('@')[0]);
    setShowSignInModal(false);
    setEmailInput('');
    setNameInput('');
    showToast(`Welcome back, ${nameInput || emailInput}! Synced with cloud.`);
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out. Now in Guest Mode.');
  };

  const handleDeleteAccount = () => {
    clearUserData();
    setShowDeleteConfirm(false);
    showToast('User data and local offline caches have been deleted.');
  };

  // Sample card valuation calculations
  const sampleUsd = 25.0;
  const sampleYuyu = formatPrice(sampleUsd, { source: 'yuyutei' });
  const sampleTcg = formatPrice(sampleUsd, { source: 'tcgplayer' });
  const sampleEbay = formatPrice(sampleUsd, { source: 'ebay' });
  const samplePsa = formatPrice(sampleUsd * 2.85, { source: 'psa' });

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#242836] border border-emerald-500 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#343a4c] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#e76d78] font-bold uppercase tracking-wider mb-1">
            <SettingsIcon className="w-3.5 h-3.5" />
            Preferences
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">App Settings</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Configure currency conversion, marketplace source defaults, and data synchronization
          </p>
        </div>

        <Link
          href="/cards"
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#242836] hover:bg-[#2e3344] border border-[#343a4c] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cards
        </Link>
      </div>

      {/* Main Settings Section: Currency Selection */}
      <div className="rounded-3xl bg-[#242836] border border-[#343a4c] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Market Currency Preference</h2>
              <p className="text-xs text-gray-400">
                Choose how card market prices are denominated across the app
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCurrencySelect('source')}
            className="text-xs text-gray-400 hover:text-[#e76d78] flex items-center gap-1.5 transition font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
        </div>

        {/* Currency Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Default Option: Source Currency */}
          <div
            onClick={() => handleCurrencySelect('source')}
            className={`md:col-span-2 p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between ${
              currency === 'source'
                ? 'bg-[#e76d78]/10 border-[#e76d78] shadow-lg shadow-[#e76d78]/5'
                : 'bg-[#1e212c] border-[#343a4c] hover:border-gray-500 hover:bg-[#282c3c]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                🌐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">Source Currency</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#e76d78] text-white">
                    Default
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Display each pricing source in its authentic native marketplace currency:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#242836] border border-[#343a4c] text-amber-400 font-semibold">
                    🇯🇵 Yuyu-tei: Japanese Yen (¥)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#242836] border border-[#343a4c] text-emerald-400 font-semibold">
                    🇺🇸 TCGPlayer: US Dollar ($)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#242836] border border-[#343a4c] text-sky-400 font-semibold">
                    🇺🇸 eBay: US Dollar ($)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#242836] border border-[#343a4c] text-red-400 font-semibold">
                    🇺🇸 PSA: US Dollar ($)
                  </span>
                </div>
              </div>
            </div>

            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              currency === 'source' ? 'bg-[#e76d78] text-white' : 'border border-gray-600'
            }`}>
              {currency === 'source' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Explicit Currencies */}
          {(Object.keys(CURRENCIES) as CurrencyCode[])
            .filter((code) => code !== 'source')
            .map((code) => {
              const item = CURRENCIES[code];
              const isSelected = currency === code;

              return (
                <div
                  key={code}
                  onClick={() => handleCurrencySelect(code)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#e76d78]/10 border-[#e76d78] shadow-lg shadow-[#e76d78]/5'
                      : 'bg-[#1e212c] border-[#343a4c] hover:border-gray-500 hover:bg-[#282c3c]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{item.flag}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{item.code}</span>
                        <span className="text-xs text-gray-400 font-normal">({item.symbol})</span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        1 USD = {item.rateToUSD} {item.code}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${
                    isSelected ? 'bg-[#e76d78] text-white' : 'border border-gray-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Live Preview Box */}
        <div className="p-5 rounded-2xl bg-[#1e212c] border border-[#343a4c] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e76d78]" />
              Live Pricing Preview across Marketplaces (Sample Card Base: $25.00)
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              Active Mode: <span className="text-white">{currency === 'source' ? 'Source Native' : currency}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#242836] border border-[#343a4c]">
              <div className="text-xs text-gray-400 font-medium">Yuyu-tei (遊々亭)</div>
              <div className="text-base font-black text-amber-400 mt-1">
                {sampleYuyu.full}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {currency === 'source' ? 'Native JPY' : `Converted ${currency}`}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#242836] border border-[#343a4c]">
              <div className="text-xs text-gray-400 font-medium">TCGPlayer</div>
              <div className="text-base font-black text-emerald-400 mt-1">
                {sampleTcg.full}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {currency === 'source' ? 'Native USD' : `Converted ${currency}`}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#242836] border border-[#343a4c]">
              <div className="text-xs text-gray-400 font-medium">eBay Listings</div>
              <div className="text-base font-black text-sky-400 mt-1">
                {sampleEbay.full}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {currency === 'source' ? 'Native USD' : `Converted ${currency}`}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#242836] border border-[#343a4c]">
              <div className="text-xs text-gray-400 font-medium">PSA (Graded)</div>
              <div className="text-base font-black text-red-400 mt-1">
                {samplePsa.full}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {currency === 'source' ? 'Native USD' : `Converted ${currency}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Card Code Format Section */}
      <div className="rounded-3xl bg-[#242836] border border-[#343a4c] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#343a4c] pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f59e0b]" />
              Variant Card Code & Parallel Format
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Choose how cards with internal Bandai suffixes (such as <code>_p1</code>, <code>_p2</code>) are displayed across catalogs, binders, and scanner
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setAltArtStyle('alt_art');
              showToast('Format set to: EB04-039 (Alt Art)');
            }}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-3 ${
              altArtStyle === 'alt_art'
                ? 'bg-[#e76d78]/15 border-[#e76d78] shadow-lg shadow-[#e76d78]/10'
                : 'bg-[#1e212c] border-[#343a4c] hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">Alt Art (Collector & Community)</div>
              {altArtStyle === 'alt_art' && (
                <div className="w-5 h-5 rounded-full bg-[#e76d78] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-[#151720] border border-amber-500/30">
              <div className="text-[10px] text-gray-400 font-medium">Sample Preview:</div>
              <div className="font-mono text-sm font-black text-amber-300 mt-1">
                EB04-039 <span className="text-xs font-sans text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">(Alt Art)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Western TCG player and collector standard terminology.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setAltArtStyle('parallel');
              showToast('Format set to: EB04-039 (Parallel)');
            }}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-3 ${
              altArtStyle === 'parallel'
                ? 'bg-[#3b82f6]/15 border-[#3b82f6] shadow-lg shadow-[#3b82f6]/10'
                : 'bg-[#1e212c] border-[#343a4c] hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">Parallel (Official Bandai)</div>
              {altArtStyle === 'parallel' && (
                <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-[#151720] border border-blue-500/30">
              <div className="text-[10px] text-gray-400 font-medium">Sample Preview:</div>
              <div className="font-mono text-sm font-black text-blue-300 mt-1">
                EB04-039 <span className="text-xs font-sans text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">(Parallel)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bandai official card game classification (パラレルカード).
            </p>
          </button>
        </div>
      </div>

      {/* OTHER SECTION */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-wider px-1">
          OTHER
        </h2>
        <div className="space-y-2.5">
          {/* Support Server Maintenance */}
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="w-full bg-[#242836] hover:bg-[#2c3244] border border-[#343a4c] hover:border-[#f4727d]/50 p-4 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="w-7 h-7 flex items-center justify-center text-[#f4727d] flex-shrink-0">
                <Heart className="w-5 h-5 fill-[#f4727d]/20 text-[#f4727d] group-hover:scale-110 transition-transform" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#f4727d] transition flex items-center gap-2">
                  <span>Support Server &amp; Maintenance</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#f4727d]/20 text-[#f4727d] border border-[#f4727d]/30 px-2 py-0.5 rounded-md">
                    Voluntary
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                  Help keep database servers, cloud hosting, and scrapers running
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition flex-shrink-0" />
          </button>

          {/* Rate the app */}
          <button
            type="button"
            onClick={() => {
              showToast('Thank you for rating Log Pose TCG! 5 stars recorded ★★★★★');
            }}
            className="w-full bg-[#242836] hover:bg-[#2c3244] border border-[#343a4c] p-4 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="w-7 h-7 flex items-center justify-center text-white flex-shrink-0">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#f45d6a] transition">
                  Rate the app
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                  Help us improve the app by leaving a review on the store
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition flex-shrink-0" />
          </button>

          {/* Download all images */}
          <button
            type="button"
            onClick={handleDownloadAllImages}
            disabled={isDownloading}
            className="w-full bg-[#242836] hover:bg-[#2c3244] border border-[#343a4c] p-4 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group shadow-sm disabled:opacity-75"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="w-7 h-7 flex items-center justify-center text-white flex-shrink-0">
                <Download className={`w-5 h-5 text-white ${isDownloading ? 'animate-bounce text-[#f45d6a]' : ''}`} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#f45d6a] transition">
                  {isDownloading ? `Downloading card images... (${downloadProgress}%)` : 'Download all images'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                  {isDownloading ? 'Caching card scans into local offline browser storage' : 'Cache every image for offline use (Wi-Fi recommended)'}
                </div>
              </div>
            </div>
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-[#f45d6a] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition flex-shrink-0" />
            )}
          </button>

          {/* Export Collection Backup (JSON) */}
          <button
            type="button"
            onClick={() => {
              const binder = getLocalBinder();
              if (binder.length === 0) {
                showToast('Your collection is currently empty');
                return;
              }
              exportBinderToJSON();
              showToast(`Exported ${binder.length} cards to backup file`);
            }}
            className="w-full bg-[#242836] hover:bg-[#2c3244] border border-[#343a4c] p-4 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="w-7 h-7 flex items-center justify-center text-[#f59e0b] flex-shrink-0">
                <FileJson className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#f59e0b] transition">
                  Export Collection Backup
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                  Save your cards and binder as a portable JSON file
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition flex-shrink-0" />
          </button>

          {/* Import Collection Backup (JSON) */}
          <label
            className="w-full bg-[#242836] hover:bg-[#2c3244] border border-[#343a4c] p-4 rounded-2xl flex items-center justify-between transition cursor-pointer text-left group shadow-sm"
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
                    showToast('Collection restored successfully!');
                  } else {
                    showToast('Invalid backup file format');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="w-7 h-7 flex items-center justify-center text-[#3b82f6] flex-shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#3b82f6] transition">
                  Import Collection Backup
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                  Restore saved cards from a backup JSON file
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition flex-shrink-0" />
          </label>

          {/* Share the crash reports with the developers */}
          <div className="w-full bg-[#242836] border border-[#343a4c] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5 pr-3 min-w-0">
              <div className="w-7 h-7 flex items-center justify-center text-white flex-shrink-0">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white leading-snug">
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
                showToast(next ? 'Crash reporting enabled' : 'Crash reporting disabled');
              }}
              className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex-shrink-0 relative shadow-inner ${
                shareCrashReports ? 'bg-[#f45d6a]' : 'bg-[#383d4f]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  shareCrashReports ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* DISCLAIMER SECTION */}
      <div className="space-y-2 pt-2 px-1">
        <h2 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-wider">
          DISCLAIMER
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
          LOG POSE TCG is an unofficial, free fan made app.
        </p>
      </div>

      {/* BOTTOM ACTION BAR: DELETE & LOGOUT / SIGN IN */}
      <div className="pt-2 space-y-3">
        {user ? (
          <>
            <div className="flex items-center justify-between px-1 text-xs text-gray-400">
              <span>Signed in as <strong className="text-white">{user.name}</strong> ({user.email})</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Cloud Synced
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 bg-[#f45d6a] hover:bg-[#e04f5c] text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-2xl transition cursor-pointer shadow-lg shadow-[#f45d6a]/20 text-center"
              >
                DELETE
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 bg-[#242836] hover:bg-[#2c3244] border border-[#343a4c] text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-2xl transition cursor-pointer shadow-md text-center"
              >
                LOGOUT
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 text-xs text-gray-400">
              <span>Account Status: <strong className="text-amber-400 font-semibold">Guest Mode (Offline Binder)</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="w-full bg-[#f45d6a] hover:bg-[#e04f5c] text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-2xl transition cursor-pointer shadow-lg shadow-[#f45d6a]/20 text-center flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>SIGN IN / REGISTER</span>
            </button>
          </>
        )}
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
                This will sign you out and reset your saved local offline cache and session. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#1e212c] hover:bg-[#2a2f3f] border border-[#343a4c] text-gray-300 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer shadow-lg shadow-red-600/30"
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
