'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  Search, 
  X, 
  Trophy, 
  Flame, 
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { getEditionCardImageUrl } from '@/lib/card-image';

type MetaFilter = 'ALL' | 'TIER_1' | 'OP09' | 'OP08' | 'OP17';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMeta, setActiveMeta] = useState<MetaFilter>('ALL');
  const [activeColor, setActiveColor] = useState<ColorFilter>('ALL');

  const filteredDecks = useMemo(() => {
    return RECOMMENDED_DECKS.filter((deck) => {
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = deck.name.toLowerCase().includes(query);
        const matchesSubname = deck.subname.toLowerCase().includes(query);
        const matchesLeader = deck.leaderName.toLowerCase().includes(query);
        const matchesId = deck.leaderId.toLowerCase().includes(query);
        const matchesTournament = deck.tournament.toLowerCase().includes(query);
        if (!matchesName && !matchesSubname && !matchesLeader && !matchesId && !matchesTournament) {
          return false;
        }
      }

      // Meta filter
      if (activeMeta === 'TIER_1' && deck.tier !== 'Tier 1') return false;
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

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-100 max-w-lg mx-auto">
      {/* Top App Bar matching reference: [←] Recommended Decks */}
      <header className="sticky top-0 z-30 bg-[#1e212b]/95 backdrop-blur-md px-4 py-3 border-b border-[#2d3242] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition active:scale-95"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
              Recommended Decks
            </h1>
            <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
              OnePieceTopDecks &amp; Tournament Meta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] text-[11px] font-black uppercase tracking-wider shadow-sm">
          <Flame className="w-3.5 h-3.5 fill-[#f4727d]" />
          <span>{filteredDecks.length} Decks</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deck, leader name, or card code..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#242735] border border-[#343a4c] focus:border-[#f4727d] focus:outline-none rounded-xl text-xs sm:text-sm text-white placeholder-gray-400 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Meta Era Quick Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold select-none">
          <button
            onClick={() => setActiveMeta('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'ALL'
                ? 'bg-[#f4727d] text-white border-[#f4727d] shadow-md shadow-[#f4727d]/20'
                : 'bg-[#242735] text-gray-300 border-[#343a4c] hover:bg-[#2a2e40]'
            }`}
          >
            All Decks ({RECOMMENDED_DECKS.length})
          </button>
          <button
            onClick={() => setActiveMeta('TIER_1')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 flex items-center gap-1 ${
              activeMeta === 'TIER_1'
                ? 'bg-amber-500 text-black font-black border-amber-500 shadow-md'
                : 'bg-[#242735] text-amber-400 border-[#343a4c] hover:bg-[#2a2e40]'
            }`}
          >
            <Trophy className="w-3 h-3 fill-current" />
            <span>Tier 1 Meta</span>
          </button>
          <button
            onClick={() => setActiveMeta('OP09')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP09'
                ? 'bg-[#f4727d] text-white border-[#f4727d] shadow-md'
                : 'bg-[#242735] text-gray-300 border-[#343a4c] hover:bg-[#2a2e40]'
            }`}
          >
            OP-09 Meta
          </button>
          <button
            onClick={() => setActiveMeta('OP08')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP08'
                ? 'bg-[#f4727d] text-white border-[#f4727d] shadow-md'
                : 'bg-[#242735] text-gray-300 border-[#343a4c] hover:bg-[#2a2e40]'
            }`}
          >
            OP-08 Meta
          </button>
          <button
            onClick={() => setActiveMeta('OP17')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              activeMeta === 'OP17'
                ? 'bg-[#f4727d] text-white border-[#f4727d] shadow-md'
                : 'bg-[#242735] text-gray-300 border-[#343a4c] hover:bg-[#2a2e40]'
            }`}
          >
            OP-17 Future
          </button>
        </div>

        {/* Color Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold select-none">
          {COLOR_CHIPS.map((chip) => {
            const isSelected = activeColor === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => setActiveColor(chip.value)}
                className={`px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-white text-black font-black border-white shadow-sm scale-[1.03]'
                    : `${chip.bg} border hover:opacity-80`
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Decks List */}
        <div className="space-y-2.5 pt-1">
          {filteredDecks.length === 0 ? (
            <div className="bg-[#242735] border border-[#343a4c] rounded-2xl p-8 text-center">
              <Layers className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-300">No decks found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search keywords.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveMeta('ALL');
                  setActiveColor('ALL');
                }}
                className="mt-4 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 text-white transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredDecks.map((deck: RecommendedDeck) => {
              const isTier1 = deck.tier === 'Tier 1';
              return (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="group bg-[#242735] hover:bg-[#2c3042] border border-[#343a4c] hover:border-[#f4727d]/60 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all duration-200 shadow-md hover:shadow-xl active:scale-[0.98] cursor-pointer"
                >
                  {/* Left Column: Leader Art + Text Info */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    {/* Leader Artwork Thumbnail */}
                    <div className="w-14 sm:w-16 aspect-[2.5/3.5] bg-[#1a1d27] rounded-xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0 relative group-hover:scale-105 transition-transform">
                      <img
                        src={getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage)}
                        alt={deck.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      {/* Floating Meta Tag on thumbnail */}
                      {deck.metaEra && (
                        <div className="absolute top-1 left-1 px-1 py-0.2 bg-black/70 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-tighter">
                          {deck.metaEra}
                        </div>
                      )}
                    </div>

                    {/* Deck Title & Leader Subtitles */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate group-hover:text-[#f4727d] transition-colors">
                          {deck.name}
                        </h3>
                      </div>

                      <div className="text-xs text-gray-300 font-medium truncate mt-0.5">
                        {deck.subname}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold text-gray-400">
                          {deck.leaderId}
                        </span>
                        {isTier1 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[10px] font-black text-amber-300">
                            TIER 1
                          </span>
                        )}
                        {deck.winrate && deck.winrate !== '0%' && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            {deck.winrate} WR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Color Dot (Top) + Date Pill (Bottom) */}
                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 py-0.5">
                    {/* Color Dot Indicator */}
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-md border border-white/20 flex items-center justify-center text-[10px] font-black text-white/80"
                      style={{ backgroundColor: deck.colorDot }}
                      title={`${deck.color} Deck`}
                    />

                    {/* Tournament / Release Date Pill */}
                    <div className="px-2.5 py-1 rounded-xl bg-[#1b1e2a] border border-[#313648] text-[11px] font-bold font-mono text-gray-300 shadow-inner mt-4 group-hover:border-gray-500 transition-colors">
                      {deck.date}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Source attribution pill */}
        <div className="pt-5 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            Curated from <strong className="text-gray-400">OnePieceTopDecks</strong> &amp; Asian Regional Tournament Champions
          </p>
        </div>
      </main>
    </div>
  );
}
