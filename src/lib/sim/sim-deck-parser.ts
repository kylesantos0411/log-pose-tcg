import { RecommendedDeck, DeckCardItem } from '../recommended-decks';
import cardRulesDbRaw from './card-rules-db.json';
import { getEditionCardImageUrl } from '../card-image';

const cardRulesDb: Record<
  string,
  {
    counter?: number | null;
    effect?: string | null;
    trigger?: string | null;
    types?: string | null;
    attributes?: string | null;
    cost?: number | null;
    power?: number | null;
    category?: string | null;
    colors?: string | null;
    name?: string | null;
  }
> = cardRulesDbRaw as any;

/**
 * Parses raw text deck lists (from OPTCS, GumGum, TopDecks, or manual Bandai format):
 * Examples:
 * 1xOP01-001
 * 4xST01-013
 * 4 ST01-011
 * OP01-016 x4
 */
export function parseCustomDeckText(
  text: string,
  deckTitle: string = 'Custom Test Deck'
): { deck: RecommendedDeck | null; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { deck: null, errors: ['Please paste a deck list with card codes.'] };
  }

  let leaderCode: string | null = null;
  const cardsMap = new Map<string, number>();
  const errors: string[] = [];

  for (const rawLine of lines) {
    // Ignore comment lines or header titles
    if (rawLine.startsWith('//') || rawLine.startsWith('#')) continue;

    // Regex matching: "4xOP01-016", "4 OP01-016", "1x ST01-001", "OP01-001 x1"
    const match =
      rawLine.match(/(?:^|\s*)(\d+)\s*[xX]?\s*([A-Za-z]{2}\d{2}-\d{3})(?:_p\d+)?/i) ||
      rawLine.match(/([A-Za-z]{2}\d{2}-\d{3})(?:_p\d+)?\s*[xX]?\s*(\d+)/i) ||
      rawLine.match(/([A-Za-z]{2}\d{2}-\d{3})/i);

    if (match) {
      let qty = 1;
      let code = '';

      if (match[1] && match[2]) {
        if (/^\d+$/.test(match[1])) {
          qty = parseInt(match[1], 10);
          code = match[2].toUpperCase();
        } else {
          code = match[1].toUpperCase();
          qty = parseInt(match[2], 10);
        }
      } else if (match[1]) {
        code = match[1].toUpperCase();
      }

      // Check if Leader is indicated or if qty is 1 and line contains leader
      const isExplicitLeader =
        rawLine.toLowerCase().includes('leader') ||
        rawLine.toLowerCase().startsWith('1x') && !leaderCode && cardsMap.size === 0;

      if (isExplicitLeader && !leaderCode) {
        leaderCode = code;
      } else {
        cardsMap.set(code, (cardsMap.get(code) || 0) + qty);
      }
    }
  }

  // If no explicit leader detected, check first card with qty 1 or default to first card
  if (!leaderCode) {
    for (const [code, qty] of cardsMap.entries()) {
      if (qty === 1) {
        leaderCode = code;
        cardsMap.delete(code);
        break;
      }
    }
    if (!leaderCode && cardsMap.size > 0) {
      const firstEntry = Array.from(cardsMap.entries())[0];
      leaderCode = firstEntry[0];
      if (firstEntry[1] > 1) {
        cardsMap.set(firstEntry[0], firstEntry[1] - 1);
      } else {
        cardsMap.delete(firstEntry[0]);
      }
    }
  }

  if (!leaderCode) {
    return { deck: null, errors: ['No valid One Piece card codes found in the list.'] };
  }

  const leaderDb = cardRulesDb[leaderCode] || null;
  const leaderName = leaderDb?.name || `${leaderCode} Leader`;
  const leaderImage = getEditionCardImageUrl(leaderCode, 'jp');

  const cards: DeckCardItem[] = [];
  let totalCardsCount = 0;

  for (const [code, quantity] of cardsMap.entries()) {
    const cardInfo = cardRulesDb[code] || null;
    totalCardsCount += quantity;
    cards.push({
      cardId: code,
      name: cardInfo?.name || code,
      quantity,
      cost: cardInfo?.cost ?? 2,
      power: cardInfo?.power ?? 3000,
      category: (cardInfo?.category as any) || 'Character',
      colors: cardInfo?.colors || 'Red',
      imageUrl: getEditionCardImageUrl(code, 'jp'),
    });
  }

  const builtDeck: RecommendedDeck = {
    id: `custom-deck-${Date.now()}`,
    name: deckTitle || 'Custom Deck',
    subname: `${leaderName} (${totalCardsCount} cards)`,
    leaderId: leaderCode,
    leaderName,
    leaderImage,
    color: leaderDb?.colors || 'Red',
    colorDot: '#3b82f6',
    rank: 'Custom Build',
    winrate: 'Testing Ready',
    date: new Date().toISOString().split('T')[0],
    tournament: 'Player Sandbox Testing',
    source: 'Custom Import',
    description: `Custom player deck imported for simulator practice. Total cards: ${totalCardsCount}.`,
    stats: {
      charactersCount: cards.filter((c) => c.category === 'Character').reduce((acc, c) => acc + c.quantity, 0),
      eventsCount: cards.filter((c) => c.category === 'Event').reduce((acc, c) => acc + c.quantity, 0),
      stagesCount: cards.filter((c) => c.category === 'Stage').reduce((acc, c) => acc + c.quantity, 0),
      counters2000: 4,
      counters1000: 16,
      noCounter: 30,
      avgCost: 3.0,
    },
    cards,
  };

  return { deck: builtDeck, errors };
}
