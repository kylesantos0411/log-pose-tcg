import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase/client';
import { 
  getLocalSoldCards, 
  getDeletedCards, 
  getBinderStorageKey, 
  getPendingOfflineSync, 
  clearPendingOfflineSync, 
  getLocalBinder, 
  type LocalUserCard 
} from './user-collection';
import { getDeletedFavoriteIds } from './favorites';

export interface CloudProfile {
  id: string;
  username: string;
  tag: string;
  email: string | null;
  avatar: string;
  crew: string;
  rank: string;
  rankBadge: string;
  role?: 'admin' | 'user';
  isBanned?: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Robust check for chief administrator (Kyle Santos / @kaipuccino)
 */
export function checkIsChiefAdmin(
  user?: { email?: string | null; tag?: string | null; username?: string | null; name?: string | null } | null
): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const tag = (user.tag || '').toLowerCase().trim();
  const username = (user.username || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();

  return (
    email === 'kylesantos0411@gmail.com' ||
    tag === '@kaipuccino' ||
    tag === 'kaipuccino' ||
    username === 'kaipuccino' ||
    name === 'kaipuccino'
  );
}

export function checkIsAdmin(
  user?: { email?: string | null; tag?: string | null; username?: string | null; name?: string | null; role?: string | null } | null
): boolean {
  if (!user) return false;
  return checkIsChiefAdmin(user) || user.role === 'admin';
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

    const userRole: 'admin' | 'user' = data.role === 'admin' || checkIsChiefAdmin(data)
      ? 'admin'
      : 'user';

    return {
      id: data.id,
      username: data.username,
      tag: data.tag,
      email: data.email,
      avatar: 'default',
      crew: data.crew?.startsWith('CODE:') ? 'Collector' : (data.crew || 'Collector'),
      rank: data.rank || 'Collector',
      rankBadge: '',
      role: userRole,
      isBanned: Boolean(data.is_banned),
      banReason: data.ban_reason || null,
      bannedAt: data.banned_at || null,
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
    // 1. Fetch user_cards (collection)
    const { data: userCardsData, error } = await client
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_wishlist', false);

    // 2. Fetch sold records from card_sales
    let salesRows: any[] = [];
    try {
      const { data: sData } = await client
        .from('card_sales')
        .select('*')
        .eq('user_id', userId)
        .order('sold_date', { ascending: false });
      if (sData) salesRows = sData;
    } catch {
      // Table may not exist yet
    }

    const cardsRows = userCardsData || [];
    if (cardsRows.length === 0 && salesRows.length === 0) return [];

    // Extract unique card_ids to fetch metadata
    const uniqueIds = Array.from(
      new Set([
        ...cardsRows.map((r: any) => r.card_id),
        ...salesRows.map((s: any) => s.card_id),
      ].filter(Boolean))
    );
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

    const soldCards: LocalUserCard[] = salesRows.map((s: any) => {
      const c = cardMap.get(s.card_id);
      return {
        id: s.user_card_id || `uc_sold_${s.id}`,
        cardId: s.card_id,
        quantity: s.quantity || 1,
        condition: s.condition || 'NM',
        isFoil: Boolean(s.is_foil),
        language: s.language || 'jp',
        purchasePrice: null,
        notes: s.notes || null,
        createdAt: s.created_at || new Date().toISOString(),
        status: 'SOLD',
        soldPrice: s.sold_price != null ? Number(s.sold_price) : null,
        soldCurrency: s.sold_currency || 'PHP',
        soldDate: s.sold_date || null,
        soldQuantity: s.quantity || 1,
        isPublicSale: s.is_public !== false,
        buyerSource: s.buyer_source || null,
        buyerNotes: s.notes || null,
        saleId: s.id,
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
          id: s.card_id,
          name: s.card_name || s.card_id,
          category: 'Character',
          colors: 'Red',
          cost: null,
          power: null,
          rarity: 'Common',
          imageUrl: `https://onepiece-cardgame.com/images/cardlist/card/${s.card_id.split('_')[0]}.png`,
          marketPrice: null,
        },
      };
    });

    const ownedCards: LocalUserCard[] = [];
    for (const r of cardsRows) {
      const c = cardMap.get(r.card_id);
      const isSold = r.status === 'SOLD';
      if (isSold) {
        const alreadyInSales = soldCards.some(
          (sc) =>
            sc.cardId === r.card_id &&
            sc.condition === r.condition &&
            sc.isFoil === Boolean(r.is_foil) &&
            sc.language === r.language
        );
        if (!alreadyInSales) {
          soldCards.push({
            id: r.id || `uc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            cardId: r.card_id,
            quantity: r.quantity || 1,
            condition: r.condition || 'NM',
            isFoil: Boolean(r.is_foil),
            language: r.language || 'jp',
            purchasePrice: r.purchase_price !== null && r.purchase_price !== undefined ? Number(r.purchase_price) : null,
            notes: r.notes || null,
            createdAt: r.created_at || new Date().toISOString(),
            status: 'SOLD',
            soldPrice: r.sold_price !== null && r.sold_price !== undefined ? Number(r.sold_price) : null,
            soldCurrency: r.sold_currency || 'PHP',
            soldDate: r.sold_date || null,
            isPublicSale: r.is_public_sale !== false,
            buyerNotes: r.buyer_notes || null,
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
          });
        }
      } else {
        ownedCards.push({
          id: r.id || `uc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          cardId: r.card_id,
          quantity: r.quantity || 1,
          condition: r.condition || 'NM',
          isFoil: Boolean(r.is_foil),
          language: r.language || 'jp',
          purchasePrice: r.purchase_price !== null && r.purchase_price !== undefined ? Number(r.purchase_price) : null,
          notes: r.notes || null,
          createdAt: r.created_at || new Date().toISOString(),
          status: 'OWNED',
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
        });
      }
    }

    return [...ownedCards, ...soldCards];
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
          status: card.status || 'OWNED',
          sold_price: card.soldPrice ?? null,
          sold_currency: card.soldCurrency ?? null,
          sold_date: card.soldDate ?? null,
          is_public_sale: card.isPublicSale !== false,
          buyer_notes: card.buyerNotes ?? null,
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
  if (!client || !isSupabaseConfigured() || !cardId) return false;

  let targetUserId = userId;
  if (!isValidUuid(targetUserId)) {
    try {
      const { data: authData } = await client.auth.getSession();
      if (authData?.session?.user?.id && isValidUuid(authData.session.user.id)) {
        targetUserId = authData.session.user.id;
      }
    } catch {}
  }
  if (!isValidUuid(targetUserId)) return false;

  try {
    let query = client
      .from('user_cards')
      .delete()
      .eq('user_id', targetUserId)
      .ilike('card_id', cardId.trim())
      .eq('is_wishlist', false);

    if (condition) query = query.ilike('condition', condition.trim());
    if (isFoil !== undefined) query = query.eq('is_foil', isFoil);
    if (language) query = query.ilike('language', language.trim());

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
      status: c.status || 'OWNED',
      sold_price: c.soldPrice ?? null,
      sold_currency: c.soldCurrency ?? null,
      sold_date: c.soldDate ?? null,
      is_public_sale: c.isPublicSale !== false,
      buyer_notes: c.buyerNotes ?? null,
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

// ─────────────────────────────────────────────
// CARD SALES & COMMUNITY REFERENCE
// ─────────────────────────────────────────────

export interface CloudSaleRecord {
  id: string;
  userId: string;
  userCardId?: string;
  cardId: string;
  cardName?: string;
  condition: string;
  isFoil: boolean;
  language: string;
  soldPrice: number;
  soldCurrency: string;
  soldDate: string;
  quantity: number;
  isPublic: boolean;
  buyerSource?: string;
  buyerUserTag?: string;
  verifiedByBuyer?: boolean;
  isOutlier?: boolean;
  flagsCount?: number;
  notes?: string;
  createdAt: string;
}

/**
 * Record a card sale in Supabase:
 * 1. Inserts into public.card_sales
 * 2. Updates the collection record in public.user_cards to status = 'SOLD'
 */
export async function recordCloudSale(
  userId: string,
  sale: {
    userCardId: string;
    cardId: string;
    cardName?: string;
    condition: string;
    isFoil: boolean;
    language: string;
    soldPrice: number;
    soldCurrency: string;
    soldDate: string;
    quantity: number;
    isPublic: boolean;
    buyerSource?: string;
    buyerUserTag?: string;
    isOutlier?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; saleId?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, error: 'Database client not connected' };
  }

  let targetUserId = userId;
  if (!isValidUuid(targetUserId)) {
    try {
      const { data: authData } = await client.auth.getSession();
      if (authData?.session?.user?.id && isValidUuid(authData.session.user.id)) {
        targetUserId = authData.session.user.id;
      }
    } catch {}
  }

  if (!isValidUuid(targetUserId)) {
    // Pure local / guest session: sale is safely preserved in local storage
    return { success: true };
  }

  try {
    // Velocity Rate Limiting: Max 5 sales per card variant per user in 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await client
      .from('card_sales')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('card_id', sale.cardId)
      .gte('created_at', oneDayAgo);

    const isRateLimited = (recentCount || 0) >= 5;
    const finalIsPublic = isRateLimited ? false : (sale.isPublic !== false);

    // 1. Insert into card_sales
    const { data: insertedSale, error: saleErr } = await client
      .from('card_sales')
      .insert({
        user_id: targetUserId,
        user_card_id: sale.userCardId,
        card_id: sale.cardId,
        card_name: sale.cardName || sale.cardId,
        condition: sale.condition || 'NM',
        is_foil: Boolean(sale.isFoil),
        language: sale.language || 'jp',
        sold_price: sale.soldPrice,
        sold_currency: sale.soldCurrency || 'PHP',
        sold_date: sale.soldDate,
        quantity: sale.quantity || 1,
        is_public: finalIsPublic,
        buyer_source: sale.buyerSource || null,
        buyer_user_tag: sale.buyerUserTag || null,
        is_outlier: Boolean(sale.isOutlier),
        verified_by_buyer: false,
        flags_count: 0,
        notes: sale.notes || null,
      })
      .select('id')
      .single();

    if (saleErr) {
      console.warn('Could not insert into card_sales table (check if migration is applied):', saleErr);
    }

    // 2. Adjust active collection inventory in user_cards
    const { data: existingCard } = await client
      .from('user_cards')
      .select('id, quantity, status')
      .eq('user_id', userId)
      .eq('card_id', sale.cardId)
      .eq('condition', sale.condition || 'NM')
      .eq('is_foil', Boolean(sale.isFoil))
      .eq('language', sale.language || 'jp')
      .maybeSingle();

    if (existingCard) {
      const remainingQty = (existingCard.quantity || 1) - (sale.quantity || 1);
      if (remainingQty > 0) {
        // Partial sale: decrement owned inventory quantity
        await client
          .from('user_cards')
          .update({
            quantity: remainingQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCard.id);
      } else {
        // Full sale: try setting status = 'SOLD' if column exists
        const { error: updateErr } = await client
          .from('user_cards')
          .update({
            status: 'SOLD',
            sold_price: sale.soldPrice,
            sold_currency: sale.soldCurrency || 'PHP',
            sold_date: sale.soldDate,
            is_public_sale: sale.isPublic !== false,
            buyer_notes: sale.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCard.id);

        if (updateErr) {
          // If status column doesn't exist yet in user_cards, remove from active owned cards table
          // so it doesn't reappear as owned
          await client
            .from('user_cards')
            .delete()
            .eq('id', existingCard.id);
        }
      }
    }

    return { success: true, saleId: insertedSale?.id };
  } catch (err: any) {
    console.error('recordCloudSale error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reverses a card sale:
 * 1. Resets collection item in user_cards to status = 'OWNED'
 * 2. Deletes or revokes the sale record in card_sales
 */
export async function undoCloudSale(
  userId: string,
  userCardId: string,
  cardId: string,
  condition?: string,
  isFoil?: boolean,
  language?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, error: 'Database client not connected' };
  }

  let targetUserId = userId;
  if (!isValidUuid(targetUserId)) {
    try {
      const { data: authData } = await client.auth.getSession();
      if (authData?.session?.user?.id && isValidUuid(authData.session.user.id)) {
        targetUserId = authData.session.user.id;
      }
    } catch {}
  }

  if (!isValidUuid(targetUserId)) {
    return { success: true };
  }

  try {
    // 1. Delete matching row from card_sales
    await client
      .from('card_sales')
      .delete()
      .eq('user_id', targetUserId)
      .or(`user_card_id.eq.${userCardId},card_id.eq.${cardId}`);

    // 2. Restore user_cards status or quantity
    const { data: existing } = await client
      .from('user_cards')
      .select('id, quantity, status')
      .eq('user_id', targetUserId)
      .eq('card_id', cardId)
      .eq('condition', condition || 'NM')
      .eq('is_foil', Boolean(isFoil))
      .eq('language', language || 'jp')
      .maybeSingle();

    if (existing) {
      await client
        .from('user_cards')
        .update({
          status: 'OWNED',
          quantity: (existing.quantity || 0) + 1,
          sold_price: null,
          sold_currency: null,
          sold_date: null,
          buyer_notes: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await client.from('user_cards').insert({
        user_id: targetUserId,
        card_id: cardId,
        quantity: 1,
        condition: condition || 'NM',
        is_foil: Boolean(isFoil),
        language: language || 'jp',
        status: 'OWNED',
        is_wishlist: false,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('undoCloudSale error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing sale in Supabase
 */
export async function editCloudSale(
  userId: string,
  userCardId: string,
  cardId: string,
  data: {
    soldPrice: number;
    soldCurrency: string;
    soldDate: string;
    isPublic?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, error: 'Database client not connected' };
  }

  let targetUserId = userId;
  if (!isValidUuid(targetUserId)) {
    try {
      const { data: authData } = await client.auth.getSession();
      if (authData?.session?.user?.id && isValidUuid(authData.session.user.id)) {
        targetUserId = authData.session.user.id;
      }
    } catch {}
  }

  if (!isValidUuid(targetUserId)) {
    return { success: true };
  }

  try {
    // Update card_sales
    await client
      .from('card_sales')
      .update({
        sold_price: data.soldPrice,
        sold_currency: data.soldCurrency,
        sold_date: data.soldDate,
        is_public: data.isPublic !== false,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId)
      .or(`user_card_id.eq.${userCardId},card_id.eq.${cardId}`);

    // Update user_cards
    await client
      .from('user_cards')
      .update({
        sold_price: data.soldPrice,
        sold_currency: data.soldCurrency,
        sold_date: data.soldDate,
        is_public_sale: data.isPublic !== false,
        buyer_notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId)
      .eq('card_id', cardId);

    return { success: true };
  } catch (err: any) {
    console.error('editCloudSale error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch verified community sales for a specific card variant.
 * Note: Queries by exact canonical card_id so variants are NEVER mixed.
 */
export async function fetchCommunitySales(
  cardId: string,
  options?: {
    condition?: string;
    limit?: number;
  }
): Promise<CloudSaleRecord[]> {
  const localSalesRecords: CloudSaleRecord[] = [];

  // 1. Gather all verified local sold cards first (instant offline & local support)
  if (typeof window !== 'undefined') {
    try {
      const localSold = getLocalSoldCards(cardId);
      for (const s of localSold) {
        localSalesRecords.push({
          id: s.saleId || s.id,
          userId: 'local',
          userCardId: s.id,
          cardId: s.cardId || cardId,
          cardName: s.card?.name || s.cardId,
          condition: s.condition || 'NM',
          isFoil: Boolean(s.isFoil),
          language: s.language || 'jp',
          soldPrice: Number(s.soldPrice),
          soldCurrency: s.soldCurrency || 'PHP',
          soldDate: s.soldDate || s.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          quantity: s.soldQuantity || s.quantity || 1,
          isPublic: s.isPublicSale !== false,
          buyerSource: s.buyerSource || undefined,
          buyerUserTag: s.buyerUserTag || undefined,
          verifiedByBuyer: s.verifiedByBuyer,
          isOutlier: s.isOutlier,
          flagsCount: s.flagsCount || 0,
          notes: s.buyerNotes || s.notes || undefined,
          createdAt: s.createdAt,
        });
      }
    } catch (err) {
      console.warn('Could not read local sold cards for community reference:', err);
    }
  }

  // 2. Query Supabase cloud card_sales table
  let cloudSalesRecords: CloudSaleRecord[] = [];
  const client = getSupabaseBrowserClient();
  if (client && isSupabaseConfigured()) {
    try {
      let query = client
        .from('card_sales')
        .select('*')
        .ilike('card_id', cardId.trim())
        .eq('is_public', true)
        .order('sold_date', { ascending: false })
        .limit(options?.limit || 30);

      if (options?.condition && options.condition !== 'All') {
        query = query.eq('condition', options.condition);
      }

      const { data, error } = await query;
      if (!error && data) {
        cloudSalesRecords = data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userCardId: r.user_card_id,
          cardId: r.card_id,
          cardName: r.card_name,
          condition: r.condition,
          isFoil: Boolean(r.is_foil),
          language: r.language,
          soldPrice: Number(r.sold_price),
          soldCurrency: r.sold_currency || 'PHP',
          soldDate: r.sold_date,
          quantity: r.quantity || 1,
          isPublic: Boolean(r.is_public),
          buyerSource: r.buyer_source,
          buyerUserTag: r.buyer_user_tag || undefined,
          verifiedByBuyer: Boolean(r.verified_by_buyer),
          isOutlier: Boolean(r.is_outlier),
          flagsCount: r.flags_count || 0,
          notes: r.notes,
          createdAt: r.created_at,
        }));
      }
    } catch (err) {
      console.warn('fetchCommunitySales cloud query failed:', err);
    }
  }

  // 3. Merge Local + Cloud sales with deduplication
  const combined: CloudSaleRecord[] = [...localSalesRecords];
  for (const cs of cloudSalesRecords) {
    const isDuplicate = combined.some(
      (ls) =>
        ls.id === cs.id ||
        (ls.userCardId && cs.userCardId && ls.userCardId === cs.userCardId) ||
        (ls.cardId.toLowerCase() === cs.cardId.toLowerCase() &&
          ls.condition === cs.condition &&
          ls.soldPrice === cs.soldPrice &&
          ls.soldDate === cs.soldDate)
    );
    if (!isDuplicate) {
      combined.push(cs);
    }
  }

  // 4. Condition filter
  let filtered = combined;
  if (options?.condition && options.condition !== 'All') {
    filtered = filtered.filter((s) => s.condition === options.condition);
  }

  // 5. Sort by soldDate descending
  filtered.sort((a, b) => new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime());

  // 6. Return limited records
  return filtered.slice(0, options?.limit || 30);
}

/**
 * Report a suspicious or manipulative sale record
 */
export async function reportSuspiciousSale(saleId: string): Promise<{ success: boolean }> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('logpose_reported_sales') || '[]';
      const arr = JSON.parse(stored);
      if (!arr.includes(saleId)) {
        arr.push(saleId);
        localStorage.setItem('logpose_reported_sales', JSON.stringify(arr));
      }
    } catch {}
  }

  const client = getSupabaseBrowserClient();
  if (client && isSupabaseConfigured() && isValidUuid(saleId)) {
    try {
      await client.rpc('report_suspicious_sale', { target_sale_id: saleId });
    } catch (err) {
      console.warn('Could not increment cloud flag count:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('logpose_collection_updated'));
  }

  return { success: true };
}

/**
 * Confirm a mutual friend trade
 */
export async function confirmMutualTrade(saleId: string, buyerTag: string): Promise<{ success: boolean }> {
  // Update local binders if found
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('logpose_binder_') || key === 'logpose_user_binder')) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            let modified = false;
            for (const item of parsed) {
              if (item.id === saleId || item.saleId === saleId) {
                item.verifiedByBuyer = true;
                modified = true;
              }
            }
            if (modified) {
              localStorage.setItem(key, JSON.stringify(parsed));
            }
          }
        }
      }
    } catch {}
  }

  // Update cloud card_sales if configured
  const client = getSupabaseBrowserClient();
  if (client && isSupabaseConfigured() && isValidUuid(saleId)) {
    try {
      await client.rpc('confirm_mutual_trade', {
        target_sale_id: saleId,
        buyer_tag: buyerTag,
      });
    } catch {
      // Fallback direct update
      await client
        .from('card_sales')
        .update({ verified_by_buyer: true, is_verified: true })
        .eq('id', saleId);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('logpose_collection_updated'));
  }

  return { success: true };
}

/**
 * Fetch trades pending mutual confirmation for a specific user tag
 */
export async function fetchPendingTradeConfirmations(buyerTag: string): Promise<CloudSaleRecord[]> {
  const cleanTag = buyerTag.trim().toLowerCase();
  const pending: CloudSaleRecord[] = [];

  // 1. Check local storage
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('logpose_binder_') || key === 'logpose_user_binder')) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (
                item.status === 'SOLD' &&
                item.buyerUserTag &&
                item.buyerUserTag.trim().toLowerCase() === cleanTag &&
                !item.verifiedByBuyer
              ) {
                pending.push({
                  id: item.saleId || item.id,
                  userId: 'local',
                  userCardId: item.id,
                  cardId: item.cardId,
                  cardName: item.card?.name || item.cardId,
                  condition: item.condition || 'NM',
                  isFoil: Boolean(item.isFoil),
                  language: item.language || 'jp',
                  soldPrice: Number(item.soldPrice),
                  soldCurrency: item.soldCurrency || 'PHP',
                  soldDate: item.soldDate || item.createdAt?.slice(0, 10),
                  quantity: item.soldQuantity || item.quantity || 1,
                  isPublic: item.isPublicSale !== false,
                  buyerSource: item.buyerSource || 'Sold to Friend',
                  buyerUserTag: item.buyerUserTag,
                  verifiedByBuyer: false,
                  isOutlier: item.isOutlier,
                  flagsCount: item.flagsCount || 0,
                  notes: item.buyerNotes || item.notes || undefined,
                  createdAt: item.createdAt,
                });
              }
            }
          }
        }
      }
    } catch {}
  }

  // 2. Check Supabase cloud
  const client = getSupabaseBrowserClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('card_sales')
        .select('*')
        .ilike('buyer_user_tag', cleanTag)
        .eq('verified_by_buyer', false)
        .order('sold_date', { ascending: false });

      if (!error && data) {
        for (const r of data) {
          if (!pending.some((p) => p.id === r.id)) {
            pending.push({
              id: r.id,
              userId: r.user_id,
              userCardId: r.user_card_id,
              cardId: r.card_id,
              cardName: r.card_name,
              condition: r.condition,
              isFoil: Boolean(r.is_foil),
              language: r.language,
              soldPrice: Number(r.sold_price),
              soldCurrency: r.sold_currency || 'PHP',
              soldDate: r.sold_date,
              quantity: r.quantity || 1,
              isPublic: Boolean(r.is_public),
              buyerSource: r.buyer_source,
              buyerUserTag: r.buyer_user_tag || undefined,
              verifiedByBuyer: false,
              isOutlier: Boolean(r.is_outlier),
              flagsCount: r.flags_count || 0,
              notes: r.notes,
              createdAt: r.created_at,
            });
          }
        }
      }
    } catch {}
  }

  return pending;
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
  if (!client || !isSupabaseConfigured() || !cardId) return false;

  let targetUserId = userId;
  if (!isValidUuid(targetUserId)) {
    try {
      const { data: authData } = await client.auth.getSession();
      if (authData?.session?.user?.id && isValidUuid(authData.session.user.id)) {
        targetUserId = authData.session.user.id;
      }
    } catch {}
  }
  if (!isValidUuid(targetUserId)) return false;

  try {
    const { error } = await client
      .from('user_cards')
      .delete()
      .eq('user_id', targetUserId)
      .ilike('card_id', cardId.trim())
      .eq('is_wishlist', true);
    return !error;
  } catch (err) {
    console.error('Failed to remove favorite from cloud:', err);
    return false;
  }
}

/**
 * Synchronize local favorites with Supabase cloud (bidirectional union respecting local tombstones)
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

  const deletedFavoriteIds = new Set(getDeletedFavoriteIds());
  // Ensure local favorites do not contain any locally deleted items
  localFavorites = localFavorites.filter((id) => !deletedFavoriteIds.has(id));

  const cloudIds = await fetchCloudFavorites(userId);

  // For any favorite marked as deleted locally that still exists in cloud, purge it from cloud
  for (const delId of deletedFavoriteIds) {
    if (cloudIds.includes(delId)) {
      removeFavoriteFromCloud(userId, delId).catch(() => {});
    }
  }

  // Filter cloud favorites to omit any locally deleted cards
  const activeCloudIds = cloudIds.filter((id) => !deletedFavoriteIds.has(id));

  // Union of local and cloud favorites
  const mergedSet = new Set<string>([...activeCloudIds, ...localFavorites]);
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
 * Central synchronizer: fully reconciles user collection and favorites between cloud and local.
 * Supabase cloud is the authoritative single source of truth for authenticated users.
 */
export async function syncUserCloudData(userId: string, userTag: string): Promise<void> {
  if (!userId || typeof window === 'undefined' || !isValidUuid(userId)) return;

  try {
    // 1. Sync favorites with Supabase cloud
    await syncFavoritesWithCloud(userId);

    // 2. Replay any pending offline operations for this user before fetching latest state
    const pendingOffline = getPendingOfflineSync(userTag);
    if (pendingOffline.length > 0) {
      for (const item of pendingOffline) {
        if (item.type === 'DELETE') {
          await removeCardFromCloud(
            userId,
            item.card.cardId,
            item.card.condition,
            item.card.isFoil,
            item.card.language
          ).catch(() => {});
        } else if (item.type === 'UPSERT') {
          await syncCardToCloud(userId, item.card).catch(() => {});
        }
      }
      clearPendingOfflineSync(userTag);
    }

    // 3. Fetch canonical cards stored in Supabase cloud
    const cloudCards = await fetchCloudCards(userId);
    const userKey = getBinderStorageKey(userTag);

    // 4. If cloud has zero cards, check if this is an initial local binder (e.g. newly registered account)
    if (cloudCards.length === 0) {
      const localCards = getLocalBinder(userTag);
      if (localCards.length > 0) {
        // Upload initial local cards to cloud once
        await migrateLocalBinderToCloud(userId, localCards);
      }
      return;
    }

    // 5. Authoritative sync: Set user's local binder directly from cloud
    // This ensures all devices (PC, mobile, tablet) display identical collection data
    // and prevents stale/deleted cards from being resurrected or combined!
    localStorage.setItem(userKey, JSON.stringify(cloudCards));
    window.dispatchEvent(new Event('logpose_collection_updated'));
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

// =============================================================================
// SYSTEM SETTINGS & ADMIN CONTROLS
// =============================================================================

export interface MaintenanceSetting {
  enabled: boolean;
  message?: string;
  estimatedTime?: string | null;
}

export interface AnnouncementSetting {
  enabled: boolean;
  message?: string;
  type?: 'info' | 'warning' | 'alert';
}

export type AppFeatureKey = 
  | 'decks' 
  | 'collection' 
  | 'sets' 
  | 'cards' 
  | 'favorites' 
  | 'friends' 
  | 'vintage' 
  | 'communitySales';

export interface FeatureLockStatus {
  locked: boolean;
  message?: string;
  lockedAt?: string;
}

export type FeaturesLockMap = Partial<Record<AppFeatureKey, FeatureLockStatus>>;

export interface FeatureDefinition {
  key: AppFeatureKey;
  label: string;
  route?: string;
  description: string;
  iconName: string;
  defaultMessage: string;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: 'decks',
    label: 'Recommended Decks',
    route: '/decks',
    description: 'Deck lists, meta archetypes, and deck details',
    iconName: 'Swords',
    defaultMessage: 'Recommended Decks is temporarily paused for decklist balancing and updates.',
  },
  {
    key: 'collection',
    label: 'My Collection & Binder',
    route: '/collection',
    description: 'User card collection, cloud binder sync, and sales logging',
    iconName: 'FolderHeart',
    defaultMessage: 'My Collection binder is temporarily locked for scheduled database maintenance.',
  },
  {
    key: 'sets',
    label: 'Expansion Sets Explorer',
    route: '/sets',
    description: 'Official booster packs, starter decks, and promo catalogs',
    iconName: 'Boxes',
    defaultMessage: 'Expansion Sets browser is temporarily paused for catalog updates.',
  },
  {
    key: 'cards',
    label: 'Card Database Search',
    route: '/cards',
    description: 'Global card database search and detailed card pages',
    iconName: 'Layers',
    defaultMessage: 'Card Database search is temporarily paused for data synchronization.',
  },
  {
    key: 'favorites',
    label: 'Favorites & Wishlist',
    route: '/favorites',
    description: 'Personal saved cards and wishlist tracking',
    iconName: 'Star',
    defaultMessage: 'Favorites & Wishlist is temporarily paused for maintenance.',
  },
  {
    key: 'friends',
    label: 'Friends & Community Trades',
    route: '/friends',
    description: 'Community profiles, trade discovery, and friend requests',
    iconName: 'Users',
    defaultMessage: 'Friends & Community Trading is temporarily paused for maintenance.',
  },
  {
    key: 'vintage',
    label: 'Vintage Cards Archive',
    description: 'Vintage Carddass (1999-2005) sets catalog & eBay pricing',
    iconName: 'Flame',
    defaultMessage: 'Vintage Cards Archive is temporarily paused for market pricing calibration.',
  },
  {
    key: 'communitySales',
    label: 'Community Sales Submissions',
    description: 'Marking cards as sold and submitting public transaction prices',
    iconName: 'ShoppingBag',
    defaultMessage: 'Public community sales submissions are temporarily locked for moderation.',
  },
];

export interface SystemSettingsState {
  maintenance: MaintenanceSetting;
  announcement: AnnouncementSetting;
  features?: FeaturesLockMap;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsState = {
  maintenance: {
    enabled: false,
    message: 'Log Pose TCG is temporarily docking for scheduled maintenance and upgrades. We will be back online shortly!',
    estimatedTime: null,
  },
  announcement: {
    enabled: false,
    message: '',
    type: 'info',
  },
  features: {},
};

const SYSTEM_SETTINGS_CACHE_KEY = 'logpose_system_settings_cache';

/**
 * Fetch global system settings (maintenance mode, announcement & individual feature locks)
 */
export async function fetchSystemSettings(): Promise<SystemSettingsState> {
  // Check local cache first for instant fallback
  let cachedSettings: SystemSettingsState = { ...DEFAULT_SYSTEM_SETTINGS };
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SYSTEM_SETTINGS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cachedSettings = {
          maintenance: { ...DEFAULT_SYSTEM_SETTINGS.maintenance, ...(parsed.maintenance || {}) },
          announcement: { ...DEFAULT_SYSTEM_SETTINGS.announcement, ...(parsed.announcement || {}) },
          features: { ...(parsed.features || {}) },
        };
      }
    } catch {
      // ignore JSON errors
    }
  }

  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) {
    return cachedSettings;
  }

  try {
    const { data, error } = await client
      .from('system_settings')
      .select('key, value');

    if (error || !data || data.length === 0) {
      return cachedSettings;
    }

    const res: SystemSettingsState = {
      maintenance: { ...DEFAULT_SYSTEM_SETTINGS.maintenance },
      announcement: { ...DEFAULT_SYSTEM_SETTINGS.announcement },
      features: {},
    };

    data.forEach((row) => {
      let val = row.value;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          // ignore
        }
      }
      if (row.key === 'maintenance' && val) {
        res.maintenance = { ...DEFAULT_SYSTEM_SETTINGS.maintenance, ...val };
      } else if (row.key === 'announcement' && val) {
        res.announcement = {
          ...DEFAULT_SYSTEM_SETTINGS.announcement,
          ...val,
          enabled: Boolean(val?.enabled),
        };
      } else if (row.key === 'features' && val) {
        res.features = { ...val };
      }
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SYSTEM_SETTINGS_CACHE_KEY, JSON.stringify(res));
      } catch {
        // ignore
      }
    }

    return res;
  } catch (err) {
    console.warn('fetchSystemSettings error:', err);
    return cachedSettings;
  }
}

/**
 * Update system settings (Admin only)
 */
export async function updateSystemSetting(
  key: 'maintenance' | 'announcement' | 'features',
  value: Record<string, any>,
  adminTag?: string
): Promise<{ success: boolean; error?: string }> {
  // Update local cache immediately
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SYSTEM_SETTINGS_CACHE_KEY);
      const parsed: SystemSettingsState = stored ? JSON.parse(stored) : { ...DEFAULT_SYSTEM_SETTINGS };
      if (key === 'maintenance') {
        parsed.maintenance = { ...parsed.maintenance, ...(value as any) };
      } else if (key === 'announcement') {
        parsed.announcement = { ...parsed.announcement, ...(value as any) };
      } else if (key === 'features') {
        parsed.features = { ...(value as any) };
      }
      localStorage.setItem(SYSTEM_SETTINGS_CACHE_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new Event('logpose_settings_updated'));
    } catch {
      // ignore
    }
  }

  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await client
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: adminTag || 'admin',
      });

    if (error) {
      console.warn('updateSystemSetting supabase error, fallback to local:', error.message);
      return { success: false, error: error.message };
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('logpose_settings_updated'));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update system setting' };
  }
}

export interface AdminUserRecord {
  id: string;
  username: string;
  tag: string;
  email: string | null;
  role: 'admin' | 'user';
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  rank: string;
  crew: string;
  cardCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt?: string | null;
  lastLogin?: string | null;
  lastActive?: string | null;
}

/**
 * Format timestamp into friendly relative time (e.g., 'Just now', '5m ago', '2h ago', '3d ago')
 */
export function formatActivityRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'Never';
  const now = Date.now();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 0 || diffSec < 60) return 'Just now';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  }
  if (diffSec < 86400 * 7) {
    const days = Math.floor(diffSec / 86400);
    return `${days}d ago`;
  }
  if (diffSec < 86400 * 30) {
    const weeks = Math.floor(diffSec / (86400 * 7));
    return `${weeks}w ago`;
  }
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Checks if a user was active within the given threshold (default 5 minutes)
 */
export function isUserRecentlyActive(dateStr?: string | null, minutesThreshold: number = 5): boolean {
  if (!dateStr) return false;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return false;
  return (Date.now() - time) < minutesThreshold * 60 * 1000;
}

/**
 * Touch user activity and/or login timestamp in Supabase
 */
export async function touchUserActivity(userId: string, isLogin: boolean = false): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(userId)) return;

  try {
    // 1. Try secure RPC first
    const { error: rpcError } = await client.rpc('touch_user_activity', {
      p_is_login: isLogin,
    });
    if (!rpcError) return;

    // 2. Direct table update fallback
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      last_active_at: nowIso,
      updated_at: nowIso,
    };
    if (isLogin) {
      updatePayload.last_login = nowIso;
    }

    const { error: updateError } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      // 3. Fallback to updating updated_at if new columns are not yet migrated
      await client
        .from('profiles')
        .update({ updated_at: nowIso })
        .eq('id', userId);
    }
  } catch (err) {
    // Silent catch: telemetry should never break app flow
  }
}

/**
 * Fetch all users for Admin User Management table
 */
export async function fetchAllUsersForAdmin(): Promise<AdminUserRecord[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return [];

  try {
    let profiles: any[] | null = null;

    // 1. Try secure RPC that joins auth.users for exact last_sign_in_at
    try {
      const { data: rpcData, error: rpcError } = await client.rpc('admin_get_users_activity');
      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        profiles = rpcData;
      }
    } catch {
      // RPC may not be installed yet
    }

    // 2. Direct profiles select with last_login and last_active_at
    if (!profiles) {
      const { data: fullProfiles, error: fullError } = await client
        .from('profiles')
        .select('id, username, tag, email, role, is_banned, ban_reason, banned_at, rank, crew, created_at, updated_at, last_login, last_active_at')
        .order('created_at', { ascending: false });

      if (!fullError && fullProfiles) {
        profiles = fullProfiles;
      } else {
        // Fallback without new columns if migration hasn't been executed
        const { data: baseProfiles } = await client
          .from('profiles')
          .select('id, username, tag, email, role, is_banned, ban_reason, banned_at, rank, crew, created_at, updated_at')
          .order('created_at', { ascending: false });
        profiles = baseProfiles || [];
      }
    }

    // Fetch card counts
    const { data: cards } = await client
      .from('user_cards')
      .select('user_id');

    const cardMap: Record<string, number> = {};
    (cards || []).forEach((c) => {
      cardMap[c.user_id] = (cardMap[c.user_id] || 0) + 1;
    });

    // Fetch sales counts
    const { data: sales } = await client
      .from('card_sales')
      .select('user_id');

    const saleMap: Record<string, number> = {};
    (sales || []).forEach((s) => {
      saleMap[s.user_id] = (saleMap[s.user_id] || 0) + 1;
    });

    const activeProfiles = profiles.filter((p) => {
      if (p.ban_reason === 'RECYCLED_ACCOUNT' || p.crew === 'RECYCLED' || p.rank === 'RECYCLED') {
        return false;
      }
      return true;
    });

    return activeProfiles.map((p) => {
      const isChiefAdmin = checkIsChiefAdmin(p);
      const lastActive = p.last_active_at || p.auth_last_sign_in_at || p.last_login || p.updated_at || p.created_at;
      const lastLogin = p.last_login || p.auth_last_sign_in_at || p.updated_at || p.created_at;

      return {
        id: p.id,
        username: p.username || 'Unknown',
        tag: p.tag || `@${p.username || 'unknown'}`,
        email: p.email || null,
        role: (p.role === 'admin' || isChiefAdmin) ? 'admin' : 'user',
        isBanned: Boolean(p.is_banned),
        banReason: p.ban_reason || null,
        bannedAt: p.banned_at || null,
        rank: p.rank || 'Collector',
        crew: p.crew || 'Collector',
        cardCount: cardMap[p.id] || 0,
        salesCount: saleMap[p.id] || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at || null,
        lastLogin: lastLogin || null,
        lastActive: lastActive || null,
      };
    });
  } catch (err) {
    console.error('fetchAllUsersForAdmin exception:', err);
    return [];
  }
}

/**
 * Ban or unban a user (Admin only)
 */
export async function adminSetUserBan(
  targetUserId: string,
  shouldBan: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(targetUserId)) {
    return { success: false, error: 'Database client unavailable or invalid user ID' };
  }

  try {
    // Try via RPC first
    const { error: rpcError } = await client.rpc('admin_set_user_ban', {
      target_user_id: targetUserId,
      should_ban: shouldBan,
      reason: reason || null,
    });

    if (!rpcError) {
      return { success: true };
    }

    // Direct fallback
    const { error: directError } = await client
      .from('profiles')
      .update({
        is_banned: shouldBan,
        ban_reason: shouldBan ? (reason || 'Violation of community policies') : null,
        banned_at: shouldBan ? new Date().toISOString() : null,
      })
      .eq('id', targetUserId);

    if (directError) {
      return { success: false, error: directError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update ban status' };
  }
}

/**
 * Permanently recycle an inactive tester account (Admin only).
 * Invokes admin_recycle_user RPC if present, and falls back to ban/recycle flagging.
 */
export async function adminRecycleUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(targetUserId)) {
    return { success: false, error: 'Database client unavailable or invalid user ID' };
  }

  try {
    // 1. Try full cascade recycle RPC (requires 20261006_admin_recycle_user.sql migration)
    const { error: rpcError } = await client.rpc('admin_recycle_user', {
      target_user_id: targetUserId,
    });

    if (!rpcError) {
      return { success: true };
    }

    // 2. Fallback: ban and mark as recycled using existing admin_set_user_ban RPC
    const banRes = await adminSetUserBan(targetUserId, true, 'RECYCLED_ACCOUNT');
    return banRes;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to recycle user' };
  }
}

/**
 * Fetch reported or flagged sales for Admin Moderation Queue
 */
export async function fetchReportedSalesForAdmin(): Promise<CloudSaleRecord[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await client
      .from('card_sales')
      .select('*')
      .or('flags_count.gt.0,is_outlier.eq.true')
      .order('flags_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      console.warn('fetchReportedSalesForAdmin error:', error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      cardId: row.card_id,
      cardName: row.card_name,
      condition: row.condition || 'NM',
      isFoil: Boolean(row.is_foil),
      language: row.language || 'jp',
      soldPrice: Number(row.sold_price),
      soldCurrency: row.sold_currency || 'PHP',
      soldDate: row.sold_date,
      quantity: row.quantity || 1,
      isPublic: Boolean(row.is_public),
      buyerSource: row.buyer_source || undefined,
      notes: row.notes || undefined,
      isOutlier: Boolean(row.is_outlier),
      isVerified: Boolean(row.is_verified),
      flagsCount: row.flags_count || 0,
      buyerUserTag: row.buyer_user_tag || undefined,
      verifiedByBuyer: Boolean(row.verified_by_buyer),
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('fetchReportedSalesForAdmin exception:', err);
    return [];
  }
}

/**
 * Admin: Delete a fraudulent sale permanently
 */
export async function adminDeleteSale(targetSaleId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(targetSaleId)) {
    return { success: false, error: 'Invalid sale ID or client unavailable' };
  }

  try {
    const { error: rpcError } = await client.rpc('admin_delete_sale', {
      target_sale_id: targetSaleId,
    });

    if (!rpcError) return { success: true };

    const { error: directError } = await client
      .from('card_sales')
      .delete()
      .eq('id', targetSaleId);

    if (directError) return { success: false, error: directError.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete sale' };
  }
}

/**
 * Admin: Dismiss reports on a card sale
 */
export async function adminDismissFlags(targetSaleId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured() || !isValidUuid(targetSaleId)) {
    return { success: false, error: 'Invalid sale ID or client unavailable' };
  }

  try {
    const { error: rpcError } = await client.rpc('admin_dismiss_flags', {
      target_sale_id: targetSaleId,
    });

    if (!rpcError) return { success: true };

    const { error: directError } = await client
      .from('card_sales')
      .update({ flags_count: 0 })
      .eq('id', targetSaleId);

    if (directError) return { success: false, error: directError.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dismiss flags' };
  }
}
