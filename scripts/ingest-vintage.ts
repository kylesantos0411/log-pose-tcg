import http from 'http';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } },
});

// Load verified First Stage prices from PriceCharting
const firstStagePricesFile = path.resolve(__dirname, '../scripts/first_stage_prices.json');

function httpGet(url: string, timeout = 12000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

// 19 Carddass Hyper Battle sets under idc=19
export const VINTAGE_HYPER_BATTLE_SETS = [
  { ids: '79', code: 'HB-01', name: 'First Stage', year: '1999', releaseDate: '1999-11-01', order: 0.01 },
  { ids: '81', code: 'HB-02', name: '2nd Stage', year: '2000', releaseDate: '2000-03-01', order: 0.02 },
  { ids: '99', code: 'HB-GB1', name: 'Grand Box', year: '2000', releaseDate: '2000-07-01', order: 0.03 },
  { ids: '100', code: 'HB-03', name: '3rd Stage', year: '2000', releaseDate: '2000-07-15', order: 0.04 },
  { ids: '101', code: 'HB-04', name: '4th Stage', year: '2000', releaseDate: '2000-11-01', order: 0.05 },
  { ids: '104', code: 'HB-GB2', name: 'Grand Box 2', year: '2000', releaseDate: '2000-12-01', order: 0.06 },
  { ids: '105', code: 'HB-05', name: '5th Stage', year: '2001', releaseDate: '2001-03-01', order: 0.07 },
  { ids: '106', code: 'HB-06', name: '6th Stage', year: '2001', releaseDate: '2001-07-01', order: 0.08 },
  { ids: '107', code: 'HB-GB3', name: 'Grand Box 3', year: '2001', releaseDate: '2001-08-01', order: 0.09 },
  { ids: '108', code: 'HB-07', name: '7th Stage', year: '2001', releaseDate: '2001-11-01', order: 0.10 },
  { ids: '109', code: 'HB-GB4', name: 'Grand Box 4', year: '2001', releaseDate: '2001-12-01', order: 0.11 },
  { ids: '110', code: 'HB-GL1', name: 'Grand Line Compilation 1', year: '2002', releaseDate: '2002-03-01', order: 0.12 },
  { ids: '111', code: 'HB-GL2', name: 'Grand Line Compilation 2', year: '2002', releaseDate: '2002-07-01', order: 0.13 },
  { ids: '112', code: 'HB-GB5', name: 'Grand Box 5', year: '2002', releaseDate: '2002-08-01', order: 0.14 },
  { ids: '113', code: 'HB-GL3', name: 'Grand Line Compilation 3', year: '2002', releaseDate: '2002-11-01', order: 0.15 },
  { ids: '114', code: 'HB-GBDX', name: 'Grand Box DX', year: '2002', releaseDate: '2002-12-01', order: 0.16 },
  { ids: '115', code: 'HB-TP1', name: 'Treasure Pack Volume 1', year: '2003', releaseDate: '2003-03-01', order: 0.17 },
  { ids: '117', code: 'HB-TP2', name: 'Treasure Pack Volume 2', year: '2004', releaseDate: '2004-07-01', order: 0.18 },
  { ids: '122', code: 'HB-PR', name: 'Promo', year: '2000-2005', releaseDate: '2000-01-01', order: 0.19 },
];

function mapCategory(typeStr: string): string {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('personnage') || t.includes('character')) return 'Character';
  if (t.includes('action') || t.includes('event')) return 'Event';
  if (t.includes('navire') || t.includes('stage')) return 'Stage';
  return 'Character';
}

function cleanCardName(rawName: string): string {
  return rawName
    .replace(/^Monkey\.?D\.?/i, 'Luffy')
    .replace(/^Roronoa\s*/i, '')
    .trim();
}

export function generateEbaySearchUrl(cardNumber: string, cardName: string): string {
  const cleanNum = cardNumber.trim();
  const cName = cleanCardName(cardName).split(' ')[0] || '';
  const query = `"One Piece" Carddass "${cleanNum}" ${cName} -OP01 -OP02 -OP03 -OP05 -EB01`;
  const params = new URLSearchParams({
    _nkw: query,
    LH_Complete: '1',
    LH_Sold: '1',
    _sop: '12',
  });
  return `https://www.ebay.com/sch/i.html?${params.toString()}`;
}

async function runWithConcurrency<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency = 8): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        const res = await fn(items[i]);
        results[i] = res;
      } catch (err) {
        console.error(`Error processing item ${i}:`, err);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('=== Starting Full Vintage Catalog & Pricing Ingestion ===');

  // Load verified prices if available
  let verifiedFirstStagePrices: Record<number, number> = {};
  if (fs.existsSync(firstStagePricesFile)) {
    verifiedFirstStagePrices = JSON.parse(fs.readFileSync(firstStagePricesFile, 'utf8'));
    console.log(`Loaded ${Object.keys(verifiedFirstStagePrices).length} verified First Stage prices.`);
  }

  let grandTotal = 0;

  for (const setDef of VINTAGE_HYPER_BATTLE_SETS) {
    const packId = `vintage-${setDef.code.toLowerCase()}`;
    const setPageUrl = `http://www.onepiececollection.fr/cartes.php?idc=19&ids=${setDef.ids}`;
    console.log(`\nFetching ${setDef.code}: ${setDef.name} (${setDef.year}) from ${setPageUrl}...`);

    let html = '';
    try {
      html = await httpGet(setPageUrl);
    } catch (err: any) {
      console.error(`Failed to fetch set page ${setDef.ids}:`, err.message);
      continue;
    }

    const regex = /<div[^>]+class="bc_texte_numero"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<img[^>]+id="img_([0-9]+)"[^>]+onclick="afficher_detail\('([0-9]+)','([^']+)'\);"[^>]+src="([^"]+)"/gi;
    let match;
    const rawCards: Array<{ cardNumber: string; internalId: string }> = [];

    while ((match = regex.exec(html)) !== null) {
      rawCards.push({
        cardNumber: match[1].trim(),
        internalId: match[2],
      });
    }

    console.log(`Found ${rawCards.length} cards in ${setDef.name}.`);

    // Upsert Pack
    await prisma.pack.upsert({
      where: { id: packId },
      update: {
        name: `Carddass Hyper Battle - ${setDef.name}`,
        code: setDef.code,
        seriesType: 'VINTAGE',
        cardsCount: rawCards.length,
        releaseDate: setDef.releaseDate,
        releaseOrder: setDef.order,
      },
      create: {
        id: packId,
        name: `Carddass Hyper Battle - ${setDef.name}`,
        code: setDef.code,
        seriesType: 'VINTAGE',
        cardsCount: rawCards.length,
        releaseDate: setDef.releaseDate,
        releaseOrder: setDef.order,
        language: 'jp',
      },
    });

    // Ingest cards in parallel
    let processed = 0;
    await runWithConcurrency(rawCards, async (raw) => {
      try {
        const detailHtml = await httpGet(
          `http://www.onepiececollection.fr/traitements_ajax/get_infos_detail_carte.php?id=${raw.internalId}`
        );

        const getVal = (label: string): string => {
          const r = new RegExp(`<td[^>]*class="apercu_td_intitule"[^>]*>\\s*${label}[^<]*<\\/td>\\s*<td[^>]*class="apercu_td_valeur"[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
          const m = detailHtml.match(r);
          return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
        };

        const numero = getVal('Num&eacute;ro :') || getVal('Numéro :') || raw.cardNumber;
        const nom = getVal('Nom :') || 'One Piece Character';
        const typeStr = getVal('Type :') || 'Personnage';
        const rarete = getVal('Raret&eacute; :') || getVal('Rareté :') || 'Regular';
        const caracteristiques = getVal('Caracteristiques :') || '';

        // Card ID format: e.g. HB01-C01, HB02-C35, HBGB1-C67, etc.
        const cleanSetCode = setDef.code.replace(/[^A-Z0-9]/g, '');
        const cleanCardNum = numero.toUpperCase().replace(/\s+/g, '');
        const cardUniqueId = `${cleanSetCode}-${cleanCardNum}`;

        const imageUrl = `http://www.onepiececollection.fr/cartes/19/${setDef.ids}/h400_${raw.internalId}_carte.jpg`;
        const highResUrl = `http://www.onepiececollection.fr/cartes/19/${setDef.ids}/h3000_${raw.internalId}_carte.jpg`;

        // Check if verified eBay price exists (from PriceCharting sales tracking)
        let ebayPrice: number | null = null;
        if (setDef.ids === '79') {
          const numDigits = parseInt(cleanCardNum.replace(/\D/g, ''), 10);
          if (numDigits && verifiedFirstStagePrices[numDigits] !== undefined) {
            ebayPrice = verifiedFirstStagePrices[numDigits];
          }
        }

        const ebayUrl = generateEbaySearchUrl(numero, nom);

        await prisma.card.upsert({
          where: { id: cardUniqueId },
          update: {
            name: nom,
            cardNumber: numero,
            category: mapCategory(typeStr),
            rarity: rarete === 'Holo' ? 'SecretRare' : 'Common',
            colors: 'Red',
            effect: caracteristiques ? `[Special Attack / Trait]: ${caracteristiques}` : null,
            imageUrl: imageUrl,
            artistSourceUrl: highResUrl,
            packId: packId,
            displaySet: `Carddass Hyper Battle - ${setDef.name}`,
            printedSetCode: setDef.code,
            releaseDate: setDef.releaseDate,
            releaseOrder: setDef.order,
            isVintage: true,
            vintageSeries: 'Carddass Hyper Battle',
            vintagePart: `${setDef.name} (${setDef.year})`,
            ebayPrice: ebayPrice,
            ebayUrl: ebayUrl,
            ebayLastUpdated: new Date(),
            // When ebayPrice is null, yuyuPrice is null (no fake price shown)
            yuyuPrice: ebayPrice ? Math.round(ebayPrice * 155) : null,
            marketPrice: ebayPrice,
          },
          create: {
            id: cardUniqueId,
            name: nom,
            cardNumber: numero,
            category: mapCategory(typeStr),
            rarity: rarete === 'Holo' ? 'SecretRare' : 'Common',
            colors: 'Red',
            effect: caracteristiques ? `[Special Attack / Trait]: ${caracteristiques}` : null,
            imageUrl: imageUrl,
            artistSourceUrl: highResUrl,
            packId: packId,
            displaySet: `Carddass Hyper Battle - ${setDef.name}`,
            printedSetCode: setDef.code,
            releaseDate: setDef.releaseDate,
            releaseOrder: setDef.order,
            isVintage: true,
            vintageSeries: 'Carddass Hyper Battle',
            vintagePart: `${setDef.name} (${setDef.year})`,
            ebayPrice: ebayPrice,
            ebayUrl: ebayUrl,
            ebayLastUpdated: new Date(),
            yuyuPrice: ebayPrice ? Math.round(ebayPrice * 155) : null,
            marketPrice: ebayPrice,
          },
        });

        processed++;
        grandTotal++;
        if (processed % 10 === 0 || processed === rawCards.length) {
          process.stdout.write(`\r  Progress ${setDef.code}: ${processed}/${rawCards.length} cards...`);
        }
      } catch (err: any) {
        console.error(`\n  Error ingesting card ${raw.internalId}:`, err.message);
      }
    }, 10);

    console.log(`\n  ✅ Ingested ${processed} cards for ${setDef.code}`);
  }

  console.log(`\n🎉 Ingestion complete! Total vintage cards ingested across all 19 sets: ${grandTotal}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
