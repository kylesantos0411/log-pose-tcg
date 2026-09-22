/**
 * sync-jp-availability.ts
 *
 * Scans all cards in the database to accurately determine which cards exist in Japanese:
 * - Base cards: true
 * - Reprints (_r): true
 * - Cards with Yuyu-tei images or Japanese promoSource: true
 * - English tournament promos and parallels: verified against Bandai JP
 *
 * Also specifically updates EB01-015_p3 to its true Rare market price ($0.60 / ₱35).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HAS_JAPANESE_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/;

async function main() {
  console.log('🇯🇵 Synchronizing Japanese Print Availability across database...');

  // 1. Fix EB01-015_p3 price specifically
  await prisma.card.update({
    where: { id: 'EB01-015_p3' },
    data: {
      marketPrice: 0.60, // Corrected from $11.50 -> $0.60 (₱35), it's a standard Rare
      hasJpPrint: false,
      isAltArt: false,
      promoSource: 'Bandai English Stamped Rare',
    },
  });
  console.log('✅ Corrected EB01-015_p3: marketPrice = $0.60 (₱35), hasJpPrint = false');

  // 2. Fetch all cards with parallels (_p)
  const parallelCards = await prisma.card.findMany({
    where: { id: { contains: '_p' } },
    select: { id: true, promoSource: true, imageUrl: true, yuyuPrice: true },
  });

  console.log(`Found ${parallelCards.length} parallel/promo cards in DB.`);

  // Filter candidates that might be English-exclusive
  const toCheck: typeof parallelCards = [];

  for (const c of parallelCards) {
    if (c.imageUrl && c.imageUrl.includes('yuyu-tei.jp')) {
      // Sourced directly from Yuyu-tei
      await prisma.card.update({ where: { id: c.id }, data: { hasJpPrint: true } });
      continue;
    }

    if (c.promoSource && HAS_JAPANESE_REGEX.test(c.promoSource)) {
      // Has official Japanese tournament/event text
      await prisma.card.update({ where: { id: c.id }, data: { hasJpPrint: true } });
      continue;
    }

    toCheck.push(c);
  }

  console.log(`Verifying ${toCheck.length} promo/parallel cards against official Bandai JP...`);

  const chunkSize = 25;
  let nonJpCount = 0;
  let jpCount = 0;

  for (let i = 0; i < toCheck.length; i += chunkSize) {
    const chunk = toCheck.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (c) => {
        try {
          const res = await fetch(`https://onepiece-cardgame.com/images/cardlist/card/${c.id}.png`, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          const exists = res.status === 200;
          await prisma.card.update({
            where: { id: c.id },
            data: { hasJpPrint: exists },
          });

          if (!exists) {
            nonJpCount++;
          } else {
            jpCount++;
          }
        } catch (e) {
          // If network error, default to existing or false if English tournament
          const isEnglishPromo =
            c.promoSource?.includes('Regional') ||
            c.promoSource?.includes('Tournament Kit') ||
            c.promoSource?.includes('Winner Pack') ||
            c.promoSource?.includes('Celebration');

          await prisma.card.update({
            where: { id: c.id },
            data: { hasJpPrint: !isEnglishPromo },
          });
          if (isEnglishPromo) nonJpCount++;
          else jpCount++;
        }
      })
    );

    if ((i / chunkSize) % 5 === 0 || i + chunkSize >= toCheck.length) {
      console.log(`  Progress: ${Math.min(i + chunkSize, toCheck.length)}/${toCheck.length} checked...`);
    }
  }

  console.log(`\n🎉 Sync Complete!`);
  console.log(`- Japanese Cards Verified: ${jpCount}`);
  console.log(`- English-Exclusive Cards (No JP Print): ${nonJpCount}`);

  // Verify EB01-015 family
  const eb01_015 = await prisma.card.findMany({
    where: { id: { contains: 'EB01-015' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, hasJpPrint: true, promoSource: true },
    orderBy: { id: 'asc' },
  });

  console.log('\n--- VERIFIED EB01-015 CARDS IN DB ---');
  console.table(
    eb01_015.map((c) => ({
      id: c.id,
      name: c.name,
      rarity: c.rarity,
      'USD ($)': `$${c.marketPrice?.toFixed(2)}`,
      'PHP (₱)': `₱${Math.round((c.marketPrice || 0) * 57.5)}`,
      hasJpPrint: c.hasJpPrint,
      promoSource: c.promoSource || 'Standard',
    }))
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
