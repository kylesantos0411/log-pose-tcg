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
  Bug,
  HelpCircle,
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

  // Toggle for original card hand view vs minimized count pill
  const [playerHandExpanded, setPlayerHandExpanded] = useState(true);
  const [oppHandExpanded, setOppHandExpanded] = useState(false);

  // Derive live field card from current gameState so attached DON, power, and rested state stay reactive
  const liveFieldCard: SimCard | null = selectedFieldCard
    ? (gameState.leader?.instanceId === selectedFieldCard.instanceId
        ? gameState.leader
        : gameState.characters.find((c) => c.instanceId === selectedFieldCard.instanceId) ||
          (gameState.stage?.instanceId === selectedFieldCard.instanceId ? gameState.stage : selectedFieldCard))
    : null;

  // Combat legality according to official Bandai rules
  const isTurn1First = gameState.turn === 1 && gameState.goingFirst;
  const isSummonSick = Boolean(
    liveFieldCard?.category === 'Character' && !liveFieldCard.canAttackThisTurn && !liveFieldCard.hasRush
  );
  const isCardRested = Boolean(liveFieldCard?.rested);
  const canDeclareAttack = Boolean(
    liveFieldCard &&
    !isCardRested &&
    !isSummonSick &&
    !isTurn1First &&
    (liveFieldCard.category === 'Leader' || liveFieldCard.category === 'Character')
  );

  let attackDisabledReason = '';
  if (isCardRested) attackDisabledReason = 'Rested (Already Attacked)';
  else if (isSummonSick) attackDisabledReason = 'Cannot attack on turn played';
  else if (isTurn1First) attackDisabledReason = 'Cannot attack on Turn 1';

  // Tutorial target highlight (OPlayTCG golden glowing spotlight box)
  const currentStep = gameState.tutorialMode
    ? OPTCG_TUTORIAL_STEPS[gameState.tutorialStepIndex]
    : null;
  const highlightTarget = currentStep?.targetHighlight || 'none';

  const spotlightClass = 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] animate-pulse';

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
    <div className="min-h-screen bg-[#ede8df] text-slate-800 flex flex-col font-sans select-none pb-14 px-1 sm:px-4 pt-1 transition-colors">
      {/* =======================================================================
          TOP BAR: Fullscreen, Settings/Tutorial, Log, Exit
         ======================================================================= */}
      <div className="max-w-[760px] mx-auto w-full flex items-center justify-between px-1 py-1.5 text-slate-600">
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
            className="flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 transition px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white border border-[#d6cfbe] shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white border border-[#d6cfbe] shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#c27803]" />
            <span>Tutorial & Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLogModal(!showLogModal)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 transition px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white border border-[#d6cfbe] shadow-xs"
          >
            <ScrollText className="w-3.5 h-3.5 text-slate-600" />
            <span>Log ({gameState.logs.length})</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-[11px] font-medium text-slate-700 hover:text-slate-900 transition px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white border border-[#d6cfbe] shadow-xs"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* =======================================================================
          MAIN TABLETOP CANVAS: Sage Opponent Mat + Peach/Red Player Mat
         ======================================================================= */}
      <div className="max-w-[760px] mx-auto w-full flex-1 flex flex-col gap-2">
        {/* Opponent Hand Corner Pill (Top Right) */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowOpponentSelector(true)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-md border border-[#d6cfbe]"
          >
            <span>Opponent:</span>
            <span className="text-[#a66402]">{gameState.opponent.leaderName}</span>
            <span className="text-[10px] text-slate-400">⇅</span>
          </button>

          {/* Opponent Hand Pill */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white border border-[#d6cfbe] px-2 py-0.5 rounded-full shadow-xs text-xs font-bold text-slate-700">
              <span>{gameState.opponent.handCount}</span>
            </div>
            <button
              type="button"
              onClick={() => setOppHandExpanded(!oppHandExpanded)}
              className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-[#d6cfbe] px-2 py-0.5 rounded-full transition shadow-xs flex items-center gap-0.5"
            >
              <span>⇅ Original</span>
            </button>
          </div>
        </div>

        {/* Optional Expanded Opponent Hand Cards */}
        {oppHandExpanded && (
          <div className="flex items-center justify-end gap-1 px-1 py-1 overflow-x-auto no-scrollbar animate-fadeIn">
            {Array.from({ length: gameState.opponent.handCount }).map((_, i) => (
              <div
                key={`opp-hand-${i}`}
                className="w-10 sm:w-12 aspect-[2.5/3.5] rounded-md overflow-hidden border border-[#b8cca8] shadow-xs"
              >
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Hand" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* =======================================================================
            TOP MAT: OPPONENT BATTLEFIELD (Soft Sage Green #dbe6d6)
           ======================================================================= */}
        <div
          className={`relative rounded-2xl border border-[#b8cca8] bg-[#dbe6d6] p-2 sm:p-3 shadow-xs transition-all ${
            highlightTarget === 'opponent' ? spotlightClass : ''
          }`}
        >
          {/* Mat Grid Layout: 12 Columns */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 items-stretch">
            {/* Left Column (Cols 1-2): Opponent Trash */}
            <div className="col-span-2 flex flex-col justify-start items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">TRASH</span>
              <div
                className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg border border-[#b8cca8] bg-[#cde0c7]/60 flex items-center justify-center text-slate-600 shadow-inner"
              >
                <span className="text-[10px] font-mono font-bold">{gameState.opponent.trashCount}</span>
              </div>
            </div>

            {/* Middle Main Area (Cols 3-10): Cost Area, Leader/Deck Row, Characters */}
            <div className="col-span-8 flex flex-col gap-1.5">
              {/* Row 1: Cost Area with real DON cards */}
              <div
                className={`rounded-xl border border-[#b8cca8] bg-[#cde0c7]/50 px-2 py-1 flex items-center justify-between transition-all shadow-inner`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  COST AREA
                </span>

                {/* Opponent real miniature DON cards */}
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: Math.min(5, gameState.opponent.activeDon) }).map((_, idx) => (
                    <div
                      key={`opp-don-${idx}`}
                      className="w-6 sm:w-8 aspect-[2.5/3.5] rounded-sm overflow-hidden border border-black/40 shadow-xs"
                    >
                      <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-mono text-slate-700 font-bold">
                  <span>🪙 {gameState.opponent.activeDon}</span>
                  <span className="text-slate-500">🔄 {gameState.opponent.restedDon}</span>
                </div>
              </div>

              {/* Row 2: Deck | Stage | Leader */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 items-center">
                {/* Opponent Main Deck */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-[#b8cca8] bg-[#cde0c7]/70 overflow-hidden relative shadow-xs">
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/85 text-white font-mono text-[8px] font-bold flex items-center justify-center border border-white/30">
                    {gameState.opponent.deckCount}
                  </div>
                </div>

                {/* Stage Slot */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#b8cca8] bg-[#cde0c7]/30 flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  STAGE
                </div>

                {/* Opponent Leader Card */}
                <div
                  onClick={() => {
                    if (selectedFieldCard) {
                      handleAttackOpponent(selectedFieldCard.instanceId);
                    } else if (gameState.leader && !gameState.leader.rested) {
                      setSelectedFieldCard(gameState.leader);
                    }
                  }}
                  className={`aspect-[2.5/3.5] rounded-lg border-2 border-red-500/60 overflow-hidden relative shadow-sm cursor-pointer hover:scale-102 transition group ${
                    highlightTarget === 'opponent' ? spotlightClass : ''
                  }`}
                  title={`${gameState.opponent.leaderName} (${gameState.opponent.leaderPower} Power) · Click with active card to declare attack`}
                >
                  <img
                    src={gameState.opponent.leaderImage}
                    alt={gameState.opponent.leaderName}
                    className="w-full h-full object-cover"
                    onError={(e) => handleCardImageError(e, gameState.opponent.leaderId, gameState.opponent.leaderImage)}
                  />
                  {selectedFieldCard && (
                    <div className="absolute inset-0 bg-red-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span className="text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded uppercase shadow">ATTACK</span>
                    </div>
                  )}
                </div>

                {/* Spacer slots */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-transparent" />
                <div className="aspect-[2.5/3.5] rounded-lg border border-transparent" />
              </div>

              {/* Row 3: Character Area (5 slots facing player) */}
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  CHARACTER AREA
                </span>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
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
                          className={`aspect-[2.5/3.5] rounded-lg border border-slate-400 overflow-hidden relative shadow-xs cursor-pointer transition ${
                            oppChar.rested ? 'rotate-90 scale-95 opacity-80 border-amber-600' : ''
                          }`}
                        >
                          <img
                            src={oppChar.imageUrl}
                            alt={oppChar.name}
                            className="w-full h-full object-cover"
                            onError={(e) => handleCardImageError(e, oppChar.cardId, oppChar.imageUrl)}
                          />
                          {oppChar.rested && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                              <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/85 px-1 rounded">
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
                        className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#b8cca8] bg-[#cde0c7]/40"
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (Cols 11-12): DON!! Deck & Life Stack */}
            <div className="col-span-2 flex flex-col justify-between items-center gap-2">
              {/* Opponent real DON!! Deck back */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-600 mb-0.5 tracking-wider">DON!! DECK</span>
                <div className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#b8cca8] relative shadow-xs">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/85 text-white font-mono text-[7px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.opponent.donDeckCount}
                  </div>
                </div>
              </div>

              {/* Opponent real Life Stack with real card backs */}
              <div className="flex flex-col items-center select-none">
                <div className="rounded-full bg-rose-600 text-white font-mono text-[8px] font-bold px-2 py-0.2 text-center tracking-wider mb-0.5 shadow-xs">
                  LIFE · {gameState.opponent.life}
                </div>
                <div className="relative flex flex-col -space-y-10 sm:-space-y-14 pt-0.5">
                  {Array.from({ length: Math.min(5, gameState.opponent.life) }).map((_, idx) => (
                    <div
                      key={`opp-life-${idx}`}
                      className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#b8cca8] shadow-xs"
                    >
                      <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {gameState.opponent.life === 0 && (
                    <div className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-red-500/50 flex items-center justify-center text-[8px] text-red-600 font-black text-center">
                      0 LIFE
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            TUTORIAL BANNER / INSPECTOR CALLOUT
           ======================================================================= */}
        {gameState.tutorialMode && (
          <SimTutorialBanner
            currentStepIndex={gameState.tutorialStepIndex}
            onSetStep={(idx) => setGameState((prev) => setTutorialStep(prev, idx))}
            onCloseTutorial={() => setGameState((prev) => toggleTutorialMode(prev, false))}
            onOpenSettings={() => setShowSettingsModal(true)}
            targetHighlight={highlightTarget}
          />
        )}

        {/* =======================================================================
            BOTTOM MAT: PLAYER BATTLEFIELD (Soft Peach/Blush #fae9e6)
           ======================================================================= */}
        <div
          className="relative rounded-2xl border border-[#d8aba2] bg-[#fae9e6] p-2 sm:p-3 shadow-xs"
        >
          {/* Mat Grid Layout: 12 Columns */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 items-stretch">
            {/* Left Column (Cols 1-2): Player Life Stack & DON!! Deck */}
            <div className="col-span-2 flex flex-col justify-between items-center gap-2">
              {/* Player Life Stack */}
              <div
                onClick={handleTakeLifeDamage}
                className={`flex flex-col items-center cursor-pointer group transition-all ${
                  highlightTarget === 'life' ? spotlightClass : ''
                }`}
                title="Click to take 1 Life damage to hand"
              >
                <div className="rounded-full bg-rose-600 text-white font-mono text-[8px] font-bold px-2 py-0.2 text-center tracking-wider mb-0.5 shadow-xs">
                  LIFE · {gameState.life.length}
                </div>
                <div className="relative flex flex-col -space-y-10 sm:-space-y-14 pt-0.5">
                  {gameState.life.map((card, idx) => (
                    <div
                      key={`player-life-${card.instanceId}-${idx}`}
                      className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#d8aba2] shadow-xs group-hover:scale-102 transition"
                    >
                      <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {gameState.life.length === 0 && (
                    <div className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-red-500/50 flex items-center justify-center text-[8px] text-red-600 font-black text-center">
                      0 LIFE
                    </div>
                  )}
                </div>
              </div>

              {/* Player real DON!! Deck */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase text-slate-600 mb-0.5 tracking-wider">DON!! DECK</span>
                <div className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#d8aba2] relative shadow-xs">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/85 text-white font-mono text-[7px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.donDeckCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Main Area (Cols 3-10): Characters, Leader, Cost Area */}
            <div className="col-span-8 flex flex-col gap-1.5">
              {/* Row 1: Character Area (5 slots facing opponent) */}
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  CHARACTER AREA
                </span>
                <div
                  className={`grid grid-cols-5 gap-1.5 sm:gap-2 rounded-lg p-0.5 transition-all ${
                    highlightTarget === 'characters' ? spotlightClass : ''
                  }`}
                >
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const card = gameState.characters[slotIdx];
                    if (card) {
                      return (
                        <div
                          key={card.instanceId}
                          onClick={() => setSelectedFieldCard(card)}
                          className={`aspect-[2.5/3.5] rounded-lg overflow-hidden relative shadow-xs cursor-pointer transition ${
                            card.rested
                              ? 'rotate-90 scale-95 opacity-80 border-2 border-amber-600'
                              : 'border border-slate-400 hover:border-slate-700'
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
                            <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-[#c27803] text-white text-[7px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5">
                              <span>DON ×{card.attachedDon}</span>
                              <span className="bg-black/30 text-white px-1 rounded text-[6.5px] font-mono">
                                {(card.power || 0) + card.attachedDon * 1000}
                              </span>
                            </div>
                          )}
                          {card.rested && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                              <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/85 px-1 rounded">
                                RESTED
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`player-char-slot-${slotIdx}`}
                        className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#d8aba2] bg-[#f2d4ce]/40"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Leader / Stage / Main Deck */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 items-center">
                {/* Spacer */}
                <div className="aspect-[2.5/3.5] rounded-lg border border-transparent" />
                <div className="aspect-[2.5/3.5] rounded-lg border border-transparent" />

                {/* Player Leader Card with Action Pill underneath */}
                <div className="flex flex-col items-center">
                  {gameState.leader && (
                    <div
                      onClick={() => setSelectedFieldCard(gameState.leader)}
                      className={`w-full aspect-[2.5/3.5] rounded-lg border-2 border-[#c27803] overflow-hidden relative shadow-md cursor-pointer hover:border-amber-600 transition ${
                        gameState.leader.rested ? 'rotate-90 scale-95 opacity-80' : ''
                      } ${highlightTarget === 'leader' ? spotlightClass : ''}`}
                    >
                      <img
                        src={gameState.leader.imageUrl}
                        alt={gameState.leader.name}
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, gameState.leader?.cardId, gameState.leader?.imageUrl)}
                      />
                      {gameState.leader.attachedDon > 0 && (
                        <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-[#c27803] text-white text-[7px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5">
                          <span>DON ×{gameState.leader.attachedDon}</span>
                          <span className="bg-black/30 text-white px-1 rounded text-[6.5px] font-mono">
                            {(gameState.leader.power || 5000) + gameState.leader.attachedDon * 1000}
                          </span>
                        </div>
                      )}
                      {gameState.leader.rested && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                          <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/85 px-1 rounded">
                            RESTED
                          </span>
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
                    className="mt-1 px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-[#d8aba2] text-[9px] font-bold tracking-wider flex items-center gap-1 shadow-xs hover:bg-[#fff7f5] transition active:scale-95"
                  >
                    <span>✦ Activate</span>
                  </button>
                </div>

                {/* Stage Slot */}
                <div
                  onClick={() => {
                    if (gameState.stage) setSelectedFieldCard(gameState.stage);
                  }}
                  className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#d8aba2] bg-[#f2d4ce]/30 flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-slate-400 overflow-hidden relative"
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
                  className="aspect-[2.5/3.5] rounded-lg border border-[#d8aba2] bg-[#f2d4ce]/70 overflow-hidden relative shadow-xs cursor-pointer hover:brightness-105 transition group"
                  title="Click to draw 1 card"
                >
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Main Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/85 text-white font-mono text-[8px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.deck.length}
                  </div>
                </div>
              </div>

              {/* Row 3: Player Cost Area with real DON cards */}
              <div
                className={`rounded-xl border border-[#d8aba2] bg-[#f2d4ce]/50 px-2 py-1 flex items-center justify-between transition-all shadow-inner ${
                  highlightTarget === 'costArea' ? spotlightClass : ''
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  COST AREA
                </span>

                {/* Miniature real DON!! Cards */}
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: Math.min(5, gameState.activeDon) }).map((_, idx) => (
                    <div
                      key={`player-don-${idx}`}
                      className="w-6 sm:w-8 aspect-[2.5/3.5] rounded-sm overflow-hidden border border-black/40 shadow-xs"
                    >
                      <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-mono text-slate-700 font-bold">
                  <span className="text-[#a66402]">🪙 {gameState.activeDon}</span>
                  <span className="text-slate-500">🔄 {gameState.restedDon}</span>
                </div>
              </div>
            </div>

            {/* Right Column (Cols 11-12): Trash Area */}
            <div className="col-span-2 flex flex-col justify-end items-center">
              <span className="text-[9px] font-bold uppercase text-slate-600 mb-0.5 tracking-wider">TRASH</span>
              <div
                onClick={() => setShowTrashModal(true)}
                className="w-10 sm:w-14 aspect-[2.5/3.5] rounded-lg border border-[#d8aba2] bg-[#f2d4ce]/60 flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:border-slate-500 transition relative shadow-inner"
              >
                {gameState.trash.length > 0 ? (
                  <>
                    <img
                      src={gameState.trash[gameState.trash.length - 1].imageUrl}
                      alt="Trash"
                      className="w-full h-full object-cover rounded-lg opacity-70"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white bg-slate-900/80 px-1 rounded font-mono">
                        {gameState.trash.length}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] font-mono font-bold">0</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            BOTTOM CONTROLS & PLAYER HAND
           ======================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-2 pt-1 px-1">
          {/* Left: Player Hand with Count Pill & Original Toggle */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-white border border-[#d6cfbe] px-2 py-0.5 rounded-full shadow-xs text-xs font-bold text-slate-700">
                <span>{gameState.hand.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setPlayerHandExpanded(!playerHandExpanded)}
                className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-[#d6cfbe] px-2 py-0.5 rounded-full transition shadow-xs flex items-center gap-0.5"
              >
                <span>⇅ Original</span>
              </button>
            </div>

            {/* Hand Cards */}
            {playerHandExpanded && (
              <div
                className={`flex items-center gap-1.5 overflow-x-auto py-1 px-1 rounded-xl transition-all no-scrollbar ${
                  highlightTarget === 'hand' ? spotlightClass : ''
                }`}
              >
                {gameState.hand.map((card) => {
                  const canAfford = gameState.activeDon >= (card.cost || 0);

                  return (
                    <div
                      key={card.instanceId}
                      onClick={() => setSelectedHandCard(card)}
                      className={`relative w-14 sm:w-18 aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer select-none transition-transform duration-150 hover:-translate-y-2 shrink-0 border border-slate-300 shadow-md ${
                        canAfford ? 'opacity-100 hover:border-amber-500' : 'opacity-70'
                      }`}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Turn Indicator, End Turn Button & Report Bug */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              {/* Turn Menu Pill */}
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-white text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-[#d6cfbe] shadow-xs select-none"
              >
                <Menu className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>TURN {gameState.turn}</span>
              </button>

              {/* End Turn Button matching OPlayTCG Amber Action */}
              <button
                type="button"
                onClick={handleNextTurn}
                className={`px-4 py-2 rounded-xl bg-[#c27803] hover:bg-[#a66402] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer select-none ${
                  highlightTarget === 'endTurn' ? spotlightClass : ''
                }`}
              >
                <span>End turn</span>
                <span className="text-xs">▷</span>
              </button>
            </div>

            {/* Report a Bug link */}
            <button
              type="button"
              onClick={() => alert('Thanks! You can submit bug reports via GitHub or feedback.')}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-0.5"
            >
              Report a bug
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTEXTUAL CARD ACTION DRAWER (Hand Card Tap)
         ========================================================================= */}
      {selectedHandCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white border border-[#d6cfbe] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative text-slate-800">
            <button
              type="button"
              onClick={() => setSelectedHandCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0 shadow-xs">
                <img
                  src={selectedHandCard.imageUrl}
                  alt={selectedHandCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">{selectedHandCard.name}</h4>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Cost: {selectedHandCard.cost} &bull; Power: {selectedHandCard.power || 0}
                </div>
                {selectedHandCard.counter && (
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-amber-100 text-[#a66402] font-mono text-[9px] font-bold border border-amber-200">
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
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs ${
                  gameState.activeDon >= (selectedHandCard.cost || 0)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Play Card ({selectedHandCard.cost} DON)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDiscardCard(selectedHandCard.instanceId)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTEXTUAL CARD ACTION DRAWER (Field Card Tap)
         ========================================================================= */}
      {selectedFieldCard && liveFieldCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white border border-[#d6cfbe] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative text-slate-800">
            <button
              type="button"
              onClick={() => setSelectedFieldCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0 shadow-xs">
                <img
                  src={liveFieldCard.imageUrl}
                  alt={liveFieldCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{liveFieldCard.name}</h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      liveFieldCard.rested
                        ? 'bg-amber-100 text-[#a66402] border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {liveFieldCard.rested ? 'Rested' : 'Active'}
                  </span>
                </div>
                <div className="text-[12px] text-[#c27803] font-mono mt-1 font-bold">
                  Combat Power: {(liveFieldCard.power || 0) + liveFieldCard.attachedDon * 1000}
                  {liveFieldCard.attachedDon > 0 && (
                    <span className="text-emerald-700 font-semibold text-[10px] ml-1">
                      (+{liveFieldCard.attachedDon * 1000} from {liveFieldCard.attachedDon} DON!!)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Base Power: {liveFieldCard.power || 0} &bull; Attached DON: {liveFieldCard.attachedDon}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Attack Opponent Leader Button */}
              <button
                type="button"
                disabled={!canDeclareAttack}
                onClick={() => {
                  handleAttackOpponent(liveFieldCard.instanceId);
                }}
                className={`col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition ${
                  canDeclareAttack
                    ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>
                  {canDeclareAttack
                    ? `Attack Leader with ${liveFieldCard.name} (${(liveFieldCard.power || 0) + liveFieldCard.attachedDon * 1000} Power)`
                    : `Cannot Attack: ${attackDisabledReason}`}
                </span>
              </button>

              {/* Attack Rested Opponent Characters */}
              {gameState.opponent.characters.some((c) => c.rested) && (
                <div className="col-span-2 flex flex-col gap-1 pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Attack Rested Character:
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {gameState.opponent.characters
                      .filter((c) => c.rested)
                      .map((oppChar) => (
                        <button
                          key={`attack-target-${oppChar.instanceId}`}
                          type="button"
                          disabled={!canDeclareAttack}
                          onClick={() => handleAttackOpponentChar(liveFieldCard.instanceId, oppChar.instanceId)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                            canDeclareAttack
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 cursor-pointer active:scale-95'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <Swords className="w-3 h-3 text-rose-600" />
                          <span>Attack {oppChar.name} ({oppChar.power} Power)</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Attach DON!! */}
              <button
                type="button"
                disabled={gameState.activeDon === 0}
                onClick={() => handleAttachDon(liveFieldCard.instanceId)}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  gameState.activeDon > 0
                    ? 'bg-[#c27803] hover:bg-[#a66402] text-white active:scale-95 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach DON (+1000)</span>
              </button>

              {/* Detach DON!! */}
              <button
                type="button"
                disabled={liveFieldCard.attachedDon === 0}
                onClick={() => handleDetachDon(liveFieldCard.instanceId)}
                className={`py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  liveFieldCard.attachedDon > 0
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 active:scale-95 cursor-pointer'
                    : 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Detach DON ({liveFieldCard.attachedDon})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS & POPUPS
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#d6cfbe] rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#c27803]" />
                <h3 className="text-base font-bold text-slate-900">Choose Practice Opponent</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOpponentSelector(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {[ST04_ANIMAL_KINGDOM_DECK, ...RECOMMENDED_DECKS.slice(0, 15)].map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectOpponentDeck(d)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    gameState.opponent.deckId === d.id
                      ? 'bg-amber-50 border-amber-400 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-slate-300 shrink-0">
                      <img
                        src={d.leaderImage}
                        alt={d.leaderName}
                        className="w-full h-full object-cover"
                        onError={(e) => handleCardImageError(e, d.leaderId, d.leaderImage)}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{d.name}</h4>
                      <p className="text-xs text-slate-500">{d.leaderName} &bull; {d.color}</p>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#d6cfbe] rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-3 shadow-2xl max-h-[85vh] flex flex-col text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-[#c27803]" />
                <h3 className="text-base font-bold text-slate-900">Battle Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
              {gameState.logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border leading-relaxed ${
                    log.type === 'combat'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : log.type === 'phase'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 mr-2">{log.time}</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Victory / Defeat Modals */}
      {gameState.winner === 'player' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-amber-400 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-3">
            <div className="text-4xl">🏆</div>
            <h2 className="text-xl font-black text-slate-900">VICTORY!</h2>
            <p className="text-xs text-slate-600">
              You reduced Kaido's Life to 0 and landed the final strike!
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="flex-1 py-2 rounded-xl bg-[#c27803] hover:bg-[#a66402] text-white font-bold text-xs transition"
              >
                Play Again
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {gameState.winner === 'opponent' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-rose-400 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-3">
            <div className="text-4xl">💀</div>
            <h2 className="text-xl font-black text-slate-900">DEFEAT</h2>
            <p className="text-xs text-slate-600">
              Your Life reached 0 and you took fatal damage.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
              >
                Rematch
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
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
