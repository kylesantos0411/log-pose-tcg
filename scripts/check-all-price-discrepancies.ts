import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.findMany({
    select: {
      id: true,
      name: true,
      rarity: true,
      printingType: true,
      promoSource: true,
      yuyuPrice: true,
      marketPrice: true,
      imageUrl: true,
      yuyuteiProductId: true,
    }
  });

  console.log(`Auditing price consistency across ${cards.length} cards...`);

  // Discrepancy 1: yuyuPrice is suspiciously low while marketPrice is high
  // E.g. marketPrice > $20, but yuyuPrice < 1500 yen (~$10)
  const severelyUnderpricedYuyu = cards.filter(c => {
    const yuyu = c.yuyuPrice || 0;
    const marketUsd = c.marketPrice || 0;
    return marketUsd >= 20 && yuyu < marketUsd * 40; // e.g. $100 vs < 4000 yen
  });

  console.log(`\n🚨 FOUND ${severelyUnderpricedYuyu.length} CARDS WITH SEVERELY UNDERPRICED YUYU PRICE (High USD market price, but tiny Yuyu price):`);
  console.table(severelyUnderpricedYuyu.map(c => ({
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    marketUsd: c.marketPrice,
    expectedYenApprox: Math.round((c.marketPrice || 0) * 140),
    actualYuyuYen: c.yuyuPrice,
    promoSource: c.promoSource?.slice(0, 30),
  })));

  // Discrepancy 2: marketPrice is suspiciously low while yuyuPrice is high
  // E.g. yuyuPrice >= 5000 yen (~$35), but marketPrice < $5
  const severelyUnderpricedMarket = cards.filter(c => {
    const yuyu = c.yuyuPrice || 0;
    const marketUsd = c.marketPrice || 0;
    return yuyu >= 5000 && marketUsd < (yuyu / 300); // e.g. 10000 yen vs < $33
  });

  console.log(`\n🚨 FOUND ${severelyUnderpricedMarket.length} CARDS WITH SEVERELY UNDERPRICED MARKET PRICE (High Yuyu price, but tiny USD market price):`);
  console.table(severelyUnderpricedMarket.slice(0, 30).map(c => ({
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    yuyuPrice: c.yuyuPrice,
    actualUsd: c.marketPrice,
    expectedUsdApprox: Math.round(((c.yuyuPrice || 0) / 140) * 100) / 100,
  })));

  // Discrepancy 3: Identical card variants where parallel price <= base price
  const baseCards = new Map<string, typeof cards[0]>();
  for (const c of cards) {
    if (!c.id.includes('_')) {
      baseCards.set(c.id, c);
    }
  }

  const invertedParallels = cards.filter(c => {
    if (!c.id.includes('_p') && !c.id.includes('_sp')) return false;
    const baseId = c.id.split('_')[0];
    const base = baseCards.get(baseId);
    if (!base || !base.yuyuPrice || !c.yuyuPrice) return false;
    return c.yuyuPrice < base.yuyuPrice;
  });

  console.log(`\n⚠️ FOUND ${invertedParallels.length} PARALLEL CARDS PRICED LOWER THAN THEIR BASE CARD:`);
  console.table(invertedParallels.slice(0, 20).map(c => ({
    id: c.id,
    name: c.name,
    parallelYen: c.yuyuPrice,
    baseId: c.id.split('_')[0],
    baseYen: baseCards.get(c.id.split('_')[0])?.yuyuPrice,
  })));
}

main().finally(() => prisma.$disconnect());
