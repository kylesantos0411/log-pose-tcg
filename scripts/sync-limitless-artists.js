require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Canonical artist normalization map
const CANONICAL_ARTIST_MAP = {
  'akira egawa': 'Akira Egawa',
  'egawa akira': 'Akira Egawa',
  'eiichiro oda': 'Eiichiro Oda',
  'oda eiichiro': 'Eiichiro Oda',
  'sunohara': 'Sunohara',
  'makitoshi': 'Makitoshi',
  'bashikou': 'BASHIKOU',
  'otton': 'Otton',
  'anderson': 'Anderson',
  'nijihayashi': 'Nijihayashi',
  'ryuda': 'Ryuda',
  'kawayoo': 'kawayoo',
  'naochika morishita': 'Naochika Morishita',
  'morishita naochika': 'Naochika Morishita',
  'hayaken-sarena': 'Hayaken-sarena',
  'hayaken sarena': 'Hayaken-sarena',
  'bisai': 'BISAI',
  'suzume sakuragi': 'Suzume Sakuragi',
  'tapioca': 'TAPIOCA',
  'sowsow': 'SOWSOW',
  'tatsuya': 'tatsuya',
  'hashimoto q': 'Hashimoto Q',
  'k akagishi': 'K Akagishi',
  'akanegumo': 'Akanegumo',
  'yoko akiyama': 'Yoko Akiyama',
  'gege akutami': 'Gege Akutami',
  'noriko asaka': 'Noriko Asaka',
  'yosuke adachi': 'Yosuke Adachi',
  'yoichi amano': 'Yoichi Amano',
  'kento amemiya': 'Kento Amemiya',
  'keisuke itagaki': 'KEISUKE ITAGAKI',
  'kisuke': 'KISUKE',
  'shie nanahara': 'Shie Nanahara',
  'mutsumi sasaki': 'Mutsumi Sasaki',
  'houkiboshi': 'HOUKIBOSHI',
  'masami onishi': 'Masami Onishi',
  'mitsuhiro arita': 'Mitsuhiro Arita',
  'daisuke izuka': 'Daisuke Izuka',
  'nuisuke': 'Nuisuke',
  'senki': 'SENKI',
  'shinichirou otsuka': 'Shinichirou Otsuka',
  'so-taro': 'SO-TARO',
  'tasuku': 'Tasuku',
  'tono': 'TONO',
  'yumik': 'Yumik',
  'nakamaru': 'Nakamaru',
  'coga': 'COGA',
  'dai-xt.': 'DAI-XT.',
  'asaki kuroda': 'Asaki Kuroda',
  'hatori kyoka': 'Hatori Kyoka',
  'koushi rokushiro': 'Koushi Rokushiro',
  'suzume muraichi': 'Suzume Muraichi',
  'tanaka kenichi': 'Tanaka Kenichi',
  'akihiro miyano': 'Akihiro MIYANO',
  'naruse uroko': 'Naruse Uroko',
  'aidle co. ltd.': 'Aidle Co. Ltd.',
  'studio vigor co. ltd': 'Studio Vigor Co. Ltd',
};

function normalizeArtist(raw) {
  if (!raw) return null;
  const clean = raw.trim().replace(/^by\s+/i, '');
  const lower = clean.toLowerCase();
  if (CANONICAL_ARTIST_MAP[lower]) {
    return CANONICAL_ARTIST_MAP[lower];
  }
  // Title case if in ALL CAPS
  if (/^[A-Z0-9\s.\-]+$/.test(clean) && clean.length > 3) {
    return clean
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return clean;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchSetUrls() {
  console.log('Fetching set directory from Limitless TCG...');
  const res = await fetch('https://onepiece.limitlesstcg.com/cards', {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed to load sets list: ${res.statusText}`);
  const html = await res.text();

  const links = [...html.matchAll(/href="(\/cards\/([a-z0-9]+-[a-z0-9\-]+))"/gi)];
  const setPaths = Array.from(new Set(links.map((m) => m[1]))).filter(
    (u) => !u.includes('advanced') && !u.includes('promos')
  );
  console.log(`Discovered ${setPaths.length} card sets on Limitless TCG.`);
  return setPaths;
}

async function scrapeSetPage(setPath, isJp = false) {
  const langPrefix = isJp ? '/cards/jp/' : '/cards/';
  const cleanSlug = setPath.replace(/^\/cards\/(?:jp\/)?/, '');
  const targetUrl = `https://onepiece.limitlesstcg.com${langPrefix}${cleanSlug}?display=full&show=all&unique=prints`;

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return {};
    const html = await res.text();

    const cardProfiles = html.split('<div class="card-profile">').slice(1);
    const setMapping = {};

    for (const block of cardProfiles) {
      const idMatch = block.match(/<span class="card-text-id">\s*([A-Za-z0-9_\-]+)\s*<\/span>/i);
      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const artistMatch = block.match(/Illustrated by[\s\S]*?<a[^>]*>\s*([^<]+)\s*<\/a>/i);

      if (idMatch && artistMatch) {
        const baseId = idMatch[1].trim();
        const rawArtist = artistMatch[1].trim();
        const artist = normalizeArtist(rawArtist);

        if (!artist) continue;

        let finalCardId = baseId;
        if (imgMatch) {
          const pMatch = imgMatch[1].match(/\/([A-Za-z0-9\-]+(?:_p\d+)?)_(?:EN|JP)\.webp/i);
          if (pMatch && pMatch[1]) {
            finalCardId = pMatch[1];
          }
        }

        setMapping[finalCardId] = {
          artistName: artist,
          sourceUrl: targetUrl,
        };
      }
    }

    return setMapping;
  } catch (err) {
    console.warn(`Error scraping ${targetUrl}:`, err.message);
    return {};
  }
}

async function run() {
  console.log('====================================================');
  console.log(' LIMITLESS TCG -> LOG POSE TCG ARTIST DATA SYNC');
  console.log('====================================================');

  const setPaths = await fetchSetUrls();
  const allCardArtistMap = {};

  for (let i = 0; i < setPaths.length; i++) {
    const setPath = setPaths[i];
    console.log(`[${i + 1}/${setPaths.length}] Scraping set: ${setPath}...`);

    // Scrape English set
    const enMap = await scrapeSetPage(setPath, false);
    Object.assign(allCardArtistMap, enMap);

    // Scrape Japanese set (catches cards not yet out in EN or JP-exclusive arts)
    const jpMap = await scrapeSetPage(setPath, true);
    Object.assign(allCardArtistMap, jpMap);

    // Gentle delay to be respectful
    await new Promise((r) => setTimeout(r, 200));
  }

  // Also scrape Promos
  console.log('Scraping Promos sets...');
  const enPromos = await scrapeSetPage('/cards/promos', false);
  const jpPromos = await scrapeSetPage('/cards/promos', true);
  Object.assign(allCardArtistMap, enPromos, jpPromos);

  const totalMapped = Object.keys(allCardArtistMap).length;
  console.log(`\nCollected ${totalMapped} total verified card-artist mappings!`);

  // Update Database
  console.log('Updating database records...');
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [cardId, data] of Object.entries(allCardArtistMap)) {
    try {
      // Check if card exists in DB (either direct ID, or ID with underscore, e.g. OP05-119_p1)
      const existing = await prisma.card.findFirst({
        where: {
          OR: [
            { id: cardId },
            { id: cardId.replace(/_p/, '_p') },
            { id: cardId.replace(/_p/, 'p') },
            { id: { startsWith: cardId } },
          ],
        },
        select: { id: true, artistName: true },
      });

      if (existing) {
        await prisma.card.update({
          where: { id: existing.id },
          data: {
            artistName: data.artistName,
            artistSource: 'Limitless TCG',
            artistSourceUrl: data.sourceUrl,
            artistVerificationStatus: 'verified',
          },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    } catch (e) {
      // ignore individual card error
    }
  }

  console.log('====================================================');
  console.log(`SYNC COMPLETE!`);
  console.log(`Cards successfully updated in Database: ${updatedCount}`);
  console.log(`Cards from external catalog not in local DB: ${skippedCount}`);

  // Query distinct artists in DB now
  const distinct = await prisma.card.findMany({
    where: { artistName: { not: null } },
    select: { artistName: true },
    distinct: ['artistName'],
  });
  console.log(`Total Distinct Artists now in Database: ${distinct.length}`);

  // Top artists sample
  const topArtists = await prisma.card.groupBy({
    by: ['artistName'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 15,
  });
  console.log('\nTop 15 Illustrators by Card Count:');
  topArtists.forEach((a, idx) => {
    console.log(`  ${idx + 1}. ${a.artistName}: ${a._count.id} cards`);
  });
  console.log('====================================================');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
