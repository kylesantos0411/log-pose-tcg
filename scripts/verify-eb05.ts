import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyEB05() {
  const count = await prisma.card.count({ where: { packId: '569205' } });
  const withPrice = await prisma.card.count({ where: { packId: '569205', yuyuPrice: { not: null, gt: 0 } } });
  const withImage = await prisma.card.count({ where: { packId: '569205', imageUrl: { not: null } } });
  
  console.log(`EB-05 Verification:`);
  console.log(`Total cards: ${count}`);
  console.log(`With authentic Yuyu-tei price: ${withPrice}`);
  console.log(`With official image: ${withImage}`);

  const sampleCards = await prisma.card.findMany({
    where: { packId: '569205' },
    select: {
      id: true,
      name: true,
      rarity: true,
      category: true,
      colors: true,
      power: true,
      cost: true,
      yuyuPrice: true,
      marketPrice: true,
      imageUrl: true,
      displaySet: true,
      originalSet: true,
      printingType: true,
    },
    take: 6,
    orderBy: { id: 'asc' }
  });

  console.log('Sample cards in DB:', JSON.stringify(sampleCards, null, 2));

  // Check all Robin cards in EB-05
  const robins = await prisma.card.findMany({
    where: { packId: '569205', name: { contains: 'Robin' } },
    select: {
      id: true,
      name: true,
      rarity: true,
      printingType: true,
      yuyuPrice: true,
      marketPrice: true,
      yuyuteiProductId: true,
      yuyuteiTitle: true,
    },
    orderBy: { id: 'asc' }
  });
  console.log('\nAll Nico Robin cards in EB-05:\n', JSON.stringify(robins, null, 2));
}

verifyEB05().catch(console.error).finally(() => prisma.$disconnect());
