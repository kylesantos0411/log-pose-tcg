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
  // Raw Market (Condition A lowest active, with fallback if out of stock)
  rawA: number | null; // JPY (Condition A)
  rawB: number | null; // JPY (Condition B)
  rawLowest: number | null; // JPY (Lowest raw listing of any condition)
  rawCondition: 'A' | 'B' | 'C' | 'D' | null;
  hasGradedOnly: boolean; // True if listings exist but are exclusively PSA/BGS/ARS graded
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
    const isEn = loc.includes('【英語版】') || n.includes('[EN]') || n.includes('English');
    const isCn = loc.includes('【中国語版】') || n.includes('[CN]') || n.includes('[CHN]');
    const isAsia = loc.includes('【アジア版】') || n.includes('[Aisa ver.]') || n.includes('For Asia');
    if (card.hasJpPrint === false) {
      return isEn;
    }
    return !isEn && !isCn && !isAsia;
  });

  if (candidates.length === 0) candidates = apparels;

  const cardNum = (card.cardNumber || card.card_number || card.id.split('_')[0]).toUpperCase();

  // Manga identification: ONLY if explicitly marked as Super Parallel / Comic Parallel / Manga
  const isManga = Boolean(
    (card.yuyuteiTitle && (card.yuyuteiTitle.includes('スーパーパラレル') || card.yuyuteiTitle.includes('コミパラ') || card.yuyuteiTitle.toLowerCase().includes('manga'))) ||
    (card.name && card.name.toLowerCase().includes('manga')) ||
    ['OP05-119_p2', 'OP01-120_p2', 'OP02-013_p2', 'OP04-083_p2', 'OP06-118_p2', 'OP07-109_p2', 'OP08-118_p2', 'OP09-119_p2', 'EB01-006_p2'].includes(card.id)
  );

  // Parallel identification
  const isParallel = Boolean(
    (card.isAltArt ||
    card.id.includes('_p') ||
    card.rarity === 'SP' ||
    card.rarity === 'Special' ||
    (card.yuyuteiTitle && (card.yuyuteiTitle.includes('パラレル') || card.yuyuteiTitle.includes('SP') || card.yuyuteiTitle.includes('箔押し')))) &&
    !isManga
  );

  // Special card (-SPC, -SP, Anime 25th, etc.)
  const isSpecial = Boolean(
    card.rarity === 'SP' ||
    card.rarity === 'Special' ||
    (card.yuyuteiTitle && (card.yuyuteiTitle.includes('SP') || card.yuyuteiTitle.includes('手配書') || card.yuyuteiTitle.includes('箔押し') || card.yuyuteiTitle.includes('スペシャル'))) ||
    (card.pack?.code === 'EB-02' && card.id.includes('_p')) ||
    (card.pack?.name && card.pack.name.includes('25th'))
  );

  const isReprint = card.pack?.code === 'PRB-01' || (card.pack?.name && card.pack.name.includes('BEST'));
  
  // Internal Yuyu-tei printing notes must NOT count as promo flags
  const internalNotes = [
    '刻印あり', '刻印なし', 'ホロなし', 'ホロあり', 'ノーマル', 'parallel', 'パラレル',
    '再録', 'reprint', 'super parallel', 'comic parallel', 'コミパラ'
  ];
  const hasRealPromoSource = Boolean(
    card.promoSource &&
    !internalNotes.includes(card.promoSource.trim().toLowerCase()) &&
    (card.promoSource.includes('チャンピオンシップ') ||
      card.promoSource.includes('フラッグシップ') ||
      card.promoSource.includes('記念') ||
      card.promoSource.includes('大会') ||
      card.promoSource.includes('プロモ') ||
      card.promoSource.toLowerCase().includes('campaign') ||
      card.promoSource.toLowerCase().includes('flagship'))
  );

  const isPromo = Boolean(
    card.id.startsWith('P-') ||
    card.cardNumber?.startsWith('P-') ||
    card.pack?.code === 'PROMO' ||
    card.pack?.code?.startsWith('P-') ||
    card.pack?.name?.toLowerCase().includes('promo') ||
    hasRealPromoSource
  );

  const scored = candidates.map((app) => {
    let score = 100; // Positive baseline
    const rawTitle = app.localizedName || app.name || '';
    const rawName = app.name || '';
    const title = rawTitle.toLowerCase();
    const name = rawName.toLowerCase();

    // Must match card number
    if (!title.includes(cardNum.toLowerCase()) && !name.includes(cardNum.toLowerCase())) {
      score -= 80;
    } else {
      score += 40;
    }

    // Manga / Comic Parallel matching
    const appIsManga =
      rawTitle.includes('コミパラ') ||
      rawTitle.includes('Comic Parallel') ||
      rawTitle.includes('SEC-SP') ||
      rawTitle.includes('スーパーパラレル') ||
      rawName.includes('Comic Parallel');

    if (isManga) {
      if (appIsManga) score += 100;
      else score -= 80;
    } else {
      if (appIsManga) score -= 80;
    }

    // Special card (-SPC, -SP) matching
    const appIsSpecial =
      rawTitle.includes('-SPC') ||
      rawTitle.includes('-SP ') ||
      rawTitle.includes('-SP[') ||
      rawTitle.includes('手配書') ||
      rawTitle.includes('Wanted') ||
      rawTitle.includes('スペシャル') ||
      rawName.includes('-SPC') ||
      rawName.includes('-SP ') ||
      rawName.includes('-SP[');

    if (isSpecial) {
      if (appIsSpecial && !appIsManga) score += 60;
    } else {
      if (appIsSpecial && !isParallel && !isManga) score -= 40;
    }

    // Standard Parallel matching
    const appIsStandardParallel =
      rawTitle.includes('-P ') ||
      rawTitle.includes('-P[') ||
      rawTitle.includes('-P(') ||
      rawTitle.includes('R-P') ||
      rawTitle.includes('SR-P') ||
      rawTitle.includes('L-P') ||
      rawTitle.includes('SEC-P') ||
      rawTitle.includes('C-P') ||
      rawTitle.includes('UC-P') ||
      rawTitle.includes('パラレル') ||
      rawTitle.includes('Parallel') ||
      rawName.includes('-P ') ||
      rawName.includes('-P[') ||
      rawName.includes('-P(') ||
      rawName.includes('R-P') ||
      rawName.includes('SR-P') ||
      rawName.includes('L-P') ||
      rawName.includes('SEC-P');

    if (isParallel && !isManga && !appIsManga) {
      if (appIsStandardParallel) score += 70;
      else score -= 60;
    } else if (!isParallel && !isManga) {
      if (!appIsStandardParallel && !appIsManga) score += 60;
      else score -= 60;
    }

    // Reprint matching (PRB-01 / THE BEST)
    const appIsTheBest =
      rawTitle.includes('THE BEST') ||
      rawTitle.includes('プレミアムブースター') ||
      rawName.includes('THE BEST');

    if (isReprint) {
      if (appIsTheBest) score += 60;
      else score -= 50;
    } else {
      if (appIsTheBest) score -= 50;
    }

    // Promo matching
    const appIsPromo =
      rawTitle.includes('記念品') ||
      rawTitle.includes('シリアルナンバー') ||
      rawTitle.includes('フラッグシップ') ||
      rawTitle.includes('チャンピオンシップ') ||
      rawTitle.includes('Promotional') ||
      rawTitle.includes('プロモ') ||
      rawTitle.includes('キャンペーン') ||
      rawTitle.includes('Campaign') ||
      rawTitle.includes('プロモーションカード') ||
      rawName.includes('Flagship') ||
      rawName.includes('Serial') ||
      rawName.includes('Promotional') ||
      rawName.includes('Campaign') ||
      rawName.includes('Championship');

    if (isPromo) {
      if (appIsPromo) score += 80;
      else score -= 50;
    } else {
      if (!appIsPromo) score += 50;
      else score -= 80;
    }

    // Explicit Promo Source Keywords matching (if actually a promo)
    if (isPromo && card.promoSource) {
      const ps = card.promoSource.toLowerCase();
      if ((ps.includes('始めよう') || ps.includes('campaign') || ps.includes('start')) &&
          (name.includes('campaign') || name.includes('started') || title.includes('始めよう'))) {
        score += 150;
      }
      if ((ps.includes('フラッグシップ') || ps.includes('flagship')) &&
          (name.includes('flagship') || title.includes('フラッグシップ'))) {
        score += 150;
      }
      if ((ps.includes('チャンピオンシップ') || ps.includes('championship')) &&
          (name.includes('championship') || title.includes('チャンピオンシップ'))) {
        score += 150;
      }
      if ((ps.includes('プレミアムカードコレクション') || ps.includes('premium card collection')) &&
          (name.includes('premium card collection') || title.includes('プレミアムカードコレクション'))) {
        score += 150;
      }
      if (ps.includes('lecafig') && (name.includes('lecafig') || title.includes('lecafig'))) {
        score += 150;
      }
    }

    // Pack / Set Name matching
    if (card.pack?.name) {
      const pName = card.pack.name.toLowerCase();
      const cleanTokens = pName
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 3 && !['pack', 'booster', 'card', 'deck'].includes(w));
      for (const token of cleanTokens) {
        if (title.includes(token) || name.includes(token)) {
          score += 40;
        }
      }
      // Japanese pack name matching
      if (pName.includes('romance dawn') && (rawTitle.includes('ロマンスドーン') || rawTitle.includes('ROMANCE DAWN'))) {
        score += 60;
      }
      if (pName.includes('paramount war') && (rawTitle.includes('頂上決戦') || rawTitle.includes('Paramount War'))) {
        score += 60;
      }
      if (pName.includes('pillars of strength') && (rawTitle.includes('強大な敵') || rawTitle.includes('Pillars of Strength'))) {
        score += 60;
      }
      if (pName.includes('kingdoms of intrigue') && (rawTitle.includes('謀略の王国') || rawTitle.includes('Kingdoms of Intrigue'))) {
        score += 60;
      }
      if (pName.includes('awakening') && (rawTitle.includes('新時代の主役') || rawTitle.includes('Awakening'))) {
        score += 60;
      }
      if (pName.includes('wings of the captain') && (rawTitle.includes('双璧の覇者') || rawTitle.includes('Wings of the Captain'))) {
        score += 60;
      }
      if (pName.includes('500 years') && (rawTitle.includes('500年後の未来') || rawTitle.includes('500 Years'))) {
        score += 60;
      }
      if (pName.includes('two legends') && (rawTitle.includes('二つの伝説') || rawTitle.includes('Two Legends'))) {
        score += 60;
      }
      if (pName.includes('new emperors') && (rawTitle.includes('新たなる皇帝') || rawTitle.includes('Four Emperors') || rawTitle.includes('New Emperors'))) {
        score += 60;
      }
      if (pName.includes('royal blood') && (rawTitle.includes('王族の血統') || rawTitle.includes('Royal Blood'))) {
        score += 60;
      }
    }

    return { app, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.app || null;
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

    // 2. Fetch active used listings (isSaleOnly=1) with up to 100 items per page
    const fetchUsedPage = async (page: number) => {
      try {
        const res = await fetch(
          `https://snkrdunk.com/v1/apparels/${matchedApparel.id}/used?perPage=100&page=${page}&isSaleOnly=1`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
              'Accept': 'application/json',
            },
            next: { revalidate: 900 },
          }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.apparelUsedItems || [];
      } catch {
        return [];
      }
    };

    let items = await fetchUsedPage(1);
    // If page 1 had 100 items, fetch page 2 to avoid missing raw Condition A cards
    if (items.length === 100) {
      const page2 = await fetchUsedPage(2);
      items = items.concat(page2);
    }

    // Group active listings by condition
    const grouped: Record<string, number[]> = {};
    for (const item of items) {
      if (item.status === 0 && !item.isDisplaySold && typeof item.price === 'number') {
        const cond = item.displayWearCount || item.wearCount;
        if (!grouped[cond]) grouped[cond] = [];
        grouped[cond].push(item.price);

        if (item.wearCount && item.wearCount !== cond) {
          if (!grouped[item.wearCount]) grouped[item.wearCount] = [];
          grouped[item.wearCount].push(item.price);
        }
      }
    }

    // Sort prices ascending
    for (const cond in grouped) {
      grouped[cond].sort((a, b) => a - b);
    }

    // User Requirement 1: Primary raw price is condition A. Lowest active listing.
    const rawAList = grouped['A（きれいな状態）'] || grouped['tradingCardSingleConditionNearlyUnused'] || [];
    const rawA = rawAList.length > 0 ? rawAList[0] : null;

    // Condition B & C fallback
    const rawBList = grouped['B（小さなキズ/ソリがある品）'] || grouped['tradingCardSingleConditionLittleScratches'] || [];
    const rawB = rawBList.length > 0 ? rawBList[0] : null;

    const rawCList = grouped['C（キズ/ソリがある品）'] || grouped['tradingCardSingleConditionScratches'] || [];
    const rawC = rawCList.length > 0 ? rawCList[0] : null;

    const rawDList = grouped['D（大きなダメージあり）'] || grouped['tradingCardSingleConditionLargeDamages'] || [];
    const rawD = rawDList.length > 0 ? rawDList[0] : null;

    let rawLowest: number | null = null;
    let rawCondition: 'A' | 'B' | 'C' | 'D' | null = null;
    if (rawA !== null) {
      rawLowest = rawA;
      rawCondition = 'A';
    } else if (rawB !== null) {
      rawLowest = rawB;
      rawCondition = 'B';
    } else if (rawC !== null) {
      rawLowest = rawC;
      rawCondition = 'C';
    } else if (rawD !== null) {
      rawLowest = rawD;
      rawCondition = 'D';
    }

    const hasGradedOnly = rawLowest === null && items.length > 0;

    // User Requirement 2 & 3: PSA exact grades only. Lowest active listing.
    const psa10List = grouped['PSA10'] || grouped['tradingCardSingleConditionPSA10'] || [];
    const psa9List = grouped['PSA9'] || grouped['tradingCardSingleConditionPSA9'] || [];
    const psa8List = grouped['PSA8以下'] || grouped['tradingCardSingleConditionPSA8Under'] || grouped['tradingCardSingleConditionPSA8OrLess'] || [];
    const psa10 = psa10List.length > 0 ? psa10List[0] : null;
    const psa9 = psa9List.length > 0 ? psa9List[0] : null;
    const psa8 = psa8List.length > 0 ? psa8List[0] : null;

    // User Requirement 4: BGS exact grades only. Lowest active listing.
    const bgs10List = [
      ...(grouped['BGS10 BL'] || []),
      ...(grouped['BGS10 GL'] || []),
      ...(grouped['BGS10'] || []),
      ...(grouped['tradingCardSingleConditionBGS10'] || []),
    ].sort((a, b) => a - b);
    const bgs95List = grouped['BGS9.5'] || grouped['tradingCardSingleConditionBGS95'] || [];
    const bgs10 = bgs10List.length > 0 ? bgs10List[0] : null;
    const bgs95 = bgs95List.length > 0 ? bgs95List[0] : null;

    // User Requirement 5: ARS exact grades only. Lowest active listing.
    const ars10plusList = grouped['ARS10+'] || grouped['tradingCardSingleConditionARS10plus'] || [];
    const ars10List = grouped['ARS10'] || grouped['tradingCardSingleConditionARS10'] || [];
    const ars9List = grouped['ARS9'] || grouped['tradingCardSingleConditionARS9'] || [];
    const ars10plus = ars10plusList.length > 0 ? ars10plusList[0] : null;
    const ars10 = ars10List.length > 0 ? ars10List[0] : null;
    const ars9 = ars9List.length > 0 ? ars9List[0] : null;

    // CGC / Other:
    const cgcList =
      grouped['他鑑定品'] ||
      grouped['tradingCardSingleConditionOtherGradingCompany'] ||
      grouped['CGC10'] ||
      grouped['CGC'] ||
      [];
    const cgc10 = cgcList.length > 0 ? cgcList[0] : null;

    const result: SnkrdunkPricing = {
      apparelId: matchedApparel.id,
      productNumber: cardNum,
      apparelName: matchedApparel.localizedName || matchedApparel.name,
      url: `https://snkrdunk.com/apparels/${matchedApparel.id}/used`,
      rawA,
      rawB,
      rawLowest,
      rawCondition,
      hasGradedOnly,
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
