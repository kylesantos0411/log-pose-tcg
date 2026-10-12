'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import { RECOMMENDED_DECKS, getDeckById, RecommendedDeck } from '@/lib/recommended-decks';
import { SimPlaymat } from '@/components/sim/SimPlaymat';
import { 
  Gamepad2, 
  Lock, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  ShieldAlert, 
  ChevronRight,
  Flame,
  Search
} from 'lucide-react';
import { checkIsAdmin } from '@/lib/supabase-sync';
import { getEditionCardImageUrl, handleCardImageError } from '@/lib/card-image';
import { ST01_STRAW_HAT_DECK, ST04_ANIMAL_KINGDOM_DECK } from '@/lib/sim/starter-decks';

function SimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSettings();
  const isAdmin = checkIsAdmin(user);

  const deckId = searchParams.get('deckId');
  const [selectedDeck, setSelectedDeck] = useState<RecommendedDeck | null>(() => {
    if (deckId) {
      return getDeckById(deckId) || null;
    }
    // Default to authentic Straw Hat Crew starter deck for instant play/tutorial
    return ST01_STRAW_HAT_DECK;
  });

  const [deckSearch, setDeckSearch] = useState('');

  // 1. ADMIN LOCKDOWN GUARD:
  // If user is not authenticated as an admin, strictly lock the page
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-black uppercase tracking-wider mb-2">
          Admiral Eyes Only • Private Preview
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          TCG Simulator Closed Beta
        </h2>

        <p className="text-xs text-gray-300 leading-relaxed mb-6">
          The One Piece Card Game Solitaire Simulator is currently in closed development and testing for Administrators. Stay tuned for the public release!
        </p>

        <div className="flex items-center gap-3 w-full">
          <Link
            href="/decks"
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2e3344] hover:bg-[#3d445a] text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Decks</span>
          </Link>

          <Link
            href="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#f4727d] to-[#e76d78] text-white text-xs font-black transition flex items-center justify-center shadow-lg"
          >
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. IF A DECK IS SELECTED -> RENDER PLAYMAT
  if (selectedDeck) {
    return (
      <SimPlaymat
        initialDeck={selectedDeck}
        onExit={() => {
          setSelectedDeck(null);
          router.replace('/sim');
        }}
      />
    );
  }

  // 3. IF NO DECK SELECTED -> SHOW DECK SELECTOR (ADMIN HUBS)
  const filteredDecks = RECOMMENDED_DECKS.filter((d) => {
    if (!deckSearch.trim()) return true;
    const q = deckSearch.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      d.leaderName.toLowerCase().includes(q) ||
      d.leaderId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d3242]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  TCG Simulator (Solitaire Sandbox)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                  ADMIN BETA
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Choose any tournament deck to test mulligans, curves, field control, and DON!! turns.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/decks"
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-2 self-start sm:self-auto border border-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Deck Archive</span>
        </Link>
      </div>

      {/* Quick Launch Tutorial Banner */}
      <div
        onClick={() => setSelectedDeck(ST01_STRAW_HAT_DECK)}
        className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/20 to-purple-950/40 border-2 border-cyan-400/50 hover:border-cyan-400 shadow-xl cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black/40 border border-white/20 shrink-0 shadow-md">
            <img
              src={ST01_STRAW_HAT_DECK.leaderImage}
              alt="Luffy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-400/30">
                RECOMMENDED
              </span>
              <span className="text-xs font-bold text-gray-400">Tutorial & Sandbox</span>
            </div>
            <h3 className="text-sm font-black text-white mt-0.5">
              Launch Official Tutorial: ST-01 Straw Hat Crew vs Kaido
            </h3>
            <p className="text-[11px] text-gray-300">
              Interactive 8-step guided walkthrough of turn phases, DON!! attachment, combat, and triggers.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="py-2 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs shrink-0 shadow-lg flex items-center gap-1.5 transition"
        >
          <span>START TUTORIAL</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={deckSearch}
          onChange={(e) => setDeckSearch(e.target.value)}
          placeholder="Search decks by name or leader (e.g. Zoro, Law, Enel, Katakuri)..."
          className="w-full bg-[#1b1e2a] border border-[#2d3242] focus:border-amber-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition"
        />
      </div>

      {/* Grid of Decks to test */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {filteredDecks.map((deck) => (
          <div
            key={deck.id}
            onClick={() => setSelectedDeck(deck)}
            className="group p-3 sm:p-4 rounded-2xl bg-[#1e212b] border border-[#2d3242] hover:border-amber-400/60 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-3 relative hover:scale-[1.02]"
          >
            {/* Leader thumbnail */}
            <div className="w-14 sm:w-16 aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-md">
              <img
                src={getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage)}
                alt={deck.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => handleCardImageError(e, deck.leaderId, deck.leaderImage)}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 font-mono">
                  {deck.leaderId}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-gray-300">
                  {deck.rank}
                </span>
              </div>
              <h3 className="text-sm font-black text-white truncate mt-0.5">
                {deck.name}
              </h3>
              <p className="text-[11px] text-gray-400 truncate">
                {deck.subname}
              </p>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400">
                  50 Cards + Leader
                </span>
                <span className="text-[10px] font-black text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  <span>PLAYTEST</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-gray-400">
          Loading TCG Simulator...
        </div>
      }
    >
      <SimulatorContent />
    </Suspense>
  );
}
