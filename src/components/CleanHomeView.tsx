'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Boxes,
  FolderHeart, 
  Users, 
  Camera, 
  Settings as SettingsIcon,
  Crown,
  Check,
  X,
  Compass,
  User,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getSafeCardImageUrl } from '@/lib/card-image';

import { SupportModal } from '@/components/SupportModal';
import { AccountModal } from '@/components/AccountModal';

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Preview cards fan for the hero card with safe proxy URLs
  const previewArt = [
    getSafeCardImageUrl(featuredCards[0]?.imageUrl || 'https://onepiece-cardgame.com/images/cardlist/card/OP01-016.png'),
    getSafeCardImageUrl(featuredCards[1]?.imageUrl || 'https://onepiece-cardgame.com/images/cardlist/card/OP01-120.png'),
    getSafeCardImageUrl(featuredCards[2]?.imageUrl || 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png'),
  ];

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto py-2 sm:py-6 space-y-4 select-none">
      {/* 1. Brand Header with Log Pose Compass & Actions */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e76d78] to-[#f59e0b] p-0.5 shadow-md group-hover:rotate-12 transition-transform duration-300">
            <div className="w-full h-full bg-[#1e212c] rounded-[10px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#e76d78] group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider leading-none select-none flex items-center gap-1.5 sm:gap-2">
            <span className="text-[#e76d78]">ONE</span>
            <span className="text-[#3b82f6]">PIECE</span>
            <span className="text-[#f59e0b]">TCG</span>
          </h1>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            title="Refresh Catalog Data"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer"
          >
            <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#3ed57a]' : ''}`} />
          </button>
          <Link
            href="/cards"
            title="Search Cards"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </Link>
          <button
            onClick={openSettings}
            title="Open Settings"
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition duration-200 active:scale-90 cursor-pointer"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          {user ? (
            <button
              onClick={openSettings}
              title={`${user.name} (${user.tag})`}
              className="w-8 h-8 rounded-full bg-[#272b3b] border border-[#3b4056] text-white flex items-center justify-center text-sm shadow-sm hover:scale-105 transition cursor-pointer ml-0.5"
            >
              {user.avatar}
            </button>
          ) : (
            <button
              onClick={() => setShowAccountModal(true)}
              title="Create Account / Sign In"
              className="px-2.5 py-1.5 rounded-full bg-[#f45d6a]/15 hover:bg-[#f45d6a]/25 text-[#f45d6a] border border-[#f45d6a]/30 text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ml-0.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Join</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HERO SHOWCASE CARD: "Explore Cards" / "View the cards" */}
      <Link
        href="/cards"
        className="group relative block rounded-3xl bg-gradient-to-br from-[#2a2e40] via-[#222533] to-[#1c1e2b] border border-[#3b4056] hover:border-[#e76d78]/60 p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.015] active:scale-[0.99] overflow-hidden cursor-pointer"
      >
        {/* Glow ambient decoration in background */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#e76d78]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#e76d78]/25 transition-colors" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-[#3b82f6]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left Text & Action */}
          <div className="space-y-1 max-w-[62%]">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide group-hover:text-white leading-tight">
              View Available cards
            </h2>
            
            <p className="text-xs text-gray-300 line-clamp-2 leading-snug font-normal">
              {totalCards > 0 ? `${totalCards.toLocaleString()} Japanese cards` : 'Browse 1,400+ Japanese cards'} with live Yuyu-tei market prices.
            </p>

            <div className="pt-2 flex items-center gap-1.5 text-xs font-extrabold text-[#f59e0b] group-hover:translate-x-1 transition-transform">
              <span>Explore Catalog</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          {/* Right: 3D Fanned-Out Card Artwork Deck (Clean, pure artwork) */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center mr-1">
            {/* Card 1 (Left fan) - Red card */}
            <div className="absolute w-14 sm:w-16 h-20 sm:h-24 rounded-lg overflow-hidden shadow-xl border border-red-500/30 transform -translate-x-3 sm:-translate-x-4 rotate-[-15deg] group-hover:-translate-x-5 group-hover:rotate-[-20deg] transition-all duration-300 bg-gradient-to-br from-red-900 to-neutral-900">
              <img
                src={previewArt[0]}
                alt="Nami"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Card 2 (Right fan) - Blue/Teal card */}
            <div className="absolute w-14 sm:w-16 h-20 sm:h-24 rounded-lg overflow-hidden shadow-xl border border-blue-500/30 transform translate-x-3 sm:translate-x-4 rotate-[15deg] group-hover:translate-x-5 group-hover:rotate-[20deg] transition-all duration-300 bg-gradient-to-br from-blue-900 to-neutral-900">
              <img
                src={previewArt[1]}
                alt="Shanks"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Card 3 (Center foreground) - Gear 5 Manga card */}
            <div className="relative z-10 w-16 sm:w-18 h-22 sm:h-26 rounded-lg overflow-hidden shadow-2xl border-2 border-amber-400/40 transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-900 via-amber-950 to-neutral-900">
              <img
                src={previewArt[2]}
                alt="Luffy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* 3. ASYMMETRICAL BENTO GRID: Collection (Tall) + Sets & Scanner (Stacked) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
        {/* Left Column: TALL HERO CARD -> My Collection Binder */}
        <Link
          href="/collection"
          className="group rounded-3xl bg-gradient-to-b from-[#2a2e40] to-[#202330] border border-[#3b4056] hover:border-[#f59e0b]/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden min-h-[190px]"
        >
          {/* Subtle warm glow background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#f59e0b]/20 transition-colors" />

          {/* Top of Card */}
          <div className="space-y-2 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner">
              <FolderHeart className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">
                Personal Binder
              </span>
              <h3 className="text-xl font-black text-white tracking-wide leading-tight">
                Collection
              </h3>
            </div>
          </div>

          {/* Bottom of Card: Live Stats */}
          <div className="pt-3 border-t border-white/10 relative z-10 space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {userCardsCount}
            </div>
            <p className="text-[11px] text-gray-300 font-medium">
              Cards in Collection
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-[#f59e0b] group-hover:translate-x-1 transition-transform">
              <span>Open Binder</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </Link>

        {/* Right Column: 2 Stacked Tiles (Sets & Scanner) */}
        <div className="flex flex-col gap-3 sm:gap-3.5 justify-between">
          {/* Tile 1: Sets & Expansions */}
          <Link
            href="/sets"
            className="group flex-1 rounded-3xl bg-[#252838] hover:bg-[#2e3246] border border-[#383d52] hover:border-[#3b82f6]/60 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5 stroke-[2]" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </div>
            
            <div className="mt-2">
              <h4 className="font-bold text-sm sm:text-base text-white tracking-wide leading-snug">
                Sets &amp; Decks
              </h4>
              <p className="text-[11px] text-gray-400">
                {totalPacks > 0 ? `${totalPacks} Official Sets` : 'Boosters & Starters'}
              </p>
            </div>
          </Link>

          {/* Tile 2: AI Card Scanner */}
          <Link
            href="/scanner"
            className="group flex-1 rounded-3xl bg-[#252838] hover:bg-[#2e3246] border border-[#383d52] hover:border-[#10b981]/60 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform relative">
                <Camera className="w-5 h-5 stroke-[2]" />
                <span className="w-2 h-2 rounded-full bg-[#10b981] absolute top-1.5 right-1.5 animate-ping" />
              </div>
              <div className="px-1.5 py-0.5 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 text-[9px] font-black text-[#10b981] uppercase">
                AI Lens
              </div>
            </div>

            <div className="mt-2">
              <h4 className="font-bold text-sm sm:text-base text-white tracking-wide leading-snug">
                Card Scan
              </h4>
              <p className="text-[11px] text-gray-400">
                Instant Camera ID
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. UTILITY ROW: Friends & Settings Side-by-Side Horizontal Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* Friends / Community */}
        <Link
          href="/friends"
          className="group rounded-2xl bg-[#242735] hover:bg-[#2c3042] border border-[#363a4e] hover:border-purple-400/50 p-3 sm:p-3.5 flex items-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
            <Users className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
              <span>Friends</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-gray-400">Trades &amp; Social</div>
          </div>
        </Link>

        {/* Settings Button */}
        <button
          onClick={openSettings}
          className="group rounded-2xl bg-[#242735] hover:bg-[#2c3042] border border-[#363a4e] hover:border-cyan-400/50 p-3 sm:p-3.5 flex items-center gap-3 transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left w-full"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:rotate-45 transition-all duration-300 flex-shrink-0">
            <SettingsIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs sm:text-sm text-white truncate">Settings</div>
            <div className="text-[10px] text-gray-400">Currency &amp; Cache</div>
          </div>
        </button>
      </div>

      {/* 5. Voluntary Server Support / Maintenance Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#282a38] via-[#242633] to-[#282a38] border border-[#383b4e] overflow-hidden p-4 sm:p-5 shadow-lg flex flex-col items-center justify-center gap-2 text-center">
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
            onClick={() => setShowSupportModal(true)}
            className="px-8 sm:px-10 py-2 rounded-full border-2 border-[#f4727d] hover:bg-[#f4727d] text-white font-extrabold text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
          >
            DONATE
          </button>
        </div>
      </div>

      {/* 6. Developer Credit Footer */}
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
    </div>
  );
}
