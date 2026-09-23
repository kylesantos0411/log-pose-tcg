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
    totalCards: 24,
    featuredCards: [
      { id: 'OP05-119_p1', name: 'Monkey.D.Luffy (Manga Gear 5)', rarity: 'Special', marketPrice: 2400.00 },
      { id: 'OP01-120_p1', name: 'Shanks (Manga)', rarity: 'Special', marketPrice: 1450.00 },
      { id: 'OP02-013_p1', name: 'Portgas.D.Ace (Manga)', rarity: 'Special', marketPrice: 980.00 },
      { id: 'OP06-118_p1', name: 'Roronoa Zoro (Manga)', rarity: 'Special', marketPrice: 1200.00 },
      { id: 'OP07-119_p1', name: 'Boa Hancock (Manga)', rarity: 'Special', marketPrice: 1100.00 },
      { id: 'OP08-118_p1', name: 'Silvers Rayleigh (Manga)', rarity: 'Special', marketPrice: 950.00 },
    ],
  },
  Sunohara: {
    name: 'Sunohara',
    style: 'Vibrant Watercolor, Fluid Light, Expressive Heroines',
    bio: 'Acclaimed illustrator celebrated for luminous color palettes, fluid lighting effects, and iconic heroine parallel arts across the One Piece Card Game.',
    totalCards: 38,
    featuredCards: [
      { id: 'OP01-016_p1', name: 'Nami (Parallel)', rarity: 'Rare', marketPrice: 280.00 },
      { id: 'OP01-078_p1', name: 'Boa Hancock (Parallel)', rarity: 'SuperRare', marketPrice: 190.00 },
      { id: 'OP01-121_p1', name: 'Yamato (Parallel)', rarity: 'SecretRare', marketPrice: 220.00 },
      { id: 'OP07-019_p1', name: 'Jewelry Bonney (Parallel)', rarity: 'SuperRare', marketPrice: 165.00 },
      { id: 'OP06-093_p1', name: 'Perona (Parallel)', rarity: 'Special', marketPrice: 210.00 },
    ],
  },
  'Akira Egawa': {
    name: 'Akira Egawa',
    style: 'Dramatic Lighting, Painterly Fantasy, Fire & Volumetric Glow',
    bio: 'Renowned international fantasy and TCG painter distinguished for cinematic atmosphere, volumetric lighting, and dramatic fire compositions.',
    totalCards: 32,
    featuredCards: [
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
    totalCards: 44,
    featuredCards: [
      { id: 'OP01-120', name: 'Shanks (Secret Rare)', rarity: 'SecretRare', marketPrice: 125.00 },
      { id: 'OP02-001_p1', name: 'Edward.Newgate (Leader Alt)', rarity: 'Leader', marketPrice: 145.00 },
      { id: 'OP02-004_p1', name: 'Edward.Newgate (SR Alt)', rarity: 'SuperRare', marketPrice: 95.00 },
      { id: 'OP08-118', name: 'Silvers Rayleigh (Secret Rare)', rarity: 'SecretRare', marketPrice: 68.00 },
    ],
  },
  BASHIKOU: {
    name: 'BASHIKOU',
    style: 'Dynamic Perspective, Comic Ink, High Energy Action',
    bio: 'Celebrated Japanese trading card illustrator renowned for extreme perspective, explosive foreshortening, and heavy comic ink technique across flagship sets.',
    totalCards: 52,
    featuredCards: [
      { id: 'EB04-054', name: 'Bartholomew Kuma (SP)', rarity: 'Special', marketPrice: 84.50 },
      { id: 'OP05-119', name: 'Monkey.D.Luffy (SEC Base)', rarity: 'SecretRare', marketPrice: 258.00 },
      { id: 'OP01-025_p1', name: 'Roronoa Zoro (SR Alt)', rarity: 'SuperRare', marketPrice: 116.50 },
      { id: 'OP03-099', name: 'Charlotte Katakuri (SEC Base)', rarity: 'SecretRare', marketPrice: 48.00 },
    ],
  },
  Otton: {
    name: 'Otton',
    style: 'Expressive Character Emotion, Vibrant Poses, Clean Linework',
    bio: 'Popular illustrator celebrated for charismatic character expressions, dynamic leader poses, and iconic fan-favorite parallel arts.',
    totalCards: 28,
    featuredCards: [
      { id: 'OP05-007_p1', name: 'Sabo (Character Alt Art)', rarity: 'Special', marketPrice: 120.00 },
      { id: 'OP06-001_p1', name: 'Uta (Leader Alt Art)', rarity: 'Leader', marketPrice: 135.00 },
      { id: 'OP04-039_p1', name: 'Rebecca (Leader Alt Art)', rarity: 'Leader', marketPrice: 110.00 },
      { id: 'OP05-022_p1', name: 'Baby 5 (Parallel)', rarity: 'Rare', marketPrice: 65.00 },
    ],
  },
  Anderson: {
    name: 'Anderson',
    style: 'Impactful Leader Art, High Contrast Shading, Manga Action',
    bio: 'Renowned for commanding Leader card portraits with bold contrasting shadows and high-octane battle stances.',
    totalCards: 26,
    featuredCards: [
      { id: 'OP01-001_p1', name: 'Roronoa Zoro (Leader Alt)', rarity: 'Leader', marketPrice: 280.00 },
      { id: 'OP01-002_p1', name: 'Trafalgar Law (Leader Alt)', rarity: 'Leader', marketPrice: 195.00 },
      { id: 'OP01-060_p1', name: 'Donquixote Doflamingo (Leader Alt)', rarity: 'Leader', marketPrice: 160.00 },
      { id: 'OP05-041_p1', name: 'Sakazuki (Leader Alt)', rarity: 'Leader', marketPrice: 140.00 },
    ],
  },
  Nijihayashi: {
    name: 'Nijihayashi',
    style: 'Clean Ink Lineart, Stylized Modern Shading, Dynamic Stances',
    bio: 'Acclaimed card artist known for razor-sharp character outlines and vibrant, commanding Leader and Character illustrations.',
    totalCards: 24,
    featuredCards: [
      { id: 'OP02-099_p1', name: 'Smoker (Leader Alt)', rarity: 'Leader', marketPrice: 85.00 },
      { id: 'OP05-043_p1', name: 'Enel (Parallel)', rarity: 'SuperRare', marketPrice: 95.00 },
      { id: 'OP07-040_p1', name: 'Boa Hancock (Leader Alt)', rarity: 'Leader', marketPrice: 155.00 },
    ],
  },
  Ryuda: {
    name: 'Ryuda',
    style: 'Moody Heavy Shadows, Fierce Expressions, Dramatic Depth',
    bio: 'Specialist in intense, gritty character portrayals featuring dramatic lighting and iconic warlord designs.',
    totalCards: 20,
    featuredCards: [
      { id: 'OP01-070_p1', name: 'Dracule Mihawk (Parallel)', rarity: 'SuperRare', marketPrice: 90.00 },
      { id: 'OP05-030_p1', name: 'Donquixote Rosinante (Parallel)', rarity: 'SecretRare', marketPrice: 75.00 },
      { id: 'OP08-004_p1', name: 'Marco (Parallel)', rarity: 'SuperRare', marketPrice: 65.00 },
    ],
  },
  kawayoo: {
    name: 'kawayoo',
    style: 'Intense Texture, Monster Action, High Kinetic Battle Energy',
    bio: 'Celebrated international TCG artist revered for brutal textured brushstrokes, overwhelming scale, and kinetic battle compositions.',
    totalCards: 18,
    featuredCards: [
      { id: 'OP01-060', name: 'Donquixote Doflamingo (Base)', rarity: 'Leader', marketPrice: 4.50 },
      { id: 'OP02-062', name: 'Monkey.D.Garp (Base)', rarity: 'Leader', marketPrice: 5.00 },
      { id: 'OP07-064', name: 'Portgas.D.Ace (Base)', rarity: 'SuperRare', marketPrice: 18.00 },
    ],
  },
  'Naochika Morishita': {
    name: 'Naochika Morishita',
    style: 'Heavy Metallic Shading, Volumetric Perspective, Mechanical Force',
    bio: 'Master of heavyweight, metallic character renderings with imposing mass and hyper-detailed foreshortening.',
    totalCards: 16,
    featuredCards: [
      { id: 'OP01-051', name: 'Eustass"Captain"Kid', rarity: 'SuperRare', marketPrice: 12.00 },
      { id: 'OP03-078', name: 'Issho', rarity: 'SuperRare', marketPrice: 8.50 },
      { id: 'OP05-002_p1', name: 'Belo Betty (Leader Alt)', rarity: 'Leader', marketPrice: 95.00 },
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
const EXACT_CARD_ARTISTS: Record<string, string> = {
  // === Eiichiro Oda (Manga Rares & Signed Special Rares) ===
  'OP01-120_p1': 'Eiichiro Oda', // Manga Shanks
  'OP02-013_p1': 'Eiichiro Oda', // Manga Ace
  'OP03-122_p1': 'Eiichiro Oda', // Manga Sogeking
  'OP04-083_p1': 'Eiichiro Oda', // Manga Sabo
  'OP05-060_p1': 'Eiichiro Oda', // Oda Anniversary Luffy
  'OP05-119_p1': 'Eiichiro Oda', // Manga Gear 5 Luffy
  'OP05-119_p2': 'Eiichiro Oda', // Manga Gear 5 SP
  'OP06-118_p1': 'Eiichiro Oda', // Manga Zoro
  'OP07-119_p1': 'Eiichiro Oda', // Manga Boa Hancock
  'OP08-118_p1': 'Eiichiro Oda', // Manga Silvers Rayleigh
  'OP09-119_p1': 'Eiichiro Oda', // Manga Shanks
  'OP10-119_p1': 'Eiichiro Oda', // Manga Trafalgar Law
  'ST01-012_p1': 'Eiichiro Oda', // Oda Signed Luffy

  // === Sunohara ===
  'OP01-016_p1': 'Sunohara',
  'OP01-016_p2': 'Sunohara',
  'OP01-078_p1': 'Sunohara',
  'OP01-121_p1': 'Sunohara',
  'OP02-005_p1': 'Sunohara',
  'OP02-120_p1': 'Sunohara',
  'OP03-116_p1': 'Sunohara',
  'OP04-056_p1': 'Sunohara',
  'OP05-034_p1': 'Sunohara',
  'OP06-022_p1': 'Sunohara',
  'OP06-093_p1': 'Sunohara',
  'OP07-019_p1': 'Sunohara',
  'OP08-024_p1': 'Sunohara',
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
  'EB04-054': 'BASHIKOU',
  'OP01-025_p1': 'BASHIKOU',
  'OP01-047_p1': 'BASHIKOU',
  'OP01-051_p1': 'BASHIKOU',
  'OP03-099': 'BASHIKOU',
  'OP04-083': 'BASHIKOU',
  'OP05-098_p1': 'BASHIKOU',
  'OP05-119': 'BASHIKOU',
  'OP06-086_p1': 'BASHIKOU',
  'OP07-053': 'BASHIKOU',

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
  'OP05-041_p2': 'Anderson',
  'OP05-098_p2': 'Anderson',
  'OP06-022_p2': 'Anderson',
  'OP07-019_p2': 'Anderson',
  'ST01-012_p2': 'Anderson',

  // === Nijihayashi ===
  'OP01-004_p1': 'Nijihayashi',
  'OP02-099_p1': 'Nijihayashi',
  'OP03-022_p1': 'Nijihayashi',
  'OP04-020_p1': 'Nijihayashi',
  'OP05-043_p1': 'Nijihayashi',
  'OP06-080_p1': 'Nijihayashi',
  'OP07-040_p1': 'Nijihayashi',
  'OP07-079_p1': 'Nijihayashi',
  'OP08-001_p1': 'Nijihayashi',
  'OP09-001_p1': 'Nijihayashi',

  // === Ryuda ===
  'OP01-070_p1': 'Ryuda',
  'OP02-071_p1': 'Ryuda',
  'OP04-058_p1': 'Ryuda',
  'OP05-030_p1': 'Ryuda',
  'OP05-100_p1': 'Ryuda',
  'OP08-004_p1': 'Ryuda',

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
      totalCards: 12,
      featuredCards: [],
    };
  }

  // 2. Base ID match for variants if applicable
  const baseId = normId.split('_')[0];
  if (normId.includes('_p') && EXACT_CARD_ARTISTS[`${baseId}_p1`]) {
    const artistName = EXACT_CARD_ARTISTS[`${baseId}_p1`];
    return ARTIST_PROFILES[artistName];
  }

  // 3. Manga Rare detection
  const lowerName = (cardName || '').toLowerCase();
  if (lowerName.includes('(manga)') || lowerName.includes('manga rare') || normId.includes('_p1') && (lowerName.includes('gear 5') || lowerName.includes('sogeking') || lowerName.includes('rayleigh'))) {
    return ARTIST_PROFILES['Eiichiro Oda'];
  }

  // 4. Default: All other standard cards are official Bandai / Toei Animation studio productions
  // (NEVER randomly hash to a famous illustrator!)
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
      return art.name.toLowerCase() === targetLower || art.name.toLowerCase().includes(targetLower);
    })
    .map((c) => c.id);
}
