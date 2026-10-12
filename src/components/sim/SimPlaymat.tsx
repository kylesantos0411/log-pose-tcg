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
import { SimHandTray } from './SimHandTray';
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
} from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { getSafeCardImageUrl, getSvgPlaceholderDataUrl, handleCardImageError } from '@/lib/card-image';

interface SimPlaymatProps {
  initialDeck: RecommendedDeck;
  onExit?: () => void;
}

export function SimPlaymat({ initialDeck, onExit }: SimPlaymatProps) {
  // Game state
  const [gameState, setGameState] = useState<SimGameState>(() =>
    initializeGame(initialDeck, true, RECOMMENDED_DECKS[0]?.id !== initialDeck.id ? RECOMMENDED_DECKS[0] : RECOMMENDED_DECKS[1])
  );

  const [inspectedCard, setInspectedCard] = useState<SimCard | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);

  // Restart game
  const handleRestart = (goingFirst: boolean = true) => {
    setGameState(initializeGame(initialDeck, goingFirst, RECOMMENDED_DECKS.find(d => d.id === gameState.opponent.deckId)));
  };

  // Turn advance
  const handleNextTurn = () => {
    setGameState((prev) => advanceNextTurn(prev));
  };

  // Card Play
  const handlePlayCard = (instanceId: string) => {
    setGameState((prev) => playCardFromHand(prev, instanceId));
  };

  // Discard / Trash
  const handleDiscardCard = (instanceId: string) => {
    setGameState((prev) => sendCardToTrash(prev, instanceId));
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

  const cardBackUrl = getSvgPlaceholderDataUrl('OPTCG');

  return (
    <div className="min-h-screen bg-[#0b0d14] text-gray-100 flex flex-col font-sans select-none pb-40">
      {/* =========================================================================
          1. TOP ACTION HUD (Symmetrical Deck vs Opponent, Phase, Controls)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#121520]/95 backdrop-blur-md border-b border-[#212638] px-3 py-2 sm:px-5 shadow-xl">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-2">
          {/* Match Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white font-bold transition shrink-0"
              >
                Exit
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-black text-white truncate">
                {initialDeck.leaderName}
              </span>
              <span className="text-xs font-bold text-gray-500">vs</span>
              <button
                type="button"
                onClick={() => setShowOpponentSelector(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-amber-300 font-bold transition truncate max-w-[140px] sm:max-w-[200px]"
                title="Click to change opponent deck"
              >
                <span className="truncate">{gameState.opponent.leaderName}</span>
                <span className="text-[10px] text-gray-400 font-mono">▾</span>
              </button>
            </div>
          </div>

          {/* Phase & Turn Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/5 text-white border border-white/10 text-xs font-black tracking-wider uppercase font-mono">
              TURN {gameState.turn}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-black tracking-wider uppercase">
              MAIN PHASE
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Logs Drawer Trigger */}
            <button
              type="button"
              onClick={() => setShowLogModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
              title="View Action Log"
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log</span>
            </button>

            {/* Restart Match */}
            <button
              type="button"
              onClick={() => handleRestart(gameState.goingFirst)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
              title="Restart Game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restart</span>
            </button>

            {/* END TURN Main Button */}
            <button
              type="button"
              onClick={handleNextTurn}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 via-[#e05d68] to-[#f4727d] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[3]" />
              <span>END TURN</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. THE DIGITAL ARENA (Authentic Tabletop Playmat)
         ========================================================================= */}
      <main className="flex-1 max-w-[1500px] mx-auto w-full p-2 sm:p-4 space-y-4">
        
        {/* =====================================================================
            OPPONENT FIELD (Top Half - Mirrored Layout)
           ===================================================================== */}
        <section className="bg-[#121520]/80 border border-[#212638] rounded-2xl sm:rounded-3xl p-3 sm:p-5 relative shadow-xl overflow-hidden">
          {/* Subtle Zone Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-[11px] text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="font-bold text-gray-300 uppercase tracking-wider">
                Opponent Arena &bull; {gameState.opponent.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-gray-400">
                Deck: {gameState.opponent.deckCount} &bull; Hand: {gameState.opponent.handCount}
              </span>
            </div>
          </div>

          {/* Opponent Symmetrical Row: Deck/Trash | Leader & Life | Cost Area */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center mb-4">
            {/* Opponent Left: Deck & Trash */}
            <div className="col-span-3 flex items-center gap-2">
              {/* Opponent Deck Pile */}
              <div
                className="w-12 sm:w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/10 shadow-md relative bg-black/40 flex items-center justify-center"
                title={`Opponent Deck (${gameState.opponent.deckCount} cards)`}
              >
                <img src={cardBackUrl} alt="Opponent Deck" className="w-full h-full object-cover opacity-80" />
                <span className="absolute inset-x-0 bottom-1 text-center font-mono font-black text-[9px] text-white bg-black/60 py-0.5">
                  {gameState.opponent.deckCount}
                </span>
              </div>

              {/* Opponent Hand Visual Preview */}
              <div className="hidden sm:flex -space-x-4 overflow-hidden py-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={`opp-hand-${i}`}
                    className="w-10 aspect-[2.5/3.5] rounded-md border border-white/10 shadow-sm bg-black/40 overflow-hidden transform -rotate-3"
                  >
                    <img src={cardBackUrl} alt="Card" className="w-full h-full object-cover opacity-60" />
                  </div>
                ))}
              </div>
            </div>

            {/* Opponent Center: Opponent Leader + Life Stack + Direct Attack Trigger */}
            <div className="col-span-6 flex items-center justify-center gap-3 sm:gap-5">
              {/* Opponent Life Stack */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => handleDirectDamageOpponent(1)}
                  className="relative cursor-pointer group"
                  title="Click to deal 1 direct damage to Opponent Life"
                >
                  <div className="w-12 sm:w-16 aspect-[2.5/3.5] rounded-lg border border-red-500/40 bg-red-950/40 p-1 flex flex-col items-center justify-center text-center shadow-lg group-hover:scale-105 transition">
                    <Heart className="w-5 h-5 text-red-400 fill-red-400 mb-0.5 animate-pulse" />
                    <span className="font-mono font-black text-sm sm:text-base text-red-200">
                      {gameState.opponent.life}
                    </span>
                    <span className="text-[8px] font-black uppercase text-red-400">
                      LIFE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleDirectDamageOpponent(1)}
                    className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold"
                    title="Take 1 Opponent Life"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHealOpponent(1)}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold"
                    title="Add 1 Opponent Life"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Opponent Leader Card */}
              <div className="flex flex-col items-center">
                <div className="mb-1 px-2 py-0.5 rounded-full bg-black/80 text-white border border-white/20 text-[10px] font-black font-mono shadow-md">
                  {gameState.opponent.leaderPower} POWER
                </div>

                <div
                  onClick={() => handleDirectDamageOpponent(1)}
                  className="relative aspect-[2.5/3.5] w-16 sm:w-20 md:w-24 rounded-lg sm:rounded-xl overflow-hidden border-2 border-red-500/50 shadow-xl cursor-pointer group hover:scale-105 transition duration-200"
                  title="Click to Attack Opponent Leader"
                >
                  <img
                    src={gameState.opponent.leaderImage}
                    alt={gameState.opponent.leaderName}
                    className="w-full h-full object-cover"
                    onError={(e) => handleCardImageError(e, gameState.opponent.leaderId, gameState.opponent.leaderImage)}
                  />
                  
                  {/* Attack Overlay on Hover */}
                  <div className="absolute inset-0 bg-red-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition gap-1">
                    <Swords className="w-5 h-5 text-red-400 animate-bounce" />
                    <span className="text-[9px] font-black tracking-wider uppercase bg-black/80 px-1.5 py-0.5 rounded">
                      HIT (-1)
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-gray-300 mt-1 truncate max-w-[100px]">
                  {gameState.opponent.leaderName}
                </span>
              </div>
            </div>

            {/* Opponent Right: Cost / DON!! Info */}
            <div className="col-span-3 flex justify-end">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                <Coins className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="font-mono font-black text-xs sm:text-sm text-amber-300">
                  10 DON!!
                </span>
                <span className="text-[8px] font-bold uppercase text-gray-400">
                  Opponent Cost
                </span>
              </div>
            </div>
          </div>

          {/* Opponent Frontline: 5 Character Slots */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1.5 text-center">
              Opponent Battle Line
            </span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-w-2xl mx-auto">
              {[0, 1, 2, 3, 4].map((slotIdx) => (
                <div
                  key={`opp-char-slot-${slotIdx}`}
                  className="aspect-[2.5/3.5] rounded-lg sm:rounded-xl border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center text-[9px] text-gray-600 font-mono"
                >
                  Slot {slotIdx + 1}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            GRAND LINE BATTLE DIVIDER
           ===================================================================== */}
        <div className="flex items-center justify-center gap-3 py-1 opacity-70">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>THE GRAND LINE BATTLEFIELD</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
        </div>

        {/* =====================================================================
            PLAYER FIELD (Bottom Half - Authentic Layout)
           ===================================================================== */}
        <section className="bg-[#121520] border border-[#24293c] rounded-2xl sm:rounded-3xl p-3 sm:p-5 relative shadow-2xl space-y-4">
          
          {/* Row 1: Player Frontline (5 Character Slots) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Swords className="w-3 h-3" />
                <span>Character Battle Line ({gameState.characters.length}/5)</span>
              </span>
              <span className="text-[10px] text-gray-400">
                Click character to Attack Leader, Attach DON!!, Rest, or Trash
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-3 max-w-3xl mx-auto min-h-[125px] sm:min-h-[145px]">
              {[0, 1, 2, 3, 4].map((slotIndex) => {
                const card = gameState.characters[slotIndex];

                return (
                  <div
                    key={`player-char-${slotIndex}`}
                    className="flex flex-col items-center justify-center"
                  >
                    {card ? (
                      <SimCardItem
                        card={card}
                        onAttack={handleAttackOpponent}
                        onToggleRest={handleToggleRest}
                        onAttachDon={handleAttachDon}
                        onDetachDon={handleDetachDon}
                        onTrash={handleDiscardCard}
                        onInspect={setInspectedCard}
                        canAttachDon={gameState.activeDon > 0}
                      />
                    ) : (
                      <div className="w-14 sm:w-20 md:w-24 aspect-[2.5/3.5] rounded-lg sm:rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/30 transition flex flex-col items-center justify-center text-gray-600 bg-black/20">
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase text-gray-500">
                          Slot {slotIndex + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2: Player Backline (Life | Stage | LEADER (Center) | DON!! Cost | Deck & Trash) */}
          <div className="pt-3 border-t border-white/5 grid grid-cols-12 gap-2 sm:gap-4 items-center">
            
            {/* 1. Life Area (Left Wing) */}
            <div className="col-span-3 flex flex-col items-center sm:items-start">
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-400" />
                <span>Life ({gameState.life.length})</span>
              </span>

              <div
                onClick={handleTakeLifeDamage}
                className="relative cursor-pointer group"
                title="Tap to take 1 Damage (Add top card to Hand)"
              >
                {gameState.life.length > 0 ? (
                  <div className="relative">
                    {/* Visual 3D Stack Effect */}
                    {gameState.life.length > 1 && (
                      <div className="absolute top-1 left-1 w-12 sm:w-16 aspect-[2.5/3.5] rounded-lg bg-black/60 border border-white/10 -z-10" />
                    )}
                    <div className="w-12 sm:w-16 aspect-[2.5/3.5] rounded-lg border-2 border-rose-500/40 bg-rose-950/30 p-1 flex flex-col items-center justify-center text-center shadow-lg group-hover:scale-105 transition">
                      <Heart className="w-5 h-5 text-rose-400 fill-rose-400/40 mb-0.5" />
                      <span className="font-mono font-black text-sm sm:text-base text-rose-200">
                        {gameState.life.length}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-black uppercase text-rose-400">
                        TAKE HIT
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-12 sm:w-16 aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-rose-500/20 flex flex-col items-center justify-center text-[8px] text-rose-400 font-bold text-center p-1">
                    <span>0 LIFE</span>
                    <span className="text-[7px] text-gray-500">LETHAL!</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Stage & LEADER (Center Hub) */}
            <div className="col-span-6 flex items-center justify-center gap-3 sm:gap-6">
              {/* Stage Slot */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Stage
                </span>
                {gameState.stage ? (
                  <SimCardItem
                    card={gameState.stage}
                    onToggleRest={handleToggleRest}
                    onTrash={handleDiscardCard}
                    onInspect={setInspectedCard}
                  />
                ) : (
                  <div className="w-14 sm:w-18 md:w-20 aspect-[2.5/3.5] rounded-lg sm:rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-[8px] text-gray-500 font-bold text-center p-1 bg-black/20">
                    Stage
                  </div>
                )}
              </div>

              {/* Player Leader Card (Prominent Center) */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Leader Area</span>
                </span>

                {gameState.leader && (
                  <SimCardItem
                    card={gameState.leader}
                    isLeader={true}
                    onAttack={handleAttackOpponent}
                    onToggleRest={handleToggleRest}
                    onAttachDon={handleAttachDon}
                    onDetachDon={handleDetachDon}
                    onInspect={setInspectedCard}
                    canAttachDon={gameState.activeDon > 0}
                  />
                )}
              </div>
            </div>

            {/* 3. Cost Pool & Deck/Trash (Right Wing) */}
            <div className="col-span-3 flex items-center justify-end gap-2 sm:gap-3">
              {/* DON!! Pool */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 mb-1">
                  Cost Pool
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Active DON!! */}
                  <div
                    onClick={() => setGameState((prev) => restActiveDonManual(prev, 1))}
                    className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 cursor-pointer text-center transition active:scale-95 shadow-md"
                    title="Click to rest 1 DON!!"
                  >
                    <Coins className="w-4 h-4 text-amber-400 mx-auto" />
                    <span className="font-mono font-black text-sm text-amber-300 block">
                      {gameState.activeDon}
                    </span>
                    <span className="text-[7px] font-extrabold uppercase text-amber-400 block">
                      Active
                    </span>
                  </div>

                  {/* Rested DON!! */}
                  <div
                    onClick={() => setGameState((prev) => activateRestedDonManual(prev, 1))}
                    className="p-1.5 sm:p-2 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 cursor-pointer text-center transition active:scale-95"
                    title="Click to activate 1 Rested DON!!"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-400 mx-auto" />
                    <span className="font-mono font-black text-sm text-gray-300 block">
                      {gameState.restedDon}
                    </span>
                    <span className="text-[7px] font-bold uppercase text-gray-500 block">
                      Rested
                    </span>
                  </div>
                </div>
              </div>

              {/* Deck & Trash */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Deck &bull; Trash
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Deck */}
                  <div
                    onClick={handleManualDraw}
                    className="w-10 sm:w-12 aspect-[2.5/3.5] rounded-lg border border-blue-500/40 bg-black/40 overflow-hidden cursor-pointer hover:scale-105 transition shadow-md relative"
                    title="Click to Draw 1 Card"
                  >
                    <img src={cardBackUrl} alt="Deck" className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0.5 text-center font-mono font-black text-[8px] text-blue-200 bg-black/70">
                      {gameState.deck.length}
                    </span>
                  </div>

                  {/* Trash */}
                  <div
                    onClick={() => setShowTrashModal(true)}
                    className="w-10 sm:w-12 aspect-[2.5/3.5] rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden cursor-pointer hover:border-white/30 transition flex flex-col items-center justify-center p-1 text-center"
                    title="Click to view Trash Pile"
                  >
                    {gameState.trash.length > 0 ? (
                      <img
                        src={gameState.trash[gameState.trash.length - 1].imageUrl}
                        alt="Trash top"
                        className="w-full h-full object-cover rounded opacity-80"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[7px] font-mono mt-0.5">0</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* =========================================================================
          3. PLAYER HAND TRAY (BOTTOM DOCK)
         ========================================================================= */}
      <SimHandTray
        hand={gameState.hand}
        activeDon={gameState.activeDon}
        onPlayCard={handlePlayCard}
        onDiscardCard={handleDiscardCard}
        onInspectCard={setInspectedCard}
      />

      {/* =========================================================================
          4. MODALS & POPUPS
         ========================================================================= */}

      {/* Opening Hand Mulligan Modal */}
      {gameState.mulliganOffered && (
        <SimMulliganModal
          hand={gameState.hand}
          onKeep={handleKeepHand}
          onMulligan={handleMulligan}
        />
      )}

      {/* High-Resolution Card Inspector */}
      {inspectedCard && (
        <SimCardInspectorModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}

      {/* Trash Pile Viewer */}
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

      {/* Opponent Leader Selector Modal */}
      {showOpponentSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171a26] border border-[#2d3448] rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
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

            <p className="text-xs text-gray-400">
              Select any tournament leader deck to test your deck against on the digital battlefield:
            </p>

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
                        <span>&bull;</span>
                        <span className="text-amber-400">{d.tournament}</span>
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
                    log.type === 'phase'
                      ? 'bg-amber-500/10 text-amber-200 border-amber-500/20 font-bold'
                      : log.type === 'combat'
                      ? 'bg-red-500/10 text-red-200 border-red-500/20'
                      : log.type === 'system'
                      ? 'bg-blue-500/10 text-blue-200 border-blue-500/20'
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
