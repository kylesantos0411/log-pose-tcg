/**
 * fix-manga-and-top-chase-exact.ts
 *
 * Sets exact authentic prices for Manga Rares, Parallels, and SPs from Yuyu-tei and TCGPlayer.
 * Completely fixes the OP05-119 Luffy mapping so that:
 * - OP05-119_p1 = "GEAR 5" comic pop art Parallel (¥24,800 JPY / $85 USD)
 * - OP05-119_p2 = MANGA RARE Super Parallel (¥598,000 JPY / $2,850 USD)
 * - OP05-119_p3 = PRB Alt Art (¥7,980 JPY / $45 USD)
 * - OP05-119_p4 = 2nd Anniv JP (¥19,800 JPY / $75 USD)
 * - OP05-119_p6 = WANTED POSTER SP (¥59,800 JPY / $260 USD)
 * - OP05-119_p7 = SILVER PARALLEL SP (¥498,000 JPY / $2,800 USD)
 * - OP05-119_p8 = GOLD PARALLEL SP (¥1,280,000 JPY / $7,500 USD)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCURATE_CHASE_PRICES: Record<string, { usd: number; yen: number; desc: string; imageUrl?: string }> = {
  // === LUFFY OP05 VARIANTS ===
  'OP05-119':    { usd: 38.0,   yen: 780,     desc: 'Luffy Base Secret Rare (Laughing Gear 5)' },
  'OP05-119_p1': { usd: 85.0,   yen: 24800,   desc: 'Luffy Alt Art Parallel (GEAR 5 Comic Pop-Art)', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png?260828' },
  'OP05-119_p2': { usd: 2850.0, yen: 598000,  desc: 'Luffy Gear 5 Manga Rare (Super Parallel)', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p2.png?260828' },
  'OP05-119_p3': { usd: 45.0,   yen: 7980,    desc: 'Luffy PRB Alt Art Parallel (Sunset sky)', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p3.png?260828' },
  'OP05-119_p4': { usd: 75.0,   yen: 19800,   desc: 'Luffy 2nd Anniversary JP (Blue lightning punch)', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p4.png?260828' },
  'OP05-119_p6': { usd: 260.0,  yen: 59800,   desc: 'Luffy Wanted Poster SP', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p6.png?260828' },
  'OP05-119_p7': { usd: 2800.0, yen: 498000,  desc: 'Luffy Silver Parallel SP', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p7.png?260828' },
  'OP05-119_p8': { usd: 7500.0, yen: 1280000, desc: 'Luffy Gold Parallel SP', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p8.png?260828' },
  'OP05-119_r1': { usd: 12.13,  yen: 1750,    desc: 'Luffy PRB Reprint' },
  'OP05-119_r2': { usd: 13.50,  yen: 1940,    desc: 'Luffy PRB Foil Reprint' },

  // === ALL OTHER MANGA RARES & PARALLELS ===
  // OP01 Shanks
  'OP01-120':    { usd: 49.66,  yen: 500,     desc: 'Shanks Base SEC' },
  'OP01-120_p1': { usd: 950.0,  yen: 198000,  desc: 'Shanks Manga Rare' },
  'OP01-120_p2': { usd: 45.0,   yen: 3980,    desc: 'Shanks SEC Alt Art' },

  // OP02 Ace
  'OP02-013':    { usd: 9.10,   yen: 220,     desc: 'Ace Base SR' },
  'OP02-013_p1': { usd: 1100.0, yen: 198000,  desc: 'Ace Manga Rare' },
  'OP02-013_p2': { usd: 48.0,   yen: 4980,    desc: 'Ace SR Alt Art' },
  'OP02-013_p3': { usd: 70.0,   yen: 19800,   desc: 'Ace SP Wanted' },

  // OP03 Sogeking
  'OP03-122':    { usd: 18.0,   yen: 580,     desc: 'Sogeking Base SEC' },
  'OP03-122_p1': { usd: 450.0,  yen: 99800,   desc: 'Sogeking Manga Rare' },
  'OP03-122_p2': { usd: 25.0,   yen: 980,     desc: 'Sogeking SEC Alt Art' },

  // OP04 Sabo
  'OP04-083':    { usd: 6.44,   yen: 220,     desc: 'Sabo Base SR' },
  'OP04-083_p1': { usd: 650.0,  yen: 128000,  desc: 'Sabo Manga Rare' },
  'OP04-083_p2': { usd: 36.4,   yen: 1980,    desc: 'Sabo SR Alt Art' },

  // OP06 Zoro
  'OP06-118':    { usd: 42.0,   yen: 780,     desc: 'Zoro SEC Base' },
  'OP06-118_p1': { usd: 1250.0, yen: 198000,  desc: 'Zoro Manga Rare' },
  'OP06-118_p2': { usd: 75.0,   yen: 7980,    desc: 'Zoro SEC Alt Art' },

  // OP07 Boa Hancock
  'OP07-051':    { usd: 7.08,   yen: 500,     desc: 'Boa Hancock Base SR' },
  'OP07-051_p1': { usd: 1400.0, yen: 148000,  desc: 'Boa Hancock Manga Rare' },
  'OP07-051_p2': { usd: 39.9,   yen: 3980,    desc: 'Boa Hancock SR Alt Art' },
  'OP07-051_p3': { usd: 95.0,   yen: 34800,   desc: 'Boa Hancock SP Wanted' },

  // OP08 Rayleigh
  'OP08-118':    { usd: 35.0,   yen: 320,     desc: 'Rayleigh SEC Base' },
  'OP08-118_p1': { usd: 850.0,  yen: 69800,   desc: 'Rayleigh Manga Rare' },
  'OP08-118_p2': { usd: 28.0,   yen: 1280,    desc: 'Rayleigh SEC Alt Art' },

  // OP09 Roger
  'OP09-118':    { usd: 45.0,   yen: 580,     desc: 'Roger SEC Base' },
  'OP09-118_p1': { usd: 1650.0, yen: 498000,  desc: 'Roger Manga Rare' },
  'OP09-118_p2': { usd: 45.0,   yen: 2980,    desc: 'Roger SEC Alt Art' },
  'OP09-118_p3': { usd: 85.0,   yen: 12800,   desc: 'Roger SP Wanted' },

  // OP10 Law
  'OP10-119':    { usd: 30.0,   yen: 320,     desc: 'Law SEC Base' },
  'OP10-119_p1': { usd: 1100.0, yen: 79800,   desc: 'Law Manga Rare' },
  'OP10-119_p2': { usd: 35.0,   yen: 2480,    desc: 'Law SEC Alt Art' },

  // EB01 Chopper
  'EB01-006':    { usd: 7.50,   yen: 500,     desc: 'Tony Tony.Chopper Base SR' },
  'EB01-006_p1': { usd: 55.0,   yen: 2480,    desc: 'Tony Tony.Chopper SR Alt Art' },
  'EB01-006_p2': { usd: 750.0,  yen: 198000,  desc: 'Tony Tony.Chopper Manga Rare' },
  'EB01-006_p3': { usd: 89.0,   yen: 320,     desc: 'Tony Tony.Chopper Treasure Cup Promo' },
  'EB01-006_r1': { usd: 2.33,   yen: 340,     desc: 'Tony Tony.Chopper PRB-01 Reprint' },
};

async function main() {
  console.log('🏴‍☠️ Updating exact market values for Manga Rares and Chase Cards...');

  let count = 0;
  for (const [id, data] of Object.entries(ACCURATE_CHASE_PRICES)) {
    const existing = await prisma.card.findUnique({ where: { id } });
    if (existing) {
      const updateData: any = {
        marketPrice: data.usd,
        yuyuPrice: data.yen,
      };
      if (data.imageUrl) {
        updateData.imageUrl = data.imageUrl;
      }
      await prisma.card.update({
        where: { id },
        data: updateData,
      });
      const phpPrice = Math.round(data.usd * 57.5);
      console.log(
        `✅ [${id}] ${data.desc}: US $${data.usd.toLocaleString()} | PHP ₱${phpPrice.toLocaleString()} | JP ¥${data.yen.toLocaleString()}`
      );
      count++;
    } else {
      console.warn(`⚠️ Card ID not found in DB: ${id}`);
    }
  }

  console.log(`\n🎉 Successfully updated ${count} cards!`);

  // Verify OP05-119 cards in DB
  const op05Cards = await prisma.card.findMany({
    where: { id: { startsWith: 'OP05-119' } },
    select: {
      id: true,
      name: true,
      rarity: true,
      marketPrice: true,
      yuyuPrice: true,
      imageUrl: true,
    },
  });

  console.log('\n--- OP05-119 VARIANTS AFTER FIX ---');
  console.table(
    op05Cards.map((c) => ({
      id: c.id,
      name: c.name,
      'USD ($)': `$${c.marketPrice?.toLocaleString()}`,
      'PHP (₱)': `₱${Math.round((c.marketPrice || 0) * 57.5).toLocaleString()}`,
      'JPY (¥)': `¥${c.yuyuPrice?.toLocaleString()}`,
      imageUrl: c.imageUrl?.split('?')[0],
    }))
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
