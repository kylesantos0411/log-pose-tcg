import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Deleting TCGPlayer records from CardPrice ---');
  const deletedPrices = await prisma.cardPrice.deleteMany({});
  console.log(`Deleted ${deletedPrices.count} TCGPlayer price history entries.`);

  console.log('\n--- 2. Deleting English-only cards (hasJpPrint = false) ---');
  const deletedNoJp = await prisma.card.deleteMany({
    where: { hasJpPrint: false }
  });
  console.log(`Deleted ${deletedNoJp.count} English-only cards.`);

  console.log('\n--- 3. Deleting TCGPlayer reprint artifacts (_r1, _r2, etc.) ---');
  const deletedReprints = await prisma.card.deleteMany({
    where: { id: { contains: '_r' } }
  });
  console.log(`Deleted ${deletedReprints.count} reprint artifact cards.`);

  console.log('\n--- 4. Replacing any remaining en.onepiece-cardgame.com URLs with onepiece-cardgame.com ---');
  const enCards = await prisma.card.findMany({
    where: { imageUrl: { contains: 'en.onepiece-cardgame.com' } },
    select: { id: true, imageUrl: true }
  });

  for (const c of enCards) {
    if (!c.imageUrl) continue;
    const cleanJpUrl = c.imageUrl.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');
    await prisma.card.update({
      where: { id: c.id },
      data: { imageUrl: cleanJpUrl }
    });
  }
  console.log(`Rewrote ${enCards.length} image URLs to Japanese official Bandai domain.`);

  console.log('\n--- 5. Configuring EB01-015 exact Yuyu-tei catalog cards ---');
  // First clean up any excess variants for EB01-015
  await prisma.card.deleteMany({
    where: {
      id: { in: ['EB01-015_p4', 'EB01-015_p5', 'EB01-015_p6', 'EB01-015_r1'] }
    }
  });

  const eb01Base = await prisma.card.findUnique({ where: { id: 'EB01-015' } });
  const packId = eb01Base ? eb01Base.packId : '569201';

  // 1. Base card (¥80)
  await prisma.card.upsert({
    where: { id: 'EB01-015' },
    update: {
      name: 'スクラッチメン・アプー',
      yuyuPrice: 80,
      marketPrice: 0.53,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/eb01/10021.jpg',
      hasJpPrint: true,
      isAltArt: false,
      promoSource: null,
    },
    create: {
      id: 'EB01-015',
      packId,
      name: 'スクラッチメン・アプー',
      category: 'Character',
      colors: 'Purple',
      cost: 3,
      power: 4000,
      counter: 1000,
      attributes: 'Music,On-Air Pirates',
      types: 'Music,On-Air Pirates',
      rarity: 'Common',
      yuyuPrice: 80,
      marketPrice: 0.53,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/eb01/10021.jpg',
      hasJpPrint: true,
      isAltArt: false,
    }
  });

  // 2. ST24 Non-holo (¥50)
  await prisma.card.upsert({
    where: { id: 'EB01-015_p1' },
    update: {
      name: 'スクラッチメン・アプー',
      yuyuPrice: 50,
      marketPrice: 0.33,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/st24/10009.jpg',
      hasJpPrint: true,
      isAltArt: true,
      promoSource: 'ST24 Reprint',
    },
    create: {
      id: 'EB01-015_p1',
      packId,
      name: 'スクラッチメン・アプー',
      category: 'Character',
      colors: 'Purple',
      cost: 3,
      power: 4000,
      counter: 1000,
      attributes: 'Music,On-Air Pirates',
      types: 'Music,On-Air Pirates',
      rarity: 'Common',
      yuyuPrice: 50,
      marketPrice: 0.33,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/st24/10009.jpg',
      hasJpPrint: true,
      isAltArt: true,
      promoSource: 'ST24 Reprint',
    }
  });

  // 3. Standard Battle Pack Vol.10 Parallel (¥180)
  await prisma.card.upsert({
    where: { id: 'EB01-015_p2' },
    update: {
      name: 'スクラッチメン・アプー',
      yuyuPrice: 180,
      marketPrice: 1.18,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/promo-eb10/10003.jpg',
      hasJpPrint: true,
      isAltArt: true,
      promoSource: 'スタンダードバトルパックVol.10',
    },
    create: {
      id: 'EB01-015_p2',
      packId,
      name: 'スクラッチメン・アプー',
      category: 'Character',
      colors: 'Purple',
      cost: 3,
      power: 4000,
      counter: 1000,
      attributes: 'Music,On-Air Pirates',
      types: 'Music,On-Air Pirates',
      rarity: 'Parallel',
      yuyuPrice: 180,
      marketPrice: 1.18,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/promo-eb10/10003.jpg',
      hasJpPrint: true,
      isAltArt: true,
      promoSource: 'スタンダードバトルパックVol.10',
    }
  });

  // 4. PRB-02 Parallel (¥1,280)
  await prisma.card.upsert({
    where: { id: 'EB01-015_p3' },
    update: {
      name: 'スクラッチメン・アプー',
      yuyuPrice: 1280,
      marketPrice: 8.42,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/prb02/10143.jpg',
      hasJpPrint: true,
      isAltArt: true,
      promoSource: 'PRB-02 Parallel',
    },
    create: {
      id: 'EB01-015_p3',
      packId,
      name: 'スクラッチメン・アプー',
      category: 'Character',
      colors: 'Purple',
      cost: 3,
      power: 4000,
      counter: 1000,
      attributes: 'Music,On-Air Pirates',
      types: 'Music,On-Air Pirates',
      rarity: 'Parallel',
      yuyuPrice: 1280,
      marketPrice: 8.42,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/prb02/10143.jpg',
      hasJpPrint: true,
      isAltArt: true,
      promoSource: 'PRB-02 Parallel',
    }
  });
  console.log('✓ EB01-015 exact 4 Yuyu-tei variants aligned.');

  console.log('\n--- 6. Syncing OP02 cards with exact Yuyu-tei Japanese artwork & prices ---');
  const op02Res = await fetch('https://yuyu-tei.jp/sell/opc/s/search?search_word=OP02', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'ja,en;q=0.9'
    }
  });

  if (op02Res.ok) {
    const html = await op02Res.text();
    const blocks = html.split('class="card-product');
    let op02Updated = 0;

    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
      const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
      const priceMatch = b.match(/([0-9,]+)\s*円/);
      const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);

      if (codeMatch && priceMatch) {
        const code = codeMatch[1].trim();
        const priceYen = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        let img = imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : null;
        if (img && img.includes('noimage')) img = null;

        // If base card exists in DB, update with authentic Yuyu-tei image if not set or if bandai
        const card = await prisma.card.findUnique({ where: { id: code } });
        if (card && (!card.imageUrl || card.imageUrl.includes('onepiece-cardgame.com'))) {
          if (img) {
            await prisma.card.update({
              where: { id: code },
              data: {
                imageUrl: img,
                yuyuPrice: priceYen,
                marketPrice: Math.round((priceYen / 152) * 100) / 100
              }
            });
            op02Updated++;
          }
        }
      }
    }
    console.log(`Updated ${op02Updated} OP02 cards with direct Yuyu-tei images.`);
  }

  console.log('\n--- 7. Recalculate pack card counts ---');
  const packs = await prisma.pack.findMany();
  for (const p of packs) {
    const cnt = await prisma.card.count({ where: { packId: p.id } });
    await prisma.pack.update({
      where: { id: p.id },
      data: { cardsCount: cnt }
    });
  }
  console.log(`Updated cards count for ${packs.length} packs.`);

  console.log('\n--- 8. Final Verification of Database Integrity ---');
  const finalTotal = await prisma.card.count();
  const finalEnImg = await prisma.card.count({ where: { imageUrl: { contains: 'en.onepiece' } } });
  const finalYuyuImg = await prisma.card.count({ where: { imageUrl: { contains: 'yuyu-tei.jp' } } });
  const finalJpBandai = await prisma.card.count({ where: { imageUrl: { contains: 'onepiece-cardgame.com' } } });
  const finalPrices = await prisma.cardPrice.count();
  const finalNoJp = await prisma.card.count({ where: { hasJpPrint: false } });

  console.log({
    finalTotal,
    finalEnImg,
    finalYuyuImg,
    finalJpBandai,
    finalPrices,
    finalNoJp
  });

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
