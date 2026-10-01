'use client';

import { syncCardToCloud, removeCardFromCloud, recordCloudSale, undoCloudSale, editCloudSale } from './supabase-sync';
import { getActiveSession } from './user-accounts';
import { getCachedExchangeRates, type ExchangeRatesMap } from './exchange-rates';

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
  status?: 'OWNED' | 'SOLD'; // Defaults to 'OWNED'
  soldPrice?: number | null;
  soldCurrency?: string | null;
  soldDate?: string | null;
  soldQuantity?: number | null;
  isPublicSale?: boolean;
  buyerSource?: string | null;
  buyerUserTag?: string | null;
  verifiedByBuyer?: boolean;
  isOutlier?: boolean;
  flagsCount?: number;
  buyerNotes?: string | null;
  saleId?: string | null;
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

export interface CardSaleInput {
  soldPrice: number;
  soldCurrency: string;
  soldDate: string;
  quantity?: number;
  isPublic: boolean;
  buyerSource?: string;
  buyerUserTag?: string;
  isOutlier?: boolean;
  notes?: string;
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
  const tag = targetTag || getActiveUserTag();
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

export interface DeletedCardTombstone {
  cardId: string;
  condition?: string;
  isFoil?: boolean;
  language?: string;
  status?: string;
  deletedAt: number;
}

export function getDeletedCardsKey(userTag?: string | null): string {
  const tag = userTag || getActiveUserTag();
  if (!tag) return 'logpose_deleted_cards_guest';
  return `logpose_deleted_cards_${tag.toUpperCase()}`;
}

export function getDeletedCards(userTag?: string | null): DeletedCardTombstone[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getDeletedCardsKey(userTag);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDeletedCard(card: LocalUserCard, userTag?: string | null): void {
  if (typeof window === 'undefined' || !card) return;
  try {
    const key = getDeletedCardsKey(userTag);
    const deleted = getDeletedCards(userTag);
    const exists = deleted.some((d) => d.cardId === card.cardId && (d.status || 'OWNED') === (card.status || 'OWNED'));
    if (!exists) {
      deleted.push({
        cardId: card.cardId,
        condition: card.condition,
        isFoil: card.isFoil,
        language: card.language,
        status: card.status || 'OWNED',
        deletedAt: Date.now(),
      });
      localStorage.setItem(key, JSON.stringify(deleted));
    }
  } catch {}
}

export function clearDeletedCard(cardId: string, status?: string, userTag?: string | null): void {
  if (typeof window === 'undefined' || !cardId) return;
  try {
    const key = getDeletedCardsKey(userTag);
    const deleted = getDeletedCards(userTag);
    const filtered = deleted.filter(
      (d) => !(d.cardId === cardId && (!status || (d.status || 'OWNED') === status))
    );
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}
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
  // Clear any tombstone so card can be collected again
  clearDeletedCard(cardData.cardId, 'OWNED', userTag);

  const current = getLocalBinder(userTag);
  const qty = cardData.quantity || 1;
  const cond = cardData.condition || 'NM';
  const foil = Boolean(cardData.isFoil);
  const lang = cardData.language || 'jp';

  const existingIdx = current.findIndex(
    (c) => (c.status || 'OWNED') !== 'SOLD' && c.cardId === cardData.cardId && c.condition === cond && c.isFoil === foil && c.language === lang
  );

  let updated: LocalUserCard[];
  let affectedCard: LocalUserCard;

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx].quantity += qty;
    if (cardData.purchasePrice !== undefined) {
      updated[existingIdx].purchasePrice = cardData.purchasePrice;
    }
    affectedCard = updated[existingIdx];
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
    affectedCard = newEntry;
  }

  saveLocalBinder(updated, userTag);

  // Auto-sync with Supabase cloud if user is authenticated
  try {
    const session = getActiveSession();
    if (session?.id) {
      syncCardToCloud(session.id, affectedCard).catch((e) =>
        console.warn('Background card sync failed:', e)
      );
    }
  } catch (err) {
    console.warn('Could not trigger background card sync:', err);
  }

  return updated;
}

export function removeCardFromLocalBinder(recordId: string, userTag?: string | null): LocalUserCard[] {
  const current = getLocalBinder(userTag);
  const target = current.find((c) => c.id === recordId);
  const updated = current.filter((c) => c.id !== recordId);
  saveLocalBinder(updated, userTag);

  // Auto-sync removal with Supabase cloud if user is authenticated
  if (target) {
    recordDeletedCard(target, userTag);
    try {
      const session = getActiveSession();
      if (session?.id) {
        removeCardFromCloud(session.id, target.cardId, target.condition, target.isFoil, target.language).catch((e) =>
          console.warn('Background card remove failed:', e)
        );
      }
    } catch (err) {
      console.warn('Could not trigger background card removal:', err);
    }
  }

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
        (c) =>
          (c.status || 'OWNED') === (gc.status || 'OWNED') &&
          c.cardId === gc.cardId &&
          c.condition === gc.condition &&
          c.isFoil === gc.isFoil &&
          c.language === gc.language
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

export function getOwnedCards(cards: LocalUserCard[]): LocalUserCard[] {
  return cards.filter((c) => c.status !== 'SOLD');
}

export function getSoldCards(cards: LocalUserCard[]): LocalUserCard[] {
  return cards.filter((c) => c.status === 'SOLD');
}

/**
 * Mark a collection item as sold.
 * Preserves the collection item and historical relationship.
 * Supports partial quantity sales (e.g. selling 1 out of 3 copies).
 */
export function markCardAsSold(
  recordId: string,
  saleData: CardSaleInput,
  userTag?: string | null
): LocalUserCard[] {
  const current = getLocalBinder(userTag);
  const targetIdx = current.findIndex((c) => c.id === recordId);
  if (targetIdx < 0) return current;

  const target = current[targetIdx];
  const sellQty = Math.max(1, Math.min(saleData.quantity || 1, target.quantity));
  let updated: LocalUserCard[];
  let affectedSoldCard: LocalUserCard;

  if (sellQty < target.quantity) {
    // Partial sale: reduce owned quantity on existing record, create a dedicated SOLD record
    target.quantity -= sellQty;

    const soldRecord: LocalUserCard = {
      id: 'uc_sold_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      cardId: target.cardId,
      quantity: sellQty,
      condition: target.condition,
      isFoil: target.isFoil,
      language: target.language,
      purchasePrice: target.purchasePrice,
      notes: target.notes,
      createdAt: target.createdAt,
      status: 'SOLD',
      soldPrice: saleData.soldPrice,
      soldCurrency: saleData.soldCurrency || 'PHP',
      soldDate: saleData.soldDate || new Date().toISOString().slice(0, 10),
      soldQuantity: sellQty,
      isPublicSale: saleData.isPublic !== false,
      buyerSource: saleData.buyerSource || null,
      buyerUserTag: saleData.buyerUserTag || null,
      verifiedByBuyer: false,
      isOutlier: Boolean(saleData.isOutlier),
      flagsCount: 0,
      buyerNotes: saleData.notes || null,
      card: target.card,
    };

    updated = [soldRecord, ...current];
    affectedSoldCard = soldRecord;
  } else {
    // Full sale: convert existing record directly to SOLD
    target.status = 'SOLD';
    target.soldPrice = saleData.soldPrice;
    target.soldCurrency = saleData.soldCurrency || 'PHP';
    target.soldDate = saleData.soldDate || new Date().toISOString().slice(0, 10);
    target.soldQuantity = sellQty;
    target.isPublicSale = saleData.isPublic !== false;
    target.buyerSource = saleData.buyerSource || null;
    target.buyerUserTag = saleData.buyerUserTag || null;
    target.verifiedByBuyer = false;
    target.isOutlier = Boolean(saleData.isOutlier);
    target.flagsCount = 0;
    target.buyerNotes = saleData.notes || null;

    updated = [...current];
    affectedSoldCard = target;
  }

  saveLocalBinder(updated, userTag);

  // Background Cloud Sync if user is logged in
  try {
    const session = getActiveSession();
    if (session?.id) {
      recordCloudSale(session.id, {
        userCardId: affectedSoldCard.id,
        cardId: affectedSoldCard.cardId,
        cardName: affectedSoldCard.card?.name,
        condition: affectedSoldCard.condition,
        isFoil: affectedSoldCard.isFoil,
        language: affectedSoldCard.language,
        soldPrice: saleData.soldPrice,
        soldCurrency: saleData.soldCurrency || 'PHP',
        soldDate: saleData.soldDate || new Date().toISOString().slice(0, 10),
        quantity: sellQty,
        isPublic: saleData.isPublic !== false,
        buyerSource: saleData.buyerSource,
        buyerUserTag: saleData.buyerUserTag,
        isOutlier: Boolean(saleData.isOutlier),
        notes: saleData.notes,
      }).catch((e) => console.warn('Cloud sale recording failed:', e));
    }
  } catch (err) {
    console.warn('Could not trigger cloud sale sync:', err);
  }

  return updated;
}

/**
 * Reverses a previously recorded sale and restores the card to active OWNED collection
 */
export function undoCardSale(recordId: string, userTag?: string | null): LocalUserCard[] {
  const current = getLocalBinder(userTag);
  const targetIdx = current.findIndex((c) => c.id === recordId);
  if (targetIdx < 0) return current;

  const target = current[targetIdx];
  const oldCardId = target.cardId;
  const oldCondition = target.condition;
  const oldFoil = target.isFoil;
  const oldLanguage = target.language;

  // Check if there is already an existing OWNED card with identical attributes to merge with
  const existingOwnedIdx = current.findIndex(
    (c) =>
      c.id !== recordId &&
      c.status !== 'SOLD' &&
      c.cardId === oldCardId &&
      c.condition === oldCondition &&
      c.isFoil === oldFoil &&
      c.language === oldLanguage
  );

  let updated: LocalUserCard[];

  if (existingOwnedIdx >= 0) {
    current[existingOwnedIdx].quantity += target.quantity || 1;
    updated = current.filter((c) => c.id !== recordId);
  } else {
    target.status = 'OWNED';
    target.soldPrice = null;
    target.soldCurrency = null;
    target.soldDate = null;
    target.soldQuantity = null;
    target.isPublicSale = true;
    target.buyerSource = null;
    target.buyerNotes = null;
    updated = [...current];
  }

  saveLocalBinder(updated, userTag);

  // Background Cloud Sync undo
  try {
    const session = getActiveSession();
    if (session?.id) {
      undoCloudSale(session.id, recordId, oldCardId, oldCondition, oldFoil, oldLanguage).catch((e) =>
        console.warn('Cloud undo sale failed:', e)
      );
    }
  } catch (err) {
    console.warn('Could not trigger cloud undo sale sync:', err);
  }

  return updated;
}

/**
 * Edit an existing sale's price, date, or notes
 */
export function editCardSale(
  recordId: string,
  updatedData: Partial<CardSaleInput>,
  userTag?: string | null
): LocalUserCard[] {
  const current = getLocalBinder(userTag);
  const target = current.find((c) => c.id === recordId);
  if (!target || target.status !== 'SOLD') return current;

  if (updatedData.soldPrice !== undefined) target.soldPrice = updatedData.soldPrice;
  if (updatedData.soldCurrency !== undefined) target.soldCurrency = updatedData.soldCurrency;
  if (updatedData.soldDate !== undefined) target.soldDate = updatedData.soldDate;
  if (updatedData.isPublic !== undefined) target.isPublicSale = updatedData.isPublic;
  if (updatedData.buyerSource !== undefined) target.buyerSource = updatedData.buyerSource;
  if (updatedData.notes !== undefined) target.buyerNotes = updatedData.notes;

  saveLocalBinder(current, userTag);

  // Background Cloud Sync update
  try {
    const session = getActiveSession();
    if (session?.id && target.soldPrice) {
      editCloudSale(session.id, recordId, target.cardId, {
        soldPrice: target.soldPrice,
        soldCurrency: target.soldCurrency || 'PHP',
        soldDate: target.soldDate || new Date().toISOString().slice(0, 10),
        isPublic: target.isPublicSale,
        notes: target.buyerNotes || undefined,
      }).catch((e) => console.warn('Cloud edit sale failed:', e));
    }
  } catch (err) {
    console.warn('Could not trigger cloud edit sale sync:', err);
  }

  return current;
}

export function getLocalBinderStats(cards: LocalUserCard[], rates?: ExchangeRatesMap) {
  // Only calculate active collection stats for cards currently OWNED
  const ownedCards = cards.filter((c) => c.status !== 'SOLD');
  const activeRates = rates || getCachedExchangeRates();
  const jpyRate = activeRates.JPY || 157.30;

  let totalCardsCount = 0;
  let totalEstimatedValue = 0;
  let totalInvested = 0;
  const conditionsCount: Record<string, number> = { NM: 0, LP: 0, MP: 0, HP: 0, Graded: 0 };
  let foilsCount = 0;
  let jpCount = 0;
  let enCount = 0;

  for (const uc of ownedCards) {
    const qty = uc.quantity || 1;
    totalCardsCount += qty;
    const isJp = uc.language === 'jp';

    const unitPriceUsd = isJp
      ? (uc.card.yuyuPrice ? uc.card.yuyuPrice / jpyRate : (uc.card.marketPrice || 0))
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
    uniqueCardsCount: ownedCards.length,
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

export function getSoldStats(cards: LocalUserCard[], rates?: ExchangeRatesMap) {
  const soldCards = cards.filter((c) => c.status === 'SOLD');
  const activeRates = rates || getCachedExchangeRates();
  const phpRate = activeRates.PHP || 62.75;
  const jpyRate = activeRates.JPY || 157.30;

  let totalSoldCardsCount = 0;
  let totalRevenuePHP = 0;
  let totalRevenueUSD = 0;
  let totalRevenueJPY = 0;
  let totalInvestedUsd = 0;
  let totalRevenueNormalizedUsd = 0;
  const conditionsCount: Record<string, number> = { NM: 0, LP: 0, MP: 0, HP: 0, Graded: 0 };

  for (const uc of soldCards) {
    const qty = uc.soldQuantity || uc.quantity || 1;
    totalSoldCardsCount += qty;
    const price = uc.soldPrice || 0;
    const currency = (uc.soldCurrency || 'PHP').toUpperCase();

    if (currency === 'PHP') {
      totalRevenuePHP += price;
      totalRevenueNormalizedUsd += price / phpRate;
    } else if (currency === 'JPY') {
      totalRevenueJPY += price;
      totalRevenueNormalizedUsd += price / jpyRate;
    } else {
      totalRevenueUSD += price;
      totalRevenueNormalizedUsd += price;
    }

    // Purchase cost
    if (uc.purchasePrice) {
      totalInvestedUsd += uc.purchasePrice * qty;
    }

    const cond = uc.condition || 'NM';
    conditionsCount[cond] = (conditionsCount[cond] || 0) + qty;
  }

  return {
    totalSalesCount: soldCards.length,
    totalSoldCardsCount,
    totalRevenuePHP,
    totalRevenueUSD,
    totalRevenueJPY,
    totalRevenueNormalizedUsd: Math.round(totalRevenueNormalizedUsd * 100) / 100,
    totalInvestedUsd: Math.round(totalInvestedUsd * 100) / 100,
    conditionsCount,
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

/**
 * Retrieves all sold cards across local binders in localStorage.
 * Optionally filters by canonical cardId (case-insensitive).
 */
export function getLocalSoldCards(cardId?: string): LocalUserCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const soldCards: LocalUserCard[] = [];
    const seenIds = new Set<string>();

    const checkAndAdd = (item: any) => {
      if (
        item &&
        item.status === 'SOLD' &&
        item.soldPrice != null &&
        !isNaN(Number(item.soldPrice))
      ) {
        if (cardId) {
          const targetClean = cardId.trim().toLowerCase();
          const matchCardId = (item.cardId || '').trim().toLowerCase();
          const matchInnerId = (item.card?.id || '').trim().toLowerCase();
          if (matchCardId !== targetClean && matchInnerId !== targetClean) {
            return;
          }
        }

        const uniqueKey = item.id || `${item.cardId}_${item.soldDate}_${item.soldPrice}_${item.condition}`;
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey);
          soldCards.push(item);
        }
      }
    };

    // Scan all storage keys starting with logpose_binder_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('logpose_binder_') || key === 'logpose_user_binder')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              checkAndAdd(item);
            }
          }
        } catch {}
      }
    }

    return soldCards;
  } catch (e) {
    console.error('Failed to get local sold cards:', e);
    return [];
  }
}

