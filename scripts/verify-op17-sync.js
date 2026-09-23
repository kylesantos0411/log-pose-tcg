const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyOP17() {
  const cards = await prisma.card.findMany({
    where: { displaySet: 'OP-17' },
    select: {
      id: true,
      name: true,
      category: true,
      rarity: true,
      colors: true,
      cost: true,
      power: true,
      counter: true,
      attributes: true,
      types: true,
      effect: true,
      imageUrl: true,
      yuyuPrice: true,
      marketPrice: true,
      cardNumber: true,
      originalSet: true,
      printingType: true,
      artistName: true,
    },
    take: 12,
  });

  console.log(`Retrieved ${cards.length} sample cards from OP-17:`);
  console.log(JSON.stringify(cards, null, 2));

  // Verify Manga Luffy specifically
  const mangaLuffy = await prisma.card.findFirst({
    where: {
      displaySet: 'OP-17',
      cardNumber: 'EB04-061',
    },
  });
  console.log('\nManga Rare Luffy:');
  console.log(JSON.stringify(mangaLuffy, null, 2));

  // Check how many have Asia-EN images
  const asiaEnCount = await prisma.card.count({
    where: {
      displaySet: 'OP-17',
      imageUrl: { contains: 'asia-en.onepiece-cardgame.com' },
    },
  });
  console.log(`\nCards with asia-en.onepiece-cardgame.com official image in OP-17: ${asiaEnCount} / 187`);
}

verifyOP17().finally(() => prisma.$disconnect());
