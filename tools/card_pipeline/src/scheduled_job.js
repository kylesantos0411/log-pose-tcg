/**
 * @file scheduled_job.js
 * Automated recurring pipeline execution script.
 * Can be run via local node cron, GitHub Actions, or serverless cron triggers.
 */

import { CardPipelineRunner } from './pipeline_runner.js';
import { ExchangeRateService } from './exchange_rate.js';
import { YuyuteiMatcher } from './yuyutei_matcher.js';
import { SupabaseSyncService } from './supabase_sync.js';
import { VariantType, SupportedSets } from './types.js';

// Canonical reference seed items for scheduled ingestion
const SEED_CATALOG = [
  { setCode: 'OP-01', cardNumber: 'OP01-001', name: 'Roronoa Zoro', nameJa: 'ロロノア・ゾロ', rarity: 'L', color: 'Red', type: 'Leader', cost: null, power: 5000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png?20220708', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'OP-01', cardNumber: 'OP01-001', name: 'Roronoa Zoro (Parallel)', nameJa: 'ロロノア・ゾロ (パラレル)', rarity: 'L', color: 'Red', type: 'Leader', cost: null, power: 5000, illustrator: 'Ryuda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001_p1.png?20220708', isAlternateArt: true, variantType: VariantType.PARALLEL },
  { setCode: 'OP-01', cardNumber: 'OP01-016', name: 'Nami', nameJa: 'ナミ', rarity: 'R', color: 'Red', type: 'Character', cost: 1, power: 2000, illustrator: 'Sunohara', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016.png?20220708', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'OP-01', cardNumber: 'OP01-016', name: 'Nami (Parallel)', nameJa: 'ナミ (パラレル)', rarity: 'R', color: 'Red', type: 'Character', cost: 1, power: 2000, illustrator: 'Sunohara', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016_p1.png?20220708', isAlternateArt: true, variantType: VariantType.PARALLEL },
  { setCode: 'OP-01', cardNumber: 'OP01-120', name: 'Shanks', nameJa: 'シャンクス', rarity: 'SEC', color: 'Red', type: 'Character', cost: 9, power: 10000, illustrator: 'BISAI', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png?20220708', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'OP-01', cardNumber: 'OP01-120', name: 'Shanks (Manga Super Parallel)', nameJa: 'シャンクス (スーパーパラレル)', rarity: 'SEC', color: 'Red', type: 'Character', cost: 9, power: 10000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120_p2.png?20220708', isAlternateArt: true, variantType: VariantType.MANGA },
  { setCode: 'OP-02', cardNumber: 'OP02-001', name: 'Edward.Newgate', nameJa: 'エドワード・ニューゲート', rarity: 'L', color: 'Red', type: 'Leader', cost: null, power: 6000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-001.png?20221104', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'OP-02', cardNumber: 'OP02-013', name: 'Portgas.D.Ace', nameJa: 'ポートガス・D・エース', rarity: 'SR', color: 'Red', type: 'Character', cost: 7, power: 7000, illustrator: 'Anderson', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013.png?20221104', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'OP-02', cardNumber: 'OP02-013', name: 'Portgas.D.Ace (Manga Super Parallel)', nameJa: 'ポートガス・D・エース (スーパーパラレル)', rarity: 'SR', color: 'Red', type: 'Character', cost: 7, power: 7000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013_p2.png?20221104', isAlternateArt: true, variantType: VariantType.MANGA },
  { setCode: 'OP-03', cardNumber: 'OP03-122', name: 'Sogeking (Manga Super Parallel)', nameJa: 'そげキング (スーパーパラレル)', rarity: 'SEC', color: 'Yellow', type: 'Character', cost: 7, power: 7000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP03-122_p2.png?20230211', isAlternateArt: true, variantType: VariantType.MANGA },
  { setCode: 'EB-01', cardNumber: 'EB01-006', name: 'Tony Tony.Chopper (Manga Super Parallel)', nameJa: 'トニートニー・チョッパー (スーパーパラレル)', rarity: 'SEC', color: 'Red', type: 'Character', cost: 5, power: 6000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/EB01-006_p2.png?20240127', isAlternateArt: true, variantType: VariantType.MANGA },
  { setCode: 'PRB-01', cardNumber: 'PRB01-001', name: 'Monkey.D.Luffy (The Best)', nameJa: 'モンキー・D・ルフィ', rarity: 'P-L', color: 'Red', type: 'Leader', cost: null, power: 5000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/PRB01-001.png?20240727', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'ST-01', cardNumber: 'ST01-012', name: 'Pacifista', nameJa: 'パシフィスタ', rarity: 'C', color: 'Red', type: 'Character', cost: 4, power: 6000, illustrator: 'Bandai', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/ST01-012.png?20220708', isAlternateArt: false, variantType: VariantType.BASE },
  { setCode: 'PROMO', cardNumber: 'P-001', name: 'Monkey.D.Luffy (Promotion)', nameJa: 'モンキー・D・ルフィ (プロモ)', rarity: 'P', color: 'Red', type: 'Character', cost: 6, power: 7000, illustrator: 'Eiichiro Oda', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/P-001.png?20220701', isAlternateArt: false, variantType: VariantType.PROMO }
];

const YUYUTEI_LISTINGS = [
  { cardCode: 'OP01-001', name: 'ロロノア・ゾロ', rarity: 'L', price: 280, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/op01/10001' },
  { cardCode: 'OP01-001', name: 'ロロノア・ゾロ (パラレル)', rarity: 'L', price: 4800, variant: 'PARALLEL', url: 'https://yuyu-tei.jp/sell/opc/card/op01/10002' },
  { cardCode: 'OP01-016', name: 'ナミ', rarity: 'R', price: 680, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/op01/10016' },
  { cardCode: 'OP01-016', name: 'ナミ (パラレル)', rarity: 'R', price: 14800, variant: 'PARALLEL', url: 'https://yuyu-tei.jp/sell/opc/card/op01/10017' },
  { cardCode: 'OP01-120', name: 'シャンクス', rarity: 'SEC', price: 1200, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/op01/10120' },
  { cardCode: 'OP01-120', name: 'シャンクス (スーパーパラレル)', rarity: 'SEC', price: 198000, variant: 'MANGA', url: 'https://yuyu-tei.jp/sell/opc/card/op01/10121' },
  { cardCode: 'OP02-001', name: 'エドワード・ニューゲート', rarity: 'L', price: 180, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/op02/10001' },
  { cardCode: 'OP02-013', name: 'ポートガス・D・エース', rarity: 'SR', price: 380, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/op02/10013' },
  { cardCode: 'OP02-013', name: 'ポートガス・D・エース (スーパーパラレル)', rarity: 'SR', price: 168000, variant: 'MANGA', url: 'https://yuyu-tei.jp/sell/opc/card/op02/10014' },
  { cardCode: 'OP03-122', name: 'そげキング (スーパーパラレル)', rarity: 'SEC', price: 79800, variant: 'MANGA', url: 'https://yuyu-tei.jp/sell/opc/card/op03/10123' },
  { cardCode: 'EB01-006', name: 'トニートニー・チョッパー (スーパーパラレル)', rarity: 'SEC', price: 88000, variant: 'MANGA', url: 'https://yuyu-tei.jp/sell/opc/card/eb01/10007' },
  { cardCode: 'PRB01-001', name: 'モンキー・D・ルフィ', rarity: 'P-L', price: 200, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/prb01/10001' },
  { cardCode: 'ST01-012', name: 'パシフィスタ', rarity: 'C', price: 30, variant: 'BASE', url: 'https://yuyu-tei.jp/sell/opc/card/st01/10012' },
  { cardCode: 'P-001', name: 'モンキー・D・ルフィ', rarity: 'P', price: 1500, variant: 'PROMO', url: 'https://yuyu-tei.jp/sell/opc/card/promo/10001' }
];

const GRADED_LISTINGS = [
  { canonicalId: 'OPT_OP01_OP01-120_MANGA_JP', gradingCompany: 'PSA', grade: '10', priceRaw: 340000, currency: 'JPY', source: 'snkrdunk' },
  { canonicalId: 'OPT_OP02_OP02-013_MANGA_JP', gradingCompany: 'PSA', grade: '10', priceRaw: 280000, currency: 'JPY', source: 'snkrdunk' },
  { canonicalId: 'OPT_OP01_OP01-016_PARALLEL_JP', gradingCompany: 'BGS', grade: '9.5', priceRaw: 25000, currency: 'JPY', source: 'snkrdunk' }
];

async function main() {
  const startTime = Date.now();
  console.log(`[ScheduledJob] Starting card sync job at ${new Date().toISOString()}...`);

  // 1. Refresh live exchange rate
  const fxRate = await ExchangeRateService.getJpyToPhpRate();
  YuyuteiMatcher.JPY_TO_PHP_RATE = fxRate;
  console.log(`[ScheduledJob] Synchronized exchange rate: 1 JPY = ₱${fxRate.toFixed(4)}`);

  // 2. Run pipeline
  const runner = new CardPipelineRunner();
  const results = await runner.runPipeline({
    rawCards: SEED_CATALOG,
    yuyuteiInventory: YUYUTEI_LISTINGS,
    gradedListings: GRADED_LISTINGS
  });

  // 3. Sync to live Supabase if configured
  const supabaseService = new SupabaseSyncService();
  if (supabaseService.isConfigured()) {
    console.log('[ScheduledJob] Syncing data with live Supabase instance...');
    const syncRes = await supabaseService.syncCatalogAndPrices(runner.cardCatalog, runner.priceRecords);
    if (syncRes.pendingSchemaExecution && syncRes.generatedSql) {
      const fs = await import('fs');
      const path = await import('path');
      const outPath = path.resolve(process.cwd(), '../../supabase/latest_sync.sql');
      fs.writeFileSync(outPath, syncRes.generatedSql, 'utf-8');
      console.log(`[ScheduledJob] Generated ready-to-run sync SQL file: supabase/latest_sync.sql`);
    } else {
      console.log(`[ScheduledJob] Supabase Sync Finished: ${syncRes.syncedCards} cards, ${syncRes.syncedPrices} prices synced.`);
    }
  } else {
    console.log('[ScheduledJob] Supabase not connected. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env to enable direct database write.');
  }

  const durationMs = Date.now() - startTime;
  console.log(`[ScheduledJob] Completed successfully in ${(durationMs / 1000).toFixed(2)}s.`);
}

main().catch(err => {
  console.error('[ScheduledJob] Fatal execution error:', err);
  process.exit(1);
});
