'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Swords, Sparkles, ChevronRight, ExternalLink } from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { getEditionCardImageUrl } from '@/lib/card-image';

export default function RecommendedDecksPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-100 max-w-lg mx-auto">
      {/* Top App Bar matching reference: [←] Recommended Decks */}
      <header className="sticky top-0 z-30 bg-[#1e212b]/95 backdrop-blur-md px-4 py-3.5 border-b border-[#2d3242] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition active:scale-95"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </Link>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
            Recommended Decks
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Meta OP-17</span>
        </div>
      </header>

      {/* Recommended Decks List */}
      <main className="p-4 space-y-3">
        {RECOMMENDED_DECKS.map((deck: RecommendedDeck) => {
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Deck Title & Leader Subtitles */}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate group-hover:text-[#f4727d] transition-colors">
                    {deck.name}
                  </h3>
                  <div className="text-xs text-gray-300 font-medium truncate mt-0.5">
                    {deck.subname}
                  </div>
                  <div className="font-mono text-xs font-bold text-gray-400 mt-0.5">
                    {deck.leaderId}
                  </div>
                </div>
              </div>

              {/* Right Column: Color Dot (Top) + Date Pill (Bottom) */}
              <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 py-0.5">
                {/* Color Dot Indicator */}
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-md border border-white/20"
                  style={{ backgroundColor: deck.colorDot }}
                  title={`${deck.color} Deck`}
                />

                {/* Tournament / Release Date Pill */}
                <div className="px-3 py-1 rounded-xl bg-[#1b1e2a] border border-[#313648] text-xs font-bold font-mono text-gray-300 shadow-inner mt-4">
                  {deck.date}
                </div>
              </div>
            </Link>
          );
        })}

        {/* Source attribution pill */}
        <div className="pt-4 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            Decks curated from <strong className="text-gray-400">OnePieceTopDecks</strong> &amp; Asian Regional Tournament Champions
          </p>
        </div>
      </main>
    </div>
  );
}
