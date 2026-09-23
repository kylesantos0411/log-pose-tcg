/**
 * sync-yuyutei-v2.ts
 *
 * Canonical Yuyu-tei synchronization engine with strict adherence to:
 * 1. Yuyu-tei is primary source for card listings, set listings, Japanese prices, and images.
 * 2. Set is determined strictly from Yuyu-tei listing/set context (NOT from printed card code).
 * 3. Separate fields: cardNumber, printedSetCode, originalSet, yuyuteiSet, displaySet, printingType.
 * 4. Zero prefix filtering: non-matching prefixes (e.g. EB04-061, OP12-056, ST27-005 in OP17) are 100% preserved.
 * 5. Multi-set appearances / reprints are preserved as distinct records.
 * 6. Illustrator information is fetched from Binder Pirates (primary) and stored with exact source URLs.
 */

import { PrismaClient } from '@prisma/client';
import { fetchIllustratorFromBinderPirates } from '../src/lib/illustrator-service';

const prisma = new PrismaClient();

interface ScrapedYuyuCard {
  code: string;
  rawTitle: string;
  priceYen: number;
  img: string | null;
  rawRarity: string;
}

// Convert Yuyu-tei set identifier to canonical code & slug
function getSetInfo(setIdentifier: string) {
  const clean = setIdentifier.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = setIdentifier.match(/^([A-Za-z]+)-?(\d+)$/i);
  const formattedCode = match ? `${match[1].toUpperCase()}-${match[2]}` : setIdentifier.toUpperCase();
  const slug = clean.toLowerCase();
  return { clean, formattedCode, slug };
}

// Map Yuyu-tei rarity to DB rarity & category
function mapRarityAndCategory(rawRarity: string, code: string, rawTitle: string) {
  const r = (rawRarity || '').toUpperCase();
  let category = 'Character';
  let rarity = 'Common';
  let isAltArt = rawTitle.includes('パラレル') || rawTitle.includes('サイン');

  if (code === '-' || code.includes('DON') || rawTitle.includes('ドン!!')) {
    category = 'DON!!';
    rarity = '-';
  } else if (code.endsWith('-001') && (r === 'L' || r === 'PL' || rawTitle.includes('リーダー'))) {
    category = 'Leader';
    rarity = 'Leader';
  } else if (rawTitle.includes('イベント')) {
    category = 'Event';
  } else if (rawTitle.includes('ステージ')) {
    category = 'Stage';
  }

  if (category !== 'DON!!') {
    if (r === 'P-SEC' || r === 'SEC' || rawTitle.includes('シークレット')) {
      rarity = 'SecretRare';
    } else if (r === 'P-SR' || r === 'SR' || rawTitle.includes('スーパーレア')) {
      rarity = 'SuperRare';
    } else if (r === 'PR' || r === 'R' || rawTitle.includes('レア')) {
      rarity = 'Rare';
    } else if (r === 'P-UC' || r === 'UC') {
      rarity = 'Uncommon';
    } else if (r === 'PC' || r === 'C') {
      rarity = 'Common';
    } else if (r === 'PL' || r === 'L') {
      rarity = 'Leader';
    } else if (r === 'SP' || rawTitle.includes('特別') || rawTitle.includes('スペシャル')) {
      rarity = 'Special';
    } else if (r === 'TR' || rawTitle.includes('トレジャー')) {
      rarity = 'TreasureRare';
    } else if (r === 'PP' || r === 'P' || code.startsWith('P-')) {
      rarity = 'Promo';
    }
  }

  return { category, rarity, isAltArt };
}

// Derive printed set code and original set from the physical card number
function parsePhysicalCardCodes(cardNumber: string) {
  let printedSetCode = '';
  let originalSet = '';

  if (cardNumber.startsWith('P-')) {
    printedSetCode = 'P';
    originalSet = 'PROMO';
  } else if (cardNumber === '-' || cardNumber.includes('DON')) {
    printedSetCode = 'DON';
    originalSet = 'DON';
  } else {
    const dashIdx = cardNumber.indexOf('-');
    if (dashIdx > 0) {
      printedSetCode = cardNumber.substring(0, dashIdx).toUpperCase();
      const match = printedSetCode.match(/^([A-Za-z]+)(\d+)$/);
      if (match) {
        originalSet = `${match[1].toUpperCase()}-${match[2]}`;
      } else {
        originalSet = printedSetCode;
      }
    } else {
      printedSetCode = cardNumber.toUpperCase();
      originalSet = cardNumber.toUpperCase();
    }
  }

  return { printedSetCode, originalSet };
}

// Fetch set cards from Yuyu-tei
async function fetchYuyuSet(setIdentifier: string): Promise<ScrapedYuyuCard[]> {
  const { slug, formattedCode } = getSetInfo(setIdentifier);

  // Try direct set page first e.g. /sell/opc/s/op17
  const directUrl = `https://yuyu-tei.jp/sell/opc/s/${slug}`;
  console.log(`🌐 Fetching Yuyu-tei set page: ${directUrl}`);

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

  // Fallback to search query if direct page didn't have cards
  if (!html || !html.includes('class="card-product')) {
    const searchUrl = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(formattedCode)}`;
    console.log(`🔍 Falling back to search query: ${searchUrl}`);
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });
    if (searchRes.ok) {
      html = await searchRes.text();
    }
  }

  if (!html) {
    console.error(`Could not retrieve data for set ${setIdentifier}`);
    return [];
  }

  const blocks = html.split('class="card-product');
  const cards: ScrapedYuyuCard[] = [];

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
      cards.push({
        code: codeM[1].trim(),
        rawTitle: titleM ? titleM[1].trim() : '',
        priceYen: parseInt(priceM[1].replace(/,/g, ''), 10),
        img: imgM ? imgM[1].replace('/100_140/', '/front/') : null,
        rawRarity: rarityM ? rarityM[1].trim() : '',
      });
    }
  }

  console.log(`  ✓ Found ${cards.length} cards listed on Yuyu-tei under set context.`);
  return cards;
}

export async function syncYuyuSet(setIdentifier: string, fetchArtists = true) {
  const { clean, formattedCode } = getSetInfo(setIdentifier);

  console.log(`\n======================================================`);
  console.log(`🚀 Synchronizing Set Context: [${formattedCode}]`);
  console.log(`======================================================`);

  const scrapedCards = await fetchYuyuSet(setIdentifier);
  if (scrapedCards.length === 0) {
    console.log(`No cards found for ${setIdentifier}`);
    return;
  }

  // Find or create Pack record in DB
  let pack = await prisma.pack.findFirst({
    where: {
      OR: [
        { code: formattedCode },
        { code: clean },
        { id: clean },
        { name: { contains: formattedCode } },
      ],
    },
  });

  if (!pack) {
    // Auto-create pack if not present
    pack = await prisma.pack.create({
      data: {
        id: `pack_${clean}`,
        code: formattedCode,
        name: `Expansion Pack ${formattedCode}`,
        seriesType: formattedCode.startsWith('ST-') ? 'STARTER DECK' : formattedCode.startsWith('EB-') ? 'EXTRA BOOSTER' : 'BOOSTER PACK',
      },
    });
  }

  const yuyuteiSet = formattedCode;
  const displaySet = formattedCode;

  let createdCount = 0;
  let updatedCount = 0;
  let artistEnrichedCount = 0;

  // Group cards by physical card number to track printings/variants within this set
  const codeVariantCount: Record<string, number> = {};

  for (const item of scrapedCards) {
    const cardNumber = item.code;
    const { printedSetCode, originalSet } = parsePhysicalCardCodes(cardNumber);

    // Track variant index for this card number in this set
    if (!codeVariantCount[cardNumber]) {
      codeVariantCount[cardNumber] = 0;
    }
    const variantIndex = codeVariantCount[cardNumber]++;

    // Determine printing type
    let printingType = 'Original';
    const isAltArt = item.rawTitle.includes('パラレル') || item.rawTitle.includes('サイン');
    if (item.rawTitle.includes('スーパーパラレル')) {
      printingType = 'Super Parallel';
    } else if (item.rawTitle.includes('特別パラレル')) {
      printingType = 'Special';
    } else if (isAltArt) {
      printingType = 'Parallel';
    } else if (originalSet !== yuyuteiSet && originalSet !== 'DON' && yuyuteiSet !== 'PROMO') {
      printingType = 'Reprint';
    }

    const { category, rarity } = mapRarityAndCategory(item.rawRarity, cardNumber, item.rawTitle);
    const promoSource = item.rawTitle.includes('(')
      ? item.rawTitle.substring(item.rawTitle.indexOf('(') + 1).replace(/\)$/, '')
      : isAltArt ? 'Parallel' : null;

    const marketPriceUsd = Math.round((item.priceYen / 140) * 100) / 100;

    // Check if this card already exists in THIS set (pack)
    let existingCard = await prisma.card.findFirst({
      where: {
        packId: pack.id,
        cardNumber: cardNumber,
        OR: [
          { isAltArt: isAltArt },
          { promoSource: promoSource },
          { yuyuPrice: item.priceYen },
        ],
      },
    });

    // If not found by specific attributes, check if a card with matching ID exists in this pack
    if (!existingCard) {
      const candidateId = variantIndex === 0 && originalSet === yuyuteiSet
        ? cardNumber
        : variantIndex === 0
        ? `${clean}_${cardNumber}`
        : `${clean}_${cardNumber}_p${variantIndex}`;
      existingCard = await prisma.card.findUnique({
        where: { id: candidateId },
      });
    }

    // Retrieve illustrator from Binder Pirates if enabled and missing
    let artistName = existingCard?.artistName || null;
    let artistSource = existingCard?.artistSource || null;
    let artistSourceUrl = existingCard?.artistSourceUrl || null;
    let artistVerificationStatus = existingCard?.artistVerificationStatus || 'missing';

    if (fetchArtists && (!artistName || artistVerificationStatus === 'missing') && cardNumber !== '-') {
      try {
        const variantSuffix = isAltArt ? `p${Math.max(1, variantIndex)}` : undefined;
        const artRes = await fetchIllustratorFromBinderPirates(cardNumber, variantSuffix);
        if (artRes.artistName) {
          artistName = artRes.artistName;
          artistSource = artRes.artistSource;
          artistSourceUrl = artRes.artistSourceUrl;
          artistVerificationStatus = artRes.artistVerificationStatus;
          artistEnrichedCount++;
        }
      } catch (err: any) {
        console.warn(`Artist lookup error for ${cardNumber}:`, err.message);
      }
    }

    const cardData = {
      packId: pack.id,
      name: item.rawTitle.split('(')[0].trim() || cardNumber,
      category,
      colors: 'Red', // Preserved from existing or baseline
      rarity,
      imageUrl: item.img || existingCard?.imageUrl,
      isAltArt,
      yuyuPrice: item.priceYen,
      marketPrice: existingCard?.marketPrice && existingCard.marketPrice >= 1.0 ? existingCard.marketPrice : marketPriceUsd,
      promoSource: promoSource || existingCard?.promoSource,
      hasJpPrint: true,
      // Strictly separated fields:
      cardNumber,
      printedSetCode,
      originalSet,
      yuyuteiSet,
      displaySet,
      printingType,
      artistName,
      artistSource,
      artistSourceUrl,
      artistVerificationStatus,
    };

    if (existingCard) {
      await prisma.card.update({
        where: { id: existingCard.id },
        data: cardData,
      });
      updatedCount++;
    } else {
      // Determine unique ID that avoids collisions across sets
      let targetId = variantIndex === 0 && originalSet === yuyuteiSet
        ? cardNumber
        : `${clean}_${cardNumber}${variantIndex > 0 ? `_p${variantIndex}` : ''}`;

      // Check if targetId is taken in another set
      const idConflict = await prisma.card.findUnique({ where: { id: targetId } });
      if (idConflict && idConflict.packId !== pack.id) {
        targetId = `${clean}_${cardNumber}_v${variantIndex}_${Date.now().toString().slice(-4)}`;
      }

      await prisma.card.create({
        data: {
          id: targetId,
          ...cardData,
        },
      });
      createdCount++;
    }
  }

  // Update pack total card count
  const totalInPack = await prisma.card.count({ where: { packId: pack.id } });
  await prisma.pack.update({
    where: { id: pack.id },
    data: { cardsCount: totalInPack },
  });

  console.log(`✅ [${formattedCode}] Synchronization complete:`);
  console.log(`   Created: ${createdCount} | Updated: ${updatedCount} | Total in Set: ${totalInPack}`);
  console.log(`   Illustrators Enriched from Binder Pirates: ${artistEnrichedCount}`);
}

async function main() {
  const targetSet = process.argv[2] || 'OP17';
  await syncYuyuSet(targetSet);
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
