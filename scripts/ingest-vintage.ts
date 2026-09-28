import http from 'http';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } },
});

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Map French card types to app categories
function mapCategory(typeStr: string): string {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('personnage') || t.includes('character')) return 'Character';
  if (t.includes('action') || t.includes('event')) return 'Event';
  if (t.includes('navire') || t.includes('stage')) return 'Stage';
  return 'Character';
}

// Generate strict eBay sold search URL for exact card match
export function generateEbaySearchUrl(cardNumber: string, cardName: string, series = 'Hyper Battle'): string {
  const cleanNum = cardNumber.trim();
  const cleanName = cardName.trim();
  // Target query: "One Piece" Carddass "Hyper Battle" "C01" Luffy -OP01 -OP05
  const query = `"One Piece" Carddass "${series}" "${cleanNum}" ${cleanName} -OP01 -OP02 -OP03 -OP05 -EB01`;
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1`;
}

// Baseline estimated eBay market price in USD based on vintage card rarity and character
function estimateEbayPrice(cardNumber: string, cardName: string, rarity: string): number {
  const isHolo = rarity.toLowerCase().includes('holo') || rarity.toLowerCase().includes('prism');
  const name = cardName.toLowerCase();

  if (isHolo) {
    if (name.includes('luffy')) return 45.00;
    if (name.includes('zoro') || name.includes('shanks')) return 35.00;
    if (name.includes('nami')) return 30.00;
    return 20.00;
  }

  // Regulars
  if (name.includes('luffy')) return 8.00;
  if (name.includes('zoro') || name.includes('shanks') || name.includes('nami')) return 6.00;
  return 3.50;
}

async function main() {
  console.log('Fetching Carddass Hyper Battle - First Stage (Part 1)...');
  const mainHtml = await httpGet('http://www.onepiececollection.fr/cartes.php?idc=19&ids=79');

  // Match each card cell
  const regex = /<div[^>]+class="bc_texte_numero"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<img[^>]+id="img_([0-9]+)"[^>]+onclick="afficher_detail\('([0-9]+)','([^']+)'\);"[^>]+src="([^"]+)"/gi;
  let match;
  const rawCards: Array<{
    cardNumber: string;
    internalId: string;
    zoomPath: string;
  }> = [];

  while ((match = regex.exec(mainHtml)) !== null) {
    rawCards.push({
      cardNumber: match[1].trim(),
      internalId: match[2],
      zoomPath: match[4],
    });
  }

  console.log(`Found ${rawCards.length} cards on onepiececollection.fr page.`);

  // Upsert Pack
  const packId = 'vintage-hb-01';
  await prisma.pack.upsert({
    where: { id: packId },
    update: {
      name: 'Carddass Hyper Battle - First Stage',
      code: 'HB-01',
      seriesType: 'VINTAGE',
      cardsCount: rawCards.length,
      releaseDate: '1999-11-01',
      releaseOrder: 0.01,
    },
    create: {
      id: packId,
      name: 'Carddass Hyper Battle - First Stage',
      code: 'HB-01',
      seriesType: 'VINTAGE',
      cardsCount: rawCards.length,
      releaseDate: '1999-11-01',
      releaseOrder: 0.01,
      language: 'jp',
    },
  });

  console.log(`Pack "${packId}" ready. Ingesting cards...`);

  let count = 0;
  for (const raw of rawCards) {
    try {
      // Fetch details via ajax endpoint
      const detailHtml = await httpGet(
        `http://www.onepiececollection.fr/traitements_ajax/get_infos_detail_carte.php?id=${raw.internalId}`
      );

      // Parse fields from table
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
      
      const cardUniqueId = `HB01-${numero.toUpperCase().replace(/\s+/g, '')}`;
      const imageUrl = `http://www.onepiececollection.fr/cartes/19/79/h400_${raw.internalId}_carte.jpg`;
      const highResUrl = `http://www.onepiececollection.fr/cartes/19/79/h3000_${raw.internalId}_carte.jpg`;
      
      const ebayPrice = estimateEbayPrice(numero, nom, rarete);
      const ebayUrl = generateEbaySearchUrl(numero, nom, 'Hyper Battle');

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
          displaySet: 'Carddass Hyper Battle - First Stage',
          printedSetCode: 'HB-01',
          releaseDate: '1999-11-01',
          releaseOrder: 0.01,
          isVintage: true,
          vintageSeries: 'Carddass Hyper Battle',
          vintagePart: 'First Stage (1999)',
          ebayPrice: ebayPrice,
          ebayUrl: ebayUrl,
          ebayLastUpdated: new Date(),
          yuyuPrice: Math.round(ebayPrice * 155), // Estimated JPY equivalent for seamless sorting
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
          displaySet: 'Carddass Hyper Battle - First Stage',
          printedSetCode: 'HB-01',
          releaseDate: '1999-11-01',
          releaseOrder: 0.01,
          isVintage: true,
          vintageSeries: 'Carddass Hyper Battle',
          vintagePart: 'First Stage (1999)',
          ebayPrice: ebayPrice,
          ebayUrl: ebayUrl,
          ebayLastUpdated: new Date(),
          yuyuPrice: Math.round(ebayPrice * 155),
        },
      });

      count++;
      process.stdout.write(`\rIngested ${count}/${rawCards.length}: ${cardUniqueId} (${nom} - ${rarete} - $${ebayPrice})   `);
    } catch (err: any) {
      console.error(`\nError ingesting card ${raw.internalId}:`, err.message);
    }
  }

  console.log(`\n\n✅ Finished ingesting ${count} vintage cards from Carddass Hyper Battle First Stage!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
