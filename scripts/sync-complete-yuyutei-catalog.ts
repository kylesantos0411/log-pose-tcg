import { PrismaClient } from '@prisma/client';
import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const prisma = new PrismaClient();

interface YuyuCard {
  code: string;
  rawTitle: string;
  priceYen: number;
  img: string;
}

// Cards that have manually verified exact IDs
const PROTECTED_CARDS = new Set([
  'OP05-119', 'OP05-119_p1', 'OP05-119_p2', 'OP05-119_p3', 'OP05-119_p4', 'OP05-119_p6', 'OP05-119_p7', 'OP05-119_p8',
  'EB01-015', 'EB01-015_p1', 'EB01-015_p2',
]);

async function fetchSetFromYuyu(setWord: string): Promise<YuyuCard[]> {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(setWord)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9'
      }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch ${setWord}: ${res.statusText}`);
      return [];
    }

    const html = await res.text();
    const blocks = html.split('class="card-product');
    const cards: YuyuCard[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
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

    return cards;
  } catch (e: any) {
    console.error(`Error querying ${setWord}:`, e.message);
    return [];
  }
}

export async function syncSet(setPrefix: string, defaultPackCode?: string) {
  console.log(`\n========================================`);
  console.log(`🌐 Syncing [${setPrefix}] from Yuyu-tei...`);
  console.log(`========================================`);

  const yuyuCards = await fetchSetFromYuyu(setPrefix);
  if (yuyuCards.length === 0) {
    console.log(`No cards returned for ${setPrefix}.`);
    return;
  }

  const cleanPrefix = setPrefix.replace(/[^A-Z0-9]/g, '');

  // Find pack in database
  const pack = await prisma.pack.findFirst({
    where: {
      OR: [
        { code: defaultPackCode || setPrefix },
        { code: setPrefix },
        { code: cleanPrefix },
        { code: { startsWith: cleanPrefix } },
      ]
    }
  });

  const packId = pack ? pack.id : '569001';

  // Group by base card code
  const grouped = new Map<string, YuyuCard[]>();
  for (const c of yuyuCards) {
    const cClean = c.code.replace(/[^A-Z0-9]/g, '');
    if (!cClean.startsWith(cleanPrefix)) continue;

    if (!grouped.has(c.code)) {
      grouped.set(c.code, []);
    }
    grouped.get(c.code)!.push(c);
  }

  console.log(`Found ${yuyuCards.length} Yuyu-tei entries across ${grouped.size} unique card codes.`);

  let updatedCount = 0;
  let createdCount = 0;

  for (const [code, variants] of grouped.entries()) {
    // Sort variants: base card first (no パラレル / 箔押し), then by price ascending
    variants.sort((a, b) => {
      const aIsBase = !a.rawTitle.includes('パラレル') && !a.rawTitle.includes('箔押し') && !a.img.includes('promo');
      const bIsBase = !b.rawTitle.includes('パラレル') && !b.rawTitle.includes('箔押し') && !b.img.includes('promo');
      if (aIsBase && !bIsBase) return -1;
      if (!aIsBase && bIsBase) return 1;
      return a.priceYen - b.priceYen;
    });

    const existingBase = await prisma.card.findUnique({
      where: { id: code }
    });

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const targetId = i === 0 ? code : `${code}_p${i}`;

      if (PROTECTED_CARDS.has(targetId)) {
        continue;
      }

      const isAltArt = i > 0 || v.rawTitle.includes('パラレル');
      const promoSource = v.rawTitle.includes('(') 
        ? v.rawTitle.substring(v.rawTitle.indexOf('(') + 1).replace(')', '')
        : (isAltArt ? 'Parallel' : null);

      const marketPrice = Math.round((v.priceYen / 140) * 100) / 100;

      const existingCard = await prisma.card.findUnique({
        where: { id: targetId }
      });

      if (existingCard) {
        await prisma.card.update({
          where: { id: targetId },
          data: {
            yuyuPrice: v.priceYen,
            marketPrice: marketPrice,
            imageUrl: v.img || existingCard.imageUrl,
            hasJpPrint: true,
            isAltArt: isAltArt,
            promoSource: promoSource || existingCard.promoSource,
          }
        });
        updatedCount++;
      } else {
        await prisma.card.create({
          data: {
            id: targetId,
            packId: existingBase ? existingBase.packId : packId,
            name: existingBase ? existingBase.name : (v.rawTitle.split('(')[0].trim() || code),
            category: existingBase ? existingBase.category : (code.endsWith('-001') ? 'Leader' : 'Character'),
            colors: existingBase ? existingBase.colors : 'Red',
            cost: existingBase ? existingBase.cost : null,
            power: existingBase ? existingBase.power : null,
            counter: existingBase ? existingBase.counter : null,
            attributes: existingBase ? existingBase.attributes : null,
            types: existingBase ? existingBase.types : null,
            rarity: existingBase ? (isAltArt ? 'Special' : existingBase.rarity) : (isAltArt ? 'Special' : 'Common'),
            effect: existingBase ? existingBase.effect : null,
            trigger: existingBase ? existingBase.trigger : null,
            imageUrl: v.img,
            isAltArt: isAltArt,
            baseCardId: code,
            yuyuPrice: v.priceYen,
            marketPrice: marketPrice,
            promoSource: promoSource,
            hasJpPrint: true,
          }
        });
        createdCount++;
      }
    }
  }

  // Update pack card count if pack found
  if (pack) {
    const totalInPack = await prisma.card.count({
      where: { packId: pack.id }
    });
    await prisma.pack.update({
      where: { id: pack.id },
      data: { cardsCount: totalInPack }
    });
  }

  console.log(`✓ Completed [${setPrefix}]: ${updatedCount} updated, ${createdCount} created.`);
}

async function main() {
  const setsToSync = [
    // Starter decks ST01 to ST36
    'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06', 'ST07', 'ST08', 'ST09', 'ST10',
    'ST11', 'ST12', 'ST13', 'ST14', 'ST15', 'ST16', 'ST17', 'ST18', 'ST19', 'ST20',
    'ST21', 'ST22', 'ST23', 'ST24', 'ST25', 'ST26', 'ST27', 'ST28', 'ST29', 'ST30',
    'ST31', 'ST32', 'ST33', 'ST34', 'ST35', 'ST36',
    // Extra boosters
    'EB01', 'EB02', 'EB03', 'EB04',
    // Premium boosters
    'PRB01', 'PRB02',
    // Main boosters
    'OP01', 'OP02', 'OP03', 'OP04', 'OP05', 'OP06', 'OP07', 'OP08', 'OP09', 'OP10',
    'OP11', 'OP12', 'OP13', 'OP14', 'OP15', 'OP16', 'OP17',
  ];

  for (const set of setsToSync) {
    await syncSet(set);
    // Slight pause to be polite to Yuyu-tei server
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n🎉 All Yuyu-tei sets successfully synced into database!');
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
