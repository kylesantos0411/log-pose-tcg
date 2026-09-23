'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Settings as SettingsIcon,
  X,
  Compass,
  Camera,
  Layers,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getLocalBinder } from '@/lib/user-collection';

import { SupportModal } from '@/components/SupportModal';
import { AccountModal } from '@/components/AccountModal';
import { LatestCardsSyncModal } from '@/components/LatestCardsSyncModal';

interface CleanHomeViewProps {
  totalCards: number;
  totalPacks: number;
  userCardsCount: number;
  featuredCards?: Array<{ id: string; name: string; imageUrl: string | null }>;
}

/* =========================================================================
   CUSTOM CLEAN SVG ICONS (Minimalist, Bold White, Clean Lines)
   ========================================================================= */

// Trading Cards Stack Icon for "Cards"
function CardsCatalogIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Back card slightly tilted */}
      <rect 
        x="3.2" 
        y="3.8" 
        width="11" 
        height="16.2" 
        rx="2.2" 
        transform="rotate(-12 8.7 12)" 
        fill="currentColor" 
        opacity="0.8" 
      />
      {/* Front card */}
      <rect 
        x="8.5" 
        y="4.2" 
        width="12" 
        height="16.5" 
        rx="2.4" 
        fill="currentColor" 
      />
      {/* Subtle center emblem */}
      <circle cx="14.5" cy="12.5" r="2.4" fill="#242634" />
    </svg>
  );
}

// 4-Quadrant Booster Packs / Sets Grid Icon for "Sets"
function SetsGridIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

// Two Playing Cards with Diamond for "Decks"
function CardsDeckIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect 
        x="3" 
        y="4" 
        width="11" 
        height="16" 
        rx="2" 
        transform="rotate(-15 8.5 12)" 
        fill="currentColor" 
        opacity="0.85" 
      />
      <rect 
        x="8.5" 
        y="4.5" 
        width="12" 
        height="16.5" 
        rx="2.2" 
        fill="currentColor" 
      />
      <polygon 
        points="14.5,10.2 16.8,12.8 14.5,15.4 12.2,12.8" 
        fill="#242634" 
      />
    </svg>
  );
}

// Solid 5-pointed Star for "Favorites / Collection"
function StarFavoriteIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" />
    </svg>
  );
}

// 3-Bar Chart Icon for "Market / Stats"
function StatsChartIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="11" width="4.5" height="10" rx="1" />
      <rect x="9.8" y="5.5" width="4.5" height="15.5" rx="1" />
      <rect x="16.5" y="14" width="4.5" height="7" rx="1" />
    </svg>
  );
}

// Two Users Silhouette for "Friends"
function FriendsCommunityIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M2.5 19.5 C2.5 15.8 5 13.8 8 13.8 C11 13.8 13.5 15.8 13.5 19.5 Z" />
      <circle cx="16.5" cy="8" r="3.2" />
      <path d="M12.5 19.5 C12.5 16.5 14.5 13.8 16.5 13.8 C19.5 13.8 22 15.8 22 19.5 Z" />
    </svg>
  );
}

// Camera with Star Sparkle inside Lens for "Scan"
function CameraScanIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4 7 C2.9 7 2 7.9 2 9 L2 18 C2 19.1 2.9 20 4 20 L20 20 C21.1 20 22 19.1 22 18 L22 9 C22 7.9 21.1 7 20 7 L16.8 7 L15.3 5 C15 4.5 14.3 4 13.6 4 L10.4 4 C9.7 4 9 4.5 8.7 5 L7.2 7 Z" />
      <circle cx="12" cy="13.5" r="4.2" fill="#242634" />
      <path 
        d="M12 11.2 C12.2 12.5, 13 13.3, 14.3 13.5 C13 13.7, 12.2 14.5, 12 15.8 C11.8 14.5, 11 13.7, 9.7 13.5 C11 13.3, 11.8 12.5, 12 11.2 Z" 
        fill="white" 
      />
    </svg>
  );
}

// Solid Settings Gear Icon for "Settings"
function SettingsGearIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 15.5 A3.5 3.5 0 1 0 12 8.5 A3.5 3.5 0 0 0 12 15.5 Z" />
      <path d="M19.4 13 C19.5 12.7 19.5 12.3 19.5 12 C19.5 11.7 19.5 11.3 19.4 11 L21.5 9.3 C21.7 9.1 21.8 8.8 21.6 8.5 L19.6 5 C19.5 4.8 19.2 4.7 18.9 4.8 L16.4 5.8 C15.9 5.4 15.3 5.1 14.7 4.8 L14.3 2.2 C14.3 1.9 14.1 1.7 13.8 1.7 L9.8 1.7 C9.5 1.7 9.3 1.9 9.3 2.2 L8.9 4.8 C8.3 5.1 7.7 5.4 7.2 5.8 L4.7 4.8 C4.4 4.7 4.1 4.8 4 5 L2 8.5 C1.8 8.8 1.9 9.1 2.1 9.3 L4.2 11 C4.1 11.3 4.1 11.7 4.1 12 C4.1 12.3 4.1 12.7 4.2 13 L2.1 14.7 C1.9 14.9 1.8 15.2 2 15.5 L4 19 C4.1 19.2 4.4 19.3 4.7 19.2 L7.2 18.2 C7.7 18.6 8.3 18.9 8.9 19.2 L9.3 21.8 C9.3 22.1 9.5 22.3 9.8 22.3 L13.8 22.3 C14.1 22.3 14.3 22.1 14.3 21.8 L14.7 19.2 C15.3 18.9 15.9 18.6 16.4 18.2 L18.9 19.2 C19.2 19.3 19.5 19.2 19.6 19 L21.6 15.5 C21.8 15.2 21.7 14.9 21.5 14.7 L19.4 13 Z" />
    </svg>
  );
}

export function CleanHomeView({ 
  totalCards, 
  totalPacks, 
  userCardsCount, 
  featuredCards = [] 
}: CleanHomeViewProps) {
  const router = useRouter();
  const { user, openSettings } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLatestSyncModal, setShowLatestSyncModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(userCardsCount);

  useEffect(() => {
    const updateCount = () => {
      try {
        const cards = getLocalBinder(user?.tag || null);
        const total = cards.reduce((acc, c) => acc + (c.quantity || 1), 0);
        setDisplayCount(total);
      } catch {
        setDisplayCount(0);
      }
    };
    updateCount();
    window.addEventListener('logpose_collection_updated', updateCount);
    window.addEventListener('logpose_auth_changed', updateCount);
    return () => {
      window.removeEventListener('logpose_collection_updated', updateCount);
      window.removeEventListener('logpose_auth_changed', updateCount);
    };
  }, [user?.tag]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeSearch.trim()) {
      router.push(`/cards?q=${encodeURIComponent(homeSearch.trim())}`);
    } else {
      router.push('/cards');
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto py-2 sm:py-5 px-3 sm:px-4 space-y-3.5 select-none font-sans">
      {/* =========================================================================
          1. MINIMALIST TOP HEADER (Avatar Left, LOG POSE Center, Reload & Search Right)
         ========================================================================= */}
      <div className="flex items-center justify-between pt-1 pb-1">
        {/* Left: Circular Straw Hat / Account Button */}
        <button
          type="button"
          onClick={() => setShowAccountModal(true)}
          title={user ? `${user.name} (${user.tag})` : 'Account & Login'}
          className="w-10 h-10 rounded-full bg-[#f4727d]/90 hover:bg-[#e65a66] flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer relative overflow-hidden flex-shrink-0"
        >
          {user ? (
            <span className="font-black text-xs text-white uppercase">
              {user.name.slice(0, 2)}
            </span>
          ) : (
            <div className="w-6 h-6 rounded-full bg-amber-400/90 border border-amber-600/30 flex items-center justify-center shadow-inner relative">
              <span className="w-full h-1 bg-red-600 absolute top-2.5 rounded-full" />
              <span className="text-[10px]">👒</span>
            </div>
          )}
          {user && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1f212c]" />
          )}
        </button>

        {/* Center: Authentic LOG POSE Title with Compass Needle */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
          <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#f4727d]" />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase">
            LOG POSE
          </h1>
        </Link>

        {/* Right Actions: Reload & Search */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Catalog Data"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition active:scale-90 cursor-pointer"
          >
            <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          
          <button
            type="button"
            onClick={() => setShowSearchBar(!showSearchBar)}
            title="Search Cards"
            className={`p-2 rounded-full transition active:scale-90 cursor-pointer ${
              showSearchBar ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expandable Clean Search Bar */}
      {showSearchBar && (
        <form onSubmit={handleSearchSubmit} className="relative animate-fadeIn">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={homeSearch}
            onChange={(e) => setHomeSearch(e.target.value)}
            placeholder="Search card name, code, or leader..."
            className="w-full bg-[#242634] border border-[#34384c] focus:border-[#3b82f6] rounded-2xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none transition shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {homeSearch && (
              <button
                type="button"
                onClick={() => setHomeSearch('')}
                className="text-gray-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-2.5 py-1 rounded-xl bg-[#3b82f6] text-white text-xs font-bold transition cursor-pointer"
            >
              Go
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          2. SLIM BANNER: "View latest cards (OP-17 & OP-18)"
         ========================================================================= */}
      <button
        type="button"
        onClick={() => setShowLatestSyncModal(true)}
        className="w-full rounded-2xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/50 px-4 py-3 sm:py-3.5 flex items-center justify-between transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-left group"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 stroke-[2.2] group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            View the latest added cards
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* =========================================================================
          3. CLEAN FEATURE TILES GRID (Big Bold White Icons + Simple Labels)
         ========================================================================= */}
      
      {/* Row 1: 2 Large Cards (Cards & Sets) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* Cards (All Cards Catalog & Search) */}
        <Link
          href="/cards"
          className="group rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-5 sm:p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[140px] sm:min-h-[160px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <CardsCatalogIcon className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <span className="text-sm sm:text-base font-bold text-white tracking-wide">
            Cards
          </span>
        </Link>

        {/* Sets (All Booster Packs & Starter Decks) */}
        <Link
          href="/sets"
          className="group rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-5 sm:p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[140px] sm:min-h-[160px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <SetsGridIcon className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <span className="text-sm sm:text-base font-bold text-white tracking-wide">
            Sets
          </span>
        </Link>
      </div>

      {/* Row 2: 3 Cards (Decks, Collection, Market) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Decks (Deck Builder & Meta Decks) */}
        <Link
          href="/decks"
          className="group rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-3.5 sm:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[110px] sm:min-h-[125px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <CardsDeckIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Decks
          </span>
        </Link>

        {/* Collection (My Binder & Saved Cards) */}
        <Link
          href="/collection"
          className="group rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-3.5 sm:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[110px] sm:min-h-[125px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <StarFavoriteIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Collection
          </span>
        </Link>

        {/* Market (Price Trends & Top Valued Cards) */}
        <Link
          href="/cards?sort=price_desc"
          className="group rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-3.5 sm:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[110px] sm:min-h-[125px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <StatsChartIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Market
          </span>
        </Link>
      </div>

      {/* Row 3: 3 Cards (Friends, Scan, Settings) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Friends (Trading & Community) */}
        <Link
          href="/friends"
          className="group rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-3.5 sm:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[110px] sm:min-h-[125px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <FriendsCommunityIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Friends
          </span>
        </Link>

        {/* Scan (Camera Card Scanner) */}
        <Link
          href="/scanner"
          className="group rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-3.5 sm:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[110px] sm:min-h-[125px]"
        >
          <div className="text-white group-hover:scale-110 transition-transform duration-200">
            <CameraScanIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Scan
          </span>
        </Link>

        {/* Settings (Preferences, Currencies USD/JPY/EUR) */}
        <button
          type="button"
          onClick={openSettings}
          className="group rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2b2e40] border border-[#323547]/40 p-3.5 sm:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[110px] sm:min-h-[125px]"
        >
          <div className="text-white group-hover:scale-110 group-hover:rotate-45 transition-all duration-300">
            <SettingsGearIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Settings
          </span>
        </button>
      </div>

      {/* =========================================================================
          4. BOTTOM SUPPORT BANNER (Authentic Log Pose Server Support)
         ========================================================================= */}
      <div 
        onClick={() => setShowSupportModal(true)}
        className="relative rounded-2xl sm:rounded-3xl bg-[#242634] hover:bg-[#2a2c3d] border border-[#323547]/50 overflow-hidden flex items-stretch transition-all duration-200 shadow-lg cursor-pointer group"
      >
        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-2">
          <p className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase leading-tight max-w-[280px]">
            SUPPORT SERVER &amp; MAINTENANCE
            <br />
            <span className="text-gray-400 font-semibold text-[10px] tracking-normal normal-case">
              Keeps card database &amp; daily pricing scrapers online
            </span>
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-gray-400 text-lg font-bold select-none leading-none">
              ↳
            </span>

            <span className="px-6 sm:px-8 py-1.5 rounded-full border border-[#f4727d] bg-[#1e202c] text-white font-extrabold text-[11px] sm:text-xs tracking-widest uppercase group-hover:bg-[#f4727d] group-hover:text-white transition duration-200 shadow-sm">
              SUPPORT
            </span>
          </div>
        </div>

        {/* Right Vertical Accent Tab */}
        <div className="w-10 sm:w-12 bg-[#f4727d] flex flex-col items-center justify-center py-2 px-1 text-black font-black text-xs sm:text-sm tracking-widest select-none flex-shrink-0">
          <span>L</span>
          <span>O</span>
          <span>G</span>
        </div>
      </div>

      {/* =========================================================================
          5. SUBTLE DEVELOPER FOOTER
         ========================================================================= */}
      <div className="pt-1 pb-4 flex flex-col items-center justify-center gap-0.5 text-center text-gray-500 text-[11px]">
        <p>Developed by <span className="text-gray-300 font-semibold">Kyle Santos</span></p>
        <p className="text-[9px] tracking-widest uppercase">LOG POSE TCG</p>
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      
      {/* Support / Maintenance Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Account Registration & Sign In Modal */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        defaultTab="login"
      />

      {/* Latest Released Cards Interactive Sync Modal */}
      <LatestCardsSyncModal
        isOpen={showLatestSyncModal}
        onClose={() => setShowLatestSyncModal(false)}
      />

      {/* Quick Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#242634] border border-[#323547] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f4727d]/20 border border-[#f4727d]/40 flex items-center justify-center text-[#f4727d]">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Card Scanner</h3>
                <p className="text-xs text-gray-400">Scan cards with your camera</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1b1c26] border border-[#2e3144] space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                <CameraScanIcon className="w-7 h-7" />
              </div>
              <p className="text-xs text-gray-300 font-medium">
                Real-time optical card identification will identify card codes and show live market prices.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowScannerModal(false);
                  router.push('/cards');
                }}
                className="w-full py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs transition"
              >
                Search Card Catalog Instead
              </button>
              <button
                onClick={() => setShowScannerModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
