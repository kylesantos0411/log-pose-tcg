import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase/client';
import { LocalUserCard } from './user-collection';

export interface CloudProfile {
  id: string;
  username: string;
  tag: string;
  email: string | null;
  avatar: string;
  crew: string;
  rank: string;
  rankBadge: string;
}

/**
 * Fetch profile from Supabase profiles table
 */
export async function fetchCloudProfile(userId: string): Promise<CloudProfile | null> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      username: data.username,
      tag: data.tag,
      email: data.email,
      avatar: 'default',
      crew: data.crew?.startsWith('CODE:') ? 'Collector' : (data.crew || 'Collector'),
      rank: data.rank || 'Collector',
      rankBadge: '',
    };
  } catch (err) {
    console.error('Failed to fetch cloud profile:', err);
    return null;
  }
}

/**
 * Sync a single card addition or quantity update to Supabase
 */
export async function syncCardToCloud(userId: string, card: LocalUserCard): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return false;

  try {
    const { error } = await client
      .from('user_cards')
      .upsert(
        {
          user_id: userId,
          card_id: card.cardId,
          quantity: card.quantity,
          condition: card.condition || 'NM',
          is_foil: Boolean(card.isFoil),
          language: card.language || 'en',
          purchase_price: card.purchasePrice ?? null,
          notes: card.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,card_id,condition,is_foil,language,is_wishlist',
        }
      );

    return !error;
  } catch (err) {
    console.error('Failed to sync card to cloud:', err);
    return false;
  }
}

/**
 * Remove a card from the user's cloud collection
 */
export async function removeCardFromCloud(userId: string, cardId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return false;

  try {
    const { error } = await client
      .from('user_cards')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);

    return !error;
  } catch (err) {
    console.error('Failed to remove card from cloud:', err);
    return false;
  }
}

/**
 * Migrate local guest cards into Supabase cloud database
 */
export async function migrateLocalBinderToCloud(userId: string, localCards: LocalUserCard[]): Promise<number> {
  if (!localCards.length) return 0;
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return 0;

  try {
    const records = localCards.map((c) => ({
      user_id: userId,
      card_id: c.cardId,
      quantity: c.quantity || 1,
      condition: c.condition || 'NM',
      is_foil: Boolean(c.isFoil),
      language: c.language || 'en',
      purchase_price: c.purchasePrice ?? null,
      notes: c.notes ?? null,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await client
      .from('user_cards')
      .upsert(records, {
        onConflict: 'user_id,card_id,condition,is_foil,language,is_wishlist',
      })
      .select('id');

    if (error) {
      console.error('Error during binder cloud migration:', error);
      return 0;
    }

    return data?.length || localCards.length;
  } catch (err) {
    console.error('Failed to migrate local cards to cloud:', err);
    return 0;
  }
}
