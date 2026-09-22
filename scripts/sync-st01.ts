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

async function fetchSetFromYuyu(setWord: string): Promise<YuyuCard[]> {
  console.log(`🌐 Querying Yuyu-tei for "${setWord}"...`);
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(setWord)}`;
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

  console.log(`  Fetched ${cards.length} cards for "${setWord}".`);
  return cards;
}

async function syncSet(setPrefix: string, packCode: string) {
  const yuyuCards = await fetchSetFromYuyu(setPrefix);
  if (yuyuCards.length === 0) return;

  // Find pack
  const pack = await prisma.pack.findFirst({
    where: {
      OR: [
        { code: packCode },
        { code: setPrefix },
        { code: setPrefix.replace('-', '') },
      ]
    }
  });

  const packId = pack ? pack.id : '569001';

  // Group cards by base code (e.g. ST01-001)
  const grouped = new Map<string, YuyuCard[]>();
  for (const c of yuyuCards) {
    // Only process cards that match the target prefix
    if (!c.code.startsWith(setPrefix.replace('-', ''))) continue;
    
    if (!grouped.has(c.code)) {
      grouped.set(c.code, []);
    }
    grouped.get(c.code)!.push(c);
  }

  console.log(`Found ${grouped.size} unique card codes for ${setPrefix}.`);

  for (const [code, variants] of grouped.entries()) {
    // Sort variants: base card first (no パラレル in rawTitle, or lowest price if all have or don't have)
    variants.sort((a, b) => {
      const aIsBase = !a.rawTitle.includes('パラレル') && !a.rawTitle.includes('箔押し') && !a.img.includes('promo');
      const bIsBase = !b.rawTitle.includes('パラレル') && !b.rawTitle.includes('箔押し') && !b.img.includes('promo');
      if (aIsBase && !bIsBase) return -1;
      if (!aIsBase && bIsBase) return 1;
      return a.priceYen - b.priceYen;
    });

    // Find base card in DB
    const existingBase = await prisma.card.findUnique({
      where: { id: code }
    });

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const targetId = i === 0 ? code : `${code}_p${i}`;

      const promoSource = v.rawTitle.includes('(') 
        ? v.rawTitle.substring(v.rawTitle.indexOf('(') + 1).replace(')', '')
        : (i > 0 ? 'Parallel' : null);

      const isAltArt = i > 0 || v.rawTitle.includes('パラレル');
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
        console.log(`  ✓ Updated ${targetId}: ¥${v.priceYen.toLocaleString()} (${v.rawTitle})`);
      } else {
        // Create new variant card based on base card
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
        console.log(`  + Created ${targetId}: ¥${v.priceYen.toLocaleString()} (${v.rawTitle})`);
      }
    }
  }

  // Update pack card count
  const totalInPack = await prisma.card.count({
    where: { packId }
  });
  await prisma.pack.update({
    where: { id: packId },
    data: { cardsCount: totalInPack }
  });
  console.log(`Pack ${packCode} now has ${totalInPack} cards in DB.`);
}

async function main() {
  await syncSet('ST01', 'ST-01');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
