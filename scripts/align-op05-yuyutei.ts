import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OP05_EXACT_MAPPING = [
  {
    id: 'OP05-119',
    name: 'Monkey.D.Luffy',
    rarity: 'SecretRare',
    yuyuPrice: 780,
    marketPrice: 38.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119.png?260828',
    isAltArt: false,
    hasJpPrint: true,
    desc: 'Base Secret Rare (Laughing Gear 5)',
  },
  {
    id: 'OP05-119_p1',
    name: 'Monkey.D.Luffy',
    rarity: 'SecretRare',
    yuyuPrice: 24800,
    marketPrice: 85.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: '"GEAR 5" Comic Pop-Art Alt Art Parallel',
  },
  {
    id: 'OP05-119_p2',
    name: 'Monkey.D.Luffy',
    rarity: 'SecretRare',
    yuyuPrice: 598000,
    marketPrice: 2850.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p2.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: 'Manga Rare Super Parallel (Comic panels background)',
  },
  {
    id: 'OP05-119_p3',
    name: 'Monkey.D.Luffy',
    rarity: 'SecretRare',
    yuyuPrice: 7980,
    marketPrice: 45.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p4.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: 'PRB-01 Blue Lightning Punch Parallel',
  },
  {
    id: 'OP05-119_p4',
    name: 'Monkey.D.Luffy',
    rarity: 'SecretRare',
    yuyuPrice: 19800,
    marketPrice: 75.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p3.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: '2nd Anniversary Kaido Punch JP version',
  },
  {
    id: 'OP05-119_p6',
    name: 'Monkey.D.Luffy',
    rarity: 'Special',
    yuyuPrice: 59800,
    marketPrice: 260.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p6.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: 'WANTED POSTER SP ("DEAD OR ALIVE")',
  },
  {
    id: 'OP05-119_p7',
    name: 'Monkey.D.Luffy',
    rarity: 'Special',
    yuyuPrice: 498000,
    marketPrice: 2800.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p7.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: 'Silver Parallel SP (White/Rainbow mandala)',
  },
  {
    id: 'OP05-119_p8',
    name: 'Monkey.D.Luffy',
    rarity: 'Special',
    yuyuPrice: 1280000,
    marketPrice: 7500.0,
    imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p8.png?260828',
    isAltArt: true,
    hasJpPrint: true,
    desc: 'Gold Parallel SP (Gold mandala)',
  },
];

async function main() {
  console.log('🔄 Aligning all 8 OP05-119 cards with Yuyu-tei...');

  for (const card of OP05_EXACT_MAPPING) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: {
        yuyuPrice: card.yuyuPrice,
        marketPrice: card.marketPrice,
        imageUrl: card.imageUrl,
        isAltArt: card.isAltArt,
        hasJpPrint: true,
      },
      create: {
        id: card.id,
        packId: '569205',
        name: card.name,
        category: 'Character',
        colors: 'Purple',
        cost: 10,
        power: 12000,
        rarity: card.rarity,
        isAltArt: card.isAltArt,
        marketPrice: card.marketPrice,
        yuyuPrice: card.yuyuPrice,
        hasJpPrint: true,
        imageUrl: card.imageUrl,
      },
    });
    console.log(`✅ [${card.id}] ${card.desc} -> ¥${card.yuyuPrice.toLocaleString()} ($${card.marketPrice})`);
  }

  // Hide English-only reprint cards from Japanese view
  await prisma.card.updateMany({
    where: { id: { in: ['OP05-119_r1', 'OP05-119_r2'] } },
    data: { hasJpPrint: false },
  });

  console.log('\n🎉 Successfully updated all 8 OP05-119 cards to match Yuyu-tei!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
