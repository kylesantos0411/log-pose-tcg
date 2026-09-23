/**
 * bandai-asia-scraper.ts
 *
 * Scrapes official card metadata and high-resolution official card artwork
 * from the Bandai Asia-EN official website:
 * https://asia-en.onepiece-cardgame.com/cardlist/?series={seriesId}
 */

export interface BandaiAsiaCard {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  rawRarity: string;
  category: string;
  rawCategory: string;
  imageUrl: string;
  cost: number | null;
  power: number | null;
  counter: number | null;
  colors: string;
  attributes: string | null;
  types: string | null;
  effect: string | null;
  trigger: string | null;
  cardSets: string | null;
  isAltArt: boolean;
  printingType: string;
  originalSet: string;
  printedSetCode: string;
  displaySet: string;
  yuyuteiSet: string;
}

export const BANDAI_ASIA_SERIES_MAP: Record<string, string> = {
  // Premium Boosters
  'PRB-02': '556302',
  'PRB-01': '556301',
  'PRB02': '556302',
  'PRB01': '556301',

  // Extra Boosters
  'EB-04': '556204',
  'EB-03': '556203',
  'EB-02': '556202',
  'EB-01': '556201',
  'EB04': '556204',
  'EB03': '556203',
  'EB02': '556202',
  'EB01': '556201',

  // Main Boosters
  'OP-17': '556117',
  'OP-16': '556116',
  'OP-15': '556115',
  'OP-14': '556114',
  'OP-13': '556113',
  'OP-12': '556112',
  'OP-11': '556111',
  'OP-10': '556110',
  'OP-09': '556109',
  'OP-08': '556108',
  'OP-07': '556107',
  'OP-06': '556106',
  'OP-05': '556105',
  'OP-04': '556104',
  'OP-03': '556103',
  'OP-02': '556102',
  'OP-01': '556101',
  'OP17': '556117',
  'OP16': '556116',
  'OP15': '556115',
  'OP14': '556114',
  'OP13': '556113',
  'OP12': '556112',
  'OP11': '556111',
  'OP10': '556110',
  'OP09': '556109',
  'OP08': '556108',
  'OP07': '556107',
  'OP06': '556106',
  'OP05': '556105',
  'OP04': '556104',
  'OP03': '556103',
  'OP02': '556102',
  'OP01': '556101',

  // Starter Decks
  'ST-36': '556036',
  'ST-35': '556035',
  'ST-34': '556034',
  'ST-33': '556033',
  'ST-32': '556032',
  'ST-31': '556031',
  'ST-30': '556030',
  'ST-29': '556029',
  'ST-28': '556028',
  'ST-27': '556027',
  'ST-26': '556026',
  'ST-25': '556025',
  'ST-24': '556024',
  'ST-23': '556023',
  'ST-22': '556022',
  'ST-21': '556021',
  'ST-20': '556020',
  'ST-19': '556019',
  'ST-18': '556018',
  'ST-17': '556017',
  'ST-16': '556016',
  'ST-15': '556015',
  'ST-14': '556014',
  'ST-13': '556013',
  'ST-12': '556012',
  'ST-11': '556011',
  'ST-10': '556010',
  'ST-09': '556009',
  'ST-08': '556008',
  'ST-07': '556007',
  'ST-06': '556006',
  'ST-05': '556005',
  'ST-04': '556004',
  'ST-03': '556003',
  'ST-02': '556002',
  'ST-01': '556001',

  // Promos & Specials
  'PROMO': '556901',
  'LIMITED': '556801',
  'FAMILY': '556701',
};

export function resolveSeriesId(input: string): { seriesId: string; setCode: string } {
  const trimmed = input.trim();
  if (/^\d{6}$/.test(trimmed)) {
    // Reverse lookup code from seriesId
    for (const [code, sid] of Object.entries(BANDAI_ASIA_SERIES_MAP)) {
      if (sid === trimmed && code.includes('-')) {
        return { seriesId: trimmed, setCode: code };
      }
    }
    return { seriesId: trimmed, setCode: trimmed };
  }

  const upper = trimmed.toUpperCase();
  const match = upper.match(/^([A-Za-z]+)-?(\d+)$/);
  const formatted = match ? `${match[1]}-${match[2]}` : upper;

  const seriesId = BANDAI_ASIA_SERIES_MAP[formatted] || BANDAI_ASIA_SERIES_MAP[upper];
  if (!seriesId) {
    throw new Error(`Unknown set or series: "${input}". Supported sets include OP-01 through OP-17, EB-01 to EB-04, ST-01 to ST-36, etc.`);
  }

  return { seriesId, setCode: formatted };
}

function cleanHtml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function derivePhysicalCardCodes(cardNumber: string) {
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

function mapBandaiRarity(rawRarity: string, id: string): string {
  const r = (rawRarity || '').toUpperCase();
  if (r === 'SEC') return 'SecretRare';
  if (r === 'SR') return 'SuperRare';
  if (r === 'R') return 'Rare';
  if (r === 'UC') return 'Uncommon';
  if (r === 'C') return 'Common';
  if (r === 'L') return 'Leader';
  if (r.includes('SP')) return 'Special';
  if (r.includes('TR')) return 'TreasureRare';
  if (r === 'P') return 'Promo';
  return rawRarity || 'Common';
}

function mapBandaiCategory(rawCategory: string): string {
  const c = (rawCategory || '').toUpperCase();
  if (c === 'CHARACTER') return 'Character';
  if (c === 'LEADER') return 'Leader';
  if (c === 'EVENT') return 'Event';
  if (c === 'STAGE') return 'Stage';
  if (c.includes('DON')) return 'DON!!';
  return rawCategory || 'Character';
}

export async function fetchBandaiAsiaCards(seriesInput: string): Promise<{ setCode: string; cards: BandaiAsiaCard[] }> {
  const { seriesId, setCode } = resolveSeriesId(seriesInput);
  const url = `https://asia-en.onepiece-cardgame.com/cardlist/?series=${seriesId}`;
  console.log(`🌐 Fetching Bandai Asia-EN official cards from: ${url}`);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Bandai Asia-EN: HTTP ${res.status}`);
  }

  const html = await res.text();
  const dlBlocks = html.split('<dl class="modalCol"');

  const cards: BandaiAsiaCard[] = [];

  for (let i = 1; i < dlBlocks.length; i++) {
    const b = dlBlocks[i];
    const idMatch = b.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const infoMatch = b.match(/<div class="infoCol">([\s\S]*?)<\/div>/i);
    const infoParts = infoMatch
      ? [...infoMatch[1].matchAll(/<span>([\s\S]*?)<\/span>/gi)].map(m => cleanHtml(m[1]))
      : [];

    const cardNumber = infoParts[0] || id.split('_')[0];
    const rawRarity = infoParts[1] || '';
    const rawCategory = infoParts[2] || '';

    const nameMatch = b.match(/<div class="cardName">([\s\S]*?)<\/div>/i);
    const name = nameMatch ? cleanHtml(nameMatch[1]) : cardNumber;

    const imgMatch = b.match(/data-src="\.\.\/images\/cardlist\/card\/([^"?]+)/i);
    const imgFile = imgMatch ? imgMatch[1] : `${id}.png`;
    const imageUrl = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${imgFile}`;

    const costMatch = b.match(/<div class="cost"><h3>Cost<\/h3>([\s\S]*?)<\/div>/i);
    const costStr = costMatch ? cleanHtml(costMatch[1]) : null;
    const cost = costStr && costStr !== '-' ? parseInt(costStr, 10) : null;

    const powerMatch = b.match(/<div class="power"><h3>Power<\/h3>([\s\S]*?)<\/div>/i);
    const powerStr = powerMatch ? cleanHtml(powerMatch[1]) : null;
    const power = powerStr && powerStr !== '-' ? parseInt(powerStr, 10) : null;

    const counterMatch = b.match(/<div class="counter"><h3>Counter<\/h3>([\s\S]*?)<\/div>/i);
    const counterStr = counterMatch ? cleanHtml(counterMatch[1]) : null;
    const counter = counterStr && counterStr !== '-' ? parseInt(counterStr, 10) : null;

    const colorMatch = b.match(/<div class="color"><h3>Color<\/h3>([\s\S]*?)<\/div>/i);
    const rawColor = colorMatch ? cleanHtml(colorMatch[1]) : '';
    // Format colors cleanly: e.g. "Red/Green" -> "Red,Green"
    const colors = rawColor.replace(/\s*\/\s*/g, ',').trim();

    const attrMatch = b.match(/<div class="attribute">[\s\S]*?<i>([\s\S]*?)<\/i>/i);
    const attributes = attrMatch ? cleanHtml(attrMatch[1]) : null;

    const typeMatch = b.match(/<div class="feature"><h3>Type<\/h3>([\s\S]*?)<\/div>/i);
    const types = typeMatch ? cleanHtml(typeMatch[1]) : null;

    const effectMatch = b.match(/<div class="text"><h3>Effect<\/h3>([\s\S]*?)<\/div>/i);
    const effect = effectMatch ? cleanHtml(effectMatch[1]) : null;

    const triggerMatch = b.match(/<div class="trigger"><h3>Trigger<\/h3>([\s\S]*?)<\/div>/i);
    const trigger = triggerMatch ? cleanHtml(triggerMatch[1]) : null;

    const setMatch = b.match(/<div class="getInfo"><h3>Card Set\(s\)<\/h3>([\s\S]*?)<\/div>/i);
    const cardSets = setMatch ? cleanHtml(setMatch[1]) : null;

    const isAltArt = id.includes('_p') || id.includes('_sp') || rawRarity.includes('SP') || rawRarity.includes('TR');

    const { printedSetCode, originalSet } = derivePhysicalCardCodes(cardNumber);

    let printingType = 'Original';
    if (id.includes('_p3') || rawRarity === 'SEC' && id.includes('_p')) {
      printingType = 'Super Parallel';
    } else if (rawRarity.includes('SP') || id.includes('_sp')) {
      printingType = 'Special';
    } else if (isAltArt) {
      printingType = 'Parallel';
    } else if (originalSet !== setCode && originalSet !== 'DON' && setCode !== 'PROMO') {
      printingType = 'Reprint';
    }

    const rarity = mapBandaiRarity(rawRarity, id);
    const category = mapBandaiCategory(rawCategory);

    cards.push({
      id,
      cardNumber,
      name,
      rarity,
      rawRarity,
      category,
      rawCategory,
      imageUrl,
      cost,
      power,
      counter,
      colors,
      attributes,
      types,
      effect,
      trigger,
      cardSets,
      isAltArt,
      printingType,
      originalSet,
      printedSetCode,
      displaySet: setCode,
      yuyuteiSet: setCode,
    });
  }

  console.log(`  ✓ Found ${cards.length} official cards from Bandai Asia-EN for [${setCode}].`);
  return { setCode, cards };
}
