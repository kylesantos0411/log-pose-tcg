import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface YuyuCard {
  code: string;
  rawTitle: string;
  priceYen: number;
  img: string;
}

async function fetchSetFromYuyu(set: string): Promise<YuyuCard[]> {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${set}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'ja,en;q=0.9'
    }
  });
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
  return cards;
}

async function testMatch() {
  const eb01Cards = await fetchSetFromYuyu('EB01');
  console.log(`Fetched ${eb01Cards.length} cards from EB01.`);

  // Find Chopper EB01-006 cards in Yuyu-tei
  const choppers = eb01Cards.filter(c => c.code === 'EB01-006');
  console.log('\n--- EB01-006 Choppers on Yuyu-tei ---');
  console.table(choppers);

  // Find DB cards for EB01-006
  const dbChoppers = await prisma.card.findMany({
    where: { id: { contains: 'EB01-006' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true }
  });
  console.log('\n--- EB01-006 in Database ---');
  console.table(dbChoppers);

  await prisma.$disconnect();
}

testMatch();
