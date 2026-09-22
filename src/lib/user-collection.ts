'use client';

export interface LocalUserCard {
  id: string; // unique record id
  cardId: string;
  quantity: number;
  condition: string;
  isFoil: boolean;
  language: string;
  purchasePrice: number | null;
  notes?: string | null;
  createdAt: string;
  card: {
    id: string;
    name: string;
    category: string;
    colors: string;
    cost: number | null;
    power: number | null;
    rarity: string;
    imageUrl: string | null;
    marketPrice: number | null;
    yuyuPrice?: number | null;
    pack?: {
      code: string;
      name: string;
    };
  };
}

const STORAGE_KEY = 'logpose_user_binder';

export function getLocalBinder(): LocalUserCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local binder:', e);
    return [];
  }
}

export function saveLocalBinder(cards: LocalUserCard[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    window.dispatchEvent(new Event('logpose_collection_updated'));
  } catch (e) {
    console.error('Failed to save local binder:', e);
  }
}

export function addCardToLocalBinder(cardData: {
  cardId: string;
  card: LocalUserCard['card'];
  quantity?: number;
  condition?: string;
  isFoil?: boolean;
  language?: string;
  purchasePrice?: number | null;
  notes?: string | null;
}): LocalUserCard[] {
  const current = getLocalBinder();
  const qty = cardData.quantity || 1;
  const cond = cardData.condition || 'NM';
  const foil = Boolean(cardData.isFoil);
  const lang = cardData.language || 'jp';

  const existingIdx = current.findIndex(
    (c) => c.cardId === cardData.cardId && c.condition === cond && c.isFoil === foil && c.language === lang
  );

  let updated: LocalUserCard[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx].quantity += qty;
    if (cardData.purchasePrice !== undefined) {
      updated[existingIdx].purchasePrice = cardData.purchasePrice;
    }
  } else {
    const newEntry: LocalUserCard = {
      id: 'uc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      cardId: cardData.cardId,
      quantity: qty,
      condition: cond,
      isFoil: foil,
      language: lang,
      purchasePrice: cardData.purchasePrice ?? null,
      notes: cardData.notes ?? null,
      createdAt: new Date().toISOString(),
      card: cardData.card,
    };
    updated = [newEntry, ...current];
  }

  saveLocalBinder(updated);
  return updated;
}

export function removeCardFromLocalBinder(recordId: string): LocalUserCard[] {
  const current = getLocalBinder();
  const updated = current.filter((c) => c.id !== recordId);
  saveLocalBinder(updated);
  return updated;
}

export function getLocalBinderStats(cards: LocalUserCard[]) {
  let totalCardsCount = 0;
  let totalEstimatedValue = 0;
  let totalInvested = 0;
  const conditionsCount: Record<string, number> = { NM: 0, LP: 0, MP: 0, HP: 0, Graded: 0 };
  let foilsCount = 0;
  let jpCount = 0;
  let enCount = 0;

  for (const uc of cards) {
    const qty = uc.quantity || 1;
    totalCardsCount += qty;
    const isJp = uc.language === 'jp';

    const unitPriceUsd = isJp
      ? (uc.card.yuyuPrice ? uc.card.yuyuPrice / 152.0 : (uc.card.marketPrice || 0))
      : (uc.card.marketPrice || 0);

    const buyPriceUsd = uc.purchasePrice !== null && uc.purchasePrice !== undefined
      ? uc.purchasePrice
      : unitPriceUsd;

    totalEstimatedValue += unitPriceUsd * qty;
    totalInvested += buyPriceUsd * qty;

    const cond = uc.condition || 'NM';
    conditionsCount[cond] = (conditionsCount[cond] || 0) + qty;
    if (uc.isFoil) foilsCount += qty;
    if (isJp) jpCount += qty;
    else enCount += qty;
  }

  const netProfit = totalEstimatedValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  return {
    totalCardsCount,
    uniqueCardsCount: cards.length,
    totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitPercentage: Math.round(profitPercentage * 10) / 10,
    conditionsCount,
    foilsCount,
    jpCount,
    enCount,
  };
}

export function exportBinderToJSON(): void {
  const binder = getLocalBinder();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(binder, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `logpose-collection-backup-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBinderFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return false;
    // Validate minimal structure
    for (const item of parsed) {
      if (!item.cardId || !item.card) return false;
    }
    saveLocalBinder(parsed);
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
