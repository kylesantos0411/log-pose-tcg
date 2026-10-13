'use client';

import React, { useState, useEffect } from 'react';
import { RecommendedDeck } from '@/lib/recommended-decks';
import { Compass, Swords, Shield, Sparkles, Play, Check } from 'lucide-react';
import { handleCardImageError, getEditionCardImageUrl } from '@/lib/card-image';
import { simAudio } from '@/lib/sim/sim-audio';

interface SimMatchmakingModalProps {
  playerDeck: RecommendedDeck;
  opponentDeck: RecommendedDeck;
  onComplete: () => void;
}

export function SimMatchmakingModal({
  playerDeck,
  opponentDeck,
  onComplete,
}: SimMatchmakingModalProps) {
  const [stage, setStage] = useState<'searching' | 'found'>('searching');
  const [secondsRemaining, setSecondsRemaining] = useState(2);

  useEffect(() => {
    // Stage 1: Search for 1.1s
    const timer1 = setTimeout(() => {
      setStage('found');
      simAudio.playCardPlay();
    }, 1100);

    // Stage 2: Auto-proceed after another 1.4s (total 2.5s)
    const timer2 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d14]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#141824] border border-[#273046] rounded-3xl p-6 sm:p-7 max-w-lg w-full text-center shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {stage === 'searching' ? (
          /* SEARCHING STATE */
          <div className="py-4 space-y-5 animate-fadeIn">
            {/* Radar / Compass Spinner */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping opacity-25" />
              {/* Spinning compass ring */}
              <div className="absolute inset-1 rounded-full border-2 border-dashed border-slate-600 animate-spin [animation-duration:8s]" />
              {/* Inner glowing circle */}
              <div className="w-16 h-16 rounded-2xl bg-[#1c2233] border border-[#333d59] flex items-center justify-center shadow-inner">
                <Compass className="w-8 h-8 text-amber-400 animate-spin [animation-duration:3s]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Log Pose Matchmaking
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                Finding Opponent...
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scanning tournament decks and Grand Line captains for a worthy match.
              </p>
            </div>

            {/* Quick Skip button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onComplete}
                className="text-[11px] font-bold text-slate-400 hover:text-white transition uppercase tracking-wider underline cursor-pointer"
              >
                Skip to Battle
              </button>
            </div>
          </div>
        ) : (
          /* OPPONENT FOUND STATE */
          <div className="py-2 space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Opponent Found!</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                Match Ready
              </h3>
            </div>

            {/* VS Face-Off Cards */}
            <div className="grid grid-cols-11 items-center gap-2 pt-1 pb-2">
              {/* Player Side (Cols 1-5) */}
              <div className="col-span-5 flex flex-col items-center space-y-2">
                <div className="relative aspect-[2.5/3.5] w-24 sm:w-28 rounded-xl overflow-hidden border-2 border-blue-400/40 shadow-lg bg-[#0e121d]">
                  <img
                    src={getEditionCardImageUrl(playerDeck.leaderId, 'jp', playerDeck.leaderImage)}
                    alt={playerDeck.leaderName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleCardImageError(e, playerDeck.leaderId, playerDeck.leaderImage)}
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-blue-600/90 text-[8px] font-black uppercase text-white shadow">
                    YOU
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-white truncate max-w-[120px]">
                    {playerDeck.leaderName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {playerDeck.name}
                  </div>
                </div>
              </div>

              {/* VS Emblem (Col 6) */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#1e2538] border border-[#3b4766] flex items-center justify-center shadow-md">
                  <Swords className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              {/* Opponent Side (Cols 7-11) */}
              <div className="col-span-5 flex flex-col items-center space-y-2">
                <div className="relative aspect-[2.5/3.5] w-24 sm:w-28 rounded-xl overflow-hidden border-2 border-red-500/40 shadow-lg bg-[#0e121d]">
                  <img
                    src={getEditionCardImageUrl(opponentDeck.leaderId, 'jp', opponentDeck.leaderImage)}
                    alt={opponentDeck.leaderName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleCardImageError(e, opponentDeck.leaderId, opponentDeck.leaderImage)}
                  />
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-red-600/90 text-[8px] font-black uppercase text-white shadow">
                    OPPONENT
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-white truncate max-w-[120px]">
                    {opponentDeck.leaderName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {opponentDeck.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Ready / Start Now Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onComplete}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition cursor-pointer border border-emerald-400/30"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Match</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
