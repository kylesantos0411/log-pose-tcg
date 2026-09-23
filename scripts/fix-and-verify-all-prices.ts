import { PrismaClient } from '@prisma/client';
import { scrapeYuyuteiSet, YuyuScrapedItem } from '../src/lib/yuyu-scraper';

const prisma = new PrismaClient();

// Map pack codes / IDs to Yuyu-tei slugs
const SET_SLUG_MAP: Record<string, string> = {
  'OP-01': 'op01', 'OP-02': 'op02', 'OP-03': 'op03', 'OP-04': 'op04',
  'OP-05': 'op05', 'OP-06': 'op06', 'OP-07': 'op07', 'OP-08': 'op08',
  'OP-09': 'op09', 'OP-10': 'op10', 'OP-11': 'op11', 'OP-12': 'op12',
  'OP-13': 'op13', 'OP-14': 'op14', 'OP-15': 'op15', 'OP-16': 'op16',
  'OP-17': 'op17',
  'EB-01': 'eb01', 'EB-02': 'eb02', 'EB-03': 'eb03', 'EB-04': 'eb04',
  'PRB-01': 'prb01', 'PRB-02': 'prb02',
  'ST-01': 'st01', 'ST-02': 'st02', 'ST-03': 'st03', 'ST-04': 'st04',
  'ST-05': 'st05', 'ST-06': 'st06', 'ST-07': 'st07', 'ST-08': 'st08',
  'ST-09': 'st09', 'ST-10': 'st10', 'ST-11': 'st11', 'ST-12': 'st12',
  'ST-13': 'st13', 'ST-14': 'st14', 'ST-15': 'st15', 'ST-16': 'st16',
  'ST-17': 'st17', 'ST-18': 'st18', 'ST-19': 'st19', 'ST-20': 'st20',
  'ST-21': 'st21', 'ST-22': 'st22', 'ST-23': 'st23', 'ST-24': 'st24',
  'ST-25': 'st25', 'ST-26': 'st26', 'ST-27': 'st27', 'ST-28': 'st28',
  'ST-29': 'st29', 'ST-30': 'st30', 'ST-31': 'st31', 'ST-32': 'st32',
  'ST-33': 'st33', 'ST-34': 'st34', 'ST-35': 'st35', 'ST-36': 'st36',
};

async function main() {
  console.log('======================================================================');
  console.log('🛠️ FIXING CARD PRICING, REMOVING DUPLICATES, & SYNCHRONIZING YUYUTEI');
  console.log('======================================================================');

  // =========================================================================
  // 1. DEDUPLICATE OP-17 DON CARDS
  // =========================================================================
  console.log('\n--- 1. Cleaning up OP-17 Duplicate DON cards ---');
  const op17RedundantIds = [
    'OP17_-',
    'OP17_-_p1',
    'OP17_DON_1',
    'OP17_DON_2',
    'OP17_DON_3',
    'OP17_DON_4',
    'OP17_DON_5',
    'OP17_DON_6',
    'OP17_DON_7',
    'OP17_DON_8',
  ];

  const deletedOp17 = await prisma.card.deleteMany({
    where: { id: { in: op17RedundantIds } },
  });
  console.log(`✓ Deleted ${deletedOp17.count} redundant duplicate DON cards from OP-17.`);

  // Fix market prices on the 8 preserved official OP17-DON cards
  const op17DonPrices: Record<string, { yuyu: number; usd: number }> = {
    'OP17-DON-01':    { yuyu: 120,  usd: 0.86 },
    'OP17-DON-01_p1': { yuyu: 500,  usd: 3.57 },
    'OP17-DON-02':    { yuyu: 50,   usd: 0.36 },
    'OP17-DON-02_p1': { yuyu: 1780, usd: 12.71 },
    'OP17-DON-03':    { yuyu: 50,   usd: 0.36 },
    'OP17-DON-03_p1': { yuyu: 980,  usd: 7.00 },
    'OP17-DON-04':    { yuyu: 220,  usd: 1.57 },
    'OP17-DON-04_p1': { yuyu: 2980, usd: 21.29 },
  };

  for (const [id, pr] of Object.entries(op17DonPrices)) {
    await prisma.card.updateMany({
      where: { id },
      data: { yuyuPrice: pr.yuyu, marketPrice: pr.usd },
    });
  }
  console.log('✓ Successfully populated pricing for all 8 official OP-17 DON cards.');

  // =========================================================================
  // 2. DEDUPLICATE OP-10 USOPP & RESTORE PARALLEL LEADER TO OP-10
  // =========================================================================
  console.log('\n--- 2. Deduplicating OP-10 Usopp ---');
  // Delete OP10-042_p3 (exact duplicate of _p1)
  await prisma.card.deleteMany({ where: { id: 'OP10-042_p3' } });
  // Move OP10-042_p2 (the genuine OP-10 Parallel Leader) into OP-10 pack
  await prisma.card.updateMany({
    where: { id: 'OP10-042_p2' },
    data: {
      packId: '569110', // OP-10 pack
      displaySet: 'OP-10',
      yuyuteiSet: 'OP-10',
      yuyuPrice: 1280,
      marketPrice: 9.14,
      printingType: 'Parallel',
      isAltArt: true,
    }
  });
  console.log('✓ Fixed OP-10 Usopp cards (deleted duplicate _p3, restored _p2 to OP-10 pack).');

  // =========================================================================
  // 3. FIX DUPLICATED / WRONG MANGA & KEY CHASE PRICES
  // =========================================================================
  console.log('\n--- 3. Correcting Rocks D. Xebec, Loki, and Key Chase Cards ---');
  // Rocks D. Xebec
  await prisma.card.updateMany({
    where: { id: 'OP17-118' },
    data: { yuyuPrice: 1480, marketPrice: 10.57 }
  });
  await prisma.card.updateMany({
    where: { id: 'OP17-118_p1' },
    data: { yuyuPrice: 3480, marketPrice: 24.86, printingType: 'Parallel' }
  });
  await prisma.card.updateMany({
    where: { id: 'OP17-118_p2' },
    data: { yuyuPrice: 498000, marketPrice: 3557.14, printingType: 'Super Parallel' }
  });
  console.log('✓ Rocks D. Xebec: Base ¥1,480 | Parallel ¥3,480 | Manga Super Parallel ¥498,000 (duplicate ¥498k removed).');

  // Loki
  await prisma.card.updateMany({
    where: { id: 'OP17-119' },
    data: { yuyuPrice: 2480, marketPrice: 17.71 }
  });
  await prisma.card.updateMany({
    where: { id: 'OP17-119_p1' },
    data: { yuyuPrice: 3980, marketPrice: 28.43, printingType: 'Parallel' }
  });
  console.log('✓ Loki: Base ¥2,480 | Parallel ¥3,980.');

  // Delete duplicate Shanks in OP-01 (OP01-120_p2)
  await prisma.card.deleteMany({ where: { id: 'OP01-120_p2' } });
  // Fix Shanks OP01-120 base, parallel, and manga
  await prisma.card.updateMany({
    where: { id: 'OP01-120' },
    data: { yuyuPrice: 500, marketPrice: 3.57, imageUrl: 'https://card.yuyu-tei.jp/opc/front/op01/10150.jpg' }
  });
  await prisma.card.updateMany({
    where: { id: 'OP01-120_p1' },
    data: { yuyuPrice: 3980, marketPrice: 28.43, printingType: 'Parallel', imageUrl: 'https://card.yuyu-tei.jp/opc/front/op01/10151.jpg' }
  });
  await prisma.card.updateMany({
    where: { id: 'OP01-120_p3' },
    data: { yuyuPrice: 3980, marketPrice: 28.43, printingType: 'Parallel' }
  });
  await prisma.card.updateMany({
    where: { id: 'OP01-120_p4' },
    data: { yuyuPrice: 128000, marketPrice: 914.29, printingType: 'Super Parallel' }
  });
  console.log('✓ Shanks OP-01: Base ¥500 | Parallel ¥3,980 | Manga Super Parallel ¥128,000.');

  // Fix OP-18 Unconverted USD prices
  await prisma.card.updateMany({
    where: { id: 'OP18-001' },
    data: { yuyuPrice: 3500, marketPrice: 25.00 }
  });
  await prisma.card.updateMany({
    where: { id: 'OP18-002' },
    data: { yuyuPrice: 1800, marketPrice: 12.86 }
  });
  await prisma.card.updateMany({
    where: { id: 'OP18-003' },
    data: { yuyuPrice: 6800, marketPrice: 48.57 }
  });
  await prisma.card.updateMany({
    where: { id: 'OP18-004' },
    data: { yuyuPrice: 600, marketPrice: 4.29 }
  });
  console.log('✓ OP-18 pre-release prices properly converted to USD.');

  // =========================================================================
  // 4. FIX ALL 14 UNDERPRICED LEADER ALT-ARTS
  // =========================================================================
  console.log('\n--- 4. Correcting Leader Alt-Art Prices ---');
  const LEADER_PRICES: Record<string, { yuyu: number; usd: number; desc: string }> = {
    'OP01-060_p1': { yuyu: 7980, usd: 57.00, desc: 'Doflamingo Leader Alt Art' },
    'OP02-001_p1': { yuyu: 3980, usd: 28.43, desc: 'Whitebeard Leader Alt Art' },
    'OP02-093_p1': { yuyu: 2980, usd: 21.29, desc: 'Smoker Leader Alt Art' },
    'OP03-099_p1': { yuyu: 3980, usd: 28.43, desc: 'Katakuri Leader Alt Art' },
    'OP06-022_p1': { yuyu: 5980, usd: 42.71, desc: 'Yamato Leader Alt Art' },
    'OP07-019_p1': { yuyu: 2980, usd: 21.29, desc: 'Bonney Leader Alt Art' },
    'OP09-001_p1': { yuyu: 2980, usd: 21.29, desc: 'Shanks Leader Alt Art' },
    'OP09-042_p1': { yuyu: 1280, usd: 9.14,  desc: 'Buggy Leader Alt Art' },
    'OP09-081_p1': { yuyu: 1280, usd: 9.14,  desc: 'Teach Leader Alt Art' },
    'OP10-099_p1': { yuyu: 1280, usd: 9.14,  desc: 'Kid Leader Alt Art' },
    'OP11-062_p1': { yuyu: 1780, usd: 12.71, desc: 'Katakuri Leader Alt Art' },
    'OP12-040_p1': { yuyu: 1780, usd: 12.71, desc: 'Kuzan Leader Alt Art' },
    'ST02-001_p1': { yuyu: 500,  usd: 3.57,  desc: 'Kid Starter Leader Alt Art' },
    'ST11-001_p1': { yuyu: 1280, usd: 9.14,  desc: 'Uta Starter Leader Alt Art' },
  };

  for (const [id, data] of Object.entries(LEADER_PRICES)) {
    await prisma.card.updateMany({
      where: { id },
      data: { yuyuPrice: data.yuyu, marketPrice: data.usd }
    });
    console.log(`  ✓ ${id} (${data.desc}): ¥${data.yuyu} / $${data.usd}`);
  }

  // =========================================================================
  // 5. LIVE SCRAPE & VERIFY PRICING ACROSS KEY SETS
  // =========================================================================
  console.log('\n--- 5. Synchronizing and verifying prices across all sets from Yuyu-tei ---');
  const targetPacks = await prisma.pack.findMany({
    orderBy: { releaseOrder: 'desc' },
  });

  let totalUpdated = 0;

  for (const pack of targetPacks) {
    const slug = SET_SLUG_MAP[pack.code || ''] || SET_SLUG_MAP[pack.id];
    if (!slug) continue;

    console.log(`\n📦 Checking set [${pack.code || pack.id}] using Yuyu-tei slug [${slug}]...`);
    const scraped = await scrapeYuyuteiSet(slug);
    if (scraped.length === 0) continue;

    // Group scraped items by code
    const byCode = new Map<string, YuyuScrapedItem[]>();
    for (const item of scraped) {
      if (!byCode.has(item.code)) byCode.set(item.code, []);
      byCode.get(item.code)!.push(item);
    }

    // Get all cards in DB for this pack
    const dbCards = await prisma.card.findMany({
      where: { packId: pack.id },
    });

    for (const card of dbCards) {
      const code = card.cardNumber || card.id.split('_')[0];
      const items = byCode.get(code);
      if (!items || items.length === 0) continue;

      let matched: YuyuScrapedItem | null = null;

      if (card.printingType === 'Super Parallel' || card.id.includes('_sp')) {
        matched = items.find(i => i.isSuperParallel) || null;
      }

      if (!matched && card.isAltArt) {
        matched = items.find(i => i.isParallel) || null;
      }

      if (!matched && !card.isAltArt) {
        matched = items.find(i => i.isBase) || null;
      }

      if (matched && matched.priceYen > 0) {
        // Check if price needs update
        const needYuyuUpdate = card.yuyuPrice !== matched.priceYen;
        const calcUsd = Math.round((matched.priceYen / 140) * 100) / 100;
        const needMarketUpdate = !card.marketPrice || card.marketPrice <= 0;

        if (needYuyuUpdate || needMarketUpdate) {
          await prisma.card.update({
            where: { id: card.id },
            data: {
              yuyuPrice: matched.priceYen,
              marketPrice: card.marketPrice && card.marketPrice > 0 ? card.marketPrice : calcUsd,
            }
          });
          totalUpdated++;
        }
      }
    }
  }

  console.log(`\n🎉 Synchronized and updated ${totalUpdated} cards from live Yuyu-tei catalog.`);

  // =========================================================================
  // 6. ENSURE NO CARD HAS NULL OR 0 USD MARKET PRICE
  // =========================================================================
  console.log('\n--- 6. Fixing any remaining NULL or 0 market prices ---');
  const cardsNeedingUsd = await prisma.card.findMany({
    where: {
      OR: [
        { marketPrice: null },
        { marketPrice: 0 }
      ],
      yuyuPrice: { not: null, gt: 0 }
    }
  });

  for (const c of cardsNeedingUsd) {
    const usd = Math.round((c.yuyuPrice! / 140) * 100) / 100;
    await prisma.card.update({
      where: { id: c.id },
      data: { marketPrice: usd }
    });
  }
  console.log(`✓ Calculated and populated USD market price for ${cardsNeedingUsd.length} cards.`);

  await prisma.$disconnect();
  console.log('\n======================================================================');
  console.log('✅ ALL PRICING AND DEDUPLICATION TASKS COMPLETED SUCCESSFULLY!');
  console.log('======================================================================');
}

main().catch(err => {
  console.error('Fatal error in pricing synchronizer:', err);
  process.exit(1);
});
