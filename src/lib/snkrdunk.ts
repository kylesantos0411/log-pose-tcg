/**
 * SNKRDUNK Market & Graded Pricing Client
 *
 * Rules:
 * 1. RAW CARD PRICE:
 *    - Match exact card/product on SNKRDUNK.
 *    - Only use RAW cards with condition/grade A ("A（きれいな状態）" / NearlyUnused).
 *    - Ignore B, C, D and other raw conditions.
 *    - Ignore all graded cards.
 *    - Lowest active A-grade listing price.
 * 2. ALL GRADED CARD PRICES MUST COME EXCLUSIVELY FROM SNKRDUNK:
 *    - PSA: Lowest active listing for exact PSA grade (PSA 10, PSA 9, PSA 8).
 *    - BGS: Lowest active listing for exact BGS grade (BGS 10 BL/GL, BGS 9.5).
 *    - ARS: Lowest active listing for exact ARS grade (ARS 10+, ARS 10, ARS 9).
 *    - CGC / Other: Lowest active listing.
 * 3. NO DATA FALLBACK:
 *    - If no matching active listing exists, return null / unavailable.
 *    - Never substitute grades or conditions.
 */

export interface SnkrdunkApparel {
  id: number;
  name: string;
  localizedName: string;
  minPrice: number;
  productNumber?: string;
  imageUrl?: string;
}

export interface SnkrdunkPricing {
  apparelId: number;
  productNumber: string;
  apparelName: string;
  url: string;
  // Raw Market (Condition A only, lowest active)
  rawA: number | null; // JPY
  // Graded Market (Lowest active for each company and grade)
  psa10: number | null;
  psa9: number | null;
  psa8: number | null;
  bgs10: number | null;
  bgs95: number | null;
  ars10plus: number | null;
  ars10: number | null;
  ars9: number | null;
  cgc10: number | null;
  activeListingsCount: number;
  updatedAt: string;
}

// In-memory cache for fast lookups and rate-limiting prevention
const pricingCache = new Map<string, { data: SnkrdunkPricing; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

export function matchCardToApparel(card: any, apparels: SnkrdunkApparel[]): SnkrdunkApparel | null {
  if (!apparels || apparels.length === 0) return null;

  // Filter out foreign languages unless matching foreign-only card
  let candidates = apparels.filter((a) => {
    const loc = a.localizedName || a.name || '';
    const n = a.name || '';
    const isEn = loc.includes('【英語版】') || n.includes('[EN]');
    const isCn = loc.includes('【中国語版】') || n.includes('[CN]');
    const isAsia = loc.includes('【アジア版】') || n.includes('[Aisa ver.]');
    if (card.hasJpPrint === false) {
      return isEn;
    }
    return !isEn && !isCn && !isAsia;
  });

  if (candidates.length === 0) candidates = apparels;

  const cardNum = (card.cardNumber || card.card_number || card.id.split('_')[0]).toUpperCase();
  const isManga =
    card.id.includes('_p2') ||
    (card.yuyuteiTitle && (card.yuyuteiTitle.includes('スーパーパラレル') || card.yuyuteiTitle.includes('コミパラ'))) ||
    (card.name && card.name.toLowerCase().includes('manga'));
  const isParallel =
    card.isAltArt ||
    card.id.includes('_p') ||
    (card.yuyuteiTitle && card.yuyuteiTitle.includes('パラレル'));
  const isReprint = card.pack?.code === 'PRB-01' || (card.pack?.name && card.pack.name.includes('BEST'));
  const isPromo = Boolean(card.promoSource || card.id.startsWith('P-') || card.pack?.code?.startsWith('P-'));

  const scored = candidates.map((app) => {
    let score = 0;
    const title = (app.localizedName || app.name || '').toLowerCase();
    const rawTitle = app.localizedName || app.name || '';
    const rawName = app.name || '';

    // Must match card number
    if (!title.includes(cardNum.toLowerCase())) {
      score -= 50;
    } else {
      score += 20;
    }

    // Manga / Comic Parallel matching
    const appIsManga =
      rawTitle.includes('コミパラ') ||
      rawTitle.includes('Comic Parallel') ||
      rawTitle.includes('SEC-SP') ||
      rawTitle.includes('スーパーパラレル') ||
      rawName.includes('Comic Parallel');

    if (isManga) {
      if (appIsManga) score += 60;
      else score -= 50;
    } else {
      if (appIsManga) score -= 50;
    }

    // Parallel matching (when not manga)
    if (!isManga && isParallel) {
      const appIsParallel =
        rawTitle.includes('-P ') ||
        rawTitle.includes('-P[') ||
        rawTitle.includes('パラレル') ||
        rawTitle.includes('Parallel') ||
        rawName.includes('-P ') ||
        rawName.includes('-P[');

      if (appIsParallel && !appIsManga) score += 40;
      else if (!appIsParallel) score -= 30;
    } else if (!isManga && !isParallel) {
      const appIsParallel =
        rawTitle.includes('-P ') ||
        rawTitle.includes('-P[') ||
        rawTitle.includes('パラレル') ||
        rawTitle.includes('Parallel') ||
        rawName.includes('-P ') ||
        appIsManga;

      if (!appIsParallel) score += 30;
      else score -= 40;
    }

    // Reprint matching (PRB-01 / THE BEST)
    const appIsTheBest =
      rawTitle.includes('THE BEST') ||
      rawTitle.includes('プレミアムブースター') ||
      rawName.includes('THE BEST');

    if (isReprint) {
      if (appIsTheBest) score += 50;
      else score -= 40;
    } else {
      if (appIsTheBest) score -= 40;
    }

    // Promo / Special Trophy matching
    const appIsPromo =
      rawTitle.includes('記念品') ||
      rawTitle.includes('シリアルナンバー') ||
      rawTitle.includes('フラッグシップ') ||
      rawTitle.includes('チャンピオンシップ') ||
      rawName.includes('Flagship') ||
      rawName.includes('Serial');

    if (isPromo) {
      if (appIsPromo) score += 40;
    } else {
      if (appIsPromo) score -= 60; // Strongly penalize trophy/promo cards when matching standard pack cards
    }

    // Set Name matching
    if (card.pack?.name) {
      const pName = card.pack.name.toLowerCase();
      if (pName.includes('straw hat') && (rawTitle.includes('麦わらの一味') || rawTitle.includes('スタートデッキ') || rawName.includes('Straw Hat'))) score += 30;
      if (pName.includes('romance dawn') && (rawTitle.includes('ロマンスドーン') || rawTitle.includes('ROMANCE DAWN') || rawName.includes('ROMANCE DAWN'))) score += 30;
      if (pName.includes('new era') && (rawTitle.includes('新時代の主役') || rawTitle.includes('Awakening') || rawName.includes('New Era'))) score += 30;
      if (pName.includes('paramount war') && (rawTitle.includes('頂上決戦') || rawTitle.includes('Paramount') || rawName.includes('Paramount'))) score += 30;
      if (pName.includes('pillars of strength') && (rawTitle.includes('強大な敵') || rawTitle.includes('Pillars'))) score += 30;
      if (pName.includes('kingdoms of intrigue') && (rawTitle.includes('謀略の王国') || rawTitle.includes('Kingdoms'))) score += 30;
      if (pName.includes('wings of the captain') && (rawTitle.includes('双璧の覇者') || rawTitle.includes('Wings'))) score += 30;
      if (pName.includes('500 years') && (rawTitle.includes('500年後の未来') || rawTitle.includes('500 Years'))) score += 30;
      if (pName.includes('two legends') && (rawTitle.includes('二つの伝説') || rawTitle.includes('Two Legends'))) score += 30;
      if (pName.includes('emperors') && (rawTitle.includes('新たなる皇帝') || rawTitle.includes('Emperors'))) score += 30;
      if (pName.includes('royal blood') && (rawTitle.includes('王族の血統') || rawTitle.includes('Royal Blood'))) score += 30;
    }

    return { app, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].app : null;
}

export async function fetchSnkrdunkPricing(card: any): Promise<SnkrdunkPricing | null> {
  const cardId = card.id;
  const cached = pricingCache.get(cardId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const cardNum = (card.cardNumber || card.card_number || card.id.split('_')[0]).toUpperCase();

  try {
    // 1. Fetch apparels list for this card number
    const appRes = await fetch(`https://snkrdunk.com/v1/apparels?productNumber=${cardNum}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json',
      },
      next: { revalidate: 900 },
    });

    if (!appRes.ok) return null;
    const appData = await appRes.json();
    const matchedApparel = matchCardToApparel(card, appData.apparels || []);
    if (!matchedApparel) return null;

    // 2. Fetch active used listings (isSaleOnly=1)
    const usedRes = await fetch(
      `https://snkrdunk.com/v1/apparels/${matchedApparel.id}/used?perPage=50&page=1&isSaleOnly=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
        },
        next: { revalidate: 900 },
      }
    );

    if (!usedRes.ok) return null;
    const usedData = await usedRes.json();
    const items = usedData.apparelUsedItems || [];

    // Group active listings by condition
    const grouped: Record<string, number[]> = {};
    for (const item of items) {
      if (item.status === 0 && !item.isDisplaySold && typeof item.price === 'number') {
        const cond = item.displayWearCount || item.wearCount;
        if (!grouped[cond]) grouped[cond] = [];
        grouped[cond].push(item.price);
      }
    }

    // Sort prices ascending
    for (const cond in grouped) {
      grouped[cond].sort((a, b) => a - b);
    }

    // User Requirement 1: Only use RAW cards with condition/grade A. Lowest active listing.
    const rawAList = grouped['A（きれいな状態）'] || grouped['tradingCardSingleConditionNearlyUnused'] || [];
    const rawA = rawAList.length > 0 ? rawAList[0] : null;

    // User Requirement 2 & 3: PSA exact grades only. Lowest active listing.
    const psa10List = grouped['PSA10'] || grouped['tradingCardSingleConditionPSA10'] || [];
    const psa9List = grouped['PSA9'] || grouped['tradingCardSingleConditionPSA9'] || [];
    const psa8List = grouped['PSA8以下'] || grouped['tradingCardSingleConditionPSA8OrLess'] || [];
    const psa10 = psa10List.length > 0 ? psa10List[0] : null;
    const psa9 = psa9List.length > 0 ? psa9List[0] : null;
    const psa8 = psa8List.length > 0 ? psa8List[0] : null;

    // User Requirement 4: BGS exact grades only. Lowest active listing.
    const bgs10List = [...(grouped['BGS10 BL'] || []), ...(grouped['BGS10 GL'] || [])].sort((a, b) => a - b);
    const bgs95List = grouped['BGS9.5'] || [];
    const bgs10 = bgs10List.length > 0 ? bgs10List[0] : null;
    const bgs95 = bgs95List.length > 0 ? bgs95List[0] : null;

    // User Requirement 5: ARS exact grades only. Lowest active listing.
    const ars10plusList = grouped['ARS10+'] || [];
    const ars10List = grouped['ARS10'] || [];
    const ars9List = grouped['ARS9'] || [];
    const ars10plus = ars10plusList.length > 0 ? ars10plusList[0] : null;
    const ars10 = ars10List.length > 0 ? ars10List[0] : null;
    const ars9 = ars9List.length > 0 ? ars9List[0] : null;

    // CGC / Other:
    const cgcList = grouped['他鑑定品'] || [];
    const cgc10 = cgcList.length > 0 ? cgcList[0] : null;

    const result: SnkrdunkPricing = {
      apparelId: matchedApparel.id,
      productNumber: cardNum,
      apparelName: matchedApparel.localizedName || matchedApparel.name,
      url: `https://snkrdunk.com/apparels/${matchedApparel.id}/used`,
      rawA,
      psa10,
      psa9,
      psa8,
      bgs10,
      bgs95,
      ars10plus,
      ars10,
      ars9,
      cgc10,
      activeListingsCount: items.length,
      updatedAt: new Date().toISOString(),
    };

    pricingCache.set(cardId, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error(`Failed to fetch SNKRDUNK pricing for card ${cardId}:`, err);
    return null;
  }
}
