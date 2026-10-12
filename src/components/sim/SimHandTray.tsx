'use client';

import React, { useState } from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { Play, Shield, Trash2, Eye, X, Coins } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';

interface SimHandTrayProps {
  hand: SimCard[];
  activeDon: number;
  onPlayCard: (instanceId: string) => void;
  onDiscardCard: (instanceId: string) => void;
  onInspectCard: (card: SimCard) => void;
}

export function SimHandTray({
  hand,
  activeDon,
  onPlayCard,
  onDiscardCard,
  onInspectCard,
}: SimHandTrayProps) {
  const [selectedHandCard, setSelectedHandCard] = useState<SimCard | null>(null);

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-[#161824]/95 backdrop-blur-md border-t border-[#2a2f40] px-3 py-2 shadow-2xl">
      {/* Hand header row */}
      <div className="max-w-5xl mx-auto flex items-center justify-between pb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-gray-300">
            Hand ({hand.length})
          </span>
          <span className="text-[10px] text-gray-400">
            Tap a card to Play, Counter, or Inspect
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-gray-400">Available:</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{activeDon} DON!!</span>
          </span>
        </div>
      </div>

      {/* Horizontal card tray */}
      <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {hand.length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-500 w-full italic">
            Your hand is currently empty. Draw from deck to add cards.
          </div>
        ) : (
          hand.map((card) => {
            const canAfford = activeDon >= (card.cost || 0);

            return (
              <div
                key={card.instanceId}
                onClick={() => setSelectedHandCard(card)}
                className={`relative flex-shrink-0 w-16 sm:w-20 md:w-22 aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer select-none border transition-all duration-200 active:scale-95 group ${
                  selectedHandCard?.instanceId === card.instanceId
                    ? 'ring-2 ring-[#f4727d] scale-105 shadow-xl -translate-y-1'
                    : canAfford
                    ? 'border-amber-400/50 hover:border-amber-300 hover:-translate-y-1'
                    : 'border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Hand Card Action Drawer / Sheet Modal */}
      {selectedHandCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#1e2230] border border-[#373e54] rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-sm w-full space-y-3.5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedHandCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                <img
                  src={selectedHandCard.imageUrl}
                  alt={selectedHandCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white truncate">
                  {selectedHandCard.name}
                </h4>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {selectedHandCard.cardId} • {selectedHandCard.category}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                    Cost: {selectedHandCard.cost ?? 0}
                  </span>
                  {selectedHandCard.power > 0 && (
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                      Power: {selectedHandCard.power}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="space-y-2 pt-1">
              {/* Play to Field */}
              <button
                type="button"
                disabled={activeDon < (selectedHandCard.cost || 0)}
                onClick={() => {
                  onPlayCard(selectedHandCard.instanceId);
                  setSelectedHandCard(null);
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeDon >= (selectedHandCard.cost || 0)
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:brightness-110 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play to Field (Costs {selectedHandCard.cost || 0} DON!!)</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                {/* Counter / Discard */}
                <button
                  type="button"
                  onClick={() => {
                    onDiscardCard(selectedHandCard.instanceId);
                    setSelectedHandCard(null);
                  }}
                  className="py-2 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Counter</span>
                </button>

                {/* Send to Trash */}
                <button
                  type="button"
                  onClick={() => {
                    onDiscardCard(selectedHandCard.instanceId);
                    setSelectedHandCard(null);
                  }}
                  className="py-2 px-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Trash</span>
                </button>

                {/* Inspect */}
                <button
                  type="button"
                  onClick={() => {
                    onInspectCard(selectedHandCard);
                    setSelectedHandCard(null);
                  }}
                  className="py-2 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
