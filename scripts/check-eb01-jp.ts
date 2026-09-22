import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEB01() {
  const cards = await prisma.card.findMany({
    where: {
      id: { startsWith: 'EB01' },
    },
    select: { id: true, name: true, rarity: true, promoSource: true, imageUrl: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Checking ${cards.length} EB01 cards against Bandai JP...`);

  // Batch in chunks of 20
  const results: any[] = [];
  const chunkSize = 20;
  for (let i = 0; i < cards.length; i += chunkSize) {
    const chunk = cards.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (c) => {
        if (!c.id.includes('_')) {
          return { id: c.id, existsJp: true, reason: 'Base Card' };
        }
        if (c.imageUrl && c.imageUrl.includes('yuyu-tei.jp')) {
          return { id: c.id, existsJp: true, reason: 'Yuyu-tei image' };
        }
        try {
          const res = await fetch(`https://onepiece-cardgame.com/images/cardlist/card/${c.id}.png`, {
            method: 'HEAD',
          });
          return { id: c.id, existsJp: res.status === 200, status: res.status, promo: c.promoSource };
        } catch (e) {
          return { id: c.id, existsJp: false, reason: 'Fetch error' };
        }
      })
    );
    results.push(...chunkResults);
  }

  console.table(results.filter((r) => !r.existsJp));
  console.log(`Total non-JP cards found in EB01: ${results.filter((r) => !r.existsJp).length}`);
}

checkEB01().finally(() => prisma.$disconnect());
