const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check ST01-001 variants
  const st01 = await p.card.findMany({
    where: { id: { startsWith: 'ST01-001' } },
    select: { id: true, name: true, yuyuPrice: true, imageUrl: true, hasJpPrint: true },
    orderBy: { id: 'asc' }
  });
  console.log('=== ST01-001 variants ===');
  console.log(JSON.stringify(st01, null, 2));

  // Check EB01-015 variants
  const eb01 = await p.card.findMany({
    where: { id: { startsWith: 'EB01-015' } },
    select: { id: true, name: true, yuyuPrice: true, hasJpPrint: true, promoSource: true },
    orderBy: { id: 'asc' }
  });
  console.log('\n=== EB01-015 variants ===');
  console.log(JSON.stringify(eb01, null, 2));

  // Check total cards with yuyuPrice
  const withPrice = await p.card.count({ where: { yuyuPrice: { not: null, gt: 0 } } });
  const total = await p.card.count();
  console.log(`\n=== Totals ===`);
  console.log(`Total cards: ${total}`);
  console.log(`Cards with yuyuPrice: ${withPrice}`);

  await p.$disconnect();
}

main().catch(console.error);
