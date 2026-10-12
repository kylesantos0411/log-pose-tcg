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

  // Initialize with official Starter matchup and tutorial mode
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
  const [oppHandExpanded, setOppHandExpanded] = useState(true);

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

  // Tutorial target highlight (golden glowing spotlight box matching screenshot)
  const currentStep = gameState.tutorialMode
    ? OPTCG_TUTORIAL_STEPS[gameState.tutorialStepIndex]
    : null;
  const highlightTarget = currentStep?.targetHighlight || 'none';

  const spotlightClass = 'ring-3 sm:ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.65)]';

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
    <div className="h-screen w-screen overflow-hidden bg-[#e7dfd5] text-slate-800 flex flex-col justify-between p-1.5 sm:p-2.5 font-sans select-none relative">
      {/* =======================================================================
          TOP BAR & SIDE HUD CONTROLS
         ======================================================================= */}
      {/* Top-Left: Fullscreen & Settings & Logs */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="w-8 h-8 rounded-lg bg-[#33373b] hover:bg-[#43484d] text-white flex items-center justify-center shadow-md transition"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-gray-200" />
        </button>

        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="w-8 h-8 rounded-lg bg-[#33373b] hover:bg-[#43484d] text-white flex items-center justify-center shadow-md transition"
          title="Tutorial & Settings"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowLogModal(!showLogModal)}
          className="w-8 h-8 rounded-lg bg-[#33373b] hover:bg-[#43484d] text-white flex items-center justify-center shadow-md transition"
          title={`Battle Log (${gameState.logs.length})`}
        >
          <ScrollText className="w-4 h-4 text-gray-200" />
        </button>

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="px-2 py-1.5 rounded-lg bg-[#33373b] hover:bg-[#43484d] text-white text-[11px] font-semibold shadow-md transition"
          >
            Exit
          </button>
        )}
      </div>

      {/* Left Column Status Badges (Opponent & Guest Turn) */}
      <div className="absolute top-12 left-2 z-20 flex flex-col gap-1.5">
        {/* Opponent Status Pill */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => setShowOpponentSelector(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a3038] text-white text-[10px] font-bold shadow-xs hover:bg-[#38404a] transition"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>OPPONENT</span>
          </button>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2a3038] text-gray-300 font-mono text-[9.5px]">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>17:30</span>
          </div>
        </div>

        {/* Player Status Pill */}
        <div className="flex flex-col gap-0.5 mt-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a3038] text-white text-[10px] font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>GUEST</span>
            <span className="px-1 py-0.2 rounded bg-amber-600 text-[8px] font-bold text-white uppercase">TURN</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2a3038] text-gray-300 font-mono text-[9.5px]">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>17:30</span>
          </div>
        </div>
      </div>

      {/* Top-Right: Opponent Hand (Stacked vertically upright, pill below) */}
      <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1">
        {oppHandExpanded && (
          <div className="flex items-center -space-x-4 sm:-space-x-5 animate-fadeIn">
            {Array.from({ length: gameState.opponent.handCount }).map((_, idx) => (
              <div
                key={`opp-hand-card-${idx}`}
                className="w-12 sm:w-14 aspect-[2.5/3.5] rounded-md overflow-hidden border border-slate-400 shadow-md transform transition hover:-translate-y-2 hover:z-10"
              >
                <img
                  src={OPCG_PURPLE_BACK_DATA_URL}
                  alt="Opponent Hand"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="px-2 py-0.5 rounded-md bg-[#2a3038] text-white font-mono text-[10px] font-bold shadow-xs">
            {gameState.opponent.handCount}
          </div>
          <button
            type="button"
            onClick={() => setOppHandExpanded(!oppHandExpanded)}
            className="px-2 py-0.5 rounded-md bg-[#e2d9c2] hover:bg-[#d6cfbe] text-slate-800 text-[10px] font-semibold border border-[#d6cfbe] shadow-xs flex items-center gap-0.5"
          >
            <span>⇅ Original</span>
          </button>
        </div>
      </div>

      {/* Right Column Controls: Turn Menu Button, End Turn, Report Bug */}
      <div className="absolute bottom-2 right-2 z-30 flex flex-col items-end gap-1.5">
        {/* Turn Menu Pill */}
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-[#2a3038] text-white font-bold text-xs flex items-center gap-1.5 shadow-md mb-4"
        >
          <Menu className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>TURN {gameState.turn}</span>
        </button>

        {/* End Turn Amber Action Button */}
        <button
          type="button"
          onClick={handleNextTurn}
          className={`px-5 py-2.5 rounded-xl bg-[#ff9400] hover:bg-[#e68500] text-black sm:text-white font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer select-none ${
            highlightTarget === 'endTurn' ? spotlightClass : ''
          }`}
        >
          <span>End turn</span>
          <span className="text-xs">▷</span>
        </button>

        {/* Report a Bug Link */}
        <button
          type="button"
          onClick={() => alert('Bug report submitted. Thank you for testing the simulator!')}
          className="px-3 py-1.5 rounded-xl bg-[#faf7ee] text-slate-700 hover:text-slate-950 font-semibold text-[11px] border border-[#e2d9c2] shadow-xs flex items-center gap-1.5 transition"
        >
          <Bug className="w-3.5 h-3.5 text-amber-600" />
          <span>Report a bug</span>
        </button>
      </div>

      {/* Bottom-Left: Player Hand (Stacked vertically upright, pill above) */}
      <div
        className={`absolute bottom-2 left-2 z-30 flex flex-col items-start gap-1 rounded-xl p-0.5 transition-all ${
          highlightTarget === 'hand' ? spotlightClass : ''
        }`}
      >
        <div className="flex items-center gap-1">
          <div className="px-2 py-0.5 rounded-md bg-[#2a3038] text-white font-mono text-[10px] font-bold shadow-xs">
            {gameState.hand.length}
          </div>
          <button
            type="button"
            onClick={() => setPlayerHandExpanded(!playerHandExpanded)}
            className="px-2 py-0.5 rounded-md bg-[#e2d9c2] hover:bg-[#d6cfbe] text-slate-800 text-[10px] font-semibold border border-[#d6cfbe] shadow-xs flex items-center gap-0.5"
          >
            <span>⇅ Original</span>
          </button>
        </div>

        {playerHandExpanded && (
          <div className="flex items-center -space-x-5 sm:-space-x-6 animate-fadeIn">
            {gameState.hand.map((card) => {
              const canAfford = gameState.activeDon >= (card.cost || 0);

              return (
                <div
                  key={card.instanceId}
                  onClick={() => setSelectedHandCard(card)}
                  className={`w-13 sm:w-16 aspect-[2.5/3.5] rounded-md overflow-hidden border border-slate-300 shadow-lg cursor-pointer transform transition duration-150 hover:-translate-y-3 hover:z-20 ${
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

      {/* =======================================================================
          MAIN CENTER BATTLEFIELD: BLUE-GRAY OPPONENT MAT + SAGE PLAYER MAT
         ======================================================================= */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-[840px] w-full mx-auto my-auto gap-1 relative px-10 sm:px-14">
        {/* =====================================================================
            1. OPPONENT PLAYMAT: Blue-Gray Slate (#b6c5d4, border #95a8bc)
           ===================================================================== */}
        <div
          className={`w-full rounded-2xl border-2 border-[#95a8bc] bg-[#b6c5d4] p-1.5 sm:p-2 shadow-sm relative flex flex-row items-stretch gap-1.5 sm:gap-2 transition-all ${
            highlightTarget === 'opponent' ? spotlightClass : ''
          }`}
        >
          {/* Main Grid Area of Opponent Mat */}
          <div className="flex-1 flex flex-col justify-between gap-1">
            {/* Top Row: TRASH | COST AREA | DON!! DECK */}
            <div className="grid grid-cols-12 gap-1.5 items-stretch">
              {/* Trash Slot (Cols 1-2) */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">TRASH</span>
                <div className="w-10 sm:w-12 aspect-[2.5/3.5] rounded-lg border border-dashed border-[#8c9fb2] bg-[#9fb2c4]/40 flex items-center justify-center text-slate-600">
                  <span className="text-[9px] font-mono font-bold">{gameState.opponent.trashCount}</span>
                </div>
              </div>

              {/* Cost Area (Cols 3-10) with miniature DON cards & counter */}
              <div
                className={`col-span-8 rounded-xl border border-[#8c9fb2] bg-[#9fb2c4]/50 px-2 py-0.5 flex flex-col justify-between shadow-inner`}
              >
                <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider text-slate-600">
                  <span>COST AREA</span>
                  <div className="flex items-center gap-1 text-[8.5px] font-mono text-slate-700 font-bold">
                    <span>🪙 {gameState.opponent.activeDon}</span>
                    <span className="text-slate-500">🔄 {gameState.opponent.restedDon}</span>
                  </div>
                </div>

                {/* Opponent miniature DON cards standing vertically */}
                <div className="flex items-center justify-center gap-1 my-0.5">
                  {Array.from({ length: Math.min(5, gameState.opponent.activeDon) }).map((_, idx) => (
                    <div
                      key={`opp-don-${idx}`}
                      className="w-6 sm:w-8 aspect-[2.5/3.5] rounded-sm overflow-hidden border border-black/40 shadow-xs"
                    >
                      <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="text-[7px] text-slate-500 font-mono">
                  🪙 {gameState.opponent.activeDon} | 🔄 {gameState.opponent.restedDon}
                </div>
              </div>

              {/* DON!! Deck Slot (Cols 11-12) */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="w-10 sm:w-12 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#8c9fb2] relative shadow-xs">
                  <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-slate-900/85 text-white font-mono text-[7px] font-bold flex items-center justify-center border border-white/20">
                    {gameState.opponent.donDeckCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row: DECK | STAGE | LEADER (Crocodile/Kaido) */}
            <div className="grid grid-cols-5 gap-1.5 items-center">
              {/* Opponent Main Deck */}
              <div className="aspect-[2.5/3.5] rounded-lg border border-[#8c9fb2] bg-[#9fb2c4]/60 overflow-hidden relative shadow-xs">
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Deck" className="w-full h-full object-cover" />
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/85 text-white font-mono text-[7.5px] font-bold flex items-center justify-center border border-white/30">
                  {gameState.opponent.deckCount}
                </div>
              </div>

              {/* Opponent Stage Slot */}
              <div className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#8c9fb2] bg-[#9fb2c4]/30 flex items-center justify-center text-[7.5px] font-bold uppercase tracking-wider text-slate-500">
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
                className={`aspect-[2.5/3.5] rounded-lg border-2 border-red-500/70 overflow-hidden relative shadow-sm cursor-pointer hover:scale-102 transition group ${
                  highlightTarget === 'opponent' ? spotlightClass : ''
                }`}
                title={`${gameState.opponent.leaderName} (${gameState.opponent.leaderPower} Power)`}
              >
                <img
                  src={gameState.opponent.leaderImage}
                  alt={gameState.opponent.leaderName}
                  className="w-full h-full object-cover"
                  onError={(e) => handleCardImageError(e, gameState.opponent.leaderId, gameState.opponent.leaderImage)}
                />
                {selectedFieldCard && (
                  <div className="absolute inset-0 bg-red-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-[7.5px] font-black text-white bg-red-600 px-1 py-0.5 rounded uppercase shadow">ATTACK</span>
                  </div>
                )}
              </div>

              {/* Spacers */}
              <div className="aspect-[2.5/3.5] rounded-lg border border-transparent" />
              <div className="aspect-[2.5/3.5] rounded-lg border border-transparent" />
            </div>

            {/* Bottom Row: CHARACTER AREA (5 slots facing center player mat) */}
            <div>
              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
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
                            <span className="text-[6.5px] font-bold uppercase text-amber-300 bg-black/85 px-1 rounded">
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
                      className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#8c9fb2] bg-[#9fb2c4]/40"
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Far Right of Opponent Mat: LIFE - 5 Vertical Stack (Pinkish box #e5bebe) */}
          <div className="w-14 sm:w-16 rounded-xl border border-[#d49a9a] bg-[#e5bebe]/60 p-1 flex flex-col items-center justify-start select-none">
            <span className="text-[8px] font-bold text-rose-700 tracking-wider mb-1">
              LIFE · {gameState.opponent.life}
            </span>
            <div className="relative flex flex-col -space-y-11 sm:-space-y-13 pt-0.5">
              {Array.from({ length: Math.min(5, gameState.opponent.life) }).map((_, idx) => (
                <div
                  key={`opp-life-${idx}`}
                  className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#d49a9a] shadow-xs"
                >
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                </div>
              ))}
              {gameState.opponent.life === 0 && (
                <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-red-500/50 flex items-center justify-center text-[7px] text-red-600 font-black text-center">
                  0 LIFE
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Dividing Floating Prompt (e.g. ✦ Attach a DON!!) */}
        <div className="relative z-20 -my-2 flex items-center justify-center">
          {currentStep?.bannerPrompt && (
            <div className="px-4 py-1 rounded-full bg-[#faf7ee] text-slate-800 text-[11px] font-bold shadow-lg border border-[#e2d9c2] flex items-center gap-1.5 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{currentStep.bannerPrompt}</span>
            </div>
          )}
        </div>

        {/* =====================================================================
            2. PLAYER PLAYMAT: Sage Green (#c2d3b8, border #a3b897)
           ===================================================================== */}
        <div
          className="w-full rounded-2xl border-2 border-[#a3b897] bg-[#c2d3b8] p-1.5 sm:p-2 shadow-sm relative flex flex-row items-stretch gap-1.5 sm:gap-2"
        >
          {/* Far Left of Player Mat: LIFE - 5 Vertical Stack (Pinkish box #e5bebe) */}
          <div
            onClick={handleTakeLifeDamage}
            className={`w-14 sm:w-16 rounded-xl border border-[#d49a9a] bg-[#e5bebe]/60 p-1 flex flex-col items-center justify-start select-none cursor-pointer transition ${
              highlightTarget === 'life' ? spotlightClass : ''
            }`}
            title="Click to take 1 Life damage to hand"
          >
            <span className="text-[8px] font-bold text-rose-700 tracking-wider mb-1">
              LIFE · {gameState.life.length}
            </span>
            <div className="relative flex flex-col -space-y-11 sm:-space-y-13 pt-0.5">
              {gameState.life.map((card, idx) => (
                <div
                  key={`player-life-${card.instanceId}-${idx}`}
                  className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#d49a9a] shadow-xs"
                >
                  <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
                </div>
              ))}
              {gameState.life.length === 0 && (
                <div className="w-11 sm:w-13 aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-red-500/50 flex items-center justify-center text-[7px] text-red-600 font-black text-center">
                  0 LIFE
                </div>
              )}
            </div>
          </div>

          {/* Main Grid Area of Player Mat */}
          <div className="flex-1 flex flex-col justify-between gap-1">
            {/* Top Row: CHARACTER AREA (5 slots facing center opponent mat) */}
            <div>
              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                CHARACTER AREA
              </span>
              <div
                className={`grid grid-cols-5 gap-1.5 rounded-lg p-0.5 transition-all ${
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
                          <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-[#c27803] text-white text-[6.5px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5">
                            <span>DON ×{card.attachedDon}</span>
                            <span className="bg-black/30 text-white px-0.5 rounded text-[6px] font-mono">
                              {(card.power || 0) + card.attachedDon * 1000}
                            </span>
                          </div>
                        )}
                        {card.rested && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                            <span className="text-[6.5px] font-bold uppercase text-amber-300 bg-black/85 px-1 rounded">
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
                      className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#99ac8b] bg-[#adbf9f]/40"
                    />
                  );
                })}
              </div>
            </div>

            {/* Middle Row: DON!! DECK | (Spacer) | LEADER (Kid/Luffy) | STAGE | MAIN DECK */}
            <div className="grid grid-cols-5 gap-1.5 items-center">
              {/* Player DON!! Deck */}
              <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden border border-[#99ac8b] relative shadow-xs">
                <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-slate-900/85 text-white font-mono text-[7px] font-bold flex items-center justify-center border border-white/20">
                  {gameState.donDeckCount}
                </div>
              </div>

              {/* Spacer */}
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
                      <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-[#c27803] text-white text-[6.5px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5">
                        <span>DON ×{gameState.leader.attachedDon}</span>
                        <span className="bg-black/30 text-white px-0.5 rounded text-[6px] font-mono">
                          {(gameState.leader.power || 5000) + gameState.leader.attachedDon * 1000}
                        </span>
                      </div>
                    )}
                    {gameState.leader.rested && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <span className="text-[6.5px] font-bold uppercase text-amber-300 bg-black/85 px-1 rounded">
                          RESTED
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Leader Action Pill (✦ Activate) */}
                <button
                  type="button"
                  onClick={() => {
                    if (gameState.leader) setSelectedFieldCard(gameState.leader);
                  }}
                  className="mt-0.5 px-2 py-0.2 rounded-full bg-[#ffb703] hover:bg-[#ffa200] text-black border border-[#e2a800] text-[8px] font-black tracking-wide flex items-center gap-0.5 shadow-xs transition active:scale-95"
                >
                  <span>✦ Activate</span>
                </button>
              </div>

              {/* Stage Slot */}
              <div
                onClick={() => {
                  if (gameState.stage) setSelectedFieldCard(gameState.stage);
                }}
                className="aspect-[2.5/3.5] rounded-lg border border-dashed border-[#99ac8b] bg-[#adbf9f]/30 flex items-center justify-center text-[7.5px] font-bold uppercase tracking-wider text-slate-500 overflow-hidden relative"
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
                className="aspect-[2.5/3.5] rounded-lg border border-[#99ac8b] bg-[#adbf9f]/70 overflow-hidden relative shadow-xs cursor-pointer hover:brightness-105 transition group"
                title="Click to draw 1 card"
              >
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Main Deck" className="w-full h-full object-cover" />
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/85 text-white font-mono text-[7.5px] font-bold flex items-center justify-center border border-white/20">
                  {gameState.deck.length}
                </div>
              </div>
            </div>

            {/* Bottom Row: COST AREA (wide box across bottom middle) | TRASH */}
            <div className="grid grid-cols-12 gap-1.5 items-stretch">
              {/* Cost Area (Cols 1-10) with real DON cards & golden highlight in screenshot */}
              <div
                className={`col-span-10 rounded-xl border border-[#99ac8b] bg-[#adbf9f]/50 px-2 py-0.5 flex flex-col justify-between shadow-inner transition-all ${
                  highlightTarget === 'costArea' ? spotlightClass : ''
                }`}
              >
                <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider text-slate-600">
                  <span>COST AREA</span>
                  <div className="flex items-center gap-1 text-[8.5px] font-mono text-slate-700 font-bold">
                    <span className="text-[#a66402]">🪙 {gameState.activeDon}</span>
                    <span className="text-slate-500">🔄 {gameState.restedDon}</span>
                  </div>
                </div>

                {/* Miniature real DON!! cards standing vertically side-by-side */}
                <div className="flex items-center justify-center gap-1 my-0.5">
                  {Array.from({ length: Math.min(5, gameState.activeDon) }).map((_, idx) => (
                    <div
                      key={`player-don-${idx}`}
                      className="w-6 sm:w-8 aspect-[2.5/3.5] rounded-sm overflow-hidden border border-black/40 shadow-xs"
                    >
                      <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="text-[7px] text-slate-500 font-mono">
                  🪙 {gameState.activeDon} | 🔄 {gameState.restedDon}
                </div>
              </div>

              {/* Trash Slot (Cols 11-12) */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">TRASH</span>
                <div
                  onClick={() => setShowTrashModal(true)}
                  className="w-10 sm:w-12 aspect-[2.5/3.5] rounded-lg border border-dashed border-[#99ac8b] bg-[#adbf9f]/40 flex items-center justify-center text-slate-600 cursor-pointer hover:border-slate-600 transition"
                >
                  <span className="text-[9px] font-mono font-bold">{gameState.trash.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          TUTORIAL OVERLAY DOCK (Covers the inactive half automatically)
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
