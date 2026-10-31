import { PrismaClient } from '@prisma/client';
import { fetchBandaiAsiaCards } from '../src/lib/bandai-asia-scraper';
import { scrapeYuyuteiSet } from '../src/lib/yuyu-scraper';

const prisma = new PrismaClient();

const PACK_ID = '569205';
const SET_CODE = 'EB-05';
const SET_NAME = 'ONE PIECE HEROINES EDITION vol.2';
const RELEASE_DATE = '2026-10-31';
const RELEASE_ORDER = 20261031;

async function ingestEB05() {
  console.log(`🚀 Starting ingestion of ${SET_CODE} (${SET_NAME})...`);

  // 1. Upsert Pack Record in database
  console.log(`📦 Upserting pack ${PACK_ID} [${SET_CODE}]...`);
  const pack = await prisma.pack.upsert({
    where: { id: PACK_ID },
    update: {
      code: SET_CODE,
      name: SET_NAME,
      seriesType: 'EXTRA BOOSTER',
      language: 'en',
      releaseDate: RELEASE_DATE,
      releaseOrder: RELEASE_ORDER,
    },
    create: {
      id: PACK_ID,
      code: SET_CODE,
      name: SET_NAME,
      seriesType: 'EXTRA BOOSTER',
      language: 'en',
      releaseDate: RELEASE_DATE,
      releaseOrder: RELEASE_ORDER,
      cardsCount: 0,
    },
  });
  console.log(`✓ Pack record confirmed:`, pack.id, pack.name);

  // 2. Scrape official Bandai Asia-EN cards for EB-05 (series 556205)
  console.log(`🌐 Fetching official Bandai Asia-EN cards...`);
  const bandaiResult = await fetchBandaiAsiaCards('556205');
  console.log(`✓ Retrieved ${bandaiResult.cards.length} cards from Bandai.`);

  // 3. Scrape official Yuyu-tei prices for EB-05
  console.log(`💴 Fetching authentic Yuyu-tei prices for eb05...`);
  const yuyuProducts = await scrapeYuyuteiSet('eb05');
  console.log(`✓ Retrieved ${yuyuProducts.length} Yuyu-tei listings.`);

  // Create lookup maps for Yuyu-tei products:
  // Map by cardNumber -> array of Yuyu listings
  const yuyuByCardNumber = new Map<string, typeof yuyuProducts>();
  for (const item of yuyuProducts) {
    if (!yuyuByCardNumber.has(item.cardNumber)) {
      yuyuByCardNumber.set(item.cardNumber, []);
    }
    yuyuByCardNumber.get(item.cardNumber)!.push(item);
  }

  // 4. Ingest and upsert each card
  let inserted = 0;

  for (const bCard of bandaiResult.cards) {
    // Determine card ID format
    const cardId = bCard.id;
    const baseCardNumber = bCard.cardNumber;

    // Check matching Yuyutei product
    const yuyuList = yuyuByCardNumber.get(baseCardNumber) || [];
    let matchedYuyu: (typeof yuyuProducts)[0] | undefined;

    if (bCard.rawRarity === 'SP CARD' || bCard.id.includes('_sp')) {
      matchedYuyu = yuyuList.find(y => y.rarity === 'SP');
    } else if (!bCard.isAltArt) {
      matchedYuyu = yuyuList.find(y => !y.isAltArt && y.rarity !== 'SP');
    } else {
      // Parallel variants
      const parallels = yuyuList.filter(y => y.isAltArt && y.rarity !== 'SP');
      if (bCard.id.endsWith('_p3')) {
        matchedYuyu = parallels.find(y => y.title.includes('箔押し') || y.isSuperParallel) || parallels[parallels.length - 1];
      } else if (bCard.id.endsWith('_p2')) {
        matchedYuyu = parallels.find(y => y.isSuperParallel || y.title.includes('スーパーパラレル') || y.title.includes('描き下ろし')) || parallels[parallels.length - 1];
      } else if (bCard.id.endsWith('_p1')) {
        matchedYuyu = parallels.find(y => !y.isSuperParallel && !y.title.includes('スーパーパラレル') && !y.title.includes('箔押し') && !y.title.includes('描き下ろし')) || parallels[0];
      } else {
        matchedYuyu = parallels[0];
      }
    }

    // If still unmatched and there's only 1 item for this card number, use it
    if (!matchedYuyu && yuyuList.length === 1) {
      matchedYuyu = yuyuList[0];
    }

    let printingType = bCard.printingType;
    if (cardId === 'EB05-010_p2') {
      printingType = 'Super Parallel (Manga Rare)';
    } else if (cardId === 'EB05-014_p2' || cardId === 'EB05-055_p3') {
      printingType = 'Super Parallel';
    } else if (matchedYuyu?.isSuperParallel && !printingType.includes('Super Parallel')) {
      printingType = 'Super Parallel';
    }

    const yuyuPrice = matchedYuyu ? matchedYuyu.priceYen : null;
    const marketPrice = yuyuPrice ? Math.round((yuyuPrice / 140) * 100) / 100 : null;

    // Upsert into database
    await prisma.card.upsert({
      where: { id: cardId },
      update: {
        packId: PACK_ID,
        name: bCard.name,
        category: bCard.category,
        colors: bCard.colors,
        cost: bCard.cost,
        power: bCard.power,
        counter: bCard.counter,
        attributes: bCard.attributes,
        types: bCard.types,
        rarity: bCard.rarity,
        effect: bCard.effect,
        trigger: bCard.trigger,
        imageUrl: bCard.imageUrl,
        isAltArt: bCard.isAltArt,
        hasJpPrint: true,
        releaseDate: RELEASE_DATE,
        releaseOrder: RELEASE_ORDER,
        cardNumber: bCard.cardNumber,
        printedSetCode: bCard.printedSetCode,
        originalSet: bCard.originalSet,
        displaySet: SET_CODE,
        yuyuteiSet: SET_CODE,
        printingType,
        ...(matchedYuyu ? {
          yuyuPrice: matchedYuyu.priceYen,
          marketPrice,
          yuyuteiProductId: matchedYuyu.productId,
          yuyuteiVer: matchedYuyu.ver,
          yuyuteiUrl: matchedYuyu.url,
          yuyuteiTitle: matchedYuyu.title,
          yuyuteiRarity: matchedYuyu.rarity,
        } : {}),
      },
      create: {
        id: cardId,
        packId: PACK_ID,
        name: bCard.name,
        category: bCard.category,
        colors: bCard.colors,
        cost: bCard.cost,
        power: bCard.power,
        counter: bCard.counter,
        attributes: bCard.attributes,
        types: bCard.types,
        rarity: bCard.rarity,
        effect: bCard.effect,
        trigger: bCard.trigger,
        imageUrl: bCard.imageUrl,
        isAltArt: bCard.isAltArt,
        hasJpPrint: true,
        releaseDate: RELEASE_DATE,
        releaseOrder: RELEASE_ORDER,
        cardNumber: bCard.cardNumber,
        printedSetCode: bCard.printedSetCode,
        originalSet: bCard.originalSet,
        displaySet: SET_CODE,
        yuyuteiSet: SET_CODE,
        printingType,
        yuyuPrice,
        marketPrice,
        yuyuteiProductId: matchedYuyu ? matchedYuyu.productId : null,
        yuyuteiVer: matchedYuyu ? matchedYuyu.ver : null,
        yuyuteiUrl: matchedYuyu ? matchedYuyu.url : null,
        yuyuteiTitle: matchedYuyu ? matchedYuyu.title : null,
        yuyuteiRarity: matchedYuyu ? matchedYuyu.rarity : null,
      },
    });

    inserted++;
  }

  // Update pack cards count
  const finalCount = await prisma.card.count({ where: { packId: PACK_ID } });
  await prisma.pack.update({
    where: { id: PACK_ID },
    data: { cardsCount: finalCount },
  });

  console.log(`✅ Successfully processed ${inserted} cards for ${SET_CODE} (Pack total: ${finalCount})!`);
  console.log('🎉 EB-05 Ingestion Complete!');
}

ingestEB05().catch(console.error).finally(() => prisma.$disconnect());
