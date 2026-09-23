const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🔄 Reconciling Cross-Set SP and Chase cards to Yuyu-tei release sets...');

  // 1. Reassign OP-17 cross-set cards
  const op17Pack = await prisma.pack.findFirst({ where: { code: 'OP-17' } });
  if (op17Pack) {
    // EB04-061_p2: Monkey D. Luffy (Parallel) (Pirate Crew Super Parallel, 1,480,000 yen)
    await prisma.card.update({
      where: { id: 'EB04-061_p2' },
      data: { packId: op17Pack.id, yuyuPrice: 1480000, hasJpPrint: true }
    });
    console.log('✅ Reassigned EB04-061_p2 (1,480,000 JPY Luffy) to OP-17');

    // EB04-007_p2: Roronoa Zoro (Parallel SP, 24,800 yen, op17/10174.jpg)
    await prisma.card.update({
      where: { id: 'EB04-007_p2' },
      data: { packId: op17Pack.id, yuyuPrice: 24800, hasJpPrint: true }
    });
    console.log('✅ Reassigned EB04-007_p2 (Zoro SP) to OP-17');

    // OP14-108_p1: Silvers Rayleigh (Parallel SP, 9,980 yen, op17/10169.jpg)
    await prisma.card.update({
      where: { id: 'OP14-108_p1' },
      data: { packId: op17Pack.id, yuyuPrice: 9980, hasJpPrint: true }
    });
    console.log('✅ Reassigned OP14-108_p1 (Rayleigh SP) to OP-17');
  }

  // 2. Reassign OP-16 cross-set cards
  const op16Pack = await prisma.pack.findFirst({ where: { code: 'OP-16' } });
  if (op16Pack) {
    // EB04-054_p1: Bartholomew Kuma (op16/10157.jpg)
    await prisma.card.update({
      where: { id: 'EB04-054_p1' },
      data: { packId: op16Pack.id, yuyuPrice: 5980, hasJpPrint: true }
    });
    console.log('✅ Reassigned EB04-054_p1 (Kuma SP) to OP-16');

    // OP14-029_p1: Tashigi (op16/10154.jpg)
    await prisma.card.update({
      where: { id: 'OP14-029_p1' },
      data: { packId: op16Pack.id, yuyuPrice: 5980, hasJpPrint: true }
    });
    console.log('✅ Reassigned OP14-029_p1 (Tashigi SP) to OP-16');

    // OP14-084_p2: Ms. All Sunday (op16/10155.jpg)
    await prisma.card.update({
      where: { id: 'OP14-084_p2' },
      data: { packId: op16Pack.id, yuyuPrice: 34800, hasJpPrint: true }
    });
    console.log('✅ Reassigned OP14-084_p2 (Ms. All Sunday SP) to OP-16');
  }

  // 3. Reassign OP-12 cross-set cards
  const op12Pack = await prisma.pack.findFirst({ where: { code: 'OP-12' } });
  if (op12Pack) {
    // ST18-004_p1: Zoro-Juurou (op12/10153.jpg)
    await prisma.card.update({
      where: { id: 'ST18-004_p1' },
      data: { packId: op12Pack.id, yuyuPrice: 17800, hasJpPrint: true }
    });
    console.log('✅ Reassigned ST18-004_p1 (Zoro-Juurou SP) to OP-12');
  }

  // 4. Create/Upsert the 8 OP-17 DON!! cards with authentic Yuyu-tei images & prices
  const op17DonCards = [
    {
      id: 'OP17-DON-01',
      name: 'DON!! Card (「四皇」はおれが全部倒すつもりだから!!!)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Common',
      yuyuPrice: 120,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10159.jpg',
      promoSource: null,
      isAltArt: false,
    },
    {
      id: 'OP17-DON-01_p1',
      name: 'DON!! Card (「四皇」はおれが全部倒すつもりだから!!! Super Parallel)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Special',
      yuyuPrice: 500,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10160.jpg',
      promoSource: 'パラレル(スーパーパラレル)',
      isAltArt: true,
    },
    {
      id: 'OP17-DON-02',
      name: 'DON!! Card (ルフィ＆ロキ)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Common',
      yuyuPrice: 50,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10161.jpg',
      promoSource: null,
      isAltArt: false,
    },
    {
      id: 'OP17-DON-02_p1',
      name: 'DON!! Card (ルフィ＆ロキ Super Parallel)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Special',
      yuyuPrice: 1780,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10162.jpg',
      promoSource: 'パラレル(スーパーパラレル)',
      isAltArt: true,
    },
    {
      id: 'OP17-DON-03',
      name: 'DON!! Card (旧四皇)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Common',
      yuyuPrice: 50,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10163.jpg',
      promoSource: null,
      isAltArt: false,
    },
    {
      id: 'OP17-DON-03_p1',
      name: 'DON!! Card (旧四皇 Super Parallel)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Special',
      yuyuPrice: 980,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10164.jpg',
      promoSource: 'パラレル(スーパーパラレル)',
      isAltArt: true,
    },
    {
      id: 'OP17-DON-04',
      name: 'DON!! Card (ロックス海賊団)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Common',
      yuyuPrice: 220,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10165.jpg',
      promoSource: null,
      isAltArt: false,
    },
    {
      id: 'OP17-DON-04_p1',
      name: 'DON!! Card (ロックス海賊団 Super Parallel)',
      category: 'DON!!',
      colors: 'Colorless',
      rarity: 'Special',
      yuyuPrice: 2980,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10166.jpg',
      promoSource: 'パラレル(スーパーパラレル)',
      isAltArt: true,
    },
  ];

  if (op17Pack) {
    for (const d of op17DonCards) {
      await prisma.card.upsert({
        where: { id: d.id },
        update: {
          packId: op17Pack.id,
          name: d.name,
          category: d.category,
          colors: d.colors,
          rarity: d.rarity,
          yuyuPrice: d.yuyuPrice,
          imageUrl: d.imageUrl,
          promoSource: d.promoSource,
          isAltArt: d.isAltArt,
          hasJpPrint: true,
          releaseDate: '2026-08-29',
          releaseOrder: 20260829,
        },
        create: {
          id: d.id,
          packId: op17Pack.id,
          name: d.name,
          category: d.category,
          colors: d.colors,
          rarity: d.rarity,
          yuyuPrice: d.yuyuPrice,
          imageUrl: d.imageUrl,
          promoSource: d.promoSource,
          isAltArt: d.isAltArt,
          hasJpPrint: true,
          releaseDate: '2026-08-29',
          releaseOrder: 20260829,
        }
      });
    }
    console.log('✅ Created/Upserted 8 OP-17 DON!! cards');
  }

  // 5. Update cardsCount for all packs
  const packs = await prisma.pack.findMany();
  for (const p of packs) {
    const count = await prisma.card.count({
      where: { packId: p.id, hasJpPrint: true, yuyuPrice: { not: null, gt: 0 } }
    });
    await prisma.pack.update({
      where: { id: p.id },
      data: { cardsCount: count }
    });
  }

  const finalOp17Count = await prisma.card.count({
    where: { packId: op17Pack.id, hasJpPrint: true, yuyuPrice: { not: null, gt: 0 } }
  });
  console.log(`\n🎉 Final OP-17 count in DB: ${finalOp17Count} (Target: 177 from Yuyu-tei)`);
}

run().catch(console.error);
