'use client';

import React, { useState } from 'react';
import { SimCard } from '@/lib/sim/sim-types';
import { RotateCcw, Plus, Minus, Trash2, Eye, ShieldAlert, Sparkles, Swords } from 'lucide-react';
import { handleCardImageError } from '@/lib/card-image';

interface SimCardItemProps {
  card: SimCard;
  isLeader?: boolean;
  onAttack?: (instanceId: string) => void;
  onToggleRest?: (instanceId: string) => void;
  onAttachDon?: (instanceId: string) => void;
  onDetachDon?: (instanceId: string) => void;
  onTrash?: (instanceId: string) => void;
  onInspect?: (card: SimCard) => void;
  canAttachDon?: boolean;
}

export function SimCardItem({
  card,
  isLeader = false,
  onAttack,
  onToggleRest,
  onAttachDon,
  onDetachDon,
  onTrash,
  onInspect,
  canAttachDon = false,
}: SimCardItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Total Power calculation
  const totalPower = (card.power || 0) + card.attachedDon * 1000 + card.customPowerModifier;

  return (
    <div className="relative group flex flex-col items-center">
      {/* Power Badge above card */}
      {(card.power > 0 || card.attachedDon > 0 || isLeader) && (
        <div
          className={`mb-1 px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono shadow-md flex items-center gap-1 border transition-all ${
            card.attachedDon > 0
              ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/30'
              : 'bg-black/80 text-white border-white/20'
          }`}
        >
          {card.attachedDon > 0 && <Sparkles className="w-2.5 h-2.5 text-black" />}
          <span>{totalPower}</span>
          {card.attachedDon > 0 && (
            <span className="text-[8px] bg-black/20 px-1 rounded font-bold">
              +{card.attachedDon * 1000}
            </span>
          )}
        </div>
      )}

      {/* Main Card Frame with Rotation for Rested State */}
      <div
        onClick={() => setShowMenu(!showMenu)}
        className={`relative aspect-[2.5/3.5] w-16 sm:w-20 md:w-24 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-300 shadow-lg ${
          card.rested
            ? 'rotate-90 scale-95 opacity-80 ring-2 ring-amber-500/50'
            : 'hover:scale-105 hover:ring-2 hover:ring-[#f4727d]'
        } ${isLeader ? 'ring-2 ring-yellow-400 shadow-yellow-500/20' : 'border border-white/10'}`}
      >
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
        />

        {/* Rested Dark Overlay */}
        {card.rested && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[9px] font-black uppercase text-amber-300 bg-black/75 px-1.5 py-0.5 rounded tracking-wider border border-amber-400/40">
              RESTED
            </span>
          </div>
        )}

        {/* Attached DON!! Mini Badge on bottom of card */}
        {card.attachedDon > 0 && (
          <div className="absolute bottom-1 inset-x-1 py-0.5 bg-gradient-to-r from-amber-600 to-amber-500 text-black text-[9px] font-black rounded text-center shadow-md flex items-center justify-center gap-0.5 border border-amber-300">
            <span>DON!! ×{card.attachedDon}</span>
          </div>
        )}
      </div>

      {/* Floating Action Menu on Click/Tap */}
      {showMenu && (
        <div className="absolute -bottom-12 sm:-bottom-14 z-40 bg-[#1e2230] border border-[#383e54] rounded-xl p-1.5 shadow-2xl flex items-center gap-1 animate-fadeIn backdrop-blur-md">
          {onAttack && !card.rested && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAttack(card.instanceId);
                setShowMenu(false);
              }}
              title="Attack Opponent Leader"
              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition text-[10px] flex items-center gap-1 font-black shadow-md shadow-red-600/30 active:scale-95"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Hit</span>
            </button>
          )}

          {onToggleRest && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleRest(card.instanceId);
                setShowMenu(false);
              }}
              title={card.rested ? 'Activate' : 'Rest'}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white transition text-[10px] flex items-center gap-1 font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{card.rested ? 'Up' : 'Rest'}</span>
            </button>
          )}

          {onAttachDon && canAttachDon && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAttachDon(card.instanceId);
              }}
              title="Attach Active DON!!"
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition text-[10px] flex items-center gap-1 font-black"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>DON</span>
            </button>
          )}

          {onDetachDon && card.attachedDon > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetachDon(card.instanceId);
              }}
              title="Detach DON!!"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-[10px] flex items-center gap-1 font-bold"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          {!isLeader && onTrash && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTrash(card.instanceId);
                setShowMenu(false);
              }}
              title="Send to Trash (K.O.)"
              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition text-[10px] flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onInspect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(card);
                setShowMenu(false);
              }}
              title="Inspect Details"
              className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition text-[10px] flex items-center"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
