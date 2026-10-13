'use client';

import { RecommendedDeck, DeckCardItem } from './recommended-decks';
import { getEditionCardImageUrl } from './card-image';

export const CUSTOM_DECKS_STORAGE_KEY = 'optcg_custom_decks';
export const ACTIVE_DECK_STORAGE_KEY = 'optcg_active_deck_id';

/**
 * Get all user custom decks from localStorage
 */
export function getCustomDecks(): RecommendedDeck[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_DECKS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom decks from localStorage', e);
    return [];
  }
}

/**
 * Get a specific custom deck by its ID
 */
export function getCustomDeckById(id: string): RecommendedDeck | null {
  const decks = getCustomDecks();
  return decks.find((d) => d.id === id) || null;
}

/**
 * Save or update a custom deck in localStorage
 */
export function saveCustomDeck(deck: RecommendedDeck): void {
  if (typeof window === 'undefined') return;
  try {
    const decks = getCustomDecks();
    const index = decks.findIndex((d) => d.id === deck.id);
    let updated: RecommendedDeck[];
    if (index >= 0) {
      updated = [...decks];
      updated[index] = deck;
    } else {
      updated = [deck, ...decks];
    }
    localStorage.setItem(CUSTOM_DECKS_STORAGE_KEY, JSON.stringify(updated));
    emitCustomDecksChanged();
  } catch (e) {
    console.error('Failed to save custom deck to localStorage', e);
  }
}

/**
 * Delete a custom deck by ID
 */
export function deleteCustomDeck(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const decks = getCustomDecks();
    const updated = decks.filter((d) => d.id !== id);
    localStorage.setItem(CUSTOM_DECKS_STORAGE_KEY, JSON.stringify(updated));
    if (getActiveCustomDeckId() === id) {
      setActiveCustomDeckId(null);
    }
    emitCustomDecksChanged();
  } catch (e) {
    console.error('Failed to delete custom deck', e);
  }
}

/**
 * Get currently active custom deck ID
 */
export function getActiveCustomDeckId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_DECK_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Set active custom deck ID
 */
export function setActiveCustomDeckId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_DECK_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_DECK_STORAGE_KEY);
    }
    emitCustomDecksChanged();
  } catch (e) {
    console.error('Failed to set active deck ID', e);
  }
}

/**
 * Get currently active custom deck
 */
export function getActiveCustomDeck(): RecommendedDeck | null {
  const activeId = getActiveCustomDeckId();
  if (!activeId) return null;
  return getCustomDeckById(activeId);
}

/**
 * Recalculate deck stats and summary
 */
export function recalculateDeckStats(deck: RecommendedDeck): RecommendedDeck {
  const cards = deck.cards || [];
  const totalCardsCount = cards.reduce((sum, c) => sum + (c.quantity || 0), 0);

  const charactersCount = cards
    .filter((c) => (c.category || '').toLowerCase() === 'character')
    .reduce((sum, c) => sum + (c.quantity || 0), 0);

  const eventsCount = cards
    .filter((c) => (c.category || '').toLowerCase() === 'event')
    .reduce((sum, c) => sum + (c.quantity || 0), 0);

  const stagesCount = cards
    .filter((c) => (c.category || '').toLowerCase() === 'stage')
    .reduce((sum, c) => sum + (c.quantity || 0), 0);

  let totalCost = 0;
  let costCardCount = 0;
  cards.forEach((c) => {
    if (typeof c.cost === 'number') {
      totalCost += c.cost * (c.quantity || 1);
      costCardCount += c.quantity || 1;
    }
  });

  const avgCost = costCardCount > 0 ? parseFloat((totalCost / costCardCount).toFixed(1)) : 3.0;

  return {
    ...deck,
    subname: `${deck.leaderName || 'Leader'} (${totalCardsCount} cards)`,
    description: `Custom player deck. Total cards: ${totalCardsCount}.`,
    stats: {
      ...deck.stats,
      charactersCount,
      eventsCount,
      stagesCount,
      avgCost,
    },
  };
}

/**
 * Clean card code helper (extract "OP01-016" from "OP01-016_p1")
 */
export function extractCleanCardCode(card: any): string {
  const raw = card.cardNumber || card.card_number || card.id || '';
  const match = raw.match(/([A-Za-z]{2}\d{2}-\d{3})/i);
  if (match) return match[1].toUpperCase();
  return raw.split('_')[0].toUpperCase();
}

/**
 * Create a new custom deck
 */
export function createCustomDeck(name: string, leaderCard?: any): RecommendedDeck {
  const deckId = `custom-deck-${Date.now()}`;
  let leaderCode = 'ST01-001';
  let leaderName = 'Monkey.D.Luffy';
  let leaderColor = 'Red';
  let leaderImage = getEditionCardImageUrl('ST01-001', 'jp');

  if (leaderCard) {
    leaderCode = extractCleanCardCode(leaderCard);
    leaderName = leaderCard.name || `${leaderCode} Leader`;
    leaderColor = leaderCard.colors || 'Red';
    leaderImage = getEditionCardImageUrl(leaderCode, 'jp', leaderCard.imageUrl);
  }

  const newDeck: RecommendedDeck = {
    id: deckId,
    name: name.trim() || 'My Custom Deck',
    subname: `${leaderName} (0 cards)`,
    leaderId: leaderCode,
    leaderName,
    leaderImage,
    color: leaderColor,
    colorDot: '#3b82f6',
    rank: 'Custom Build',
    winrate: 'Testing Ready',
    date: new Date().toISOString().split('T')[0],
    tournament: 'Player Deck Builder',
    source: 'Custom Builder',
    description: `Custom player deck built with interactive card browser.`,
    cards: [],
    stats: {
      charactersCount: 0,
      eventsCount: 0,
      stagesCount: 0,
      counters2000: 4,
      counters1000: 16,
      noCounter: 30,
      avgCost: 3.0,
    },
  };

  saveCustomDeck(newDeck);
  setActiveCustomDeckId(deckId);
  return newDeck;
}

/**
 * Add a card to an existing or active custom deck
 */
export function addCardToCustomDeck(
  deckId: string,
  card: any,
  quantity: number = 4,
  setAsLeader: boolean = false
): { deck: RecommendedDeck; addedQty: number; wasLeader: boolean } {
  let deck = getCustomDeckById(deckId);
  if (!deck) {
    deck = createCustomDeck('My Custom Deck');
  }

  const cleanCode = extractCleanCardCode(card);
  const isLeader = setAsLeader || (card.category || '').toLowerCase() === 'leader';

  if (isLeader) {
    deck.leaderId = cleanCode;
    deck.leaderName = card.name || cleanCode;
    deck.leaderImage = getEditionCardImageUrl(cleanCode, 'jp', card.imageUrl);
    deck.color = card.colors || deck.color;
    deck = recalculateDeckStats(deck);
    saveCustomDeck(deck);
    return { deck, addedQty: 1, wasLeader: true };
  }

  // Non-leader card: add or update in deck.cards
  const existingIndex = deck.cards.findIndex(
    (c) => extractCleanCardCode(c) === cleanCode || c.cardId === cleanCode
  );

  let actualAdded = quantity;
  if (existingIndex >= 0) {
    const currentQty = deck.cards[existingIndex].quantity || 0;
    // Cap at 4 copies max in official rules
    const newQty = Math.min(4, currentQty + quantity);
    actualAdded = Math.max(0, newQty - currentQty);
    deck.cards[existingIndex].quantity = newQty;
  } else {
    const qty = Math.min(4, Math.max(1, quantity));
    actualAdded = qty;
    deck.cards.push({
      cardId: cleanCode,
      name: card.name || cleanCode,
      quantity: qty,
      cost: typeof card.cost === 'number' ? card.cost : null,
      power: typeof card.power === 'number' ? card.power : null,
      category: card.category || 'Character',
      colors: card.colors || 'Red',
      imageUrl: getEditionCardImageUrl(cleanCode, 'jp', card.imageUrl),
      yuyuPrice: card.yuyuPrice || null,
      marketPrice: card.marketPrice || null,
    });
  }

  deck = recalculateDeckStats(deck);
  saveCustomDeck(deck);
  return { deck, addedQty: actualAdded, wasLeader: false };
}

/**
 * Add multiple cards in bulk to a custom deck
 */
export function addMultipleCardsToCustomDeck(
  deckId: string,
  cards: any[],
  defaultQty: number = 4
): { deck: RecommendedDeck; totalAdded: number } {
  let deck = getCustomDeckById(deckId);
  if (!deck) {
    deck = createCustomDeck('My Custom Deck');
  }

  let totalAdded = 0;
  for (const card of cards) {
    const cleanCode = extractCleanCardCode(card);
    const isLeader = (card.category || '').toLowerCase() === 'leader';

    if (isLeader && !deck.leaderId) {
      deck.leaderId = cleanCode;
      deck.leaderName = card.name || cleanCode;
      deck.leaderImage = getEditionCardImageUrl(cleanCode, 'jp', card.imageUrl);
      deck.color = card.colors || deck.color;
      totalAdded += 1;
      continue;
    }

    const existingIndex = deck.cards.findIndex(
      (c) => extractCleanCardCode(c) === cleanCode || c.cardId === cleanCode
    );

    if (existingIndex >= 0) {
      const currentQty = deck.cards[existingIndex].quantity || 0;
      const newQty = Math.min(4, currentQty + defaultQty);
      totalAdded += Math.max(0, newQty - currentQty);
      deck.cards[existingIndex].quantity = newQty;
    } else {
      const qty = isLeader ? 1 : Math.min(4, Math.max(1, defaultQty));
      deck.cards.push({
        cardId: cleanCode,
        name: card.name || cleanCode,
        quantity: qty,
        cost: typeof card.cost === 'number' ? card.cost : null,
        power: typeof card.power === 'number' ? card.power : null,
        category: card.category || 'Character',
        colors: card.colors || 'Red',
        imageUrl: getEditionCardImageUrl(cleanCode, 'jp', card.imageUrl),
        yuyuPrice: card.yuyuPrice || null,
        marketPrice: card.marketPrice || null,
      });
      totalAdded += qty;
    }
  }

  deck = recalculateDeckStats(deck);
  saveCustomDeck(deck);
  return { deck, totalAdded };
}

/**
 * Dispatch custom event to notify components across the app
 */
export function emitCustomDecksChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('optcg_custom_decks_changed'));
  }
}
