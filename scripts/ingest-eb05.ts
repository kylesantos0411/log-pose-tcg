import { PrismaClient } from '@prisma/client';
import { fetchBandaiAsiaCards } from '../src/lib/bandai-asia-scraper';
import { scrapeYuyuteiSet } from '../src/lib/yuyu-scraper';
import fs from 'fs';
import path from 'path';

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
  let updated = 0;
  const simRuleEntries: Record<string, any> = {};

  for (const bCard of bandaiResult.cards) {
    // Determine card ID format
    const cardId = bCard.id;
    const baseCardNumber = bCard.cardNumber;

    // Check matching Yuyutei product
    const yuyuList = yuyuByCardNumber.get(baseCardNumber) || [];
    let matchedYuyu: (typeof yuyuProducts)[0] | undefined;

    if (bCard.isAltArt) {
      // Find parallel variant in Yuyu
      matchedYuyu = yuyuList.find(y => y.isAltArt || y.rarity.startsWith('P-') || y.rarity === 'SP' || y.title.includes('パラレル'));
    } else {
      // Base non-parallel
      matchedYuyu = yuyuList.find(y => !y.isAltArt && !y.rarity.startsWith('P-') && !y.rarity.includes('SP') && !y.title.includes('パラレル'));
    }

    // If still unmatched and there's only 1 item for this card number, use it
    if (!matchedYuyu && yuyuList.length === 1) {
      matchedYuyu = yuyuList[0];
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
        printingType: bCard.printingType,
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
        printingType: bCard.printingType,
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

    // Prepare simulator rules entry
    if (!simRuleEntries[baseCardNumber]) {
      simRuleEntries[baseCardNumber] = {
        counter: bCard.counter,
        effect: bCard.effect || '-',
        trigger: bCard.trigger || null,
        types: bCard.types || null,
        attributes: bCard.attributes || null,
      };
    }
  }

  // Update pack cards count
  const finalCount = await prisma.card.count({ where: { packId: PACK_ID } });
  await prisma.pack.update({
    where: { id: PACK_ID },
    data: { cardsCount: finalCount },
  });

  console.log(`✅ Successfully processed ${inserted} cards for ${SET_CODE} (Pack total: ${finalCount})!`);

  // 5. Update card-rules-db.json for the TCG Battle Simulator
  console.log(`⚔️ Updating card-rules-db.json for simulator support...`);
  const rulesDbPath = path.join(__dirname, '../src/lib/sim/card-rules-db.json');
  if (fs.existsSync(rulesDbPath)) {
    const currentRules = JSON.parse(fs.readFileSync(rulesDbPath, 'utf8'));
    let addedRules = 0;
    for (const [code, rule] of Object.entries(simRuleEntries)) {
      if (!currentRules[code]) {
        currentRules[code] = rule;
        addedRules++;
      }
    }
    fs.writeFileSync(rulesDbPath, JSON.stringify(currentRules));
    console.log(`✓ Added ${addedRules} new card rule definitions to card-rules-db.json.`);
  }

  console.log('🎉 EB-05 Ingestion Complete!');
}

ingestEB05().catch(console.error).finally(() => prisma.$disconnect());
