import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = 'file:C:/Users/kyle/.gemini/antigravity/scratch/optcg-app/prisma/dev.db';
const prisma = new PrismaClient();

interface ScrapedDon {
  folder: string;
  productId: string;
  title: string;
  price: number | null;
  imgUrl: string;
  url: string;
}

const FOLDER_PACK_MAP: Record<string, { code: string; defaultPackId: string }> = {
  op01: { code: 'OP-01', defaultPackId: '569101' },
  op02: { code: 'OP-02', defaultPackId: '569102' },
  op03: { code: 'OP-03', defaultPackId: '569103' },
  op04: { code: 'OP-04', defaultPackId: '569104' },
  op05: { code: 'OP-05', defaultPackId: '569105' },
  op06: { code: 'OP-06', defaultPackId: '569106' },
  op07: { code: 'OP-07', defaultPackId: '569107' },
  op08: { code: 'OP-08', defaultPackId: '569108' },
  op09: { code: 'OP-09', defaultPackId: '569109' },
  op10: { code: 'OP-10', defaultPackId: '569110' },
  op11: { code: 'OP-11', defaultPackId: '569111' },
  op12: { code: 'OP-12', defaultPackId: '569112' },
  op13: { code: 'OP-13', defaultPackId: '569113' },
  op14: { code: 'OP-14', defaultPackId: '569114' },
  op15: { code: 'OP-15', defaultPackId: '569115' },
  op16: { code: 'OP-16', defaultPackId: '569116' },
  op17: { code: 'OP-17', defaultPackId: '569117' },
  eb03: { code: 'EB-03', defaultPackId: '569203' },
  eb04: { code: 'EB-04', defaultPackId: '569204' },
  prb01: { code: 'PRB-01', defaultPackId: '569301' },
  prb02: { code: 'PRB-02', defaultPackId: '569302' },
  don: { code: 'SPECIAL', defaultPackId: '569801' },
};

async function scrapeYuyuteiDonCards(): Promise<ScrapedDon[]> {
  const url = 'https://yuyu-tei.jp/sell/opc/s/search?search_word=%E3%83%89%E3%83%B3%21%21%E3%82%AB%E3%83%BC%E3%83%89';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();

  const regex = /<a\s+href="https:\/\/yuyu-tei\.jp\/sell\/opc\/card\/([^\/"]+)\/(\d+)"[^>]*>[\s\S]*?<img\s+src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<h4[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/gi;

  let match;
  const cards: ScrapedDon[] = [];
  while ((match = regex.exec(html)) !== null) {
    const [, folder, productId, imgSrc, alt, titleRaw, priceRaw] = match;
    const title = titleRaw.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
    const price = parseInt(priceRaw.replace(/[^0-9]/g, ''), 10) || null;
    const bigImg = imgSrc.replace('/100_140/', '/front/');
    cards.push({
      folder,
      productId,
      title,
      price,
      imgUrl: bigImg,
      url: `https://yuyu-tei.jp/sell/opc/card/${folder}/${productId}`
    });
  }

  return cards;
}

function assignCardId(folder: string, indexInFolder: number, card: ScrapedDon, folderCards: ScrapedDon[]): string {
  if (folder === 'don') {
    const num = parseInt(card.productId, 10) - 10000;
    return `DON-${String(num).padStart(3, '0')}`;
  }

  const prefix = folder.toUpperCase();

  // For PRB01 and PRB02: 30 characters x 3 (Base, Parallel, Super Parallel)
  if (folder === 'prb01' || folder === 'prb02') {
    const charIndex = Math.floor(indexInFolder / 3) + 1;
    const variantIndex = indexInFolder % 3;
    const baseId = `${prefix}-DON-${String(charIndex).padStart(2, '0')}`;
    if (variantIndex === 0) return baseId;
    if (variantIndex === 1) return `${baseId}_p1`;
    return `${baseId}_p2`;
  }

  // For EB03: 4 characters x 2 (Base, Super Parallel)
  if (folder === 'eb03') {
    const charIndex = Math.floor(indexInFolder / 2) + 1;
    const isSuper = indexInFolder % 2 === 1;
    const baseId = `${prefix}-DON-${String(charIndex).padStart(2, '0')}`;
    return isSuper ? `${baseId}_p1` : baseId;
  }

  // For EB04: 1 card x 2 (Base, Super Parallel)
  if (folder === 'eb04') {
    return indexInFolder === 0 ? 'EB04-DON-01' : 'EB04-DON-01_p1';
  }

  // For OP17: 4 pairs (Base, Super Parallel)
  if (folder === 'op17') {
    const charIndex = Math.floor(indexInFolder / 2) + 1;
    const isSuper = indexInFolder % 2 === 1;
    const baseId = `OP17-DON-${String(charIndex).padStart(2, '0')}`;
    return isSuper ? `${baseId}_p1` : baseId;
  }

  // For OP13, OP14, OP15, OP16: 2 cards each (Base, Super Parallel)
  if (['op13', 'op14', 'op15', 'op16'].includes(folder)) {
    return indexInFolder === 0 ? `${prefix}-DON-01` : `${prefix}-DON-01_p1`;
  }

  // For OP01: 2 different DON cards
  if (folder === 'op01') {
    return `${prefix}-DON-0${indexInFolder + 1}`;
  }

  // For OP02 - OP12: 1 DON card each
  return `${prefix}-DON-01`;
}

async function main() {
  console.log('🚀 Starting complete DON cards scrape and database synchronization...');
  const scrapedCards = await scrapeYuyuteiDonCards();
  console.log(`✨ Successfully scraped ${scrapedCards.length} genuine DON cards from Yu-Yu-Tei.`);

  // Group by folder and sort by productId
  const byFolder: Record<string, ScrapedDon[]> = {};
  for (const c of scrapedCards) {
    if (!byFolder[c.folder]) byFolder[c.folder] = [];
    byFolder[c.folder].push(c);
  }

  // Remove old or misattributed DON cards
  console.log('🗑️ Removing old or misattributed DON cards...');
  const deleteResult = await prisma.card.deleteMany({
    where: {
      OR: [
        { category: 'DON!!' },
        { id: { contains: 'DON' } }
      ]
    }
  });
  console.log(`Deleted ${deleteResult.count} previous DON records.`);

  // Fetch all packs to connect properly
  const packs = await prisma.pack.findMany();
  const packMapByCode = new Map(packs.map(p => [p.code.toUpperCase(), p]));
  const packMapById = new Map(packs.map(p => [p.id, p]));

  let insertedCount = 0;

  for (const [folder, list] of Object.entries(byFolder)) {
    list.sort((a, b) => parseInt(a.productId, 10) - parseInt(b.productId, 10));

    const mapping = FOLDER_PACK_MAP[folder];
    const pack = packMapByCode.get(mapping?.code || '') || packMapById.get(mapping?.defaultPackId || '');
    if (!pack) {
      console.warn(`⚠️ Could not find pack for folder ${folder}`);
      continue;
    }

    for (let i = 0; i < list.length; i++) {
      const don = list[i];
      const cardId = assignCardId(folder, i, don, list);

      const isSuperParallel = don.title.includes('スーパーパラレル');
      const isParallel = don.title.includes('パラレル') || don.title.includes('箔押し');
      const isAltArt = isParallel || isSuperParallel;

      const printingType = isSuperParallel ? 'Super Parallel' : isParallel ? 'Parallel' : 'Original';
      const rarity = isSuperParallel ? 'Special' : isParallel ? 'Parallel' : 'Common';

      // Clean name: replace Japanese ドン!!カード with English DON!! Card
      let cleanName = don.title.replace(/^ドン!!カード\s*/, 'DON!! Card ');

      const releaseDate = pack.releaseDate || '2024-01-01';
      const releaseOrder = pack.releaseOrder || 20240101;

      // Check if artist is Oda (for OP17-DON-_p1 cards)
      const isOda = cardId.startsWith('OP17-DON') && cardId.endsWith('_p1');
      const artistName = isOda ? 'Eiichiro Oda' : null;

      await prisma.card.create({
        data: {
          id: cardId,
          packId: pack.id,
          name: cleanName,
          category: 'DON!!',
          colors: 'Colorless',
          rarity,
          imageUrl: don.imgUrl,
          isAltArt,
          printingType,
          yuyuPrice: don.price,
          marketPrice: don.price ? Math.round((don.price / 150) * 100) / 100 : null,
          hasJpPrint: true,
          releaseDate,
          releaseOrder,
          cardNumber: cardId.split('_')[0],
          printedSetCode: 'DON',
          originalSet: mapping.code === 'SPECIAL' ? 'DON' : mapping.code,
          displaySet: mapping.code === 'SPECIAL' ? 'DON' : mapping.code,
          yuyuteiSet: mapping.code === 'SPECIAL' ? 'DON' : mapping.code,
          yuyuteiTitle: don.title,
          yuyuteiUrl: don.url,
          artistName,
          artistVerificationStatus: isOda ? 'verified' : null,
        }
      });

      insertedCount++;
    }
  }

  console.log(`✅ Successfully inserted ${insertedCount} authentic DON!! cards into dev.db.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
