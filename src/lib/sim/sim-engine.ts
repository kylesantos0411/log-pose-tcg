/**
 * sim-engine.ts
 * Core game state manager and action reducers for the One Piece TCG Simulator.
 * Implements official Bandai rules: 5 Phases, DON!! mechanics, combat, blockers, triggers, and AI turns.
 */

import { SimCard, SimGameState, GameLogEntry, SimOpponent, PendingCombat, PendingTrigger } from './sim-types';
import { RecommendedDeck, DeckCardItem, RECOMMENDED_DECKS } from '../recommended-decks';
import { getEditionCardImageUrl } from '../card-image';
import { ST01_STRAW_HAT_DECK, ST04_ANIMAL_KINGDOM_DECK } from './starter-decks';

function createLog(text: string, type: GameLogEntry['type'] = 'action'): GameLogEntry {
  const d = new Date();
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    time,
    text,
    type,
  };
}

/**
 * Fisher-Yates array shuffle (pure)
 */
function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Determine Leader Life total based on official rules:
 * - Whitebeard (OP02-001) has 6 Life
 * - Dual-color leaders have 4 Life
 * - Mono-color leaders have 5 Life
 */
export function getLeaderBaseLife(leaderId: string, colors: string[]): number {
  if (leaderId === 'OP02-001') return 6;
  if (colors.length > 1) return 4;
  return 5;
}

/**
 * Helper to construct an authentic SimCard from card item
 */
import cardRulesDbRaw from './card-rules-db.json';

const cardRulesDb: Record<string, {
  counter: number | null;
  effect: string | null;
  trigger: string | null;
  types: string | null;
  attributes: string | null;
}> = cardRulesDbRaw as any;

/**
 * Universal Card Effect & Keyword Engine:
 * Intelligently recognizes Bandai rules from card text or database for ANY custom card.
 */
function createSimCard(
  item: DeckCardItem,
  instanceId: string,
  defaultColor = 'Red'
): SimCard {
  const baseCardCode = item.cardId.split('_')[0].trim();
  const dbData = cardRulesDb[baseCardCode] || null;

  // 1. Determine Effect Text
  const rawEffect = (dbData?.effect || '').trim();
  const rawTrigger = (dbData?.trigger || '').trim();

  // 2. Universal Blocker Detection
  const hasBlockerKeyword = (
    rawEffect.toLowerCase().includes('[blocker]') ||
    rawEffect.toLowerCase().includes('blocker') ||
    item.name.toLowerCase().includes('chopper') ||
    item.name.toLowerCase().includes('queen') ||
    item.name.toLowerCase().includes('killer') ||
    item.cardId.startsWith('ST01-006') ||
    item.cardId.startsWith('ST04-005')
  );

  // 3. Universal Rush Detection
  const hasRushKeyword = (
    rawEffect.toLowerCase().includes('[rush]') ||
    item.name.toLowerCase().includes('zoro') && (item.cost || 0) <= 3 ||
    item.cardId.startsWith('ST01-013') ||
    item.cardId.startsWith('ST04-003')
  );

  // 4. Universal Counter Value Detection
  let counterVal: number | null = dbData?.counter ?? null;
  if (counterVal === null && item.category === 'Character') {
    if (rawEffect.includes('+2000 Counter') || rawEffect.includes('+2000 counter') || rawEffect.includes('Counter +2000')) {
      counterVal = 2000;
    } else if (rawEffect.includes('+1000 Counter') || rawEffect.includes('+1000 counter') || rawEffect.includes('Counter +1000')) {
      counterVal = 1000;
    } else if ((item.power && item.power <= 2000) || item.cost === 1 || item.cost === 2) {
      counterVal = 1000;
    }
  }

  // Fallback for specific starter cards if missing
  if (counterVal === null) {
    if (['ST01-002', 'ST01-003', 'ST01-007', 'ST01-008', 'ST01-009', 'ST01-010', 'ST04-005', 'ST04-006', 'ST04-007', 'ST04-008', 'ST04-011'].includes(baseCardCode)) {
      counterVal = 1000;
    } else if (['ST04-002', 'OP01-029', 'OP02-005'].includes(baseCardCode)) {
      counterVal = 2000;
    }
  }

  // 5. Trigger extraction
  let finalTrigger: string | null = rawTrigger || null;
  if (!finalTrigger && rawEffect.toLowerCase().includes('[trigger]')) {
    const triggerMatch = rawEffect.match(/\[Trigger\][\s\S]+/i);
    if (triggerMatch) {
      finalTrigger = triggerMatch[0].trim();
    }
  }
  if (!finalTrigger) {
    if (baseCardCode === 'ST01-015') {
      finalTrigger = '[Trigger] K.O. up to 1 of your opponent\'s Characters with 5000 power or less.';
    } else if (baseCardCode === 'ST01-003') {
      finalTrigger = '[Trigger] Play this card.';
    } else if (baseCardCode === 'ST01-014') {
      finalTrigger = '[Trigger] Up to 1 of your Leader or Character cards gains +1000 power until the end of this turn.';
    }
  }

  // 6. Effect text extraction
  let finalEffect: string | null = rawEffect || null;
  if (!finalEffect) {
    if (hasBlockerKeyword) finalEffect = '[Blocker]';
    else if (hasRushKeyword) finalEffect = '[Rush]';
  }

  return {
    instanceId,
    cardId: item.cardId,
    name: item.name,
    category: (item.category as any) || 'Character',
    colors: typeof item.colors === 'string'
      ? item.colors.split(',').map((s) => s.trim())
      : [defaultColor],
    cost: item.cost ?? 1,
    power: item.power ?? 0,
    counter: counterVal,
    imageUrl: getEditionCardImageUrl(item.cardId, 'jp', item.imageUrl),
    effect: finalEffect,
    trigger: finalTrigger,
    englishName: item.name,
    englishEffect: finalEffect,
    englishTrigger: finalTrigger,
    types: dbData?.types || null,
    attributes: dbData?.attributes || null,
    rested: false,
    attachedDon: 0,
    customPowerModifier: 0,
    hasBlocker: hasBlockerKeyword,
    hasRush: hasRushKeyword,
    canAttackThisTurn: false,
  };
}

/**
 * Build an Opponent object from a RecommendedDeck
 */
export function createDefaultOpponent(deck?: RecommendedDeck): SimOpponent {
  const chosenDeck = deck || ST04_ANIMAL_KINGDOM_DECK;
  const colors = chosenDeck.color ? chosenDeck.color.split(',').map((s) => s.trim()) : ['Purple'];
  const life = getLeaderBaseLife(chosenDeck.leaderId, colors);

  // Initial practice opponent field character matching OPlayTCG Kaido board
  const initialOpponentChar: SimCard = {
    instanceId: 'opp-char-1',
    cardId: 'ST04-002',
    name: 'Ulti',
    category: 'Character',
    colors: ['Purple'],
    cost: 4,
    power: 5000,
    counter: 2000,
    imageUrl: getEditionCardImageUrl('ST04-002', 'jp', 'https://en.onepiece-cardgame.com/images/cardlist/card/ST04-002.png?260929'),
    effect: '[On Play] Play Page One',
    trigger: null,
    types: 'Animal Kingdom Pirates',
    attributes: 'Strike',
    rested: true, // Practice character starts rested so players can practice character combat
    attachedDon: 0,
    customPowerModifier: 0,
    hasBlocker: false,
    hasRush: false,
    canAttackThisTurn: false,
  };

  return {
    deckId: chosenDeck.id,
    name: chosenDeck.name,
    leaderId: chosenDeck.leaderId,
    leaderName: chosenDeck.leaderName,
    leaderImage: getEditionCardImageUrl(chosenDeck.leaderId, 'jp', chosenDeck.leaderImage),
    leaderPower: 5000,
    life,
    maxLife: life,
    attachedDon: 0,
    rested: false,
    activeDon: 3, // Matches OPlayTCG tutorial screenshot (3 active DON)
    restedDon: 0,
    donDeckCount: 7, // Matches OPlayTCG tutorial screenshot (7 remaining)
    handCount: 5,
    deckCount: 42,
    characters: [initialOpponentChar],
    trashCount: 0,
  };
}

/**
 * Initialize a new game session from a deck
 */
export function initializeGame(
  deck?: RecommendedDeck,
  goingFirst: boolean = true,
  opponentDeck?: RecommendedDeck,
  isTutorial: boolean = false
): SimGameState {
  const playerDeck = deck || ST01_STRAW_HAT_DECK;
  let instanceCounter = 1;

  // 1. Prepare Leader Card
  const leaderBaseCode = playerDeck.leaderId.split('_')[0].trim();
  const leaderDb = cardRulesDb[leaderBaseCode] || null;

  const leaderCard: SimCard = {
    instanceId: `leader-${instanceCounter++}`,
    cardId: playerDeck.leaderId,
    name: playerDeck.leaderName,
    category: 'Leader',
    colors: playerDeck.color ? playerDeck.color.split(',').map((s) => s.trim()) : ['Red'],
    cost: 0,
    power: 5000,
    counter: null,
    imageUrl: getEditionCardImageUrl(playerDeck.leaderId, 'jp', playerDeck.leaderImage),
    effect: leaderDb?.effect || 'Official Leader Card',
    trigger: null,
    types: leaderDb?.types || playerDeck.subname || null,
    attributes: leaderDb?.attributes || null,
    englishName: playerDeck.leaderName,
    englishEffect: leaderDb?.effect || null,
    rested: false,
    attachedDon: 0,
    customPowerModifier: 0,
    canAttackThisTurn: true,
  };

  // 2. Prepare 50 Main Deck Cards
  const mainDeckPool: SimCard[] = [];
  for (const item of playerDeck.cards) {
    const qty = Math.max(1, item.quantity || 1);
    for (let q = 0; q < qty; q++) {
      mainDeckPool.push(
        createSimCard(item, `card-${instanceCounter++}-${item.cardId}`, playerDeck.color || 'Red')
      );
    }
  }

  // 3. Shuffle Deck
  const shuffledDeck = shuffle(mainDeckPool);

  // 4. Deal Life Cards (based on Leader Life)
  const lifeCount = getLeaderBaseLife(playerDeck.leaderId, leaderCard.colors);
  const lifeCards = shuffledDeck.splice(0, lifeCount);

  // 5. Initial Hand:
  // If tutorial, provide the exact iconic cards from OPlayTCG tutorial:
  let initialHand: SimCard[] = [];
  if (isTutorial || playerDeck.id === 'st01-straw-hat-crew') {
    // Curated hand matching OPlayTCG: Zoro, Chopper, Brook, Karoo, Guard Point
    const tutorialCardIds = ['ST01-013', 'ST01-006', 'ST01-011', 'ST01-003', 'ST01-014'];
    for (const cid of tutorialCardIds) {
      const foundIdx = shuffledDeck.findIndex((c) => c.cardId === cid);
      if (foundIdx !== -1) {
        initialHand.push(shuffledDeck.splice(foundIdx, 1)[0]);
      }
    }
    // Fill remaining if needed
    while (initialHand.length < 5 && shuffledDeck.length > 0) {
      initialHand.push(shuffledDeck.shift()!);
    }
  } else {
    initialHand = shuffledDeck.splice(0, 5);
  }

  // 6. Setup DON!!:
  // In tutorial, matches OPlayTCG screenshot: 5 active DON in cost area, 5 in DON deck!
  const initialActiveDon = isTutorial ? 5 : (goingFirst ? 1 : 2);
  const initialDonDeckCount = 10 - initialActiveDon;

  const opponent = createDefaultOpponent(opponentDeck || ST04_ANIMAL_KINGDOM_DECK);

  const logs: GameLogEntry[] = [
    createLog(`⚓ Match started: ${playerDeck.name} vs ${opponent.name}`, 'system'),
    createLog(
      isTutorial
        ? `🎓 Tutorial Mode Active (5 Active DON!! ready to test actions)`
        : `Going ${goingFirst ? 'First (1 DON!! on Turn 1)' : 'Second (2 DON!! on Turn 1)'}`,
      'system'
    ),
    createLog(`Placed ${lifeCount} Life cards and drew 5 starting cards`, 'action'),
  ];

  return {
    leader: leaderCard,
    deck: shuffledDeck,
    hand: initialHand,
    characters: [],
    stage: null,
    life: lifeCards,
    trash: [],
    donDeckCount: initialDonDeckCount,
    activeDon: initialActiveDon,
    restedDon: 0,
    turn: isTutorial ? 2 : 1,
    goingFirst,
    phase: 'MAIN',
    hasMulliganed: false,
    mulliganOffered: !isTutorial,
    opponent,
    opponentLife: opponent.life,
    opponentPower: opponent.leaderPower,
    logs,
    tutorialMode: isTutorial,
    tutorialStepIndex: 0,
    pendingCombat: null,
    pendingTrigger: null,
    winner: null,
    isOpponentTurn: false,
  };
}

/**
 * Perform Redraw / Mulligan: shuffle current hand back into deck, draw 5 new cards
 */
export function performMulligan(state: SimGameState): SimGameState {
  if (state.hasMulliganed || !state.mulliganOffered) return state;

  const combinedDeck = shuffle([...state.deck, ...state.hand]);
  const newHand = combinedDeck.splice(0, 5);

  return {
    ...state,
    deck: combinedDeck,
    hand: newHand,
    hasMulliganed: true,
    mulliganOffered: false,
    logs: [
      ...state.logs,
      createLog('Mulligan used: returned hand, reshuffled deck, drew 5 new cards', 'action'),
    ],
  };
}

/**
 * Dismiss Mulligan modal and keep current hand
 */
export function keepInitialHand(state: SimGameState): SimGameState {
  return {
    ...state,
    mulliganOffered: false,
    logs: [...state.logs, createLog('Kept opening hand', 'action')],
  };
}

/**
 * Advance to Next Turn (Automated Refresh -> Opponent Turn -> Player Draw & DON!!)
 */
export function advanceNextTurn(state: SimGameState): SimGameState {
  const nextTurnNumber = state.turn + 1;

  // 1. REFRESH PHASE:
  // - Unrest leader, stage, characters
  // - Return all attached DON!! from field back to cost pool
  let attachedDonRecovered = 0;
  const updatedLeader = state.leader
    ? {
        ...state.leader,
        rested: false,
        attachedDon: 0,
        customPowerModifier: 0,
        canAttackThisTurn: true,
      }
    : null;
  if (state.leader?.attachedDon) {
    attachedDonRecovered += state.leader.attachedDon;
  }

  const updatedCharacters = state.characters.map((c) => {
    attachedDonRecovered += c.attachedDon;
    return {
      ...c,
      rested: false,
      attachedDon: 0,
      customPowerModifier: 0,
      canAttackThisTurn: true,
    };
  });

  const updatedStage = state.stage
    ? { ...state.stage, rested: false, customPowerModifier: 0 }
    : null;

  // Unrest all DON!! and bring back attached DON!!
  let totalActiveDon = state.activeDon + state.restedDon + attachedDonRecovered;

  // 2. DRAW PHASE:
  let updatedDeck = [...state.deck];
  const updatedHand = [...state.hand];
  let drawLog = '';

  if (updatedDeck.length > 0) {
    const drawn = updatedDeck.shift()!;
    updatedHand.push(drawn);
    drawLog = `Drew ${drawn.name}`;
  } else {
    drawLog = `⚠️ Deck is empty!`;
  }

  // 3. DON!! PHASE:
  // Add up to 2 DON!! from DON!! deck to Active Cost area (capped at 10 total DON!! in game)
  let donDeckRemaining = state.donDeckCount;
  const currentTotalInPlay = totalActiveDon;
  const maxCanAdd = Math.min(2, 10 - currentTotalInPlay, donDeckRemaining);

  if (maxCanAdd > 0) {
    donDeckRemaining -= maxCanAdd;
    totalActiveDon += maxCanAdd;
  }

  // 4. OPPONENT AI TURN SIMULATION:
  // Opponent untaps, draws, gains DON, summons character, attaches DON, and attacks
  let oppCharAttachedRecovered = 0;
  for (const c of state.opponent.characters) {
    oppCharAttachedRecovered += c.attachedDon;
  }
  const oppAttachedDonReturned = state.opponent.attachedDon;
  let oppActiveDon = state.opponent.activeDon + state.opponent.restedDon + oppAttachedDonReturned + oppCharAttachedRecovered;
  let oppRestedDon = 0;
  let oppLeaderAttachedDon = 0;
  let oppDonDeckRemaining = state.opponent.donDeckCount;
  const oppCanAdd = Math.min(2, 10 - oppActiveDon, oppDonDeckRemaining);
  oppActiveDon += oppCanAdd;
  oppDonDeckRemaining -= oppCanAdd;

  let oppHandCount = (state.opponent.handCount || 5) + 1;
  let oppDeckCount = Math.max(0, (state.opponent.deckCount || 40) - 1);

  // Untap existing characters
  let oppChars: SimCard[] = state.opponent.characters.map((c) => ({
    ...c,
    rested: false,
    attachedDon: 0,
    canAttackThisTurn: true,
  }));

  const aiLogs: GameLogEntry[] = [];
  aiLogs.push(
    createLog(`🤖 Opponent Refreshed: Drew 1 card, gained +${oppCanAdd} DON!! (Active: ${oppActiveDon})`, 'phase')
  );

  // A. SUMMON PHASE:
  // If opponent has room (< 5 characters) and active DON >= 2, play character from deck
  const oppDeckDef = RECOMMENDED_DECKS.find((d) => d.id === state.opponent.deckId) || ST04_ANIMAL_KINGDOM_DECK;
  const oppDeckChars = (oppDeckDef.cards || []).filter((c) => c.category === 'Character');

  if (oppChars.length < 5 && oppActiveDon >= 2 && oppDeckChars.length > 0) {
    const affordable = oppDeckChars
      .filter((c) => (c.cost ?? 0) <= oppActiveDon)
      .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));

    if (affordable.length > 0) {
      const chosenCard = affordable[0];
      const cost = chosenCard.cost ?? 2;
      oppActiveDon -= cost;
      oppRestedDon += cost;
      oppHandCount = Math.max(0, oppHandCount - 1);

      const newChar = createSimCard(
        chosenCard,
        `opp-char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        oppDeckDef.color || 'Purple'
      );
      newChar.canAttackThisTurn = Boolean(newChar.hasRush);
      newChar.rested = false;
      oppChars.push(newChar);

      aiLogs.push(
        createLog(`🤖 Opponent played ${chosenCard.name} (${chosenCard.power} Power) for ${cost} DON!!`, 'action')
      );
    }
  }

  // B. ATTACH DON PHASE:
  // If opponent has remaining active DON and eligible attackers, attach 1-2 DON!!
  const readyAttackers = oppChars.filter((c) => c.canAttackThisTurn && !c.rested);
  if (oppActiveDon > 0) {
    const donToAttach = Math.min(oppActiveDon, 2);
    if (readyAttackers.length > 0) {
      const bestAttacker = readyAttackers[0];
      bestAttacker.attachedDon += donToAttach;
      oppActiveDon -= donToAttach;
      aiLogs.push(
        createLog(`🤖 Opponent attached ${donToAttach} DON!! to ${bestAttacker.name} (Now ${(bestAttacker.power || 0) + bestAttacker.attachedDon * 1000} Power)`, 'action')
      );
    } else {
      oppLeaderAttachedDon += donToAttach;
      oppActiveDon -= donToAttach;
      aiLogs.push(
        createLog(`🤖 Opponent attached ${donToAttach} DON!! to Leader ${state.opponent.leaderName} (Now ${5000 + oppLeaderAttachedDon * 1000} Power)`, 'action')
      );
    }
  }

  // C. COMBAT PHASE:
  // In tutorial mode steps 1-9, opponent stays passive so the player can learn.
  // In steps 10+ or normal game, opponent attacks!
  const canAIAttack = !state.tutorialMode || state.tutorialStepIndex >= 10;
  let playerChars = [...updatedCharacters];
  let playerLife = [...state.life];
  let playerHand = [...updatedHand];
  let playerTrash = [...state.trash];
  let gameWinner: 'player' | 'opponent' | null = state.winner;
  let oppLeaderRested = false;
  let pendingCombatToHandle: PendingCombat | null = null;
  let pendingTriggerToHandle: PendingTrigger | null = null;

  if (canAIAttack && !gameWinner) {
    // 1. Character attacks:

    for (let i = 0; i < oppChars.length; i++) {
      const attacker = oppChars[i];
      if (!attacker.canAttackThisTurn || attacker.rested || gameWinner || pendingCombatToHandle) continue;

      const attackerPower = (attacker.power || 0) + attacker.attachedDon * 1000;

      // Target priority 1: Rested player character with power <= attackerPower
      const restedTargets = playerChars.filter(
        (pc) => pc.rested && ((pc.power || 0) + pc.attachedDon * 1000) <= attackerPower
      );

      if (restedTargets.length > 0) {
        const target = restedTargets[0];
        const hasBlocker = playerChars.some((pc) => pc.hasBlocker && !pc.rested && pc.instanceId !== target.instanceId);
        const hasCounterInHand = playerHand.some((c) => (c.counter || 0) > 0);

        attacker.rested = true;

        if (hasBlocker || hasCounterInHand) {
          // Pause and let player defend!
          pendingCombatToHandle = {
            attackerInstanceId: attacker.instanceId,
            attackerName: attacker.name,
            attackerImageUrl: attacker.imageUrl,
            attackerPower,
            attackerIsPlayer: false,
            targetType: 'character',
            targetInstanceId: target.instanceId,
            targetName: target.name,
            targetImageUrl: target.imageUrl,
            targetPower: (target.power || 0) + target.attachedDon * 1000,
            currentBoost: 0,
            step: hasBlocker ? 'BLOCK_STEP' : 'COUNTER_STEP',
            canBlock: hasBlocker,
            canCounter: hasCounterInHand,
          };
          aiLogs.push(
            createLog(`⚔️ Opponent's ${attacker.name} (${attackerPower} Power) declared an attack on your ${target.name}!`, 'combat')
          );
          break;
        } else {
          // Resolve immediately
          playerChars = playerChars.filter((pc) => pc.instanceId !== target.instanceId);
          playerTrash.push({ ...target, rested: false, attachedDon: 0 });
          totalActiveDon += target.attachedDon;
          aiLogs.push(
            createLog(`⚔️ Opponent's ${attacker.name} (${attackerPower} Power) attacked and K.O.'d your ${target.name}!`, 'combat')
          );
        }
      } else {
        // Target priority 2: Attack Player Leader
        const playerLeaderPower = 5000 + (updatedLeader?.attachedDon || 0) * 1000;
        if (attackerPower >= playerLeaderPower) {
          const hasBlocker = playerChars.some((pc) => pc.hasBlocker && !pc.rested);
          const hasCounterInHand = playerHand.some((c) => (c.counter || 0) > 0);

          attacker.rested = true;

          if (hasBlocker || hasCounterInHand) {
            // Pause and prompt player
            pendingCombatToHandle = {
              attackerInstanceId: attacker.instanceId,
              attackerName: attacker.name,
              attackerImageUrl: attacker.imageUrl,
              attackerPower,
              attackerIsPlayer: false,
              targetType: 'leader',
              targetInstanceId: updatedLeader?.instanceId,
              targetName: updatedLeader?.name || 'Your Leader',
              targetImageUrl: updatedLeader?.imageUrl,
              targetPower: playerLeaderPower,
              currentBoost: 0,
              step: hasBlocker ? 'BLOCK_STEP' : 'COUNTER_STEP',
              canBlock: hasBlocker,
              canCounter: hasCounterInHand,
            };
            aiLogs.push(
              createLog(`⚔️ Opponent's ${attacker.name} (${attackerPower} Power) launched an attack on your Leader!`, 'combat')
            );
            break;
          } else if (playerLife.length > 0) {
            const lostLifeCard = playerLife.shift()!;
            if (lostLifeCard.trigger) {
              pendingTriggerToHandle = {
                card: lostLifeCard,
                isPlayer: true,
                effect: lostLifeCard.trigger,
              };
              aiLogs.push(
                createLog(`✨ [TRIGGER DETECTED] Opponent's ${attacker.name} attacked your Leader! Life damage revealed ${lostLifeCard.name} (${lostLifeCard.trigger})! Choose whether to activate trigger!`, 'combat')
              );
              break;
            } else {
              playerHand.push(lostLifeCard);
              aiLogs.push(
                createLog(`💔 Opponent's ${attacker.name} (${attackerPower} Power) attacked your Leader! Took 1 Life Damage (${playerLife.length} Life left). Added ${lostLifeCard.name} to hand.`, 'combat')
              );
            }
          } else {
            gameWinner = 'opponent';
            aiLogs.push(
              createLog(`💀 Opponent's ${attacker.name} dealt the fatal blow! Opponent wins the match!`, 'combat')
            );
          }
        }
      }
    }

    // 2. Leader attack (if no pending combat triggered yet):
    if (!gameWinner && !oppLeaderRested && !pendingCombatToHandle && !pendingTriggerToHandle) {
      const oppLeaderPower = 5000 + oppLeaderAttachedDon * 1000;

      const restedTargets = playerChars.filter(
        (pc) => pc.rested && ((pc.power || 0) + pc.attachedDon * 1000) <= oppLeaderPower
      );

      if (restedTargets.length > 0) {
        const target = restedTargets[0];
        const hasBlocker = playerChars.some((pc) => pc.hasBlocker && !pc.rested && pc.instanceId !== target.instanceId);
        const hasCounterInHand = playerHand.some((c) => (c.counter || 0) > 0);

        oppLeaderRested = true;

        if (hasBlocker || hasCounterInHand) {
          pendingCombatToHandle = {
            attackerInstanceId: 'opp-leader',
            attackerName: `Leader ${state.opponent.leaderName}`,
            attackerImageUrl: state.opponent.leaderImage,
            attackerPower: oppLeaderPower,
            attackerIsPlayer: false,
            targetType: 'character',
            targetInstanceId: target.instanceId,
            targetName: target.name,
            targetImageUrl: target.imageUrl,
            targetPower: (target.power || 0) + target.attachedDon * 1000,
            currentBoost: 0,
            step: hasBlocker ? 'BLOCK_STEP' : 'COUNTER_STEP',
            canBlock: hasBlocker,
            canCounter: hasCounterInHand,
          };
          aiLogs.push(
            createLog(`⚔️ Opponent Leader ${state.opponent.leaderName} (${oppLeaderPower} Power) attacked your ${target.name}!`, 'combat')
          );
        } else {
          playerChars = playerChars.filter((pc) => pc.instanceId !== target.instanceId);
          playerTrash.push({ ...target, rested: false, attachedDon: 0 });
          totalActiveDon += target.attachedDon;
          aiLogs.push(
            createLog(`⚔️ Opponent Leader ${state.opponent.leaderName} (${oppLeaderPower} Power) attacked and K.O.'d your ${target.name}!`, 'combat')
          );
        }
      } else {
        const hasBlocker = playerChars.some((pc) => pc.hasBlocker && !pc.rested);
        const hasCounterInHand = playerHand.some((c) => (c.counter || 0) > 0);

        oppLeaderRested = true;

        if (hasBlocker || hasCounterInHand) {
          pendingCombatToHandle = {
            attackerInstanceId: 'opp-leader',
            attackerName: `Leader ${state.opponent.leaderName}`,
            attackerImageUrl: state.opponent.leaderImage,
            attackerPower: oppLeaderPower,
            attackerIsPlayer: false,
            targetType: 'leader',
            targetInstanceId: updatedLeader?.instanceId,
            targetName: updatedLeader?.name || 'Your Leader',
            targetImageUrl: updatedLeader?.imageUrl,
            targetPower: 5000 + (updatedLeader?.attachedDon || 0) * 1000,
            currentBoost: 0,
            step: hasBlocker ? 'BLOCK_STEP' : 'COUNTER_STEP',
            canBlock: hasBlocker,
            canCounter: hasCounterInHand,
          };
          aiLogs.push(
            createLog(`⚔️ Opponent Leader ${state.opponent.leaderName} (${oppLeaderPower} Power) declared an attack on your Leader!`, 'combat')
          );
        } else if (playerLife.length > 0) {
          const lostLifeCard = playerLife.shift()!;
          if (lostLifeCard.trigger) {
            pendingTriggerToHandle = {
              card: lostLifeCard,
              isPlayer: true,
              effect: lostLifeCard.trigger,
            };
            aiLogs.push(
              createLog(`✨ [TRIGGER DETECTED] Opponent Leader ${state.opponent.leaderName} attacked your Leader! Life damage revealed ${lostLifeCard.name} (${lostLifeCard.trigger})! Choose whether to activate trigger!`, 'combat')
            );
          } else {
            playerHand.push(lostLifeCard);
            aiLogs.push(
              createLog(`💔 Opponent Leader ${state.opponent.leaderName} (${oppLeaderPower} Power) attacked your Leader! Took 1 Life Damage (${playerLife.length} Life left).`, 'combat')
            );
          }
        } else {
          gameWinner = 'opponent';
          aiLogs.push(
            createLog(`💀 Opponent Leader ${state.opponent.leaderName} dealt lethal blow to your Leader! Opponent wins!`, 'combat')
          );
        }
      }
    }
  }

  const updatedOpponent: SimOpponent = {
    ...state.opponent,
    rested: oppLeaderRested,
    attachedDon: oppLeaderAttachedDon,
    activeDon: oppActiveDon,
    restedDon: oppRestedDon,
    donDeckCount: oppDonDeckRemaining,
    characters: oppChars,
    handCount: oppHandCount,
    deckCount: oppDeckCount,
  };

  const newLogs = [
    ...state.logs,
    ...aiLogs,
    createLog(`🔄 Started Turn ${nextTurnNumber} (Refreshed field, ${drawLog}, +${maxCanAdd} DON!!)`, 'phase'),
  ];

  return {
    ...state,
    turn: nextTurnNumber,
    leader: updatedLeader,
    characters: playerChars,
    stage: updatedStage,
    deck: updatedDeck,
    hand: playerHand,
    life: playerLife,
    trash: playerTrash,
    activeDon: totalActiveDon,
    restedDon: 0,
    donDeckCount: donDeckRemaining,
    phase: 'MAIN',
    mulliganOffered: false,
    opponent: updatedOpponent,
    logs: newLogs,
    pendingCombat: pendingCombatToHandle,
    pendingTrigger: pendingTriggerToHandle,
    winner: gameWinner,
  };
}

/**
 * Play a card from hand to field
 */
export function playCardFromHand(
  state: SimGameState,
  instanceId: string,
  replaceSlotIndex?: number
): SimGameState {
  const cardIndex = state.hand.findIndex((c) => c.instanceId === instanceId);
  if (cardIndex === -1) return state;

  const card = state.hand[cardIndex];
  const cost = card.cost || 0;

  if (state.activeDon < cost) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`❌ Not enough Active DON!! to play ${card.name} (Need ${cost}, have ${state.activeDon})`, 'action'),
      ],
    };
  }

  // Deduct DON!! cost
  const newActiveDon = state.activeDon - cost;
  let newRestedDon = state.restedDon + cost;
  const newHand = state.hand.filter((_, idx) => idx !== cardIndex);

  let newCharacters = [...state.characters];
  let newStage = state.stage;
  const newTrash = [...state.trash];
  let actionLog = '';

  if (card.category === 'Character') {
    // Summoning sickness: cannot attack this turn unless hasRush
    const playedChar: SimCard = {
      ...card,
      rested: false,
      attachedDon: 0,
      canAttackThisTurn: card.hasRush || false,
    };

    if (
      (newCharacters.length >= 5 && replaceSlotIndex !== undefined) ||
      (replaceSlotIndex !== undefined && replaceSlotIndex < newCharacters.length)
    ) {
      const replaceIdx = Math.max(0, Math.min(replaceSlotIndex, newCharacters.length - 1));
      const replaced = newCharacters[replaceIdx];
      const returnedDon = replaced.attachedDon || 0;
      newTrash.push({ ...replaced, rested: false, attachedDon: 0 });
      newCharacters[replaceIdx] = playedChar;
      actionLog = `Played Character ${card.name} (Cost: ${cost}), replacing ${replaced.name} to Trash${returnedDon ? ` (${returnedDon} attached DON!! returned to Cost Area)` : ''}`;
      return {
        ...state,
        activeDon: newActiveDon,
        restedDon: newRestedDon + returnedDon,
        hand: newHand,
        characters: newCharacters,
        stage: newStage,
        trash: newTrash,
        logs: [...state.logs, createLog(actionLog, 'action')],
      };
    } else {
      newCharacters.push(playedChar);
      actionLog = `Played Character ${card.name} (Cost: ${cost}${card.hasRush ? ' [Rush]' : ''})`;
    }

    // [On Play] Effects:
    if (card.cardId === 'ST01-011') {
      // Brook: Give up to 2 rested DON!! to Leader or Character
      const donToGive = Math.min(2, newRestedDon);
      if (donToGive > 0) {
        newRestedDon -= donToGive;
        // Attach to Brook or Leader
        playedChar.attachedDon += donToGive;
        actionLog += ` ✨ [On Play] Attached ${donToGive} rested DON!! to ${card.name}!`;
      }
    }
  } else if (card.category === 'Stage') {
    if (newStage) {
      newTrash.push(newStage);
      actionLog = `Played Stage ${card.name} (Cost: ${cost}), replacing ${newStage.name}`;
    } else {
      actionLog = `Played Stage ${card.name} (Cost: ${cost})`;
    }
    newStage = { ...card, rested: false, attachedDon: 0 };
  } else if (card.category === 'Event') {
    newTrash.push(card);
    actionLog = `Activated Event ${card.name} (Cost: ${cost}) -> Sent to Trash`;

    // Scripted Event Effects:
    if (card.cardId === 'ST01-015') {
      // Gum-Gum Pistol: K.O. up to 1 of opponent's characters with 6000 power or less
      const targetIdx = state.opponent.characters.findIndex(
        (c) => ((c.power || 0) + c.attachedDon * 1000) <= 6000
      );
      if (targetIdx !== -1) {
        const koTarget = state.opponent.characters[targetIdx];
        const oppChars = [...state.opponent.characters];
        oppChars.splice(targetIdx, 1);
        actionLog += ` 💥 Gum-Gum Pistol K.O.'d opponent's ${koTarget.name}!`;
        return {
          ...state,
          hand: newHand,
          characters: newCharacters,
          stage: newStage,
          trash: newTrash,
          activeDon: newActiveDon,
          restedDon: newRestedDon,
          opponent: {
            ...state.opponent,
            characters: oppChars,
            trashCount: state.opponent.trashCount + 1,
          },
          logs: [...state.logs, createLog(actionLog, 'action')],
        };
      }
    }
  } else {
    newTrash.push(card);
    actionLog = `Played ${card.name} (Cost: ${cost})`;
  }

  return {
    ...state,
    hand: newHand,
    characters: newCharacters,
    stage: newStage,
    trash: newTrash,
    activeDon: newActiveDon,
    restedDon: newRestedDon,
    logs: [...state.logs, createLog(actionLog, 'action')],
  };
}

/**
 * Attach active DON!! to target Leader or Character (+1000 Power per DON)
 */
export function attachDonToCard(
  state: SimGameState,
  targetInstanceId: string,
  amount: number = 1
): SimGameState {
  const attachCount = Math.min(Math.max(1, amount), state.activeDon);
  if (attachCount < 1) {
    return {
      ...state,
      logs: [...state.logs, createLog(`❌ No active DON!! available to attach`, 'action')],
    };
  }

  if (state.leader && state.leader.instanceId === targetInstanceId) {
    const newAttached = state.leader.attachedDon + attachCount;
    const newPower = (state.leader.power || 5000) + newAttached * 1000;
    return {
      ...state,
      activeDon: state.activeDon - attachCount,
      leader: {
        ...state.leader,
        attachedDon: newAttached,
      },
      logs: [
        ...state.logs,
        createLog(
          `Attached ${attachCount} DON!! to Leader ${state.leader.name} (Now ${newPower} Power)`,
          'action'
        ),
      ],
    };
  }

  const charIdx = state.characters.findIndex((c) => c.instanceId === targetInstanceId);
  if (charIdx !== -1) {
    const updatedChars = [...state.characters];
    const target = updatedChars[charIdx];
    const newAttached = target.attachedDon + attachCount;
    const newPower = (target.power || 0) + newAttached * 1000;
    updatedChars[charIdx] = {
      ...target,
      attachedDon: newAttached,
    };
    return {
      ...state,
      activeDon: state.activeDon - attachCount,
      characters: updatedChars,
      logs: [
        ...state.logs,
        createLog(
          `Attached ${attachCount} DON!! to ${target.name} (Now ${newPower} Power)`,
          'action'
        ),
      ],
    };
  }

  return state;
}

/**
 * Detach 1 DON!! from card and return to Active Cost area
 */
export function detachDonFromCard(
  state: SimGameState,
  targetInstanceId: string
): SimGameState {
  if (state.leader && state.leader.instanceId === targetInstanceId) {
    if (state.leader.attachedDon <= 0) return state;
    return {
      ...state,
      activeDon: state.activeDon + 1,
      leader: {
        ...state.leader,
        attachedDon: state.leader.attachedDon - 1,
      },
      logs: [
        ...state.logs,
        createLog(`Detached 1 DON!! from Leader ${state.leader.name}`, 'action'),
      ],
    };
  }

  const charIdx = state.characters.findIndex((c) => c.instanceId === targetInstanceId);
  if (charIdx !== -1) {
    const updatedChars = [...state.characters];
    const target = updatedChars[charIdx];
    if (target.attachedDon <= 0) return state;
    updatedChars[charIdx] = {
      ...target,
      attachedDon: target.attachedDon - 1,
    };
    return {
      ...state,
      activeDon: state.activeDon + 1,
      characters: updatedChars,
      logs: [
        ...state.logs,
        createLog(`Detached 1 DON!! from ${target.name}`, 'action'),
      ],
    };
  }

  return state;
}

/**
 * Toggle Rest / Active on Leader, Character, or Stage
 */
export function toggleCardRest(
  state: SimGameState,
  instanceId: string
): SimGameState {
  if (state.leader && state.leader.instanceId === instanceId) {
    const nextRest = !state.leader.rested;
    return {
      ...state,
      leader: { ...state.leader, rested: nextRest },
      logs: [
        ...state.logs,
        createLog(`${state.leader.name} set to ${nextRest ? 'RESTED ⤵' : 'ACTIVE ⬆'}`, 'action'),
      ],
    };
  }

  if (state.stage && state.stage.instanceId === instanceId) {
    const nextRest = !state.stage.rested;
    return {
      ...state,
      stage: { ...state.stage, rested: nextRest },
      logs: [
        ...state.logs,
        createLog(`Stage ${state.stage.name} set to ${nextRest ? 'RESTED ⤵' : 'ACTIVE ⬆'}`, 'action'),
      ],
    };
  }

  const charIdx = state.characters.findIndex((c) => c.instanceId === instanceId);
  if (charIdx !== -1) {
    const updated = [...state.characters];
    const nextRest = !updated[charIdx].rested;
    updated[charIdx] = { ...updated[charIdx], rested: nextRest };
    return {
      ...state,
      characters: updated,
      logs: [
        ...state.logs,
        createLog(`${updated[charIdx].name} set to ${nextRest ? 'RESTED ⤵' : 'ACTIVE ⬆'}`, 'action'),
      ],
    };
  }

  return state;
}

/**
 * Take 1 Life Damage: removes top life card and checks for [Trigger]
 */
export function takeLifeDamage(state: SimGameState): SimGameState {
  if (state.life.length === 0) {
    return {
      ...state,
      winner: 'opponent',
      logs: [...state.logs, createLog(`💀 Fatal damage taken! Opponent wins the match!`, 'combat')],
    };
  }

  const updatedLife = [...state.life];
  const topLifeCard = updatedLife.shift()!;

  // If card has an active Trigger effect, set pendingTrigger so player can choose to activate
  if (topLifeCard.trigger) {
    return {
      ...state,
      life: updatedLife,
      pendingTrigger: {
        card: topLifeCard,
        isPlayer: true,
        effect: topLifeCard.trigger,
      },
      logs: [
        ...state.logs,
        createLog(`✨ [TRIGGER DETECTED] Life damage revealed ${topLifeCard.name} (${topLifeCard.trigger})! Choose whether to activate!`, 'combat'),
      ],
    };
  }

  const updatedHand = [...state.hand, topLifeCard];

  return {
    ...state,
    life: updatedLife,
    hand: updatedHand,
    logs: [
      ...state.logs,
      createLog(`💔 Took 1 Life Damage! Added ${topLifeCard.name} to hand (${updatedLife.length} Life left).`, 'combat'),
    ],
  };
}

/**
 * Send a Character or Card to Trash (K.O. / Discard)
 */
export function sendCardToTrash(
  state: SimGameState,
  instanceId: string
): SimGameState {
  // Check Hand
  const handIdx = state.hand.findIndex((c) => c.instanceId === instanceId);
  if (handIdx !== -1) {
    const card = state.hand[handIdx];
    return {
      ...state,
      hand: state.hand.filter((_, idx) => idx !== handIdx),
      trash: [...state.trash, card],
      logs: [...state.logs, createLog(`Discarded ${card.name} to Trash`, 'action')],
    };
  }

  // Check Characters
  const charIdx = state.characters.findIndex((c) => c.instanceId === instanceId);
  if (charIdx !== -1) {
    const card = state.characters[charIdx];
    const returnedRested = card.attachedDon;
    return {
      ...state,
      characters: state.characters.filter((_, idx) => idx !== charIdx),
      restedDon: state.restedDon + returnedRested,
      trash: [...state.trash, { ...card, rested: false, attachedDon: 0 }],
      logs: [
        ...state.logs,
        createLog(`K.O.'d ${card.name} to Trash${returnedRested ? ` (${returnedRested} attached DON!! returned to Cost Area)` : ''}`, 'action'),
      ],
    };
  }

  // Check Stage
  if (state.stage && state.stage.instanceId === instanceId) {
    const stageCard = state.stage;
    return {
      ...state,
      stage: null,
      trash: [...state.trash, stageCard],
      logs: [...state.logs, createLog(`Sent Stage ${stageCard.name} to Trash`, 'action')],
    };
  }

  return state;
}

/**
 * Draw 1 card manually from Deck
 */
export function drawManualCard(state: SimGameState): SimGameState {
  if (state.deck.length === 0) {
    return {
      ...state,
      logs: [...state.logs, createLog(`⚠️ Deck is empty!`, 'action')],
    };
  }

  const updatedDeck = [...state.deck];
  const drawn = updatedDeck.shift()!;

  return {
    ...state,
    deck: updatedDeck,
    hand: [...state.hand, drawn],
    logs: [...state.logs, createLog(`Manually drew 1 card: ${drawn.name}`, 'action')],
  };
}

/**
 * Rest 1 active DON!! manually
 */
export function restActiveDonManual(state: SimGameState, amount = 1): SimGameState {
  if (state.activeDon < amount) return state;
  return {
    ...state,
    activeDon: state.activeDon - amount,
    restedDon: state.restedDon + amount,
    logs: [...state.logs, createLog(`Rested ${amount} DON!!`, 'action')],
  };
}

/**
 * Activate 1 rested DON!! manually
 */
export function activateRestedDonManual(state: SimGameState, amount = 1): SimGameState {
  if (state.restedDon < amount) return state;
  return {
    ...state,
    restedDon: state.restedDon - amount,
    activeDon: state.activeDon + amount,
    logs: [...state.logs, createLog(`Activated ${amount} DON!!`, 'action')],
  };
}

/**
 * Deal damage to Opponent Leader directly
 */
export function damageOpponent(state: SimGameState, amount = 1): SimGameState {
  const currentLife = state.opponent ? state.opponent.life : state.opponentLife;
  const newLife = Math.max(0, currentLife - amount);
  const oppName = state.opponent ? state.opponent.leaderName : 'Opponent';

  const isWin = newLife === 0 && currentLife === 0;

  return {
    ...state,
    opponent: state.opponent ? { ...state.opponent, life: newLife } : state.opponent,
    opponentLife: newLife,
    winner: isWin ? 'player' : state.winner,
    logs: [
      ...state.logs,
      createLog(
        isWin
          ? `🏆 FINAL BLOW! Dealt lethal damage to ${oppName}! YOU WIN THE MATCH!`
          : newLife === 0
          ? `💥 Dealt ${amount} damage to ${oppName}! Opponent Life is 0! (Lethal Range!)`
          : `⚔️ Dealt ${amount} damage to ${oppName}! (Opponent Life: ${newLife})`,
        'combat'
      ),
    ],
  };
}

/**
 * Heal Opponent Leader
 */
export function healOpponent(state: SimGameState, amount = 1): SimGameState {
  const currentLife = state.opponent ? state.opponent.life : state.opponentLife;
  const newLife = Math.min(10, currentLife + amount);
  return {
    ...state,
    opponent: state.opponent ? { ...state.opponent, life: newLife } : state.opponent,
    opponentLife: newLife,
    logs: [
      ...state.logs,
      createLog(`❤️ Restored ${amount} Life to Opponent Leader! (Opponent Life: ${newLife})`, 'system'),
    ],
  };
}

/**
 * Declare Attack on Opponent Leader from a Player card
 */
export function attackOpponentLeader(
  state: SimGameState,
  attackerInstanceId: string
): SimGameState {
  const isLeaderAttacking = state.leader?.instanceId === attackerInstanceId;
  const attacker = isLeaderAttacking
    ? state.leader
    : state.characters.find((c) => c.instanceId === attackerInstanceId);

  if (!attacker) return state;

  // 1. Check Turn 1 rule: Player going first cannot attack on Turn 1
  if (state.turn === 1 && state.goingFirst) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ The player going first cannot declare attacks on Turn 1!`, 'combat'),
      ],
    };
  }

  // 2. Check Rested status: A rested card cannot attack again
  if (attacker.rested) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ ${attacker.name} is already rested! A card can only attack once per turn.`, 'combat'),
      ],
    };
  }

  // 3. Check Summoning Sickness: Characters cannot attack the turn played unless they have [Rush]
  if (attacker.category === 'Character' && !attacker.canAttackThisTurn && !attacker.hasRush) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ ${attacker.name} cannot attack on the turn it was played! (Summoning Sickness)`, 'combat'),
      ],
    };
  }

  const attackerPower = (attacker.power || 0) + attacker.attachedDon * 1000 + attacker.customPowerModifier;
  let defenderPower = (state.opponent?.leaderPower ?? 5000) + (state.opponent?.attachedDon ?? 0) * 1000;

  // Rest the attacker immediately upon declaring the attack
  let updatedLeader = state.leader;
  let updatedCharacters = state.characters;

  if (isLeaderAttacking && updatedLeader) {
    updatedLeader = { ...updatedLeader, rested: true };
  } else {
    updatedCharacters = updatedCharacters.map((c) =>
      c.instanceId === attackerInstanceId ? { ...c, rested: true } : c
    );
  }

  const oppLeaderName = state.opponent ? state.opponent.leaderName : 'Opponent Leader';
  const combatLogs: GameLogEntry[] = [];
  let updatedOppChars = [...state.opponent.characters];
  let updatedOppTrash = state.opponent.trashCount;
  let currentOppLife = state.opponent ? state.opponent.life : state.opponentLife;
  let winner: 'player' | 'opponent' | null = state.winner;

  // 1. OPPONENT BLOCKER CHECK:
  // If opponent has an active blocker (e.g. Queen ST04-005) and either:
  // - Opponent life is low (<= 2) or in lethal range (life === 0), OR
  // - The blocker's power is higher than or equal to attacker power
  const activeBlockerIdx = updatedOppChars.findIndex((c) => c.hasBlocker && !c.rested);
  let blockedByOpponent = false;

  if (activeBlockerIdx !== -1 && (currentOppLife <= 2 || (updatedOppChars[activeBlockerIdx].power || 0) >= attackerPower)) {
    const oppBlocker = updatedOppChars[activeBlockerIdx];
    blockedByOpponent = true;
    // Rest the blocker
    const oppBlockerPower = (oppBlocker.power || 0) + oppBlocker.attachedDon * 1000;
    combatLogs.push(
      createLog(
        `🛡️ [OPPONENT BLOCKER] Opponent intercepted your attack on Leader with Blocker ${oppBlocker.name} (${oppBlockerPower} Power)!`,
        'combat'
      )
    );

    if (attackerPower >= oppBlockerPower) {
      // Blocker is K.O.'d
      updatedOppChars.splice(activeBlockerIdx, 1);
      updatedOppTrash += 1;
      combatLogs.push(
        createLog(
          `💥 [K.O.] ${attacker.name} (${attackerPower} Power) overpowered and K.O.'d opponent's Blocker ${oppBlocker.name}!`,
          'combat'
        )
      );
    } else {
      combatLogs.push(
        createLog(
          `🛡️ Opponent's Blocker ${oppBlocker.name} (${oppBlockerPower} Power) successfully repelled ${attacker.name}'s (${attackerPower} Power) attack!`,
          'combat'
        )
      );
    }

    return {
      ...state,
      leader: updatedLeader,
      characters: updatedCharacters,
      opponent: {
        ...state.opponent,
        characters: updatedOppChars,
        trashCount: updatedOppTrash,
      },
      winner,
      logs: [...state.logs, ...combatLogs],
    };
  }

  // 2. OPPONENT COUNTER AI:
  // If opponent has cards in hand and power gap is small (+1000 or +2000), opponent can counter
  let oppBoost = 0;
  if (state.opponent.handCount > 0 && attackerPower > defenderPower && attackerPower <= defenderPower + 2000 && currentOppLife <= 1) {
    oppBoost = 2000;
    combatLogs.push(
      createLog(`⚡ [OPPONENT COUNTER] Opponent discarded a +2000 Counter card from hand to protect Leader ${oppLeaderName}!`, 'combat')
    );
  }

  const finalDefenderPower = defenderPower + oppBoost;
  const hitSuccess = attackerPower >= finalDefenderPower;

  if (hitSuccess) {
    if (currentOppLife === 0) {
      winner = 'player';
      combatLogs.push(
        createLog(`🏆 VICTORY! ${attacker.name} (${attackerPower} Power) landed the fatal blow on ${oppLeaderName}! YOU WON THE MATCH!`, 'combat')
      );
    } else {
      currentOppLife = Math.max(0, currentOppLife - 1);
      combatLogs.push(
        createLog(
          currentOppLife === 0
            ? `💥 ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${finalDefenderPower} Power) — DIRECT HIT! Opponent Life is 0 (Lethal Range)!`
            : `⚔️ ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${finalDefenderPower} Power) — DIRECT HIT! ${oppLeaderName} takes 1 damage (${currentOppLife} Life left).`,
          'combat'
        )
      );
    }
  } else {
    combatLogs.push(
      createLog(
        `🛡️ ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${finalDefenderPower} Power) — INSUFFICIENT POWER! Attack failed.`,
        'combat'
      )
    );
  }

  return {
    ...state,
    leader: updatedLeader,
    characters: updatedCharacters,
    opponent: {
      ...state.opponent,
      life: currentOppLife,
      characters: updatedOppChars,
      trashCount: updatedOppTrash,
      handCount: Math.max(0, state.opponent.handCount - (oppBoost > 0 ? 1 : 0)),
    },
    opponentLife: currentOppLife,
    winner,
    logs: [...state.logs, ...combatLogs],
  };
}

/**
 * Declare Attack on Rested Opponent Character
 */
export function attackOpponentCharacter(
  state: SimGameState,
  attackerInstanceId: string,
  targetCharInstanceId: string
): SimGameState {
  const isLeaderAttacking = state.leader?.instanceId === attackerInstanceId;
  const attacker = isLeaderAttacking
    ? state.leader
    : state.characters.find((c) => c.instanceId === attackerInstanceId);

  const target = state.opponent.characters.find((c) => c.instanceId === targetCharInstanceId);

  if (!attacker || !target) return state;

  // 1. Check Turn 1 rule
  if (state.turn === 1 && state.goingFirst) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ The player going first cannot declare attacks on Turn 1!`, 'combat'),
      ],
    };
  }

  // 2. Check Attacker Rested status
  if (attacker.rested) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ ${attacker.name} is already rested and cannot attack again this turn!`, 'combat'),
      ],
    };
  }

  // 3. Check Summoning Sickness
  if (attacker.category === 'Character' && !attacker.canAttackThisTurn && !attacker.hasRush) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ ${attacker.name} cannot attack on the turn it was played! (Summoning Sickness)`, 'combat'),
      ],
    };
  }

  // 4. Official Rule: Opponent Character MUST be RESTED to be targeted for attack!
  if (!target.rested) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ Cannot attack ${target.name}! You can only attack an opponent's Character if it is RESTED!`, 'combat'),
      ],
    };
  }

  const attackerPower = (attacker.power || 0) + attacker.attachedDon * 1000 + attacker.customPowerModifier;
  const defenderPower = (target.power || 0) + target.attachedDon * 1000;

  // Rest the attacker immediately
  let updatedLeader = state.leader;
  let updatedCharacters = state.characters;

  if (isLeaderAttacking && updatedLeader) {
    updatedLeader = { ...updatedLeader, rested: true };
  } else {
    updatedCharacters = updatedCharacters.map((c) =>
      c.instanceId === attackerInstanceId ? { ...c, rested: true } : c
    );
  }

  let updatedOppChars = [...state.opponent.characters];
  let updatedOppTrash = state.opponent.trashCount;
  const combatLogs: GameLogEntry[] = [];

  // Check if opponent has an active blocker to protect the rested character
  // AI blocks if target is high value (e.g. King ST04-004 or cost >= 5) and blocker power >= attackerPower
  const activeBlockerIdx = updatedOppChars.findIndex(
    (c) => c.hasBlocker && !c.rested && c.instanceId !== targetCharInstanceId
  );

  if (activeBlockerIdx !== -1 && (target.cost >= 4 && (updatedOppChars[activeBlockerIdx].power || 0) >= attackerPower)) {
    const oppBlocker = updatedOppChars[activeBlockerIdx];
    const oppBlockerPower = (oppBlocker.power || 0) + oppBlocker.attachedDon * 1000;
    combatLogs.push(
      createLog(
        `🛡️ [OPPONENT BLOCKER] Opponent intercepted your attack on ${target.name} with Blocker ${oppBlocker.name} (${oppBlockerPower} Power)!`,
        'combat'
      )
    );

    if (attackerPower >= oppBlockerPower) {
      const returnedDon = oppBlocker.attachedDon || 0;
      updatedOppChars.splice(activeBlockerIdx, 1);
      updatedOppTrash += 1;
      combatLogs.push(
        createLog(
          `💥 [K.O.] ${attacker.name} (${attackerPower} Power) K.O.'d opponent's Blocker ${oppBlocker.name}!${returnedDon ? ` (${returnedDon} DON returned to cost area)` : ''}`,
          'combat'
        )
      );
    } else {
      combatLogs.push(
        createLog(
          `🛡️ Opponent's Blocker ${oppBlocker.name} (${oppBlockerPower} Power) repelled ${attacker.name}'s (${attackerPower} Power) attack!`,
          'combat'
        )
      );
    }
  } else {
    const hitSuccess = attackerPower >= defenderPower;
    if (hitSuccess) {
      const returnedDon = target.attachedDon || 0;
      updatedOppChars = updatedOppChars.filter((c) => c.instanceId !== targetCharInstanceId);
      updatedOppTrash += 1;
      combatLogs.push(
        createLog(
          `💥 K.O.! ${attacker.name} (${attackerPower} Power) attacked and destroyed ${target.name} (${defenderPower} Power)!${returnedDon ? ` (${returnedDon} DON returned to cost area)` : ''}`,
          'combat'
        )
      );
    } else {
      combatLogs.push(
        createLog(
          `🛡️ ${attacker.name} (${attackerPower} Power) attacked ${target.name} (${defenderPower} Power) — Attack failed!`,
          'combat'
        )
      );
    }
  }

  return {
    ...state,
    leader: updatedLeader,
    characters: updatedCharacters,
    opponent: {
      ...state.opponent,
      characters: updatedOppChars,
      trashCount: updatedOppTrash,
    },
    logs: [...state.logs, ...combatLogs],
  };
}

/**
 * Switch Opponent Leader & Deck
 */
export function switchOpponent(
  state: SimGameState,
  opponentDeck: RecommendedDeck
): SimGameState {
  const newOpponent = createDefaultOpponent(opponentDeck);
  return {
    ...state,
    opponent: newOpponent,
    opponentLife: newOpponent.life,
    opponentPower: newOpponent.leaderPower,
    logs: [
      ...state.logs,
      createLog(`⚓ Switched practice opponent to ${newOpponent.name} (${newOpponent.leaderName})`, 'system'),
    ],
  };
}

/**
 * Jump to or set specific tutorial step
 */
export function setTutorialStep(state: SimGameState, stepIndex: number): SimGameState {
  return {
    ...state,
    tutorialMode: true,
    tutorialStepIndex: Math.max(0, Math.min(stepIndex, 7)),
  };
}

/**
 * Toggle Tutorial Mode on / off
 */
export function toggleTutorialMode(state: SimGameState, enabled?: boolean): SimGameState {
  const nextMode = enabled !== undefined ? enabled : !state.tutorialMode;
  return {
    ...state,
    tutorialMode: nextMode,
    logs: [
      ...state.logs,
      createLog(nextMode ? '🎓 Interactive Tutorial enabled' : '⚔️ Tutorial disabled — Free Play mode', 'system'),
    ],
  };
}

/**
 * Activate a Blocker in response to an attack:
 * Rests the blocker card, re-targets attack to the blocker, and transitions to COUNTER_STEP.
 */
export function activateBlocker(
  state: SimGameState,
  blockerInstanceId: string
): SimGameState {
  if (!state.pendingCombat) return state;

  const blockerIdx = state.characters.findIndex(
    (c) => c.instanceId === blockerInstanceId && c.hasBlocker && !c.rested
  );
  if (blockerIdx === -1) return state;

  const blocker = state.characters[blockerIdx];
  const updatedChars = [...state.characters];
  updatedChars[blockerIdx] = { ...blocker, rested: true };

  const blockerPower = (blocker.power || 0) + blocker.attachedDon * 1000;

  const updatedCombat: PendingCombat = {
    ...state.pendingCombat,
    targetType: 'character',
    targetInstanceId: blocker.instanceId,
    targetName: blocker.name,
    targetImageUrl: blocker.imageUrl,
    targetPower: blockerPower,
    blockedBy: blocker,
    step: 'COUNTER_STEP',
    canBlock: false,
  };

  return {
    ...state,
    characters: updatedChars,
    pendingCombat: updatedCombat,
    logs: [
      ...state.logs,
      createLog(`🛡️ [BLOCKER ACTIVATED] ${blocker.name} (${blockerPower} Power) stepped forward and redirected the attack!`, 'combat'),
    ],
  };
}

/**
 * Skip/Pass Blocker step and proceed directly to Counter step
 */
export function passBlockerStep(state: SimGameState): SimGameState {
  if (!state.pendingCombat) return state;
  return {
    ...state,
    pendingCombat: {
      ...state.pendingCombat,
      step: 'COUNTER_STEP',
      canBlock: false,
    },
    logs: [
      ...state.logs,
      createLog(`Passed Blocker step. Proceeding to Counter step...`, 'combat'),
    ],
  };
}

/**
 * Apply Counter from Hand:
 * Discards a card with Counter value (+1000 / +2000) or Counter Event to boost defender power.
 */
export function applyCounterFromHand(
  state: SimGameState,
  cardInstanceId: string
): SimGameState {
  if (!state.pendingCombat) return state;

  const cardIdx = state.hand.findIndex((c) => c.instanceId === cardInstanceId);
  if (cardIdx === -1) return state;

  const card = state.hand[cardIdx];
  const counterVal = card.counter || 0;
  if (counterVal <= 0) return state;

  const newHand = state.hand.filter((_, idx) => idx !== cardIdx);
  const newTrash = [...state.trash, card];
  const newBoost = state.pendingCombat.currentBoost + counterVal;
  const usedCounters = [...(state.pendingCombat.usedCounters || []), card];

  const updatedCombat: PendingCombat = {
    ...state.pendingCombat,
    currentBoost: newBoost,
    usedCounters,
  };

  return {
    ...state,
    hand: newHand,
    trash: newTrash,
    pendingCombat: updatedCombat,
    logs: [
      ...state.logs,
      createLog(`⚡ [COUNTER DISCARD] Played ${card.name} (+${counterVal} Counter). Defender power is now ${updatedCombat.targetPower + newBoost}!`, 'combat'),
    ],
  };
}

/**
 * Resolve Pending Combat (Damage Step):
 * Evaluates Attacker Power vs Defender Power (Base + Attached DON + Counter Boost).
 * If Attacker >= Defender: Deals damage (Life damage or Character KO).
 * If Defender > Attacker: Attack repelled!
 */
export function resolvePendingCombat(state: SimGameState): SimGameState {
  if (!state.pendingCombat) return state;

  const combat = state.pendingCombat;
  const totalDefenderPower = combat.targetPower + combat.currentBoost;
  const isHitSuccessful = combat.attackerPower >= totalDefenderPower;

  let playerChars = [...state.characters];
  let playerLife = [...state.life];
  let playerHand = [...state.hand];
  let playerTrash = [...state.trash];
  let totalActiveDon = state.activeDon;
  let winner: 'player' | 'opponent' | null = state.winner;

  const newLogs: GameLogEntry[] = [...state.logs];

  if (!isHitSuccessful) {
    // Attack repelled!
    newLogs.push(
      createLog(
        `🛡️ [COUNTER SUCCESSFUL] ${combat.targetName} (${totalDefenderPower} Power with +${combat.currentBoost} Counter) repelled ${combat.attackerName}'s (${combat.attackerPower} Power) attack!`,
        'combat'
      )
    );
  } else {
    // Hit lands!
    if (combat.targetType === 'character' && combat.targetInstanceId) {
      const charIdx = playerChars.findIndex((c) => c.instanceId === combat.targetInstanceId);
      if (charIdx !== -1) {
        const koCard = playerChars[charIdx];
        playerChars.splice(charIdx, 1);
        playerTrash.push({ ...koCard, rested: false, attachedDon: 0 });
        totalActiveDon += koCard.attachedDon;
        newLogs.push(
          createLog(
            `💥 [K.O.] ${combat.attackerName} (${combat.attackerPower} Power) overpowered ${combat.targetName} (${totalDefenderPower} Power). ${combat.targetName} was K.O.'d to Trash!`,
            'combat'
          )
        );
      }
    } else {
      // Leader damage
      if (playerLife.length > 0) {
        const topLife = playerLife.shift()!;
        if (topLife.trigger) {
          // Trigger flow: prompt player whether to activate
          return {
            ...state,
            characters: playerChars,
            life: playerLife,
            trash: playerTrash,
            activeDon: totalActiveDon,
            pendingCombat: null,
            winner,
            pendingTrigger: {
              card: topLife,
              isPlayer: true,
              effect: topLife.trigger,
            },
            logs: [
              ...newLogs,
              createLog(`✨ [TRIGGER ACTIVATED] Life damage revealed ${topLife.name} (${topLife.trigger})! Choose whether to activate trigger!`, 'combat'),
            ],
          };
        } else {
          playerHand.push(topLife);
          newLogs.push(
            createLog(
              `💔 [DAMAGE TAKEN] ${combat.attackerName} (${combat.attackerPower} Power) struck ${combat.targetName}! Lost 1 Life card (${topLife.name} added to hand, ${playerLife.length} Life left).`,
              'combat'
            )
          );
        }
      } else {
        winner = 'opponent';
        newLogs.push(
          createLog(
            `💀 [LETHAL DAMAGE] ${combat.attackerName} delivered the finishing blow to your Leader! Opponent wins the match!`,
            'combat'
          )
        );
      }
    }
  }

  return {
    ...state,
    characters: playerChars,
    life: playerLife,
    hand: playerHand,
    trash: playerTrash,
    activeDon: totalActiveDon,
    pendingCombat: null,
    winner,
    logs: newLogs,
  };
}

/**
 * Activate the revealed Trigger card effect.
 * If Character with "Play this card", plays it onto the field if < 5 characters.
 * If Event card, executes effect and places in Trash.
 */
export function activateTriggerEffect(state: SimGameState): SimGameState {
  if (!state.pendingTrigger) return state;

  const trigger = state.pendingTrigger;
  const card = trigger.card;
  const effectText = trigger.effect;
  const newLogs: GameLogEntry[] = [...state.logs];

  // If it's a character card that says "Play this card"
  if (card.category === 'Character') {
    if (state.characters.length < 5) {
      const playedChar: SimCard = {
        ...card,
        rested: false,
        attachedDon: 0,
        customPowerModifier: 0,
        canAttackThisTurn: false, // Summoning sickness
      };
      newLogs.push(
        createLog(`⚡ [TRIGGER PLAYED] Played Character ${card.name} (${card.power} Power) directly to the field via Trigger!`, 'combat')
      );
      return {
        ...state,
        characters: [...state.characters, playedChar],
        pendingTrigger: null,
        logs: newLogs,
      };
    } else {
      // Field is full, goes to trash
      newLogs.push(
        createLog(`⚡ [TRIGGER FIRED] Field is full (5/5 characters)! ${card.name} sent to Trash.`, 'combat')
      );
      return {
        ...state,
        trash: [...state.trash, card],
        pendingTrigger: null,
        logs: newLogs,
      };
    }
  }

  // Event trigger: Gum-Gum Pistol / Guard Point / Jet Pistol etc.
  // KO opponent character if effect says K.O. or power reduction
  let updatedOppChars = [...state.opponent.characters];
  let oppTrashCount = state.opponent.trashCount;

  if (effectText.toLowerCase().includes('k.o.') || effectText.toLowerCase().includes('ko')) {
    // Attempt to K.O. lowest/eligible opponent character
    if (updatedOppChars.length > 0) {
      // Find candidate: e.g. lowest cost or <= 5000 power
      const koTarget = updatedOppChars[0];
      updatedOppChars.splice(0, 1);
      oppTrashCount += 1;
      newLogs.push(
        createLog(`⚡ [TRIGGER EFFECT] ${card.name} Trigger activated: K.O.'d opponent's ${koTarget.name}!`, 'combat')
      );
    } else {
      newLogs.push(
        createLog(`⚡ [TRIGGER EFFECT] ${card.name} Trigger activated! No opponent characters to target.`, 'combat')
      );
    }
  } else {
    newLogs.push(
      createLog(`⚡ [TRIGGER EFFECT] ${card.name} Trigger activated: "${effectText}"! Card moved to Trash.`, 'combat')
    );
  }

  return {
    ...state,
    trash: [...state.trash, card],
    opponent: {
      ...state.opponent,
      characters: updatedOppChars,
      trashCount: oppTrashCount,
    },
    pendingTrigger: null,
    logs: newLogs,
  };
}

/**
 * Decline/Dismiss Trigger: Player chooses to put the card into hand instead of triggering.
 */
export function dismissTriggerEffect(state: SimGameState): SimGameState {
  if (!state.pendingTrigger) return state;

  const card = state.pendingTrigger.card;
  return {
    ...state,
    hand: [...state.hand, card],
    pendingTrigger: null,
    logs: [
      ...state.logs,
      createLog(`📥 Kept Trigger card ${card.name} in hand instead of activating.`, 'action'),
    ],
  };
}

