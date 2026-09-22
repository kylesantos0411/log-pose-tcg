const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const under2 = await p.card.count({ where: { marketPrice: { lt: 2 } } });
  const r2to10 = await p.card.count({ where: { marketPrice: { gte: 2, lt: 10 } } });
  const r10plus = await p.card.count({ where: { marketPrice: { gte: 10 } } });
  const nullPrice = await p.card.count({ where: { marketPrice: null } });

  console.log('Cards with price under 2:', under2);
  console.log('Cards 2-10:', r2to10);
  console.log('Cards 10+:', r10plus);
  console.log('Cards with NULL price:', nullPrice);

  // Check how many high-rarity cards have suspiciously low prices
  const badHighRarity = await p.card.count({
    where: {
      rarity: { in: ['SecretRare', 'DoubleRare', 'SuperRare', 'Special', 'Leader'] },
      marketPrice: { lt: 3 }
    }
  });
  console.log('High-rarity cards with price under 3:', badHighRarity);

  // Sample correct prices
  const sample = await p.card.findMany({
    where: { marketPrice: { gte: 30 } },
    take: 10,
    select: { id: true, name: true, rarity: true, marketPrice: true }
  });
  console.log('\nSample cards with correct high prices:');
  sample.forEach(c => console.log(c.id, c.rarity, c.marketPrice, c.name));
}
main();
