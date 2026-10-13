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
  const tutorialParam = searchParams.get('tutorial');

  const [selectedDeck, setSelectedDeck] = useState<RecommendedDeck | null>(() => {
    if (deckId) {
      return getDeckById(deckId) || null;
    }
    // Only auto-launch ST01 if user explicitly clicked tutorial or deckId was provided
    if (tutorialParam === 'true') {
      return ST01_STRAW_HAT_DECK;
    }
    return null; // Show deck selector & mode chooser first!
  });

  const [isTutorialEnabled, setIsTutorialEnabled] = useState<boolean>(() => {
    return tutorialParam === 'true';
  });

  const [deckSearch, setDeckSearch] = useState('');

  // 1. PUBLIC PLAYTEST ACCESS:
  // All players can practice their decks and access the simulator freely.

  // 2. IF A DECK IS SELECTED -> RENDER PLAYMAT
  if (selectedDeck) {
    return (
      <SimPlaymat
        initialDeck={selectedDeck}
        initialTutorialMode={isTutorialEnabled}
        onExit={() => {
          setSelectedDeck(null);
          router.push('/sim');
        }}
      />
    );
  }

  // 3. IF NO DECK SELECTED -> SHOW DECK SELECTOR & CUSTOM DECK IMPORT
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
                  TCG Simulator (Practice & Solitaire Sandbox)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                  PUBLIC PLAYTEST
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Practice custom decks, tournament meta lists, curves, mulligans, DON!! attachment, and combat.
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

      {/* Game Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Interactive Tutorial Mode */}
        <div
          onClick={() => {
            setIsTutorialEnabled(true);
            setSelectedDeck(ST01_STRAW_HAT_DECK);
          }}
          className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-[#101626] border-2 border-cyan-400/50 hover:border-cyan-400 shadow-xl cursor-pointer flex items-center justify-between gap-3 transition group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black/40 border border-cyan-400/30 shrink-0 shadow-md">
              <img
                src={ST01_STRAW_HAT_DECK.leaderImage}
                alt="Luffy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-400/30">
                  NEW PLAYERS
                </span>
                <span className="text-xs font-bold text-cyan-400">Step-by-Step</span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                Guided Tutorial Mode
              </h3>
              <p className="text-[11px] text-gray-300">
                Interactive walkthrough of turn phases, DON!!, combat rules, blockers, and triggers.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="py-2 px-3 sm:px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs shrink-0 shadow-lg flex items-center gap-1 transition"
          >
            <span>START TUTORIAL</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Regular Solitaire Sandbox (Tutorial OFF) */}
        <div
          onClick={() => {
            setIsTutorialEnabled(false);
            setSelectedDeck(ST01_STRAW_HAT_DECK);
          }}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-orange-950/20 to-[#101626] border-2 border-amber-500/40 hover:border-amber-400 shadow-xl cursor-pointer flex items-center justify-between gap-3 transition group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black/40 border border-amber-400/30 shrink-0 shadow-md">
              <img
                src={ST04_ANIMAL_KINGDOM_DECK.leaderImage}
                alt="Kaido"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                  FREE PRACTICE
                </span>
                <span className="text-xs font-bold text-amber-400">Tutorial OFF</span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                Free Sandbox Practice
              </h3>
              <p className="text-[11px] text-gray-300">
                Full-board freedom without tutorial banners. Test curves, mulligans, and test hands.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="py-2 px-3 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shrink-0 shadow-lg flex items-center gap-1 transition"
          >
            <span>PLAY SANDBOX</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Deck Fast Importer (OPTCS / Bandai text code) */}
      <div className="p-4 rounded-2xl bg-[#171b26] border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Import & Practice Custom Deck
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">OPTCS / GumGum / Text list</span>
        </div>
        <p className="text-[11px] text-gray-300">
          Want to practice your own deck? Paste any card list (e.g. <code className="text-amber-300">1xST01-001, 4xST01-013</code>) or pick from the 100+ championship winning lists below:
        </p>
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
