/**
 * Bandai Official Cardlist Scraper & Importer
 * 
 * Fetches latest card metadata, parallel arts, and official artwork from onepiece-cardgame.com
 * and updates the database with atomic Prisma upserts.
 * 
 * Usage:
 *   npx tsx scripts/scrape-bandai-releases.ts --set=OP10
 *   npx tsx scripts/scrape-bandai-releases.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BandaiScrapedCard {
  id: string;
  name: string;
  packId: string;
  rarity: string;
  category: string;
  colors: string;
  cost: number | null;
  power: number | null;
  counter: number | null;
  effect: string | null;
  imageUrl: string;
  artist?: string;
  isParallel?: boolean;
}

const BANDAI_SERIES_MAP: Record<string, string> = {
  'OP-10': '569110', // OP-10 王族の血統 (Royal Bloodlines)
  'OP-09': '569109', // OP-09 新たなる四皇 (The Four Emperors)
  'EB-01': '569201', // Memorial Collection
  'ST-20': '569320', // Starter Deck 20
  'ST-19': '569319', // Starter Deck 19
  'ST-18': '569318', // Starter Deck 18
  'ST-17': '569317', // Starter Deck 17
  'ST-16': '569316', // Starter Deck 16
  'ST-15': '569315', // Starter Deck 15
};

async function fetchBandaiSeriesHtml(seriesCode: string): Promise<string> {
  const url = `https://onepiece-cardgame.com/cardlist/?series=${seriesCode}`;
  console.log(`[Bandai Scraper] Requesting series URL: ${url}`);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!res.ok) {
      console.warn(`[Bandai Scraper] Bandai server responded with status: ${res.status}`);
      return '';
    }

    return await res.text();
  } catch (err) {
    console.error(`[Bandai Scraper] Network fetch failed:`, err);
    return '';
  }
}

/**
 * Parses card elements from Bandai cardlist HTML structure:
 * <dl class="modalCol">
 *   <dt class="cardName">Card Name</dt>
 *   <dd class="cardNo">OP09-001</dd>
 *   ...
 * </dl>
 */
export function parseBandaiCards(html: string, packId: string): BandaiScrapedCard[] {
  if (!html) return [];
  const cards: BandaiScrapedCard[] = [];

  // Match dl modalCol blocks
  const dlRegex = /<dl\s+class="modalCol"[^>]*>([\s\S]*?)<\/dl>/gi;
  let match: RegExpExecArray | null;

  while ((match = dlRegex.exec(html)) !== null) {
    const block = match[1];

    // Card Number / ID
    const noMatch = block.match(/<dd\s+class="cardNo"[^>]*>([^<]+)<\/dd>/i);
    if (!noMatch) continue;
    const rawId = noMatch[1].trim();

    // Card Name
    const nameMatch = block.match(/<dt\s+class="cardName"[^>]*>([^<]+)<\/dt>/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

    // Image URL
    const imgMatch = block.match(/src="([^"]*\/images\/cardlist\/card\/[^"]+)"/i);
    const relativeImg = imgMatch ? imgMatch[1] : '';
    const imageUrl = relativeImg.startsWith('http')
      ? relativeImg
      : `https://onepiece-cardgame.com${relativeImg.startsWith('/') ? '' : '/'}${relativeImg}`;

    // Rarity
    const rarityMatch = block.match(/<dd\s+class="rarity"[^>]*>([^<]+)<\/dd>/i);
    const rarity = rarityMatch ? rarityMatch[1].trim() : 'C';

    // Category (Leader, Character, Event, Stage)
    const catMatch = block.match(/<dd\s+class="category"[^>]*>([^<]+)<\/dd>/i);
    const category = catMatch ? catMatch[1].trim() : 'Character';

    // Color
    const colorMatch = block.match(/<dd\s+class="color"[^>]*>([^<]+)<\/dd>/i);
    const colors = colorMatch ? colorMatch[1].trim() : 'Red';

    // Cost
    const costMatch = block.match(/<dd\s+class="cost"[^>]*>([^<]+)<\/dd>/i);
    const cost = costMatch && !isNaN(parseInt(costMatch[1])) ? parseInt(costMatch[1]) : null;

    // Power
    const powerMatch = block.match(/<dd\s+class="power"[^>]*>([^<]+)<\/dd>/i);
    const power = powerMatch && !isNaN(parseInt(powerMatch[1])) ? parseInt(powerMatch[1]) : null;

    // Counter
    const counterMatch = block.match(/<dd\s+class="counter"[^>]*>([^<]+)<\/dd>/i);
    const counter = counterMatch && !isNaN(parseInt(counterMatch[1])) ? parseInt(counterMatch[1]) : null;

    // Effect
    const effectMatch = block.match(/<dd\s+class="text"[^>]*>([\s\S]*?)<\/dd>/i);
    const effect = effectMatch ? effectMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim() : null;

    // Parallel Art detection from image suffix or id
    const isParallel = imageUrl.includes('_p') || rawId.includes('_p');
    const cardId = isParallel && !rawId.includes('_p') ? `${rawId}_p1` : rawId;

    cards.push({
      id: cardId,
      name,
      packId,
      rarity,
      category,
      colors,
      cost,
      power,
      counter,
      effect,
      imageUrl,
      isParallel,
    });
  }

  return cards;
}

async function runScraper() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const targetArg = args.find((a) => a.startsWith('--set='));
  const targetSet = targetArg ? targetArg.split('=')[1].toUpperCase() : 'OP-09';

  console.log(`🏴‍☠️ [Bandai Scraper] Starting scraping run for ${targetSet} (Dry Run: ${isDryRun})...`);

  const seriesCode = BANDAI_SERIES_MAP[targetSet] || BANDAI_SERIES_MAP['OP-09'];
  const html = await fetchBandaiSeriesHtml(seriesCode);

  if (!html) {
    console.log(`⚠️  Could not retrieve HTML from remote server (network restrictions or offline mode).`);
    console.log(`✅  Checking existing database records for ${targetSet}...`);
    const count = await prisma.card.count({
      where: { packId: { contains: targetSet } },
    });
    console.log(`📊 Currently indexed cards for ${targetSet}: ${count}`);
    return;
  }

  const cards = parseBandaiCards(html, targetSet);
  console.log(`✨ Successfully parsed ${cards.length} cards from official Bandai cardlist.`);

  if (isDryRun) {
    console.log('Sample parsed cards:', cards.slice(0, 3));
    return;
  }

  // Atomic upsert
  let upsertedCount = 0;
  for (const card of cards) {
    try {
      await prisma.card.upsert({
        where: { id: card.id },
        update: {
          name: card.name,
          packId: card.packId,
          rarity: card.rarity,
          category: card.category,
          colors: card.colors,
          cost: card.cost,
          power: card.power,
          counter: card.counter,
          effect: card.effect,
          imageUrl: card.imageUrl,
          hasJpPrint: true,
        },
        create: {
          id: card.id,
          name: card.name,
          packId: card.packId,
          rarity: card.rarity,
          category: card.category,
          colors: card.colors,
          cost: card.cost,
          power: card.power,
          counter: card.counter,
          effect: card.effect,
          imageUrl: card.imageUrl,
          marketPrice: 5.0,
          yuyuPrice: 500,
          hasJpPrint: true,
        },
      });
      upsertedCount++;
    } catch (err) {
      console.warn(`Failed to upsert card ${card.id}:`, err);
    }
  }

  console.log(`🎉 Successfully synchronized ${upsertedCount} cards into SQLite database!`);
}

if (require.main === module) {
  runScraper()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
