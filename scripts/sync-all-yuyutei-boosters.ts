/**
 * sync-all-yuyutei-boosters.ts
 *
 * Scrapes OP01 through OP10, and EB01 directly from Yuyu-tei:
 * 1. Updates base cards, parallels, manga rares, and SPs with exact Yuyu-tei JPY prices
 * 2. Matches Super Parallels (スーパーパラレル) to Manga Rare cards in the DB
 * 3. Creates any missing variants in the DB
 * 4. Ensures realistic USD market prices (never $0.11 / ₱6 for high-value cards)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface YuyuCard {
  code: string;
  rawTitle: string;
  priceYen: number;
  img: string;
}

async function fetchSetFromYuyu(set: string): Promise<YuyuCard[]> {
  console.log(`🌐 Fetching [${set}] from Yuyu-tei...`);
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${set}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9'
    }
  });

  if (!res.ok) {
    console.warn(`Failed to fetch ${set}: ${res.statusText}`);
    return [];
  }

  const html = await res.text();
  const cardBlocks = html.split('class="card-product');
  const cards: YuyuCard[] = [];

  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);

    if (codeMatch && priceMatch) {
      cards.push({
        code: codeMatch[1].trim(),
        rawTitle: titleMatch ? titleMatch[1].trim() : '',
        priceYen: parseInt(priceMatch[1].replace(/,/g, ''), 10),
        img: imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : ''
      });
    }
  }

  console.log(`  Fetched ${cards.length} cards from ${set}.`);
  return cards;
}

async function syncSet(setName: string) {
  const yuyuCards = await fetchSetFromYuyu(setName);
  if (yuyuCards.length === 0) return;

  // Group by card code e.g. OP05-119
  const grouped: Record<string, YuyuCard[]> = {};
  for (const c of yuyuCards) {
    // Clean code: ensure it starts with standard set prefix
    const cleanCode = c.code.split('/')[0].trim();
    if (!grouped[cleanCode]) grouped[cleanCode] = [];
    grouped[cleanCode].push(c);
  }

  let updated = 0;
  let created = 0;

  for (const [code, items] of Object.entries(grouped)) {
    // Find all cards in DB matching this code
    const dbCards = await prisma.card.findMany({
      where: {
        OR: [
          { id: code },
          { id: { startsWith: `${code}_p` } },
          { id: { startsWith: `${code}_r` } }
        ]
      }
    });

    if (dbCards.length === 0) continue;

    const baseDbCard = dbCards.find(c => c.id === code) || dbCards[0];

    // Find Manga Rare / Super Parallel in Yuyu items
    const superParallel = items.find(i => i.rawTitle.includes('(スーパーパラレル)'));
    // Find Oda Signature
    const odaSignature = items.find(i => i.rawTitle.includes('(サイン)'));
    // Find PRB reprint
    const prbReprint = items.find(i => i.rawTitle.includes('(PRB)'));
    // Find standard parallel (alt art)
    const regularParallels = items.filter(i => 
      i.rawTitle.includes('(パラレル)') && 
      !i.rawTitle.includes('(スーパーパラレル)') && 
      !i.rawTitle.includes('(サイン)') && 
      !i.rawTitle.includes('(PRB)') &&
      !i.rawTitle.includes('(金パラレル)') &&
      !i.rawTitle.includes('(銀パラレル)')
    );
    // Base card (no parallel)
    const baseItem = items.find(i => !i.rawTitle.includes('(パラレル)') && !i.rawTitle.includes('(サイン)'));

    // 1. Update Base Card
    if (baseItem) {
      const target = dbCards.find(c => c.id === code);
      if (target) {
        await prisma.card.update({
          where: { id: code },
          data: {
            yuyuPrice: baseItem.priceYen,
            marketPrice: target.marketPrice && target.marketPrice >= 1.0 ? target.marketPrice : Math.round(baseItem.priceYen / 152 * 100) / 100
          }
        });
        updated++;
      }
    }

    // 2. Update Manga Rare (Super Parallel)
    if (superParallel) {
      // Find Manga card in DB: usually _p1 for OP01-OP10, or _p2 for EB01-006
      let mangaCard = dbCards.find(c => c.id === `${code}_p1` && (c.rarity === 'SecretRare' || c.rarity === 'SuperRare'));
      if (code === 'EB01-006') {
        mangaCard = dbCards.find(c => c.id === `${code}_p2`) || mangaCard;
      }
      // Or check by existing high value
      if (!mangaCard) {
        mangaCard = dbCards.find(c => (c.marketPrice || 0) > 300);
      }

      if (mangaCard) {
        await prisma.card.update({
          where: { id: mangaCard.id },
          data: {
            yuyuPrice: superParallel.priceYen,
            // Preserve authentic TCGPlayer US marketPrice if already set, otherwise estimate
            marketPrice: mangaCard.marketPrice && mangaCard.marketPrice >= 50.0 ? mangaCard.marketPrice : Math.round(superParallel.priceYen / 152)
          }
        });
        console.log(`  👑 Updated Manga Rare [${mangaCard.id}] ${mangaCard.name}: ¥${superParallel.priceYen.toLocaleString()}`);
        updated++;
      }
    }

    // 3. Update Standard Parallels (Alt Arts)
    let pIdx = 1;
    for (const pItem of regularParallels) {
      // Skip if this pIdx is the manga rare
      const isMangaSlot = (code === 'EB01-006' && pIdx === 2) || (code === 'OP05-119' && pIdx === 1);
      const targetId = isMangaSlot ? `${code}_p${pIdx + 1}` : `${code}_p${pIdx}`;
      const existing = dbCards.find(c => c.id === targetId);

      const usdPrice = Math.round(pItem.priceYen / 152 * 100) / 100;

      if (existing) {
        // Only update if not already a Manga rare (> $300)
        if ((existing.marketPrice || 0) < 300) {
          await prisma.card.update({
            where: { id: targetId },
            data: {
              yuyuPrice: pItem.priceYen,
              marketPrice: existing.marketPrice && existing.marketPrice >= 1.0 ? existing.marketPrice : usdPrice
            }
          });
          updated++;
        }
      } else if (baseDbCard) {
        // Create missing parallel
        await prisma.card.create({
          data: {
            id: targetId,
            packId: baseDbCard.packId,
            name: baseDbCard.name,
            category: baseDbCard.category,
            colors: baseDbCard.colors,
            cost: baseDbCard.cost,
            power: baseDbCard.power,
            counter: baseDbCard.counter,
            attributes: baseDbCard.attributes,
            types: baseDbCard.types,
            rarity: baseDbCard.rarity,
            effect: baseDbCard.effect,
            trigger: baseDbCard.trigger,
            imageUrl: pItem.img || baseDbCard.imageUrl,
            blockNumber: baseDbCard.blockNumber,
            isAltArt: true,
            baseCardId: code,
            marketPrice: usdPrice,
            yuyuPrice: pItem.priceYen,
            promoSource: pItem.rawTitle
          }
        });
        created++;
        console.log(`  ✨ Created missing parallel: [${targetId}] ${baseDbCard.name}: ¥${pItem.priceYen}`);
      }
      pIdx++;
    }

    // 4. Update PRB reprint if exists
    if (prbReprint) {
      const rCard = dbCards.find(c => c.id.includes('_r'));
      if (rCard) {
        await prisma.card.update({
          where: { id: rCard.id },
          data: {
            yuyuPrice: prbReprint.priceYen,
            marketPrice: Math.round(prbReprint.priceYen / 152 * 100) / 100
          }
        });
        updated++;
      }
    }
  }

  console.log(`✅ [${setName}] Finished: Updated ${updated}, Created ${created} cards.`);
}

async function main() {
  const sets = [
    'EB01',
    'OP01', 'OP02', 'OP03', 'OP04', 'OP05',
    'OP06', 'OP07', 'OP08', 'OP09', 'OP10'
  ];

  console.log('🚀 Starting full Yuyu-tei price synchronization across all sets...');
  for (const s of sets) {
    await syncSet(s);
  }

  // Double check Chopper EB01-006 cards
  const choppers = await prisma.card.findMany({
    where: { id: { contains: 'EB01-006' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true }
  });
  console.log('\n--- VERIFIED CHOPPERS AFTER FULL SYNC ---');
  console.table(choppers);

  // Double check Luffy OP05-119 cards
  const luffys = await prisma.card.findMany({
    where: { id: { contains: 'OP05-119' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true }
  });
  console.log('\n--- VERIFIED OP05-119 LUFFY AFTER FULL SYNC ---');
  console.table(luffys);

  await prisma.$disconnect();
}

main().catch(console.error);
