const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== AUDITING UNDERPRICED CARDS (PROMO / PARALLEL / HIGH RARITY) ===');

  const underpriced = await prisma.card.findMany({
    where: {
      OR: [
        { rarity: 'Promo', marketPrice: { lt: 1.0 } },
        { rarity: 'Promo', yuyuPrice: { lt: 100 } },
        { id: { contains: '_p' }, marketPrice: { lt: 1.0 } },
        { id: { contains: '_p' }, yuyuPrice: { lt: 100 } },
        { id: { contains: '_r' }, rarity: { in: ['SuperRare', 'SecretRare', 'Promo', 'Special'] }, marketPrice: { lt: 1.0 } },
      ]
    },
    select: {
      id: true,
      name: true,
      rarity: true,
      marketPrice: true,
      yuyuPrice: true,
      promoSource: true,
      packId: true
    }
  });

  console.log(`Found ${underpriced.length} severely underpriced cards!`);
  console.table(underpriced.slice(0, 30));

  await prisma.$disconnect();
}

main();
