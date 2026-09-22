/**
 * fix-all-manga-and-chase-prices.ts
 *
 * Explicitly fixes prices for ALL Manga Rares (Super Parallels) and key chase cards in the DB:
 * Including EB01-006_p2 (Tony Tony.Chopper Manga Rare), OP05-119_p1 (Manga Luffy), etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCURATE_CHASE_PRICES: Record<string, { usd: number; yen: number; desc: string }> = {
  // === ALL MANGA RARES (Super Parallels) ===
  'EB01-006_p2': { usd: 750.0,  yen: 115000, desc: 'Tony Tony.Chopper Manga Rare (EB01-006 Parallel #2)' },
  'OP05-119_p1': { usd: 2850.0, yen: 420000, desc: 'Monkey.D.Luffy Gear 5 Manga Rare' },
  'OP05-119_p2': { usd: 1400.0, yen: 210000, desc: 'Oda Signed Luffy' },
  'OP01-120_p1': { usd: 950.0,  yen: 145000, desc: 'Shanks Manga Rare' },
  'OP02-013_p1': { usd: 1100.0, yen: 165000, desc: 'Portgas.D.Ace Manga Rare' },
  'OP03-122_p1': { usd: 450.0,  yen: 68000,  desc: 'Sogeking Manga Rare' },
  'OP04-083_p1': { usd: 650.0,  yen: 98000,  desc: 'Sabo Manga Rare' },
  'OP06-118_p1': { usd: 1250.0, yen: 185000, desc: 'Roronoa Zoro Manga Rare' },
  'OP07-051_p1': { usd: 1400.0, yen: 210000, desc: 'Boa Hancock Manga Rare' },
  'OP08-118_p1': { usd: 850.0,  yen: 125000, desc: 'Silvers Rayleigh Manga Rare' },
  'OP09-118_p1': { usd: 1650.0, yen: 245000, desc: 'Gol.D.Roger Manga Rare' },
  'OP10-119_p1': { usd: 1100.0, yen: 160000, desc: 'Trafalgar Law Manga Rare' },

  // === CHOPPER EB01 VARIANTS ===
  'EB01-006':    { usd: 7.50,   yen: 1000,   desc: 'Tony Tony.Chopper Base SR' },
  'EB01-006_p1': { usd: 55.0,   yen: 7800,   desc: 'Tony Tony.Chopper SR Alt Art' },
  'EB01-006_p3': { usd: 89.0,   yen: 13400,  desc: 'Tony Tony.Chopper Special Variant' },
  'EB01-006_r1': { usd: 12.50,  yen: 1850,   desc: 'Tony Tony.Chopper Reprint' },

  // === LUFFY OP05 VARIANTS ===
  'OP05-119':    { usd: 38.0,   yen: 4800,   desc: 'Luffy Base Secret Rare' },
  'OP05-119_p6': { usd: 85.0,   yen: 12800,  desc: 'Luffy Wanted Poster SP' },
  'OP05-119_p7': { usd: 88.0,   yen: 13200,  desc: 'Luffy Wanted Poster SP #2' },
  'OP05-119_p8': { usd: 92.0,   yen: 13800,  desc: 'Luffy Gold Wanted SP' },
  'OP05-060_p1': { usd: 180.0,  yen: 24000,  desc: 'Luffy Leader Alt Art' },
  'OP05-060':    { usd: 4.50,   yen: 680,    desc: 'Luffy Leader Base' },

  // === FAMOUS SPECIAL RARES (SP) & SECs ===
  'OP14-108_p3': { usd: 65.0,   yen: 9980,   desc: 'Silvers Rayleigh Special Rare (Yuyu-tei ¥9,980)' },
  'OP01-001_p1': { usd: 95.0,   yen: 14000,  desc: 'Zoro Leader Alt Art' },
  'OP01-002_p1': { usd: 85.0,   yen: 12500,  desc: 'Law Leader Alt Art' },
  'OP01-016_p1': { usd: 165.0,  yen: 24000,  desc: 'Nami Alt Art' },
  'OP01-070':    { usd: 12.0,   yen: 1680,   desc: 'Mihawk SR Base' },
  'OP01-078_p1': { usd: 140.0,  yen: 20500,  desc: 'Boa Hancock Alt Art' },
  'OP01-121_p1': { usd: 110.0,  yen: 16000,  desc: 'Yamato SEC Alt Art' },
  'OP02-001_p1': { usd: 85.0,   yen: 12500,  desc: 'Whitebeard Leader Alt Art' },
  'OP02-120_p1': { usd: 114.0,  yen: 16800,  desc: 'Uta SEC Alt Art' },
  'OP02-121':    { usd: 25.0,   yen: 3600,   desc: 'Kuzan SEC Base' },
  'OP02-121_p1': { usd: 65.0,   yen: 9500,   desc: 'Kuzan SEC Alt Art' },
  'OP03-040_p1': { usd: 120.0,  yen: 17500,  desc: 'Nami Leader Alt Art' },
  'OP03-099_p1': { usd: 75.0,   yen: 11000,  desc: 'Katakuri SEC Alt Art' },
  'OP03-122':    { usd: 18.0,   yen: 2500,   desc: 'Sogeking SEC Base' },
  'OP06-022_p1': { usd: 85.0,   yen: 12500,  desc: 'Yamato Leader Alt Art' },
  'OP06-118':    { usd: 42.0,   yen: 5800,   desc: 'Zoro SEC Base' },
  'OP06-118_p2': { usd: 95.0,   yen: 14000,  desc: 'Zoro SEC Alt Art' },
  'OP07-119':    { usd: 32.0,   yen: 4500,   desc: 'Ace SEC Base' },
  'OP07-119_p1': { usd: 85.0,   yen: 12000,  desc: 'Ace SEC Parallel' },
  'OP07-119_p2': { usd: 95.0,   yen: 14000,  desc: 'Ace SEC Alt Art' },
  'OP08-118':    { usd: 35.0,   yen: 4800,   desc: 'Rayleigh SEC Base' },
  'OP08-118_p2': { usd: 85.0,   yen: 12500,  desc: 'Rayleigh SEC Alt Art' },
  'OP09-118':    { usd: 45.0,   yen: 6200,   desc: 'Roger SEC Base' },
  'OP09-118_p2': { usd: 110.0,  yen: 16000,  desc: 'Roger SEC Alt Art' },
  'OP10-119':    { usd: 30.0,   yen: 4200,   desc: 'Law SEC Base' },
  'OP10-119_p2': { usd: 95.0,   yen: 14000,  desc: 'Law SEC Alt Art' },
};

async function main() {
  console.log('🏴‍☠️ Updating high-end Manga Rares and Chase Cards in database...');

  let count = 0;
  for (const [id, data] of Object.entries(ACCURATE_CHASE_PRICES)) {
    const existing = await prisma.card.findUnique({ where: { id } });
    if (existing) {
      await prisma.card.update({
        where: { id },
        data: {
          marketPrice: data.usd,
          yuyuPrice: data.yen,
        },
      });
      console.log(`✅ [${id}] ${data.desc}: US $${data.usd} | JP ¥${data.yen}`);
      count++;
    } else {
      console.warn(`⚠️ Card ID not found in DB: ${id}`);
    }
  }

  // Also verify EB01-006_p2 specifically
  const chopper = await prisma.card.findUnique({
    where: { id: 'EB01-006_p2' },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true },
  });
  console.log('\n🔍 VERIFIED CHOPPER MANGA IN DB:', chopper);

  console.log(`\n🎉 Successfully updated ${count} cards with exact market values!`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
