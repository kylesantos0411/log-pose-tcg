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
  attackOpponentCharacter,
  switchOpponent,
  performMulligan,
  keepInitialHand,
  initializeGame,
  setTutorialStep,
  toggleTutorialMode,
} from '@/lib/sim/sim-engine';
import { SimCardInspectorModal } from './SimCardInspectorModal';
import { SimPileViewerModal } from './SimPileViewerModal';
import { SimMulliganModal } from './SimMulliganModal';
import { SimTutorialBanner } from './SimTutorialBanner';
import { SimSettingsModal } from './SimSettingsModal';
import { OPTCG_TUTORIAL_STEPS } from '@/lib/sim/tutorial-data';
import { ST01_STRAW_HAT_DECK, ST04_ANIMAL_KINGDOM_DECK } from '@/lib/sim/starter-decks';
import {
  RotateCcw,
  Sparkles,
  Swords,
  ScrollText,
  Clock,
  Menu,
  Play,
  Trash2,
  Plus,
  Minus,
  Maximize2,
  Users,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { handleCardImageError } from '@/lib/card-image';
import {
  OPCG_PURPLE_BACK_DATA_URL,
  OPCG_DON_DECK_DATA_URL,
  OPCG_DON_CARD_DATA_URL,
} from '@/lib/sim/sim-assets';

interface SimPlaymatProps {
  initialDeck?: RecommendedDeck;
  onExit?: () => void;
}

export function SimPlaymat({ initialDeck, onExit }: SimPlaymatProps) {
  const chosenDeck = initialDeck || ST01_STRAW_HAT_DECK;

  // Initialize with official Starter ST-01 vs ST-04 matchup and tutorial active
  const [gameState, setGameState] = useState<SimGameState>(() =>
    initializeGame(chosenDeck, true, ST04_ANIMAL_KINGDOM_DECK, true)
  );

  const [inspectedCard, setInspectedCard] = useState<SimCard | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<SimCard | null>(null);
  const [selectedFieldCard, setSelectedFieldCard] = useState<SimCard | null>(null);

  // Tutorial target highlight (subtle, clean 1.5px ring without neon glow)
  const currentStep = gameState.tutorialMode
    ? OPTCG_TUTORIAL_STEPS[gameState.tutorialStepIndex]
    : null;
  const highlightTarget = currentStep?.targetHighlight || 'none';

  // Restart match
  const handleRestart = (goingFirst: boolean = true) => {
    setGameState(
      initializeGame(
        chosenDeck,
        goingFirst,
        RECOMMENDED_DECKS.find((d) => d.id === gameState.opponent.deckId) || ST04_ANIMAL_KINGDOM_DECK,
        gameState.tutorialMode
      )
    );
  };

  // Turn advance (Triggers Refresh -> Opponent Turn -> Player Turn)
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

  const handleAttackOpponentChar = (attackerInstanceId: string, oppCharId: string) => {
    setGameState((prev) => attackOpponentCharacter(prev, attackerInstanceId, oppCharId));
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
    <div className="min-h-screen bg-[#0a0e17] text-gray-200 flex flex-col font-sans select-none pb-28 px-1 sm:px-3 pt-1">
      {/* =========================================================================
          TOP APP CONTROLS (Clean, subtle minimal buttons)
         ========================================================================= */}
      <div className="max-w-[720px] mx-auto w-full flex items-center justify-between px-1 py-1 text-gray-400">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="flex items-center gap-1 text-[11px] hover:text-white transition px-2 py-1 rounded-md bg-white/5 border border-white/10"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 text-[11px] text-gray-200 hover:text-white transition px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 font-medium"
          >
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <span>Settings & Tutorial</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLogModal(!showLogModal)}
            className="flex items-center gap-1 text-[11px] hover:text-white transition px-2 py-1 rounded-md bg-white/5 border border-white/10"
          >
            <ScrollText className="w-3 h-3 text-gray-400" />
            <span>Log ({gameState.logs.length})</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-[11px] text-gray-400 hover:text-white transition px-2 py-1 rounded-md bg-white/5 border border-white/10"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Main Tabletop Canvas */}
      <div className="max-w-[720px] mx-auto w-full flex-1 flex flex-col gap-2">
        {/* =======================================================================
            1. TOP HUD BAR (Opponent Status Bar)
           ======================================================================= */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1422] rounded-xl border border-white/10 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="font-bold tracking-wider text-[11px] text-gray-200">
              OPPONENT
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>17:30</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300 font-mono text-[11px]">
            <span className="text-[10px]">🎴</span>
            <span>{gameState.opponent.handCount}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowOpponentSelector(true)}
            className="text-[10px] text-gray-400 hover:text-white font-medium cursor-pointer"
          >
            ⇅ {gameState.opponent.leaderName}
          </button>
        </div>

        {/* =======================================================================
            2. TOP MAT: OPPONENT BATTLEFIELD (Dark Navy Slate #0d1424, clean border)
           ======================================================================= */}
        <div
          className={`relative rounded-xl border border-white/10 bg-[#0d1424] p-2.5 sm:p-3 shadow-md transition-all ${
            highlightTarget === 'opponent' ? 'ring-2 ring-red-400/80' : ''
          }`}
        >
          {/* Grid Layout: 12 Columns */}
          <div className="grid grid-cols-12 gap-2 items-stretch">
            {/* Left Column (Cols 1 to 2): Opponent Trash */}
            <div className="col-span-2 flex flex-col justify-start items-center">
              <span className="text-[8px] font-bold uppercase text-gray-400 mb-0.5 tracking-wider">TRASH</span>
              <div
                className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/30 flex items-center justify-center text-gray-400 shadow-sm"
              >
                <span className="text-[9px] font-mono">{gameState.opponent.trashCount}</span>
              </div>
            </div>

            {/* Middle Main Area (Cols 3 to 10): Cost Area, Leader/Deck Row, Characters */}
            <div className="col-span-8 flex flex-col gap-1.5">
              {/* Row 1: Cost Area with real DON cards */}
              <div
                className={`rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 flex items-center justify-between transition-all ${
                  highlightTarget === 'costArea' ? 'ring-2 ring-white/60' : ''
                }`}
              >
                <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                  COST AREA
                </span>

                {/* Opponent real miniature DON cards */}
                <div className="flex items-center justify-center gap-1 my-0.5">
                  {Array.from({ length: Math.min(5, gameState.opponent.activeDon) }).map((_, idx) => (
                    <div
                      key={`opp-don-${idx}`}
                      className="w-7 sm:w-8 aspect-[2.5/3.5] rounded-sm overflow-hidden border border-black/60 shadow-sm"
                    >
                      <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[9px] font-mono text-gray-300">
                  <span className="flex items-center gap-0.5">
                    <span>🪙</span> {gameState.opponent.activeDon}
                  </span>
                  <span className="flex items-center gap-0.5 text-gray-400">
                    <span>🔄</span> {gameState.opponent.restedDon}
                  </span>
                </div>
              </div>

              {/* Row 2: Deck | Stage | Leader */}
              <div className="grid grid-cols-5 gap-1.5 items-center">
                {/* Deck with real card back */}
                <div className="aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/30 overflow-hidden relative shadow-sm">
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white font-mono text-[8px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.opponent.deckCount}
                  </div>
                </div>

                {/* Stage */}
                <div className="aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/20 flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-gray-500">
                  STAGE
                </div>

                {/* Opponent Leader Card */}
                <div
                  onClick={() => handleDirectDamageOpponent(1)}
                  className={`aspect-[2.5/3.5] rounded-md border border-red-500/40 overflow-hidden relative shadow-sm cursor-pointer hover:scale-102 transition group ${
                    highlightTarget === 'opponent' ? 'ring-2 ring-red-400' : ''
                  }`}
                  title="Click to deal 1 damage to Opponent Leader"
                >
                  <img
                    src={gameState.opponent.leaderImage}
                    alt={gameState.opponent.leaderName}
                    className="w-full h-full object-cover"
                    onError={(e) => handleCardImageError(e, gameState.opponent.leaderId, gameState.opponent.leaderImage)}
                  />
                  <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[8px] font-bold">
                    {gameState.opponent.leaderPower} ⏶
                  </div>
                  <div className="absolute inset-0 bg-red-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-[8px] font-bold text-white bg-black/80 px-1 rounded uppercase">HIT (-1)</span>
                  </div>
                </div>

                {/* Spacer slots */}
                <div className="aspect-[2.5/3.5] rounded-md border border-transparent" />
                <div className="aspect-[2.5/3.5] rounded-md border border-transparent" />
              </div>

              {/* Row 3: Character Area (5 slots facing player) */}
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  CHARACTER AREA
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const oppChar = gameState.opponent.characters[slotIdx];
                    if (oppChar) {
                      return (
                        <div
                          key={`opp-char-${oppChar.instanceId}`}
                          onClick={() => {
                            if (selectedFieldCard) {
                              handleAttackOpponentChar(selectedFieldCard.instanceId, oppChar.instanceId);
                            } else {
                              setInspectedCard(oppChar);
                            }
                          }}
                          className={`aspect-[2.5/3.5] rounded-md border border-white/20 overflow-hidden relative shadow-sm cursor-pointer transition ${
                            oppChar.rested ? 'rotate-90 scale-95 opacity-80' : ''
                          }`}
                        >
                          <img
                            src={oppChar.imageUrl}
                            alt={oppChar.name}
                            className="w-full h-full object-cover"
                            onError={(e) => handleCardImageError(e, oppChar.cardId, oppChar.imageUrl)}
                          />
                          <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[7px] font-bold">
                            {oppChar.power} ⏶
                          </div>
                          {oppChar.rested && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/80 px-1 rounded">
                                RESTED
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`opp-char-slot-${slotIdx}`}
                        className="aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/20"
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (Cols 11 to 12): DON!! Deck & Life Stack */}
            <div className="col-span-2 flex flex-col justify-between items-center gap-2">
              {/* Opponent real DON!! Deck back */}
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold uppercase text-gray-400 mb-0.5 tracking-wider">DON!! DECK</span>
                <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 relative shadow-sm bg-black/20">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/85 text-white font-mono text-[7px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.opponent.donDeckCount}
                  </div>
                </div>
              </div>

              {/* Opponent real Life Stack with real card backs */}
              <div
                onClick={() => handleDirectDamageOpponent(1)}
                className="flex flex-col items-center cursor-pointer group"
                title="Click to deal damage to Opponent Life"
              >
                <div className="rounded bg-rose-700/80 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 text-center tracking-wider w-full">
                  LIFE · {gameState.opponent.life}
                </div>
                <div className="relative flex flex-col -space-y-11 sm:-space-y-13 pt-0.5">
                  {Array.from({ length: Math.min(5, gameState.opponent.life) }).map((_, idx) => (
                    <div
                      key={`opp-life-${idx}`}
                      className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shadow-sm"
                    >
                      <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {gameState.opponent.life === 0 && (
                    <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md border border-dashed border-red-500/40 flex items-center justify-center text-[8px] text-red-400 font-bold text-center">
                      0 LIFE
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            3. INTERACTIVE TUTORIAL BANNER (Clean, non-neon pill banner)
           ======================================================================= */}
        {gameState.tutorialMode && (
          <SimTutorialBanner
            currentStepIndex={gameState.tutorialStepIndex}
            onSetStep={(idx) => setGameState((prev) => setTutorialStep(prev, idx))}
            onCloseTutorial={() => setGameState((prev) => toggleTutorialMode(prev, false))}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {/* =======================================================================
            4. BOTTOM MAT: PLAYER BATTLEFIELD (Dark Forest Slate #0b1712, clean muted line)
           ======================================================================= */}
        <div
          className="relative rounded-xl border border-[#a17a26]/30 bg-[#0b1712] p-2.5 sm:p-3 shadow-md"
        >
          {/* Grid Layout: 12 Columns */}
          <div className="grid grid-cols-12 gap-2 items-stretch">
            {/* Left Column (Cols 1 to 2): Player Life Stack & DON!! Deck */}
            <div className="col-span-2 flex flex-col justify-between items-center gap-2">
              {/* Player Life Stack with real card backs */}
              <div
                onClick={handleTakeLifeDamage}
                className={`flex flex-col items-center cursor-pointer group transition-all ${
                  highlightTarget === 'life' ? 'ring-2 ring-white/60' : ''
                }`}
                title="Click to take 1 Life damage to hand"
              >
                <div className="rounded bg-rose-700/80 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 text-center tracking-wider w-full">
                  LIFE · {gameState.life.length}
                </div>
                <div className="relative flex flex-col -space-y-11 sm:-space-y-13 pt-0.5">
                  {gameState.life.map((card, idx) => (
                    <div
                      key={`player-life-${card.instanceId}-${idx}`}
                      className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shadow-sm"
                    >
                      <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {gameState.life.length === 0 && (
                    <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md border border-dashed border-red-500/40 flex items-center justify-center text-[8px] text-red-400 font-bold text-center">
                      0 LIFE
                    </div>
                  )}
                </div>
              </div>

              {/* Player real DON!! Deck back */}
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold uppercase text-gray-400 mb-0.5 tracking-wider">DON!! DECK</span>
                <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 relative shadow-sm bg-black/20">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/85 text-white font-mono text-[7px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.donDeckCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Main Area (Cols 3 to 10): Characters, Leader, Cost Area */}
            <div className="col-span-8 flex flex-col gap-1.5">
              {/* Row 1: Character Area (5 slots facing opponent) */}
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400/80 block mb-0.5">
                  CHARACTER AREA
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const card = gameState.characters[slotIdx];
                    if (card) {
                      return (
                        <div
                          key={card.instanceId}
                          onClick={() => setSelectedFieldCard(card)}
                          className={`aspect-[2.5/3.5] rounded-md overflow-hidden relative shadow-sm cursor-pointer transition ${
                            card.rested
                              ? 'rotate-90 scale-95 opacity-80 border border-amber-500/40'
                              : 'border border-white/25 hover:border-white/50'
                          }`}
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                          />
                          {/* Attached DON!! Mini Badge */}
                          {card.attachedDon > 0 && (
                            <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-amber-500 text-black text-[7px] font-bold rounded-sm text-center shadow">
                              DON ×{card.attachedDon}
                            </div>
                          )}
                          {/* Power Badge */}
                          <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[7px] font-bold">
                            {(card.power || 0) + card.attachedDon * 1000} ⏶
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`player-char-slot-${slotIdx}`}
                        className={`aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/25 transition-all ${
                          highlightTarget === 'characters' ? 'ring-2 ring-white/60' : ''
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Leader / Stage / Main Deck */}
              <div className="grid grid-cols-5 gap-1.5 items-center">
                {/* Spacer */}
                <div className="aspect-[2.5/3.5] rounded-md border border-transparent" />
                <div className="aspect-[2.5/3.5] rounded-md border border-transparent" />

                {/* Player Leader Card with Action Pill underneath */}
                <div className="flex flex-col items-center">
                  {gameState.leader && (
                    <div
                      onClick={() => setSelectedFieldCard(gameState.leader)}
                      className={`w-full aspect-[2.5/3.5] rounded-md border border-amber-400/60 overflow-hidden relative shadow-md cursor-pointer hover:border-amber-400 transition ${
                        gameState.leader.rested ? 'rotate-90 scale-95 opacity-80' : ''
                      } ${highlightTarget === 'leader' ? 'ring-2 ring-white/60' : ''}`}
                    >
                      <img
                        src={gameState.leader.imageUrl}
                        alt={gameState.leader.name}
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, gameState.leader?.cardId, gameState.leader?.imageUrl)}
                      />
                      <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[8px] font-bold">
                        {(gameState.leader.power || 5000) + gameState.leader.attachedDon * 1000} ⏶
                      </div>
                      {gameState.leader.attachedDon > 0 && (
                        <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-amber-500 text-black text-[7px] font-bold rounded-sm text-center shadow">
                          DON ×{gameState.leader.attachedDon}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clean Leader Action Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      if (gameState.leader) setSelectedFieldCard(gameState.leader);
                    }}
                    className="mt-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-gray-200 border border-white/15 text-[9px] font-semibold tracking-wider flex items-center gap-1 shadow-sm transition active:scale-95"
                  >
                    <span>✦ Activate</span>
                  </button>
                </div>

                {/* Stage Slot */}
                <div
                  onClick={() => {
                    if (gameState.stage) setSelectedFieldCard(gameState.stage);
                  }}
                  className="aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/25 flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-gray-500 overflow-hidden relative"
                >
                  {gameState.stage ? (
                    <img src={gameState.stage.imageUrl} alt={gameState.stage.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>STAGE</span>
                  )}
                </div>

                {/* Main Deck with real card back */}
                <div
                  onClick={handleManualDraw}
                  className="aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/30 overflow-hidden relative shadow-sm cursor-pointer hover:brightness-110 transition group"
                  title="Click to draw 1 card"
                >
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Main Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white font-mono text-[8px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.deck.length}
                  </div>
                </div>
              </div>

              {/* Row 3: Player Cost Area with real DON cards */}
              <div
                className={`rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 flex items-center justify-between transition-all ${
                  highlightTarget === 'costArea' ? 'ring-2 ring-white/60' : ''
                }`}
              >
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400/80">
                  COST AREA
                </span>

                {/* Miniature real DON!! Cards */}
                <div className="flex items-center justify-center gap-1 my-0.5">
                  {Array.from({ length: Math.min(5, gameState.activeDon) }).map((_, idx) => (
                    <div
                      key={`player-don-${idx}`}
                      className="w-7 sm:w-8 aspect-[2.5/3.5] rounded-sm overflow-hidden border border-black/60 shadow-sm"
                    >
                      <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    </div>
                  ))}
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
            </div>

            {/* Right Column (Cols 11 to 12): Trash Area */}
            <div className="col-span-2 flex flex-col justify-end items-center">
              <span className="text-[8px] font-bold uppercase text-gray-400 mb-0.5 tracking-wider">TRASH</span>
              <div
                onClick={() => setShowTrashModal(true)}
                className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-md border border-white/10 bg-black/30 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-white/25 transition relative shadow-sm"
              >
                {gameState.trash.length > 0 ? (
                  <>
                    <img
                      src={gameState.trash[gameState.trash.length - 1].imageUrl}
                      alt="Trash"
                      className="w-full h-full object-cover rounded-md opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white bg-black/80 px-1 rounded font-mono">
                        {gameState.trash.length}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[9px] font-mono">0</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            5. PLAYER HUD BAR (Turn Status)
           ======================================================================= */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1422] rounded-xl border border-white/10 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-bold tracking-wider text-[11px] text-gray-200">
              GUEST TURN
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>17:30</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300 font-mono text-[11px]">
            <span className="text-[10px]">🎴</span>
            <span>{gameState.hand.length}</span>
          </div>

          <div className="text-[10px] text-gray-400 font-medium">
            ⇅ {chosenDeck.name}
          </div>
        </div>

        {/* =======================================================================
            6. PLAYER HAND (Row of Cards - Clean, subtle borders, NO neon glow)
           ======================================================================= */}
        <div
          className={`flex items-center justify-center gap-2 overflow-x-auto py-1 px-1 rounded-xl transition-all ${
            highlightTarget === 'hand' ? 'ring-2 ring-white/60 bg-white/[0.02]' : ''
          }`}
        >
          {gameState.hand.map((card) => {
            const canAfford = gameState.activeDon >= (card.cost || 0);

            return (
              <div
                key={card.instanceId}
                onClick={() => setSelectedHandCard(card)}
                className={`relative w-16 sm:w-20 aspect-[2.5/3.5] rounded-md overflow-hidden cursor-pointer select-none transition-transform duration-150 hover:-translate-y-1.5 shrink-0 border border-white/15 shadow-md ${
                  canAfford ? 'opacity-100' : 'opacity-75'
                }`}
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                />

                {/* Cost Top-Left Pill */}
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black/85 text-white font-mono text-[8px] font-bold flex items-center justify-center border border-white/20 shadow">
                  {card.cost ?? 0}
                </div>

                {/* Power Top-Right Pill */}
                {card.power > 0 && (
                  <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/80 text-white font-mono text-[7px] font-bold">
                    {card.power} ⏶
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =======================================================================
            7. BOTTOM CONTROL BAR (Clean pills matching OPlayTCG)
           ======================================================================= */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Turn Indicator Pill */}
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm select-none"
          >
            <Menu className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>TURN {gameState.turn}</span>
          </button>

          {/* End Turn Button */}
          <button
            type="button"
            onClick={handleNextTurn}
            className={`px-5 py-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer select-none ${
              highlightTarget === 'endTurn' ? 'ring-2 ring-white/60' : ''
            }`}
          >
            <span>End turn</span>
            <span className="text-xs">▷</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          8. CONTEXTUAL CARD ACTION DRAWER (Hand Card Tap)
         ========================================================================= */}
      {selectedHandCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#111726] border border-white/15 rounded-xl max-w-sm w-full p-4 space-y-3 shadow-xl relative text-gray-200">
            <button
              type="button"
              onClick={() => setSelectedHandCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-md overflow-hidden bg-black/40 border border-white/10 shrink-0">
                <img
                  src={selectedHandCard.imageUrl}
                  alt={selectedHandCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{selectedHandCard.name}</h4>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Cost: {selectedHandCard.cost} &bull; Power: {selectedHandCard.power || 0}
                </div>
                {selectedHandCard.counter && (
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono text-[9px] font-bold border border-white/10">
                    +{selectedHandCard.counter} Counter
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={gameState.activeDon < (selectedHandCard.cost || 0)}
                onClick={() => handlePlayCard(selectedHandCard.instanceId)}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm ${
                  gameState.activeDon >= (selectedHandCard.cost || 0)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Play Card ({selectedHandCard.cost} DON)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDiscardCard(selectedHandCard.instanceId)}
                className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. CONTEXTUAL CARD ACTION DRAWER (Field Card Tap)
         ========================================================================= */}
      {selectedFieldCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#111726] border border-white/15 rounded-xl max-w-sm w-full p-4 space-y-3 shadow-xl relative text-gray-200">
            <button
              type="button"
              onClick={() => setSelectedFieldCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-md overflow-hidden bg-black/40 border border-white/10 shrink-0">
                <img
                  src={selectedFieldCard.imageUrl}
                  alt={selectedFieldCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{selectedFieldCard.name}</h4>
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
                className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
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
                className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-300" />
                <span>{selectedFieldCard.rested ? 'Activate' : 'Rest'}</span>
              </button>

              {/* Attach DON!! */}
              <button
                type="button"
                disabled={gameState.activeDon === 0}
                onClick={() => handleAttachDon(selectedFieldCard.instanceId)}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 ${
                  gameState.activeDon > 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
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
                className={`py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 ${
                  selectedFieldCard.attachedDon > 0
                    ? 'bg-white/10 hover:bg-white/15 text-white'
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
          10. MODALS & POPUPS
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

      {/* Settings & Tutorial Modal */}
      <SimSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        tutorialMode={gameState.tutorialMode}
        onToggleTutorial={(enabled) => setGameState((prev) => toggleTutorialMode(prev, enabled))}
        currentStepIndex={gameState.tutorialStepIndex}
        onSelectStep={(idx) => setGameState((prev) => setTutorialStep(prev, idx))}
        onResetTutorial={() => {
          setGameState(initializeGame(ST01_STRAW_HAT_DECK, true, ST04_ANIMAL_KINGDOM_DECK, true));
        }}
        onSelectOpponentDeck={handleSelectOpponentDeck}
        currentOpponentDeckId={gameState.opponent.deckId}
      />

      {/* Opponent Selector Modal */}
      {showOpponentSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111726] border border-white/15 rounded-xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-300" />
                <h3 className="text-base font-bold text-white">Choose Practice Opponent</h3>
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
              {[ST04_ANIMAL_KINGDOM_DECK, ...RECOMMENDED_DECKS.slice(0, 15)].map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectOpponentDeck(d)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    gameState.opponent.deckId === d.id
                      ? 'bg-amber-600/20 border-amber-500/50 text-white'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shrink-0">
                      <img
                        src={d.leaderImage}
                        alt={d.leaderName}
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, d.leaderId, d.leaderImage)}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{d.name}</h4>
                      <p className="text-xs text-gray-400">{d.leaderName} &bull; {d.color}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Battle Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111726] border border-white/15 rounded-xl max-w-lg w-full p-4 sm:p-5 space-y-3 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-gray-300" />
                <h3 className="text-base font-bold text-white">Battle Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
              {gameState.logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-md border leading-relaxed ${
                    log.type === 'combat'
                      ? 'bg-rose-950/20 border-rose-500/20 text-rose-200'
                      : log.type === 'phase'
                      ? 'bg-blue-950/20 border-blue-500/20 text-blue-200'
                      : 'bg-white/[0.02] border-white/5 text-gray-300'
                  }`}
                >
                  <span className="text-[10px] text-gray-500 mr-2">{log.time}</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          11. VICTORY / DEFEAT MODALS
         ========================================================================= */}
      {gameState.winner === 'player' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111726] border border-amber-400/50 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-3">
            <div className="text-3xl">🏆</div>
            <h2 className="text-xl font-bold text-white">VICTORY!</h2>
            <p className="text-xs text-gray-300">
              You reduced Kaido's Life to 0 and landed the final strike!
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
              >
                Play Again
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {gameState.winner === 'opponent' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171114] border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-3">
            <div className="text-3xl">💀</div>
            <h2 className="text-xl font-bold text-white">DEFEAT</h2>
            <p className="text-xs text-gray-300">
              Your Life reached 0 and you took fatal damage.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="flex-1 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition"
              >
                Rematch
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
