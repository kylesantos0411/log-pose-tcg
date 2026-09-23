'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Search, 
  ChevronRight, 
  Boxes,
  FolderHeart, 
  Users, 
  Swords, 
  Settings as SettingsIcon,
  X,
  Flame,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getSafeCardImageUrl } from '@/lib/card-image';
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
  const [displayCount, setDisplayCount] = useState(userCardsCount);
  const [homeSearch, setHomeSearch] = useState('');

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

  // Preview cards fan for the hero card with safe proxy URLs
  const previewArt = [
    getSafeCardImageUrl(featuredCards[0]?.imageUrl || 'https://onepiece-cardgame.com/images/cardlist/card/OP01-016.png'),
    getSafeCardImageUrl(featuredCards[1]?.imageUrl || 'https://onepiece-cardgame.com/images/cardlist/card/OP01-120.png'),
    getSafeCardImageUrl(featuredCards[2]?.imageUrl || 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png'),
  ];

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto py-2 sm:py-6 space-y-4 select-none font-sans">
      {/* =========================================================================
          1. BRAND HEADER: LOG POSE Logo + 3-Color Branding + Quick Actions
         ========================================================================= */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Official Log Pose Logo Badge */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white/95 shadow-md flex items-center justify-center p-0.5 border border-[#343a4c] group-hover:scale-105 transition-transform flex-shrink-0">
            <img
              src="/logo.png"
              alt="Log Pose TCG"
              className="w-full h-full object-contain"
            />
          </div>

          {/* 3-Color Branding & Subtitle */}
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider leading-none select-none flex items-center gap-1.5">
              <span className="text-[#e76d78]">ONE</span>
              <span className="text-[#3b82f6]">PIECE</span>
              <span className="text-[#f59e0b]">TCG</span>
            </h1>
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">
              LOG POSE
            </span>
          </div>
        </Link>

        {/* Header Right Actions: Refresh, Search, Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Catalog Data"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer"
          >
            <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          
          <Link
            href="/cards"
            title="Search Cards Catalog"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </Link>

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
          2. CLEAN SEARCH BAR: Fast, uncluttered search input
         ========================================================================= */}
      <form onSubmit={handleSearchSubmit} className="relative px-0.5">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={homeSearch}
          onChange={(e) => setHomeSearch(e.target.value)}
          placeholder="Search card name, code, or leader (e.g. Luffy, OP05-119)..."
          className="w-full bg-[#222532] border border-[#33384a] focus:border-[#3b82f6] rounded-2xl pl-10 pr-20 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none transition shadow-inner"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {homeSearch && (
            <button
              type="button"
              onClick={() => setHomeSearch('')}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="px-3 py-1 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition shadow active:scale-95 cursor-pointer"
          >
            Search
          </button>
        </div>
      </form>

      {/* =========================================================================
          3. HERO SHOWCASE CARD: Browse All Cards (Clean, direct, minimal description)
         ========================================================================= */}
      <Link
        href="/cards"
        className="group relative block rounded-3xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-[#e76d78]/60 p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden cursor-pointer"
      >
        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left Text & Action - Clean, minimal descriptions */}
          <div className="space-y-1.5 max-w-[62%]">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
              Browse All Cards
            </h2>
            
            <p className="text-xs text-gray-300 font-medium">
              Official database &amp; live Yuyu-tei prices.
            </p>

            <div className="pt-2 flex items-center gap-1.5 text-xs font-extrabold text-[#f59e0b] group-hover:translate-x-1 transition-transform">
              <span>Explore All Sets</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          {/* Right: 3D Fanned-Out Card Artwork Deck */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center mr-1">
            {/* Card 1 (Left fan) */}
            <div className="absolute w-14 sm:w-16 h-20 sm:h-24 rounded-lg overflow-hidden shadow-lg border border-red-500/30 transform -translate-x-3 sm:-translate-x-4 rotate-[-15deg] group-hover:-translate-x-5 group-hover:rotate-[-20deg] transition-all duration-300 bg-neutral-900">
              <img
                src={previewArt[0]}
                alt="Card 1"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Card 2 (Right fan) */}
            <div className="absolute w-14 sm:w-16 h-20 sm:h-24 rounded-lg overflow-hidden shadow-lg border border-blue-500/30 transform translate-x-3 sm:translate-x-4 rotate-[15deg] group-hover:translate-x-5 group-hover:rotate-[20deg] transition-all duration-300 bg-neutral-900">
              <img
                src={previewArt[1]}
                alt="Card 2"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Card 3 (Center foreground) */}
            <div className="relative z-10 w-16 sm:w-18 h-22 sm:h-26 rounded-lg overflow-hidden shadow-2xl border-2 border-amber-400/40 transform group-hover:scale-105 transition-all duration-300 bg-neutral-900">
              <img
                src={previewArt[2]}
                alt="Card 3"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* =========================================================================
          4. 2-COLUMN GRID: Collection (Left) + Sets & Decks (Right Stacked)
         ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
        {/* Left Column: Collection Binder Card */}
        <Link
          href="/collection"
          className="group rounded-3xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-[#f59e0b]/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.985] cursor-pointer min-h-[180px]"
        >
          {/* Top Section */}
          <div className="space-y-2">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b] group-hover:scale-105 transition-all duration-200">
              <FolderHeart className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] truncate block">
                {user ? `${user.name}'s Binder` : 'Guest Binder'}
              </span>
              <h3 className="text-xl font-black text-white tracking-wide leading-tight truncate">
                Collection
              </h3>
            </div>
          </div>

          {/* Bottom Section: Live Count */}
          <div className="pt-2 border-t border-[#33384a] space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {displayCount}
            </div>
            <p className="text-[11px] text-gray-400 font-medium truncate">
              {user ? 'Cards in Account' : 'Cards in Guest Binder'}
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-[#f59e0b] group-hover:translate-x-1 transition-transform">
              <span>Open Binder</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </Link>

        {/* Right Column: 2 Stacked Feature Cards (Sets & Decks) */}
        <div className="flex flex-col gap-3 sm:gap-3.5 justify-between">
          {/* Top: Sets & Decks */}
          <Link
            href="/sets"
            className="group flex-1 rounded-3xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-[#3b82f6]/60 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5 stroke-[2]" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </div>
            
            <div className="mt-2">
              <h4 className="font-bold text-sm sm:text-base text-white tracking-wide leading-snug">
                Sets &amp; Decks
              </h4>
              <p className="text-[11px] text-gray-400">
                {totalPacks > 0 ? `${totalPacks} Official Sets` : '60 Official Sets'}
              </p>
            </div>
          </Link>

          {/* Bottom: Recommended Decks */}
          <Link
            href="/decks"
            className="group flex-1 rounded-3xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-[#f4727d]/60 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#f4727d]/15 border border-[#f4727d]/30 flex items-center justify-center text-[#f4727d] group-hover:scale-105 transition-transform">
                <Swords className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="px-1.5 py-0.5 rounded-full bg-[#f4727d]/20 border border-[#f4727d]/30 text-[9px] font-black text-[#f4727d] uppercase">
                Meta
              </div>
            </div>

            <div className="mt-2">
              <h4 className="font-bold text-sm sm:text-base text-white tracking-wide leading-snug">
                Decks
              </h4>
              <p className="text-[11px] text-gray-400">
                Recommended Builds
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          5. UTILITY ROW: Feature Buttons (Latest Cards, Friends, Settings)
         ========================================================================= */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Latest Cards */}
        <button
          type="button"
          onClick={() => setShowLatestSyncModal(true)}
          className="group rounded-2xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-amber-400/50 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left w-full"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white truncate">
              Latest
            </div>
            <div className="text-[10px] text-gray-400 truncate">New Sets</div>
          </div>
        </button>

        {/* Friends / Social */}
        <Link
          href="/friends"
          className="group rounded-2xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-purple-400/50 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1">
              <span>Friends</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            </div>
            <div className="text-[10px] text-gray-400 truncate">Trades &amp; Social</div>
          </div>
        </Link>

        {/* Settings Button */}
        <button
          type="button"
          onClick={openSettings}
          className="group rounded-2xl bg-[#222532] hover:bg-[#272b3a] border border-[#33384a] hover:border-cyan-400/50 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left w-full"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:rotate-45 transition-all duration-300 flex-shrink-0">
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white truncate">Settings</div>
            <div className="text-[10px] text-gray-400 truncate">Preferences</div>
          </div>
        </button>
      </div>

      {/* =========================================================================
          6. SUPPORT SERVER & MAINTENANCE BANNER (Clean, elegant)
         ========================================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#222532] border border-[#33384a] p-4 sm:p-5 shadow-md flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-[11px] sm:text-xs font-black tracking-widest text-gray-200 uppercase leading-relaxed">
          SUPPORT SERVER &amp; MAINTENANCE
          <br />
          <span className="text-[10px] text-gray-400 font-semibold tracking-normal normal-case">
            Always optional • Keeps database and pricing scrapers online
          </span>
        </p>

        <div className="flex items-center justify-center gap-3 relative mt-0.5">
          <span className="text-xl sm:text-2xl text-gray-400 select-none">
            ⤵
          </span>

          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="px-8 sm:px-10 py-2 rounded-full border-2 border-[#f4727d] hover:bg-[#f4727d] text-white font-extrabold text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
          >
            SUPPORT
          </button>
        </div>
      </div>

      {/* =========================================================================
          7. DEVELOPER CREDIT FOOTER
         ========================================================================= */}
      <div className="pt-2 pb-8 flex flex-col items-center justify-center gap-1 text-center select-none">
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
