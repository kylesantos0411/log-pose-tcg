/**
 * sim-engine.ts
 * Core game state manager and action reducers for the One Piece TCG Simulator.
 */

import { SimCard, SimGameState, GameLogEntry, SimOpponent } from './sim-types';
import { RecommendedDeck, DeckCardItem } from '../recommended-decks';
import { getEditionCardImageUrl } from '../card-image';

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
 * Build an Opponent object from a RecommendedDeck
 */
export function createDefaultOpponent(deck?: RecommendedDeck): SimOpponent {
  if (deck) {
    const colors = deck.color ? deck.color.split(',').map((s) => s.trim()) : ['Red'];
    const life = getLeaderBaseLife(deck.leaderId, colors);
    return {
      deckId: deck.id,
      name: deck.name,
      leaderId: deck.leaderId,
      leaderName: deck.leaderName,
      leaderImage: getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage),
      leaderPower: 5000,
      life,
      maxLife: life,
      attachedDon: 0,
      rested: false,
      handCount: 5,
      deckCount: 45,
      characters: [],
      trashCount: 0,
    };
  }

  // Straw Hat Luffy practice dummy opponent
  return {
    deckId: 'default-luffy',
    name: '(Red) Monkey.D.Luffy',
    leaderId: 'ST01-001',
    leaderName: 'Monkey.D.Luffy',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/st01/10001.jpg',
    leaderPower: 5000,
    life: 5,
    maxLife: 5,
    attachedDon: 0,
    rested: false,
    handCount: 5,
    deckCount: 45,
    characters: [],
    trashCount: 0,
  };
}

/**
 * Initialize a new game session from a deck
 */
export function initializeGame(
  deck: RecommendedDeck,
  goingFirst: boolean = true,
  opponentDeck?: RecommendedDeck
): SimGameState {
  let instanceCounter = 1;

  // 1. Prepare Leader Card
  const leaderCard: SimCard = {
    instanceId: `leader-${instanceCounter++}`,
    cardId: deck.leaderId,
    name: deck.leaderName,
    category: 'Leader',
    colors: deck.color ? deck.color.split(',').map((s) => s.trim()) : ['Red'],
    cost: 0,
    power: 5000,
    counter: null,
    imageUrl: getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage),
    effect: 'Official Leader Card',
    trigger: null,
    types: deck.subname,
    attributes: null,
    rested: false,
    attachedDon: 0,
    customPowerModifier: 0,
  };

  // 2. Prepare 50 Main Deck Cards
  const mainDeckPool: SimCard[] = [];
  for (const item of deck.cards) {
    const qty = Math.max(1, item.quantity || 1);
    for (let q = 0; q < qty; q++) {
      mainDeckPool.push({
        instanceId: `card-${instanceCounter++}-${item.cardId}`,
        cardId: item.cardId,
        name: item.name,
        category: (item.category as any) || 'Character',
        colors: typeof item.colors === 'string'
          ? item.colors.split(',').map((s) => s.trim())
          : deck.color
          ? deck.color.split(',').map((s) => s.trim())
          : ['Red'],
        cost: item.cost ?? 1,
        power: item.power ?? 0,
        counter: null, // default, inspector will enrich if needed
        imageUrl: getEditionCardImageUrl(item.cardId, 'jp', item.imageUrl),
        effect: null,
        trigger: null,
        types: null,
        attributes: null,
        rested: false,
        attachedDon: 0,
        customPowerModifier: 0,
      });
    }
  }

  // 3. Shuffle Deck
  const shuffledDeck = shuffle(mainDeckPool);

  // 4. Deal Life Cards (based on Leader Life)
  const lifeCount = getLeaderBaseLife(deck.leaderId, leaderCard.colors);
  const lifeCards = shuffledDeck.splice(0, lifeCount);

  // 5. Draw Initial 5-card Hand
  const initialHand = shuffledDeck.splice(0, 5);

  // 6. Setup DON!! on Turn 1
  // Player going 1st gets 1 active DON!!; Player going 2nd gets 2 active DON!!
  const initialDonGiven = goingFirst ? 1 : 2;
  const initialDonDeckCount = 10 - initialDonGiven;

  const opponent = createDefaultOpponent(opponentDeck);

  const logs: GameLogEntry[] = [
    createLog(`⚓ Match started: ${deck.name} vs ${opponent.name}`, 'system'),
    createLog(`Going ${goingFirst ? 'First (1 DON!! on Turn 1)' : 'Second (2 DON!! on Turn 1)'}`, 'system'),
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
    activeDon: initialDonGiven,
    restedDon: 0,
    turn: 1,
    goingFirst,
    phase: 'MAIN',
    hasMulliganed: false,
    mulliganOffered: true,
    opponent,
    opponentLife: opponent.life,
    opponentPower: opponent.leaderPower,
    logs,
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
 * Advance to Next Turn (Automated Refresh -> Draw -> DON!! -> Main)
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
    drawLog = `⚠️ Deck is empty! (No card drawn)`;
  }

  // 3. DON!! PHASE:
  // Add up to 2 DON!! from DON!! deck to Active Cost area (capped at 10 total DON!! in game)
  let donDeckRemaining = state.donDeckCount;
  const currentTotalInPlay = totalActiveDon; // all DON!! currently in cost area
  const maxCanAdd = Math.min(2, 10 - currentTotalInPlay, donDeckRemaining);

  if (maxCanAdd > 0) {
    donDeckRemaining -= maxCanAdd;
    totalActiveDon += maxCanAdd;
  }

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
    logs: newLogs,
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
    if (newCharacters.length >= 5) {
      // Slot is full: replace chosen slot or oldest
      const replaceIdx = replaceSlotIndex !== undefined && replaceSlotIndex >= 0 ? replaceSlotIndex : 0;
      const replaced = newCharacters[replaceIdx];
      newTrash.push({ ...replaced, rested: false, attachedDon: 0 });
      newCharacters[replaceIdx] = { ...card, rested: false, attachedDon: 0 };
      actionLog = `Played Character ${card.name} (Cost: ${cost}), sending ${replaced.name} to Trash`;
    } else {
      newCharacters.push({ ...card, rested: false, attachedDon: 0 });
      actionLog = `Played Character ${card.name} (Cost: ${cost})`;
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
    // Other
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
 * Attach 1 active DON!! to target Leader or Character
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
        createLog(`Attached 1 DON!! to Leader ${state.leader.name} (Now +${(state.leader.attachedDon + 1) * 1000} Power)`, 'action'),
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
        createLog(`Attached 1 DON!! to ${target.name} (Now +${(target.attachedDon + 1) * 1000} Power)`, 'action'),
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
 * Take 1 Life Damage: removes top life card and adds to hand
 */
export function takeLifeDamage(state: SimGameState): SimGameState {
  if (state.life.length === 0) {
    return {
      ...state,
      logs: [...state.logs, createLog(`⚠️ No life cards remaining! Next hit is fatal!`, 'combat')],
    };
  }

  const updatedLife = [...state.life];
  const topLifeCard = updatedLife.shift()!;
  const updatedHand = [...state.hand, topLifeCard];

  return {
    ...state,
    life: updatedLife,
    hand: updatedHand,
    logs: [
      ...state.logs,
      createLog(`💔 Took 1 Life Damage! Added ${topLifeCard.name} to hand (${updatedLife.length} Life left)`, 'combat'),
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
    // Return attached DON!! as rested DON!!
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
 * Rest 1 active DON!! manually (e.g. for card effects or manual payment)
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
 * Deal damage to Opponent Leader
 */
export function damageOpponent(state: SimGameState, amount = 1): SimGameState {
  const currentLife = state.opponent ? state.opponent.life : state.opponentLife;
  const newLife = Math.max(0, currentLife - amount);
  const oppName = state.opponent ? state.opponent.leaderName : 'Opponent';

  return {
    ...state,
    opponent: state.opponent ? { ...state.opponent, life: newLife } : state.opponent,
    opponentLife: newLife,
    logs: [
      ...state.logs,
      createLog(
        newLife === 0
          ? `💥 Dealt ${amount} damage to ${oppName}! Opponent Life is 0! (Lethal Range!)`
          : `⚔️ Dealt ${amount} damage to ${oppName}! (Opponent Life: ${newLife})`,
        'combat'
      ),
    ],
  };
}

/**
 * Heal or add 1 Life to Opponent Leader
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
 * Declare Attack on Opponent Leader from a card on field
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
  if (attacker.rested) {
    return {
      ...state,
      logs: [
        ...state.logs,
        createLog(`⚠️ ${attacker.name} is already rested and cannot attack this turn!`, 'combat'),
      ],
    };
  }

  const attackerPower = (attacker.power || 0) + attacker.attachedDon * 1000 + attacker.customPowerModifier;
  const defenderPower = (state.opponent?.leaderPower ?? 5000) + (state.opponent?.attachedDon ?? 0) * 1000;

  // Rest the attacker card
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
  const newOppLife = hitSuccess ? Math.max(0, currentOppLife - 1) : currentOppLife;
  const oppLeaderName = state.opponent ? state.opponent.leaderName : 'Opponent Leader';

  const logEntry = hitSuccess
    ? createLog(
        newOppLife === 0
          ? `💥 ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${defenderPower} Power) — DIRECT HIT! Opponent Life is now 0!`
          : `⚔️ ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${defenderPower} Power) — HIT! Opponent takes 1 damage (Life: ${newOppLife}).`,
        'combat'
      )
    : createLog(
        `🛡️ ${attacker.name} (${attackerPower} Power) attacked ${oppLeaderName} (${defenderPower} Power) — BLOCKED / INSUFFICIENT POWER!`,
        'combat'
      );

  return {
    ...state,
    leader: updatedLeader,
    characters: updatedCharacters,
    opponent: state.opponent ? { ...state.opponent, life: newOppLife } : state.opponent,
    opponentLife: newOppLife,
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
