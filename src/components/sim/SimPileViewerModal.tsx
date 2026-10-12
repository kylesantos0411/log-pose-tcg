'use client';

import React from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { X, Layers } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';

interface SimPileViewerModalProps {
  title: string;
  cards: SimCard[];
  onClose: () => void;
  onSelectCard?: (card: SimCard) => void;
}

export function SimPileViewerModal({
  title,
  cards,
  onClose,
  onSelectCard,
}: SimPileViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#1e2230] border border-[#373e54] rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              {title} ({cards.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {cards.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 italic">
              This pile is currently empty.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {cards.map((c, index) => (
                <div
                  key={`${c.instanceId}-${index}`}
                  onClick={() => onSelectCard?.(c)}
                  className="aspect-[2.5/3.5] rounded-xl overflow-hidden bg-black/40 border border-white/10 hover:border-amber-400 transition cursor-pointer shadow-md group relative hover:scale-105"
                >
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleCardImageError(e, c.cardId, c.imageUrl)}
                  />
                  <div className="absolute bottom-0 inset-x-0 p-1 bg-black/75 text-[9px] font-bold text-white truncate text-center">
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
