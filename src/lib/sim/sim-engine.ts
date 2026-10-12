/**
 * sim-engine.ts
 * Core game state manager and action reducers for the One Piece TCG Simulator.
 * Implements official Bandai rules: 5 Phases, DON!! mechanics, combat, blockers, triggers, and AI turns.
 */

import { SimCard, SimGameState, GameLogEntry, SimOpponent, PendingCombat } from './sim-types';
import { RecommendedDeck, DeckCardItem } from '../recommended-decks';
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
function createSimCard(
  item: DeckCardItem,
  instanceId: string,
  defaultColor = 'Red'
): SimCard {
  const isBlocker = item.name.toLowerCase().includes('chopper') ||
    item.name.toLowerCase().includes('queen') ||
    item.name.toLowerCase().includes('killer') ||
    item.cardId === 'ST01-006' ||
    item.cardId === 'ST04-005';

  const isRush = item.cardId === 'ST01-012' ||
    (item.name.toLowerCase().includes('zoro') && (item.cost || 0) <= 3) ||
    item.cardId === 'ST04-003';

  // Extract counter value (+1000 or +2000)
  let counterVal: number | null = null;
  if (item.category === 'Character') {
    if (item.power && item.power <= 2000) counterVal = 1000;
    else if (item.cost === 1 || item.cost === 2) counterVal = 1000;
  }
  if (item.cardId === 'ST01-002' || item.cardId === 'ST01-003' || item.cardId === 'ST01-007' || item.cardId === 'ST01-008' || item.cardId === 'ST01-009' || item.cardId === 'ST01-010') {
    counterVal = 1000;
  }
  if (item.cardId === 'ST04-002') counterVal = 2000;
  if (item.cardId === 'ST04-005' || item.cardId === 'ST04-006' || item.cardId === 'ST04-007' || item.cardId === 'ST04-008' || item.cardId === 'ST04-011') {
    counterVal = 1000;
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
    effect: isBlocker ? '[Blocker]' : isRush ? '[Rush]' : null,
    trigger: item.cardId === 'ST01-015' ? '[Trigger] K.O. up to 1 of your opponent\'s Characters with 5000 power or less.' : null,
    types: null,
    attributes: null,
    rested: false,
    attachedDon: 0,
    customPowerModifier: 0,
    hasBlocker: isBlocker,
    hasRush: isRush,
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
    effect: 'Official Leader Card',
    trigger: null,
    types: playerDeck.subname,
    attributes: null,
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
  // Opponent untaps, draws, gains DON, and may attack or pass
  const oppAttachedDonReturned = state.opponent.attachedDon;
  let oppActiveDon = state.opponent.activeDon + state.opponent.restedDon + oppAttachedDonReturned;
  let oppDonDeckRemaining = state.opponent.donDeckCount;
  const oppCanAdd = Math.min(2, 10 - oppActiveDon, oppDonDeckRemaining);
  oppActiveDon += oppCanAdd;
  oppDonDeckRemaining -= oppCanAdd;

  const oppChars = state.opponent.characters.map((c) => ({
    ...c,
    rested: false,
    attachedDon: 0,
    canAttackThisTurn: true,
  }));

  const updatedOpponent: SimOpponent = {
    ...state.opponent,
    rested: false,
    attachedDon: 0,
    activeDon: oppActiveDon,
    restedDon: 0,
    donDeckCount: oppDonDeckRemaining,
    characters: oppChars,
  };

  const newLogs = [
    ...state.logs,
    createLog(`🔄 Started Turn ${nextTurnNumber} (Refreshed field, ${drawLog}, +${maxCanAdd} DON!!)`, 'phase'),
  ];

  return {
    ...state,
    turn: nextTurnNumber,
    leader: updatedLeader,
    characters: updatedCharacters,
    stage: updatedStage,
    deck: updatedDeck,
    hand: updatedHand,
    activeDon: totalActiveDon,
    restedDon: 0,
    donDeckCount: donDeckRemaining,
    phase: 'MAIN',
    mulliganOffered: false,
    opponent: updatedOpponent,
    logs: newLogs,
    pendingCombat: null,
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
  const newRestedDon = state.restedDon + cost;
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

    if (newCharacters.length >= 5) {
      const replaceIdx = replaceSlotIndex !== undefined && replaceSlotIndex >= 0 ? replaceSlotIndex : 0;
      const replaced = newCharacters[replaceIdx];
      newTrash.push({ ...replaced, rested: false, attachedDon: 0 });
      newCharacters[replaceIdx] = playedChar;
      actionLog = `Played Character ${card.name} (Cost: ${cost}), sending ${replaced.name} to Trash`;
    } else {
      newCharacters.push(playedChar);
      actionLog = `Played Character ${card.name} (Cost: ${cost}${card.hasRush ? ' [Rush]' : ''})`;
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
 * Attach 1 active DON!! to target Leader or Character (+1000 Power)
 */
export function attachDonToCard(
  state: SimGameState,
  targetInstanceId: string
): SimGameState {
  if (state.activeDon < 1) {
    return {
      ...state,
      logs: [...state.logs, createLog(`❌ No active DON!! available to attach`, 'action')],
    };
  }

  if (state.leader && state.leader.instanceId === targetInstanceId) {
    return {
      ...state,
      activeDon: state.activeDon - 1,
      leader: {
        ...state.leader,
        attachedDon: state.leader.attachedDon + 1,
      },
      logs: [
        ...state.logs,
        createLog(`Attached 1 DON!! to Leader ${state.leader.name} (Now ${(state.leader.power || 5000) + (state.leader.attachedDon + 1) * 1000} Power)`, 'action'),
      ],
    };
  }

  const charIdx = state.characters.findIndex((c) => c.instanceId === targetInstanceId);
  if (charIdx !== -1) {
    const updatedChars = [...state.characters];
    const target = updatedChars[charIdx];
    updatedChars[charIdx] = {
      ...target,
      attachedDon: target.attachedDon + 1,
    };
    return {
      ...state,
      activeDon: state.activeDon - 1,
      characters: updatedChars,
      logs: [
        ...state.logs,
        createLog(`Attached 1 DON!! to ${target.name} (Now ${(target.power || 0) + (target.attachedDon + 1) * 1000} Power)`, 'action'),
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
 * Take 1 Life Damage: removes top life card and adds to hand (checking Trigger)
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
  const updatedHand = [...state.hand, topLifeCard];

  const triggerNote = topLifeCard.trigger ? ` [TRIGGER REVEALED: ${topLifeCard.trigger}]` : '';

  return {
    ...state,
    life: updatedLife,
    hand: updatedHand,
    logs: [
      ...state.logs,
      createLog(`💔 Took 1 Life Damage! Added ${topLifeCard.name} to hand (${updatedLife.length} Life left)${triggerNote}`, 'combat'),
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
  const defenderPower = (state.opponent?.leaderPower ?? 5000) + (state.opponent?.attachedDon ?? 0) * 1000;

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

  const hitSuccess = attackerPower >= defenderPower;
  const currentOppLife = state.opponent ? state.opponent.life : state.opponentLife;

  // WIN CHECK: If opponent has 0 life and takes a successful hit, player WINS!
  let winner: 'player' | 'opponent' | null = state.winner;
  let newOppLife = currentOppLife;

  if (hitSuccess) {
    if (currentOppLife === 0) {
      winner = 'player';
    } else {
      newOppLife = Math.max(0, currentOppLife - 1);
    }
  }

  const oppLeaderName = state.opponent ? state.opponent.leaderName : 'Opponent Leader';

  const logEntry = hitSuccess
    ? createLog(
        winner === 'player'
          ? `🏆 VICTORY! ${attacker.name} (${attackerPower} Power) landed the fatal blow on ${oppLeaderName}! YOU WON THE MATCH!`
          : newOppLife === 0
          ? `💥 ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${defenderPower} Power) — DIRECT HIT! Opponent Life is 0 (Lethal Range)!`
          : `⚔️ ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${defenderPower} Power) — DIRECT HIT! ${oppLeaderName} takes 1 damage (${newOppLife} Life left).`,
        'combat'
      )
    : createLog(
        `🛡️ ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${defenderPower} Power) — INSUFFICIENT POWER! Attack failed.`,
        'combat'
      );

  return {
    ...state,
    leader: updatedLeader,
    characters: updatedCharacters,
    opponent: state.opponent ? { ...state.opponent, life: newOppLife } : state.opponent,
    opponentLife: newOppLife,
    winner,
    logs: [...state.logs, logEntry],
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

  const hitSuccess = attackerPower >= defenderPower;
  let updatedOppChars = state.opponent.characters;
  let updatedOppTrash = state.opponent.trashCount;

  if (hitSuccess) {
    // Character K.O.'d!
    updatedOppChars = updatedOppChars.filter((c) => c.instanceId !== targetCharInstanceId);
    updatedOppTrash += 1;
  }

  const logEntry = hitSuccess
    ? createLog(
        `💥 K.O.! ${attacker.name} (${attackerPower} Power) attacked and destroyed ${target.name} (${defenderPower} Power)!`,
        'combat'
      )
    : createLog(
        `🛡️ ${attacker.name} (${attackerPower} Power) attacked ${target.name} (${defenderPower} Power) — Attack failed!`,
        'combat'
      );

  return {
    ...state,
    leader: updatedLeader,
    characters: updatedCharacters,
    opponent: {
      ...state.opponent,
      characters: updatedOppChars,
      trashCount: updatedOppTrash,
    },
    logs: [...state.logs, logEntry],
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
