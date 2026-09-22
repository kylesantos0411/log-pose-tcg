const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const withYuyu = await p.card.count({ where: { yuyuPrice: { not: null } } });
  const withoutYuyu = await p.card.count({ where: { yuyuPrice: null } });
  const withMarket = await p.card.count({ where: { marketPrice: { not: null } } });

  console.log('=== Price Source Coverage ===');
  console.log('Cards with yuyuPrice (JPY source - Yuyu-tei):', withYuyu);
  console.log('Cards WITHOUT yuyuPrice (no JPY data):       ', withoutYuyu);
  console.log('Cards with marketPrice (USD source):         ', withMarket);

  // Sample cards with both prices
  const bothPrices = await p.card.findMany({
    where: { yuyuPrice: { not: null }, marketPrice: { not: null } },
    take: 10,
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true }
  });
  console.log('\n=== Cards with BOTH prices (USD + JPY Yuyu-tei) ===');
  bothPrices.forEach(c => {
    const ratio = (c.yuyuPrice / c.marketPrice).toFixed(0);
    console.log(`  ${c.id} [${c.rarity}]  USD:$${c.marketPrice}  JPY:¥${c.yuyuPrice}  ratio:${ratio}`);
  });

  // High-rarity cards with ONLY marketPrice (no yuyu)
  const onlyMarket = await p.card.findMany({
    where: { yuyuPrice: null, rarity: { in: ['SecretRare', 'DoubleRare', 'SuperRare', 'Special'] } },
    take: 15,
    select: { id: true, name: true, rarity: true, marketPrice: true }
  });
  console.log('\n=== High-rarity cards with ONLY marketPrice (missing JPY yuyu price) ===');
  onlyMarket.forEach(c => console.log(`  ${c.id} [${c.rarity}]  USD:$${c.marketPrice}  ${c.name}`));

  // Check promo cards with yuyu prices
  const promos = await p.card.findMany({
    where: { yuyuPrice: { not: null }, packId: '569901' },
    take: 8,
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, promoSource: true }
  });
  console.log('\n=== Promo cards with yuyu prices ===');
  promos.forEach(c => console.log(`  ${c.id}  USD:$${c.marketPrice}  JPY:¥${c.yuyuPrice}  ${c.name}`));

  // Check the overall pack distribution of yuyu prices
  const packGroups = await p.card.groupBy({
    by: ['packId'],
    where: { yuyuPrice: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 15
  });
  console.log('\n=== Packs with yuyu prices ===');
  packGroups.forEach(g => console.log(`  packId:${g.packId}  count:${g._count.id}`));

  await p.$disconnect();
}
main().catch(console.error);
