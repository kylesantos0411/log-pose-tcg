'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ArrowLeft,
  RotateCcw,
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
  ShieldAlert,
} from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { handleCardImageError } from '@/lib/card-image';
import {
  OPCG_PURPLE_BACK_DATA_URL,
  OPCG_DON_DECK_DATA_URL,
  OPCG_DON_CARD_DATA_URL,
} from '@/lib/sim/sim-assets';
import { useSettings } from '@/context/SettingsContext';
import { checkIsAdmin } from '@/lib/supabase-sync';

interface SimPlaymatProps {
  initialDeck?: RecommendedDeck;
  onExit?: () => void;
}

export function SimPlaymat({ initialDeck, onExit }: SimPlaymatProps) {
  const chosenDeck = initialDeck || ST01_STRAW_HAT_DECK;
  const { user } = useSettings();
  const isAdmin = checkIsAdmin(user);

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
  const [showTurnMenu, setShowTurnMenu] = useState(false);

  // Virtual landscape mode toggle for mobile devices
  const [isVirtualLandscape, setIsVirtualLandscape] = useState(false);

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

  // Tutorial target highlight (golden glowing spotlight box)
  const currentStep = gameState.tutorialMode
    ? OPTCG_TUTORIAL_STEPS[gameState.tutorialStepIndex]
    : null;
  const highlightTarget = currentStep?.targetHighlight || 'none';

  const spotlightClass = 'ring-3 sm:ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.65)]';

  // Toggle orientation / landscape
  const handleToggleOrientation = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        if (screen.orientation.type.includes('portrait')) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
          return;
        } else {
          await (screen.orientation as any).lock('portrait').catch(() => {});
          return;
        }
      }
    } catch {
      // Fallback
    }
    setIsVirtualLandscape((prev) => !prev);
  };

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

  // ---------------------------------------------------------------------------
  // Sub-renderers matching the exact OPlayTCG mobile reference layout (media_1791809778343)
  // ---------------------------------------------------------------------------
  const renderOpponentPlaymat = () => (
    <div
      className={`w-full rounded-2xl border-2 border-[#1c2d4a] bg-[#0b1628] p-1.5 sm:p-2 shadow-xl flex flex-row items-stretch justify-between gap-1.5 flex-1 min-h-0 transition-all ${
        highlightTarget === 'opponent' ? spotlightClass : ''
      }`}
    >
      {/* LEFT / MAIN BATTLEFIELD SECTION */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1 py-0.5">
        {/* Top Row: TRASH (Left) & COST AREA (Center/Right) */}
        <div className="flex items-center gap-1.5 w-full shrink-0">
          {/* Trash Slot */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">TRASH</span>
            <div className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl border border-dashed border-blue-900/60 bg-[#070e1a]/60 flex items-center justify-center text-gray-400">
              <span className="text-[10px] sm:text-xs font-mono font-bold">{gameState.opponent.trashCount}</span>
            </div>
          </div>

          {/* Cost Area with upright DON cards */}
          <div className="flex-1 rounded-2xl border border-blue-900/60 bg-[#070e1a]/85 p-1.5 flex flex-col justify-between shadow-inner h-full min-h-[56px] sm:min-h-[64px]">
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-gray-400">
              <span>COST AREA</span>
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-0.5">
              {Array.from({ length: Math.min(5, gameState.opponent.activeDon) }).map((_, idx) => (
                <div key={`opp-don-${idx}`} className="h-10 sm:h-12 md:h-13 aspect-[2.5/3.5] rounded-xs overflow-hidden border border-black/80 shadow-md">
                  <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 border border-white/10 w-fit text-[7.5px] sm:text-[8.5px] font-mono text-gray-300">
              <span className="flex items-center gap-0.5 text-amber-300 font-bold">🪙 {gameState.opponent.activeDon}</span>
              <span className="text-gray-500">|</span>
              <span className="flex items-center gap-0.5 text-gray-400 font-bold">🎴 {gameState.opponent.restedDon}</span>
            </div>
          </div>
        </div>

        {/* Middle Row: DECK & STAGE (Left) | LEADER CARD (Center/Right) */}
        <div className="flex items-center justify-between gap-1.5 w-full my-auto shrink-0">
          {/* Deck & Stage */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl border border-blue-900/60 bg-[#070e1a]/60 overflow-hidden relative shadow-md">
              <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Deck" className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/85 text-white font-mono text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white/20">
                {gameState.opponent.deckCount}
              </div>
            </div>
            <div className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl border border-dashed border-blue-900/40 bg-[#070e1a]/40 flex items-center justify-center text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-gray-500">
              STAGE
            </div>
          </div>

          {/* Opponent Leader Card - Large and Commanding */}
          <div
            onClick={() => {
              if (selectedFieldCard) {
                handleAttackOpponent(selectedFieldCard.instanceId);
              } else if (gameState.leader && !gameState.leader.rested) {
                setSelectedFieldCard(gameState.leader);
              }
            }}
            className={`w-16 sm:w-20 md:w-22 aspect-[2.5/3.5] rounded-xl border-2 border-red-500/80 overflow-hidden relative shadow-lg cursor-pointer hover:scale-102 transition group mx-auto ${
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
              <div className="absolute inset-0 bg-red-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="text-[8px] sm:text-[9.5px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded uppercase shadow">ATTACK</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: CHARACTER AREA (5 card slots across) */}
        <div className="w-full shrink-0">
          <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
            CHARACTER AREA
          </span>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">
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
                    className={`w-full aspect-[2.5/3.5] rounded-xl border border-white/20 overflow-hidden relative shadow-md cursor-pointer transition ${
                      oppChar.rested ? 'rotate-90 scale-95 opacity-80 border-amber-500' : ''
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
                        <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/85 px-1.5 rounded">
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
                  className="w-full aspect-[2.5/3.5] rounded-xl border border-dashed border-blue-900/40 bg-[#070e1a]/40"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: DON!! DECK (Top) & LIFE STACK (Bottom) */}
      <div className="w-12 sm:w-14 md:w-16 shrink-0 flex flex-col justify-between items-center gap-1 py-0.5">
        {/* DON!! Deck Slot */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-400 mb-0.5 text-center leading-tight">DON!!</span>
          <div className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl overflow-hidden border border-blue-900/60 relative shadow-md bg-black/30">
            <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/85 text-white font-mono text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white/20">
              {gameState.opponent.donDeckCount}
            </div>
          </div>
        </div>

        {/* Opponent Life Stack Container */}
        <div className="rounded-xl border border-rose-900/80 bg-rose-950/25 px-1 py-1.5 flex flex-col items-center w-full shadow-inner">
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-rose-400 tracking-wider mb-0.5 text-center whitespace-nowrap">
            LIFE · {gameState.opponent.life}
          </span>
          <div className="relative flex flex-col -space-y-6 sm:-space-y-7 pt-0.5 items-center">
            {Array.from({ length: Math.min(5, gameState.opponent.life) }).map((_, idx) => (
              <div
                key={`opp-life-${idx}`}
                className="w-9 sm:w-11 md:w-12 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shadow-md"
              >
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
              </div>
            ))}
            {gameState.opponent.life === 0 && (
              <div className="w-9 sm:w-11 md:w-12 aspect-[2.5/3.5] rounded-md border border-dashed border-red-500/50 flex items-center justify-center text-[8px] text-red-400 font-black text-center">
                0
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlayerPlaymat = () => (
    <div
      className={`w-full rounded-2xl border-2 border-[#153424] bg-[#091812] p-1.5 sm:p-2 shadow-xl flex flex-row items-stretch justify-between gap-1.5 flex-1 min-h-0 transition-all`}
    >
      {/* LEFT COLUMN: LIFE STACK (Top) & DON!! DECK (Bottom) */}
      <div className="w-12 sm:w-14 md:w-16 shrink-0 flex flex-col justify-between items-center gap-1 py-0.5">
        {/* Player Life Stack Container */}
        <div
          onClick={handleTakeLifeDamage}
          className={`rounded-xl border border-rose-900/80 bg-rose-950/25 px-1 py-1.5 flex flex-col items-center w-full cursor-pointer transition shadow-inner ${
            highlightTarget === 'life' ? spotlightClass : ''
          }`}
          title="Click to take 1 Life damage to hand"
        >
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-rose-400 tracking-wider mb-0.5 text-center whitespace-nowrap">
            LIFE · {gameState.life.length}
          </span>
          <div className="relative flex flex-col -space-y-6 sm:-space-y-7 pt-0.5 items-center">
            {gameState.life.map((card, idx) => (
              <div
                key={`player-life-${card.instanceId}-${idx}`}
                className="w-9 sm:w-11 md:w-12 aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shadow-md"
              >
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
              </div>
            ))}
            {gameState.life.length === 0 && (
              <div className="w-9 sm:w-11 md:w-12 aspect-[2.5/3.5] rounded-md border border-dashed border-red-500/50 flex items-center justify-center text-[8px] text-red-400 font-black text-center">
                0
              </div>
            )}
          </div>
        </div>

        {/* DON!! Deck Slot */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-emerald-400/80 mb-0.5 text-center leading-tight">DON!!</span>
          <div className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl overflow-hidden border border-emerald-900/60 relative shadow-md bg-black/30">
            <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/85 text-white font-mono text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white/20">
              {gameState.donDeckCount}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT / MAIN BATTLEFIELD SECTION */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1 py-0.5">
        {/* Top Row: CHARACTER AREA (5 card slots across) */}
        <div className="w-full shrink-0">
          <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-emerald-400/80 block mb-0.5">
            CHARACTER AREA
          </span>
          <div
            className={`grid grid-cols-5 gap-1.5 sm:gap-2 w-full rounded-lg p-0.5 transition-all ${
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
                    className={`w-full aspect-[2.5/3.5] rounded-xl overflow-hidden relative shadow-md cursor-pointer transition ${
                      card.rested
                        ? 'rotate-90 scale-95 opacity-80 border-2 border-amber-500'
                        : 'border border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.4)] hover:border-cyan-300'
                    }`}
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                    />
                    {card.attachedDon > 0 && (
                      <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-[#d97706] text-white text-[6.5px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5">
                        <span>DON ×{card.attachedDon}</span>
                      </div>
                    )}
                    {card.rested && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/85 px-1.5 rounded">
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
                  className="w-full aspect-[2.5/3.5] rounded-xl border border-dashed border-emerald-900/40 bg-[#05110d]/40"
                />
              );
            })}
          </div>
        </div>

        {/* Middle Row: LEADER CARD (Center/Left) | STAGE & DECK (Right) */}
        <div className="flex items-center justify-between gap-1.5 w-full my-auto shrink-0">
          {/* Player Leader Card - Large, Commanding with Activate pill button */}
          <div className="flex flex-col items-center mx-auto">
            {gameState.leader && (
              <div
                onClick={() => setSelectedFieldCard(gameState.leader)}
                className={`w-16 sm:w-20 md:w-22 aspect-[2.5/3.5] rounded-xl border-2 border-cyan-400 overflow-hidden relative shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer hover:border-cyan-300 transition ${
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
                  <div className="absolute bottom-0.5 inset-x-0.5 py-0.5 bg-[#d97706] text-white text-[7px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5">
                    <span>DON ×{gameState.leader.attachedDon}</span>
                  </div>
                )}
                {gameState.leader.rested && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-[7px] font-bold uppercase text-amber-300 bg-black/85 px-1.5 rounded">
                      RESTED
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (gameState.leader) setSelectedFieldCard(gameState.leader);
              }}
              className="mt-1 px-3.5 py-0.5 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-black text-[8px] sm:text-[9.5px] tracking-wide flex items-center gap-0.5 shadow-md transition active:scale-95"
            >
              <span>✦ Activate</span>
            </button>
          </div>

          {/* Stage & Deck */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div
              onClick={() => {
                if (gameState.stage) setSelectedFieldCard(gameState.stage);
              }}
              className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl border border-dashed border-emerald-900/40 bg-[#05110d]/40 flex items-center justify-center text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-gray-500 overflow-hidden relative cursor-pointer"
            >
              {gameState.stage ? (
                <img src={gameState.stage.imageUrl} alt={gameState.stage.name} className="w-full h-full object-cover" />
              ) : (
                <span>STAGE</span>
              )}
            </div>
            <div
              onClick={handleManualDraw}
              className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl border border-emerald-900/50 bg-[#05110d]/70 overflow-hidden relative shadow-md cursor-pointer hover:brightness-110 transition group"
              title="Click to draw 1 card"
            >
              <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Main Deck" className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/85 text-white font-mono text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white/20">
                {gameState.deck.length}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: COST AREA (Left/Center) & TRASH (Right) */}
        <div className="flex items-center gap-1.5 w-full shrink-0">
          {/* Cost Area with upright DON cards matching reference screenshot */}
          <div
            className={`flex-1 rounded-2xl border border-emerald-900/60 bg-[#05110d]/85 p-1.5 flex flex-col justify-between shadow-inner h-full min-h-[56px] sm:min-h-[64px] transition-all ${
              highlightTarget === 'costArea' ? 'border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.65)]' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-emerald-400/80">
              <span>COST AREA</span>
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-0.5">
              {Array.from({ length: Math.min(5, gameState.activeDon) }).map((_, idx) => (
                <div key={`player-don-${idx}`} className="h-10 sm:h-12 md:h-13 aspect-[2.5/3.5] rounded-xs overflow-hidden border border-black/80 shadow-md">
                  <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 border border-white/10 w-fit text-[7.5px] sm:text-[8.5px] font-mono text-gray-200">
              <span className="flex items-center gap-0.5 text-amber-300 font-bold">🪙 {gameState.activeDon}</span>
              <span className="text-gray-500">|</span>
              <span className="flex items-center gap-0.5 text-gray-400 font-bold">🎴 {gameState.restedDon}</span>
            </div>
          </div>

          {/* Trash Slot */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">TRASH</span>
            <div
              onClick={() => setShowTrashModal(true)}
              className="w-10 sm:w-12 md:w-13 aspect-[2.5/3.5] rounded-xl border border-dashed border-emerald-900/60 bg-[#05110d]/50 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition"
            >
              <span className="text-[10px] sm:text-xs font-mono font-bold">{gameState.trash.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`h-screen w-screen overflow-hidden bg-[#0a0e17] text-gray-200 flex flex-col justify-between p-1 sm:p-2 font-sans select-none relative transition-all ${
        isVirtualLandscape ? 'rotate-90 origin-top-left w-[100vh] h-[100vw] translate-x-[100vw] fixed inset-0 z-50' : ''
      }`}
    >
      {/* =======================================================================
          EXACT OPLAYTCG REFERENCE SINGLE-COLUMN MOBILE BATTLEFIELD ARCHITECTURE
          Header -> Opponent Hand & Pill -> Opponent Mat -> Midline ->
          Player Mat -> Player Pill & Hand -> Bottom Action Bar
         ======================================================================= */}
      {/* =======================================================================
          EXACT OPLAYTCG REFERENCE SINGLE-COLUMN MOBILE BATTLEFIELD ARCHITECTURE
          Header -> Opponent Hand & Pill -> Opponent Mat -> Midline ->
          Player Mat -> Player Pill & Hand -> Bottom Action Bar
         ======================================================================= */}
      <div className="w-full h-full max-w-[480px] sm:max-w-[540px] md:max-w-[600px] mx-auto flex flex-col justify-between gap-1 overflow-hidden">
        {/* 1. TOP HEADER NAVIGATION - Clean & minimal like reference (media_1791811058901) */}
        <div className="flex items-center justify-between w-full shrink-0 px-1 py-0.5 z-20">
          <div className="flex items-center gap-1">
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 shadow-xs transition"
                title="Return to App"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 shadow-xs transition"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="w-7 h-7 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 flex items-center justify-center shadow-xs transition"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Menu Button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowTurnMenu(true)}
              className="px-2 py-0.5 rounded-md bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 text-[9px] font-semibold flex items-center gap-1 transition"
            >
              <Menu className="w-2.5 h-2.5 text-amber-400" />
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* 2. OPPONENT HAND & STATUS PILL */}
        <div className="flex flex-col items-center w-full shrink-0 z-10 gap-0.5">
          {/* Opponent Hand (Overlapping cards - nice and large like Image 1) */}
          {oppHandExpanded && (
            <div className="flex items-center justify-center -space-x-3 sm:-space-x-4 animate-fadeIn my-0.5">
              {Array.from({ length: gameState.opponent.handCount }).map((_, idx) => (
                <div
                  key={`opp-hand-card-${idx}`}
                  className="w-13 sm:w-16 md:w-18 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 shadow-md transform transition hover:-translate-y-1 hover:z-10 bg-black/40 shrink-0"
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

          {/* Opponent Status Pill Bar */}
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowOpponentSelector(true)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#131d31] border border-blue-500/30 text-white text-[9px] font-bold shadow-xs hover:bg-[#1a263f] transition"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                <span>OPPONENT</span>
              </button>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#131d31] border border-white/10 text-gray-300 font-mono text-[8.5px]">
                <Clock className="w-2.5 h-2.5 text-gray-400" />
                <span>17:30</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="px-2 py-0.5 rounded-md bg-[#131d31] border border-white/10 text-white font-mono text-[9px] font-bold shadow-xs">
                {gameState.opponent.handCount}
              </div>
              <button
                type="button"
                onClick={() => setOppHandExpanded(!oppHandExpanded)}
                className="px-2 py-0.5 rounded-md bg-[#1a253d] hover:bg-[#24324f] text-gray-200 border border-white/10 text-[8.5px] font-semibold shadow-xs flex items-center gap-0.5 transition"
              >
                <span>⇅ Original</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. OPPONENT PLAYMAT */}
        {renderOpponentPlaymat()}

        {/* 4. MIDLINE & FLOATING TUTORIAL ALERT BADGE */}
        <div className="relative w-full flex items-center justify-center shrink-0 my-0.5 z-30">
          <div className="h-0.5 w-full bg-white/10" />
          {currentStep && (
            <button
              type="button"
              onClick={() => {
                const nextIdx = (gameState.tutorialStepIndex + 1) % OPTCG_TUTORIAL_STEPS.length;
                setGameState((prev) => setTutorialStep(prev, nextIdx));
              }}
              className="absolute px-5 py-1.5 rounded-full bg-[#181a24]/95 border-2 border-amber-400 text-amber-300 text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-1.5 pointer-events-auto cursor-pointer animate-pulse active:scale-95 transition"
            >
              <span className="text-amber-400">✦</span>
              <span>{currentStep.title}</span>
            </button>
          )}
        </div>

        {/* 5. PLAYER PLAYMAT */}
        {renderPlayerPlaymat()}

        {/* 6. PLAYER STATUS PILL & HAND */}
        <div className="flex flex-col items-center w-full shrink-0 z-10 gap-0.5">
          {/* Player Status Pill Bar */}
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#131d31] border border-emerald-500/30 text-white text-[9px] font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span>GUEST</span>
                <span className="px-1 py-0.2 rounded bg-amber-600 text-[6.5px] font-bold text-white uppercase">TURN</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#131d31] border border-white/10 text-gray-300 font-mono text-[8.5px]">
                <Clock className="w-2.5 h-2.5 text-gray-400" />
                <span>17:30</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="px-2 py-0.5 rounded-md bg-[#131d31] border border-white/10 text-white font-mono text-[9px] font-bold shadow-xs">
                {gameState.hand.length}
              </div>
              <button
                type="button"
                onClick={() => setPlayerHandExpanded(!playerHandExpanded)}
                className="px-2 py-0.5 rounded-md bg-[#1a253d] hover:bg-[#24324f] text-gray-200 border border-white/10 text-[8.5px] font-semibold shadow-xs flex items-center gap-0.5 transition"
              >
                <span>⇅ Original</span>
              </button>
            </div>
          </div>

          {/* Player Hand (Overlapping cards - nice and large like Image 1) */}
          {playerHandExpanded && (
            <div
              className={`flex items-center justify-center -space-x-3 sm:-space-x-4 animate-fadeIn my-0.5 transition-all overflow-x-auto max-w-full px-2 py-0.5 ${
                highlightTarget === 'hand' ? spotlightClass : ''
              }`}
            >
              {gameState.hand.map((card) => {
                const canAfford = gameState.activeDon >= (card.cost || 0);
                return (
                  <div
                    key={card.instanceId}
                    onClick={() => setSelectedHandCard(card)}
                    className={`w-13 sm:w-16 md:w-18 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/20 shadow-xl cursor-pointer transform transition duration-150 hover:-translate-y-2 hover:z-20 bg-black/40 shrink-0 ${
                      canAfford ? 'opacity-100 hover:border-amber-400' : 'opacity-70'
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

        {/* 7. BOTTOM ACTION BAR - Exact match of Image 1 */}
        <div className="flex items-center justify-between w-full shrink-0 px-1 py-1 z-20">
          {/* Turn Menu Pill (Left) */}
          <button
            type="button"
            onClick={() => setShowTurnMenu(true)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <Menu className="w-3.5 h-3.5 stroke-[3]" />
            <span>TURN {gameState.turn}</span>
          </button>

          {/* Action Controls (Right) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('Bug report submitted. Thank you for testing the simulator!')}
              className="w-8 h-8 rounded-full bg-[#141a29] text-amber-500 hover:text-amber-400 border border-white/10 shadow-xs flex items-center justify-center transition active:scale-95"
              title="Report bug"
            >
              <Bug className="w-4 h-4 text-amber-500" />
            </button>

            <button
              type="button"
              onClick={handleNextTurn}
              className={`px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-black font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer select-none ${
                highlightTarget === 'endTurn' ? spotlightClass : ''
              }`}
            >
              <span>End turn</span>
              <span className="text-xs">▷</span>
            </button>
          </div>
        </div>
      </div>

      {/* TURN MENU MODAL */}
      {showTurnMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#101626] border border-[#232f48] rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl relative text-gray-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Menu className="w-4 h-4 text-amber-400" />
                <span>Turn {gameState.turn} Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTurnMenu(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowTurnMenu(false);
                  handleRestart(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-200 font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restart Match</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTurnMenu(false);
                  setShowOpponentSelector(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-200 font-semibold transition"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Change Opponent Deck</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTurnMenu(false);
                  setShowLogModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-200 font-semibold transition"
              >
                <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                <span>Battle Log ({gameState.logs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTurnMenu(false);
                  setShowSettingsModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-200 font-semibold transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Settings & Tutorial</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTurnMenu(false);
                  handleToggleOrientation();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-200 font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
                <span>Rotate Screen</span>
              </button>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold transition border border-rose-500/30"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TUTORIAL OVERLAY DOCK (Covers the inactive half automatically in Dark Theme)
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#101626] border border-[#232f48] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative text-gray-200">
            <button
              type="button"
              onClick={() => setSelectedHandCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-xs">
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
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/30">
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
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Play Card ({selectedHandCard.cost} DON)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDiscardCard(selectedHandCard.instanceId)}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#101626] border border-[#232f48] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative text-gray-200">
            <button
              type="button"
              onClick={() => setSelectedFieldCard(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-xs">
                <img
                  src={liveFieldCard.imageUrl}
                  alt={liveFieldCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{liveFieldCard.name}</h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      liveFieldCard.rested
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {liveFieldCard.rested ? 'Rested' : 'Active'}
                  </span>
                </div>
                <div className="text-[12px] text-amber-400 font-mono mt-1 font-bold">
                  Combat Power: {(liveFieldCard.power || 0) + liveFieldCard.attachedDon * 1000}
                  {liveFieldCard.attachedDon > 0 && (
                    <span className="text-emerald-400 font-semibold text-[10px] ml-1">
                      (+{liveFieldCard.attachedDon * 1000} from {liveFieldCard.attachedDon} DON!!)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
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
                    ? 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
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
                <div className="col-span-2 flex flex-col gap-1 pt-1 border-t border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
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
                              ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border-rose-500/40 cursor-pointer active:scale-95'
                              : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                          }`}
                        >
                          <Swords className="w-3 h-3 text-rose-400" />
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
                    ? 'bg-[#d97706] hover:bg-[#b45309] text-white active:scale-95 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
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
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#101626] border border-[#232f48] rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col text-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
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
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    gameState.opponent.deckId === d.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/10 shrink-0">
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
          <div className="bg-[#101626] border border-[#232f48] rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-3 shadow-2xl max-h-[85vh] flex flex-col text-gray-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-400" />
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
                  className={`p-2 rounded-lg border leading-relaxed ${
                    log.type === 'combat'
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      : log.type === 'phase'
                      ? 'bg-blue-950/30 border-blue-500/30 text-blue-300'
                      : 'bg-white/5 border-white/10 text-gray-300'
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

      {/* Victory / Defeat Modals */}
      {gameState.winner === 'player' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#101626] border border-amber-400/50 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-3">
            <div className="text-4xl">🏆</div>
            <h2 className="text-xl font-black text-white">VICTORY!</h2>
            <p className="text-xs text-gray-300">
              You reduced Kaido's Life to 0 and landed the final strike!
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="flex-1 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs transition"
              >
                Play Again
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs transition"
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
            <div className="text-4xl">💀</div>
            <h2 className="text-xl font-black text-white">DEFEAT</h2>
            <p className="text-xs text-gray-300">
              Your Life reached 0 and you took fatal damage.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(true)}
                className="flex-1 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition"
              >
                Rematch
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs transition"
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
