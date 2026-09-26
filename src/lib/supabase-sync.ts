import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase/client';
import type { LocalUserCard } from './user-collection';

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Fetch profile from Supabase profiles table
 */
export async function fetchCloudProfile(userId: string): Promise<CloudProfile | null> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return null;

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
 * Fetch all cards in a user's cloud binder (collection) from Supabase
 */
export async function fetchCloudCards(userId: string): Promise<LocalUserCard[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return [];

  try {
    const { data, error } = await client
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_wishlist', false);

    if (error || !data || data.length === 0) return [];

    // Extract unique card_ids to fetch metadata
    const uniqueIds = Array.from(new Set(data.map((r: any) => r.card_id).filter(Boolean)));
    const cardMap = new Map<string, any>();

    // Fetch card details in batches of 50
    for (let i = 0; i < uniqueIds.length; i += 50) {
      const chunk = uniqueIds.slice(i, i + 50);
      try {
        const res = await fetch(`/api/cards?ids=${encodeURIComponent(chunk.join(','))}&limit=100`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.cards)) {
            for (const c of json.cards) {
              cardMap.set(c.id, c);
            }
          }
        }
      } catch (err) {
        console.warn('Batch card detail lookup failed:', err);
      }
    }

    const localCards: LocalUserCard[] = data.map((r: any) => {
      const c = cardMap.get(r.card_id);
      return {
        id: r.id || `uc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        cardId: r.card_id,
        quantity: r.quantity || 1,
        condition: r.condition || 'NM',
        isFoil: Boolean(r.is_foil),
        language: r.language || 'jp',
        purchasePrice: r.purchase_price !== null && r.purchase_price !== undefined ? Number(r.purchase_price) : null,
        notes: r.notes || null,
        createdAt: r.created_at || new Date().toISOString(),
        card: c ? {
          id: c.id,
          name: c.name,
          category: c.category,
          colors: c.colors,
          cost: c.cost,
          power: c.power,
          rarity: c.rarity,
          imageUrl: c.imageUrl,
          marketPrice: c.marketPrice,
          yuyuPrice: c.yuyuPrice,
          pack: c.pack ? { code: c.pack.code, name: c.pack.name } : undefined,
        } : {
          id: r.card_id,
          name: r.card_id,
          category: 'Character',
          colors: 'Red',
          cost: null,
          power: null,
          rarity: 'Common',
          imageUrl: `https://onepiece-cardgame.com/images/cardlist/card/${r.card_id.split('_')[0]}.png`,
          marketPrice: null,
        },
      };
    });

    return localCards;
  } catch (err) {
    console.error('Failed to fetch cloud cards:', err);
    return [];
  }
}

/**
 * Sync a single card addition or quantity update to Supabase
 */
export async function syncCardToCloud(userId: string, card: LocalUserCard): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return false;

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
          language: card.language || 'jp',
          purchase_price: card.purchasePrice ?? null,
          notes: card.notes ?? null,
          is_wishlist: false,
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
export async function removeCardFromCloud(
  userId: string,
  cardId: string,
  condition?: string,
  isFoil?: boolean,
  language?: string
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return false;

  try {
    let query = client
      .from('user_cards')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .eq('is_wishlist', false);

    if (condition) query = query.eq('condition', condition);
    if (isFoil !== undefined) query = query.eq('is_foil', isFoil);
    if (language) query = query.eq('language', language);

    const { error } = await query;
    return !error;
  } catch (err) {
    console.error('Failed to remove card from cloud:', err);
    return false;
  }
}

/**
 * Migrate/upsert local cards into Supabase cloud database
 */
export async function migrateLocalBinderToCloud(userId: string, localCards: LocalUserCard[]): Promise<number> {
  if (!localCards.length) return 0;
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return 0;

  try {
    const records = localCards.map((c) => ({
      user_id: userId,
      card_id: c.cardId,
      quantity: c.quantity || 1,
      condition: c.condition || 'NM',
      is_foil: Boolean(c.isFoil),
      language: c.language || 'jp',
      purchase_price: c.purchasePrice ?? null,
      notes: c.notes ?? null,
      is_wishlist: false,
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

/**
 * Fetch favorite card IDs from Supabase (stored as is_wishlist = true)
 */
export async function fetchCloudFavorites(userId: string): Promise<string[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return [];

  try {
    const { data, error } = await client
      .from('user_cards')
      .select('card_id')
      .eq('user_id', userId)
      .eq('is_wishlist', true);

    if (error || !data) return [];
    return data.map((r: any) => r.card_id).filter(Boolean);
  } catch (err) {
    console.error('Failed to fetch cloud favorites:', err);
    return [];
  }
}

/**
 * Add a card to user's favorites in Supabase
 */
export async function addFavoriteToCloud(userId: string, cardId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId) || !cardId) return false;

  try {
    const { error } = await client
      .from('user_cards')
      .upsert(
        {
          user_id: userId,
          card_id: cardId,
          is_wishlist: true,
          quantity: 1,
          condition: 'NM',
          is_foil: false,
          language: 'jp',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,card_id,condition,is_foil,language,is_wishlist',
        }
      );
    return !error;
  } catch (err) {
    console.error('Failed to add favorite to cloud:', err);
    return false;
  }
}

/**
 * Remove a card from user's favorites in Supabase
 */
export async function removeFavoriteFromCloud(userId: string, cardId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId) || !cardId) return false;

  try {
    const { error } = await client
      .from('user_cards')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .eq('is_wishlist', true);
    return !error;
  } catch (err) {
    console.error('Failed to remove favorite from cloud:', err);
    return false;
  }
}

/**
 * Synchronize local favorites with Supabase cloud (bidirectional union)
 */
export async function syncFavoritesWithCloud(userId: string): Promise<string[]> {
  if (typeof window === 'undefined' || !isValidUuid(userId)) return [];

  // Read local favorites
  let localFavorites: string[] = [];
  try {
    const raw = localStorage.getItem('logpose_favorite_cards');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localFavorites = parsed;
    }
  } catch {}

  const cloudIds = await fetchCloudFavorites(userId);

  // Union of local and cloud favorites
  const mergedSet = new Set<string>([...cloudIds, ...localFavorites]);
  const mergedList = Array.from(mergedSet);

  // If local had favorites not yet in cloud, upload them to Supabase
  const toUpload = localFavorites.filter((id) => !cloudIds.includes(id));
  if (toUpload.length > 0) {
    const records = toUpload.map((id) => ({
      user_id: userId,
      card_id: id,
      is_wishlist: true,
      quantity: 1,
      condition: 'NM',
      is_foil: false,
      language: 'jp',
      updated_at: new Date().toISOString(),
    }));

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        await client.from('user_cards').upsert(records, {
          onConflict: 'user_id,card_id,condition,is_foil,language,is_wishlist',
        });
      } catch (err) {
        console.warn('Failed to upload local favorites to cloud:', err);
      }
    }
  }

  // Update local storage and notify UI
  try {
    localStorage.setItem('logpose_favorite_cards', JSON.stringify(mergedList));
    window.dispatchEvent(new CustomEvent('logpose_favorites_updated', { detail: { all: mergedList } }));
  } catch (err) {
    console.error('Failed to save merged favorites:', err);
  }

  return mergedList;
}

/**
 * Central synchronizer: fully reconciles user collection and favorites between cloud and local
 */
export async function syncUserCloudData(userId: string, userTag: string): Promise<void> {
  if (!userId || typeof window === 'undefined' || !isValidUuid(userId)) return;

  try {
    // 1. Sync favorites (pulls cloud favorites & uploads offline local favorites)
    await syncFavoritesWithCloud(userId);

    // 2. Migrate guest cards if user was browsing anonymously before login
    const guestKey = 'logpose_binder_guest';
    const guestRaw = localStorage.getItem(guestKey);
    if (guestRaw) {
      try {
        const guestCards: LocalUserCard[] = JSON.parse(guestRaw);
        if (Array.isArray(guestCards) && guestCards.length > 0) {
          await migrateLocalBinderToCloud(userId, guestCards);
          localStorage.removeItem(guestKey);
        }
      } catch {}
    }

    // 3. Fetch cards stored in Supabase cloud
    const cloudCards = await fetchCloudCards(userId);

    // 4. Fetch local cards for this user's tag
    const tag = (userTag || 'guest').toUpperCase();
    const userKey = `logpose_binder_${tag}`;
    let localCards: LocalUserCard[] = [];
    try {
      const raw = localStorage.getItem(userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localCards = parsed;
      }
    } catch {}

    // 5. Intelligent Merge:
    // If logging in on a new device (local binder is empty), populate it directly from cloud!
    if (localCards.length === 0 && cloudCards.length > 0) {
      localStorage.setItem(userKey, JSON.stringify(cloudCards));
      window.dispatchEvent(new Event('logpose_collection_updated'));
      return;
    }

    // If local has cards, merge them with cloud cards without loss
    const merged = [...cloudCards];
    const newCardsToUpload: LocalUserCard[] = [];

    for (const local of localCards) {
      const existing = merged.find(
        (c) =>
          c.cardId === local.cardId &&
          c.condition === local.condition &&
          c.isFoil === local.isFoil &&
          c.language === local.language
      );

      if (existing) {
        if (local.quantity > existing.quantity) {
          existing.quantity = local.quantity;
          newCardsToUpload.push(existing);
        }
        if (local.purchasePrice && !existing.purchasePrice) {
          existing.purchasePrice = local.purchasePrice;
          newCardsToUpload.push(existing);
        }
      } else {
        merged.unshift(local);
        newCardsToUpload.push(local);
      }
    }

    localStorage.setItem(userKey, JSON.stringify(merged));
    window.dispatchEvent(new Event('logpose_collection_updated'));

    // Upload any cards that were only present on this local device
    if (newCardsToUpload.length > 0) {
      await migrateLocalBinderToCloud(userId, newCardsToUpload);
    }
  } catch (err) {
    console.error('Failed to sync user cloud data:', err);
  }
}

// ─────────────────────────────────────────────
// FRIEND SYSTEM
// ─────────────────────────────────────────────

export interface FriendshipProfile {
  id: string;           // friendship row id
  userId: string;       // the other user's Supabase profile id
  username: string;
  tag: string;
  avatar: string;
  rank: string;
  cardCount: number;
  status: 'pending_sent' | 'pending_received' | 'accepted';
  createdAt: string;
}

export interface SearchedUser {
  id: string;
  username: string;
  tag: string;
  avatar: string;
  rank: string;
  cardCount: number;
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  friendshipId?: string;
}

/** Search for a user by username or @tag */
export async function searchUserByUsername(
  query: string,
  currentUserId: string
): Promise<SearchedUser | null> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return null;

  try {
    const normalized = query.replace(/^@/, '').trim().toLowerCase();
    if (!normalized) return null;

    const { data, error } = await client
      .from('profiles')
      .select('id, username, tag, avatar, rank')
      .or(`username.ilike.${normalized},tag.ilike.@${normalized}`)
      .neq('id', currentUserId)
      .limit(1)
      .single();

    if (error || !data) return null;

    // Their card count
    const { count: cardCount } = await client
      .from('user_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', data.id);

    // Existing friendship?
    const { data: fs } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${data.id}),and(requester_id.eq.${data.id},addressee_id.eq.${currentUserId})`)
      .limit(1)
      .single();

    let friendshipStatus: SearchedUser['friendshipStatus'] = 'none';
    let friendshipId: string | undefined;
    if (fs) {
      friendshipId = fs.id;
      if (fs.status === 'accepted') friendshipStatus = 'accepted';
      else if (fs.requester_id === currentUserId) friendshipStatus = 'pending_sent';
      else friendshipStatus = 'pending_received';
    }

    return {
      id: data.id,
      username: data.username,
      tag: data.tag,
      avatar: data.avatar || 'default',
      rank: data.rank || 'Collector',
      cardCount: cardCount ?? 0,
      friendshipStatus,
      friendshipId,
    };
  } catch (err) {
    console.error('searchUserByUsername error:', err);
    return null;
  }
}

/** Send a friend request */
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Not connected' };
  try {
    const { error } = await client
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: targetUserId, status: 'pending' });
    if (error) {
      if (error.code === '23505') return { success: false, error: 'Friend request already sent.' };
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Accept a pending friend request */
export async function acceptFriendRequest(
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Not connected' };
  try {
    const { error } = await client
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Decline / cancel request or unfriend */
export async function removeFriendship(
  friendshipId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return { success: false, error: 'Not connected' };
  try {
    const { error } = await client
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Fetch all friends and pending requests for a user */
export async function fetchFriendships(
  currentUserId: string
): Promise<FriendshipProfile[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(currentUserId)) return [];

  try {
    const { data: rows, error } = await client
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error || !rows || rows.length === 0) return [];

    const otherUserIds = rows.map((r) =>
      r.requester_id === currentUserId ? r.addressee_id : r.requester_id
    );

    const { data: profiles } = await client
      .from('profiles')
      .select('id, username, tag, avatar, rank')
      .in('id', otherUserIds);

    // Card counts
    const { data: cardRows } = await client
      .from('user_cards')
      .select('user_id')
      .in('user_id', otherUserIds);

    const cardCountMap: Record<string, number> = {};
    (cardRows || []).forEach((c) => {
      cardCountMap[c.user_id] = (cardCountMap[c.user_id] || 0) + 1;
    });

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p; });

    return rows.map((row) => {
      const otherId = row.requester_id === currentUserId ? row.addressee_id : row.requester_id;
      const p = profileMap[otherId] || {};
      let status: FriendshipProfile['status'];
      if (row.status === 'accepted') status = 'accepted';
      else if (row.requester_id === currentUserId) status = 'pending_sent';
      else status = 'pending_received';

      return {
        id: row.id,
        userId: otherId,
        username: p.username || 'Unknown',
        tag: p.tag || `@${p.username || 'unknown'}`,
        avatar: p.avatar || 'default',
        rank: p.rank || 'Collector',
        cardCount: cardCountMap[otherId] ?? 0,
        status,
        createdAt: row.created_at,
      };
    });
  } catch (err) {
    console.error('fetchFriendships error:', err);
    return [];
  }
}
