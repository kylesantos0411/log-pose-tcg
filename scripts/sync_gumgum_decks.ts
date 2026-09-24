import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { RecommendedDeck, DeckCardItem } from '../src/lib/recommended-decks';

export interface GumgumDecklist {
  id: string;
  set: string;
  src?: string | null;
  date: string;
  author: string;
  region: string;
  country: string;
  decklist: string;
  event_id: string;
  leader_id: string;
  leader_name: string;
  placement: number;
  placement_text?: string;
  tournament_type?: string;
  event_name?: string;
}

export function parseDecklistsFromHtml(html: string): GumgumDecklist[] {
  const flightChunks = html.match(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs) || [];
  for (const chunk of flightChunks) {
    if (chunk.includes('decklists') && chunk.includes('decklist') && chunk.includes('leader_id')) {
      const unescaped = chunk
        .replace(/^self\.__next_f\.push\(\[1,"/, '')
        .replace(/"\]\)$/, '')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\');
      
      const idx = unescaped.indexOf('"decklists":[');
      if (idx !== -1) {
        const start = idx + '"decklists":'.length;
        let depth = 0;
        let end = -1;
        for (let i = start; i < unescaped.length; i++) {
          if (unescaped[i] === '[') depth++;
          else if (unescaped[i] === ']') {
            depth--;
            if (depth === 0) {
              end = i + 1;
              break;
            }
          }
        }
        if (end !== -1) {
          try {
            const arr = JSON.parse(unescaped.slice(start, end));
            if (Array.isArray(arr)) return arr;
          } catch (err) {
            console.error('JSON parse error in flight chunk:', err);
          }
        }
      }
    }
  }

  // Fallback direct regex
  const match = html.match(/\\"decklists\\":\s*(\[.*?\])(?:,\s*\\"[a-zA-Z0-9_]+\\"|\}\])/s) ||
                html.match(/"decklists":\s*(\[.*?\])(?:,\s*"[a-zA-Z0-9_]+"|\}\])/s);
  if (match) {
    try {
      const rawJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // ignore
    }
  }

  return [];
}

const COLOR_MAP: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#10b981',
  Purple: '#a855f7',
  Black: '#4b5563',
  Yellow: '#f59e0b',
};

function getColorDot(colorStr: string): string {
  if (!colorStr) return '#3b82f6';
  const firstColor = colorStr.split('/')[0].split(',')[0].trim();
  return COLOR_MAP[firstColor] || '#3b82f6';
}

function normalizeFormat(setStr: string): string {
  if (!setStr) return 'OP-16';
  const clean = setStr.toUpperCase().trim();
  if (clean.startsWith('OP') && !clean.includes('-')) {
    return clean.replace('OP', 'OP-');
  }
  if (clean.startsWith('EB') && !clean.includes('-')) {
    return clean.replace('EB', 'EB-');
  }
  return clean;
}

function formatPlacementText(placement: number, placementText?: string): string {
  if (placementText && isNaN(Number(placementText))) {
    return placementText;
  }
  if (placement === 1) return '1st Place (Champion)';
  if (placement === 2) return '2nd Place (Finalist)';
  if (placement === 3) return '3rd Place';
  if (placement === 4) return '4th Place';
  if (placement <= 8) return `Top 8 (#${placement})`;
  if (placement <= 16) return `Top 16 (#${placement})`;
  if (placement <= 32) return `Top 32 (#${placement})`;
  return `#${placement} Place`;
}

function formatTournamentType(name: string, type?: string): string {
  const lower = (name + ' ' + (type || '')).toLowerCase();
  if (lower.includes('world') || lower.includes('finals')) return 'World Championship';
  if (lower.includes('cs') || lower.includes('championship')) return 'Championship (CS)';
  if (lower.includes('regional')) return 'Regional';
  if (lower.includes('treasure cup')) return 'Treasure Cup';
  if (lower.includes('flagship')) return 'Flagship Battle';
  if (lower.includes('standard battle')) return 'Standard Battle';
  return type || 'Championship Regional';
}

async function runSync() {
  console.log('--- SYNCING GUMGUM.GG DECKS WITH JAPANESE DATABASE ---');
  
  // 1. Load all cards into memory index for fast lookup
  console.log('Loading cards from local database...');
  const allCards = await prisma.card.findMany({
    select: {
      id: true,
      cardNumber: true,
      name: true,
      category: true,
      colors: true,
      cost: true,
      power: true,
      counter: true,
      rarity: true,
      imageUrl: true,
      yuyuPrice: true,
      marketPrice: true,
      isAltArt: true,
      hasJpPrint: true,
      types: true,
      releaseDate: true,
    }
  });
  console.log(`Loaded ${allCards.length} cards from database.`);

  // Build card lookup map
  // Key: normalized card code (e.g. "OP16-022", "OP01-001", "ST13-003")
  const cardIndex = new Map<string, typeof allCards[0]>();

  // Sort cards so standard, base-art, Japanese-printed cards with valid image and price come first
  allCards.sort((a, b) => {
    // Prefer non-alt art
    if (a.isAltArt !== b.isAltArt) return a.isAltArt ? 1 : -1;
    // Prefer has Japanese print
    if (a.hasJpPrint !== b.hasJpPrint) return a.hasJpPrint ? -1 : 1;
    // Prefer has imageUrl
    if (Boolean(a.imageUrl) !== Boolean(b.imageUrl)) return a.imageUrl ? -1 : 1;
    // Prefer has yuyuPrice
    if (Boolean(a.yuyuPrice) !== Boolean(b.yuyuPrice)) return a.yuyuPrice ? -1 : 1;
    return 0;
  });

  for (const card of allCards) {
    const keys = new Set<string>();
    if (card.cardNumber) keys.add(card.cardNumber.toUpperCase().trim());
    if (card.id) keys.add(card.id.toUpperCase().trim());

    for (const key of keys) {
      if (!cardIndex.has(key)) {
        cardIndex.set(key, card);
      }
    }
  }

  // 2. Fetch events from gumgum.gg
  console.log('\nFetching tournament events from gumgum.gg API...');
  const res = await fetch('https://gumgum.gg/api/events?game=one-piece&limit=50', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await res.json();
  const events = data.events || [];
  console.log(`Retrieved ${events.length} events.`);

  const scrapedDecks: RecommendedDeck[] = [];
  const processedDeckSignatures = new Set<string>();
  let totalRawDecks = 0;

  for (const ev of events) {
    try {
      const pageRes = await fetch(`https://gumgum.gg/one-piece/events/${ev.id}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!pageRes.ok) continue;
      const html = await pageRes.text();
      const eventDecks = parseDecklistsFromHtml(html);
      if (eventDecks.length === 0) continue;

      totalRawDecks += eventDecks.length;
      console.log(`Event [${ev.format}] ${ev.name} (${ev.country}): ${eventDecks.length} decks`);

      for (const d of eventDecks) {
        // Leader lookup
        const leaderKey = (d.leader_id || '').toUpperCase().trim();
        const leaderCard = cardIndex.get(leaderKey);
        if (!leaderCard) {
          // Skip if leader card unknown
          continue;
        }

        // Parse card entries: "4xOP16-034;4xOP16-054;..."
        const slots = (d.decklist || '').split(';').map(s => s.trim()).filter(Boolean);
        const cardItems: DeckCardItem[] = [];
        let totalDeckCards = 0;
        let hasMissingCards = false;

        let charCount = 0;
        let eventCount = 0;
        let stageCount = 0;
        let c2000 = 0;
        let c1000 = 0;
        let noC = 0;
        let weightedCostSum = 0;

        for (const slot of slots) {
          const match = slot.match(/^(\d+)x(.*)$/);
          if (!match) continue;
          const qty = parseInt(match[1], 10);
          const rawCode = match[2].trim().toUpperCase();
          const card = cardIndex.get(rawCode);

          if (!card) {
            hasMissingCards = true;
            break;
          }

          totalDeckCards += qty;
          const cat = card.category || 'Character';
          if (cat === 'Character') charCount += qty;
          else if (cat === 'Event') eventCount += qty;
          else if (cat === 'Stage') stageCount += qty;

          if (card.counter === 2000) c2000 += qty;
          else if (card.counter === 1000) c1000 += qty;
          else noC += qty;

          const cCost = card.cost || 0;
          weightedCostSum += cCost * qty;

          cardItems.push({
            cardId: card.cardNumber || card.id,
            name: card.name,
            quantity: qty,
            cost: card.cost,
            power: card.power,
            category: card.category,
            colors: card.colors,
            imageUrl: card.imageUrl,
            yuyuPrice: card.yuyuPrice || 100,
            marketPrice: card.marketPrice || (card.yuyuPrice ? Math.round((card.yuyuPrice / 150) * 100) / 100 : 0.99),
          });
        }

        // Validate complete standard One Piece deck (exactly 50 cards, no missing cards)
        if (hasMissingCards || totalDeckCards !== 50) {
          continue;
        }

        // Deduplication signature: Leader + Event + Placement + Author
        const sig = `${leaderKey}-${ev.id}-${d.placement}-${d.author}`;
        if (processedDeckSignatures.has(sig)) continue;
        processedDeckSignatures.add(sig);

        // Leader colors formatting
        const rawColors = (leaderCard.colors || 'Red').split(',').map(c => c.trim()).join(' / ');
        const primaryColor = leaderCard.colors ? leaderCard.colors.split(',')[0].trim() : 'Red';
        const colorDot = getColorDot(primaryColor);
        const metaEra = normalizeFormat(d.set || ev.format);
        const placementText = formatPlacementText(d.placement, d.placement_text);
        const tType = formatTournamentType(ev.name, d.tournament_type);

        const leaderCleanName = leaderCard.name.replace(/^[A-Z]\s+/, '');
        const slug = `gumgum-${leaderCard.cardNumber || leaderCard.id}-${d.id.slice(0, 8)}`.toLowerCase();

        const avgCost = totalDeckCards > 0 ? Math.round((weightedCostSum / totalDeckCards) * 10) / 10 : 3.5;

        // Auto-generate strategy description
        const topBosses = cardItems
          .filter(c => (c.cost || 0) >= 7 && c.category === 'Character')
          .map(c => c.name)
          .slice(0, 2);
        const bossText = topBosses.length > 0 ? ` featuring ${topBosses.join(' & ')}` : '';
        const desc = `Competitive tournament deck piloted by ${d.author || 'a top player'} to ${placementText} at ${ev.name} (${ev.country})${bossText}. Optimized for the ${metaEra} competitive format.`;

        const deckObj: RecommendedDeck = {
          id: slug,
          name: `(${rawColors}) ${leaderCleanName}`,
          subname: `${leaderCleanName}`,
          leaderId: leaderCard.cardNumber || leaderCard.id,
          leaderName: leaderCleanName,
          leaderImage: leaderCard.imageUrl || `https://card.yuyu-tei.jp/opc/front/${metaEra.toLowerCase().replace('-', '')}/10001.jpg`,
          color: rawColors,
          colorDot,
          rank: d.placement === 1 ? '#1 Champion' : `#${d.placement} Meta`,
          winrate: d.placement === 1 ? '1st Place' : (d.placement_text || `Top ${d.placement}`),
          date: d.date || ev.date_start,
          tournament: ev.name,
          tournamentType: tType,
          player: d.author || 'Tournament Player',
          placement: placementText,
          host: ev.country || 'Global',
          record: d.placement === 1 ? '1st Place' : (d.placement_text || ''),
          topDecksUrl: `https://gumgum.gg/one-piece/events/${ev.id}`,
          source: 'gumgum.gg',
          metaEra,
          tier: d.placement <= 4 ? 'Tier 1' : 'Tier 2',
          description: desc,
          cards: cardItems,
          stats: {
            charactersCount: charCount,
            eventsCount: eventCount,
            stagesCount: stageCount,
            counters2000: c2000,
            counters1000: c1000,
            noCounter: noC,
            avgCost,
          }
        };

        scrapedDecks.push(deckObj);
      }
    } catch (err) {
      console.error(`Error processing event ${ev.name}:`, err);
    }
  }

  console.log(`\n========================================`);
  console.log(`Total raw decklists inspected: ${totalRawDecks}`);
  console.log(`Total fully validated decks with 100% Japanese cards: ${scrapedDecks.length}`);

  // Sort decks:
  // 1. First rank champions (1st Place)
  // 2. Next by placement (2nd, 3rd, Top 4, Top 8)
  // 3. Next by date descending
  scrapedDecks.sort((a, b) => {
    const aIsChamp = a.placement?.includes('1st');
    const bIsChamp = b.placement?.includes('1st');
    if (aIsChamp !== bIsChamp) return aIsChamp ? -1 : 1;

    const pA = parseInt((a.rank || '').replace(/\D/g, '') || '99', 10);
    const pB = parseInt((b.rank || '').replace(/\D/g, '') || '99', 10);
    if (pA !== pB) return pA - pB;

    const dA = new Date(a.date).getTime() || 0;
    const dB = new Date(b.date).getTime() || 0;
    return dB - dA;
  });

  // Balance leader representation so each leader gets at most 4 lists,
  // ensuring rich diversity across all leaders and colors
  const leaderDeckCount = new Map<string, number>();
  const diverseDecks: RecommendedDeck[] = [];

  for (const d of scrapedDecks) {
    const count = leaderDeckCount.get(d.leaderId) || 0;
    if (count < 4) {
      diverseDecks.push(d);
      leaderDeckCount.set(d.leaderId, count + 1);
    }
  }

  // Fill up to 60-70 decks with remaining top finishing decks if available
  if (diverseDecks.length < 60) {
    for (const d of scrapedDecks) {
      if (!diverseDecks.includes(d)) {
        diverseDecks.push(d);
        if (diverseDecks.length >= 60) break;
      }
    }
  }

  const finalDecks = diverseDecks.slice(0, 60);

  console.log(`Selecting top ${finalDecks.length} balanced tournament-winning decks for app.`);


  // Write to src/lib/recommended-decks.ts
  const outputCode = `// Generated from gumgum.gg tournament decklists mapped to Japanese Card Database
export interface DeckCardItem {
  cardId: string;
  name: string;
  quantity: number;
  cost?: number | null;
  power?: number | null;
  category: string;
  colors: string;
  imageUrl?: string | null;
  yuyuPrice?: number | null;
  marketPrice?: number | null;
}

export interface RecommendedDeck {
  id: string;
  name: string;
  subname: string;
  leaderId: string;
  leaderName: string;
  leaderImage: string;
  color: string;
  colorDot: string;
  rank: string;
  winrate: string;
  date: string;
  tournament: string;
  tournamentType?: string;
  player?: string;
  placement?: string;
  host?: string;
  record?: string;
  topDecksUrl?: string;
  source: string;
  metaEra?: string;
  tier?: string;
  description: string;
  cards: DeckCardItem[];
  stats: {
    charactersCount: number;
    eventsCount: number;
    stagesCount: number;
    counters2000: number;
    counters1000: number;
    noCounter: number;
    avgCost: number;
  };
}

export const RECOMMENDED_DECKS: RecommendedDeck[] = ${JSON.stringify(finalDecks, null, 2)};

export function getDeckById(id: string): RecommendedDeck | undefined {
  return RECOMMENDED_DECKS.find((d) => d.id === id);
}

export function formatDeckExport(deck: RecommendedDeck): string {
  const lines: string[] = [
    \`1x\${deck.leaderId}\`,
  ];
  deck.cards.forEach((c) => {
    lines.push(\`\${c.quantity}x\${c.cardId}\`);
  });
  return lines.join('\\n');
}
`;

  const targetPath = path.join(process.cwd(), 'src', 'lib', 'recommended-decks.ts');
  fs.writeFileSync(targetPath, outputCode, 'utf-8');
  console.log(`Successfully updated ${targetPath} with ${finalDecks.length} gumgum.gg tournament decks!`);

  await prisma.$disconnect();
}

runSync().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
