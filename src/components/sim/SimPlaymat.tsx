'use client';

import React, { useState } from 'react';
import { SimGameState, SimCard } from '@/lib/sim/sim-types';
import {
  advanceNextTurn,
  playCardFromHand,
  attachDonToCard,
  detachDonFromCard,
  toggleCardRest,
  takeLifeDamage,
  sendCardToTrash,
  drawManualCard,
  restActiveDonManual,
  activateRestedDonManual,
  damageOpponent,
  healOpponent,
  attackOpponentLeader,
  switchOpponent,
  performMulligan,
  keepInitialHand,
  initializeGame,
} from '@/lib/sim/sim-engine';
import { SimCardItem } from './SimCardItem';
import { SimMulliganModal } from './SimMulliganModal';
import { SimCardInspectorModal } from './SimCardInspectorModal';
import { SimPileViewerModal } from './SimPileViewerModal';
import {
  Coins,
  Heart,
  RotateCw,
  Plus,
  Minus,
  Trash2,
  Layers,
  Swords,
  ScrollText,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
  Compass,
  ArrowRight,
  Maximize2,
  Users,
  Clock,
  Menu,
  Play,
  X,
  Bug,
} from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { handleCardImageError } from '@/lib/card-image';
import {
  OPCG_PURPLE_BACK_DATA_URL,
  OPCG_DON_DECK_DATA_URL,
  OPCG_DON_CARD_DATA_URL,
} from '@/lib/sim/sim-assets';

interface SimPlaymatProps {
  initialDeck: RecommendedDeck;
  onExit?: () => void;
}

export function SimPlaymat({ initialDeck, onExit }: SimPlaymatProps) {
  // Game state
  const [gameState, setGameState] = useState<SimGameState>(() =>
    initializeGame(
      initialDeck,
      true,
      RECOMMENDED_DECKS[0]?.id !== initialDeck.id ? RECOMMENDED_DECKS[0] : RECOMMENDED_DECKS[1]
    )
  );

  const [inspectedCard, setInspectedCard] = useState<SimCard | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<SimCard | null>(null);
  const [selectedFieldCard, setSelectedFieldCard] = useState<SimCard | null>(null);

  // Restart game
  const handleRestart = (goingFirst: boolean = true) => {
    setGameState(
      initializeGame(
        initialDeck,
        goingFirst,
        RECOMMENDED_DECKS.find((d) => d.id === gameState.opponent.deckId)
      )
    );
  };

  // Turn advance
  const handleNextTurn = () => {
    setGameState((prev) => advanceNextTurn(prev));
    setSelectedHandCard(null);
    setSelectedFieldCard(null);
  };

  // Card Play
  const handlePlayCard = (instanceId: string) => {
    setGameState((prev) => playCardFromHand(prev, instanceId));
    setSelectedHandCard(null);
  };

  // Discard / Trash
  const handleDiscardCard = (instanceId: string) => {
    setGameState((prev) => sendCardToTrash(prev, instanceId));
    setSelectedFieldCard(null);
    setSelectedHandCard(null);
  };

  // Rest / Active toggle
  const handleToggleRest = (instanceId: string) => {
    setGameState((prev) => toggleCardRest(prev, instanceId));
  };

  // DON Attach / Detach
  const handleAttachDon = (instanceId: string) => {
    setGameState((prev) => attachDonToCard(prev, instanceId));
  };

  const handleDetachDon = (instanceId: string) => {
    setGameState((prev) => detachDonFromCard(prev, instanceId));
  };

  // Life damage
  const handleTakeLifeDamage = () => {
    setGameState((prev) => takeLifeDamage(prev));
  };

  // Manual Draw
  const handleManualDraw = () => {
    setGameState((prev) => drawManualCard(prev));
  };

  // Opponent Attacks & Damage
  const handleAttackOpponent = (attackerInstanceId: string) => {
    setGameState((prev) => attackOpponentLeader(prev, attackerInstanceId));
    setSelectedFieldCard(null);
  };

  const handleDirectDamageOpponent = (amount = 1) => {
    setGameState((prev) => damageOpponent(prev, amount));
  };

  const handleHealOpponent = (amount = 1) => {
    setGameState((prev) => healOpponent(prev, amount));
  };

  // Switch opponent deck
  const handleSelectOpponentDeck = (deck: RecommendedDeck) => {
    setGameState((prev) => switchOpponent(prev, deck));
    setShowOpponentSelector(false);
  };

  // Mulligan controls
  const handleMulligan = () => {
    setGameState((prev) => performMulligan(prev));
  };

  const handleKeepHand = () => {
    setGameState((prev) => keepInitialHand(prev));
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 flex flex-col font-sans select-none pb-28 px-1 sm:px-3 pt-1">
      {/* =========================================================================
          TOP APP CONTROLS (Fullscreen trigger & Exit)
         ========================================================================= */}
      <div className="max-w-[700px] mx-auto w-full flex items-center justify-between px-1 py-1 text-gray-400">
        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-1 rounded text-gray-400 hover:text-white transition"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-white/5"
            >
              Exit
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-white/5 flex items-center gap-1"
          >
            <ScrollText className="w-3 h-3" />
            <span>Log</span>
          </button>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto w-full flex flex-col gap-2.5">
        {/* =======================================================================
            1. OPPONENT HUD BAR
           ======================================================================= */}
        <div className="flex items-center gap-2 text-[11px] font-bold px-1 select-none">
          <button
            type="button"
            onClick={() => setShowOpponentSelector(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#14234b] text-[#60a5fa] border border-[#233876] hover:brightness-125 transition active:scale-95"
            title="Click to switch practice opponent"
          >
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="uppercase tracking-wider">OPPONENT: {gameState.opponent.leaderName}</span>
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e1424] text-gray-300 border border-[#1e2942]">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>17:30</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e1424] text-gray-300 border border-[#1e2942]">
            <span className="text-[10px]">🎴</span>
            <span>{gameState.opponent.handCount}</span>
          </div>

          <div className="ml-auto text-[10px] text-gray-400 font-medium">
            ⇅ Original
          </div>
        </div>

        {/* =======================================================================
            2. OPPONENT PLAYMAT (Top Mat - Dark Blue/Navy Theme)
           ======================================================================= */}
        <div className="relative rounded-2xl bg-[#091122]/95 border border-[#1c294a] shadow-2xl p-2 sm:p-3 overflow-hidden">
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
            
            {/* Main Opponent Field Area (Cols 1 to 10) */}
            <div className="col-span-10 flex flex-col justify-between gap-1.5">
              
              {/* Row 1: Trash | Cost Area (DON cards) */}
              <div className="grid grid-cols-5 gap-1.5 items-center">
                {/* Trash */}
                <div
                  className="aspect-[2.5/3.5] rounded-lg border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-600"
                >
                  TRASH
                </div>

                {/* Cost Area (Spans cols 2-5) */}
                <div className="col-span-4 rounded-xl border border-white/10 bg-white/[0.02] p-1.5 min-h-[64px] flex flex-col justify-between relative">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                    COST AREA
                  </span>

                  {/* Opponent miniature DON cards */}
                  <div className="flex items-center justify-center gap-1 my-0.5">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={`opp-don-${idx}`}
                        className="w-8 sm:w-10 aspect-[2.5/3.5] rounded overflow-hidden border border-black/80 shadow-sm"
                      >
                        <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <span>🪙</span> 3
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span>🔄</span> 0
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Deck | Stage | Leader */}
              <div className="grid grid-cols-5 gap-1.5 items-center">
                {/* Deck */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-white/15 bg-black/40 overflow-hidden relative shadow-sm">
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/80 text-white font-mono text-[8px] font-black flex items-center justify-center border border-white/20">
                    42
                  </div>
                </div>

                {/* Stage */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-600">
                  STAGE
                </div>

                {/* Opponent Leader Card */}
                <div
                  onClick={() => handleDirectDamageOpponent(1)}
                  className="aspect-[2.5/3.5] rounded-lg border border-red-500/50 overflow-hidden relative shadow-md cursor-pointer hover:scale-105 transition group"
                  title="Click to deal 1 damage to Opponent Leader"
                >
                  <img
                    src={gameState.opponent.leaderImage}
                    alt={gameState.opponent.leaderName}
                    className="w-full h-full object-cover"
                    onError={(e) => handleCardImageError(e, gameState.opponent.leaderId, gameState.opponent.leaderImage)}
                  />
                  <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[8px] font-black">
                    {gameState.opponent.leaderPower} ⏶
                  </div>
                  <div className="absolute inset-0 bg-red-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-[8px] font-black text-white bg-black/80 px-1 rounded uppercase">HIT (-1)</span>
                  </div>
                </div>

                {/* Spacer */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-transparent" />
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-transparent" />
              </div>

              {/* Row 3: Character Area (5 slots facing player) */}
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-gray-600 block mb-0.5">
                  CHARACTER AREA
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((slotIdx) => (
                    <div
                      key={`opp-char-slot-${slotIdx}`}
                      className="aspect-[2.5/3.5] rounded-lg border border-dashed border-white/10 bg-white/[0.01]"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Cols 11 to 12): DON!! Deck & Life Stack */}
            <div className="col-span-2 flex flex-col justify-between items-center gap-2">
              {/* Opponent DON!! Deck */}
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-bold uppercase text-gray-500 mb-0.5">DON!! DECK</span>
                <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 relative shadow-sm bg-white">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-black/80 text-white font-mono text-[7px] font-black flex items-center justify-center">
                    7
                  </div>
                </div>
              </div>

              {/* Opponent Life Stack (Vertical stack overlapping downwards) */}
              <div
                onClick={() => handleDirectDamageOpponent(1)}
                className="flex flex-col items-center cursor-pointer group"
                title="Click to deal damage to Opponent Life"
              >
                <div className="rounded-t bg-rose-600/90 text-white font-mono text-[8px] font-black px-1.5 py-0.5 text-center tracking-wider w-full">
                  LIFE · {gameState.opponent.life}
                </div>
                <div className="relative flex flex-col -space-y-11 sm:-space-y-13 pt-0.5">
                  {Array.from({ length: Math.min(5, gameState.opponent.life) }).map((_, idx) => (
                    <div
                      key={`opp-life-${idx}`}
                      className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 shadow-md group-hover:brightness-110 transition"
                    >
                      <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Floating Contextual Helper Banner (Matching screenshot) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="px-4 py-1.5 rounded-full bg-[#161a29]/95 border border-amber-400/80 shadow-2xl text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 animate-pulse">
              <span>✦</span>
              <span>Attach a DON!!</span>
            </div>
          </div>
        </div>

        {/* =======================================================================
            3. PLAYER PLAYMAT (Bottom Mat - Dark Forest Green Theme with Gold Border)
           ======================================================================= */}
        <div className="relative rounded-2xl bg-[#091a14]/95 border-2 border-[#d4a017] shadow-2xl p-2 sm:p-3 overflow-hidden">
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
            
            {/* Left Column (Cols 1 to 2): Life Stack & DON!! Deck */}
            <div className="col-span-2 flex flex-col justify-between items-center gap-2">
              {/* Player Life Stack (Vertical stack overlapping downwards) */}
              <div
                onClick={handleTakeLifeDamage}
                className="flex flex-col items-center cursor-pointer group w-full"
                title="Click to take 1 Life damage (add card to hand)"
              >
                <div className="rounded-t bg-rose-600/90 text-white font-mono text-[8px] font-black px-1.5 py-0.5 text-center tracking-wider w-full">
                  LIFE · {gameState.life.length}
                </div>
                <div className="relative flex flex-col -space-y-11 sm:-space-y-13 pt-0.5">
                  {gameState.life.length > 0 ? (
                    Array.from({ length: Math.min(5, gameState.life.length) }).map((_, idx) => (
                      <div
                        key={`player-life-${idx}`}
                        className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 shadow-md group-hover:brightness-110 transition"
                      >
                        <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg border border-dashed border-rose-500/40 flex items-center justify-center text-[7px] text-rose-400 font-bold">
                      0 LIFE
                    </div>
                  )}
                </div>
              </div>

              {/* Player DON!! Deck */}
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-bold uppercase text-gray-400 mb-0.5">DON!! DECK</span>
                <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 relative shadow-sm bg-white">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-black/80 text-white font-mono text-[7px] font-black flex items-center justify-center">
                    {gameState.donDeckCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Player Field Area (Cols 3 to 12) */}
            <div className="col-span-10 flex flex-col justify-between gap-1.5">
              
              {/* Row 1: Character Area (5 slots) */}
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500/80 block mb-0.5">
                  CHARACTER AREA
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const card = gameState.characters[slotIdx];

                    return (
                      <div
                        key={`player-char-${slotIdx}`}
                        className="aspect-[2.5/3.5] rounded-lg border border-dashed border-emerald-500/20 bg-white/[0.01] flex items-center justify-center relative"
                      >
                        {card ? (
                          <div
                            onClick={() => setSelectedFieldCard(card)}
                            className={`w-full h-full rounded-lg overflow-hidden cursor-pointer select-none relative transition duration-200 ${
                              card.rested ? 'rotate-90 scale-95 opacity-80' : 'hover:scale-105'
                            } ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]`}
                          >
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-full h-full object-cover"
                              onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                            />
                            {/* Cost Pill */}
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black/80 text-cyan-300 font-mono text-[8px] font-black flex items-center justify-center border border-cyan-400/60">
                              {card.cost}
                            </div>
                            {/* Power Pill */}
                            {card.power > 0 && (
                              <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[7px] font-black">
                                {card.power + card.attachedDon * 1000} ⏶
                              </div>
                            )}
                            {card.attachedDon > 0 && (
                              <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-amber-500 text-black text-[7px] font-black rounded text-center">
                                DON ×{card.attachedDon}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[8px] text-emerald-600/40 font-mono">Slot {slotIdx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Spacer | Spacer | Leader (Slot 3) | Stage (Slot 4) | Deck (Slot 5) */}
              <div className="grid grid-cols-5 gap-1.5 items-center">
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-transparent" />
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-transparent" />

                {/* Player Leader Card (Center slot) */}
                <div className="flex flex-col items-center">
                  {gameState.leader && (
                    <div className="flex flex-col items-center w-full">
                      <div
                        onClick={() => setSelectedFieldCard(gameState.leader)}
                        className={`w-full aspect-[2.5/3.5] rounded-lg overflow-hidden relative shadow-lg cursor-pointer transition ${
                          gameState.leader.rested ? 'rotate-90 scale-95 opacity-80' : 'hover:scale-105'
                        } ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]`}
                      >
                        <img
                          src={gameState.leader.imageUrl}
                          alt={gameState.leader.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleCardImageError(e, gameState.leader?.cardId, gameState.leader?.imageUrl)}
                        />
                        <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[7px] font-black">
                          {gameState.leader.power + gameState.leader.attachedDon * 1000} ⏶
                        </div>
                        {gameState.leader.attachedDon > 0 && (
                          <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-amber-500 text-black text-[7px] font-black rounded text-center">
                            DON ×{gameState.leader.attachedDon}
                          </div>
                        )}
                      </div>

                      {/* Activate Pill Button beneath Leader (matching reference screenshot) */}
                      <button
                        type="button"
                        onClick={() => handleToggleRest(gameState.leader!.instanceId)}
                        className="mt-1 px-2.5 py-0.5 rounded-full bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-black text-[8px] sm:text-[9px] flex items-center gap-1 shadow-md active:scale-95 transition"
                      >
                        <span>✦</span>
                        <span>{gameState.leader.rested ? 'Active' : 'Activate'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stage Slot */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-emerald-500/20 bg-white/[0.01] flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-emerald-600/40">
                  {gameState.stage ? (
                    <img src={gameState.stage.imageUrl} alt="Stage" className="w-full h-full object-cover rounded" />
                  ) : (
                    'STAGE'
                  )}
                </div>

                {/* Deck Slot */}
                <div
                  onClick={handleManualDraw}
                  className="aspect-[2.5/3.5] rounded-lg border border-white/15 bg-black/40 overflow-hidden relative shadow-sm cursor-pointer hover:scale-105 transition"
                  title="Click to draw 1 card"
                >
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/80 text-white font-mono text-[8px] font-black flex items-center justify-center border border-white/20">
                    {gameState.deck.length}
                  </div>
                </div>
              </div>

              {/* Row 3: Cost Area (spans 4 cols) | Trash (slot 5) */}
              <div className="grid grid-cols-5 gap-1.5 items-center">
                {/* Cost Area (Wide container with miniature DON cards) */}
                <div className="col-span-4 rounded-xl border border-amber-400/40 bg-black/30 p-1.5 min-h-[64px] flex flex-col justify-between relative">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400/80">
                    COST AREA
                  </span>

                  {/* Player miniature DON cards lined up */}
                  <div className="flex items-center justify-start gap-1.5 my-0.5 overflow-x-auto pb-0.5">
                    {Array.from({ length: Math.min(10, gameState.activeDon) }).map((_, idx) => (
                      <div
                        key={`player-don-${idx}`}
                        onClick={() => setGameState((prev) => restActiveDonManual(prev, 1))}
                        className="w-8 sm:w-10 aspect-[2.5/3.5] rounded overflow-hidden border border-amber-400/80 shadow-md cursor-pointer hover:scale-105 transition shrink-0"
                        title="Click to rest 1 DON"
                      >
                        <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {gameState.activeDon === 0 && (
                      <span className="text-[9px] text-gray-500 italic py-1">No active DON!!</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[9px] font-mono text-gray-300">
                    <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                      <span>🪙</span> {gameState.activeDon}
                    </span>
                    <span className="flex items-center gap-0.5 text-gray-400">
                      <span>🔄</span> {gameState.restedDon}
                    </span>
                  </div>
                </div>

                {/* Trash */}
                <div
                  onClick={() => setShowTrashModal(true)}
                  className="aspect-[2.5/3.5] rounded-lg border border-dashed border-emerald-500/20 bg-white/[0.01] flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-emerald-600/40 cursor-pointer hover:border-white/30 transition"
                  title="Click to view Trash Pile"
                >
                  {gameState.trash.length > 0 ? (
                    <img
                      src={gameState.trash[gameState.trash.length - 1].imageUrl}
                      alt="Trash"
                      className="w-full h-full object-cover rounded opacity-80"
                    />
                  ) : (
                    'TRASH'
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* =======================================================================
            4. PLAYER HUD BAR
           ======================================================================= */}
        <div className="flex items-center gap-2 text-[11px] font-bold px-1 select-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#b45309]/20 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-wider">GUEST</span>
            <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-200 uppercase font-mono">TURN</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e1424] text-gray-300 border border-[#1e2942]">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>17:30</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e1424] text-gray-300 border border-[#1e2942]">
            <span className="text-[10px]">🎴</span>
            <span>{gameState.hand.length}</span>
          </div>

          <div className="ml-auto text-[10px] text-gray-400 font-medium">
            ⇅ Original
          </div>
        </div>

        {/* =======================================================================
            5. PLAYER HAND (Row of Cards with Cyan Glow)
           ======================================================================= */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2">
          {gameState.hand.map((card) => {
            const canAfford = gameState.activeDon >= (card.cost || 0);

            return (
              <div
                key={card.instanceId}
                onClick={() => setSelectedHandCard(card)}
                className={`relative w-16 sm:w-20 aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer select-none transition duration-200 hover:-translate-y-2 hover:scale-105 shrink-0 ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] ${
                  canAfford ? 'opacity-100' : 'opacity-80'
                }`}
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                />

                {/* Cost Top-Left */}
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black/85 text-cyan-300 font-mono text-[8px] font-black flex items-center justify-center border border-cyan-400/60 shadow">
                  {card.cost ?? 0}
                </div>

                {/* Power Top-Right */}
                {card.power > 0 && (
                  <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[7px] font-black">
                    {card.power} ⏶
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =======================================================================
            6. BOTTOM CONTROL BAR (Turn Button & End Turn Button)
           ======================================================================= */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Turn 3 Pill (White background, Black text matching screenshot) */}
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg select-none"
          >
            <Menu className="w-3.5 h-3.5 stroke-[3]" />
            <span>TURN {gameState.turn}</span>
          </button>

          {/* End Turn Button (Bright Orange/Amber matching screenshot) */}
          <button
            type="button"
            onClick={handleNextTurn}
            className="px-6 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-xl active:scale-95 transition cursor-pointer select-none"
          >
            <span>End turn</span>
            <span className="text-sm">▷</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          7. CONTEXTUAL CARD ACTION DRAWER (Hand Card Tap)
         ========================================================================= */}
      {selectedHandCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#121624] border border-[#232b45] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative">
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
                <h4 className="text-sm font-black text-white truncate">{selectedHandCard.name}</h4>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Cost: {selectedHandCard.cost} &bull; Power: {selectedHandCard.power || 0}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={gameState.activeDon < (selectedHandCard.cost || 0)}
                onClick={() => handlePlayCard(selectedHandCard.instanceId)}
                className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md ${
                  gameState.activeDon >= (selectedHandCard.cost || 0)
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Play Card ({selectedHandCard.cost} DON)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDiscardCard(selectedHandCard.instanceId)}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. CONTEXTUAL CARD ACTION DRAWER (Field Card Tap)
         ========================================================================= */}
      {selectedFieldCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#121624] border border-[#232b45] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedFieldCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                <img
                  src={selectedFieldCard.imageUrl}
                  alt={selectedFieldCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white truncate">{selectedFieldCard.name}</h4>
                <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                  Total Power: {selectedFieldCard.power + selectedFieldCard.attachedDon * 1000} (DON: {selectedFieldCard.attachedDon})
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Attack Opponent Leader */}
              <button
                type="button"
                onClick={() => handleAttackOpponent(selectedFieldCard.instanceId)}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Attack Leader</span>
              </button>

              {/* Toggle Rest/Active */}
              <button
                type="button"
                onClick={() => {
                  handleToggleRest(selectedFieldCard.instanceId);
                  setSelectedFieldCard(null);
                }}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedFieldCard.rested ? 'Activate' : 'Rest'}</span>
              </button>

              {/* Attach DON!! */}
              <button
                type="button"
                disabled={gameState.activeDon === 0}
                onClick={() => handleAttachDon(selectedFieldCard.instanceId)}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                  gameState.activeDon > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-black font-black'
                    : 'bg-white/5 text-gray-500'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach DON (+1000)</span>
              </button>

              {/* Detach DON!! */}
              <button
                type="button"
                disabled={selectedFieldCard.attachedDon === 0}
                onClick={() => handleDetachDon(selectedFieldCard.instanceId)}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                  selectedFieldCard.attachedDon > 0
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-gray-500'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Detach DON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. MODALS & POPUPS
         ========================================================================= */}
      {/* Mulligan Modal */}
      {gameState.mulliganOffered && (
        <SimMulliganModal
          hand={gameState.hand}
          onKeep={handleKeepHand}
          onMulligan={handleMulligan}
        />
      )}

      {/* High-Resolution Inspector */}
      {inspectedCard && (
        <SimCardInspectorModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}

      {/* Trash Viewer */}
      {showTrashModal && (
        <SimPileViewerModal
          title="Trash Pile"
          cards={gameState.trash}
          onClose={() => setShowTrashModal(false)}
          onSelectCard={(c) => {
            setInspectedCard(c);
            setShowTrashModal(false);
          }}
        />
      )}

      {/* Opponent Selector Modal */}
      {showOpponentSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121624] border border-[#232b45] rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Choose Practice Opponent</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOpponentSelector(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {RECOMMENDED_DECKS.slice(0, 15).map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectOpponentDeck(d)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    gameState.opponent.deckId === d.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-white'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 aspect-[2.5/3.5] rounded overflow-hidden border border-white/10 shrink-0">
                      <img
                        src={d.leaderImage}
                        alt={d.leaderName}
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, d.leaderId, d.leaderImage)}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{d.name}</h4>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>{d.leaderName} ({d.color})</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Combat Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#1e2230] border border-[#373e54] rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">Battle Action Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {gameState.logs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border ${
                    log.type === 'combat'
                      ? 'bg-red-500/10 text-red-200 border-red-500/20'
                      : log.type === 'phase'
                      ? 'bg-amber-500/10 text-amber-200 border-amber-500/20 font-bold'
                      : 'bg-white/5 text-gray-300 border-white/5'
                  }`}
                >
                  <span className="text-gray-500 mr-2">[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
