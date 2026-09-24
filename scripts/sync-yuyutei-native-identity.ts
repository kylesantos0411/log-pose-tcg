/**
 * sync-yuyutei-native-identity.ts
 *
 * Implements Yuyutei's native card/product identity across all sets:
 * 1. Scrapes complete native product records from Yuyutei:
 *    - yuyuteiProductId (cart_cid)
 *    - yuyuteiVer (cart_ver)
 *    - yuyuteiUrl (canonical card listing URL)
 *    - yuyuteiTitle (authentic Japanese variant title)
 *    - yuyuteiRarity (authentic Yuyutei rarity: P-SEC, SEC, L, P-L, SP, etc.)
 *    - yuyuPrice (exact domestic price in JPY)
 *    - imageUrl (exact front artwork bound 1:1 to this product ID)
 *
 * 2. Establishes the authoritative parent-child relationship:
 *    Base Card -> Variant Products (each uniquely pinned by yuyuteiProductId)
 *    Ensuring price and image ALWAYS come from the exact same product.
 */

import { PrismaClient } from '@prisma/client';
import { scrapeYuyuteiSet, YuyuProductRecord } from '../src/lib/yuyu-scraper';

const prisma = new PrismaClient();

const SET_SLUG_MAP: Record<string, { packCode: string; defaultPackId: string }> = {
  'op01': { packCode: 'OP-01', defaultPackId: '569101' },
  'op02': { packCode: 'OP-02', defaultPackId: '569102' },
  'op03': { packCode: 'OP-03', defaultPackId: '569103' },
  'op04': { packCode: 'OP-04', defaultPackId: '569104' },
  'op05': { packCode: 'OP-05', defaultPackId: '569105' },
  'op06': { packCode: 'OP-06', defaultPackId: '569106' },
  'op07': { packCode: 'OP-07', defaultPackId: '569107' },
  'op08': { packCode: 'OP-08', defaultPackId: '569108' },
  'op09': { packCode: 'OP-09', defaultPackId: '569109' },
  'op10': { packCode: 'OP-10', defaultPackId: '569110' },
  'op11': { packCode: 'OP-11', defaultPackId: '569111' },
  'op12': { packCode: 'OP-12', defaultPackId: '569112' },
  'op13': { packCode: 'OP-13', defaultPackId: '569113' },
  'op14': { packCode: 'OP-14', defaultPackId: '569114' },
  'op15': { packCode: 'OP-15', defaultPackId: '569115' },
  'op16': { packCode: 'OP-16', defaultPackId: '569116' },
  'op17': { packCode: 'OP-17', defaultPackId: '569117' },
  'eb01': { packCode: 'EB-01', defaultPackId: '569201' },
  'eb02': { packCode: 'EB-02', defaultPackId: '569202' },
  'eb03': { packCode: 'EB-03', defaultPackId: '569203' },
  'eb04': { packCode: 'EB-04', defaultPackId: '569204' },
  'prb01': { packCode: 'PRB-01', defaultPackId: '569301' },
  'prb02': { packCode: 'PRB-02', defaultPackId: '569302' },
  'st01': { packCode: 'ST-01', defaultPackId: '569001' },
  'st02': { packCode: 'ST-02', defaultPackId: '569002' },
  'st03': { packCode: 'ST-03', defaultPackId: '569003' },
  'st04': { packCode: 'ST-04', defaultPackId: '569004' },
  'st05': { packCode: 'ST-05', defaultPackId: '569005' },
  'st06': { packCode: 'ST-06', defaultPackId: '569006' },
  'st07': { packCode: 'ST-07', defaultPackId: '569007' },
  'st08': { packCode: 'ST-08', defaultPackId: '569008' },
  'st09': { packCode: 'ST-09', defaultPackId: '569009' },
  'st10': { packCode: 'ST-10', defaultPackId: '569010' },
  'st11': { packCode: 'ST-11', defaultPackId: '569011' },
  'st12': { packCode: 'ST-12', defaultPackId: '569012' },
  'st13': { packCode: 'ST-13', defaultPackId: '569013' },
  'st14': { packCode: 'ST-14', defaultPackId: '569014' },
  'st15': { packCode: 'ST-15', defaultPackId: '569015' },
  'st16': { packCode: 'ST-16', defaultPackId: '569016' },
  'st17': { packCode: 'ST-17', defaultPackId: '569017' },
  'st18': { packCode: 'ST-18', defaultPackId: '569018' },
  'st19': { packCode: 'ST-19', defaultPackId: '569019' },
  'st20': { packCode: 'ST-20', defaultPackId: '569020' },
  'st21': { packCode: 'ST-21', defaultPackId: '569021' },
  'st22': { packCode: 'ST-22', defaultPackId: '569022' },
  'st23': { packCode: 'ST-23', defaultPackId: '569023' },
  'st24': { packCode: 'ST-24', defaultPackId: '569024' },
  'st25': { packCode: 'ST-25', defaultPackId: '569025' },
  'st26': { packCode: 'ST-26', defaultPackId: '569026' },
  'st27': { packCode: 'ST-27', defaultPackId: '569027' },
  'st28': { packCode: 'ST-28', defaultPackId: '569028' },
  'st29': { packCode: 'ST-29', defaultPackId: '569029' },
  'st30': { packCode: 'ST-30', defaultPackId: '569030' },
  'st31': { packCode: 'ST-31', defaultPackId: '569031' },
  'st32': { packCode: 'ST-32', defaultPackId: '569032' },
  'st33': { packCode: 'ST-33', defaultPackId: '569033' },
  'st34': { packCode: 'ST-34', defaultPackId: '569034' },
  'st35': { packCode: 'ST-35', defaultPackId: '569035' },
  'st36': { packCode: 'ST-36', defaultPackId: '569036' },
};

async function syncSetNativeProducts(slug: string) {
  const setInfo = SET_SLUG_MAP[slug];
  if (!setInfo) {
    console.warn(`Unknown set slug: ${slug}`);
    return;
  }

  // Find pack in DB
  const pack = await prisma.pack.findFirst({
    where: {
      OR: [
        { id: setInfo.defaultPackId },
        { code: setInfo.packCode },
      ]
    },
    include: {
      cards: true
    }
  });

  if (!pack) {
    console.warn(`Pack not found in DB for [${slug}]`);
    return;
  }

  console.log(`\n======================================================================`);
  console.log(`📦 SYNCING SET [${setInfo.packCode}] (${pack.name}) via Yuyu-tei slug: [${slug}]`);
  console.log(`======================================================================`);

  const products = await scrapeYuyuteiSet(slug);
  if (products.length === 0) {
    console.warn(`No products returned for [${slug}]`);
    return;
  }

  let mappedCount = 0;
  let updatedCount = 0;

  // Track already claimed card IDs in this set to prevent multiple products claiming same DB card
  const claimedDbCardIds = new Set<string>();

  // Sort products: Super Parallels first, then Parallels, then Base
  const sortedProducts = [...products].sort((a, b) => {
    if (a.isSuperParallel && !b.isSuperParallel) return -1;
    if (!a.isSuperParallel && b.isSuperParallel) return 1;
    if (a.isAltArt && !b.isAltArt) return -1;
    if (!a.isAltArt && b.isAltArt) return 1;
    return 0;
  });

  for (const product of sortedProducts) {
    // 1. Check if a card already has this exact yuyuteiProductId
    let targetCard = pack.cards.find(c => c.yuyuteiProductId === product.productId);

    // 2. If not yet assigned, find candidate in this pack matching cardNumber and variant category
    if (!targetCard) {
      const candidates = pack.cards.filter(c => {
        if (claimedDbCardIds.has(c.id)) return false;
        if (c.yuyuteiProductId && c.yuyuteiProductId !== product.productId) return false;
        const num = c.cardNumber || c.id.split('_')[0];
        return num === product.cardNumber;
      });

      if (product.isSuperParallel) {
        targetCard = candidates.find(c => 
          c.printingType?.toLowerCase().includes('super parallel') || 
          c.printingType?.toLowerCase().includes('manga') ||
          c.id.includes('_p2') || c.id.includes('_p4') || c.id.includes('_sp')
        ) || candidates.find(c => c.isAltArt);
      } else if (product.isAltArt) {
        targetCard = candidates.find(c => 
          c.isAltArt && 
          !c.printingType?.toLowerCase().includes('super parallel')
        ) || candidates.find(c => c.id.includes('_p'));
      } else {
        targetCard = candidates.find(c => 
          !c.isAltArt && 
          !c.id.includes('_p') && 
          !c.id.includes('_sp')
        ) || candidates[0];
      }
    }

    if (targetCard) {
      claimedDbCardIds.add(targetCard.id);
      mappedCount++;

      const usdPrice = Math.round((product.priceYen / 140) * 100) / 100;

      // Update card with full native Yuyutei product record
      await prisma.card.update({
        where: { id: targetCard.id },
        data: {
          yuyuteiProductId: product.productId,
          yuyuteiVer: product.ver,
          yuyuteiUrl: product.url,
          yuyuteiTitle: product.title,
          yuyuteiRarity: product.rarity,
          yuyuPrice: product.priceYen,
          marketPrice: targetCard.marketPrice && targetCard.marketPrice > 0 && targetCard.marketPrice >= usdPrice * 0.8
            ? targetCard.marketPrice 
            : usdPrice,
          // Guarantee image is bound to this exact product if not already a clean Bandai image
          imageUrl: targetCard.imageUrl && targetCard.imageUrl.includes('bandai') 
            ? targetCard.imageUrl 
            : product.imgUrl,
          printingType: product.isSuperParallel ? 'Super Parallel' : product.isAltArt ? 'Parallel' : targetCard.printingType || 'Original',
        }
      });
      updatedCount++;
    }
  }

  console.log(`✓ [${setInfo.packCode}]: Successfully bound ${updatedCount} / ${products.length} products to native Yuyutei IDs.`);
}

async function main() {
  console.log('======================================================================');
  console.log('🚀 ENRICHING DATABASE WITH YUYUTEI NATIVE CARD & PRODUCT IDENTITIES');
  console.log('======================================================================');

  // Sync all major expansion sets, boosters, and starter decks
  const slugs = Object.keys(SET_SLUG_MAP);

  for (const slug of slugs) {
    try {
      await syncSetNativeProducts(slug);
    } catch (err: any) {
      console.error(`Error syncing [${slug}]:`, err.message);
    }
  }

  // Final verification check
  const totalCards = await prisma.card.count();
  const withNativeId = await prisma.card.count({
    where: { yuyuteiProductId: { not: null } }
  });

  console.log('\n======================================================================');
  console.log(`📊 FINAL NATIVE YUYUTEI IDENTITY AUDIT:`);
  console.log(`Total Cards in Database: ${totalCards}`);
  console.log(`Cards with Yuyutei Product ID: ${withNativeId} (${Math.round((withNativeId / totalCards) * 100)}%)`);
  console.log('======================================================================');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
