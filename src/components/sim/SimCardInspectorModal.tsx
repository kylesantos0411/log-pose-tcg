'use client';

import React from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { X, Sparkles, Shield, Zap, Info } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';

interface SimCardInspectorModalProps {
  card: SimCard | null;
  onClose: () => void;
}

export function SimCardInspectorModal({ card, onClose }: SimCardInspectorModalProps) {
  if (!card) return null;

  const totalPower = (card.power || 0) + card.attachedDon * 1000 + card.customPowerModifier;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#1e2230] border border-[#373e54] rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-extrabold text-white">Card Inspector</h3>
        </div>

        {/* Card Presentation */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Card Visual */}
          <div className="w-36 sm:w-44 aspect-[2.5/3.5] rounded-2xl overflow-hidden bg-black/50 border border-white/20 shadow-2xl shrink-0">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 space-y-2.5 text-left w-full">
            <div>
              <h4 className="text-lg font-black text-white leading-tight">
                {card.name}
              </h4>
              <div className="text-xs font-mono text-gray-400 mt-0.5">
                {card.cardId} • {card.category}
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                Cost: {card.cost}
              </span>

              {card.power > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 font-mono">
                  Base Power: {card.power}
                </span>
              )}

              {card.attachedDon > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-black font-black text-xs flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3 text-black" />
                  <span>+{card.attachedDon * 1000} ({card.attachedDon} DON!!)</span>
                </span>
              )}
            </div>

            {/* Total Power Highlight */}
            {(card.power > 0 || card.attachedDon > 0 || card.category === 'Leader') && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#282d3e] to-[#1f2331] border border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Total Combat Power:</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {totalPower}
                </span>
              </div>
            )}

            {/* Attributes / Traits */}
            {card.types && (
              <div className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Traits:</span> {card.types}
              </div>
            )}

            {/* Effect Text */}
            {card.effect && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Effect</span>
                </div>
                <p className="text-xs text-gray-200 whitespace-pre-line leading-relaxed">
                  {card.effect}
                </p>
              </div>
            )}

            {/* Trigger Text */}
            {card.trigger && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Trigger</span>
                </div>
                <p className="text-xs text-amber-200/90 whitespace-pre-line leading-relaxed">
                  {card.trigger}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
