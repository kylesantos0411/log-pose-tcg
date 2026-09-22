const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fetchYuyuteiPromos() {
  console.log('🌐 Fetching all Promos from Yuyu-tei (search_word=P-)...');
  const url = 'https://yuyu-tei.jp/sell/opc/s/search?search_word=P-';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });
  const html = await res.text();
  const cardBlocks = html.split('class="card-product');
  console.log(`Fetched ${cardBlocks.length - 1} promo card blocks from Yuyu-tei.`);

  const promoCards = [];
  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);

    if (codeMatch && priceMatch) {
      const code = codeMatch[1].trim();
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const priceYen = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      const img = imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : null;

      promoCards.push({
        code,
        rawTitle,
        priceYen,
        img
      });
    }
  }

  // Group by base code e.g. P-041
  const grouped = {};
  for (const c of promoCards) {
    if (!grouped[c.code]) grouped[c.code] = [];
    grouped[c.code].push(c);
  }

  console.log(`Found ${Object.keys(grouped).length} unique promo base codes.`);
  
  // Inspect P-041 specifically
  console.log('\n--- P-041 from Yuyu-tei ---');
  console.log(grouped['P-041']);

  return { promoCards, grouped };
}

fetchYuyuteiPromos().then(() => prisma.$disconnect());
