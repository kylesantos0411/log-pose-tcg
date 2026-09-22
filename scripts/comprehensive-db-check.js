const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING DATABASE CARDS AND PRICING ===');

  // Total count
  const total = await prisma.card.count();
  console.log('Total cards in DB:', total);

  // Check EB01-006 variants specifically
  const chopperCards = await prisma.card.findMany({
    where: { id: { contains: 'EB01-006' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, promoSource: true }
  });
  console.log('\n--- EB01-006 Chopper Cards in DB ---');
  console.table(chopperCards);

  // Check all Manga Rares / Super Parallels
  const mangaIds = [
    'OP01-120_p1', // Shanks
    'OP02-013_p1', // Ace
    'OP03-122_p1', // Sogeking
    'OP04-083_p1', // Sabo
    'OP05-119_p1', // Gear 5 Luffy
    'OP05-119_p2', // Oda Signed Luffy
    'OP06-118_p1', // Zoro
    'OP07-051_p1', // Hancock
    'OP08-118_p1', // Rayleigh
    'OP09-118_p1', // Roger
    'OP10-119_p1', // Law
    'EB01-006_p2', // Chopper
  ];

  const mangaCards = await prisma.card.findMany({
    where: { id: { in: mangaIds } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true }
  });
  console.log('\n--- All Manga Rares in DB ---');
  console.table(mangaCards);

  // Check Promos with flagship or tournament
  const flagships = await prisma.card.findMany({
    where: {
      OR: [
        { promoSource: { contains: 'Flagship' } },
        { promoSource: { contains: 'フラッグシップ' } },
        { promoSource: { contains: 'Championship' } },
      ]
    },
    take: 10,
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, promoSource: true }
  });
  console.log(`\n--- Flagship / Championship Promos (Sample of ${flagships.length}) ---`);
  console.table(flagships);

  // Check if any card has null or 0 price
  const zeroPrices = await prisma.card.count({
    where: {
      OR: [
        { marketPrice: null },
        { marketPrice: 0 },
        { yuyuPrice: null },
        { yuyuPrice: 0 }
      ]
    }
  });
  console.log('\nCards with null or 0 price:', zeroPrices);

  // Check ratio between yuyuPrice (JPY) and marketPrice (USD)
  // Normal exchange rate is roughly 140-160 JPY per USD.
  // Domestic Japanese cards on Yuyu-tei are typically 120-170x the USD price.
  const weirdRatios = await prisma.card.findMany({
    where: {
      marketPrice: { gt: 10 },
      yuyuPrice: { gt: 0 }
    },
    take: 100,
    select: { id: true, name: true, marketPrice: true, yuyuPrice: true }
  });

  const outliers = weirdRatios.filter(c => {
    const ratio = c.yuyuPrice / c.marketPrice;
    return ratio < 80 || ratio > 250;
  });
  console.log('\nPrice outliers (ratio JPY/USD < 80 or > 250):', outliers.length);
  if (outliers.length > 0) {
    console.table(outliers.slice(0, 10));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
