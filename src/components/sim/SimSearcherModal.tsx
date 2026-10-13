'use client';

import React, { useState } from 'react';
import { SimCard, PendingSearcher } from '@/lib/sim/sim-types';
import { Search, Check, ArrowDownToLine, Eye, Shield, Zap, Sparkles } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';
import { simAudio } from '@/lib/sim/sim-audio';

interface SimSearcherModalProps {
  searcher: PendingSearcher;
  onSelectCard: (instanceId: string) => void;
  onPass: () => void;
  onInspect?: (card: SimCard) => void;
}

export function SimSearcherModal({
  searcher,
  onSelectCard,
  onPass,
  onInspect,
}: SimSearcherModalProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const selectedCard = searcher.cards.find((c) => c.instanceId === selectedInstanceId);

  const handleConfirm = () => {
    if (!selectedInstanceId) return;
    simAudio.playCardPlay();
    onSelectCard(selectedInstanceId);
  };

  const handleBottomAll = () => {
    simAudio.playCardPlay();
    onPass();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d14]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#141824] border border-[#273046] rounded-3xl p-5 sm:p-6 max-w-2xl w-full text-center shadow-2xl space-y-4 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-left">
            {searcher.sourceCardImageUrl && (
              <div className="w-10 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 shrink-0 bg-black/40 shadow-xs">
                <img
                  src={searcher.sourceCardImageUrl}
                  alt={searcher.sourceCardName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  {searcher.sourceCardName} &bull; Top {searcher.lookCount} Cards
                </h3>
              </div>
              <p className="text-[11px] text-slate-300">
                Target: <span className="text-amber-300 font-semibold">{searcher.filterDescription || '1 eligible card'}</span>.
                Select 1 card to add to your hand.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Remaining: Bottom of Deck
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              Official Bandai Searcher
            </span>
          </div>
        </div>

        {/* Cards Row (1 to 5 cards) */}
        <div className={`grid gap-2 sm:gap-2.5 py-1 ${
          searcher.cards.length <= 3 ? 'grid-cols-3' : searcher.cards.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
        }`}>
          {searcher.cards.map((card) => {
            const isSelected = selectedInstanceId === card.instanceId;
            return (
              <div
                key={card.instanceId}
                onClick={() => setSelectedInstanceId(card.instanceId)}
                className={`group relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between bg-[#0f121d] ${
                  isSelected
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-102 shadow-lg shadow-emerald-950/60'
                    : 'border-white/15 hover:border-amber-400/80 hover:scale-102 shadow-md'
                }`}
              >
                {/* Card Artwork */}
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                />

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-white/40">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  </div>
                )}

                {/* Cost Badge (Top Left) */}
                <div className="absolute top-1 left-1 bg-black/80 text-blue-300 border border-blue-400/40 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {card.cost}
                </div>

                {/* Counter Badge (Top Right) */}
                {card.counter !== null && card.counter > 0 && (
                  <div className="absolute top-1 right-1 bg-amber-950/85 text-amber-300 border border-amber-400/50 font-black text-[8px] px-1 rounded-full flex items-center gap-0.5 shadow">
                    <Shield className="w-2.5 h-2.5" />
                    <span>+{card.counter >= 1000 ? `${card.counter / 1000}k` : card.counter}</span>
                  </div>
                )}

                {/* Power Badge (Bottom Right) */}
                {card.power > 0 && (
                  <div className="absolute bottom-1 right-1 bg-black/80 text-red-300 border border-red-500/40 font-black text-[8px] px-1 rounded flex items-center gap-0.5 shadow">
                    <Zap className="w-2.5 h-2.5 text-red-400" />
                    <span>{card.power}</span>
                  </div>
                )}

                {/* Inspect Button on hover */}
                {onInspect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspect(card);
                    }}
                    className="absolute bottom-1 left-1 w-5 h-5 rounded-md bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                    title="Inspect card details"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Card Preview Strip */}
        <div className="h-6 flex items-center justify-center text-xs text-slate-300">
          {selectedCard ? (
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Selected: <span className="text-emerald-300">{selectedCard.name}</span>
              {selectedCard.types ? ` (${selectedCard.types})` : ''}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">
              Tap a card to select it, or click Bottom All if no card matches.
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleBottomAll}
            className="py-2.5 px-4 rounded-xl bg-[#1e2436] hover:bg-[#28324a] text-slate-300 border border-slate-600/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            title="Place all cards at the bottom of the deck (no card taken)"
          >
            <ArrowDownToLine className="w-4 h-4 text-slate-400" />
            <span>Bottom All (Pass)</span>
          </button>

          <button
            type="button"
            disabled={!selectedInstanceId}
            onClick={handleConfirm}
            className={`py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              selectedInstanceId
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 active:scale-95'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Add to Hand</span>
          </button>
        </div>
      </div>
    </div>
  );
}
