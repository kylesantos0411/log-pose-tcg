'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Search, 
  ChevronRight, 
  FolderHeart, 
  Swords, 
  Star,
  Users, 
  Settings as SettingsIcon,
  Compass,
  Crown,
  Flame,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

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
   CUSTOM CLEAN SVG ICONS MATCHING USER REFERENCE EXACTLY
   ========================================================================= */

// Hero Card Tilted Cards Outline Icon (Pink/Coral)
function HeroCardsOutlineIcon({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="2.5" y="5.5" width="12" height="16" rx="2" transform="rotate(-12 2.5 5.5)" />
      <rect x="7.5" y="3" width="13" height="17" rx="2" />
    </svg>
  );
}

// 3 Isometric Stacked Cubes for "Sets & Decks" (Blue)
function IsometricCubesIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Top Cube */}
      <polygon points="12,2 16,4.5 12,7 8,4.5" />
      <polyline points="8,4.5 8,8.5 12,11 12,7" />
      <polyline points="16,4.5 16,8.5 12,11" />
      {/* Bottom Left Cube */}
      <polygon points="7,10.5 11,13 7,15.5 3,13" />
      <polyline points="3,13 3,17 7,19.5 7,15.5" />
      <polyline points="11,13 11,17 7,19.5" />
      {/* Bottom Right Cube */}
      <polygon points="17,10.5 21,13 17,15.5 13,13" />
      <polyline points="13,13 13,17 17,19.5 17,15.5" />
      <polyline points="21,13 21,17 17,19.5" />
    </svg>
  );
}

export function CleanHomeView({ 
  totalCards, 
  totalPacks, 
}: CleanHomeViewProps) {
  const router = useRouter();
  const { user, openSettings } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLatestSyncModal, setShowLatestSyncModal] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');

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
          1. BRAND HEADER: Compass Badge + ONE PIECE TCG + Actions
         ========================================================================= */}
      <div className="flex items-center justify-between px-0.5 pt-1 pb-1">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Compass Needle Badge */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e76d78] to-[#f59e0b] p-0.5 shadow-md group-hover:rotate-12 transition-transform duration-300 flex-shrink-0">
            <div className="w-full h-full bg-[#1e212c] rounded-[10px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#e76d78] group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* 3-Color Brand Title */}
          <h1 className="text-xl sm:text-2xl font-black tracking-wider leading-none select-none flex items-center gap-1.5 sm:gap-2">
            <span className="text-[#e76d78]">ONE</span>
            <span className="text-[#3b82f6]">PIECE</span>
            <span className="text-[#f59e0b]">TCG</span>
          </h1>
        </Link>

        {/* Header Right Actions: Refresh, Settings */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Catalog Data"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer"
          >
            <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#3ed57a]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openSettings}
            title={user ? `${user.name} (${user.tag})` : 'Open Settings'}
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer relative"
          >
            <SettingsIcon className="w-5 h-5" />
            {user && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#1e202a]" />
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SEAMLESS QUICK CARD SEARCH BAR (No Search button, pure input)
         ========================================================================= */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={homeSearch}
          onChange={(e) => setHomeSearch(e.target.value)}
          placeholder="Search card name, code, or leader (e.g. Luffy, OP0)"
          className="w-full bg-[#202330] border border-[#313647] focus:border-[#3b82f6] rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition shadow-inner font-medium"
        />
      </form>

      {/* =========================================================================
          3. HERO CARD: Browse All Cards (Pink Outline Cards Icon + Text + Chevron)
         ========================================================================= */}
      <Link
        href="/cards"
        className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 sm:p-5 flex items-center justify-between gap-3 transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <HeroCardsOutlineIcon className="w-9 h-9 sm:w-10 sm:h-10 text-[#f4727d] flex-shrink-0 group-hover:scale-105 transition-transform" />
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide leading-tight truncate">
              Browse All Cards
            </h2>
            <p className="text-xs text-gray-400 leading-snug line-clamp-2">
              Complete archive of {totalCards > 0 ? totalCards.toLocaleString() : '4,511'} cards across all {totalPacks > 0 ? totalPacks : '60'} sets with live Yuyu-tei prices.
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>

      {/* =========================================================================
          4. 6-TILE FEATURE GRID (2 Columns x 3 Rows)
         ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* Tile 1: Collection */}
        <Link
          href="/collection"
          className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-md hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <FolderHeart className="w-7 h-7 text-[#f59e0b] stroke-[2] group-hover:scale-110 transition-transform" />
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              Collection
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Your Binder
            </p>
          </div>
        </Link>

        {/* Tile 2: Sets & Decks */}
        <Link
          href="/sets"
          className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-md hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <IsometricCubesIcon className="w-7 h-7 text-[#3b82f6] group-hover:scale-110 transition-transform" />
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              Sets
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              All {totalPacks > 0 ? totalPacks : '60'} Sets
            </p>
          </div>
        </Link>

        {/* Tile 3: Decks */}
        <Link
          href="/decks"
          className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-md hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Swords className="w-7 h-7 text-[#f4727d] stroke-[2] group-hover:scale-110 transition-transform" />
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              Decks
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Build &amp; Explore
            </p>
          </div>
        </Link>

        {/* Tile 4: Favorites */}
        <Link
          href="/favorites"
          className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-md hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Star className="w-7 h-7 text-[#c084fc] stroke-[2] group-hover:scale-110 transition-transform" />
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              Favorites
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Saved Cards
            </p>
          </div>
        </Link>

        {/* Tile 5: Latest */}
        <button
          type="button"
          onClick={() => setShowLatestSyncModal(true)}
          className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-md hover:scale-[1.015] active:scale-[0.985] cursor-pointer text-left w-full"
        >
          <div className="flex items-start justify-between">
            <Flame className="w-7 h-7 text-[#f59e0b] stroke-[2.2] group-hover:scale-110 transition-transform" />
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              Latest
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Newly added cards
            </p>
          </div>
        </button>

        {/* Tile 6: Friends */}
        <Link
          href="/friends"
          className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-md hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Users className="w-7 h-7 text-[#818cf8] stroke-[2] group-hover:scale-110 transition-transform" />
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              Friends
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Trades &amp; Social
            </p>
          </div>
        </Link>
      </div>

      {/* =========================================================================
          5. SUPPORT THE APPLICATION BANNER
         ========================================================================= */}
      <div 
        onClick={() => setShowSupportModal(true)}
        className="group rounded-2xl bg-[#202330] hover:bg-[#262a3a] border border-[#313647] p-3.5 px-4 flex items-center justify-between transition-all duration-200 shadow-md cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-[#f4727d] stroke-[2] flex-shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
              Support the Application
            </h4>
            <p className="text-[11px] text-gray-400 font-medium">
              Help keep the server online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSupportModal(true);
            }}
            className="px-5 py-1.5 rounded-full border-2 border-[#f4727d] bg-[#1a1c26] hover:bg-[#f4727d] text-white font-black text-xs tracking-wider transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            SUPPORT
          </button>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* =========================================================================
          6. DEVELOPER CREDIT FOOTER
         ========================================================================= */}
      <div className="pt-2 pb-6 flex flex-col items-center justify-center gap-1 text-center select-none">
        <p className="text-xs text-gray-400 font-medium tracking-wide">
          Developed by <span className="text-white font-bold hover:text-[#f4727d] transition-colors">Kyle Santos</span>
        </p>
        <p className="text-[10px] text-gray-500 tracking-widest uppercase font-semibold">
          LOG POSE TCG
        </p>
      </div>

      {/* Dedicated Server Donation & Maintenance Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Account Registration & Sign In Modal */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        defaultTab="register"
      />

      {/* Latest Released Cards Interactive Sync Modal */}
      <LatestCardsSyncModal
        isOpen={showLatestSyncModal}
        onClose={() => setShowLatestSyncModal(false)}
      />
    </div>
  );
}
