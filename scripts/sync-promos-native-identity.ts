import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPromos() {
  console.log('Fetching Yuyutei Promos via search_word=P- ...');
  const url = 'https://yuyu-tei.jp/sell/opc/s/search?search_word=P-';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'ja,en;q=0.9',
    }
  });

  const html = await res.text();
  const blocks = html.split('class="card-product');
  console.log(`Found ${blocks.length - 1} promo blocks.`);

  let updated = 0;
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const cidM = b.match(/class="cart_cid"[^>]*value="([^"]+)"/) || 
                 b.match(/value="([^"]+)"\s+class="cart_cid"/) ||
                 b.match(/\/sell\/opc\/card\/[^\/]+\/([0-9]+)/);
    const verM = b.match(/class="cart_ver"[^>]*value="([^"]+)"/) || 
                 b.match(/value="([^"]+)"\s+class="cart_ver"/) ||
                 b.match(/\/sell\/opc\/card\/([^\/]+)\/[0-9]+/);
    const codeM = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleM = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const priceM = b.match(/([0-9,]+)\s*円/);

    if (cidM && codeM && priceM) {
      const productId = cidM[1].trim();
      const ver = verM ? verM[1].trim() : 'promo';
      const cardNumber = codeM[1].trim();
      const title = titleM ? titleM[1].trim() : '';
      const priceYen = parseInt(priceM[1].replace(/,/g, ''), 10);
      const productUrl = `https://yuyu-tei.jp/sell/opc/card/${ver}/${productId}`;
      const imgUrl = `https://card.yuyu-tei.jp/opc/front/${ver}/${productId}.jpg`;

      // Find matching promo card in DB
      const dbCards = await prisma.card.findMany({
        where: {
          OR: [
            { cardNumber },
            { id: cardNumber },
            { id: { startsWith: `${cardNumber}_` } }
          ]
        }
      });

      if (dbCards.length > 0) {
        // Find one that doesn't have a productId or matches this one
        let target = dbCards.find(c => c.yuyuteiProductId === productId);
        if (!target) {
          target = dbCards.find(c => !c.yuyuteiProductId);
        }

        if (target) {
          const usdPrice = Math.round((priceYen / 140) * 100) / 100;
          await prisma.card.update({
            where: { id: target.id },
            data: {
              yuyuteiProductId: productId,
              yuyuteiVer: ver,
              yuyuteiUrl: productUrl,
              yuyuteiTitle: title,
              yuyuteiRarity: 'Promo',
              yuyuPrice: priceYen,
              marketPrice: target.marketPrice && target.marketPrice > 0 && target.marketPrice >= usdPrice * 0.8
                ? target.marketPrice 
                : usdPrice,
            }
          });
          updated++;
        }
      }
    }
  }

  console.log(`✓ Bound ${updated} promo cards to native Yuyutei product IDs.`);
  await prisma.$disconnect();
}

syncPromos().catch(console.error);
