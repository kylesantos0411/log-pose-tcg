'use client';

import React from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { RotateCcw, Check, Sparkles, Eye, Shield, Zap } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';

interface SimMulliganModalProps {
  hand: SimCard[];
  hasMulliganed?: boolean;
  onKeep: () => void;
  onMulligan: () => void;
  onInspect?: (card: SimCard) => void;
}

export function SimMulliganModal({
  hand,
  hasMulliganed = false,
  onKeep,
  onMulligan,
  onInspect,
}: SimMulliganModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#181c28] border border-[#2d3548] rounded-3xl p-5 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl text-center">
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${hasMulliganed ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              {hasMulliganed ? '✨ Redrawn Starting Hand' : 'Starting Hand Check'}
            </h3>
            {hasMulliganed && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Mulligan Done
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 max-w-md">
            {hasMulliganed
              ? 'Here are your 5 redrawn cards. In official Bandai rules, exactly 1 mulligan is permitted per match.'
              : 'You drew your opening 5 cards. You may take a 1-time Mulligan to draw 5 fresh cards from your deck and reshuffle your previous hand.'}
          </p>
        </div>

        {/* 5 Cards Row */}
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 py-1">
          {hand.map((card, idx) => (
            <div
              key={card.instanceId || `${card.cardId}-${idx}`}
              onClick={() => onInspect?.(card)}
              className={`group relative aspect-[2.5/3.5] rounded-xl overflow-hidden border transition-all duration-200 bg-[#0f121d] flex flex-col justify-between ${
                onInspect ? 'cursor-pointer hover:scale-105 hover:border-amber-400 shadow-md' : 'border-white/20'
              } ${hasMulliganed ? 'border-emerald-500/40 shadow-emerald-950/40 shadow-lg' : 'border-white/20'}`}
              title={onInspect ? `Click to inspect ${card.name}` : card.name}
            >
              {/* Card Image */}
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
              />

              {/* Cost Badge (Top Left) */}
              <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-xs text-blue-300 border border-blue-400/40 font-black text-[9px] sm:text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                {card.cost}
              </div>

              {/* Counter Badge (Top Right) */}
              {card.counter !== null && card.counter > 0 && (
                <div className="absolute top-1 right-1 bg-amber-950/85 text-amber-300 border border-amber-400/50 font-black text-[8px] sm:text-[9px] px-1 rounded-full flex items-center gap-0.5 shadow">
                  <Shield className="w-2.5 h-2.5" />
                  <span>+{card.counter >= 1000 ? `${card.counter / 1000}k` : card.counter}</span>
                </div>
              )}

              {/* Power Badge (Bottom Right if character/leader) */}
              {card.power > 0 && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-red-300 border border-red-500/40 font-black text-[8px] sm:text-[9px] px-1 rounded flex items-center gap-0.5 shadow">
                  <Zap className="w-2.5 h-2.5 text-red-400" />
                  <span>{card.power}</span>
                </div>
              )}

              {/* Quick Inspect Hint on Hover */}
              {onInspect && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-5 h-5 text-white drop-shadow" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {hasMulliganed ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={onKeep}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition cursor-pointer border border-emerald-400/30"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Start Game with this Hand</span>
            </button>
          </div>
        ) : (
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
              className="py-2.5 px-4 rounded-xl bg-[#252b3d] hover:bg-[#323a52] text-amber-300 border border-amber-500/40 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer hover:border-amber-400"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Redraw (Mulligan)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
