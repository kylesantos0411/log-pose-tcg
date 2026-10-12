'use client';

import React from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { RotateCcw, Check, Sparkles } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';

interface SimMulliganModalProps {
  hand: SimCard[];
  onKeep: () => void;
  onMulligan: () => void;
}

export function SimMulliganModal({ hand, onKeep, onMulligan }: SimMulliganModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#1e2230] border border-[#373e54] rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 text-amber-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
            Starting Hand Check
          </h3>
        </div>

        <p className="text-xs text-gray-300">
          You drew your opening 5 cards. You may take a 1-time Mulligan to return your hand to the deck, reshuffle, and draw 5 new cards.
        </p>

        {/* 5 Cards Row */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 py-2">
          {hand.map((card) => (
            <div
              key={card.instanceId}
              className="aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 shadow-md bg-black/40"
            >
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onKeep}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Keep Hand</span>
          </button>

          <button
            type="button"
            onClick={onMulligan}
            className="py-2.5 px-4 rounded-xl bg-[#2b3040] hover:bg-[#383f54] text-amber-300 border border-amber-500/40 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Redraw (Mulligan)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
