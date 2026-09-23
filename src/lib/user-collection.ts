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

/**
 * Returns the currently active collector tag from user session, or null if logged out / guest
 */
export function getActiveUserTag(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('logpose_user_session');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.tag || null;
  } catch {
    return null;
  }
}

/**
 * Resolves the isolated localStorage key for a specific user tag or guest mode
 */
export function getBinderStorageKey(targetTag?: string | null): string {
  const tag = targetTag !== undefined ? targetTag : getActiveUserTag();
  if (!tag) {
    return 'logpose_binder_guest';
  }
  return `logpose_binder_${tag.toUpperCase()}`;
}

export function getLocalBinder(userTag?: string | null): LocalUserCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getBinderStorageKey(userTag);
    const raw = localStorage.getItem(key);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Graceful migration from legacy single-key binder if user binder is empty
    const legacyRaw = localStorage.getItem('logpose_user_binder');
    if (legacyRaw) {
      try {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          // Migrate to this account/guest
          localStorage.setItem(key, JSON.stringify(legacyParsed));
          // Clean up legacy key so it doesn't leak into subsequent accounts
          localStorage.removeItem('logpose_user_binder');
          return legacyParsed;
        }
      } catch {
        // Ignore parse error
      }
    }

    return [];
  } catch (e) {
    console.error('Failed to parse local binder:', e);
    return [];
  }
}

export function saveLocalBinder(cards: LocalUserCard[], userTag?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getBinderStorageKey(userTag);
    localStorage.setItem(key, JSON.stringify(cards));
    window.dispatchEvent(new Event('logpose_collection_updated'));
  } catch (e) {
    console.error('Failed to save local binder:', e);
  }
}

export function addCardToLocalBinder(
  cardData: {
    cardId: string;
    card: LocalUserCard['card'];
    quantity?: number;
    condition?: string;
    isFoil?: boolean;
    language?: string;
    purchasePrice?: number | null;
    notes?: string | null;
  },
  userTag?: string | null
): LocalUserCard[] {
  const current = getLocalBinder(userTag);
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

  saveLocalBinder(updated, userTag);
  return updated;
}

export function removeCardFromLocalBinder(recordId: string, userTag?: string | null): LocalUserCard[] {
  const current = getLocalBinder(userTag);
  const updated = current.filter((c) => c.id !== recordId);
  saveLocalBinder(updated, userTag);
  return updated;
}

/**
 * Transfers any cards accumulated while in guest mode into a newly authenticated user's binder
 */
export function transferGuestCardsToAccount(userTag: string): number {
  if (typeof window === 'undefined' || !userTag) return 0;
  try {
    const guestKey = 'logpose_binder_guest';
    const guestRaw = localStorage.getItem(guestKey);
    if (!guestRaw) return 0;

    const guestCards: LocalUserCard[] = JSON.parse(guestRaw);
    if (!Array.isArray(guestCards) || guestCards.length === 0) return 0;

    const userKey = getBinderStorageKey(userTag);
    const userRaw = localStorage.getItem(userKey);
    const userCards: LocalUserCard[] = userRaw ? JSON.parse(userRaw) : [];

    // Merge guest cards into user cards
    const merged = [...userCards];
    for (const gc of guestCards) {
      const existing = merged.find(
        (c) => c.cardId === gc.cardId && c.condition === gc.condition && c.isFoil === gc.isFoil && c.language === gc.language
      );
      if (existing) {
        existing.quantity += gc.quantity;
      } else {
        merged.unshift(gc);
      }
    }

    localStorage.setItem(userKey, JSON.stringify(merged));
    localStorage.removeItem(guestKey);
    window.dispatchEvent(new Event('logpose_collection_updated'));
    return guestCards.length;
  } catch (e) {
    console.error('Failed to transfer guest cards:', e);
    return 0;
  }
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

export function exportBinderToJSON(userTag?: string | null): void {
  const binder = getLocalBinder(userTag);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(binder, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  const activeTag = userTag || getActiveUserTag() || 'guest';
  downloadAnchor.setAttribute('download', `logpose-collection-${activeTag}-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBinderFromJSON(jsonString: string, userTag?: string | null): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return false;
    for (const item of parsed) {
      if (!item.cardId || !item.card) return false;
    }
    saveLocalBinder(parsed, userTag);
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
