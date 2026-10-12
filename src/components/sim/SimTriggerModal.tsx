'use client';

import React from 'react';
import Image from 'next/image';
import { SimCard } from '@/lib/sim/sim-types';
import { Zap, ShieldAlert, ArrowDownToLine } from 'lucide-react';

interface SimTriggerModalProps {
  card: SimCard;
  effect: string;
  onActivate: () => void;
  onDismiss: () => void;
}

export const SimTriggerModal: React.FC<SimTriggerModalProps> = ({
  card,
  effect,
  onActivate,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-2.5 flex items-center justify-between text-zinc-950">
          <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-sm">
            <Zap className="w-4 h-4 fill-current animate-pulse text-zinc-950" />
            <span>TRIGGER ACTIVATION</span>
          </div>
          <span className="text-[10px] font-bold bg-zinc-950/20 px-2 py-0.5 rounded-full uppercase">
            Bandai Rules
          </span>
        </div>

        <div className="p-4 flex flex-col items-center text-center">
          {/* Card Graphic Preview */}
          <div className="relative w-28 h-40 rounded-lg overflow-hidden border border-amber-400/40 shadow-lg my-2 group">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                {card.name}
              </div>
            )}
            <div className="absolute top-1 right-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
              {card.category}
            </div>
          </div>

          <h3 className="font-extrabold text-base text-zinc-100 tracking-tight mt-1">
            {card.name}
          </h3>
          <p className="text-xs text-zinc-400">{card.cardId}</p>

          {/* Trigger Effect Box */}
          <div className="w-full mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>[Trigger Effect]</span>
            </div>
            <p className="text-xs font-medium text-amber-200/90 leading-relaxed">
              {card.englishTrigger || effect}
            </p>
          </div>

          <p className="text-[11px] text-zinc-400 mt-2.5 px-2 leading-tight">
            You took Life damage! You may activate this card&apos;s Trigger effect immediately, or decline and add it to your hand.
          </p>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={onDismiss}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition active:scale-95"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Add to Hand</span>
            </button>
            <button
              onClick={onActivate}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Activate Trigger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
