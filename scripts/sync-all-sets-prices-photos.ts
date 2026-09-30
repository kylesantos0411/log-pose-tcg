import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

interface ScrapedCard {
  code: string;
  title: string;
  price: number;
  img: string | null;
  yuyuUrl: string;
  yuyuId: string;
  setSlug: string;
}

async function fetchSetCards(setSlug: string): Promise<ScrapedCard[]> {
  const url = `https://yuyu-tei.jp/sell/opc/s/${setSlug}`;
  console.log(`🌐 Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });
    if (!res.ok) {
      console.warn(`Failed to fetch ${setSlug}: HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const blocks = html.split('class="card-product');
    const cards: ScrapedCard[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const codeM = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
      const titleM = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
      const priceM = b.match(/([0-9,]+)\s*円/);
      const imgM = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);
      const urlM = b.match(/href="(https:\/\/yuyu-tei\.jp\/sell\/opc\/card\/([^/]+)\/(\d+))"/i);

      if (!codeM || !priceM || !urlM) continue;

      const code = codeM[1].trim();
      const title = titleM ? titleM[1].trim() : '';
      const price = parseInt(priceM[1].replace(/,/g, ''), 10);
      let img = imgM ? imgM[1].replace('/100_140/', '/front/') : null;
      if (img && img.includes('noimage')) img = null;

      cards.push({
        code,
        title,
        price,
        img,
        yuyuUrl: urlM[1],
        yuyuId: urlM[3],
        setSlug,
      });
    }

    console.log(`  ✓ Scraped ${cards.length} cards from ${setSlug}`);
    return cards;
  } catch (e: any) {
    console.error(`Error fetching ${setSlug}:`, e.message);
    return [];
  }
}

export async function processSetCards(cards: ScrapedCard[]) {
  let createdCount = 0;
  let updatedCount = 0;

  for (const sCard of cards) {
    // 1. Try to find exact card by yuyuteiUrl or (yuyuteiProductId && yuyuteiVer)
    let card = await prisma.card.findFirst({
      where: {
        OR: [
          { yuyuteiUrl: sCard.yuyuUrl },
          { yuyuteiProductId: sCard.yuyuId, yuyuteiVer: sCard.setSlug },
        ],
      },
    });

    if (card) {
      // Update price and ensure photo is correct
      const updateData: any = {};
      if (card.yuyuPrice !== sCard.price) {
        updateData.yuyuPrice = sCard.price;
        updateData.marketPrice = Math.round((sCard.price / 140) * 100) / 100;
      }
      if (sCard.img && (!card.imageUrl || card.imageUrl.includes('/100_140/') || card.imageUrl.includes('noimage'))) {
        updateData.imageUrl = sCard.img;
      }
      if (card.yuyuteiTitle !== sCard.title) {
        updateData.yuyuteiTitle = sCard.title;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.card.update({
          where: { id: card.id },
          data: updateData,
        });
        updatedCount++;
      }
      continue;
    }

    // 2. Not found by exact URL/ID. Search by cardNumber
    const existingForNumber = await prisma.card.findMany({
      where: { cardNumber: sCard.code },
      orderBy: { id: 'asc' },
    });

    if (existingForNumber.length > 0) {
      // Check if one of them matches by image
      const imgMatch = sCard.img ? existingForNumber.find((c) => c.imageUrl === sCard.img) : null;
      if (imgMatch) {
        await prisma.card.update({
          where: { id: imgMatch.id },
          data: {
            yuyuPrice: sCard.price,
            marketPrice: Math.round((sCard.price / 140) * 100) / 100,
            yuyuteiUrl: sCard.yuyuUrl,
            yuyuteiProductId: sCard.yuyuId,
            yuyuteiVer: sCard.setSlug,
            yuyuteiTitle: sCard.title,
          },
        });
        updatedCount++;
        continue;
      }

      // Check if it's the base card and this is a base card print (no "パラレル" in title and no promo in title)
      const isBaseItem = !sCard.title.includes('パラレル') && !sCard.title.includes('(') && !sCard.title.includes('特別');
      const baseCard = existingForNumber.find((c) => c.id === sCard.code) || existingForNumber[0];

      if (isBaseItem && baseCard.id === sCard.code && !baseCard.yuyuteiUrl) {
        await prisma.card.update({
          where: { id: baseCard.id },
          data: {
            yuyuPrice: sCard.price,
            marketPrice: Math.round((sCard.price / 140) * 100) / 100,
            yuyuteiUrl: sCard.yuyuUrl,
            yuyuteiProductId: sCard.yuyuId,
            yuyuteiVer: sCard.setSlug,
            yuyuteiTitle: sCard.title,
            imageUrl: sCard.img || baseCard.imageUrl,
          },
        });
        updatedCount++;
        continue;
      }

      // It's a new variant! (e.g. A promo reprint, alternate art, parallel)
      // Determine new variant ID
      let nextSuffix = 1;
      while (existingForNumber.some((c) => c.id === `${sCard.code}_p${nextSuffix}`)) {
        nextSuffix++;
      }
      const newId = `${sCard.code}_p${nextSuffix}`;

      // Extract promo source label from title if in parentheses
      const promoMatch = sCard.title.match(/\(([^)]+)\)/);
      const promoSource = promoMatch ? promoMatch[1] : sCard.title;
      const isAlt = sCard.title.includes('パラレル') || sCard.title.includes('サイン');

      await prisma.card.create({
        data: {
          id: newId,
          packId: baseCard.packId,
          name: baseCard.name,
          category: baseCard.category,
          colors: baseCard.colors,
          cost: baseCard.cost,
          power: baseCard.power,
          counter: baseCard.counter,
          attributes: baseCard.attributes,
          types: baseCard.types,
          rarity: baseCard.rarity,
          effect: baseCard.effect,
          trigger: baseCard.trigger,
          imageUrl: sCard.img || baseCard.imageUrl,
          blockNumber: baseCard.blockNumber,
          isAltArt: isAlt,
          baseCardId: baseCard.id,
          marketPrice: Math.round((sCard.price / 140) * 100) / 100,
          yuyuPrice: sCard.price,
          promoSource: promoSource,
          hasJpPrint: true,
          releaseDate: baseCard.releaseDate,
          releaseOrder: baseCard.releaseOrder,
          cardNumber: sCard.code,
          printedSetCode: baseCard.printedSetCode,
          originalSet: baseCard.originalSet,
          yuyuteiSet: sCard.setSlug.toUpperCase(),
          displaySet: sCard.setSlug.startsWith('promo-') ? 'PROMO' : baseCard.displaySet,
          printingType: isAlt ? 'Parallel' : 'Reprint',
          artistName: baseCard.artistName,
          yuyuteiProductId: sCard.yuyuId,
          yuyuteiVer: sCard.setSlug,
          yuyuteiUrl: sCard.yuyuUrl,
          yuyuteiTitle: sCard.title,
          yuyuteiRarity: baseCard.yuyuteiRarity,
          isVintage: false,
        },
      });
      createdCount++;
    }
  }

  return { createdCount, updatedCount };
}

async function main() {
  console.log('🚀 Starting Universal Yu-Yu-Tei Price & Photo Synchronizer...');

  const setsToSync = [
    // 1. Promo Sets
    'promo-op20',
    'promo-op10',
    'promo-st10',
    'promo-eb10',
    'promo-prb10',
    'promo-100',
    'promo-200',

    // 2. Booster Sets
    'op13', // Target of user request
    'op17',
    'op16',
    'op15',
    'op14',
    'op12',
    'op11',
    'op10',
    'op09',
    'op08',
    'op07',
    'op06',
    'op05',
    'op04',
    'op03',
    'op02',
    'op01',
    'eb01',
    'eb02',
    'eb03',
    'eb04',
    'prb01',
    'prb02',

    // 3. Starter Decks
    'st35',
    'st36',
    'st30',
  ];

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const setSlug of setsToSync) {
    const cards = await fetchSetCards(setSlug);
    const { createdCount, updatedCount } = await processSetCards(cards);
    console.log(`  Set [${setSlug}] -> Created: ${createdCount}, Updated: ${updatedCount}`);
    totalCreated += createdCount;
    totalUpdated += updatedCount;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n======================================================');
  console.log(`🎉 Sync Completed!`);
  console.log(`Total Variants Created: ${totalCreated}`);
  console.log(`Total Cards Updated: ${totalUpdated}`);
  console.log('======================================================');

  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
