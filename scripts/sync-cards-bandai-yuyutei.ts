/**
 * sync-cards-bandai-yuyutei.ts
 *
 * Sourcing Architecture:
 * 1. BANDAI ASIA-EN (https://asia-en.onepiece-cardgame.com/cardlist/?series=...)
 *    - Official authority for card images (high-res official scans)
 *    - Official authority for card information: Name, Category, Rarity, Colors,
 *      Cost, Power, Counter, Attributes, Types/Traits, Effect, Trigger, Card Set(s)
 *
 * 2. YUYU-TEI (https://yuyu-tei.jp/sell/opc/s/...)
 *    - Official authority for authentic Japanese market price (yuyuPrice in JPY)
 *    - Availability, Japanese market pricing, and DON!! card variations
 *
 * 3. BINDER PIRATES (https://www.binderpirates.com/)
 *    - Official authority for card printing illustrator attribution
 */

import { PrismaClient } from '@prisma/client';
import { fetchBandaiAsiaCards, BandaiAsiaCard, resolveSeriesId } from '../src/lib/bandai-asia-scraper';
import { fetchIllustratorFromBinderPirates } from '../src/lib/illustrator-service';

const prisma = new PrismaClient();

interface ScrapedYuyuItem {
  code: string;
  rawTitle: string;
  priceYen: number;
  img: string | null;
  rawRarity: string;
  isAltArt: boolean;
  isSuperParallel: boolean;
}

// Convert set code to Yuyu-tei slug and clean string
function getYuyuSetSlug(setCode: string) {
  const clean = setCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const slug = clean.toLowerCase();
  return { clean, slug };
}

// Fetch Yuyu-tei items for pricing and DON!! cards
async function fetchYuyuteiItems(setCode: string): Promise<ScrapedYuyuItem[]> {
  const { clean, slug } = getYuyuSetSlug(setCode);
  const directUrl = `https://yuyu-tei.jp/sell/opc/s/${slug}`;
  console.log(`🌐 Fetching Yuyu-tei prices from: ${directUrl}`);

  let html = '';
  try {
    const res = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch (e: any) {
    console.warn(`Direct fetch failed: ${e.message}`);
  }

  if (!html || !html.includes('class="card-product')) {
    const searchUrl = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(setCode)}`;
    console.log(`🔍 Falling back to Yuyu-tei search: ${searchUrl}`);
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });
    if (searchRes.ok) {
      html = await searchRes.text();
    }
  }

  if (!html) {
    console.warn(`Could not retrieve Yuyu-tei prices for ${setCode}`);
    return [];
  }

  const blocks = html.split('class="card-product');
  const items: ScrapedYuyuItem[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const codeM = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleM = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const priceM = b.match(/([0-9,]+)\s*円/);
    const imgM = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);
    const rarityM =
      b.match(/<span class="d-block text-center border border-dark[^>]*>([\s\S]*?)<\/span>/i) ||
      b.match(/<span class="[^"]*rarity[^"]*">([\s\S]*?)<\/span>/i);

    if (codeM && priceM) {
      const code = codeM[1].trim();
      const rawTitle = titleM ? titleM[1].trim() : '';
      const priceYen = parseInt(priceM[1].replace(/,/g, ''), 10);
      const isAltArt = rawTitle.includes('パラレル') || rawTitle.includes('サイン');
      const isSuperParallel = rawTitle.includes('スーパーパラレル');

      items.push({
        code,
        rawTitle,
        priceYen,
        img: imgM ? imgM[1].replace('/100_140/', '/front/') : null,
        rawRarity: rarityM ? rarityM[1].trim() : '',
        isAltArt,
        isSuperParallel,
      });
    }
  }

  console.log(`  ✓ Found ${items.length} priced items from Yuyu-tei for [${setCode}].`);
  return items;
}

export async function syncCardsForSet(setOrSeries: string, fetchArtists = true) {
  console.log(`\n======================================================================`);
  console.log(`⚓ Starting Synchronizer: Bandai Asia-EN Data + Yuyu-tei Pricing Engine`);
  console.log(`======================================================================`);

  // 1. Scrape Bandai Asia-EN official cards and images
  const { setCode, cards: bandaiCards } = await fetchBandaiAsiaCards(setOrSeries);
  const { clean } = getYuyuSetSlug(setCode);

  // 2. Scrape Yuyu-tei authentic Japanese prices
  const yuyuItems = await fetchYuyuteiItems(setCode);

  // Group Yuyu-tei items by card code
  const yuyuByCode = new Map<string, ScrapedYuyuItem[]>();
  for (const item of yuyuItems) {
    if (!yuyuByCode.has(item.code)) {
      yuyuByCode.set(item.code, []);
    }
    yuyuByCode.get(item.code)!.push(item);
  }

  // Find or create Pack record in DB
  let pack = await prisma.pack.findFirst({
    where: {
      OR: [
        { code: setCode },
        { code: clean },
        { id: clean },
        { id: `569${clean.slice(-3)}` },
        { name: { contains: setCode } },
      ],
    },
  });

  if (!pack) {
    pack = await prisma.pack.create({
      data: {
        id: `pack_${clean}`,
        code: setCode,
        name: `Expansion Pack ${setCode}`,
        seriesType: setCode.startsWith('ST-') ? 'STARTER DECK' : setCode.startsWith('EB-') ? 'EXTRA BOOSTER' : 'BOOSTER PACK',
      },
    });
  }

  let updatedCards = 0;
  let createdCards = 0;
  let artistEnriched = 0;

  // Process all Bandai Asia-EN cards
  for (const bCard of bandaiCards) {
    // Match with Yuyu-tei price
    const yuyuCandidates = yuyuByCode.get(bCard.cardNumber) || [];
    let matchedYuyu: ScrapedYuyuItem | null = null;

    if (yuyuCandidates.length === 1) {
      matchedYuyu = yuyuCandidates[0];
    } else if (yuyuCandidates.length > 1) {
      if (bCard.printingType === 'Super Parallel') {
        matchedYuyu = yuyuCandidates.find(c => c.isSuperParallel) || null;
      }
      if (!matchedYuyu) {
        if (bCard.isAltArt) {
          // Strict: only match alt art
          matchedYuyu = yuyuCandidates.find(c => c.isAltArt && !c.isSuperParallel) || null;
        } else {
          // Strict: only match base
          matchedYuyu = yuyuCandidates.find(c => !c.isAltArt && !c.isSuperParallel) || null;
        }
      }
    }

    const yuyuPrice = matchedYuyu ? matchedYuyu.priceYen : existingCard?.yuyuPrice || null;
    const marketPriceUsd = yuyuPrice ? Math.round((yuyuPrice / 140) * 100) / 100 : existingCard?.marketPrice || null;

    // Check if card exists in DB (by id or by packId + cardNumber + isAltArt)
    let existingCard = await prisma.card.findUnique({
      where: { id: bCard.id },
    });

    if (!existingCard) {
      existingCard = await prisma.card.findFirst({
        where: {
          packId: pack.id,
          cardNumber: bCard.cardNumber,
          isAltArt: bCard.isAltArt,
        },
      });
    }

    // Artist lookup if missing
    let artistName = existingCard?.artistName || null;
    let artistSource = existingCard?.artistSource || null;
    let artistSourceUrl = existingCard?.artistSourceUrl || null;
    let artistVerificationStatus = existingCard?.artistVerificationStatus || 'missing';

    if (fetchArtists && (!artistName || artistVerificationStatus === 'missing') && bCard.cardNumber !== '-') {
      try {
        const variantSuffix = bCard.isAltArt ? (bCard.id.split('_')[1] || 'p1') : undefined;
        const artRes = await fetchIllustratorFromBinderPirates(bCard.cardNumber, variantSuffix);
        if (artRes.artistName) {
          artistName = artRes.artistName;
          artistSource = artRes.artistSource;
          artistSourceUrl = artRes.artistSourceUrl;
          artistVerificationStatus = artRes.artistVerificationStatus;
          artistEnriched++;
        }
      } catch (err: any) {
        // Continue silently
      }
    }

    const cardPayload = {
      packId: pack.id,
      name: bCard.name,
      category: bCard.category,
      colors: bCard.colors || 'Red',
      cost: bCard.cost,
      power: bCard.power,
      counter: bCard.counter,
      attributes: bCard.attributes,
      types: bCard.types,
      rarity: bCard.rarity,
      effect: bCard.effect,
      trigger: bCard.trigger,
      imageUrl: bCard.imageUrl, // Official Bandai Asia-EN high-res image
      isAltArt: bCard.isAltArt,
      yuyuPrice: yuyuPrice || existingCard?.yuyuPrice,
      marketPrice: marketPriceUsd || existingCard?.marketPrice,
      hasJpPrint: true,
      cardNumber: bCard.cardNumber,
      printedSetCode: bCard.printedSetCode,
      originalSet: bCard.originalSet,
      yuyuteiSet: setCode,
      displaySet: setCode,
      printingType: bCard.printingType,
      artistName,
      artistSource,
      artistSourceUrl,
      artistVerificationStatus,
    };

    if (existingCard) {
      await prisma.card.update({
        where: { id: existingCard.id },
        data: cardPayload,
      });
      updatedCards++;
    } else {
      await prisma.card.create({
        data: {
          id: bCard.id,
          ...cardPayload,
        },
      });
      createdCards++;
    }
  }

  // Also preserve DON!! cards from Yuyu-tei under this set
  const donCards = yuyuItems.filter(item => item.code === '-' || item.code.includes('DON') || item.rawTitle.includes('ドン!!'));
  let donCount = 0;
  for (let idx = 0; idx < donCards.length; idx++) {
    const don = donCards[idx];
    const donId = `${clean}_DON_${idx + 1}`;
    const existingDon = await prisma.card.findFirst({
      where: {
        packId: pack.id,
        category: 'DON!!',
        OR: [
          { id: donId },
          { name: don.rawTitle },
        ],
      },
    });

    const donPayload = {
      packId: pack.id,
      name: don.rawTitle,
      category: 'DON!!',
      colors: 'Colorless',
      rarity: '-',
      imageUrl: don.img || 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/DON.png',
      yuyuPrice: don.priceYen,
      marketPrice: Math.round((don.priceYen / 140) * 100) / 100,
      cardNumber: '-',
      printedSetCode: 'DON',
      originalSet: 'DON',
      yuyuteiSet: setCode,
      displaySet: setCode,
      printingType: don.isSuperParallel ? 'Super Parallel' : don.isAltArt ? 'Parallel' : 'Original',
      isAltArt: don.isAltArt,
      hasJpPrint: true,
    };

    if (existingDon) {
      await prisma.card.update({
        where: { id: existingDon.id },
        data: donPayload,
      });
    } else {
      await prisma.card.create({
        data: {
          id: donId,
          ...donPayload,
        },
      });
    }
    donCount++;
  }

  // Update pack total card count
  const totalInPack = await prisma.card.count({ where: { packId: pack.id } });
  await prisma.pack.update({
    where: { id: pack.id },
    data: { cardsCount: totalInPack },
  });

  console.log(`\n======================================================================`);
  console.log(`✅ [${setCode}] Synchronization Successfully Finished:`);
  console.log(`   - Official Bandai Asia-EN Cards Processed: ${bandaiCards.length}`);
  console.log(`   - Yuyu-tei DON!! Cards Processed: ${donCount}`);
  console.log(`   - DB Cards Updated: ${updatedCards} | Created: ${createdCards}`);
  console.log(`   - Total Cards in [${setCode}]: ${totalInPack}`);
  console.log(`   - Illustrators Enriched: ${artistEnriched}`);
  console.log(`======================================================================\n`);
}

async function main() {
  const target = process.argv[2] || 'OP-17';
  await syncCardsForSet(target);
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Synchronization failed:', err);
    process.exit(1);
  });
}
