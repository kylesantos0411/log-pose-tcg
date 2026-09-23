const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ARTIST_PROFILES = {
  'Eiichiro Oda': { name: 'Eiichiro Oda' },
  Sunohara: { name: 'Sunohara' },
  'Akira Egawa': { name: 'Akira Egawa' },
  Makitoshi: { name: 'Makitoshi' },
  BASHIKOU: { name: 'BASHIKOU' },
  Otton: { name: 'Otton' },
  Anderson: { name: 'Anderson' },
  Nijihayashi: { name: 'Nijihayashi' },
  Ryuda: { name: 'Ryuda' },
  kawayoo: { name: 'kawayoo' },
  'Naochika Morishita': { name: 'Naochika Morishita' },
  'Hayaken-sarena': { name: 'Hayaken-sarena' },
  'Bandai Namco / Toei Animation': { name: 'Bandai Namco / Toei Animation' }
};

const EXACT_CARD_ARTISTS = {
  // === Eiichiro Oda (Manga Rares & Signed Special Rares) ===
  'OP01-120_p1': 'Eiichiro Oda', // Manga Shanks
  'OP02-013_p1': 'Eiichiro Oda', // Manga Ace
  'OP03-122_p1': 'Eiichiro Oda', // Manga Sogeking
  'OP04-083_p1': 'Eiichiro Oda', // Manga Sabo
  'OP05-060_p1': 'Eiichiro Oda', // Oda Anniversary Signed Luffy
  'OP05-119_p1': 'Eiichiro Oda', // Manga Gear 5 Luffy
  'OP06-118_p1': 'Eiichiro Oda', // Manga Zoro
  'OP07-051_p3': 'Eiichiro Oda', // Manga Boa Hancock
  'OP07-119_p2': 'Eiichiro Oda', // Manga Ace (OP-07)
  'OP08-118_p1': 'Eiichiro Oda', // Manga Silvers Rayleigh
  'OP09-118_p3': 'Eiichiro Oda', // Manga Gol.D.Roger
  'OP09-119_p4': 'Eiichiro Oda', // Manga Luffy (OP-09)
  'OP10-119_p1': 'Eiichiro Oda', // Manga Trafalgar Law
  'ST01-012_p1': 'Eiichiro Oda', // Oda Signed Luffy Special

  // === Sunohara ===
  'OP01-016_p1': 'Sunohara',
  'OP01-078_p1': 'Sunohara',
  'OP01-121_p1': 'Sunohara',
  'OP02-120_p1': 'Sunohara',
  'OP05-034_p1': 'Sunohara',
  'OP06-022_p1': 'Sunohara',
  'OP06-093_p1': 'Sunohara',
  'OP07-019_p1': 'Sunohara',
  'OP08-106_p1': 'Sunohara',

  // === Akira Egawa ===
  'OP01-120_p2': 'Akira Egawa',
  'OP02-013_p2': 'Akira Egawa',
  'OP03-099_p1': 'Akira Egawa',
  'OP04-083_p2': 'Akira Egawa',
  'OP05-041_p1': 'Akira Egawa',
  'OP05-060_p2': 'Akira Egawa',
  'OP05-069_p1': 'Akira Egawa',
  'OP07-001_p1': 'Akira Egawa',

  // === Makitoshi ===
  'OP01-120': 'Makitoshi',
  'OP01-094_p1': 'Makitoshi',
  'OP02-001_p1': 'Makitoshi',
  'OP02-002_p1': 'Makitoshi',
  'OP02-004_p1': 'Makitoshi',
  'OP03-001_p1': 'Makitoshi',
  'OP05-001_p1': 'Makitoshi',
  'OP08-118': 'Makitoshi',
  'OP09-118': 'Makitoshi',

  // === BASHIKOU ===
  'OP01-025_p1': 'BASHIKOU',
  'OP01-047_p1': 'BASHIKOU',
  'OP01-051_p1': 'BASHIKOU',
  'OP03-099': 'BASHIKOU',
  'OP04-083': 'BASHIKOU',
  'OP05-098_p1': 'BASHIKOU',
  'OP05-119': 'BASHIKOU',
  'OP06-086_p1': 'BASHIKOU',
  'OP07-053': 'BASHIKOU',
  'EB04-054': 'BASHIKOU',

  // === Otton ===
  'OP01-014_p1': 'Otton',
  'OP01-017_p1': 'Otton',
  'OP02-026_p1': 'Otton',
  'OP04-039_p1': 'Otton',
  'OP05-006_p1': 'Otton',
  'OP05-007_p1': 'Otton',
  'OP05-022_p1': 'Otton',
  'OP06-001_p1': 'Otton',

  // === Anderson ===
  'OP01-001_p1': 'Anderson',
  'OP01-002_p1': 'Anderson',
  'OP01-060_p1': 'Anderson',
  'OP01-062_p1': 'Anderson',
  'OP03-077_p1': 'Anderson',
  'ST01-012_p2': 'Anderson',

  // === Nijihayashi ===
  'OP02-099_p1': 'Nijihayashi',
  'OP03-022_p1': 'Nijihayashi',
  'OP04-020_p1': 'Nijihayashi',
  'OP05-043_p1': 'Nijihayashi',
  'OP06-080_p1': 'Nijihayashi',
  'OP07-079_p1': 'Nijihayashi',
  'OP08-001_p1': 'Nijihayashi',
  'OP09-001_p1': 'Nijihayashi',

  // === Ryuda ===
  'OP01-070_p1': 'Ryuda',
  'OP02-071_p1': 'Ryuda',
  'OP04-058_p1': 'Ryuda',
  'OP05-100_p1': 'Ryuda',

  // === kawayoo ===
  'OP01-060': 'kawayoo',
  'OP02-062': 'kawayoo',
  'OP07-064': 'kawayoo',
  'OP08-067': 'kawayoo',
  'ST04-001': 'kawayoo',

  // === Naochika Morishita ===
  'OP01-051': 'Naochika Morishita',
  'OP03-078': 'Naochika Morishita',
  'OP03-092': 'Naochika Morishita',
  'OP05-002_p1': 'Naochika Morishita',
  'OP09-093': 'Naochika Morishita',

  // === Hayaken-sarena ===
  'OP01-004': 'Hayaken-sarena',
  'OP02-030': 'Hayaken-sarena',
  'OP05-060': 'Hayaken-sarena',
  'OP06-021': 'Hayaken-sarena',
  'OP07-040': 'Hayaken-sarena',
};

function getCardArtist(cardId, cardName = '') {
  const normId = (cardId || '').trim();
  if (EXACT_CARD_ARTISTS[normId]) {
    const artistName = EXACT_CARD_ARTISTS[normId];
    return ARTIST_PROFILES[artistName];
  }

  const lowerName = (cardName || '').toLowerCase();
  const isMangaRare = 
    lowerName.includes('(manga)') || 
    lowerName.includes('manga rare') ||
    lowerName.includes('manga alt') ||
    lowerName.includes('manga super rare') ||
    normId === 'OP05-060_p1';

  if (isMangaRare) {
    return ARTIST_PROFILES['Eiichiro Oda'];
  }

  return ARTIST_PROFILES['Bandai Namco / Toei Animation'];
}

function getCardIdsByArtist(artistName, allCards) {
  const targetLower = artistName.toLowerCase().trim();
  return allCards
    .filter(c => {
      const art = getCardArtist(c.id, c.name);
      return art.name.toLowerCase() === targetLower;
    })
    .map(c => c.id);
}

async function main() {
  const allCards = await prisma.card.findMany({
    select: { id: true, name: true, rarity: true, pack: { select: { code: true } } },
    where: { hasJpPrint: true, yuyuPrice: { not: null, gt: 0 } }
  });

  for (const artistName of Object.keys(ARTIST_PROFILES)) {
    if (artistName.includes('Bandai')) continue;
    const cardIds = getCardIdsByArtist(artistName, allCards);
    console.log(`\n=== ${artistName} (${cardIds.length} cards) ===`);
    const mapped = allCards.filter(c => cardIds.includes(c.id));
    mapped.forEach(c => {
      console.log(`  ${c.id.padEnd(14)} | ${c.name.padEnd(25)} | ${c.rarity.padEnd(12)} | ${c.pack?.code}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
