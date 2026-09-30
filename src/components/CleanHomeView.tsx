'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Search, 
  ChevronRight, 
  FolderHeart,
  Boxes,
  Swords, 
  Star,
  Users, 
  Settings as SettingsIcon,
  Compass,
  Crown,
  Flame,
  User as UserIcon,
  ShieldAlert,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

import { SupportModal } from '@/components/SupportModal';
import { AccountModal } from '@/components/AccountModal';
import { LatestCardsSyncModal } from '@/components/LatestCardsSyncModal';
import { checkIsAdmin, checkIsChiefAdmin } from '@/lib/supabase-sync';

interface CleanHomeViewProps {
  totalCards: number;
  totalPacks: number;
  userCardsCount: number;
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

  const isChiefAdmin = checkIsChiefAdmin(user);
  const isAdmin = checkIsAdmin(user);

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
    <div className="w-full max-w-md sm:max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto py-2 sm:py-5 px-3 sm:px-6 space-y-4 md:space-y-6 select-none font-sans">
      {/* =========================================================================
          1. BRAND HEADER: Compass Badge + ONE PIECE TCG + Actions
         ========================================================================= */}
      <div className="flex items-center justify-between px-0.5 pt-1 pb-1">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Log Pose TCG Logo Badge */}
          <div className="w-8 h-8 rounded-xl bg-[#161822] border border-[#242838] p-0.5 shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/logo-transparent.png"
              alt="Log Pose TCG Logo"
              className="w-full h-full object-contain"
            />
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
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition duration-200 active:scale-90 cursor-pointer"
          >
            <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#3ed57a]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            title={user ? `${user.name} (${user.tag})` : 'Account / Sign In'}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition duration-200 active:scale-90 cursor-pointer"
          >
            {user ? (
              <div className="w-6 h-6 rounded-full bg-[#1c202d] border border-[#2c3345] p-0.5 shadow-sm">
                <div className="w-full h-full bg-[#12141c] rounded-full flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                </div>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#181a24] border border-[#262b3a] flex items-center justify-center text-xs text-slate-400 hover:text-white">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={openSettings}
            title={user ? `${user.name} (${user.tag})` : 'Open Settings'}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition duration-200 active:scale-90 cursor-pointer relative"
          >
            <SettingsIcon className="w-5 h-5" />
            {user && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0e1017]" />
            )}
          </button>

          {/* Admin Command Center Quick Button (Mobile & Desktop) */}
          {isAdmin && (
            <Link
              href="/admin"
              title="Admin Command Center"
              className="text-red-400 hover:text-red-300 p-1.5 rounded-full bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition duration-200 active:scale-90 cursor-pointer flex items-center justify-center ml-0.5"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse text-red-400" />
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Quick Stats Banner */}
      <div className="hidden md:grid grid-cols-3 gap-3.5 p-4 rounded-2xl bg-[#141620] border border-[#222533] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cards in Database
            </span>
            <span className="text-lg font-extrabold text-white">
              {totalCards > 0 ? totalCards.toLocaleString() : '4,390+'} Cards
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-x border-[#222533] px-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Expansion Sets
            </span>
            <span className="text-lg font-extrabold text-emerald-400">
              {totalPacks > 0 ? totalPacks : '60'} Sets &amp; Starters
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Live Price Feeds
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Yuyu-tei &bull; SNKRDUNK &bull; eBay
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SEAMLESS QUICK CARD SEARCH BAR + POPULAR KEYWORDS
         ========================================================================= */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={homeSearch}
            onChange={(e) => setHomeSearch(e.target.value)}
            placeholder="Search card name, code, or leader (e.g. Luffy, OP05-119, Nami)..."
            className="w-full bg-[#141620] border border-[#222533] focus:border-[#3b82f6]/60 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-sm font-medium"
          />
        </form>

        {/* Quick Search Chips */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium text-slate-400">
          <span className="text-slate-500 font-semibold mr-1">Trending:</span>
          {[
            { label: 'OP05-119 Luffy', q: 'OP05-119' },
            { label: 'OP09-050 Nami', q: 'OP09-050' },
            { label: 'EB01-006 Chopper', q: 'EB01-006' },
            { label: 'OP14-108 Rayleigh', q: 'OP14-108' },
            { label: 'Manga Parallel', q: 'Manga' },
            { label: 'Leader Cards', q: 'Leader' },
          ].map((item) => (
            <button
              key={item.q}
              type="button"
              onClick={() => router.push(`/cards?q=${encodeURIComponent(item.q)}`)}
              className="px-2.5 py-1 rounded-lg bg-[#161822] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#242838] transition cursor-pointer shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Mobile & Desktop Control Banner */}
      {isAdmin && (
        <Link
          href="/admin"
          className="block p-3.5 rounded-2xl bg-[#161318] border border-red-500/30 hover:border-red-500/50 text-white shadow-sm transition active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Admin Control Center</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
                    CHIEF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Maintenance switch, user bans &amp; market moderation
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400/80 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* =========================================================================
          3. 6-TILE FEATURE GRID (Responsive: 2 cols on mobile, 3 on tablet, 6 on desktop)
         ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {/* Tile 1: Collection */}
        <Link
          href="/collection"
          className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <FolderHeart className="w-7 h-7 text-slate-300 group-hover:text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-wide leading-tight">
              Collection
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Your Binder
            </p>
          </div>
        </Link>

        {/* Tile 2: Sets & Decks */}
        <Link
          href="/sets"
          className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Boxes className="w-7 h-7 text-slate-300 group-hover:text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-wide leading-tight">
              Sets
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              All {totalPacks > 0 ? totalPacks : '60'} Sets
            </p>
          </div>
        </Link>

        {/* Tile 3: Decks */}
        <Link
          href="/decks"
          className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Swords className="w-7 h-7 text-slate-300 group-hover:text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-wide leading-tight">
              Decks
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Build &amp; Explore
            </p>
          </div>
        </Link>

        {/* Tile 4: Favorites */}
        <Link
          href="/favorites"
          className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Star className="w-7 h-7 text-slate-300 group-hover:text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-wide leading-tight">
              Favorites
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Saved Cards
            </p>
          </div>
        </Link>

        {/* Tile 5: Latest */}
        <button
          type="button"
          onClick={() => setShowLatestSyncModal(true)}
          className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer text-left w-full"
        >
          <div className="flex items-start justify-between">
            <Flame className="w-7 h-7 text-slate-300 group-hover:text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-wide leading-tight">
              Latest
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Newly added cards
            </p>
          </div>
        </button>

        {/* Tile 6: Friends */}
        <Link
          href="/friends"
          className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-4 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <Users className="w-7 h-7 text-slate-300 group-hover:text-white stroke-[1.8] group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-wide leading-tight">
              Friends
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Trades &amp; Social
            </p>
          </div>
        </Link>
      </div>

      {/* =========================================================================
          4. SUPPORT THE APPLICATION BANNER
         ========================================================================= */}
      <div 
        onClick={() => setShowSupportModal(true)}
        className="group rounded-2xl bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] p-3.5 px-4 flex items-center justify-between transition-all duration-200 shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-400/90 stroke-[1.8] flex-shrink-0 group-hover:scale-105 transition-transform" />
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-100 leading-tight">
              Support the Application
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
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
            className="px-4 py-1.5 rounded-full border border-amber-500/30 hover:border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs tracking-wider transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            SUPPORT
          </button>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
        </div>
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
