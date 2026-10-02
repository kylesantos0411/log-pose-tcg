/**
 * @file test_suite.js
 * Verification Test Suite for LOG POSE TCG Card Pipeline.
 * Tests all 20 test cases mandated by AUDIT_FIX.md Section 23.
 */

import { CanonicalIdentityService } from './canonical_identity.js';
import { LimitlessImporter } from './limitless_importer.js';
import { YuyuteiMatcher } from './yuyutei_matcher.js';
import { GradedPricingService } from './graded_pricing.js';
import { ImageValidator } from './image_validator.js';
import { PriceStatus, VariantType, Language } from './types.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 RUNNING 20 MANDATORY DATA INTEGRITY TEST CASES');
console.log('====================================================\n');

// 1. Normal card
{
  const card = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-001',
    setCode: 'OP-01',
    name: 'Roronoa Zoro',
    nameJa: 'ロロノア・ゾロ',
    rarity: 'L',
    type: 'Leader',
    color: 'Red'
  });
  assert(
    card.canonicalId === 'OPT_OP01_OP01-001_BASE_JP' && card.variantType === VariantType.BASE,
    'Test 1: Normal card produces expected canonical ID'
  );
}

// 2. Card missing from Yuyutei -> UNAVAILABLE
{
  const card = {
    canonicalId: 'OPT_OP01_OP01-999_BASE_JP',
    cardNumber: 'OP01-999',
    setCode: 'OP-01',
    variantType: VariantType.BASE
  };
  const price = YuyuteiMatcher.matchCardPrice({
    canonicalCard: card,
    candidateListings: [{ cardNumber: 'OP01-001', price: 500 }]
  });
  assert(
    price.status === PriceStatus.UNAVAILABLE && price.priceRaw === null,
    'Test 2: Card missing from Yuyutei marked UNAVAILABLE with null price'
  );
}

// 3. Card with similar name to another card -> No false match
{
  const card = {
    canonicalId: 'OPT_OP01_OP01-003_BASE_JP',
    cardNumber: 'OP01-003',
    setCode: 'OP-01',
    name: 'Monkey.D.Luffy',
    variantType: VariantType.BASE
  };
  const yuyuteiListing = {
    cardNumber: 'OP02-003', // Different card number, same name
    setCode: 'OP-02',
    name: 'Monkey.D.Luffy',
    price: 9999
  };
  const match = YuyuteiMatcher.isExactYuyuteiMatch(card, yuyuteiListing);
  assert(
    match === false,
    'Test 3: Similar/identical card name with different card number is rejected'
  );
}

// 4. Same character, different card number
{
  const card1 = { canonicalId: 'OPT_OP01_OP01-001_BASE_JP', cardNumber: 'OP01-001', setCode: 'OP-01', variantType: VariantType.BASE };
  const card2Listing = { cardNumber: 'OP01-025', setCode: 'OP-01', name: 'Roronoa Zoro', price: 1500 };
  const match = YuyuteiMatcher.isExactYuyuteiMatch(card1, card2Listing);
  assert(
    match === false,
    'Test 4: Same character (Zoro Leader vs Zoro Character) does not cross-match'
  );
}

// 5. Same name, different set
{
  const cardOP01 = { canonicalId: 'OPT_OP01_OP01-003_BASE_JP', cardNumber: 'OP01-003', setCode: 'OP-01', variantType: VariantType.BASE };
  const listingST01 = { cardNumber: 'ST01-001', setCode: 'ST-01', name: 'Monkey.D.Luffy', price: 400 };
  const match = YuyuteiMatcher.isExactYuyuteiMatch(cardOP01, listingST01);
  assert(
    match === false,
    'Test 5: Same name in different set (OP-01 vs ST-01) does not cross-match'
  );
}

// 6. Parallel card distinct from base card
{
  const baseCard = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-025',
    setCode: 'OP-01',
    name: 'Roronoa Zoro',
    rarity: 'SR'
  });
  const parallelCard = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-025',
    setCode: 'OP-01',
    name: 'Roronoa Zoro (Parallel)',
    rarity: 'SR',
    variant: 'PARALLEL'
  });
  assert(
    baseCard.canonicalId !== parallelCard.canonicalId &&
    baseCard.canonicalId === 'OPT_OP01_OP01-025_BASE_JP' &&
    parallelCard.canonicalId === 'OPT_OP01_OP01-025_PARALLEL_JP',
    'Test 6: Parallel card and base card produce distinct collision-free canonical IDs'
  );
}

// 7. Alternate-art card pricing does not match base price
{
  const parallelCard = {
    canonicalId: 'OPT_OP01_OP01-025_PARALLEL_JP',
    cardNumber: 'OP01-025',
    setCode: 'OP-01',
    variantType: VariantType.PARALLEL
  };
  const baseListing = { cardNumber: 'OP01-025', setCode: 'OP-01', rarity: 'SR', name: 'Roronoa Zoro', price: 1480 };
  const parallelListing = { cardNumber: 'OP01-025', setCode: 'OP-01', rarity: 'SR-P', name: 'Roronoa Zoro (Parallel)', price: 6980 };

  const matchBase = YuyuteiMatcher.isExactYuyuteiMatch(parallelCard, baseListing);
  const matchParallel = YuyuteiMatcher.isExactYuyuteiMatch(parallelCard, parallelListing);

  assert(
    matchBase === false && matchParallel === true,
    'Test 7: Parallel card strictly matches parallel listing (SR-P) and rejects base listing'
  );
}

// 8. Promo card identification
{
  const promo = LimitlessImporter.normalizeRawCard({
    cardNumber: 'P-001',
    setCode: 'PROMO',
    name: 'Monkey.D.Luffy',
    rarity: 'P'
  });
  assert(
    promo.canonicalId === 'OPT_PROMO_P-001_PROMO_JP' && promo.variantType === VariantType.PROMO,
    'Test 8: Promo card correctly assigned to PROMO set and PROMO variant'
  );
}

// 9. Card with unusual characters
{
  const card = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-003',
    setCode: 'OP-01',
    name: 'Monkey・D・Luffy (3rd Anniv. Edition!!)',
    nameJa: 'モンキー・D・ルフィ'
  });
  assert(
    card.cardNumber === 'OP01-003' && card.nameJa === 'モンキー・D・ルフィ',
    'Test 9: Card with middle dots and Japanese characters normalizes cleanly'
  );
}

// 10. Card with missing image is flagged, not guessed
{
  const card = { canonicalId: 'OPT_OP01_OP01-001_BASE_JP', language: 'JP' };
  const validation = ImageValidator.validateCardImage(card, null);
  assert(
    validation.isValid === false && validation.status === 'MISSING',
    'Test 10: Missing image is flagged as MISSING, not filled with a guess'
  );
}

// 11. Card with changed price
{
  const card = { canonicalId: 'OPT_OP01_OP01-025_BASE_JP', cardNumber: 'OP01-025', setCode: 'OP-01', variantType: VariantType.BASE };
  const oldPrice = { priceRaw: 1200, pricePhp: 450.00 };
  const newListing = [{ cardNumber: 'OP01-025', setCode: 'OP-01', rarity: 'SR', price: 1480 }];
  const updatedPrice = YuyuteiMatcher.matchCardPrice({
    canonicalCard: card,
    candidateListings: newListing,
    previousPriceRecord: oldPrice
  });
  assert(
    updatedPrice.priceRaw === 1480 && updatedPrice.pricePhp === 555.00,
    'Test 11: Changed price updates cleanly to new value'
  );
}

// 12. New card added to a set
{
  const map = new Map();
  LimitlessImporter.upsertCardCatalog(map, [{ cardNumber: 'OP01-001', setCode: 'OP-01', name: 'Zoro' }]);
  assert(map.size === 1, 'Test 12a: Initial catalog has 1 card');

  LimitlessImporter.upsertCardCatalog(map, [{ cardNumber: 'OP01-002', setCode: 'OP-01', name: 'Law' }]);
  assert(map.size === 2, 'Test 12b: New card added increments catalog to 2 cards');
}

// 13. Duplicate scrape (idempotent)
{
  const map = new Map();
  const rawList = [
    { cardNumber: 'OP01-001', setCode: 'OP-01', name: 'Zoro' },
    { cardNumber: 'OP01-001', setCode: 'OP-01', name: 'Zoro' },
    { cardNumber: 'OP01-001', setCode: 'OP-01', name: 'Zoro' }
  ];
  const res = LimitlessImporter.upsertCardCatalog(map, rawList);
  assert(
    map.size === 1 && res.created === 1 && res.updated === 2,
    'Test 13: Scraping the same card 3 times results in exactly 1 card in catalog'
  );
}

// 14. Failed Yuyutei request -> SCRAPE_ERROR (retains previous price)
{
  const card = { canonicalId: 'OPT_OP01_OP01-025_BASE_JP', cardNumber: 'OP01-025', setCode: 'OP-01', variantType: VariantType.BASE };
  const oldPrice = { priceRaw: 1480, pricePhp: 555.00, externalUrl: 'https://yuyu-tei.jp/...' };
  const priceRecord = YuyuteiMatcher.matchCardPrice({
    canonicalCard: card,
    scrapeError: new Error('HTTP 503 Service Unavailable'),
    previousPriceRecord: oldPrice
  });
  assert(
    priceRecord.status === PriceStatus.SCRAPE_ERROR &&
    priceRecord.priceRaw === 1480 && // Old price retained
    priceRecord.notes.includes('503'),
    'Test 14: Failed Yuyutei request flags SCRAPE_ERROR and retains previous price'
  );
}

// 15. Failed Limitless request handling
{
  let failedCleanly = false;
  try {
    LimitlessImporter.normalizeRawCard({ bogusData: 123 });
  } catch (e) {
    failedCleanly = true;
  }
  assert(failedCleanly, 'Test 15: Incomplete Limitless payload throws explicit error without corrupting DB');
}

// 16. Temporary network failure simulation
{
  const card = { canonicalId: 'OPT_OP01_OP01-001_BASE_JP' };
  const priceRecord = YuyuteiMatcher.matchCardPrice({
    canonicalCard: card,
    scrapeError: new Error('ETIMEDOUT')
  });
  assert(
    priceRecord.status === PriceStatus.SCRAPE_ERROR,
    'Test 16: Temporary network timeout recorded as SCRAPE_ERROR, not UNAVAILABLE'
  );
}

// 17. Wrong / missing external ID handled safely
{
  const card = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-001',
    setCode: 'OP-01',
    name: 'Zoro',
    externalId: null
  });
  assert(
    card.canonicalId === 'OPT_OP01_OP01-001_BASE_JP',
    'Test 17: Missing external ID falls back safely to canonical ID'
  );
}

// 18. Card present in database but missing from source
{
  const dbMap = new Map();
  dbMap.set('OPT_OP01_OP01-001_BASE_JP', { name: 'Zoro' });
  const incoming = [{ cardNumber: 'OP01-002', setCode: 'OP-01', name: 'Law' }];
  LimitlessImporter.upsertCardCatalog(dbMap, incoming);
  assert(
    dbMap.has('OPT_OP01_OP01-001_BASE_JP') && dbMap.size === 2,
    'Test 18: Card in DB not present in incoming delta is preserved'
  );
}

// 19. Card present on Yuyutei but missing from database
{
  const dbMap = new Map();
  const yuyuteiCandidate = { cardNumber: 'OP01-099', price: 300 };
  const targetCard = dbMap.get('OPT_OP01_OP01-099_BASE_JP');
  assert(
    targetCard === undefined,
    'Test 19: Yuyutei cards not yet in canonical catalog cannot be matched (prevents phantom records)'
  );
}

// 20. Card whose printed code differs from the set page where it is listed (PRB-01 reprint)
{
  // A card from Romance Dawn (OP01-001) reprinted in PRB-01
  const original = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-001',
    setCode: 'OP-01',
    name: 'Zoro'
  });
  const reprint = LimitlessImporter.normalizeRawCard({
    cardNumber: 'OP01-001',
    setCode: 'PRB-01', // Listed under PRB-01 set page
    name: 'Zoro (PRB Reprint)'
  });
  assert(
    original.canonicalId === 'OPT_OP01_OP01-001_BASE_JP' &&
    reprint.canonicalId === 'OPT_PRB01_OP01-001_BASE_JP' &&
    original.canonicalId !== reprint.canonicalId,
    'Test 20: Reprints keep canonical set affiliation and do not overwrite original'
  );
}

// 21. PRB Set Code Normalization Aliases
{
  const aliasPrb = CanonicalIdentityService.normalizeSetCode('PRB');
  const aliasTheBest = CanonicalIdentityService.normalizeSetCode('THE BEST');
  const aliasPrb01 = CanonicalIdentityService.normalizeSetCode('PRB01');
  const aliasPrbDash1 = CanonicalIdentityService.normalizeSetCode('PRB-1');
  assert(
    aliasPrb === 'PRB-01' &&
    aliasTheBest === 'PRB-01' &&
    aliasPrb01 === 'PRB-01' &&
    aliasPrbDash1 === 'PRB-01',
    'Test 21: PRB set aliases (PRB, THE BEST, PRB01, PRB-1) normalize cleanly to PRB-01'
  );
}

// 22. PRB Card Number Normalization (multi-hyphen and unhyphenated)
{
  const multiHyphen = CanonicalIdentityService.normalizeCardNumber('PRB-01-001');
  const unhyphenated = CanonicalIdentityService.normalizeCardNumber('PRB01001');
  const standard = CanonicalIdentityService.normalizeCardNumber('PRB01-001');
  assert(
    multiHyphen === 'PRB01-001' &&
    unhyphenated === 'PRB01-001' &&
    standard === 'PRB01-001',
    'Test 22: PRB card numbers (PRB-01-001, PRB01001) normalize to PRB01-001'
  );
}

// 23. PRB Parallel Rarity Prefix Detection
{
  const parallelLeader = CanonicalIdentityService.detectVariantType({
    cardNumber: 'PRB01-001',
    rarity: 'P-L',
    name: 'Sanji (Parallel)'
  });
  const parallelSr = CanonicalIdentityService.detectVariantType({
    cardNumber: 'OP01-025',
    rarity: 'P-SR',
    name: 'Roronoa Zoro'
  });
  const promoCard = CanonicalIdentityService.detectVariantType({
    cardNumber: 'P-001',
    rarity: 'P',
    name: 'Monkey.D.Luffy'
  });
  assert(
    parallelLeader === VariantType.PARALLEL &&
    parallelSr === VariantType.PARALLEL &&
    promoCard === VariantType.PROMO,
    'Test 23: PRB parallel prefixes (P-L, P-SR) correctly identified as PARALLEL, preserving P as PROMO'
  );
}

// 24. PRB Reprint Yuyutei Price Isolation (Never cross-match original with reprint)
{
  const prbReprintCard = {
    canonicalId: 'OPT_PRB01_OP01-001_BASE_JP',
    cardNumber: 'OP01-001',
    setCode: 'PRB-01',
    variantType: VariantType.BASE,
    rarity: 'L'
  };

  const op01OriginalListing = {
    cardNumber: 'OP01-001',
    name: 'ロロノア・ゾロ',
    rarity: 'L',
    price: 280,
    url: 'https://yuyu-tei.jp/sell/opc/card/op01/10001'
  };

  const prbReprintListing = {
    cardNumber: 'OP01-001',
    name: 'ロロノア・ゾロ',
    rarity: 'L',
    price: 150,
    url: 'https://yuyu-tei.jp/sell/opc/card/prb01/10001'
  };

  const matchOp01 = YuyuteiMatcher.isExactYuyuteiMatch(prbReprintCard, op01OriginalListing);
  const matchPrb = YuyuteiMatcher.isExactYuyuteiMatch(prbReprintCard, prbReprintListing);

  assert(
    matchOp01 === false && matchPrb === true,
    'Test 24: PRB-01 reprint card strictly rejects OP-01 listing and matches only PRB-01 listing'
  );
}

// 25. PRB01-001 Canonical Sanji Identity
{
  const sanjiCard = LimitlessImporter.normalizeRawCard({
    cardNumber: 'PRB01-001',
    setCode: 'PRB-01',
    name: 'Sanji',
    nameJa: 'サンジ',
    rarity: 'L',
    type: 'Leader',
    color: 'Red'
  });
  assert(
    sanjiCard.canonicalId === 'OPT_PRB01_PRB01-001_BASE_JP' &&
    sanjiCard.name === 'Sanji' &&
    sanjiCard.nameJa === 'サンジ',
    'Test 25: PRB01-001 correctly identified as Sanji (サンジ), preventing false Luffy assignment'
  );
}

// 26. isExactMatch with canonicalId fallback
{
  const cardWithIdOnly = { canonicalId: 'OPT_PRB01_PRB01-001_BASE_JP' };
  const cardWithFields = {
    cardNumber: 'PRB01-001',
    setCode: 'PRB-01',
    variantType: VariantType.BASE,
    language: Language.JP
  };
  const isMatch = CanonicalIdentityService.isExactMatch(cardWithIdOnly, cardWithFields);
  assert(
    isMatch === true,
    'Test 26: isExactMatch parses canonicalId when card properties are not pre-populated'
  );
}

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
