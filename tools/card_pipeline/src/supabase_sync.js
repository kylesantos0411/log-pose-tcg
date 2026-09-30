/**
 * @file supabase_sync.js
 * Synchronizes canonical card catalog and pricing records directly with live Supabase database.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { SupportedSets } from './types.js';

dotenv.config();

export class SupabaseSyncService {
  constructor(options = {}) {
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = options.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.client = null;

    if (this.supabaseUrl && this.supabaseKey && this.supabaseUrl.startsWith('https://')) {
      try {
        this.client = createClient(this.supabaseUrl, this.supabaseKey, {
          auth: { persistSession: false }
        });
      } catch (err) {
        console.warn(`[SupabaseSyncService] Client initialization failed: ${err.message}`);
      }
    }
  }

  isConfigured() {
    return this.client !== null;
  }

  /**
   * Ensures games and sets exist in Supabase.
   */
  async ensureSetsExist() {
    if (!this.client) return { success: false, reason: 'Not configured' };

    try {
      // 1. Ensure game exists
      const { data: game, error: gameErr } = await this.client
        .from('games')
        .upsert({ name: 'One Piece Card Game' }, { onConflict: 'name' })
        .select()
        .single();

      if (gameErr) {
        console.warn(`[SupabaseSyncService] Failed to upsert game: ${gameErr.message}`);
        return { success: false, error: gameErr };
      }

      const gameId = game.id;

      // 2. Upsert supported sets
      const setsToUpsert = Object.values(SupportedSets).map(set => ({
        game_id: gameId,
        set_code: set.setCode,
        name: set.name,
        release_date: set.releaseDate
      }));

      const { data: sets, error: setsErr } = await this.client
        .from('sets')
        .upsert(setsToUpsert, { onConflict: 'game_id,set_code' })
        .select();

      if (setsErr) {
        console.warn(`[SupabaseSyncService] Failed to upsert sets: ${setsErr.message}`);
        return { success: false, error: setsErr };
      }

      const setMap = new Map();
      for (const s of sets) {
        setMap.set(s.set_code, s.id);
      }

      return { success: true, setMap };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates a ready-to-run SQL insert/upsert script for Supabase SQL Editor.
   */
  generateSyncSql(cardCatalog, priceRecords) {
    const lines = [];
    lines.push('-- LOG POSE TCG - Canonical Data Sync Script');
    lines.push('-- Generated at: ' + new Date().toISOString());
    lines.push('BEGIN;\n');

    lines.push('-- 1. Upsert Game');
    lines.push(`INSERT INTO games (name) VALUES ('One Piece Card Game') ON CONFLICT (name) DO NOTHING;\n`);

    lines.push('-- 2. Upsert Sets');
    for (const s of Object.values(SupportedSets)) {
      lines.push(`INSERT INTO sets (game_id, set_code, name, release_date)
SELECT id, '${s.setCode}', '${s.name.replace(/'/g, "''")}', '${s.releaseDate}'
FROM games WHERE name = 'One Piece Card Game'
ON CONFLICT (game_id, set_code) DO NOTHING;`);
    }
    lines.push('');

    lines.push('-- 3. Upsert Canonical Cards');
    for (const card of cardCatalog.values()) {
      const nameEscaped = card.name.replace(/'/g, "''");
      const nameJaEscaped = (card.nameJa || '').replace(/'/g, "''");
      const imgVal = card.imageUrl ? `'${card.imageUrl}'` : 'NULL';
      const costVal = card.cost !== null && card.cost !== undefined ? card.cost : 'NULL';
      const powerVal = card.power !== null && card.power !== undefined ? card.power : 'NULL';

      lines.push(`INSERT INTO cards (
  canonical_id, set_id, card_number, name, name_ja, rarity, color, type, cost, power, image_url, variant_type, language, is_alternate_art
) SELECT
  '${card.canonicalId}', id, '${card.cardNumber}', '${nameEscaped}', '${nameJaEscaped}', '${card.rarity || 'C'}', '${card.color || 'Red'}', '${card.type || 'Character'}', ${costVal}, ${powerVal}, ${imgVal}, '${card.variantType}', '${card.language || 'JP'}', ${Boolean(card.isAlternateArt)}
FROM sets WHERE set_code = '${card.setCode}'
ON CONFLICT (canonical_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  name_ja = EXCLUDED.name_ja,
  updated_at = now();`);
    }
    lines.push('');

    lines.push('-- 4. Upsert Market Prices');
    for (const p of priceRecords.values()) {
      const rawPrice = p.priceRaw !== null && p.priceRaw !== undefined ? p.priceRaw : 'NULL';
      const phpPrice = p.pricePhp !== null && p.pricePhp !== undefined ? p.pricePhp : 'NULL';
      const gradeVal = p.grade ? `'${p.grade}'` : 'NULL';
      const graderVal = p.gradingCompany ? `'${p.gradingCompany}'` : 'NULL';
      const urlVal = p.externalUrl ? `'${p.externalUrl}'` : 'NULL';

      lines.push(`INSERT INTO card_prices (
  card_id, canonical_id, source, price_raw, currency, price_php, status, condition, is_graded, grading_company, grade, external_url, last_checked_at
) SELECT
  id, '${p.canonicalId}', '${p.source}', ${rawPrice}, '${p.currency || 'JPY'}', ${phpPrice}, '${p.status}', '${p.condition || 'A'}', ${Boolean(p.isGraded)}, ${graderVal}, ${gradeVal}, ${urlVal}, now()
FROM cards WHERE canonical_id = '${p.canonicalId}'
ON CONFLICT (card_id, source, condition, is_graded, grade) DO UPDATE SET
  price_raw = EXCLUDED.price_raw,
  price_php = EXCLUDED.price_php,
  status = EXCLUDED.status,
  last_checked_at = now(),
  updated_at = now();`);
    }

    lines.push('\nCOMMIT;');
    return lines.join('\n');
  }

  /**
   * Syncs cards and prices to live Supabase database.
   * @param {Map<string, Object>} cardCatalog
   * @param {Map<string, Object>} priceRecords
   */
  async syncCatalogAndPrices(cardCatalog, priceRecords) {
    if (!this.client) {
      console.log('ℹ [SupabaseSyncService] No active Supabase credentials found. Running in offline/export mode.');
      return { syncedCards: 0, syncedPrices: 0, offlineMode: true };
    }

    const maskedUrl = this.supabaseUrl.replace(/https:\/\/(.{4}).*(\..*)/, 'https://$1***$2');
    console.log(`[SupabaseSyncService] Target Supabase project: ${maskedUrl}`);

    const setRes = await this.ensureSetsExist();
    if (!setRes.success) {
      console.log(`ℹ [SupabaseSyncService] Target database tables ('games', 'sets', 'cards', 'card_prices') are not yet created on this Supabase project.`);
      console.log(`💡 [Action Required] Open your Supabase SQL Editor: https://supabase.com/dashboard and run 'supabase/schema.sql'.`);
      
      const sql = this.generateSyncSql(cardCatalog, priceRecords);
      return {
        syncedCards: 0,
        syncedPrices: 0,
        pendingSchemaExecution: true,
        generatedSql: sql
      };
    }

    const setMap = setRes.setMap;
    let syncedCards = 0;
    let syncedPrices = 0;

    // Batch upsert cards
    const cardRows = [];
    for (const card of cardCatalog.values()) {
      const setId = setMap.get(card.setCode);
      cardRows.push({
        canonical_id: card.canonicalId,
        set_id: setId || null,
        card_number: card.cardNumber,
        name: card.name,
        name_ja: card.nameJa || null,
        rarity: card.rarity || 'C',
        color: card.color || 'Red',
        type: card.type || 'Character',
        cost: card.cost ?? null,
        power: card.power ?? null,
        counter: card.counter ?? null,
        attribute: card.attribute || null,
        effect: card.effect || null,
        trigger_effect: card.trigger || null,
        illustrator: card.illustrator || null,
        image_url: card.imageUrl || null,
        variant_type: card.variantType || 'BASE',
        language: card.language || 'JP',
        is_alternate_art: Boolean(card.isAlternateArt),
        raw_metadata: card.metadata || {}
      });
    }

    const { data: insertedCards, error: cardUpsertErr } = await this.client
      .from('cards')
      .upsert(cardRows, { onConflict: 'canonical_id' })
      .select('id, canonical_id');

    if (cardUpsertErr) {
      console.warn(`[SupabaseSyncService] Card upsert error: ${cardUpsertErr.message}`);
      return { syncedCards: 0, syncedPrices: 0, error: cardUpsertErr.message };
    }

    syncedCards = insertedCards ? insertedCards.length : cardRows.length;
    console.log(`   ✔ Synced ${syncedCards} canonical cards to Supabase 'cards' table.`);

    // Map canonical_id to card UUID
    const cardIdMap = new Map();
    if (insertedCards) {
      for (const row of insertedCards) {
        cardIdMap.set(row.canonical_id, row.id);
      }
    }

    // Batch upsert price records
    const priceRows = [];
    for (const price of priceRecords.values()) {
      const cardDbId = cardIdMap.get(price.canonicalId);
      if (!cardDbId) continue;

      priceRows.push({
        card_id: cardDbId,
        canonical_id: price.canonicalId,
        source: price.source || 'yuyutei',
        price_raw: price.priceRaw,
        currency: price.currency || 'JPY',
        price_php: price.pricePhp,
        status: price.status,
        condition: price.condition || 'A',
        is_graded: Boolean(price.isGraded),
        grading_company: price.gradingCompany || null,
        grade: price.grade || null,
        external_url: price.externalUrl || null,
        external_id: price.externalId || null,
        notes: price.notes || null,
        last_checked_at: price.lastCheckedAt || new Date().toISOString()
      });
    }

    if (priceRows.length > 0) {
      const { data: insertedPrices, error: priceUpsertErr } = await this.client
        .from('card_prices')
        .upsert(priceRows, { onConflict: 'card_id,source,condition,is_graded,grade' })
        .select('id');

      if (priceUpsertErr) {
        console.warn(`[SupabaseSyncService] Price upsert warning: ${priceUpsertErr.message}`);
      } else {
        syncedPrices = insertedPrices ? insertedPrices.length : priceRows.length;
        console.log(`   ✔ Synced ${syncedPrices} market price entries to Supabase 'card_prices' table.`);
      }
    }

    return {
      syncedCards,
      syncedPrices,
      supabaseUrl: this.supabaseUrl,
      timestamp: new Date().toISOString()
    };
  }
}
