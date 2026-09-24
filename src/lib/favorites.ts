'use client';

import { addFavoriteToCloud, removeFavoriteFromCloud } from './supabase-sync';
import { getActiveSession } from './user-accounts';

const FAVORITES_STORAGE_KEY = 'logpose_favorite_cards';

export function getFavoriteCardIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isCardFavorite(cardId: string): boolean {
  if (!cardId) return false;
  const ids = getFavoriteCardIds();
  return ids.includes(cardId);
}

export function toggleCardFavorite(cardId: string): boolean {
  if (!cardId || typeof window === 'undefined') return false;
  const ids = getFavoriteCardIds();
  const exists = ids.includes(cardId);
  let updated: string[];

  if (exists) {
    updated = ids.filter((id) => id !== cardId);
  } else {
    updated = [cardId, ...ids.filter((id) => id !== cardId)];
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('logpose_favorites_updated', { detail: { cardId, isFavorite: !exists, all: updated } }));
  } catch (e) {
    console.error('Failed to update favorites', e);
  }

  // Auto-sync with Supabase cloud if user is authenticated
  try {
    const session = getActiveSession();
    if (session?.id) {
      if (!exists) {
        addFavoriteToCloud(session.id, cardId).catch((e) =>
          console.warn('Background add favorite failed:', e)
        );
      } else {
        removeFavoriteFromCloud(session.id, cardId).catch((e) =>
          console.warn('Background remove favorite failed:', e)
        );
      }
    }
  } catch (err) {
    console.warn('Could not trigger background favorite sync:', err);
  }

  return !exists;
}

export function removeCardFavorite(cardId: string): void {
  if (!cardId || typeof window === 'undefined') return;
  const ids = getFavoriteCardIds();
  const updated = ids.filter((id) => id !== cardId);
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('logpose_favorites_updated', { detail: { cardId, isFavorite: false, all: updated } }));
  } catch {}

  // Auto-sync removal with Supabase cloud
  try {
    const session = getActiveSession();
    if (session?.id) {
      removeFavoriteFromCloud(session.id, cardId).catch((e) =>
        console.warn('Background remove favorite failed:', e)
      );
    }
  } catch (err) {
    console.warn('Could not trigger background favorite removal:', err);
  }
}
