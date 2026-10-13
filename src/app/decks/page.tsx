'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Sparkles, 
  Search, 
  X, 
  Trophy, 
  Flame, 
  Filter,
  Layers,
  ChevronRight,
  User,
  Gamepad2,
  Plus,
  Trash2,
  Play
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { checkIsAdmin } from '@/lib/supabase-sync';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { getEditionCardImageUrl, handleCardImageError } from '@/lib/card-image';
import { SimCustomDeckModal } from '@/components/sim/SimCustomDeckModal';

type MetaFilter = 
  | 'ALL' 
  | 'CUSTOM'
  | 'TIER_1' 
  | 'FLAGSHIP' 
  | 'CHAMPIONSHIP' 
  | 'STANDARD_BATTLE' 
  | 'TREASURE_CUP' 
  | 'OP16' 
  | 'OP15' 
  | 'OP14' 
  | 'EB04' 
  | 'OP09' 
  | 'OP08' 
  | 'OP17';

type ColorFilter = 'ALL' | 'Red' | 'Blue' | 'Green' | 'Purple' | 'Black' | 'Yellow';

const COLOR_CHIPS: { label: string; value: ColorFilter; bg: string; text: string }[] = [
  { label: 'All', value: 'ALL', bg: 'bg-white/10', text: 'text-white' },
  { label: 'Red', value: 'Red', bg: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'text-red-400' },
  { label: 'Blue', value: 'Blue', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'text-blue-400' },
  { label: 'Green', value: 'Green', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400' },
  { label: 'Purple', value: 'Purple', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', text: 'text-purple-400' },
  { label: 'Black', value: 'Black', bg: 'bg-gray-700/40 text-gray-300 border-gray-600/40', text: 'text-gray-300' },
  { label: 'Yellow', value: 'Yellow', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', text: 'text-amber-400' },
];

export default function RecommendedDecksPage() {
  const router = useRouter();
  const { user } = useSettings();
  const isAdmin = checkIsAdmin(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMeta, setActiveMeta] = useState<MetaFilter>('ALL');
  const [activeColor, setActiveColor] = useState<ColorFilter>('ALL');
  const [isCustomDeckModalOpen, setIsCustomDeckModalOpen] = useState(false);
  const [customDecks, setCustomDecks] = useState<RecommendedDeck[]>([]);

  // Load custom decks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('optcg_custom_decks');
      if (stored) {
        setCustomDecks(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load custom decks from localStorage', e);
    }
  }, []);

  const handleDeleteCustomDeck = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const updated = customDecks.filter((d) => d.id !== id);
      setCustomDecks(updated);
      localStorage.setItem('optcg_custom_decks', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to delete custom deck', err);
    }
  };

  const handleDeckSaved = (newDeck: RecommendedDeck) => {
    setCustomDecks((prev) => [newDeck, ...prev.filter((d) => d.id !== newDeck.id)]);
  };

  const handleSelectDeckForSim = (deck: RecommendedDeck) => {
    router.push(`/sim?deckId=${deck.id}`);
  };

  // Filter custom decks by search query and color
  const filteredCustomDecks = useMemo(() => {
    return customDecks.filter((deck) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = deck.name.toLowerCase().includes(query);
        const matchesSubname = deck.subname.toLowerCase().includes(query);
        const matchesLeader = deck.leaderName.toLowerCase().includes(query);
        const matchesId = deck.leaderId.toLowerCase().includes(query);
        if (!matchesName && !matchesSubname && !matchesLeader && !matchesId) {
          return false;
        }
      }
      if (activeColor !== 'ALL') {
        if (!deck.color.includes(activeColor)) return false;
      }
      return true;
    });
  }, [customDecks, searchQuery, activeColor]);

  // Filter recommended meta decks
  const filteredDecks = useMemo(() => {
    if (activeMeta === 'CUSTOM') {
      return [];
    }

    return RECOMMENDED_DECKS.filter((deck) => {
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = deck.name.toLowerCase().includes(query);
        const matchesSubname = deck.subname.toLowerCase().includes(query);
        const matchesLeader = deck.leaderName.toLowerCase().includes(query);
        const matchesId = deck.leaderId.toLowerCase().includes(query);
        const matchesTournament = deck.tournament.toLowerCase().includes(query);
        const matchesPlayer = deck.player?.toLowerCase().includes(query);
        const matchesHost = deck.host?.toLowerCase().includes(query);
        const matchesPlacement = deck.placement?.toLowerCase().includes(query);
        const matchesType = deck.tournamentType?.toLowerCase().includes(query);
        if (
          !matchesName &&
          !matchesSubname &&
          !matchesLeader &&
          !matchesId &&
          !matchesTournament &&
          !matchesPlayer &&
          !matchesHost &&
          !matchesPlacement &&
          !matchesType
        ) {
          return false;
        }
      }

      if (activeMeta === 'TIER_1' && deck.tier !== 'Tier 1') return false;
      if (activeMeta === 'FLAGSHIP' && !deck.tournamentType?.includes('Flagship')) return false;
      if (activeMeta === 'CHAMPIONSHIP' && !deck.tournamentType?.includes('Championship') && !deck.tournamentType?.includes('3v3') && !deck.tournamentType?.includes('Regional') && !deck.tournamentType?.includes('CS')) return false;
      if (activeMeta === 'STANDARD_BATTLE' && !deck.tournamentType?.includes('Standard Battle')) return false;
      if (activeMeta === 'TREASURE_CUP' && !deck.tournamentType?.includes('Treasure Cup')) return false;
      if (activeMeta === 'OP16' && deck.metaEra !== 'OP-16') return false;
      if (activeMeta === 'OP15' && deck.metaEra !== 'OP-15') return false;
      if (activeMeta === 'OP14' && deck.metaEra !== 'OP-14' && deck.metaEra !== 'OP-14.5') return false;
      if (activeMeta === 'EB04' && deck.metaEra !== 'EB-04') return false;
      if (activeMeta === 'OP09' && deck.metaEra !== 'OP-09') return false;
      if (activeMeta === 'OP08' && deck.metaEra !== 'OP-08') return false;
      if (activeMeta === 'OP17' && deck.metaEra !== 'OP-17') return false;

      // Color filter
      if (activeColor !== 'ALL') {
        if (!deck.color.includes(activeColor)) return false;
      }

      return true;
    });
  }, [searchQuery, activeMeta, activeColor]);

  const showCustomSection = activeMeta === 'CUSTOM' || (activeMeta === 'ALL' && filteredCustomDecks.length > 0);

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-100 max-w-lg md:max-w-5xl lg:max-w-7xl mx-auto w-full">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-[#0e1017]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#1f2330] flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition active:scale-95 shrink-0"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-white tracking-wide truncate">
              One Piece Decks
            </h1>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate">
              Build Custom Decks &amp; Meta Tournaments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Custom Deck Button */}
          <button
            onClick={() => setIsCustomDeckModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Create Deck</span>
            <span className="sm:hidden">Create</span>
          </button>

          {/* PLAYTEST Simulator button available for everyone */}
          <Link
            href="/sim"
            title="Open TCG Simulator"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 transition shadow-sm active:scale-95"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span>PLAYTEST</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-1 sm:p-3 space-y-3">
        {/* Banner with Create Deck shortcut */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#141824] border border-[#252c3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center shrink-0 text-blue-400">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white">
                Practice Your Own Decks in TCG Sim
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste any deck list to test battle mechanics, DON!! allocation, and card effects.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomDeckModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Custom Deck</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deck, leader name, or card code..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#141620] border border-[#222533] focus:border-[#3b82f6]/60 focus:outline-none rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 transition shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Meta & Category Quick Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold select-none">
          <button
            onClick={() => setActiveMeta('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'ALL'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            All Decks ({RECOMMENDED_DECKS.length + customDecks.length})
          </button>

          {/* Custom Decks Tab */}
          <button
            onClick={() => setActiveMeta('CUSTOM')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 flex items-center gap-1.5 ${
              activeMeta === 'CUSTOM'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>My Custom Decks ({customDecks.length})</span>
          </button>

          <button
            onClick={() => setActiveMeta('TIER_1')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 flex items-center gap-1.5 ${
              activeMeta === 'TIER_1'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            <Trophy className={`w-3.5 h-3.5 ${activeMeta === 'TIER_1' ? 'text-amber-400 fill-amber-400' : 'text-amber-400/80'}`} />
            <span>Tier 1 Meta</span>
          </button>
          <button
            onClick={() => setActiveMeta('FLAGSHIP')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'FLAGSHIP'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            Flagship (FS)
          </button>
          <button
            onClick={() => setActiveMeta('CHAMPIONSHIP')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'CHAMPIONSHIP'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            Regionals / CS
          </button>
          <button
            onClick={() => setActiveMeta('STANDARD_BATTLE')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'STANDARD_BATTLE'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            Standard Battle
          </button>
          <button
            onClick={() => setActiveMeta('TREASURE_CUP')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'TREASURE_CUP'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            Treasure Cup
          </button>
          <button
            onClick={() => setActiveMeta('OP16')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP16'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            OP-16 Future
          </button>
          <button
            onClick={() => setActiveMeta('OP15')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP15'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            OP-15 Meta
          </button>
          <button
            onClick={() => setActiveMeta('OP14')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP14'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            OP-14 Worlds
          </button>
          <button
            onClick={() => setActiveMeta('EB04')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'EB04'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            EB-04 Extra
          </button>
          <button
            onClick={() => setActiveMeta('OP09')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP09'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            OP-09 Meta
          </button>
          <button
            onClick={() => setActiveMeta('OP08')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP08'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            OP-08 Meta
          </button>
          <button
            onClick={() => setActiveMeta('OP17')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP17'
                ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                : 'bg-[#141620] text-slate-400 border-[#222533] hover:bg-[#181b26] hover:text-white'
            }`}
          >
            OP-17 Future
          </button>
        </div>

        {/* Color Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold select-none">
          {COLOR_CHIPS.map((chip) => {
            const isSelected = activeColor === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => setActiveColor(chip.value)}
                className={`px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#222738] text-white font-bold border-[#343b52] shadow-sm'
                    : `${chip.bg} border hover:opacity-90`
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* 1. MY CUSTOM DECKS SECTION */}
        {showCustomSection && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>My Custom Decks ({filteredCustomDecks.length})</span>
              </h2>
              <button
                onClick={() => setIsCustomDeckModalOpen(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                + Create New Deck
              </button>
            </div>

            {filteredCustomDecks.length === 0 ? (
              <div className="bg-[#141620] border border-[#222533] rounded-2xl p-6 text-center">
                <p className="text-xs font-bold text-slate-300">No custom decks saved yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Create or paste your deck list to test it in the TCG Simulator!
                </p>
                <button
                  onClick={() => setIsCustomDeckModalOpen(true)}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Deck</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCustomDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="group bg-[#141620] hover:bg-[#181b26] border border-[#262f44] hover:border-blue-500/60 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 shadow-sm relative"
                  >
                    <Link
                      href={`/decks/${deck.id}`}
                      className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      {/* Leader thumbnail */}
                      <div className="w-13 sm:w-14 aspect-[2.5/3.5] bg-[#10121a] rounded-xl overflow-hidden border border-white/10 shadow-sm shrink-0 relative group-hover:scale-105 transition-transform">
                        <img
                          src={getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage)}
                          alt={deck.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleCardImageError(e, deck.leaderId, deck.leaderImage)}
                        />
                        <div className="absolute top-1 left-1 px-1 py-0.2 bg-blue-900/80 rounded text-[7px] font-black text-blue-200 uppercase">
                          CUSTOM
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {deck.leaderId}
                          </span>
                          <button
                            onClick={(e) => handleDeleteCustomDeck(e, deck.id)}
                            title="Delete Custom Deck"
                            className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate mt-0.5">
                          {deck.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {deck.subname}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-[9px] font-semibold text-emerald-300">
                            {deck.cards.reduce((s, c) => s + c.quantity, 0)} Cards
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {deck.color}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Bottom Action Bar: Playtest Button */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e2435]">
                      <Link
                        href={`/decks/${deck.id}`}
                        className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-0.5"
                      >
                        <span>View Cards</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>

                      <Link
                        href={`/sim?deckId=${deck.id}`}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>PLAYTEST</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. RECOMMENDED & META TOURNAMENT DECKS */}
        {activeMeta !== 'CUSTOM' && (
          <div className="space-y-2.5 pt-2">
            <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase">
              Tournament Decks ({filteredDecks.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDecks.length === 0 ? (
                <div className="col-span-full bg-[#141620] border border-[#222533] rounded-2xl p-8 text-center">
                  <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">No tournament decks found</p>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveMeta('ALL');
                      setActiveColor('ALL');
                    }}
                    className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#1c202d] text-xs font-semibold hover:bg-[#252b3d] text-slate-200 border border-[#2c3345] transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredDecks.map((deck: RecommendedDeck) => {
                  const isTier1 = deck.tier === 'Tier 1';
                  return (
                    <div
                      key={deck.id}
                      className="group bg-[#141620] hover:bg-[#181b26] border border-[#222533] hover:border-[#2f3548] rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer min-w-0 w-full"
                    >
                      <Link
                        href={`/decks/${deck.id}`}
                        className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-1.5 sm:pr-2"
                      >
                        {/* Leader Artwork Thumbnail */}
                        <div className="w-13 sm:w-16 aspect-[2.5/3.5] bg-[#10121a] rounded-xl overflow-hidden border border-white/10 shadow-sm flex-shrink-0 relative group-hover:scale-105 transition-transform">
                          <img
                            src={getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage)}
                            alt={deck.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleCardImageError(e, deck.leaderId, deck.leaderImage)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                          {deck.metaEra && (
                            <div className="absolute top-1 left-1 px-1 py-0.2 bg-black/70 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-tighter">
                              {deck.metaEra}
                            </div>
                          )}
                        </div>

                        {/* Deck Title & Leader Subtitles */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate group-hover:text-white transition-colors">
                              {deck.name}
                            </h3>
                          </div>

                          <div className="text-[11px] sm:text-xs text-gray-400 font-normal truncate mt-0.5">
                            {deck.subname}
                          </div>

                          {/* Tournament Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            {deck.player && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-medium text-gray-300 truncate max-w-[140px]">
                                <User className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{deck.player}</span>
                              </span>
                            )}
                            {deck.placement && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-medium text-gray-200 whitespace-nowrap">
                                <Trophy className="w-2.5 h-2.5 text-amber-400/90 flex-shrink-0" />
                                <span>{deck.placement}</span>
                              </span>
                            )}
                            {deck.tournamentType && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-medium text-gray-400 truncate max-w-[130px]">
                                {deck.tournamentType}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            <span className="font-mono text-[10px] sm:text-xs font-semibold text-gray-400">
                              {deck.leaderId}
                            </span>
                            {isTier1 && (
                              <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] sm:text-[10px] font-bold text-gray-200 uppercase tracking-wider whitespace-nowrap">
                                TIER 1
                              </span>
                            )}
                            {deck.winrate && deck.winrate !== '0%' && (
                              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 whitespace-nowrap">
                                {deck.winrate} WR
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Card Bottom: Date & Playtest Button */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#1e2330]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ background: deck.colorDot }}
                            title={`${deck.color} Deck`}
                          />
                          <span className="text-[10px] font-mono text-gray-400">
                            {deck.date}
                          </span>
                        </div>

                        <Link
                          href={`/sim?deckId=${deck.id}`}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border border-amber-500/35 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition active:scale-95 shadow-sm"
                        >
                          <Gamepad2 className="w-3 h-3 text-amber-400" />
                          <span>PLAYTEST</span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Source attribution pill */}
        <div className="pt-5 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            Tournament decklists sourced from{' '}
            <a href="https://gumgum.gg" target="_blank" rel="noopener noreferrer" className="text-gray-400 font-bold hover:underline">GumGum.gg</a>
            {' '}· Japanese card data &amp; prices from Yuyu-tei
          </p>
        </div>
      </main>

      {/* Custom Deck Creation Modal */}
      <SimCustomDeckModal
        isOpen={isCustomDeckModalOpen}
        onClose={() => setIsCustomDeckModalOpen(false)}
        onSelectDeck={handleSelectDeckForSim}
        onDeckSaved={handleDeckSaved}
      />
    </div>
  );
}
