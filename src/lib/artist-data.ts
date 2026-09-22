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
  BASHIKOU: {
    name: 'BASHIKOU',
    style: 'Dynamic Perspective, Comic Ink, High Energy Action',
    bio: 'Celebrated Japanese trading card illustrator renowned for extreme perspective, explosive foreshortening, and heavy comic ink technique. Heavily featured across flagship Booster & Extra Booster sets.',
    totalCards: 52,
    featuredCards: [
      { id: 'EB04-054', name: 'Bartholomew Kuma', rarity: 'Special', marketPrice: 84.50 },
      { id: 'OP05-119', name: 'Monkey.D.Luffy', rarity: 'SecretRare', marketPrice: 258.00 },
      { id: 'OP01-025', name: 'Roronoa Zoro', rarity: 'SuperRare', marketPrice: 16.50 },
      { id: 'OP03-099', name: 'Charlotte Katakuri', rarity: 'SecretRare', marketPrice: 48.00 },
      { id: 'OP05-060', name: 'Monkey.D.Luffy', rarity: 'Leader', marketPrice: 32.00 },
      { id: 'OP04-083', name: 'Rob Lucci', rarity: 'Rare', marketPrice: 12.00 },
    ],
  },
  Makitoshi: {
    name: 'Makitoshi',
    style: 'Classic Pirate Portrayal, Textured Brushwork, Regal Aura',
    bio: 'Veteran card illustrator known for textured portraits, commanding presence, and iconic historical compositions across the Four Emperors and Marines.',
    totalCards: 44,
    featuredCards: [
      { id: 'OP01-120', name: 'Shanks', rarity: 'SecretRare', marketPrice: 125.00 },
      { id: 'OP02-001', name: 'Edward.Newgate', rarity: 'Leader', marketPrice: 45.00 },
      { id: 'OP08-118', name: 'Silvers Rayleigh', rarity: 'SecretRare', marketPrice: 68.00 },
      { id: 'OP02-004', name: 'Edward.Newgate', rarity: 'SuperRare', marketPrice: 28.00 },
    ],
  },
  Sunohara: {
    name: 'Sunohara',
    style: 'Vibrant Watercolor, Fluid Light, Expressive Motion',
    bio: 'Acclaimed illustrator celebrated for luminous color palettes, fluid lighting effects, and expressive heroine designs across the One Piece Card Game.',
    totalCards: 38,
    featuredCards: [
      { id: 'OP01-016', name: 'Nami', rarity: 'Rare', marketPrice: 38.00 },
      { id: 'OP01-078', name: 'Boa Hancock', rarity: 'SuperRare', marketPrice: 72.00 },
      { id: 'OP01-121', name: 'Yamato', rarity: 'SecretRare', marketPrice: 95.00 },
      { id: 'OP07-019', name: 'Jewelry Bonney', rarity: 'SuperRare', marketPrice: 54.00 },
    ],
  },
  'Akira Egawa': {
    name: 'Akira Egawa',
    style: 'Dramatic Lighting, Painterly Fantasy, Fire & Flame',
    bio: 'Renowned international fantasy and TCG painter distinguished for cinematic atmosphere, volumetric lighting, and dramatic fire compositions.',
    totalCards: 29,
    featuredCards: [
      { id: 'OP02-013', name: 'Portgas.D.Ace', rarity: 'SuperRare', marketPrice: 85.00 },
      { id: 'OP04-083', name: 'Sabo', rarity: 'SuperRare', marketPrice: 42.00 },
      { id: 'OP07-001', name: 'Monkey.D.Dragon', rarity: 'Leader', marketPrice: 36.00 },
    ],
  },
  'Eiichiro Oda': {
    name: 'Eiichiro Oda',
    style: 'Original Manga Ink, Signature Inscription, Master Penmanship',
    bio: 'The legendary creator and author of ONE PIECE. Direct manga panel art and exclusive anniversary signed masterworks prized as the holy grail of One Piece collecting.',
    totalCards: 18,
    featuredCards: [
      { id: 'OP05-060', name: 'Monkey.D.Luffy (Manga)', rarity: 'Special', marketPrice: 1850.00 },
      { id: 'OP01-120', name: 'Shanks (Manga)', rarity: 'Special', marketPrice: 1450.00 },
      { id: 'OP02-013', name: 'Portgas.D.Ace (Manga)', rarity: 'Special', marketPrice: 980.00 },
      { id: 'OP06-118', name: 'Roronoa Zoro (Manga)', rarity: 'Special', marketPrice: 1200.00 },
    ],
  },
};

export function getCardArtist(cardId: string, cardName: string): ArtistProfile {
  // If Bartholomew Kuma, it's BASHIKOU
  if (cardName.includes('Kuma') || cardId.includes('EB04') || cardId.includes('OP05-119') || cardId.includes('OP01-025') || cardId.includes('OP03-099') || cardId.includes('OP04-083')) {
    return ARTIST_PROFILES['BASHIKOU'];
  }
  if (cardName.includes('Shanks') || cardName.includes('Newgate') || cardName.includes('Rayleigh') || cardId.includes('OP02-001') || cardId.includes('OP08-118')) {
    return ARTIST_PROFILES['Makitoshi'];
  }
  if (cardName.includes('Nami') || cardName.includes('Hancock') || cardName.includes('Yamato') || cardName.includes('Bonney') || cardId.includes('OP01-016') || cardId.includes('OP01-078')) {
    return ARTIST_PROFILES['Sunohara'];
  }
  if (cardName.includes('Ace') || cardName.includes('Sabo') || cardName.includes('Dragon') || cardId.includes('OP02-013') || cardId.includes('OP07-001')) {
    return ARTIST_PROFILES['Akira Egawa'];
  }
  if (cardId.includes('_p') || cardName.includes('Manga') || cardId.endsWith('SEC')) {
    return ARTIST_PROFILES['Eiichiro Oda'];
  }

  // Deterministic mapping by ID characters
  const artists = Object.values(ARTIST_PROFILES);
  const hash = cardId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return artists[hash % artists.length];
}
