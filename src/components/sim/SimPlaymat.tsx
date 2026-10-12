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
  performMulligan,
  keepInitialHand,
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
} from 'lucide-react';
import { RecommendedDeck } from '@/lib/recommended-decks';
import { initializeGame } from '@/lib/sim/sim-engine';

interface SimPlaymatProps {
  initialDeck: RecommendedDeck;
  onExit?: () => void;
}

export function SimPlaymat({ initialDeck, onExit }: SimPlaymatProps) {
  const [gameState, setGameState] = useState<SimGameState>(() =>
    initializeGame(initialDeck, true)
  );

  const [inspectedCard, setInspectedCard] = useState<SimCard | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Restart game
  const handleRestart = (goingFirst: boolean = true) => {
    setGameState(initializeGame(initialDeck, goingFirst));
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

  // Opponent Damage
  const handleDamageOpponent = (amount = 1) => {
    setGameState((prev) => damageOpponent(prev, amount));
  };

  // Mulligan controls
  const handleMulligan = () => {
    setGameState((prev) => performMulligan(prev));
  };

  const handleKeepHand = () => {
    setGameState((prev) => keepInitialHand(prev));
  };

  return (
    <div className="min-h-screen bg-[#11131b] text-gray-100 flex flex-col font-sans select-none pb-36">
      {/* ================= 1. TOP HEADER / CONTROL BAR ================= */}
      <header className="sticky top-0 z-40 bg-[#191b26]/95 backdrop-blur-md border-b border-[#282d3e] px-3 py-2 sm:px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Deck Info & Turn Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-bold"
              >
                Exit
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate max-w-[150px] sm:max-w-none">
                  {initialDeck.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black font-mono">
                  TURN {gameState.turn}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-gray-400 font-bold">
                  ({gameState.goingFirst ? 'Going 1st' : 'Going 2nd'})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
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

            {/* NEXT TURN Main Button */}
            <button
              type="button"
              onClick={handleNextTurn}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-[#f4727d] to-[#e76d78] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#f4727d]/20 active:scale-95 transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[3]" />
              <span>NEXT TURN</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. MAIN BATTLEFIELD PLAYMAT ================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 space-y-3">
        {/* Opponent Dummy Target Zone */}
        <section className="bg-gradient-to-r from-[#1c1f2c] via-[#212534] to-[#1c1f2c] border border-[#2e3447] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Target Opponent Leader
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">
                  Practice Dummy (5000 Power)
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-black border border-red-500/30 flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-current" />
                  <span>{gameState.opponentLife} Life</span>
                </span>
              </div>
            </div>
          </div>

          {/* Opponent Life Attack Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleDamageOpponent(1)}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[11px] font-black flex items-center gap-1 active:scale-95 transition"
              title="Hit Opponent for 1 Damage"
            >
              <Swords className="w-3 h-3 text-red-400" />
              <span>Hit (-1)</span>
            </button>
            <button
              type="button"
              onClick={() => setGameState((prev) => ({ ...prev, opponentLife: Math.min(10, prev.opponentLife + 1) }))}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
              title="Add 1 Life to Opponent"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Player Field Matrix */}
        <section className="bg-[#171a24] border border-[#282d3e] rounded-3xl p-3 sm:p-5 shadow-2xl relative space-y-4">
          {/* Field Grid: Left Wing (Stage + Leader) | Center (5 Characters) | Right Wing (Piles & DON) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
            
            {/* LEFT WING: Stage & Leader (cols: 3) */}
            <div className="md:col-span-3 flex md:flex-col gap-3 justify-center items-center md:items-start p-2 rounded-2xl bg-white/[0.02] border border-white/5">
              {/* Leader Area */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Leader Area</span>
                </span>
                {gameState.leader && (
                  <SimCardItem
                    card={gameState.leader}
                    isLeader={true}
                    onToggleRest={handleToggleRest}
                    onAttachDon={handleAttachDon}
                    onDetachDon={handleDetachDon}
                    onInspect={setInspectedCard}
                    canAttachDon={gameState.activeDon > 0}
                  />
                )}
              </div>

              {/* Stage Area */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                  Stage Area
                </span>
                {gameState.stage ? (
                  <SimCardItem
                    card={gameState.stage}
                    onToggleRest={handleToggleRest}
                    onTrash={handleDiscardCard}
                    onInspect={setInspectedCard}
                  />
                ) : (
                  <div className="w-16 sm:w-20 aspect-[2.5/3.5] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-[9px] text-gray-500 font-bold text-center p-1">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>

            {/* CENTER: 5 Character Slots (cols: 6) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[170px]">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1 self-start">
                <span>Character Area ({gameState.characters.length}/5)</span>
              </span>

              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full">
                {[0, 1, 2, 3, 4].map((slotIndex) => {
                  const card = gameState.characters[slotIndex];

                  return (
                    <div
                      key={`slot-${slotIndex}`}
                      className="flex flex-col items-center justify-center min-h-[120px]"
                    >
                      {card ? (
                        <SimCardItem
                          card={card}
                          onToggleRest={handleToggleRest}
                          onAttachDon={handleAttachDon}
                          onDetachDon={handleDetachDon}
                          onTrash={handleDiscardCard}
                          onInspect={setInspectedCard}
                          canAttachDon={gameState.activeDon > 0}
                        />
                      ) : (
                        <div className="w-14 sm:w-18 md:w-20 aspect-[2.5/3.5] rounded-lg sm:rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:border-white/20 transition">
                          <span className="text-[9px] font-mono font-bold">Slot {slotIndex + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT WING: Piles & Cost / DON!! Zone (cols: 3) */}
            <div className="md:col-span-3 grid grid-cols-2 gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
              {/* Cost / DON!! Active Pool */}
              <div
                onClick={() => setGameState((prev) => restActiveDonManual(prev, 1))}
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-500/20 transition active:scale-95 shadow-lg"
                title="Click to Rest 1 DON!!"
              >
                <Coins className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-base font-black text-amber-300 font-mono">
                  {gameState.activeDon}
                </span>
                <span className="text-[9px] font-extrabold uppercase text-amber-400/90">
                  Active DON!!
                </span>
              </div>

              {/* Cost / DON!! Rested Pool */}
              <div
                onClick={() => setGameState((prev) => activateRestedDonManual(prev, 1))}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/60 transition active:scale-95"
                title="Click to Activate 1 DON!!"
              >
                <RotateCcw className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-base font-black text-gray-300 font-mono">
                  {gameState.restedDon}
                </span>
                <span className="text-[9px] font-bold uppercase text-gray-400">
                  Rested DON!!
                </span>
              </div>

              {/* Life Stack */}
              <div
                onClick={handleTakeLifeDamage}
                className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-red-500/20 transition active:scale-95"
                title="Tap Life to take 1 Damage (Add to Hand)"
              >
                <Heart className="w-5 h-5 text-red-400 fill-red-400/30 mb-1" />
                <span className="text-base font-black text-red-300 font-mono">
                  {gameState.life.length}
                </span>
                <span className="text-[9px] font-bold uppercase text-red-400">
                  Take Life (-1)
                </span>
              </div>

              {/* Deck Stack */}
              <div
                onClick={handleManualDraw}
                className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-500/20 transition active:scale-95"
                title="Tap Deck to Draw 1 Card"
              >
                <Layers className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-base font-black text-blue-300 font-mono">
                  {gameState.deck.length}
                </span>
                <span className="text-[9px] font-bold uppercase text-blue-400">
                  Draw (+1)
                </span>
              </div>

              {/* Trash Pile (Opens Modal) */}
              <div
                onClick={() => setShowTrashModal(true)}
                className="col-span-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition flex items-center justify-between px-3 cursor-pointer"
                title="Click to View Trash Pile"
              >
                <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold">
                  <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                  <span>Trash Pile ({gameState.trash.length})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= 3. PLAYER HAND TRAY (BOTTOM DOCK) ================= */}
      <SimHandTray
        hand={gameState.hand}
        activeDon={gameState.activeDon}
        onPlayCard={handlePlayCard}
        onDiscardCard={handleDiscardCard}
        onInspectCard={setInspectedCard}
      />

      {/* ================= 4. MODALS & POPUPS ================= */}

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

      {/* Action Log Drawer / Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#1e2230] border border-[#373e54] rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">Match Action Log</h3>
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
