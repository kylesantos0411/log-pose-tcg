'use client';

import React, { useState } from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { X, Sparkles, Shield, Zap, Info, Languages } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';
import { getCardTranslation } from '@/lib/sim/sim-translations';

interface SimCardInspectorModalProps {
  card: SimCard | null;
  onClose: () => void;
}

export function SimCardInspectorModal({ card, onClose }: SimCardInspectorModalProps) {
  const [showEnglishText, setShowEnglishText] = useState(true);

  if (!card) return null;

  const translation = getCardTranslation(card.cardId);
  const totalPower = (card.power || 0) + (card.attachedDon || 0) * 1000 + (card.customPowerModifier || 0);

  const displayName = (showEnglishText && (translation?.name && translation.name !== card.cardId ? translation.name : card.englishName)) || card.name;
  const displayEffect = (showEnglishText && (translation?.effect || card.englishEffect)) || card.effect;
  const displayTrigger = (showEnglishText && (translation?.trigger || card.englishTrigger)) || card.trigger;
  const displayTraits = (showEnglishText && (translation?.types || card.types)) || card.types || null;
  const counterVal = card.counter ?? translation?.counter ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#1e2230] border border-[#373e54] rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Language Toggle */}
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-extrabold text-white">Card Inspector</h3>
          </div>

          {/* English / Japanese Description Switch */}
          <button
            type="button"
            onClick={() => setShowEnglishText((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>{showEnglishText ? 'English Translation' : 'Japanese View'}</span>
          </button>
        </div>

        {/* Card Presentation */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Card Visual */}
          <div className="w-36 sm:w-44 aspect-[2.5/3.5] rounded-2xl overflow-hidden bg-black/50 border border-white/20 shadow-2xl shrink-0">
            <img
              src={card.imageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 space-y-2.5 text-left w-full">
            <div>
              <h4 className="text-lg font-black text-white leading-tight">
                {displayName}
              </h4>
              {translation?.japaneseName && showEnglishText && (
                <div className="text-[11px] text-gray-400 font-sans mt-0.5">
                  JP: {translation.japaneseName}
                </div>
              )}
              <div className="text-xs font-mono text-gray-400 mt-0.5">
                {card.cardId} &bull; {card.category}
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

              {counterVal && counterVal > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 font-mono">
                  Counter: +{counterVal}
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
            {displayTraits && (
              <div className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Traits:</span> {displayTraits}
              </div>
            )}

            {/* Effect Text */}
            {displayEffect && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Effect {showEnglishText ? '(English)' : ''}</span>
                </div>
                <p className="text-xs text-gray-200 whitespace-pre-line leading-relaxed">
                  {displayEffect}
                </p>
              </div>
            )}

            {/* Trigger Text */}
            {displayTrigger && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Trigger {showEnglishText ? '(English)' : ''}</span>
                </div>
                <p className="text-xs text-amber-200/90 whitespace-pre-line leading-relaxed">
                  {displayTrigger}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
