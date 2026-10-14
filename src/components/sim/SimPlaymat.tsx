'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SimGameState, SimCard, PendingCombat } from '@/lib/sim/sim-types';
import {
  advanceNextTurn,
  playCardFromHand,
  attachDonToCard,
  detachDonFromCard,
  toggleCardRest,
  takeLifeDamage,
  sendCardToTrash,
  attackOpponentLeader,
  attackOpponentCharacter,
  activateBlocker,
  passBlockerStep,
  applyCounterFromHand,
  resolvePendingCombat,
  activateTriggerEffect,
  dismissTriggerEffect,
  switchOpponent,
  performMulligan,
  keepInitialHand,
  initializeGame,
  getRandomOpponentDeck,
  resolveSearcherSelection,
  resolveSearcherPass,
  activateFieldCardSearcher,
  setTutorialStep,
  toggleTutorialMode,
  createLog,
  executeOpponentRefreshAndDraw,
  executeOpponentSummon,
  executeOpponentAttachDon,
  executeOpponentAttack,
  executePlayerStartTurn,
} from '@/lib/sim/sim-engine';
import { simAudio } from '@/lib/sim/sim-audio';
import {
  AnimationSpeed,
  getStoredAnimationSpeed,
  setStoredAnimationSpeed,
  waitAnimation,
  TurnBannerAnim,
  FloatingCardAnim,
  AttackSlashAnim,
  DonFlyAnim,
  CombatImpactAnim,
  PowerFloatPopup,
} from '@/lib/sim/sim-animations';
import { SimAnimationLayer } from './SimAnimationLayer';
import { SimCardInspectorModal } from './SimCardInspectorModal';
import { SimPileViewerModal } from './SimPileViewerModal';
import { SimMulliganModal } from './SimMulliganModal';
import { SimMatchmakingModal } from './SimMatchmakingModal';
import { SimSearcherModal } from './SimSearcherModal';
import { SimTriggerModal } from './SimTriggerModal';
import { SimMultiplayerModal } from './SimMultiplayerModal';
import { SimTutorialBanner } from './SimTutorialBanner';
import { SimSettingsModal } from './SimSettingsModal';
import { simMultiplayer, PlayerPublicBoard } from '@/lib/sim/sim-multiplayer';
import { OPTCG_TUTORIAL_STEPS } from '@/lib/sim/tutorial-data';
import { ST01_STRAW_HAT_DECK, ST04_ANIMAL_KINGDOM_DECK } from '@/lib/sim/starter-decks';
import {
  ArrowLeft,
  RotateCcw,
  Swords,
  ScrollText,
  Shuffle,
  Sparkles,
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
  Shield,
  Zap,
  Eye,
  Info,
  Languages,
  Copy,
  Check,
  Radio,
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
  initialTutorialMode?: boolean;
  onExit?: () => void;
  initialMultiplayerRoom?: {
    roomId: string;
    isHost: boolean;
  };
}

export function SimPlaymat({ initialDeck, initialTutorialMode, onExit, initialMultiplayerRoom }: SimPlaymatProps) {
  const chosenDeck = initialDeck || ST01_STRAW_HAT_DECK;
  const isTutorial = initialTutorialMode !== undefined ? initialTutorialMode : false;
  const { user } = useSettings();
  const isAdmin = checkIsAdmin(user);

  // Initialize game session: if multiplayer room, adjust turn/goingFirst and clear practice characters
  const [gameState, setGameState] = useState<SimGameState>(() => {
    const init = initializeGame(
      chosenDeck,
      initialMultiplayerRoom ? initialMultiplayerRoom.isHost : true,
      isTutorial ? ST04_ANIMAL_KINGDOM_DECK : undefined,
      isTutorial
    );

    if (initialMultiplayerRoom) {
      return {
        ...init,
        isOpponentTurn: !initialMultiplayerRoom.isHost,
        turn: 1,
        goingFirst: initialMultiplayerRoom.isHost,
        hand: [], // Do NOT draw starting cards before opponent connects
        life: [], // Do NOT place life cards before opponent connects
        activeDon: 0,
        mulliganOffered: false,
        opponent: {
          ...init.opponent,
          name: 'Waiting for Opponent...',
          leaderName: 'Opponent Leader',
          characters: [],
          handCount: 0,
          life: 0,
          maxLife: 0,
        },
        logs: [
          createLog(`⚓ PVP Match Room: ${initialMultiplayerRoom.roomId}`, 'system'),
          createLog(
            initialMultiplayerRoom.isHost
              ? `👑 You are Host (Going First). Waiting for Player 2 to join...`
              : `⚔️ You are Guest (Going Second). Connecting to room ${initialMultiplayerRoom.roomId}...`,
            'system'
          ),
        ],
      };
    }

    return init;
  });

  // Show matchmaking loading screen when starting a non-tutorial solo battle
  const [showMatchmaking, setShowMatchmaking] = useState<boolean>(!isTutorial && !initialMultiplayerRoom);

  const currentOpponentDeck: RecommendedDeck =
    [ST04_ANIMAL_KINGDOM_DECK, ...RECOMMENDED_DECKS].find(
      (d) => d.id === gameState.opponent.deckId
    ) || ST04_ANIMAL_KINGDOM_DECK;

  const [inspectedCard, setInspectedCard] = useState<SimCard | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [activeMultiplayerRoom, setActiveMultiplayerRoom] = useState<string | null>(
    initialMultiplayerRoom?.roomId || null
  );
  const [isMultiplayerHost, setIsMultiplayerHost] = useState(
    initialMultiplayerRoom?.isHost || false
  );
  const [isMultiplayerOpponentConnected, setIsMultiplayerOpponentConnected] = useState(false);
  const connectedRoomIdRef = useRef<string | null>(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<SimCard | null>(null);
  const [selectedFieldCard, setSelectedFieldCard] = useState<SimCard | null>(null);

  // Multi-DON selection for quick attachment (e.g. clicking 4th DON selects 4 DONs to attach)
  const [selectedDonCount, setSelectedDonCount] = useState<number>(0);

  // Attack Targeting Flow (Attacker selection ➜ reticle targeting on opponent mat)
  const [selectedAttacker, setSelectedAttacker] = useState<SimCard | null>(null);

  // Derive live attacker card from current gameState so power & attached DON stay updated
  const liveAttackerCard: SimCard | null = selectedAttacker
    ? (gameState.leader?.instanceId === selectedAttacker.instanceId
        ? gameState.leader
        : gameState.characters.find((c) => c.instanceId === selectedAttacker.instanceId) || null)
    : null;

  // Auto-clear attacker if that card becomes rested or is removed from the field
  useEffect(() => {
    if (selectedAttacker) {
      const live =
        gameState.leader?.instanceId === selectedAttacker.instanceId
          ? gameState.leader
          : gameState.characters.find((c) => c.instanceId === selectedAttacker.instanceId);
      if (!live || live.rested) {
        setSelectedAttacker(null);
      }
    }
  }, [gameState, selectedAttacker]);

  // Helper to determine if a card is currently eligible to declare an attack
  const canCardAttack = (card: SimCard): boolean => {
    if (card.rested) return false;
    if (gameState.turn === 1 && gameState.goingFirst) return false;
    if (card.category === 'Character' && !card.canAttackThisTurn && !card.hasRush) return false;
    return card.category === 'Leader' || card.category === 'Character';
  };

  // Auto-clamp selected DON count if active DON decreases
  useEffect(() => {
    if (selectedDonCount > gameState.activeDon) {
      setSelectedDonCount(gameState.activeDon);
    }
  }, [gameState.activeDon, selectedDonCount]);

  // Toggle for original card hand view vs minimized count pill
  const [playerHandExpanded, setPlayerHandExpanded] = useState(true);
  const [showTurnMenu, setShowTurnMenu] = useState(false);

  // Responsive orientation detection (automatically adapts to device orientation and viewport aspect ratio)
  const [isLandscape, setIsLandscape] = useState(false);
  const [forceVirtualLandscape, setForceVirtualLandscape] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isWide = typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false;
      setIsLandscape(isWide);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const activeIsLandscape = isLandscape || forceVirtualLandscape;

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
        const nextType = window.innerWidth > window.innerHeight ? 'portrait' : 'landscape';
        await (screen.orientation as any).lock(nextType).catch(() => {});
        return;
      }
    } catch {
      // Fallback
    }
    setForceVirtualLandscape((prev) => !prev);
  };

  // Restart match
  const handleRestart = (goingFirst: boolean = true) => {
    setSelectedDonCount(0);
    setSelectedAttacker(null);
    setGameState(
      initializeGame(
        chosenDeck,
        goingFirst,
        RECOMMENDED_DECKS.find((d) => d.id === gameState.opponent.deckId) || ST04_ANIMAL_KINGDOM_DECK,
        gameState.tutorialMode
      )
    );
  };

  const [isAiThinking, setIsAiThinking] = useState(false);

  // Centralized Animation & Visual Feedback System
  const [animSpeed, setAnimSpeed] = useState<AnimationSpeed>(() => getStoredAnimationSpeed());
  const [turnBannerAnim, setTurnBannerAnim] = useState<TurnBannerAnim | null>(null);
  const [flyingCardAnim, setFlyingCardAnim] = useState<FloatingCardAnim | null>(null);
  const [attackSlashAnim, setAttackSlashAnim] = useState<AttackSlashAnim | null>(null);
  const [donFlyAnim, setDonFlyAnim] = useState<DonFlyAnim | null>(null);
  const [combatImpactAnim, setCombatImpactAnim] = useState<CombatImpactAnim | null>(null);
  const [powerPopups, setPowerPopups] = useState<PowerFloatPopup[]>([]);
  const isActionRunningRef = useRef(false);

  const handleSpeedChange = (newSpeed: AnimationSpeed) => {
    setAnimSpeed(newSpeed);
    setStoredAnimationSpeed(newSpeed);
  };

  const spawnPowerPopup = useCallback(
    (
      text: string,
      color: 'amber' | 'emerald' | 'rose' | 'cyan' | 'purple' = 'amber',
      x: number = 50,
      y: number = 50
    ) => {
      const id = `popup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setPowerPopups((prev) => [...prev, { id, text, color, x, y }]);
      setTimeout(() => {
        setPowerPopups((prev) => prev.filter((p) => p.id !== id));
      }, 900);
    },
    []
  );

  const triggerTurnBanner = useCallback(
    async (turnNumber: number, isPlayerTurn: boolean, playerName: string) => {
      if (animSpeed === 'instant') return;
      setTurnBannerAnim({ id: `banner-${Date.now()}`, turnNumber, isPlayerTurn, playerName });
      await waitAnimation(1100, animSpeed);
      setTurnBannerAnim(null);
    },
    [animSpeed]
  );

  const triggerAttackVisual = useCallback(
    async (
      startX: number,
      startY: number,
      targetX: number,
      targetY: number,
      attackerName: string,
      targetName: string
    ) => {
      if (animSpeed === 'instant') return;
      setAttackSlashAnim({
        id: `slash-${Date.now()}`,
        startX,
        startY,
        targetX,
        targetY,
        attackerName,
        targetName,
        durationMs: 400,
      });
      await waitAnimation(400, animSpeed);
      setAttackSlashAnim(null);
    },
    [animSpeed]
  );

  const triggerCombatImpactVisual = useCallback(
    async (x: number, y: number, type: 'hit' | 'guard' | 'ko' | 'life', text?: string) => {
      if (animSpeed === 'instant') return;
      setCombatImpactAnim({ id: `impact-${Date.now()}`, x, y, type, text });
      await waitAnimation(450, animSpeed);
      setCombatImpactAnim(null);
    },
    [animSpeed]
  );

  // Long-press detection ref for mobile touch and desktop hold
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const startLongPress = useCallback((card: SimCard) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate(35); // Gentle haptic vibration on mobile
      }
      setInspectedCard(card);
      simAudio.playCardPlay();
    }, 380); // 380ms triggers inspection smoothly before browser long-press menu
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, card: SimCard) => {
    e.preventDefault();
    e.stopPropagation();
    setInspectedCard(card);
  }, []);

  // Turn advance (Triggers Refresh -> Opponent Turn -> Player Turn with paced AI progression)
  // Broadcast my public board state to opponent in multiplayer
  const syncMyBoardState = (customState?: SimGameState) => {
    if (!activeMultiplayerRoom) return;
    const s = customState || gameState;
    if (!s.leader) return;
    const board: PlayerPublicBoard = {
      playerId: simMultiplayer.getPlayerId(),
      deckName: chosenDeck.name,
      leader: s.leader,
      characters: s.characters,
      stage: s.stage,
      activeDon: s.activeDon,
      restedDon: s.restedDon,
      attachedDon:
        (s.leader.attachedDon || 0) +
        s.characters.reduce((acc, c) => acc + (c.attachedDon || 0), 0),
      donDeckCount: s.donDeckCount,
      handCount: s.hand.length,
      lifeCount: s.life.length,
      deckCount: s.deck.length,
      trashCount: s.trash.length,
      trash: s.trash,
    };
    simMultiplayer.broadcastBoardSync(board);
  };

  // Connect to Multiplayer Room and setup peer synchronization listeners
  const handleConnectMultiplayerRoom = (roomId: string, isHost: boolean) => {
    setActiveMultiplayerRoom(roomId);
    setIsMultiplayerHost(isHost);

    simMultiplayer.joinRoom(roomId, {
      onHandshake: (payload) => {
        setIsMultiplayerOpponentConnected(true);
        simAudio.playPhaseDing();

        setGameState((prev) => {
          const needsDeal = prev.hand.length === 0 && prev.life.length === 0;
          const fresh = needsDeal
            ? initializeGame(chosenDeck, isHost, undefined, false)
            : prev;

          const isNewOpponent = !prev.opponent.leaderId || prev.opponent.leaderId !== payload.leader.cardId;
          const nextLogs = [
            ...fresh.logs,
            ...(isNewOpponent
              ? [createLog(`⚔️ Opponent connected: ${payload.deckName} (${payload.leader.name})!`, 'system')]
              : []),
            ...(needsDeal
              ? [createLog(`⚔️ Match Starting! Placed Life cards and drew 5 starting cards. Choose your Mulligan hand!`, 'action')]
              : []),
          ];

          return {
            ...fresh,
            isOpponentTurn: !isHost,
            goingFirst: isHost,
            turn: 1,
            mulliganOffered: needsDeal ? true : fresh.mulliganOffered,
            opponent: {
              ...fresh.opponent,
              name: payload.deckName,
              leaderId: payload.leader.cardId,
              leaderName: payload.leader.name,
              leaderImage: payload.leader.imageUrl,
              leaderPower: payload.leader.power,
              life: payload.lifeCount || 5,
              maxLife: payload.lifeCount || 5,
              handCount: payload.handCount || 5,
              deckCount: payload.deckCount || 42,
              activeDon: payload.activeDon || 0,
              characters: prev.opponent.characters || [],
            },
            opponentLife: payload.lifeCount || 5,
            opponentPower: payload.leader.power,
            logs: nextLogs,
          };
        });

        // Only reply if incoming handshake was NOT already a reply (prevents infinite ping-pong broadcast loop)
        if (!payload.isReply) {
          setGameState((current) => {
            if (current.leader) {
              simMultiplayer.broadcastHandshake({
                isHost,
                deckName: chosenDeck.name,
                leader: current.leader,
                deckCount: current.deck.length,
                lifeCount: current.life.length,
                handCount: current.hand.length,
                activeDon: current.activeDon,
                isReply: true,
              });
              syncMyBoardState(current);
            }
            return current;
          });
        } else {
          setGameState((current) => {
            syncMyBoardState(current);
            return current;
          });
        }
      },

      onBoardSync: (board) => {
        setIsMultiplayerOpponentConnected(true);
        setGameState((prev) => ({
          ...prev,
          opponent: {
            ...prev.opponent,
            name: board.deckName,
            leaderId: board.leader.cardId,
            leaderName: board.leader.name,
            leaderImage: board.leader.imageUrl,
            leaderPower: board.leader.power,
            life: board.lifeCount,
            characters: board.characters,
            activeDon: board.activeDon,
            restedDon: board.restedDon,
            attachedDon: board.attachedDon,
            donDeckCount: board.donDeckCount,
            handCount: board.handCount,
            deckCount: board.deckCount,
            trashCount: board.trashCount,
            rested: board.leader.rested,
          },
          opponentLife: board.lifeCount,
          opponentPower: board.leader.power + (board.leader.attachedDon * 1000),
        }));
      },

      onTurnEnd: (payload) => {
        simAudio.playPhaseDing();
        setGameState((prev) => {
          let attachedRecovered = 0;
          const leader = prev.leader
            ? {
                ...prev.leader,
                rested: false,
                attachedDon: 0,
                customPowerModifier: 0,
                canAttackThisTurn: true,
              }
            : null;
          if (prev.leader?.attachedDon) attachedRecovered += prev.leader.attachedDon;

          const characters = prev.characters.map((c) => {
            attachedRecovered += c.attachedDon;
            return {
              ...c,
              rested: false,
              attachedDon: 0,
              customPowerModifier: 0,
              canAttackThisTurn: true,
            };
          });

          let totalActiveDon = prev.activeDon + prev.restedDon + attachedRecovered;
          let donDeckRemaining = prev.donDeckCount;
          const maxCanAdd = Math.min(2, 10 - totalActiveDon, donDeckRemaining);
          if (maxCanAdd > 0) {
            donDeckRemaining -= maxCanAdd;
            totalActiveDon += maxCanAdd;
          }

          let deck = [...prev.deck];
          let hand = [...prev.hand];
          if (deck.length > 0) {
            const drawn = deck.shift()!;
            hand.push(drawn);
          }

          const nextTurn = payload.nextTurnNumber || prev.turn + 1;
          const nextState: SimGameState = {
            ...prev,
            turn: nextTurn,
            isOpponentTurn: false,
            phase: 'MAIN',
            leader,
            characters,
            deck,
            hand,
            activeDon: totalActiveDon,
            restedDon: 0,
            donDeckCount: donDeckRemaining,
            logs: [
              ...prev.logs,
              createLog(`🔔 Turn ${nextTurn}: Your turn! Refreshed cards, drew 1 card, gained +${maxCanAdd} DON!!`, 'phase'),
            ],
          };

          setTimeout(() => syncMyBoardState(nextState), 50);
          return nextState;
        });
      },

      onAttackDeclared: (payload) => {
        simAudio.playAttackSlash();
        setGameState((prev) => {
          const targetCard =
            payload.targetType === 'character' && payload.targetCharId
              ? prev.characters.find((c) => c.instanceId === payload.targetCharId)
              : null;

          const targetPower = targetCard
            ? (targetCard.power || 0) + targetCard.attachedDon * 1000
            : (prev.leader?.power || 5000) + (prev.leader?.attachedDon || 0) * 1000;

          const targetName = targetCard ? targetCard.name : (prev.leader?.name || 'Leader');
          const targetImageUrl = targetCard?.imageUrl || prev.leader?.imageUrl;

          const hasActiveBlockers = prev.characters.some(
            (c) => c.hasBlocker && !c.rested && c.instanceId !== payload.targetCharId
          );

          const combat: PendingCombat = {
            attackerInstanceId: payload.attackerId,
            attackerName: payload.attackerName,
            attackerImageUrl: payload.attackerImageUrl,
            attackerPower: payload.attackerPower,
            attackerIsPlayer: false,
            targetType: payload.targetType,
            targetInstanceId: payload.targetCharId,
            targetName,
            targetImageUrl,
            targetPower,
            currentBoost: 0,
            step: hasActiveBlockers ? 'BLOCK_STEP' : 'COUNTER_STEP',
            canBlock: hasActiveBlockers,
            canCounter: true,
          };

          return {
            ...prev,
            pendingCombat: combat,
            logs: [
              ...prev.logs,
              createLog(`⚔️ Opponent declared attack with ${payload.attackerName} (${payload.attackerPower} Power) against ${targetName}!`, 'combat'),
            ],
          };
        });
      },

      onBlockerActivated: (payload) => {
        simAudio.playBlockerDefend();
        setGameState((prev) => {
          if (!prev.pendingCombat) return prev;
          return {
            ...prev,
            pendingCombat: {
              ...prev.pendingCombat,
              targetName: `[Blocked by] ${payload.blockerName}`,
              targetPower: payload.blockerPower,
            },
            logs: [
              ...prev.logs,
              createLog(`🛡️ Opponent intercepted with Blocker ${payload.blockerName} (${payload.blockerPower} Power)!`, 'combat'),
            ],
          };
        });
      },

      onCounterPlayed: (payload) => {
        simAudio.playCounterBoost();
        setGameState((prev) => {
          if (!prev.pendingCombat) return prev;
          const newBoost = prev.pendingCombat.currentBoost + payload.counterBoost;
          return {
            ...prev,
            pendingCombat: {
              ...prev.pendingCombat,
              currentBoost: newBoost,
            },
            logs: [
              ...prev.logs,
              createLog(`⚡ Opponent used ${payload.cardName} (+${payload.counterBoost} Counter)! Boost: +${newBoost}`, 'combat'),
            ],
          };
        });
      },

      onCombatResolved: (payload) => {
        setGameState((prev) => {
          if (payload.outcome === 'repelled') {
            simAudio.playShieldDefend();
          } else if (payload.isFatal) {
            simAudio.playVictory();
          } else {
            simAudio.playAttackSlash();
          }

          const nextWinner = payload.isFatal ? 'player' : prev.winner;
          return {
            ...prev,
            pendingCombat: null,
            winner: nextWinner,
            logs: [
              ...prev.logs,
              createLog(
                payload.outcome === 'repelled'
                  ? `🛡️ Opponent repelled your attack on ${payload.targetHitName}!`
                  : payload.isFatal
                  ? `🏆 VICTORY! Fatal blow landed on opponent! YOU WON THE MATCH!`
                  : `💥 Direct hit on opponent's ${payload.targetHitName}! Opponent Life: ${payload.lifeRemaining}`,
                'combat'
              ),
            ],
          };
        });
      },

      onEmote: (text) => {
        simAudio.playCardPlay();
        setGameState((prev) => ({
          ...prev,
          logs: [
            ...prev.logs,
            createLog(`💬 Opponent: "${text}"`, 'system'),
          ],
        }));
      },
    });

    // Send initial handshake (isReply: false)
    setTimeout(() => {
      setGameState((current) => {
        if (current.leader) {
          simMultiplayer.broadcastHandshake({
            isHost,
            deckName: chosenDeck.name,
            leader: current.leader,
            deckCount: current.deck.length,
            lifeCount: current.life.length,
            handCount: current.hand.length,
            activeDon: current.activeDon,
            isReply: false,
          });
        }
        return current;
      });
    }, 400);
  };

  // Auto-connect if initialMultiplayerRoom was passed (guarded to only connect once)
  useEffect(() => {
    if (initialMultiplayerRoom?.roomId && connectedRoomIdRef.current !== initialMultiplayerRoom.roomId) {
      connectedRoomIdRef.current = initialMultiplayerRoom.roomId;
      handleConnectMultiplayerRoom(initialMultiplayerRoom.roomId, initialMultiplayerRoom.isHost);
    }
    return () => {
      connectedRoomIdRef.current = null;
      simMultiplayer.leaveRoom();
    };
  }, [initialMultiplayerRoom?.roomId, initialMultiplayerRoom?.isHost]);

  // Turn advance (Multiplayer peer handoff OR Sequenced Animated AI progression)
  const handleNextTurn = async () => {
    if (activeMultiplayerRoom) {
      if (gameState.isOpponentTurn || isActionRunningRef.current) return;
      setSelectedDonCount(0);
      setSelectedAttacker(null);
      setSelectedHandCard(null);
      setSelectedFieldCard(null);

      const nextTurn = gameState.turn + 1;
      simAudio.playPhaseDing();
      simMultiplayer.broadcastTurnEnd(nextTurn);
      triggerTurnBanner(nextTurn, false, gameState.opponent.name);
      setGameState((prev) => ({
        ...prev,
        isOpponentTurn: true,
        logs: [
          ...prev.logs,
          createLog(`⌛ Ended turn. Waiting for opponent to play Turn ${nextTurn}...`, 'phase'),
        ],
      }));
      return;
    }

    if (isAiThinking || isActionRunningRef.current) return;
    setSelectedDonCount(0);
    setSelectedAttacker(null);
    setSelectedHandCard(null);
    setSelectedFieldCard(null);

    isActionRunningRef.current = true;
    setIsAiThinking(true);

    try {
      if (animSpeed === 'instant') {
        setGameState((prev) => advanceNextTurn(prev));
        return;
      }

      // Step 0: Opponent Turn Banner
      await triggerTurnBanner(gameState.turn, false, gameState.opponent.name);
      await waitAnimation(400, animSpeed);

      // Step 1: Opponent Refresh & Draw
      let currentState = gameState;
      const step1 = executeOpponentRefreshAndDraw(currentState);
      currentState = step1.nextState;
      setGameState(currentState);
      simAudio.playCardPlay();
      spawnPowerPopup('+1 DRAW', 'purple', 50, 15);
      await waitAnimation(450, animSpeed);

      // Step 2: Opponent Summon
      const step2 = executeOpponentSummon(currentState);
      if (step2.playedCard) {
        currentState = step2.nextState;
        setGameState(currentState);
        simAudio.playCardPlay();
        spawnPowerPopup(`PLAY: ${step2.playedCard.name}`, 'emerald', 50, 26);
        await waitAnimation(500, animSpeed);
      }

      // Step 3: Opponent Attach DON
      const step3 = executeOpponentAttachDon(currentState);
      if (step3.donAttached) {
        currentState = step3.nextState;
        setGameState(currentState);
        simAudio.playDonAttach();
        spawnPowerPopup(`+${step3.donAttached * 1000} ATK`, 'amber', 50, 22);
        await waitAnimation(450, animSpeed);
      }

      // Step 4: Opponent Attack
      const step4 = executeOpponentAttack(currentState);
      if (step4.attackDeclared) {
        currentState = step4.nextState;
        setGameState(currentState);
        simAudio.playAttackSlash();
        await triggerAttackVisual(50, 25, 50, 75, step4.attackerName || 'Opponent', step4.targetName || 'Player');

        // If attack triggered player defense (Blocker/Counter) or Trigger or Winner, yield control to player!
        if (currentState.pendingCombat || currentState.pendingTrigger || currentState.winner) {
          return;
        }
      }

      // Step 5: Transition back to Player Turn
      const step5 = executePlayerStartTurn(currentState);
      currentState = step5.nextState;
      setGameState(currentState);
      simAudio.playDonAttach();
      await triggerTurnBanner(currentState.turn, true, 'YOU');
      spawnPowerPopup(`+${step5.donAdded} DON!!`, 'amber', 50, 85);
    } finally {
      setIsAiThinking(false);
      isActionRunningRef.current = false;
    }
  };

  // Card Play
  const handlePlayCard = (instanceId: string, replaceSlotIndex?: number) => {
    if (gameState.isOpponentTurn || isActionRunningRef.current) return;
    const card = gameState.hand.find((c) => c.instanceId === instanceId);
    setSelectedDonCount(0);
    setSelectedAttacker(null);
    simAudio.playCardPlay();
    if (card) {
      spawnPowerPopup(`PLAY: ${card.name}`, 'emerald', 50, 60);
    }
    setGameState((prev) => {
      const next = playCardFromHand(prev, instanceId, replaceSlotIndex);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
    setSelectedHandCard(null);
  };

  // Discard / Trash
  const handleDiscardCard = (instanceId: string) => {
    setGameState((prev) => {
      const next = sendCardToTrash(prev, instanceId);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
    setSelectedFieldCard(null);
    setSelectedHandCard(null);
  };

  // Rest / Active toggle
  const handleToggleRest = (instanceId: string) => {
    setGameState((prev) => {
      const next = toggleCardRest(prev, instanceId);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  // DON Attach / Detach
  const handleAttachDon = (instanceId: string, count?: number) => {
    if (isActionRunningRef.current) return;
    const amountToAttach = count ?? (selectedDonCount > 0 ? selectedDonCount : 1);
    simAudio.playDonAttach();
    const target =
      gameState.leader?.instanceId === instanceId
        ? gameState.leader
        : gameState.characters.find((c) => c.instanceId === instanceId);
    if (target) {
      spawnPowerPopup(`+${amountToAttach * 1000} ATK`, 'amber', 50, 65);
    }
    setGameState((prev) => {
      const next = attachDonToCard(prev, instanceId, amountToAttach);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
    setSelectedDonCount(0);
  };

  const handleDetachDon = (instanceId: string) => {
    if (isActionRunningRef.current) return;
    setGameState((prev) => {
      const next = detachDonFromCard(prev, instanceId);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  // Life damage
  const handleTakeLifeDamage = () => {
    if (isActionRunningRef.current) return;
    simAudio.playLifeBreak();
    triggerCombatImpactVisual(15, 60, 'life', '-1 LIFE');
    setGameState((prev) => {
      const next = takeLifeDamage(prev);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  // Opponent Attacks & Damage
  const handleAttackOpponent = async (attackerInstanceId: string) => {
    if (gameState.isOpponentTurn || isActionRunningRef.current) return;
    const isLeaderAttacking = gameState.leader?.instanceId === attackerInstanceId;
    const attacker = isLeaderAttacking
      ? gameState.leader
      : gameState.characters.find((c) => c.instanceId === attackerInstanceId);
    if (!attacker || attacker.rested) return;
    if (attacker.category === 'Character' && !attacker.canAttackThisTurn && !attacker.hasRush) return;

    const attackerName = attacker.name;
    const attackerPower = (attacker.power || 0) + attacker.attachedDon * 1000 + attacker.customPowerModifier;

    simAudio.playAttackSlash();
    await triggerAttackVisual(50, 75, 50, 20, attackerName, gameState.opponent.leaderName || 'Opponent Leader');

    if (activeMultiplayerRoom) {
      if (gameState.turn === 1 && gameState.goingFirst) {
        setGameState((prev) => ({
          ...prev,
          logs: [...prev.logs, createLog(`⚠️ Turn 1 player cannot declare attacks!`, 'combat')],
        }));
        return;
      }

      const updatedLeader = isLeaderAttacking && gameState.leader ? { ...gameState.leader, rested: true } : gameState.leader;
      const updatedChars = gameState.characters.map((c) =>
        c.instanceId === attackerInstanceId ? { ...c, rested: true } : c
      );

      simMultiplayer.broadcastAttackDeclared({
        attackerId: attacker.instanceId,
        attackerName: attacker.name,
        attackerImageUrl: attacker.imageUrl,
        attackerPower,
        targetType: 'leader',
        targetName: gameState.opponent.leaderName || 'Opponent Leader',
        targetPower: gameState.opponent.leaderPower || 5000,
      });

      const nextState: SimGameState = {
        ...gameState,
        leader: updatedLeader,
        characters: updatedChars,
        pendingCombat: {
          attackerInstanceId: attacker.instanceId,
          attackerName: attacker.name,
          attackerImageUrl: attacker.imageUrl,
          attackerPower,
          attackerIsPlayer: true,
          targetType: 'leader',
          targetName: gameState.opponent.leaderName || 'Opponent Leader',
          targetPower: gameState.opponent.leaderPower || 5000,
          currentBoost: 0,
          step: 'BLOCK_STEP',
          canBlock: false,
          canCounter: false,
        },
        logs: [
          ...gameState.logs,
          createLog(`⚔️ Declared attack on ${gameState.opponent.leaderName} with ${attacker.name} (${attackerPower} Power)! Waiting for opponent defense...`, 'combat'),
        ],
      };

      setGameState(nextState);
      setSelectedFieldCard(null);
      setSelectedAttacker(null);
      syncMyBoardState(nextState);
      return;
    }

    // Single Player AI Leader Attack
    setGameState((prev) => {
      const next = attackOpponentLeader(prev, attackerInstanceId);
      if (next.opponent.life < prev.opponent.life) {
        triggerCombatImpactVisual(50, 20, 'life', '-1 LIFE');
      } else if (next.winner === 'player') {
        triggerCombatImpactVisual(50, 20, 'ko', 'FATAL HIT!');
      }
      return next;
    });
    setSelectedFieldCard(null);
    setSelectedAttacker(null);
  };

  const handleAttackOpponentChar = async (attackerInstanceId: string, oppCharId: string) => {
    if (gameState.isOpponentTurn || isActionRunningRef.current) return;
    const isLeaderAttacking = gameState.leader?.instanceId === attackerInstanceId;
    const attacker = isLeaderAttacking
      ? gameState.leader
      : gameState.characters.find((c) => c.instanceId === attackerInstanceId);
    const target = gameState.opponent.characters.find((c) => c.instanceId === oppCharId);
    if (!attacker || !target || attacker.rested || !target.rested) return;
    if (attacker.category === 'Character' && !attacker.canAttackThisTurn && !attacker.hasRush) return;

    const attackerName = attacker.name;
    const targetName = target.name;
    const attackerPower = (attacker.power || 0) + attacker.attachedDon * 1000 + attacker.customPowerModifier;
    const targetPower = (target.power || 0) + target.attachedDon * 1000;

    simAudio.playAttackSlash();
    await triggerAttackVisual(50, 75, 50, 32, attackerName, targetName);

    if (activeMultiplayerRoom) {
      if (gameState.turn === 1 && gameState.goingFirst) {
        setGameState((prev) => ({
          ...prev,
          logs: [...prev.logs, createLog(`⚠️ Turn 1 player cannot declare attacks!`, 'combat')],
        }));
        return;
      }

      const updatedLeader = isLeaderAttacking && gameState.leader ? { ...gameState.leader, rested: true } : gameState.leader;
      const updatedChars = gameState.characters.map((c) =>
        c.instanceId === attackerInstanceId ? { ...c, rested: true } : c
      );

      simMultiplayer.broadcastAttackDeclared({
        attackerId: attacker.instanceId,
        attackerName: attacker.name,
        attackerImageUrl: attacker.imageUrl,
        attackerPower,
        targetType: 'character',
        targetCharId: oppCharId,
        targetName: target.name,
        targetPower,
      });

      const nextState: SimGameState = {
        ...gameState,
        leader: updatedLeader,
        characters: updatedChars,
        pendingCombat: {
          attackerInstanceId: attacker.instanceId,
          attackerName: attacker.name,
          attackerImageUrl: attacker.imageUrl,
          attackerPower,
          attackerIsPlayer: true,
          targetType: 'character',
          targetInstanceId: oppCharId,
          targetName: target.name,
          targetImageUrl: target.imageUrl,
          targetPower,
          currentBoost: 0,
          step: 'BLOCK_STEP',
          canBlock: false,
          canCounter: false,
        },
        logs: [
          ...gameState.logs,
          createLog(`⚔️ Declared attack on ${target.name} with ${attacker.name} (${attackerPower} vs ${targetPower})! Waiting for opponent defense...`, 'combat'),
        ],
      };

      setGameState(nextState);
      setSelectedFieldCard(null);
      setSelectedAttacker(null);
      syncMyBoardState(nextState);
      return;
    }

    // Single Player AI Character Attack
    setGameState((prev) => {
      const next = attackOpponentCharacter(prev, attackerInstanceId, oppCharId);
      if (next.opponent.characters.length < prev.opponent.characters.length) {
        triggerCombatImpactVisual(50, 32, 'ko', 'K.O.!');
      }
      return next;
    });
    setSelectedFieldCard(null);
    setSelectedAttacker(null);
  };

  // Phase 4: Blocker & Counter Defend actions
  const handleActivateBlocker = (blockerInstanceId: string) => {
    simAudio.playBlockerDefend();
    triggerCombatImpactVisual(50, 65, 'guard', 'BLOCKED!');
    if (activeMultiplayerRoom) {
      const blockerCard = gameState.characters.find((c) => c.instanceId === blockerInstanceId);
      if (!blockerCard) return;

      const updatedChars = gameState.characters.map((c) =>
        c.instanceId === blockerInstanceId ? { ...c, rested: true } : c
      );
      const blockerPower = (blockerCard.power || 0) + blockerCard.attachedDon * 1000;

      simMultiplayer.broadcastBlockerActivated({
        blockerId: blockerInstanceId,
        blockerName: blockerCard.name,
        blockerPower,
      });

      setGameState((prev) => {
        if (!prev.pendingCombat) return prev;
        return {
          ...prev,
          characters: updatedChars,
          pendingCombat: {
            ...prev.pendingCombat,
            targetType: 'character',
            targetInstanceId: blockerInstanceId,
            targetName: blockerCard.name,
            targetImageUrl: blockerCard.imageUrl,
            targetPower: blockerPower,
            step: 'COUNTER_STEP',
            blockedBy: blockerCard,
          },
          logs: [
            ...prev.logs,
            createLog(`🛡️ You blocked the attack with ${blockerCard.name} (${blockerPower} Power)!`, 'combat'),
          ],
        };
      });
      syncMyBoardState();
      return;
    }

    setGameState((prev) => activateBlocker(prev, blockerInstanceId));
  };

  const handlePassBlocker = () => {
    if (activeMultiplayerRoom) {
      setGameState((prev) => {
        if (!prev.pendingCombat) return prev;
        return {
          ...prev,
          pendingCombat: {
            ...prev.pendingCombat,
            step: 'COUNTER_STEP',
          },
        };
      });
      return;
    }
    setGameState((prev) => passBlockerStep(prev));
  };

  const handleApplyCounter = (cardInstanceId: string) => {
    simAudio.playCounterBoost();
    const card = gameState.hand.find((c) => c.instanceId === cardInstanceId);
    if (card) {
      const boost = card.counter || 1000;
      spawnPowerPopup(`+${boost} GUARD`, 'cyan', 50, 65);
    }

    if (activeMultiplayerRoom) {
      if (!card) return;
      const boost = card.counter || 1000;

      const updatedHand = gameState.hand.filter((c) => c.instanceId !== cardInstanceId);
      const updatedTrash = [...gameState.trash, card];

      simMultiplayer.broadcastCounterPlayed({
        counterBoost: boost,
        cardName: card.name,
      });

      setGameState((prev) => {
        if (!prev.pendingCombat) return prev;
        const nextBoost = prev.pendingCombat.currentBoost + boost;
        return {
          ...prev,
          hand: updatedHand,
          trash: updatedTrash,
          pendingCombat: {
            ...prev.pendingCombat,
            currentBoost: nextBoost,
            usedCounters: [...(prev.pendingCombat.usedCounters || []), card],
          },
          logs: [
            ...prev.logs,
            createLog(`⚡ Used Counter: ${card.name} (+${boost} Power). Total Boost: +${nextBoost}`, 'combat'),
          ],
        };
      });
      syncMyBoardState();
      return;
    }

    setGameState((prev) => applyCounterFromHand(prev, cardInstanceId));
  };

  const handleResolveCombat = () => {
    if (activeMultiplayerRoom) {
      if (!gameState.pendingCombat) return;
      const combat = gameState.pendingCombat;
      const finalDefenderPower = combat.targetPower + combat.currentBoost;
      const isHit = combat.attackerPower >= finalDefenderPower;

      if (!isHit) {
        simAudio.playShieldDefend();
        triggerCombatImpactVisual(50, 65, 'guard', 'GUARDED!');
        simMultiplayer.broadcastCombatResolved({
          outcome: 'repelled',
          targetHitName: combat.targetName,
          damageTaken: false,
          lifeRemaining: gameState.life.length,
        });

        setGameState((prev) => ({
          ...prev,
          pendingCombat: null,
          logs: [
            ...prev.logs,
            createLog(`🛡️ Successfully repelled ${combat.attackerName}'s attack! (${finalDefenderPower} >= ${combat.attackerPower})`, 'combat'),
          ],
        }));
        syncMyBoardState();
        return;
      }

      // HIT!
      simAudio.playAttackSlash();
      if (combat.targetType === 'character' && combat.targetInstanceId) {
        triggerCombatImpactVisual(50, 65, 'ko', 'K.O.!');
        const targetChar = gameState.characters.find((c) => c.instanceId === combat.targetInstanceId);
        const updatedChars = gameState.characters.filter((c) => c.instanceId !== combat.targetInstanceId);
        const updatedTrash = targetChar ? [...gameState.trash, targetChar] : gameState.trash;

        simMultiplayer.broadcastCombatResolved({
          outcome: 'hit',
          targetHitName: combat.targetName,
          damageTaken: false,
          koCharId: combat.targetInstanceId,
          lifeRemaining: gameState.life.length,
        });

        setGameState((prev) => ({
          ...prev,
          characters: updatedChars,
          trash: updatedTrash,
          pendingCombat: null,
          logs: [
            ...prev.logs,
            createLog(`💥 [K.O.] ${combat.attackerName} (${combat.attackerPower} Power) K.O.'d ${combat.targetName}!`, 'combat'),
          ],
        }));
        syncMyBoardState();
        return;
      }

      // Target is Leader
      if (gameState.life.length === 0) {
        simAudio.playLifeBreak();
        triggerCombatImpactVisual(50, 65, 'ko', 'DEFEAT!');
        simMultiplayer.broadcastCombatResolved({
          outcome: 'hit',
          targetHitName: combat.targetName,
          damageTaken: true,
          lifeRemaining: 0,
          isFatal: true,
        });

        setGameState((prev) => ({
          ...prev,
          pendingCombat: null,
          winner: 'opponent',
          logs: [
            ...prev.logs,
            createLog(`💀 Fatal blow taken! Opponent won the match!`, 'combat'),
          ],
        }));
        syncMyBoardState();
        return;
      }

      // Life damage taken
      simAudio.playLifeBreak();
      triggerCombatImpactVisual(15, 60, 'life', '-1 LIFE');
      const updatedLife = [...gameState.life];
      const takenCard = updatedLife.shift()!;
      const updatedHand = [...gameState.hand, takenCard];
      const hasTrigger = Boolean(takenCard.trigger && takenCard.trigger.trim().length > 0);

      simMultiplayer.broadcastCombatResolved({
        outcome: 'hit',
        targetHitName: combat.targetName,
        damageTaken: true,
        lifeRemaining: updatedLife.length,
        isFatal: false,
      });

      setGameState((prev) => ({
        ...prev,
        life: updatedLife,
        hand: updatedHand,
        pendingCombat: null,
        pendingTrigger: hasTrigger
          ? {
              card: takenCard,
              isPlayer: true,
              effect: takenCard.trigger || 'Trigger Effect',
            }
          : null,
        logs: [
          ...prev.logs,
          createLog(
            `⚔️ Direct hit on Leader! Took 1 damage (Drew ${takenCard.name} from Life. ${updatedLife.length} Life left).`,
            'combat'
          ),
        ],
      }));
      syncMyBoardState();
      return;
    }

    setGameState((prev) => {
      const isOppAttack = prev.pendingCombat && !prev.pendingCombat.attackerIsPlayer;
      const prevLife = prev.life.length;
      const prevOppLife = prev.opponent.life;
      const prevCharsLen = prev.characters.length;
      const prevOppCharsLen = prev.opponent.characters.length;
      const next = resolvePendingCombat(prev);

      if (next.winner === 'player') {
        simAudio.playVictory();
        triggerCombatImpactVisual(50, 20, 'ko', 'FATAL HIT!');
      } else if (next.winner === 'opponent') {
        simAudio.playLifeBreak();
        triggerCombatImpactVisual(50, 75, 'ko', 'DEFEAT!');
      } else {
        if (next.life.length < prevLife) {
          triggerCombatImpactVisual(15, 60, 'life', '-1 LIFE');
        } else if (next.opponent.life < prevOppLife) {
          triggerCombatImpactVisual(50, 20, 'life', '-1 LIFE');
        } else if (next.characters.length < prevCharsLen) {
          triggerCombatImpactVisual(50, 65, 'ko', 'K.O.!');
        } else if (next.opponent.characters.length < prevOppCharsLen) {
          triggerCombatImpactVisual(50, 32, 'ko', 'K.O.!');
        } else {
          triggerCombatImpactVisual(50, 50, 'guard', 'GUARDED!');
        }
      }

      // If this was an opponent attack resolving cleanly with no pending trigger and no winner,
      // start player turn!
      if (isOppAttack && !activeMultiplayerRoom && !next.winner && !next.pendingTrigger) {
        setTimeout(async () => {
          const step5 = executePlayerStartTurn(next);
          simAudio.playDonAttach();
          await triggerTurnBanner(step5.nextState.turn, true, 'YOU');
          spawnPowerPopup(`+${step5.donAdded} DON!!`, 'amber', 50, 85);
          setGameState(step5.nextState);
        }, 400);
      }

      return next;
    });
  };

  // Phase 5: Trigger Handling
  const handleActivateTrigger = () => {
    simAudio.playCounterBoost();
    setGameState((prev) => {
      const isOppTurn = prev.isOpponentTurn;
      const next = activateTriggerEffect(prev);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      } else if (isOppTurn && !next.winner) {
        setTimeout(async () => {
          const step5 = executePlayerStartTurn(next);
          simAudio.playDonAttach();
          await triggerTurnBanner(step5.nextState.turn, true, 'YOU');
          spawnPowerPopup(`+${step5.donAdded} DON!!`, 'amber', 50, 85);
          setGameState(step5.nextState);
        }, 400);
      }
      return next;
    });
  };

  const handleDismissTrigger = () => {
    setGameState((prev) => {
      const isOppTurn = prev.isOpponentTurn;
      const next = dismissTriggerEffect(prev);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      } else if (isOppTurn && !next.winner) {
        setTimeout(async () => {
          const step5 = executePlayerStartTurn(next);
          simAudio.playDonAttach();
          await triggerTurnBanner(step5.nextState.turn, true, 'YOU');
          spawnPowerPopup(`+${step5.donAdded} DON!!`, 'amber', 50, 85);
          setGameState(step5.nextState);
        }, 400);
      }
      return next;
    });
  };

  // Phase 6: Multiplayer Room Handlers
  const handleJoinMultiplayerRoom = (roomId: string, isHost: boolean) => {
    connectedRoomIdRef.current = roomId;
    handleConnectMultiplayerRoom(roomId, isHost);
  };

  const handleLeaveMultiplayerRoom = () => {
    connectedRoomIdRef.current = null;
    simMultiplayer.leaveRoom();
    setActiveMultiplayerRoom(null);
    setIsMultiplayerOpponentConnected(false);
  };

  // Switch opponent deck
  const handleSelectOpponentDeck = (deck: RecommendedDeck) => {
    setGameState((prev) => switchOpponent(prev, deck));
    setShowOpponentSelector(false);
  };

  // Mulligan controls
  const handleMulligan = () => {
    simAudio.playCardPlay();
    setGameState((prev) => {
      const next = performMulligan(prev);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  const handleKeepHand = () => {
    setGameState((prev) => {
      const next = keepInitialHand(prev);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  // Automated Searcher controls
  const handleSelectSearcherCard = (instanceId: string) => {
    setGameState((prev) => {
      const next = resolveSearcherSelection(prev, instanceId);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  const handlePassSearcher = () => {
    setGameState((prev) => {
      const next = resolveSearcherPass(prev);
      if (activeMultiplayerRoom) {
        setTimeout(() => syncMyBoardState(next), 30);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Sub-renderers matching the exact OPlayTCG mobile reference layout (media_1791809778343)
  // ---------------------------------------------------------------------------
  const renderOpponentPlaymat = (isLandscapeMode: boolean = false) => (
    <div
      className={`w-full rounded-2xl border-2 border-[#1c2d4a] bg-[#0b1628] ${
        isLandscapeMode ? 'p-1 gap-1' : 'p-1 sm:p-1.5 gap-1'
      } shadow-xl flex flex-row items-stretch justify-between flex-1 min-h-0 overflow-hidden transition-all ${
        highlightTarget === 'opponent' ? spotlightClass : ''
      }`}
    >
      {/* LEFT / MAIN BATTLEFIELD SECTION */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-0.5 sm:gap-1 py-0.5">
        {/* Top Row: TRASH (Left) & COST AREA (Center/Right) */}
        <div className="flex items-center gap-1 sm:gap-1.5 w-full shrink-0">
          {/* Trash Slot */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">TRASH</span>
            <div className={`${isLandscapeMode ? 'h-[clamp(28px,7.5vh,36px)] w-auto' : 'h-[clamp(28px,4.2vh,36px)] w-auto'} aspect-[2.5/3.5] rounded-lg border border-dashed border-blue-900/60 bg-[#070e1a]/60 flex items-center justify-center text-gray-400`}>
              <span className="text-[9px] sm:text-xs font-mono font-bold">{gameState.opponent.trashCount}</span>
            </div>
          </div>

          {/* Cost Area with upright DON cards */}
          <div className={`flex-1 rounded-xl border border-blue-900/60 bg-[#070e1a]/85 ${
            isLandscapeMode ? 'p-0.5 min-h-0' : 'p-0.5 sm:p-1 min-h-0'
          } flex flex-col justify-between shadow-inner`}>
            <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-400">
              <span>COST AREA</span>
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-0.5 overflow-x-auto max-w-full px-0.5 scrollbar-none">
              {Array.from({ length: gameState.opponent.activeDon }).map((_, idx) => (
                <div key={`opp-don-${idx}`} className={`${isLandscapeMode ? 'h-[clamp(18px,4.8vh,24px)]' : 'h-[clamp(22px,3.4vh,28px)]'} aspect-[2.5/3.5] rounded-xs overflow-hidden border border-black/80 shadow-md shrink-0`}>
                  <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-1.5 py-0.2 rounded-md bg-black/80 border border-white/10 w-fit text-[7px] sm:text-[8px] font-mono text-gray-300">
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
            <div className={`${isLandscapeMode ? 'h-[clamp(32px,8.5vh,42px)] w-auto' : 'h-[clamp(34px,5vh,44px)] w-auto'} aspect-[2.5/3.5] rounded-lg border border-blue-900/60 bg-[#070e1a]/60 overflow-hidden relative shadow-md`}>
              <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Opponent Deck" className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/85 text-white font-mono text-[7.5px] sm:text-[8.5px] font-bold flex items-center justify-center border border-white/20">
                {gameState.opponent.deckCount}
              </div>
            </div>
            <div className={`${isLandscapeMode ? 'h-[clamp(32px,8.5vh,42px)] w-auto' : 'h-[clamp(34px,5vh,44px)] w-auto'} aspect-[2.5/3.5] rounded-lg border border-dashed border-blue-900/40 bg-[#070e1a]/40 flex items-center justify-center text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-500`}>
              STAGE
            </div>
          </div>

          {/* Opponent Leader Card - Responsive & Command Center */}
          {(() => {
            const oppLeaderCard: SimCard = {
              instanceId: 'opp-leader-inspect',
              cardId: gameState.opponent.leaderId,
              name: gameState.opponent.leaderName,
              category: 'Leader',
              colors: ['Purple'],
              cost: 0,
              power: gameState.opponent.leaderPower,
              counter: null,
              imageUrl: gameState.opponent.leaderImage,
              effect: '[Activate: Main] [Once Per Turn] DON!! -7: Trash 1 of your opponent\'s Life cards.',
              rested: gameState.opponent.rested,
              attachedDon: gameState.opponent.attachedDon,
              customPowerModifier: 0,
            };
            return (
              <div
                onTouchStart={() => startLongPress(oppLeaderCard)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onMouseDown={() => startLongPress(oppLeaderCard)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onContextMenu={(e) => handleContextMenu(e, oppLeaderCard)}
                onClick={() => {
                  if (isLongPressTriggeredRef.current) return;
                  if (selectedAttacker) {
                    handleAttackOpponent(selectedAttacker.instanceId);
                  } else if (selectedFieldCard) {
                    handleAttackOpponent(selectedFieldCard.instanceId);
                  } else if (gameState.leader && canCardAttack(gameState.leader)) {
                    handleAttackOpponent(gameState.leader.instanceId);
                  }
                }}
                className={`sim-card-interactive select-none ${
                  isLandscapeMode
                    ? 'h-[clamp(38px,9.8vh,48px)] w-auto'
                    : 'h-[clamp(50px,7.5vh,64px)] w-auto'
                } aspect-[2.5/3.5] rounded-xl border-2 overflow-hidden relative shadow-lg cursor-pointer transition group mx-auto ${
                  selectedAttacker
                    ? 'border-rose-500 ring-4 ring-rose-500 ring-offset-2 ring-offset-black animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.95)] scale-105 z-20'
                    : 'border-red-500/80 hover:scale-102'
                } ${oppLeaderCard.rested ? 'rotate-90 scale-[0.714] opacity-80' : ''} ${highlightTarget === 'opponent' ? spotlightClass : ''}`}
                title={`Hold / Long-press to inspect. ${gameState.opponent.leaderName} (${gameState.opponent.leaderPower} Power)`}
              >
                <img
                  src={gameState.opponent.leaderImage}
                  alt={gameState.opponent.leaderName}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleCardImageError(e, gameState.opponent.leaderId, gameState.opponent.leaderImage)}
                />
                {selectedAttacker && (
                  <div className="absolute inset-0 bg-rose-950/75 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-0.5 text-center animate-fadeIn z-10">
                    <div className="w-5 h-5 rounded-full border-2 border-rose-400 border-dashed animate-spin flex items-center justify-center mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    </div>
                    <span className="text-[7.5px] sm:text-[9px] font-black text-rose-200 uppercase tracking-wider drop-shadow">
                      STRIKE
                    </span>
                    <span className="text-[6.5px] sm:text-[7.5px] font-mono text-amber-300 font-bold">
                      {(selectedAttacker?.power || 0) + (selectedAttacker?.attachedDon || 0) * 1000} vs {gameState.opponent.leaderPower}
                    </span>
                  </div>
                )}
                {!selectedAttacker && selectedFieldCard && (
                  <div className="absolute inset-0 bg-red-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="text-[8px] sm:text-[9.5px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded uppercase shadow">
                      ATTACK
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Bottom Row: CHARACTER AREA (5 card slots across) */}
        <div className="w-full shrink-0">
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
            CHARACTER AREA
          </span>
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full items-center justify-items-center">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const oppChar = gameState.opponent.characters[slotIdx];
              if (oppChar) {
                const canAttackThisChar = Boolean(selectedAttacker && oppChar.rested);
                return (
                  <div
                    key={`opp-char-${oppChar.instanceId}`}
                    onTouchStart={() => startLongPress(oppChar)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onMouseDown={() => startLongPress(oppChar)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onContextMenu={(e) => handleContextMenu(e, oppChar)}
                    onClick={() => {
                      if (isLongPressTriggeredRef.current) return;
                      if (selectedAttacker && oppChar.rested) {
                        handleAttackOpponentChar(selectedAttacker.instanceId, oppChar.instanceId);
                      } else if (selectedFieldCard && oppChar.rested) {
                        handleAttackOpponentChar(selectedFieldCard.instanceId, oppChar.instanceId);
                      } else {
                        setInspectedCard(oppChar);
                      }
                    }}
                    className={`sim-card-interactive select-none ${
                      isLandscapeMode
                        ? 'h-[clamp(36px,9.2vh,46px)] w-auto'
                        : 'h-[clamp(44px,6.8vh,58px)] w-auto'
                    } aspect-[2.5/3.5] rounded-lg sm:rounded-xl overflow-hidden relative shadow-md cursor-pointer transition ${
                      canAttackThisChar
                        ? 'border-2 border-rose-500 ring-3 ring-rose-500 ring-offset-1 ring-offset-black animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.9)] scale-105 z-20'
                        : selectedAttacker && !oppChar.rested
                        ? 'opacity-40 border border-white/10'
                        : oppChar.rested
                        ? 'rotate-90 scale-[0.714] opacity-80 border-2 border-amber-500'
                        : 'border border-white/20 hover:border-white/40'
                    }`}
                    title={
                      canAttackThisChar
                        ? `Click to attack rested ${oppChar.name} (${oppChar.power} Power)`
                        : `Hold / Long-press to inspect. ${oppChar.name}`
                    }
                  >
                    <img
                      src={oppChar.imageUrl}
                      alt={oppChar.name}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleCardImageError(e, oppChar.cardId, oppChar.imageUrl)}
                    />
                    {canAttackThisChar && selectedAttacker && (
                      <div className="absolute inset-0 bg-rose-950/75 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-0.5 text-center animate-fadeIn z-10">
                        <span className="text-[7px] sm:text-[8px] font-black text-rose-200 uppercase drop-shadow">
                          K.O.
                        </span>
                        <span className="text-[6px] sm:text-[7px] font-mono text-amber-300 font-bold">
                          {(selectedAttacker.power || 0) + (selectedAttacker.attachedDon || 0) * 1000} vs {oppChar.power}
                        </span>
                      </div>
                    )}
                    {oppChar.rested && !canAttackThisChar && (
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
                  className={`${
                    isLandscapeMode
                      ? 'h-[clamp(36px,9.2vh,46px)] w-auto'
                      : 'h-[clamp(44px,6.8vh,58px)] w-auto'
                  } aspect-[2.5/3.5] rounded-lg border border-dashed border-blue-900/40 bg-[#070e1a]/40`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: DON!! DECK (Top) & LIFE STACK (Bottom) */}
      <div className={`${isLandscapeMode ? 'w-8 sm:w-9' : 'w-10 sm:w-11 md:w-12'} shrink-0 flex flex-col justify-between items-center gap-1 py-0.5 overflow-hidden`}>
        {/* DON!! Deck Slot */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-400 mb-0.5 text-center leading-tight">DON!!</span>
          <div className={`${isLandscapeMode ? 'w-6 sm:w-6.5' : 'w-7 sm:w-8'} aspect-[2.5/3.5] rounded-lg overflow-hidden border border-blue-900/60 relative shadow-md bg-black/30`}>
            <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-black/85 text-white font-mono text-[7px] sm:text-[8px] font-bold flex items-center justify-center border border-white/20">
              {gameState.opponent.donDeckCount}
            </div>
          </div>
        </div>

        {/* Opponent Life Stack Container */}
        <div className={`rounded-xl border border-rose-900/80 bg-rose-950/25 px-1 py-0.5 flex flex-col items-center w-full shadow-inner select-none ${
          isLandscapeMode ? 'max-h-[64px] sm:max-h-[74px]' : 'max-h-[68px] sm:max-h-[80px]'
        } overflow-hidden shrink-0`}>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-rose-400 tracking-wider mb-0.5 text-center whitespace-nowrap">
            LIFE · {gameState.opponent.life}
          </span>
          <div className={`relative flex flex-col ${isLandscapeMode ? '-space-y-6 sm:-space-y-6.5' : '-space-y-7.5 sm:-space-y-8'} pt-0.5 items-center`}>
            {Array.from({ length: Math.min(5, gameState.opponent.life) }).map((_, idx) => (
              <div
                key={`opp-life-${idx}`}
                className={`${isLandscapeMode ? 'w-6 sm:w-6.5' : 'w-7 sm:w-8'} aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shadow-md shrink-0`}
              >
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
              </div>
            ))}
            {gameState.opponent.life === 0 && (
              <div className={`${isLandscapeMode ? 'w-6 sm:w-6.5' : 'w-7 sm:w-8'} aspect-[2.5/3.5] rounded-md border border-dashed border-red-500/50 flex items-center justify-center text-[8px] text-red-400 font-black text-center`}>
                0
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlayerPlaymat = (isLandscapeMode: boolean = false) => (
    <div
      className={`w-full rounded-2xl border-2 border-[#153424] bg-[#091812] ${
        isLandscapeMode ? 'p-1 gap-1' : 'p-1 sm:p-1.5 gap-1'
      } shadow-xl flex flex-row items-stretch justify-between flex-1 min-h-0 overflow-hidden transition-all`}
    >
      {/* LEFT COLUMN: LIFE STACK (Top) & DON!! DECK (Bottom) */}
      <div className={`${isLandscapeMode ? 'w-8 sm:w-9' : 'w-9 sm:w-10 md:w-11'} shrink-0 flex flex-col justify-between items-center gap-1 py-0.5 overflow-hidden`}>
        {/* Player Life Stack Container */}
        <div
          className={`rounded-xl border border-rose-900/80 bg-rose-950/25 px-1 py-0.5 flex flex-col items-center w-full transition shadow-inner select-none ${
            isLandscapeMode ? 'max-h-[64px] sm:max-h-[74px]' : 'max-h-[68px] sm:max-h-[80px]'
          } overflow-hidden shrink-0 ${
            highlightTarget === 'life' ? spotlightClass : ''
          }`}
          title={`Player Life: ${gameState.life.length} cards remaining`}
        >
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-rose-400 tracking-wider mb-0.5 text-center whitespace-nowrap">
            LIFE · {gameState.life.length}
          </span>
          <div className={`relative flex flex-col ${isLandscapeMode ? '-space-y-6 sm:-space-y-6.5' : '-space-y-7.5 sm:-space-y-8'} pt-0.5 items-center`}>
            {gameState.life.map((card, idx) => (
              <div
                key={`player-life-${card.instanceId}-${idx}`}
                className={`${isLandscapeMode ? 'w-6 sm:w-6.5' : 'w-7 sm:w-8'} aspect-[2.5/3.5] rounded-md overflow-hidden border border-white/10 shadow-md shrink-0`}
              >
                <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Life" className="w-full h-full object-cover" />
              </div>
            ))}
            {gameState.life.length === 0 && (
              <div className={`${isLandscapeMode ? 'w-6 sm:w-6.5' : 'w-7 sm:w-8'} aspect-[2.5/3.5] rounded-md border border-dashed border-red-500/50 flex items-center justify-center text-[8px] text-red-400 font-black text-center`}>
                0
              </div>
            )}
          </div>
        </div>

        {/* DON!! Deck Slot */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-emerald-400/80 mb-0.5 text-center leading-tight">DON!!</span>
          <div className={`${isLandscapeMode ? 'w-6 sm:w-6.5' : 'w-7 sm:w-8'} aspect-[2.5/3.5] rounded-xl overflow-hidden border border-emerald-900/60 relative shadow-md bg-black/30`}>
            <img src={OPCG_DON_DECK_DATA_URL} alt="DON Deck" className="w-full h-full object-cover" />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-black/85 text-white font-mono text-[7px] sm:text-[8px] font-bold flex items-center justify-center border border-white/20">
              {gameState.donDeckCount}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT / MAIN BATTLEFIELD SECTION */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-0.5 sm:gap-1 py-0.5">
        {/* Top Row: CHARACTER AREA (5 card slots across) */}
        <div className="w-full shrink-0">
          <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-emerald-400/80 block mb-0.5">
            CHARACTER AREA
          </span>
          <div
            className={`grid grid-cols-5 gap-1 sm:gap-1.5 w-full items-center justify-items-center rounded-lg p-0.5 transition-all ${
              highlightTarget === 'characters' ? spotlightClass : ''
            }`}
          >
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const card = gameState.characters[slotIdx];
              if (card) {
                const isThisAttacking = liveAttackerCard?.instanceId === card.instanceId;
                const canAttack = canCardAttack(card);
                return (
                  <div
                    key={card.instanceId}
                    onTouchStart={() => startLongPress(card)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onMouseDown={() => startLongPress(card)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onContextMenu={(e) => handleContextMenu(e, card)}
                    onClick={() => {
                      if (isLongPressTriggeredRef.current) return;
                      // If a hand card is selected and can afford to summon/replace:
                      if (
                        selectedHandCard &&
                        selectedHandCard.category === 'Character' &&
                        gameState.activeDon >= (selectedHandCard.cost || 0)
                      ) {
                        handlePlayCard(selectedHandCard.instanceId, slotIdx);
                        return;
                      }
                      if (selectedDonCount > 0) {
                        handleAttachDon(card.instanceId, selectedDonCount);
                        return;
                      }
                      if (isThisAttacking) {
                        setSelectedAttacker(null);
                        return;
                      }
                      if (canAttack) {
                        setSelectedAttacker(card);
                        setSelectedFieldCard(null);
                        return;
                      }
                      setSelectedFieldCard(card);
                      setSelectedAttacker(null);
                    }}
                    className={`sim-card-interactive select-none ${
                      isLandscapeMode
                        ? 'h-[clamp(36px,9.2vh,46px)] w-auto'
                        : 'w-full max-w-[62px] sm:max-w-[72px] md:max-w-[84px] aspect-[2.5/3.5] h-auto max-h-[86px] sm:max-h-[98px]'
                    } aspect-[2.5/3.5] rounded-lg sm:rounded-xl overflow-hidden relative shadow-md cursor-pointer transition ${
                      selectedDonCount > 0
                        ? 'border-2 border-amber-400 ring-3 ring-amber-400 ring-offset-1 ring-offset-black animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-105 z-20'
                        : isThisAttacking
                        ? 'border-2 border-rose-500 ring-4 ring-rose-500 ring-offset-1 ring-offset-black animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.95)] scale-105 z-20'
                        : selectedHandCard &&
                          selectedHandCard.category === 'Character' &&
                          gameState.activeDon >= (selectedHandCard.cost || 0) &&
                          gameState.characters.length >= 5
                        ? 'border-2 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse scale-105 z-20'
                        : card.rested
                        ? 'rotate-90 scale-[0.714] opacity-80 border-2 border-amber-500'
                        : 'border border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.4)] hover:border-cyan-300'
                    }`}
                    title={
                      selectedDonCount > 0
                        ? `Click to attach ${selectedDonCount} DON (+${selectedDonCount * 1000} Power)`
                        : selectedHandCard &&
                          selectedHandCard.category === 'Character' &&
                          gameState.activeDon >= (selectedHandCard.cost || 0) &&
                          gameState.characters.length >= 5
                        ? `Click to replace this character with ${selectedHandCard.name}`
                        : isThisAttacking
                        ? 'Attacker selected - Click enemy target or click here to cancel'
                        : canAttack
                        ? `Click to declare attack with ${card.name} (${(card.power || 0) + card.attachedDon * 1000} Power)`
                        : `Hold / Long-press to inspect. ${card.name}`
                    }
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
                    />
                    {selectedDonCount > 0 && (
                      <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center p-0.5 pointer-events-none z-10">
                        <span className="px-1 py-0.2 rounded-full bg-amber-400 text-black font-black text-[6.5px] sm:text-[7.5px] shadow-lg animate-bounce">
                          +{selectedDonCount * 1000}
                        </span>
                      </div>
                    )}
                    {selectedHandCard &&
                      selectedHandCard.category === 'Character' &&
                      gameState.activeDon >= (selectedHandCard.cost || 0) &&
                      gameState.characters.length >= 5 && (
                        <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-0.5 pointer-events-none z-10 animate-fadeIn">
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[6.5px] sm:text-[7.5px] shadow-lg animate-bounce">
                            REPLACE
                          </span>
                        </div>
                      )}
                    {isThisAttacking && (
                      <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[0.5px] flex flex-col items-center justify-between p-0.5 pointer-events-none z-10 animate-fadeIn">
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-black text-[6.5px] sm:text-[7.5px] shadow-lg animate-bounce flex items-center gap-0.5">
                          <Swords className="w-2 h-2" />
                          <span>ATTACK</span>
                        </span>
                        <span className="text-[6px] font-bold text-amber-200 drop-shadow">
                          {(card.power || 0) + card.attachedDon * 1000} ATK
                        </span>
                      </div>
                    )}

                    {card.attachedDon > 0 && (
                      <div className="absolute bottom-0.5 inset-x-0.5 py-0.2 bg-[#d97706] text-white text-[6.5px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5 z-10">
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

              const canSummonHere = Boolean(
                selectedHandCard &&
                selectedHandCard.category === 'Character' &&
                gameState.activeDon >= (selectedHandCard.cost || 0)
              );

              return (
                <div
                  key={`player-char-slot-${slotIdx}`}
                  onClick={() => {
                    if (canSummonHere && selectedHandCard) {
                      handlePlayCard(selectedHandCard.instanceId, slotIdx);
                    }
                  }}
                  className={`${
                    isLandscapeMode
                      ? 'h-[clamp(36px,9.2vh,46px)] w-auto'
                      : 'w-full max-w-[62px] sm:max-w-[72px] md:max-w-[84px] aspect-[2.5/3.5] h-auto max-h-[86px] sm:max-h-[98px]'
                  } aspect-[2.5/3.5] rounded-lg sm:rounded-xl transition flex flex-col items-center justify-center p-0.5 text-center ${
                    canSummonHere
                      ? 'border-2 border-dashed border-emerald-400 bg-emerald-500/25 shadow-[0_0_20px_rgba(52,211,153,0.6)] animate-pulse cursor-pointer hover:bg-emerald-500/35 active:scale-95 z-20'
                      : 'border border-dashed border-emerald-900/40 bg-[#05110d]/40'
                  }`}
                  title={canSummonHere ? `Click to summon ${selectedHandCard?.name} here (${selectedHandCard?.cost} DON)` : undefined}
                >
                  {canSummonHere && (
                    <div className="flex flex-col items-center gap-0.5 pointer-events-none animate-fadeIn">
                      <span className="text-[7.5px] sm:text-[8.5px] font-black text-emerald-300 uppercase tracking-wider">
                        + PLAY
                      </span>
                      <span className="text-[6px] sm:text-[7px] font-mono font-bold text-emerald-200">
                        {selectedHandCard?.cost} DON
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Row: LEADER CARD (Center/Left) | STAGE & DECK (Right) */}
        <div className="flex items-center justify-between gap-1.5 w-full my-auto shrink-0">
          {/* Player Leader Card - Balanced scale matching opponent leader */}
          <div className="flex flex-col items-center mx-auto">
            {gameState.leader && (
              <div
                onTouchStart={() => gameState.leader && startLongPress(gameState.leader)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onMouseDown={() => gameState.leader && startLongPress(gameState.leader)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onContextMenu={(e) => gameState.leader && handleContextMenu(e, gameState.leader)}
                onClick={() => {
                  if (isLongPressTriggeredRef.current) return;
                  if (!gameState.leader) return;
                  if (selectedDonCount > 0) {
                    handleAttachDon(gameState.leader.instanceId, selectedDonCount);
                    return;
                  }
                  if (liveAttackerCard?.instanceId === gameState.leader.instanceId) {
                    setSelectedAttacker(null);
                    return;
                  }
                  if (canCardAttack(gameState.leader)) {
                    setSelectedAttacker(gameState.leader);
                    setSelectedFieldCard(null);
                    return;
                  }
                  setSelectedFieldCard(gameState.leader);
                  setSelectedAttacker(null);
                }}
                className={`sim-card-interactive select-none ${
                  isLandscapeMode
                    ? 'h-[clamp(38px,9.8vh,48px)] w-auto'
                    : 'h-[clamp(50px,7.5vh,64px)] w-auto'
                } aspect-[2.5/3.5] rounded-xl border-2 overflow-hidden relative shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer hover:border-cyan-300 transition ${
                  selectedDonCount > 0
                    ? 'border-amber-400 ring-4 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.9)] scale-105 z-20'
                    : liveAttackerCard?.instanceId === gameState.leader.instanceId
                    ? 'border-rose-500 ring-4 ring-rose-500 ring-offset-2 ring-offset-black animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.95)] scale-105 z-20'
                    : 'border-cyan-400'
                } ${
                  gameState.leader.rested ? 'rotate-90 scale-[0.714] opacity-80' : ''
                } ${highlightTarget === 'leader' ? spotlightClass : ''}`}
                title={
                  selectedDonCount > 0
                    ? `Click to attach ${selectedDonCount} DON (+${selectedDonCount * 1000} Power)`
                    : liveAttackerCard?.instanceId === gameState.leader.instanceId
                    ? 'Attacker selected - Click enemy target or click here to cancel'
                    : canCardAttack(gameState.leader)
                    ? `Click to declare attack with Leader ${gameState.leader.name} (${(gameState.leader.power || 5000) + gameState.leader.attachedDon * 1000} Power)`
                    : `Hold / Long-press to inspect. ${gameState.leader.name}`
                }
              >
                <img
                  src={gameState.leader.imageUrl}
                  alt={gameState.leader.name}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleCardImageError(e, gameState.leader?.cardId, gameState.leader?.imageUrl)}
                />
                {selectedDonCount > 0 && (
                  <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 pointer-events-none z-10">
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-[7.5px] sm:text-[8.5px] shadow-lg animate-bounce">
                      +{selectedDonCount * 1000} ATK
                    </span>
                    <span className="text-[6px] font-bold text-amber-200 mt-0.5 drop-shadow">
                      Tap to attach
                    </span>
                  </div>
                )}
                {liveAttackerCard?.instanceId === gameState.leader.instanceId && (
                  <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[0.5px] flex flex-col items-center justify-between p-1 pointer-events-none z-10 animate-fadeIn">
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[7.5px] sm:text-[8.5px] shadow-lg animate-bounce flex items-center gap-0.5">
                      <Swords className="w-2.5 h-2.5" />
                      <span>ATTACKING</span>
                    </span>
                    <span className="text-[6.5px] font-bold text-amber-200 drop-shadow">
                      {(gameState.leader.power || 5000) + gameState.leader.attachedDon * 1000} ATK
                    </span>
                  </div>
                )}

                {gameState.leader.attachedDon > 0 && (
                  <div className="absolute bottom-0.5 inset-x-0.5 py-0.5 bg-[#d97706] text-white text-[7px] font-bold rounded-sm text-center shadow flex items-center justify-center gap-0.5 z-10">
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
              className={`${
                isLandscapeMode
                  ? 'mt-0.2 px-2 py-0 text-[7px] leading-tight'
                  : 'mt-0.5 px-3 py-0.5 text-[7.5px] sm:text-[9px]'
              } rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-black tracking-wide flex items-center gap-0.5 shadow-md transition active:scale-95`}
            >
              <span>✦ Activate</span>
            </button>
          </div>

          {/* Stage & Deck */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {(() => {
              const canPlayStage = Boolean(
                selectedHandCard &&
                selectedHandCard.category === 'Stage' &&
                gameState.activeDon >= (selectedHandCard.cost || 0)
              );
              return (
                <div
                  onTouchStart={() => gameState.stage && startLongPress(gameState.stage)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseDown={() => gameState.stage && startLongPress(gameState.stage)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onContextMenu={(e) => gameState.stage && handleContextMenu(e, gameState.stage)}
                  onClick={() => {
                    if (isLongPressTriggeredRef.current) return;
                    if (canPlayStage && selectedHandCard) {
                      handlePlayCard(selectedHandCard.instanceId);
                      return;
                    }
                    if (gameState.stage) setSelectedFieldCard(gameState.stage);
                  }}
                  className={`sim-card-interactive select-none ${
                    isLandscapeMode
                      ? 'h-[clamp(32px,8.5vh,42px)] w-auto'
                      : 'h-[clamp(34px,5vh,44px)] w-auto'
                  } aspect-[2.5/3.5] rounded-xl flex items-center justify-center text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-wider overflow-hidden relative cursor-pointer transition ${
                    canPlayStage
                      ? 'border-2 border-dashed border-emerald-400 bg-emerald-500/25 shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-pulse text-emerald-300'
                      : 'border border-dashed border-emerald-900/40 bg-[#05110d]/40 text-gray-500'
                  }`}
                  title={
                    canPlayStage
                      ? `Click to play Stage ${selectedHandCard?.name} (${selectedHandCard?.cost} DON)`
                      : gameState.stage
                      ? `Hold / Long-press to inspect. ${gameState.stage.name}`
                      : undefined
                  }
                >
                  {gameState.stage ? (
                    <img
                      src={gameState.stage.imageUrl}
                      alt={gameState.stage.name}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  ) : canPlayStage ? (
                    <span className="text-emerald-300 font-black text-[7px] leading-tight text-center">+ PLAY STAGE</span>
                  ) : (
                    <span>STAGE</span>
                  )}
                </div>
              );
            })()}
            <div
              className={`${
                isLandscapeMode
                  ? 'h-[clamp(32px,8.5vh,42px)] w-auto'
                  : 'h-[clamp(34px,5vh,44px)] w-auto'
              } aspect-[2.5/3.5] rounded-xl border border-emerald-900/50 bg-[#05110d]/70 overflow-hidden relative shadow-md select-none`}
              title={`Main Deck (${gameState.deck.length} cards remaining)`}
            >
              <img src={OPCG_PURPLE_BACK_DATA_URL} alt="Main Deck" className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/85 text-white font-mono text-[7.5px] sm:text-[8.5px] font-bold flex items-center justify-center border border-white/20">
                {gameState.deck.length}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: COST AREA (Left/Center) & TRASH (Right) */}
        <div className="flex items-center gap-1 sm:gap-1.5 w-full shrink-0 pb-0.5">
          {/* Cost Area with upright DON cards matching reference screenshot */}
          <div
            className={`flex-1 rounded-2xl border-2 border-amber-400/85 bg-[#05110d]/90 ${
              isLandscapeMode ? 'p-0.5 min-h-0' : 'p-0.5 sm:p-1 min-h-0'
            } flex flex-col justify-between shadow-[0_0_12px_rgba(251,191,36,0.25)] transition-all ${
              highlightTarget === 'costArea' ? 'ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.65)]' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-emerald-400/80">
              <span className="flex items-center gap-1">
                <span>COST AREA</span>
                {selectedDonCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-extrabold text-[6.5px] sm:text-[7.5px] animate-pulse">
                    {selectedDonCount} DON (+{selectedDonCount * 1000})
                  </span>
                )}
              </span>
              {selectedDonCount > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDonCount(0);
                  }}
                  className="text-amber-400 hover:text-white text-[7px] sm:text-[8px] font-bold underline"
                >
                  Clear
                </button>
              ) : (
                <span className="text-[6.5px] sm:text-[7px] text-gray-400 normal-case">
                  Tap Nth DON to attach
                </span>
              )}
            </div>

            {/* Upright DON cards row */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-0.5 overflow-x-auto max-w-full px-0.5 scrollbar-none">
              {Array.from({ length: gameState.activeDon }).map((_, idx) => {
                const donNumber = idx + 1;
                const isSelected = selectedDonCount >= donNumber;
                return (
                  <div
                    key={`player-don-${idx}`}
                    onClick={() => {
                      if (liveAttackerCard) {
                        handleAttachDon(liveAttackerCard.instanceId, donNumber);
                        return;
                      }
                      if (selectedFieldCard) {
                        handleAttachDon(selectedFieldCard.instanceId, donNumber);
                        setSelectedFieldCard(null);
                        return;
                      }
                      setSelectedDonCount((prev) => (prev === donNumber ? 0 : donNumber));
                    }}
                    className={`${
                      isLandscapeMode ? 'h-[clamp(18px,4.8vh,24px)]' : 'h-[clamp(22px,3.4vh,28px)]'
                    } aspect-[2.5/3.5] rounded-xs overflow-hidden border shadow-md cursor-pointer transition-all duration-150 relative select-none shrink-0 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400 ring-offset-1 ring-offset-black -translate-y-0.5 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.8)] z-10 brightness-110'
                        : 'border-black/80 hover:scale-102 hover:border-amber-300/60'
                    }`}
                    title={`Click to select ${donNumber} DON (+${donNumber * 1000} Power)`}
                  >
                    <img src={OPCG_DON_CARD_DATA_URL} alt="DON" className="w-full h-full object-cover" />
                    <div
                      className={`absolute top-0.5 left-0.5 px-0.5 py-0.2 rounded-xs font-mono text-[6.5px] sm:text-[7.5px] font-black leading-none ${
                        isSelected
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'bg-black/85 text-gray-300 border border-white/10'
                      }`}
                    >
                      {donNumber}
                    </div>
                  </div>
                );
              })}
              {gameState.activeDon === 0 && (
                <div className={`${isLandscapeMode ? 'h-6' : 'h-7 sm:h-8'} aspect-[2.5/3.5] rounded-xs border border-dashed border-gray-600/50 flex items-center justify-center text-[7.5px] text-gray-500 font-mono`}>
                  0
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 px-1.5 py-0.2 rounded-md bg-black/80 border border-white/10 w-fit text-[7px] sm:text-[8px] font-mono text-gray-200">
                <span className="flex items-center gap-0.5 text-amber-300 font-bold">🪙 {gameState.activeDon}</span>
                <span className="text-gray-500">|</span>
                <span className="flex items-center gap-0.5 text-gray-400 font-bold">🎴 {gameState.restedDon}</span>
              </div>
              {selectedDonCount > 0 && (
                <span className="text-[7px] sm:text-[8px] text-amber-300 font-bold animate-pulse">
                  Tap Leader/Char to attach ➜
                </span>
              )}
            </div>
          </div>

          {/* Trash Slot */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">TRASH</span>
            <div
              onClick={() => setShowTrashModal(true)}
              className={`${
                isLandscapeMode ? 'h-[clamp(28px,7.5vh,36px)] w-auto' : 'h-[clamp(28px,4.2vh,36px)] w-auto'
              } aspect-[2.5/3.5] rounded-xl border border-dashed border-emerald-900/60 bg-[#05110d]/50 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition`}
            >
              <span className="text-[9.5px] sm:text-xs font-mono font-bold">{gameState.trash.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Sub-renderers matching the exact OPlayTCG reference layouts
  // ---------------------------------------------------------------------------

  const renderOpponentHand = (isLandscapeMode: boolean = false) => {
    const oppCards =
      gameState.opponent.handCards && gameState.opponent.handCards.length > 0
        ? gameState.opponent.handCards
        : Array.from({ length: gameState.opponent.handCount }).map((_, idx) => ({
            instanceId: `opp-hand-${idx}`,
            cardId: `OP01-${idx}`,
            name: 'Opponent Card',
            category: 'Character' as const,
            colors: ['Purple'],
            cost: 0,
            power: 0,
            counter: null,
            imageUrl: OPCG_PURPLE_BACK_DATA_URL,
            rested: false,
            attachedDon: 0,
            customPowerModifier: 0,
          }));

    return (
      <div
        className={`flex items-center justify-center -space-x-2 sm:-space-x-3 overflow-x-auto max-w-full px-1 scrollbar-none animate-fadeIn ${
          isLandscapeMode ? 'my-1' : 'mb-0.5'
        }`}
      >
        {oppCards.map((card, idx) => (
          <div
            key={card.instanceId || `opp-card-${idx}`}
            onTouchStart={() => startLongPress(card)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onMouseDown={() => startLongPress(card)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onContextMenu={(e) => handleContextMenu(e, card)}
            onClick={() => {
              if (isLongPressTriggeredRef.current) return;
              setInspectedCard(card);
            }}
            className={`sim-card-interactive select-none relative rounded-xl overflow-hidden border border-white/20 shadow-md cursor-pointer transition hover:-translate-y-1 hover:border-white/40 shrink-0 ${
              isLandscapeMode ? 'h-[clamp(48px,11.5vh,68px)]' : 'h-[clamp(44px,6.5vh,58px)]'
            } aspect-[2.5/3.5]`}
            title={`Hold / Long-press to inspect. ${card.name}`}
          >
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderPlayerHand = (isLandscapeMode: boolean = false) => {
    return (
      <div
        className={`flex items-center justify-center -space-x-2.5 sm:-space-x-3.5 animate-fadeIn my-0.5 pb-0.5 transition-all overflow-x-auto max-w-full px-1 scrollbar-none ${
          highlightTarget === 'hand' ? spotlightClass : ''
        }`}
      >
        {gameState.hand.map((card) => {
          const isSelected = selectedHandCard?.instanceId === card.instanceId;
          const canAfford = gameState.activeDon >= (card.cost || 0);
          return (
            <div
              key={card.instanceId}
              onTouchStart={() => startLongPress(card)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onMouseDown={() => startLongPress(card)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onContextMenu={(e) => handleContextMenu(e, card)}
              onClick={() => {
                if (isLongPressTriggeredRef.current) return;
                if (isSelected) {
                  setSelectedHandCard(null);
                } else {
                  setSelectedHandCard(card);
                  setSelectedDonCount(0);
                  setSelectedAttacker(null);
                }
              }}
              className={`sim-card-interactive select-none relative ${
                isLandscapeMode
                  ? 'h-[clamp(62px,15vh,84px)]'
                  : 'h-[clamp(58px,8.8vh,74px)]'
              } aspect-[2.5/3.5] rounded-xl overflow-hidden border shadow-xl cursor-pointer transform transition duration-150 shrink-0 ${
                isSelected
                  ? '-translate-y-2 ring-3 ring-amber-400 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] z-30 scale-105'
                  : canAfford
                  ? 'opacity-100 hover:-translate-y-1.5 hover:border-amber-400 hover:z-20 border-white/20 bg-[#151926]'
                  : 'opacity-70 border-white/10 hover:-translate-y-0.5 bg-[#10131d]'
              }`}
              title={`Hold / Long-press to inspect. ${card.name} (Cost: ${card.cost})`}
            >
              {/* Underlying stylized frame */}
              <div className="absolute inset-0 flex flex-col justify-between p-1 bg-gradient-to-b from-[#1c2234] via-[#141824] to-[#0c0f17] text-white pointer-events-none select-none">
                <div className="flex items-center justify-between">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-black text-[8px] flex items-center justify-center">
                    {card.cost ?? 0}
                  </span>
                  {card.counter && card.counter > 0 && (
                    <span className="px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-[6.5px] font-bold">
                      +{card.counter}
                    </span>
                  )}
                </div>
                <div className="text-center px-0.5 my-auto">
                  <div className="font-mono text-[7px] text-slate-400 truncate">{card.cardId}</div>
                  <div className="font-bold text-[8.5px] text-white truncate leading-tight mt-0.5">{card.name}</div>
                </div>
                <div className="flex items-center justify-between text-[7px] font-semibold text-slate-300">
                  <span className="px-1 py-0.2 rounded bg-slate-800 text-[6px]">
                    {card.category.substring(0, 4).toUpperCase()}
                  </span>
                  {card.power > 0 && (
                    <span className="font-mono text-emerald-400 font-bold">{card.power}</span>
                  )}
                </div>
              </div>

              {/* Artwork */}
              <img
                src={card.imageUrl}
                alt={card.name}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-10"
                draggable={false}
                referrerPolicy="no-referrer"
                onError={(e) => handleCardImageError(e, card.cardId, card.imageUrl)}
              />

              {/* Top-left Cost overlay badge */}
              <div className="absolute top-0.5 left-0.5 z-20 w-4 h-4 rounded-full bg-amber-500 text-black font-black text-[8px] flex items-center justify-center shadow-md border border-amber-300 pointer-events-none select-none">
                {card.cost ?? 0}
              </div>

              {/* Top-right Counter overlay badge */}
              {card.counter && card.counter > 0 && (
                <div className="absolute top-0.5 right-0.5 z-20 px-1 py-0.2 rounded-md bg-black/85 backdrop-blur-xs text-cyan-300 font-mono text-[6.5px] font-bold border border-cyan-400/40 pointer-events-none select-none">
                  +{card.counter}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedHandCardBanner = () => {
    if (!selectedHandCard) return null;
    return (
      <div className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 bg-[#101626]/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md rounded-xl text-xs text-white animate-fadeIn my-0.5 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="font-black text-emerald-300 truncate">{selectedHandCard.name}</span>
          <span className="text-[10.5px] text-gray-300 shrink-0">
            Cost: <b className="text-amber-300 font-bold">{selectedHandCard.cost} DON</b>
          </span>
          {gameState.activeDon >= (selectedHandCard.cost || 0) ? (
            <span className="text-[9.5px] text-emerald-400 font-semibold hidden sm:inline">
              ➔ Tap field to summon
            </span>
          ) : (
            <span className="text-[9.5px] text-rose-400 font-semibold hidden sm:inline">
              (Need {selectedHandCard.cost} Active DON!!)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedHandCard.category === 'Event' && gameState.activeDon >= (selectedHandCard.cost || 0) && (
            <button
              type="button"
              onClick={() => handlePlayCard(selectedHandCard.instanceId)}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9.5px] font-bold flex items-center gap-0.5 transition active:scale-95 cursor-pointer shadow-md"
            >
              <Play className="w-2.5 h-2.5" />
              <span>Activate</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDiscardCard(selectedHandCard.instanceId)}
            className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 text-[9.5px] font-bold flex items-center gap-0.5 transition active:scale-95 cursor-pointer"
            title="Discard to Trash"
          >
            <Trash2 className="w-2.5 h-2.5 text-rose-400" />
            <span>Trash</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedHandCard(null)}
            className="p-1 rounded text-gray-400 hover:text-white transition cursor-pointer"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const renderMidlineBanner = (isLandscapeMode: boolean = false) => (
    <div className={`relative w-full flex items-center justify-center shrink-0 ${isLandscapeMode ? 'my-0 py-0.5' : 'my-0.5'} z-30`}>
      <div className="h-0.5 w-full bg-white/10" />
      {liveAttackerCard ? (
        <div className={`absolute px-3 py-0.5 sm:py-1 rounded-full bg-[#3b0d18] border-2 border-rose-500 text-white ${isLandscapeMode ? 'text-[8.5px]' : 'text-[9.5px] sm:text-xs'} font-bold shadow-2xl flex items-center gap-1.5 pointer-events-auto animate-pulse z-40 max-w-[95%]`}>
          <span className="flex items-center gap-1 text-rose-300 truncate">
            <Swords className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">
              {liveAttackerCard.name} ({(liveAttackerCard.power || 0) + liveAttackerCard.attachedDon * 1000} ATK)
            </span>
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-amber-300 font-semibold whitespace-nowrap">Tap target 🎯</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFieldCard(liveAttackerCard);
            }}
            className="px-1.5 py-0.2 rounded bg-white/10 hover:bg-white/20 text-[8px] text-gray-200 shrink-0 active:scale-95 transition"
            title="Card details and manual controls"
          >
            Menu
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAttacker(null);
            }}
            className="w-3.5 h-3.5 rounded-full bg-black/60 hover:bg-black text-gray-300 hover:text-white flex items-center justify-center text-[8.5px] shrink-0 active:scale-95 transition"
            title="Cancel attack"
          >
            ✕
          </button>
        </div>
      ) : selectedDonCount > 0 ? (
        <div className={`absolute px-3 py-0.5 sm:py-1 rounded-full bg-amber-500 text-black ${isLandscapeMode ? 'text-[8.5px]' : 'text-[9.5px] sm:text-xs'} font-black shadow-xl flex items-center gap-1.5 pointer-events-auto animate-bounce z-40`}>
          <span>🪙 {selectedDonCount} DON!! SELECTED</span>
          <span className="font-semibold text-gray-900">• Tap Leader or Char to attach (+{selectedDonCount * 1000} Power)</span>
          <button
            type="button"
            onClick={() => setSelectedDonCount(0)}
            className="w-3.5 h-3.5 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-[8.5px] ml-1"
            title="Cancel DON selection"
          >
            ✕
          </button>
        </div>
      ) : currentStep ? (
        <button
          type="button"
          onClick={() => {
            const nextIdx = (gameState.tutorialStepIndex + 1) % OPTCG_TUTORIAL_STEPS.length;
            setGameState((prev) => setTutorialStep(prev, nextIdx));
          }}
          className={`absolute px-4 py-0.5 sm:py-1 rounded-full bg-[#181a24]/95 border-2 border-amber-400 text-amber-300 ${isLandscapeMode ? 'text-[9px]' : 'text-xs sm:text-sm'} font-bold shadow-2xl flex items-center gap-1.5 pointer-events-auto cursor-pointer animate-pulse active:scale-95 transition`}
        >
          <span className="text-amber-400">✦</span>
          <span>{currentStep.title}</span>
        </button>
      ) : (
        <div className={`absolute px-3.5 py-0.5 sm:py-1 rounded-full bg-[#181a24]/95 border-2 border-amber-400/90 text-amber-300 ${isLandscapeMode ? 'text-[8.5px]' : 'text-[9.5px] sm:text-xs'} font-bold shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-1.5 pointer-events-auto animate-pulse`}>
          <span className="text-amber-400 text-xs">✦</span>
          <span>Attach a DON!!</span>
        </div>
      )}
    </div>
  );

  const renderPortraitLayout = () => (
    <div className="w-full h-full max-w-[440px] sm:max-w-[500px] md:max-w-[560px] mx-auto flex flex-col justify-between gap-0.5 sm:gap-1 overflow-hidden px-1">
      {/* 1. TOP HEADER NAVIGATION */}
      <div className="flex items-center justify-between w-full shrink-0 px-1 py-0.5 z-20">
        <div className="flex items-center gap-1.5">
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
            onClick={handleToggleOrientation}
            className="w-7 h-7 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 flex items-center justify-center shadow-xs transition cursor-pointer"
            title="Toggle Fullscreen / Landscape"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {activeMultiplayerRoom && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono text-[9px] shadow-xs">
              <Radio className="w-3 h-3 text-indigo-400" />
              <span className="font-bold tracking-wide">ROOM: {activeMultiplayerRoom}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeMultiplayerRoom);
                  setCopiedRoomCode(true);
                  setTimeout(() => setCopiedRoomCode(false), 2000);
                }}
                className="ml-0.5 px-1 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[8.5px] flex items-center gap-0.5 cursor-pointer transition font-sans"
              >
                {copiedRoomCode ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedRoomCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Speed Toggle & Menu Button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const nextSpeed: AnimationSpeed =
                animSpeed === 'normal' ? 'fast' : animSpeed === 'fast' ? 'instant' : 'normal';
              handleSpeedChange(nextSpeed);
            }}
            className="px-2 py-0.5 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-amber-300 hover:text-amber-200 border border-amber-500/30 text-[9.5px] font-mono font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
            title="Toggle Animation Speed (Normal / Fast / Instant)"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{animSpeed === 'normal' ? '1x' : animSpeed === 'fast' ? '2x' : 'INST'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTurnMenu(true)}
            className="px-2.5 py-0.5 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 text-[9.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Menu className="w-3 h-3 text-amber-400" />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* 2. OPPONENT HAND (Upright Cards Above Battlefield) */}
      {renderOpponentHand(false)}

      {/* 3. OPPONENT STATUS PILL BAR */}
      <div className="flex items-center justify-center gap-1.5 w-full px-1 py-0.5 shrink-0 z-10">
        <button
          type="button"
          onClick={() => {
            if (!activeMultiplayerRoom) setShowOpponentSelector(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#131d31] border border-blue-500/30 text-white text-[9px] font-bold shadow-xs hover:bg-[#1a263f] transition cursor-pointer"
          title={activeMultiplayerRoom ? `Playing against ${gameState.opponent.name}` : 'Click to change opponent deck'}
        >
          <span className={`w-2 h-2 rounded-full ${activeMultiplayerRoom ? (isMultiplayerOpponentConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-pulse') : 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]'}`} />
          <span>{activeMultiplayerRoom ? (isMultiplayerOpponentConnected ? gameState.opponent.name : 'Waiting for Opponent...') : 'OPPONENT'}</span>
        </button>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#131d31] border border-white/10 text-gray-300 font-mono text-[8.5px]">
          <Clock className="w-2.5 h-2.5 text-gray-400" />
          <span>17:30</span>
        </div>
        <div
          className="px-2 py-0.5 rounded-md bg-[#131d31] border border-white/10 text-white font-mono text-[9px] font-bold shadow-xs flex items-center gap-1"
          title={`Opponent has ${gameState.opponent.handCount} cards in hand`}
        >
          <span>{gameState.opponent.handCount}</span>
        </div>
        <button
          type="button"
          onClick={() => setPlayerHandExpanded(!playerHandExpanded)}
          className="px-2 py-0.5 rounded-md bg-[#1a253d] hover:bg-[#24324f] text-gray-200 border border-white/10 text-[8.5px] font-semibold shadow-xs flex items-center gap-0.5 transition cursor-pointer"
        >
          <span>⇅ Original</span>
        </button>
      </div>

      {/* 4. OPPONENT PLAYMAT */}
      {renderOpponentPlaymat(false)}

      {/* 5. MIDLINE & ACTION PROMPT BANNER */}
      {renderMidlineBanner(false)}

      {/* 6. PLAYER PLAYMAT */}
      {renderPlayerPlaymat(false)}

      {/* 7. PLAYER STATUS PILL BAR */}
      <div className="flex items-center justify-center gap-1.5 w-full px-1 py-0.5 shrink-0 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#131d31] border border-emerald-500/30 text-white text-[9px] font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span>{activeMultiplayerRoom ? (isMultiplayerHost ? 'HOST' : 'GUEST') : 'GUEST'}</span>
          {!gameState.isOpponentTurn && (
            <span className="px-1 py-0.2 rounded bg-amber-600 text-[6.5px] font-bold text-white uppercase">TURN</span>
          )}
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#131d31] border border-white/10 text-gray-300 font-mono text-[8.5px]">
          <Clock className="w-2.5 h-2.5 text-gray-400" />
          <span>17:30</span>
        </div>
        <div className="px-2 py-0.5 rounded-md bg-[#131d31] border border-white/10 text-white font-mono text-[9px] font-bold shadow-xs">
          {gameState.hand.length}
        </div>
        <button
          type="button"
          onClick={() => setPlayerHandExpanded(!playerHandExpanded)}
          className="px-2 py-0.5 rounded-md bg-[#1a253d] hover:bg-[#24324f] text-gray-200 border border-white/10 text-[8.5px] font-semibold shadow-xs flex items-center gap-0.5 transition cursor-pointer"
        >
          <span>⇅ Original</span>
        </button>
      </div>

      {/* 8. FLOATING SUMMON BANNER (if card selected) */}
      {selectedHandCard && renderSelectedHandCardBanner()}

      {/* 9. PLAYER HAND (Upright Cards Below Battlefield) */}
      {playerHandExpanded && renderPlayerHand(false)}

      {/* 10. BOTTOM ACTION BAR */}
      <div className="flex items-center justify-between w-full shrink-0 px-1 py-0.5 sm:py-1 z-20 h-9 sm:h-10 md:h-11">
        {/* Turn Menu Pill (Left) */}
        <button
          type="button"
          onClick={() => setShowTurnMenu(true)}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
        >
          <Menu className="w-3.5 h-3.5 stroke-[3]" />
          <span>TURN {gameState.turn}</span>
        </button>

        {/* Action Controls (Right) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('Bug report submitted. Thank you for testing the simulator!')}
            className="w-8 h-8 rounded-full bg-[#141a29] text-amber-500 hover:text-amber-400 border border-white/10 shadow-xs flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Report bug"
          >
            <Bug className="w-4 h-4 text-amber-500" />
          </button>

          <button
            type="button"
            onClick={handleNextTurn}
            disabled={isAiThinking || (Boolean(activeMultiplayerRoom) && gameState.isOpponentTurn)}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-black font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition select-none ${
              isAiThinking || (Boolean(activeMultiplayerRoom) && gameState.isOpponentTurn)
                ? 'bg-amber-600/70 cursor-not-allowed opacity-80 text-white'
                : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer'
            } ${highlightTarget === 'endTurn' ? spotlightClass : ''}`}
          >
            {isAiThinking ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Opponent Turn...</span>
              </>
            ) : activeMultiplayerRoom && gameState.isOpponentTurn ? (
              <>
                <Clock className="w-3.5 h-3.5 text-white" />
                <span>Opponent&apos;s Turn</span>
              </>
            ) : (
              <>
                <span>End turn</span>
                <span className="text-xs">▷</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLandscapeLayout = () => (
    <div className="w-full h-full max-w-[100dvw] max-h-[100dvh] mx-auto flex flex-row items-stretch justify-between gap-1 sm:gap-2 p-1 overflow-hidden select-none box-border">
      {/* =======================================================================
          LEFT COLUMN: Opponent & Player Status Pills, Player Hand
         ======================================================================= */}
      <div className="w-[125px] sm:w-[145px] md:w-[170px] shrink-0 flex flex-col justify-between py-0.5 px-0.5 h-full z-20 overflow-hidden">
        {/* Top Controls & Opponent Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="w-6.5 h-6.5 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition shrink-0"
                title="Return"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
            ) : (
              <Link
                href="/"
                className="w-6.5 h-6.5 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
              </Link>
            )}
            <button
              type="button"
              onClick={handleToggleOrientation}
              className="w-6.5 h-6.5 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                const nextSpeed: AnimationSpeed =
                  animSpeed === 'normal' ? 'fast' : animSpeed === 'fast' ? 'instant' : 'normal';
                handleSpeedChange(nextSpeed);
              }}
              className="px-1.5 py-0.5 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-amber-300 border border-amber-500/30 text-[8.5px] font-mono font-bold flex items-center gap-0.5 transition cursor-pointer shrink-0"
            >
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>{animSpeed === 'normal' ? '1x' : animSpeed === 'fast' ? '2x' : 'INST'}</span>
            </button>
          </div>

          {/* Opponent Status Pill */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (!activeMultiplayerRoom) setShowOpponentSelector(true);
              }}
              className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-[#131d31] border border-blue-500/30 text-white text-[8.5px] font-bold shadow-xs hover:bg-[#1a263f] transition cursor-pointer truncate max-w-[85px]"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeMultiplayerRoom ? (isMultiplayerOpponentConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse') : 'bg-blue-400'}`} />
              <span className="truncate">{activeMultiplayerRoom ? (isMultiplayerOpponentConnected ? gameState.opponent.name : 'Waiting...') : 'OPPONENT'}</span>
            </button>
            <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#131d31] border border-white/10 text-gray-300 font-mono text-[8px] shrink-0">
              <Clock className="w-2 h-2 text-gray-400" />
              <span>17:30</span>
            </div>
          </div>
        </div>

        {/* Player Status Pill & Hand */}
        <div className="space-y-1 mt-auto">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-[#131d31] border border-emerald-500/30 text-white text-[8.5px] font-bold shadow-xs truncate max-w-[85px]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="truncate">{activeMultiplayerRoom ? (isMultiplayerHost ? 'HOST' : 'GUEST') : 'GUEST'}</span>
              {!gameState.isOpponentTurn && (
                <span className="px-1 py-0.2 rounded bg-amber-600 text-[6px] font-bold text-white uppercase shrink-0">TURN</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#131d31] border border-white/10 text-gray-300 font-mono text-[8px] shrink-0">
              <Clock className="w-2 h-2 text-gray-400" />
              <span>17:30</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1 px-2 py-0.2 rounded-md bg-[#131d31] border border-white/10 text-white font-mono text-[8.5px] font-bold">
              <span>{gameState.hand.length}</span>
              <span className="text-gray-500 font-normal">|</span>
              <button
                type="button"
                onClick={() => setPlayerHandExpanded(!playerHandExpanded)}
                className="text-gray-200 hover:text-white text-[8px] font-semibold cursor-pointer"
              >
                ⇅ Original
              </button>
            </div>
          </div>

          {selectedHandCard && (
            <div className="w-full px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-[8px] text-white flex items-center justify-between gap-1">
              <span className="font-bold text-emerald-300 truncate">{selectedHandCard.name}</span>
              <button
                type="button"
                onClick={() => setSelectedHandCard(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
          {playerHandExpanded && renderPlayerHand(true)}
        </div>
      </div>

      {/* =======================================================================
          CENTER COLUMN: Opponent Playmat, Midline Prompt, Player Playmat
         ======================================================================= */}
      <div className="flex-1 min-w-0 max-w-[720px] mx-auto flex flex-col justify-between gap-0.5 sm:gap-1 h-full py-0.5 overflow-hidden">
        {renderOpponentPlaymat(true)}
        {renderMidlineBanner(true)}
        {renderPlayerPlaymat(true)}
      </div>

      {/* =======================================================================
          RIGHT COLUMN: Opponent Hand, Turn Indicator, End Turn & Bug Report
         ======================================================================= */}
      <div className="w-[125px] sm:w-[145px] md:w-[170px] shrink-0 flex flex-col justify-between py-0.5 px-0.5 h-full z-20 overflow-hidden">
        {/* Top: Opponent Hand */}
        <div className="space-y-0.5">
          {renderOpponentHand(true)}
          <div className="flex items-center justify-center px-0.5">
            <div className="flex items-center gap-1 px-2 py-0.2 rounded-md bg-[#131d31] border border-white/10 text-white font-mono text-[8.5px] font-bold">
              <span>{gameState.opponent.handCount}</span>
              <span className="text-gray-500 font-normal">|</span>
              <span className="text-gray-300 text-[8px] font-semibold">
                ⇅ Original
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Turn Indicator */}
        <div className="my-auto flex justify-end pr-0.5">
          <button
            type="button"
            onClick={() => setShowTurnMenu(true)}
            className="px-3 py-1 rounded-xl bg-white hover:bg-gray-100 text-black font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Menu className="w-3 h-3 stroke-[3]" />
            <span>TURN {gameState.turn}</span>
          </button>
        </div>

        {/* Bottom: Action Buttons */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={handleNextTurn}
            disabled={isAiThinking || (Boolean(activeMultiplayerRoom) && gameState.isOpponentTurn)}
            className={`w-full py-2 sm:py-2.5 rounded-xl text-black font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 select-none ${
              isAiThinking || (Boolean(activeMultiplayerRoom) && gameState.isOpponentTurn)
                ? 'bg-amber-600/70 cursor-not-allowed opacity-80 text-white'
                : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer'
            } ${highlightTarget === 'endTurn' ? spotlightClass : ''}`}
          >
            {isAiThinking ? (
              <>
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="truncate">Opponent...</span>
              </>
            ) : activeMultiplayerRoom && gameState.isOpponentTurn ? (
              <>
                <Clock className="w-3 h-3 text-white" />
                <span className="truncate">Opponent Turn</span>
              </>
            ) : (
              <>
                <span>End turn</span>
                <span className="text-xs">▷</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => alert('Bug report submitted. Thank you for testing the simulator!')}
            className="w-full py-1 rounded-lg bg-[#141a29] hover:bg-[#1e2638] text-gray-300 hover:text-white border border-white/10 text-[10.5px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Bug className="w-3 h-3 text-amber-500" />
            <span>Report a bug</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] w-full max-w-[100dvw] overflow-hidden bg-[#0a0e17] text-gray-200 flex flex-col justify-between font-sans select-none relative transition-all ${
        forceVirtualLandscape && !isLandscape
          ? 'rotate-90 origin-top-left w-[100dvh] h-[100dvw] translate-x-[100dvw] fixed inset-0 z-50'
          : ''
      }`}
    >
      {activeIsLandscape ? renderLandscapeLayout() : renderPortraitLayout()}

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
                  setShowMultiplayerModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 font-semibold transition border border-indigo-500/30"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {activeMultiplayerRoom ? `Multiplayer (Room: ${activeMultiplayerRoom})` : 'Online Multiplayer'}
                </span>
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

      {/* =======================================================================
          PHASE 4: INTERACTIVE BLOCKER & COUNTER DEFENSE BANNER (Floating Mobile Bar)
         ======================================================================= */}
      {gameState.pendingCombat && !gameState.pendingCombat.attackerIsPlayer && (
        <div className="fixed bottom-3 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full bg-[#0d1527]/95 border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-slideUp text-white flex flex-col gap-2.5">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <Swords className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {gameState.pendingCombat.step === 'BLOCK_STEP' ? '🛡️ BLOCKER STEP' : '⚡ COUNTER STEP'}
                </span>
                <h4 className="text-xs font-bold leading-tight">Incoming Attack from {gameState.pendingCombat.attackerName}!</h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Total Target</span>
              <span className="text-xs font-extrabold font-mono text-emerald-400">
                {gameState.pendingCombat.targetPower + gameState.pendingCombat.currentBoost} Power
              </span>
            </div>
          </div>

          {/* VS Matchup Info */}
          <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
            {/* Attacker Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {gameState.pendingCombat.attackerImageUrl && (
                <div className="w-9 aspect-[2.5/3.5] rounded-xs overflow-hidden border border-rose-500/60 shrink-0">
                  <img
                    src={gameState.pendingCombat.attackerImageUrl}
                    alt={gameState.pendingCombat.attackerName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-rose-300 truncate">
                  {gameState.pendingCombat.attackerName}
                </div>
                <div className="text-[10px] font-mono text-gray-400">
                  ⚔️ {gameState.pendingCombat.attackerPower} Power
                </div>
              </div>
            </div>

            <div className="px-2 text-xs font-black text-gray-500">VS</div>

            {/* Defender Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-cyan-300 truncate">
                  {gameState.pendingCombat.targetName}
                </div>
                <div className="text-[10px] font-mono text-gray-300">
                  🛡️ {gameState.pendingCombat.targetPower}
                  {gameState.pendingCombat.currentBoost > 0 && (
                    <span className="text-emerald-400 font-bold ml-0.5">
                      (+{gameState.pendingCombat.currentBoost})
                    </span>
                  )}
                </div>
              </div>
              {gameState.pendingCombat.targetImageUrl && (
                <div className="w-9 aspect-[2.5/3.5] rounded-xs overflow-hidden border border-cyan-500/60 shrink-0">
                  <img
                    src={gameState.pendingCombat.targetImageUrl}
                    alt={gameState.pendingCombat.targetName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* STEP 1: Blocker Options */}
          {gameState.pendingCombat.step === 'BLOCK_STEP' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-300">
                <span>Select active Blocker to intercept:</span>
                <span className="text-gray-400">or pass to Counter step</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {gameState.characters
                  .filter((c) => c.hasBlocker && !c.rested && c.instanceId !== gameState.pendingCombat?.targetInstanceId)
                  .map((blocker) => (
                    <button
                      key={`blocker-${blocker.instanceId}`}
                      type="button"
                      onClick={() => handleActivateBlocker(blocker.instanceId)}
                      className="flex-1 min-w-[120px] py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Block with {blocker.name} ({(blocker.power || 0) + blocker.attachedDon * 1000})</span>
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={handlePassBlocker}
                  className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 font-medium text-xs transition active:scale-95 cursor-pointer"
                >
                  No Blocker ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Counter Options */}
          {gameState.pendingCombat.step === 'COUNTER_STEP' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-300">
                <span>Discard cards from hand for Counter boost:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  Current Boost: +{gameState.pendingCombat.currentBoost}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {gameState.hand
                  .filter((c) => (c.counter || 0) > 0)
                  .map((card) => (
                    <button
                      key={`counter-card-${card.instanceId}`}
                      type="button"
                      onClick={() => handleApplyCounter(card.instanceId)}
                      className="shrink-0 py-1.5 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{card.name}</span>
                      <span className="px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                        +{card.counter}
                      </span>
                    </button>
                  ))}
                {gameState.hand.filter((c) => (c.counter || 0) > 0).length === 0 && (
                  <div className="text-[11px] text-gray-400 italic py-1">
                    No counter cards available in hand.
                  </div>
                )}
              </div>

              {/* Resolve Combat Button */}
              <button
                type="button"
                onClick={handleResolveCombat}
                className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md mt-1 ${
                  gameState.pendingCombat.targetPower + gameState.pendingCombat.currentBoost > gameState.pendingCombat.attackerPower
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <span>
                  {gameState.pendingCombat.targetPower + gameState.pendingCombat.currentBoost > gameState.pendingCombat.attackerPower
                    ? `🛡️ Repel Attack (${gameState.pendingCombat.targetPower + gameState.pendingCombat.currentBoost} > ${gameState.pendingCombat.attackerPower})`
                    : `💥 Take Damage / Resolve Combat (${gameState.pendingCombat.targetPower + gameState.pendingCombat.currentBoost} <= ${gameState.pendingCombat.attackerPower})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MULTIPLAYER ATTACKER PENDING COMBAT BANNER */}
      {gameState.pendingCombat && gameState.pendingCombat.attackerIsPlayer && (
        <div className="fixed bottom-3 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full bg-[#0d1527]/95 border-2 border-indigo-500/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-slideUp text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                Attacking with {gameState.pendingCombat.attackerName} ({gameState.pendingCombat.attackerPower} Power)
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                Awaiting opponent reaction (Blockers &amp; Counters)...
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 text-[10px] font-mono shrink-0">
            vs {gameState.pendingCombat.targetName}
          </span>
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
                  referrerPolicy="no-referrer"
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
                <button
                  type="button"
                  onClick={() => {
                    setInspectedCard(liveFieldCard);
                  }}
                  className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Languages className="w-3.5 h-3.5 text-blue-400" />
                  <span>Card Details & English Text ➔</span>
                </button>
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

              {/* Field Card Searcher / Effect Activation */}
              {liveFieldCard.effect && !liveFieldCard.rested && (
                liveFieldCard.effect.toLowerCase().includes('look at') ||
                liveFieldCard.effect.toLowerCase().includes('search') ||
                liveFieldCard.effect.toLowerCase().includes('[activate: main]')
              ) && (
                <div className="col-span-2 pt-1 border-t border-white/10">
                  <button
                    type="button"
                    disabled={gameState.activeDon < 1 || gameState.deck.length === 0}
                    onClick={() => {
                      setGameState((prev) => activateFieldCardSearcher(prev, liveFieldCard.instanceId, 5, 1));
                      setSelectedFieldCard(null);
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      gameState.activeDon >= 1 && gameState.deck.length > 0
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-95 cursor-pointer shadow-xs'
                        : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Activate Effect: Search Top 5 Cards (Rest 1 DON)</span>
                  </button>
                </div>
              )}

              {/* Attach DON!! */}
              <div className="col-span-2 flex flex-col gap-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Attach Active DON!! (+1000 / DON):
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {gameState.activeDon} available
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={gameState.activeDon < 1}
                    onClick={() => handleAttachDon(liveFieldCard.instanceId, 1)}
                    className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                      gameState.activeDon >= 1
                        ? 'bg-[#d97706] hover:bg-[#b45309] text-white active:scale-95 cursor-pointer'
                        : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1 DON</span>
                  </button>
                  {gameState.activeDon >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleAttachDon(liveFieldCard.instanceId, 2)}
                      className="flex-1 min-w-[70px] py-2 px-2 rounded-xl bg-[#d97706]/85 hover:bg-[#b45309] text-white font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+2 DON</span>
                    </button>
                  )}
                  {gameState.activeDon >= 3 && (
                    <button
                      type="button"
                      onClick={() => handleAttachDon(liveFieldCard.instanceId, gameState.activeDon)}
                      className="flex-1 min-w-[70px] py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md"
                    >
                      <span>+All ({gameState.activeDon})</span>
                    </button>
                  )}
                  {liveFieldCard.attachedDon > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDetachDon(liveFieldCard.instanceId)}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-medium text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Detach ({liveFieldCard.attachedDon})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS & POPUPS
         ========================================================================= */}
      {/* Matchmaking Overlay (Finding Opponent) */}
      {showMatchmaking && (
        <SimMatchmakingModal
          playerDeck={chosenDeck}
          opponentDeck={currentOpponentDeck}
          onComplete={() => setShowMatchmaking(false)}
        />
      )}

      {/* Online PVP Lobby Waiting Screen (Displayed until 2nd player joins) */}
      {activeMultiplayerRoom && !isMultiplayerOpponentConnected && (
        <div className="fixed inset-0 z-50 bg-[#0a0e17]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121724] border border-[#232d44] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5 relative overflow-hidden text-gray-200">
            {/* Background glow */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>PVP Match Lobby</span>
            </div>

            {/* Room Code Card */}
            <div className="bg-[#182032] border border-[#2d3a57] rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Room Match Code
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-widest selection:bg-amber-400 selection:text-black">
                {activeMultiplayerRoom}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeMultiplayerRoom);
                  setCopiedRoomCode(true);
                  setTimeout(() => setCopiedRoomCode(false), 2000);
                }}
                className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer shadow-md active:scale-95"
              >
                {copiedRoomCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRoomCode ? 'Room Code Copied!' : 'Copy Room Code'}</span>
              </button>
            </div>

            {/* Waiting Status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>{isMultiplayerHost ? 'Waiting for Player 2 to join...' : 'Connecting to Host...'}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {isMultiplayerHost
                  ? 'Share this code with your opponent. When both players enter the lobby, cards will be drawn and the match will start automatically!'
                  : 'Connected to room channel. Cards will be dealt once both players are ready.'}
              </p>
            </div>

            {/* Selected Deck Info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1420] border border-white/5 text-left text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/40">
                  <img src={chosenDeck.leaderImage} alt={chosenDeck.leaderName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Your Deck</span>
                  <span className="font-bold text-white block text-sm">{chosenDeck.name}</span>
                  <span className="text-[11px] text-slate-400">{chosenDeck.leaderName}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                {isMultiplayerHost ? 'HOST (1st)' : 'GUEST (2nd)'}
              </span>
            </div>

            {/* Cancel Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLeaveMultiplayerRoom}
                className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                Cancel & Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mulligan Modal - only shown once both players are in match and matchmaking completes */}
      {!showMatchmaking && !(Boolean(activeMultiplayerRoom) && !isMultiplayerOpponentConnected) && gameState.mulliganOffered && (
        <SimMulliganModal
          hand={gameState.hand}
          hasMulliganed={gameState.hasMulliganed}
          onKeep={handleKeepHand}
          onMulligan={handleMulligan}
          onInspect={(card) => setInspectedCard(card)}
        />
      )}

      {/* Automated Searcher Modal (Top X Cards Look & Select) */}
      {gameState.pendingSearcher && (
        <SimSearcherModal
          searcher={gameState.pendingSearcher}
          onSelectCard={handleSelectSearcherCard}
          onPass={handlePassSearcher}
          onInspect={(card) => setInspectedCard(card)}
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

      {/* Centralized Gameplay Animation Layer */}
      <SimAnimationLayer
        turnBanner={turnBannerAnim}
        flyingCard={flyingCardAnim}
        attackSlash={attackSlashAnim}
        donFly={donFlyAnim}
        combatImpact={combatImpactAnim}
        powerPopups={powerPopups}
        victoryDefeat={
          gameState.winner
            ? {
                winner: gameState.winner,
                leaderName:
                  gameState.winner === 'player'
                    ? gameState.leader?.name
                    : gameState.opponent.leaderName,
                turnsElapsed: gameState.turn,
                onRematch: () => handleRestart(true),
                onExit,
              }
            : null
        }
      />

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
        animationSpeed={animSpeed}
        onSetAnimationSpeed={handleSpeedChange}
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
              <button
                type="button"
                onClick={() => {
                  const randomDeck = getRandomOpponentDeck(gameState.opponent.deckId);
                  handleSelectOpponentDeck(randomDeck);
                  setShowOpponentSelector(false);
                  setShowMatchmaking(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1c2438] hover:bg-[#25304b] border border-amber-500/30 hover:border-amber-400 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 shadow-sm mb-2"
              >
                <Shuffle className="w-4 h-4 text-amber-400" />
                <span>🎲 Match Random Opponent</span>
              </button>

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
                        referrerPolicy="no-referrer"
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

      {/* Multiplayer Room Modal */}
      <SimMultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        onJoinRoom={handleJoinMultiplayerRoom}
      />

      {/* Trigger Modal */}
      {gameState.pendingTrigger && (
        <SimTriggerModal
          card={gameState.pendingTrigger.card}
          effect={gameState.pendingTrigger.effect}
          onActivate={handleActivateTrigger}
          onDismiss={handleDismissTrigger}
        />
      )}

      {/* Victory / Defeat is handled by SimAnimationLayer */}
    </div>
  );
}
