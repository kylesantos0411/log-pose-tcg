export interface ArtistProfile {
  name: string;
  style: string;
  bio: string;
  totalCards: number;
  featuredCards: Array<{
    id: string;
    name: string;
    rarity: string;
    marketPrice?: number;
  }>;
}

export const ARTIST_PROFILES: Record<string, ArtistProfile> = {
  'Eiichiro Oda': {
    name: 'Eiichiro Oda',
    style: 'Original Manga Ink, Signature Inscription, Master Penmanship',
    bio: 'The legendary creator and author of ONE PIECE. Direct manga panel art and exclusive anniversary signed masterworks prized as the holy grail of One Piece collecting.',
    totalCards: 14,
    featuredCards: [
      { id: 'OP05-119_p1', name: 'Monkey.D.Luffy (Manga Gear 5)', rarity: 'SecretRare', marketPrice: 2400.00 },
      { id: 'OP01-120_p1', name: 'Shanks (Manga)', rarity: 'SecretRare', marketPrice: 1450.00 },
      { id: 'OP02-013_p1', name: 'Portgas.D.Ace (Manga)', rarity: 'SuperRare', marketPrice: 980.00 },
      { id: 'OP06-118_p1', name: 'Roronoa Zoro (Manga)', rarity: 'SecretRare', marketPrice: 1200.00 },
      { id: 'OP07-051_p3', name: 'Boa Hancock (Manga)', rarity: 'Special', marketPrice: 1100.00 },
      { id: 'OP08-118_p1', name: 'Silvers Rayleigh (Manga)', rarity: 'SecretRare', marketPrice: 950.00 },
      { id: 'OP09-118_p3', name: 'Gol.D.Roger (Manga)', rarity: 'Special', marketPrice: 1300.00 },
      { id: 'OP10-119_p1', name: 'Trafalgar Law (Manga)', rarity: 'SecretRare', marketPrice: 1050.00 },
    ],
  },
  Sunohara: {
    name: 'Sunohara',
    style: 'Vibrant Watercolor, Fluid Light, Expressive Heroines',
    bio: 'Acclaimed illustrator celebrated for luminous color palettes, fluid lighting effects, and iconic heroine parallel arts across the One Piece Card Game.',
    totalCards: 9,
    featuredCards: [
      { id: 'OP01-016_p1', name: 'Nami (Parallel)', rarity: 'Rare', marketPrice: 280.00 },
      { id: 'OP01-078_p1', name: 'Boa Hancock (Parallel)', rarity: 'SuperRare', marketPrice: 190.00 },
      { id: 'OP01-121_p1', name: 'Yamato (Parallel)', rarity: 'SecretRare', marketPrice: 220.00 },
      { id: 'OP02-120_p1', name: 'Uta (Parallel)', rarity: 'SecretRare', marketPrice: 140.00 },
      { id: 'OP06-093_p1', name: 'Perona (Parallel)', rarity: 'SuperRare', marketPrice: 210.00 },
      { id: 'OP07-019_p1', name: 'Jewelry Bonney (Parallel)', rarity: 'Leader', marketPrice: 165.00 },
      { id: 'OP08-106_p1', name: 'Nami (Parallel)', rarity: 'SuperRare', marketPrice: 175.00 },
    ],
  },
  'Akira Egawa': {
    name: 'Akira Egawa',
    style: 'Dramatic Lighting, Painterly Fantasy, Fire & Volumetric Glow',
    bio: 'Renowned international fantasy and TCG painter distinguished for cinematic atmosphere, volumetric lighting, and dramatic fire compositions.',
    totalCards: 8,
    featuredCards: [
      { id: 'OP01-120_p2', name: 'Shanks (Secret Parallel)', rarity: 'SecretRare', marketPrice: 320.00 },
      { id: 'OP02-013_p2', name: 'Portgas.D.Ace (Parallel)', rarity: 'SuperRare', marketPrice: 145.00 },
      { id: 'OP04-083_p2', name: 'Sabo (Parallel)', rarity: 'SuperRare', marketPrice: 85.00 },
      { id: 'OP05-069_p1', name: 'Trafalgar Law (Parallel)', rarity: 'SuperRare', marketPrice: 115.00 },
      { id: 'OP07-001_p1', name: 'Monkey.D.Dragon (Leader Alt)', rarity: 'Leader', marketPrice: 95.00 },
    ],
  },
  Makitoshi: {
    name: 'Makitoshi',
    style: 'Classic Pirate Portrayal, Textured Brushwork, Regal Aura',
    bio: 'Veteran card illustrator known for textured portraits, commanding presence, and iconic historical compositions across the Four Emperors and Marines.',
    totalCards: 9,
    featuredCards: [
      { id: 'OP01-120', name: 'Shanks (Secret Rare)', rarity: 'SecretRare', marketPrice: 125.00 },
      { id: 'OP02-001_p1', name: 'Edward.Newgate (Leader Alt)', rarity: 'Leader', marketPrice: 145.00 },
      { id: 'OP02-004_p1', name: 'Edward.Newgate (SR Alt)', rarity: 'SuperRare', marketPrice: 95.00 },
      { id: 'OP08-118', name: 'Silvers Rayleigh (Secret Rare)', rarity: 'SecretRare', marketPrice: 68.00 },
      { id: 'OP09-118', name: 'Gol.D.Roger (Secret Rare)', rarity: 'SecretRare', marketPrice: 85.00 },
    ],
  },
  BASHIKOU: {
    name: 'BASHIKOU',
    style: 'Dynamic Perspective, Comic Ink, High Energy Action',
    bio: 'Celebrated Japanese trading card illustrator renowned for extreme perspective, explosive foreshortening, and heavy comic ink technique across flagship sets.',
    totalCards: 10,
    featuredCards: [
      { id: 'OP01-025_p1', name: 'Roronoa Zoro (SR Alt)', rarity: 'SuperRare', marketPrice: 116.50 },
      { id: 'OP05-119', name: 'Monkey.D.Luffy (SEC Base)', rarity: 'SecretRare', marketPrice: 258.00 },
      { id: 'OP05-098_p1', name: 'Enel (Leader Alt)', rarity: 'Leader', marketPrice: 95.00 },
      { id: 'OP06-086_p1', name: 'Gecko Moria (SR Alt)', rarity: 'SuperRare', marketPrice: 80.00 },
      { id: 'EB04-054', name: 'Bartholomew Kuma (SP)', rarity: 'Rare', marketPrice: 84.50 },
    ],
  },
  Otton: {
    name: 'Otton',
    style: 'Expressive Character Emotion, Vibrant Poses, Clean Linework',
    bio: 'Popular illustrator celebrated for charismatic character expressions, dynamic leader poses, and iconic fan-favorite parallel arts.',
    totalCards: 8,
    featuredCards: [
      { id: 'OP02-026_p1', name: 'Sanji (Leader Alt Art)', rarity: 'Leader', marketPrice: 85.00 },
      { id: 'OP04-039_p1', name: 'Rebecca (Leader Alt Art)', rarity: 'Leader', marketPrice: 110.00 },
      { id: 'OP05-007_p1', name: 'Sabo (SR Alt Art)', rarity: 'SuperRare', marketPrice: 120.00 },
      { id: 'OP05-022_p1', name: 'Donquixote Rosinante (Leader Alt)', rarity: 'Leader', marketPrice: 65.00 },
      { id: 'OP06-001_p1', name: 'Uta (Leader Alt Art)', rarity: 'Leader', marketPrice: 135.00 },
    ],
  },
  Anderson: {
    name: 'Anderson',
    style: 'Impactful Leader Art, High Contrast Shading, Manga Action',
    bio: 'Renowned for commanding Leader card portraits with bold contrasting shadows and high-octane battle stances.',
    totalCards: 6,
    featuredCards: [
      { id: 'OP01-001_p1', name: 'Roronoa Zoro (Leader Alt)', rarity: 'Leader', marketPrice: 280.00 },
      { id: 'OP01-002_p1', name: 'Trafalgar Law (Leader Alt)', rarity: 'Leader', marketPrice: 195.00 },
      { id: 'OP01-060_p1', name: 'Donquixote Doflamingo (Leader Alt)', rarity: 'Leader', marketPrice: 160.00 },
      { id: 'OP03-077_p1', name: 'Charlotte Linlin (Leader Alt)', rarity: 'Leader', marketPrice: 75.00 },
    ],
  },
  Nijihayashi: {
    name: 'Nijihayashi',
    style: 'Clean Ink Lineart, Stylized Modern Shading, Dynamic Stances',
    bio: 'Acclaimed card artist known for razor-sharp character outlines and vibrant, commanding Leader and Character illustrations.',
    totalCards: 8,
    featuredCards: [
      { id: 'OP02-099_p1', name: 'Sakazuki (SR Alt)', rarity: 'SuperRare', marketPrice: 85.00 },
      { id: 'OP06-080_p1', name: 'Gecko Moria (Leader Alt)', rarity: 'Leader', marketPrice: 115.00 },
      { id: 'OP07-079_p1', name: 'Rob Lucci (Leader Alt)', rarity: 'Leader', marketPrice: 125.00 },
      { id: 'OP08-001_p1', name: 'Tony Tony.Chopper (Leader Alt)', rarity: 'Leader', marketPrice: 90.00 },
      { id: 'OP09-001_p1', name: 'Shanks (Leader Alt)', rarity: 'Leader', marketPrice: 140.00 },
    ],
  },
  Ryuda: {
    name: 'Ryuda',
    style: 'Moody Heavy Shadows, Fierce Expressions, Dramatic Depth',
    bio: 'Specialist in intense, gritty character portrayals featuring dramatic lighting and iconic warlord designs.',
    totalCards: 4,
    featuredCards: [
      { id: 'OP01-070_p1', name: 'Dracule Mihawk (SR Alt)', rarity: 'SuperRare', marketPrice: 90.00 },
      { id: 'OP02-071_p1', name: 'Magellan (Leader Alt)', rarity: 'Leader', marketPrice: 55.00 },
      { id: 'OP04-058_p1', name: 'Crocodile (Leader Alt)', rarity: 'Leader', marketPrice: 65.00 },
      { id: 'OP05-100_p1', name: 'Enel (SR Alt)', rarity: 'SuperRare', marketPrice: 75.00 },
    ],
  },
  kawayoo: {
    name: 'kawayoo',
    style: 'Intense Texture, Monster Action, High Kinetic Battle Energy',
    bio: 'Celebrated international TCG artist revered for brutal textured brushstrokes, overwhelming scale, and kinetic battle compositions.',
    totalCards: 5,
    featuredCards: [
      { id: 'ST04-001', name: 'Kaido (Leader)', rarity: 'Leader', marketPrice: 4.50 },
      { id: 'OP01-060', name: 'Donquixote Doflamingo (Leader)', rarity: 'Leader', marketPrice: 4.50 },
      { id: 'OP02-062', name: 'Monkey.D.Luffy (SR)', rarity: 'SuperRare', marketPrice: 8.00 },
      { id: 'OP07-064', name: 'Sanji (SR)', rarity: 'SuperRare', marketPrice: 18.00 },
      { id: 'OP08-067', name: 'Charlotte Pudding (Rare)', rarity: 'Rare', marketPrice: 12.00 },
    ],
  },
  'Naochika Morishita': {
    name: 'Naochika Morishita',
    style: 'Heavy Metallic Shading, Volumetric Perspective, Mechanical Force',
    bio: 'Master of heavyweight, metallic character renderings with imposing mass and hyper-detailed foreshortening.',
    totalCards: 5,
    featuredCards: [
      { id: 'OP01-051', name: 'Eustass"Captain"Kid (SR)', rarity: 'SuperRare', marketPrice: 12.00 },
      { id: 'OP03-078', name: 'Issho (SR)', rarity: 'SuperRare', marketPrice: 8.50 },
      { id: 'OP03-092', name: 'Rob Lucci (SR)', rarity: 'SuperRare', marketPrice: 9.00 },
      { id: 'OP05-002_p1', name: 'Belo Betty (Leader Alt)', rarity: 'Leader', marketPrice: 95.00 },
      { id: 'OP09-093', name: 'Marshall.D.Teach (SR)', rarity: 'SuperRare', marketPrice: 22.00 },
    ],
  },
  'Hayaken-sarena': {
    name: 'Hayaken-sarena',
    style: 'Clean Manga Lineart, Expressive Poses, Anime High Fidelity',
    bio: 'Celebrated illustrator known for crisp lines, iconic anime expressions, and balanced composition across characters and leaders.',
    totalCards: 5,
    featuredCards: [
      { id: 'OP01-004', name: 'Usopp (Rare)', rarity: 'Rare', marketPrice: 3.50 },
      { id: 'OP02-030', name: 'Kouzuki Oden (SR)', rarity: 'SuperRare', marketPrice: 14.00 },
      { id: 'OP05-060', name: 'Monkey.D.Luffy (Leader)', rarity: 'Leader', marketPrice: 6.00 },
      { id: 'OP06-021', name: 'Perona (Leader)', rarity: 'Leader', marketPrice: 8.00 },
      { id: 'OP07-040', name: 'Crocodile (Uncommon)', rarity: 'Uncommon', marketPrice: 2.50 },
    ],
  },
  'Bandai Namco / Toei Animation': {
    name: 'Bandai Namco / Toei Animation',
    style: 'Official Animation & Card Game Studio Graphics',
    bio: 'Official production artwork, animated feature stills, and core card game layout design by the official Bandai Namco Carddass and Toei Animation studios.',
    totalCards: 3200,
    featuredCards: [
      { id: 'OP01-001', name: 'Roronoa Zoro (Leader)', rarity: 'Leader', marketPrice: 4.50 },
      { id: 'ST01-001', name: 'Monkey.D.Luffy (Leader)', rarity: 'Leader', marketPrice: 3.50 },
      { id: 'OP01-016', name: 'Nami (Base Character)', rarity: 'Rare', marketPrice: 2.20 },
      { id: 'OP02-001', name: 'Edward.Newgate (Base Leader)', rarity: 'Leader', marketPrice: 4.00 },
    ],
  },
};

// Verified authentic card ID mappings for specific illustrators
export const EXACT_CARD_ARTISTS: Record<string, string> = {
  // === Eiichiro Oda (Manga Rares & Signed Special Rares) ===
  'OP01-120_p1': 'Eiichiro Oda', // Manga Shanks
  'OP02-013_p1': 'Eiichiro Oda', // Manga Ace
  'OP03-122_p1': 'Eiichiro Oda', // Manga Sogeking
  'ST01-012_p1': 'Eiichiro Oda', // Oda Signed Luffy Special
  'OP04-083_p1': 'Eiichiro Oda', // Manga Sabo
  'OP05-060_p1': 'Eiichiro Oda', // Oda Anniversary Signed Luffy
  'OP05-119_p1': 'Eiichiro Oda', // Manga Gear 5 Luffy
  'OP06-118_p1': 'Eiichiro Oda', // Manga Zoro
  'OP07-051_p3': 'Eiichiro Oda', // Manga Boa Hancock (Authentic Manga Rare ID)
  'OP07-119_p2': 'Eiichiro Oda', // Manga Ace (OP-07 Manga Rare)
  'OP08-118_p1': 'Eiichiro Oda', // Manga Silvers Rayleigh
  'OP09-118_p3': 'Eiichiro Oda', // Manga Gol.D.Roger
  'OP09-119_p4': 'Eiichiro Oda', // Manga Luffy (OP-09 Manga Rare)
  'OP10-119_p1': 'Eiichiro Oda', // Manga Trafalgar Law

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
  'OP01-094_p1': 'Makitoshi',
  'OP01-120': 'Makitoshi',
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
  'ST04-001': 'kawayoo',
  'OP01-060': 'kawayoo',
  'OP02-062': 'kawayoo',
  'OP07-064': 'kawayoo',
  'OP08-067': 'kawayoo',

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

export function getCardArtist(cardId: string, cardName: string = ''): ArtistProfile {
  const normId = (cardId || '').trim();

  // 1. Direct verified exact match
  if (EXACT_CARD_ARTISTS[normId]) {
    const artistName = EXACT_CARD_ARTISTS[normId];
    return ARTIST_PROFILES[artistName] || {
      name: artistName,
      style: 'Verified Card Illustrator',
      bio: `Official illustrator of card ${normId}.`,
      totalCards: 1,
      featuredCards: [],
    };
  }

  // 2. Strict Manga Rare detection (Eiichiro Oda only!)
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

  // 3. Default: All other standard cards are official Bandai / Toei Animation studio productions
  // Note: NEVER fall back to baseId or _p1, because different prints have completely different guest illustrators!
  return ARTIST_PROFILES['Bandai Namco / Toei Animation'];
}

/**
 * Returns all card IDs associated with a given artist name
 */
export function getCardIdsByArtist(artistName: string, allCards: Array<{ id: string; name: string }>): string[] {
  const targetLower = artistName.toLowerCase().trim();
  
  // If looking for Bandai / Toei Animation
  if (targetLower.includes('bandai') || targetLower.includes('toei') || targetLower.includes('animation') || targetLower.includes('official')) {
    return allCards
      .filter((c) => getCardArtist(c.id, c.name).name === 'Bandai Namco / Toei Animation')
      .map((c) => c.id);
  }

  return allCards
    .filter((c) => {
      const art = getCardArtist(c.id, c.name);
      return art.name.toLowerCase() === targetLower;
    })
    .map((c) => c.id);
}
