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
    totalCards: 56,
    featuredCards: [
      { id: 'OP05-119_p2', name: 'Monkey.D.Luffy (Manga Gear 5)', rarity: 'SecretRare', marketPrice: 2400.00 },
      { id: 'OP01-120_p4', name: 'Shanks (Manga)', rarity: 'Special', marketPrice: 914.29 },
      { id: 'OP01-120_p6', name: 'Shanks (Manga Reprint with Stamp)', rarity: 'Special', marketPrice: 1414.29 },
      { id: 'OP02-013_p2', name: 'Portgas.D.Ace (Manga)', rarity: 'SuperRare', marketPrice: 980.00 },
      { id: 'OP04-083_p2', name: 'Sabo (Manga)', rarity: 'SuperRare', marketPrice: 665.33 },
      { id: 'OP06-118_p2', name: 'Roronoa Zoro (Manga)', rarity: 'SecretRare', marketPrice: 1200.00 },
      { id: 'OP07-051_p2', name: 'Boa Hancock (Manga)', rarity: 'Special', marketPrice: 1100.00 },
      { id: 'OP08-118_p2', name: 'Silvers Rayleigh (Manga)', rarity: 'SecretRare', marketPrice: 950.00 },
      { id: 'OP09-118_p2', name: 'Gol.D.Roger (Manga)', rarity: 'Special', marketPrice: 1300.00 },
      { id: 'OP10-119_p2', name: 'Trafalgar Law (Manga)', rarity: 'SecretRare', marketPrice: 1050.00 },
    ],
  },
  Sunohara: {
    name: 'Sunohara',
    style: 'Vibrant Watercolor, Fluid Light, Expressive Heroines',
    bio: 'Acclaimed illustrator celebrated for luminous color palettes, fluid lighting effects, and iconic heroine parallel arts across the One Piece Card Game.',
    totalCards: 63,
    featuredCards: [
      { id: 'EB03-026_p2', name: 'Boa Hancock (Special)', rarity: 'Special', marketPrice: 853.33 },
      { id: 'OP01-078_p2', name: 'Boa Hancock (Special)', rarity: 'Special', marketPrice: 665.33 },
      { id: 'OP12-014_p2', name: 'Boa Hancock (Special)', rarity: 'Special', marketPrice: 232.00 },
      { id: 'OP14-084_p2', name: 'Ms. All Sunday (Special)', rarity: 'Special', marketPrice: 232.00 },
      { id: 'EB03-031_p2', name: 'Vinsmoke Reiju (Special)', rarity: 'Special', marketPrice: 132.00 },
      { id: 'ST16-004_p1', name: 'Shanks (Special)', rarity: 'Special', marketPrice: 132.00 },
      { id: 'OP01-016_p1', name: 'Nami (Parallel)', rarity: 'Rare', marketPrice: 98.67 },
      { id: 'OP12-030_p2', name: 'Dracule Mihawk (Special)', rarity: 'Special', marketPrice: 85.33 },
    ],
  },
  'Akira Egawa': {
    name: 'Akira Egawa',
    style: 'Dramatic Lighting, Painterly Fantasy, Fire & Volumetric Glow',
    bio: 'Renowned international fantasy and TCG painter distinguished for cinematic atmosphere, volumetric lighting, and dramatic fire compositions.',
    totalCards: 20,
    featuredCards: [
      { id: 'OP01-025_p1', name: 'Roronoa Zoro (SR Alt)', rarity: 'SuperRare', marketPrice: 53.20 },
      { id: 'OP02-013_p1', name: 'Portgas.D.Ace (SR Alt)', rarity: 'SuperRare', marketPrice: 45.00 },
      { id: 'OP04-083_p1', name: 'Sabo (SR Alt)', rarity: 'SuperRare', marketPrice: 35.00 },
      { id: 'OP16-119_p1', name: 'Marshall.D.Teach (SEC Alt)', rarity: 'SecretRare', marketPrice: 39.87 },
      { id: 'OP17-119_p1', name: 'Loki (SEC Alt)', rarity: 'SecretRare', marketPrice: 33.20 },
      { id: 'OP01-070_p1', name: 'Dracule Mihawk (SR Alt)', rarity: 'SuperRare', marketPrice: 19.87 },
      { id: 'OP02-062_p1', name: 'Monkey.D.Luffy (SR Alt)', rarity: 'SuperRare', marketPrice: 19.87 },
      { id: 'OP06-007_p1', name: 'Shanks (SR Alt)', rarity: 'SuperRare', marketPrice: 16.53 },
    ],
  },
  Makitoshi: {
    name: 'Makitoshi',
    style: 'Classic Pirate Portrayal, Textured Brushwork, Regal Aura',
    bio: 'Veteran card illustrator known for textured portraits, commanding presence, and iconic historical compositions across the Four Emperors and Marines.',
    totalCards: 29,
    featuredCards: [
      { id: 'EB02-061_p3', name: 'Monkey.D.Luffy (Special)', rarity: 'Special', marketPrice: 198.67 },
      { id: 'OP10-119_p3', name: 'Trafalgar Law (Special)', rarity: 'Special', marketPrice: 53.20 },
      { id: 'OP16-118_p1', name: 'Portgas.D.Ace (SEC Alt)', rarity: 'SecretRare', marketPrice: 33.20 },
      { id: 'OP02-001_p1', name: 'Edward.Newgate (Leader Alt)', rarity: 'Leader', marketPrice: 26.53 },
      { id: 'OP15-119_p1', name: 'Monkey.D.Luffy (SEC Alt)', rarity: 'SecretRare', marketPrice: 26.53 },
      { id: 'OP02-002_p1', name: 'Monkey.D.Garp (Leader Alt)', rarity: 'Leader', marketPrice: 19.87 },
      { id: 'OP14-020_p1', name: 'Dracule Mihawk (Leader Alt)', rarity: 'Leader', marketPrice: 19.87 },
      { id: 'OP01-120', name: 'Shanks (Secret Rare Base)', rarity: 'SecretRare', marketPrice: 15.00 },
    ],
  },
  BASHIKOU: {
    name: 'BASHIKOU',
    style: 'Dynamic Perspective, Comic Ink, High Energy Action',
    bio: 'Celebrated Japanese trading card illustrator renowned for extreme perspective, explosive foreshortening, and heavy comic ink technique across flagship sets.',
    totalCards: 48,
    featuredCards: [
      { id: 'ST31-004_p1', name: 'Monkey.D.Luffy (Special)', rarity: 'Special', marketPrice: 532.00 },
      { id: 'ST26-005_p1', name: 'Monkey.D.Luffy (Special)', rarity: 'Special', marketPrice: 198.67 },
      { id: 'EB03-045_p2', name: 'Perona (Special)', rarity: 'Special', marketPrice: 165.33 },
      { id: 'OP09-119_p3', name: 'Monkey.D.Luffy (Special)', rarity: 'Special', marketPrice: 165.33 },
      { id: 'OP13-028_p2', name: 'Shanks (Special)', rarity: 'Special', marketPrice: 165.33 },
      { id: 'ST27-005_p1', name: 'Marshall.D.Teach (Special)', rarity: 'Special', marketPrice: 165.33 },
      { id: 'ST15-002_p1', name: 'Edward.Newgate (Special)', rarity: 'Special', marketPrice: 132.00 },
      { id: 'OP07-038_p1', name: 'Boa Hancock (Leader Alt)', rarity: 'Leader', marketPrice: 85.33 },
    ],
  },
  Otton: {
    name: 'Otton',
    style: 'Expressive Character Emotion, Vibrant Poses, Clean Linework',
    bio: 'Popular illustrator celebrated for charismatic character expressions, dynamic leader poses, and iconic fan-favorite parallel arts.',
    totalCards: 54,
    featuredCards: [
      { id: 'OP14-112_p2', name: 'Boa Hancock (Special)', rarity: 'Special', marketPrice: 265.33 },
      { id: 'OP06-101_p2', name: 'O-Nami (Special)', rarity: 'Special', marketPrice: 232.00 },
      { id: 'OP08-106_p2', name: 'Nami (Special)', rarity: 'Special', marketPrice: 232.00 },
      { id: 'ST18-005_p1', name: 'Luffy-Tarou (Special)', rarity: 'Special', marketPrice: 198.67 },
      { id: 'OP06-007_p2', name: 'Shanks (Special)', rarity: 'Special', marketPrice: 85.33 },
      { id: 'OP06-119_p2', name: 'Sanji (Special)', rarity: 'Special', marketPrice: 85.33 },
      { id: 'ST13-011_p2', name: 'Portgas.D.Ace (Special)', rarity: 'Special', marketPrice: 85.33 },
      { id: 'EB04-001_p1', name: 'Jewelry Bonney (Leader Alt)', rarity: 'Leader', marketPrice: 66.53 },
    ],
  },
  Anderson: {
    name: 'Anderson',
    style: 'Impactful Leader Art, High Contrast Shading, Manga Action',
    bio: 'Renowned for commanding Leader card portraits with bold contrasting shadows and high-octane battle stances.',
    totalCards: 66,
    featuredCards: [
      { id: 'OP01-001_p1', name: 'Roronoa Zoro (Leader Alt)', rarity: 'Leader', marketPrice: 165.33 },
      { id: 'OP01-002_p1', name: 'Trafalgar Law (Leader Alt)', rarity: 'Leader', marketPrice: 85.33 },
      { id: 'OP01-047_p2', name: 'Trafalgar Law (Special)', rarity: 'Special', marketPrice: 85.33 },
      { id: 'OP03-040_p1', name: 'Nami (Leader Alt)', rarity: 'Leader', marketPrice: 85.33 },
      { id: 'ST01-012_p2', name: 'Monkey.D.Luffy (SR Alt)', rarity: 'SuperRare', marketPrice: 66.53 },
      { id: 'OP01-060_p1', name: 'Donquixote Doflamingo (Leader Alt)', rarity: 'Leader', marketPrice: 53.20 },
      { id: 'OP03-008_p1', name: 'Buggy (Special)', rarity: 'Special', marketPrice: 53.20 },
      { id: 'OP07-015_p2', name: 'Monkey.D.Dragon (Special)', rarity: 'Special', marketPrice: 53.20 },
    ],
  },
  Nijihayashi: {
    name: 'Nijihayashi',
    style: 'Clean Ink Lineart, Stylized Modern Shading, Dynamic Stances',
    bio: 'Acclaimed card artist known for razor-sharp character outlines and vibrant, commanding Leader and Character illustrations.',
    totalCards: 51,
    featuredCards: [
      { id: 'EB04-007_p1', name: 'Roronoa Zoro (SR Alt)', rarity: 'SuperRare', marketPrice: 66.53 },
      { id: 'OP09-001_p1', name: 'Shanks (Leader Alt)', rarity: 'Leader', marketPrice: 19.87 },
      { id: 'ST29-014_p1', name: 'Roronoa Zoro (SR Alt)', rarity: 'SuperRare', marketPrice: 16.53 },
      { id: 'EB01-046_p1', name: 'Brook (SR Alt)', rarity: 'SuperRare', marketPrice: 13.20 },
      { id: 'EB03-055_p1', name: 'Nico Robin (SR Alt)', rarity: 'SuperRare', marketPrice: 13.20 },
      { id: 'ST16-004_p2', name: 'Shanks (SR Alt)', rarity: 'SuperRare', marketPrice: 11.87 },
      { id: 'OP04-112_p1', name: 'Yamato (SR Alt)', rarity: 'SuperRare', marketPrice: 8.53 },
      { id: 'OP12-094_p1', name: 'Monkey.D.Dragon (SR Alt)', rarity: 'SuperRare', marketPrice: 8.53 },
    ],
  },
  Ryuda: {
    name: 'Ryuda',
    style: 'Moody Heavy Shadows, Fierce Expressions, Dramatic Depth',
    bio: 'Specialist in intense, gritty character portrayals featuring dramatic lighting and iconic warlord designs.',
    totalCards: 44,
    featuredCards: [
      { id: 'OP05-051_p2', name: 'Borsalino (Special)', rarity: 'Special', marketPrice: 33.20 },
      { id: 'OP06-021_p1', name: 'Perona (Leader Alt)', rarity: 'Leader', marketPrice: 23.20 },
      { id: 'OP07-019_p1', name: 'Jewelry Bonney (Leader Alt)', rarity: 'Leader', marketPrice: 19.87 },
      { id: 'EB04-018_p1', name: 'Megalo (Rare Alt)', rarity: 'Rare', marketPrice: 13.20 },
      { id: 'OP16-014_p1', name: 'Marco (Rare Alt)', rarity: 'Rare', marketPrice: 13.20 },
      { id: 'OP11-001_p1', name: 'Koby (Leader Alt)', rarity: 'Leader', marketPrice: 11.87 },
      { id: 'OP02-071_p1', name: 'Magellan (Leader Alt)', rarity: 'Leader', marketPrice: 9.87 },
      { id: 'OP08-007_p1', name: 'Tony Tony.Chopper (SR Alt)', rarity: 'SuperRare', marketPrice: 9.87 },
    ],
  },
  kawayoo: {
    name: 'kawayoo',
    style: 'Intense Texture, Monster Action, High Kinetic Battle Energy',
    bio: 'Celebrated international TCG artist revered for brutal textured brushstrokes, overwhelming scale, and kinetic battle compositions.',
    totalCards: 2,
    featuredCards: [
      { id: 'OP01-060', name: 'Donquixote Doflamingo (Leader)', rarity: 'Leader', marketPrice: 4.50 },
      { id: 'ST04-001', name: 'Kaido (Leader)', rarity: 'Leader', marketPrice: 4.50 },
    ],
  },
  'Naochika Morishita': {
    name: 'Naochika Morishita',
    style: 'Heavy Metallic Shading, Volumetric Perspective, Mechanical Force',
    bio: 'Master of heavyweight, metallic character renderings with imposing mass and hyper-detailed foreshortening.',
    totalCards: 3,
    featuredCards: [
      { id: 'OP05-002_p1', name: 'Belo Betty (Leader Alt)', rarity: 'Leader', marketPrice: 95.00 },
      { id: 'OP01-051_p3', name: 'Eustass"Captain"Kid (SR Alt)', rarity: 'SuperRare', marketPrice: 12.00 },
      { id: 'OP01-051', name: 'Eustass"Captain"Kid (SR Base)', rarity: 'SuperRare', marketPrice: 5.00 },
    ],
  },
  'Hayaken-sarena': {
    name: 'Hayaken-sarena',
    style: 'Clean Manga Lineart, Expressive Poses, Anime High Fidelity',
    bio: 'Celebrated illustrator known for crisp lines, iconic anime expressions, and balanced composition across characters and leaders.',
    totalCards: 50,
    featuredCards: [
      { id: 'OP02-004_p2', name: 'Edward.Newgate (Special)', rarity: 'Special', marketPrice: 53.20 },
      { id: 'OP05-060_p2', name: 'Monkey.D.Luffy (Leader Alt)', rarity: 'Leader', marketPrice: 53.20 },
      { id: 'OP01-073_p1', name: 'Donquixote Doflamingo (Rare Alt)', rarity: 'Rare', marketPrice: 9.87 },
      { id: 'OP13-082_p1', name: 'Five Elders (SR Alt)', rarity: 'SuperRare', marketPrice: 8.53 },
      { id: 'EB01-049_p1', name: 'T-Bone (Rare Alt)', rarity: 'Rare', marketPrice: 6.53 },
      { id: 'OP06-035_p1', name: 'Hody Jones (SR Alt)', rarity: 'SuperRare', marketPrice: 6.53 },
      { id: 'OP16-065_p1', name: 'Sakazuki (SR Alt)', rarity: 'SuperRare', marketPrice: 6.53 },
      { id: 'OP01-004', name: 'Usopp (Rare Base)', rarity: 'Rare', marketPrice: 3.50 },
    ],
  },
  BISAI: {
    name: 'BISAI',
    style: 'Sleek Lineart, High-Contrast Cell Shading, Intense Battle Glare',
    bio: 'Renowned One Piece TCG artist known for iconic, sharp Super Rare character artworks featuring crisp lines and high-contrast dramatic lighting.',
    totalCards: 102,
    featuredCards: [
      { id: 'OP04-083', name: 'Sabo (SR Base)', rarity: 'SuperRare', marketPrice: 1.50 },
      { id: 'OP10-005_p3', name: 'Sanji (Special)', rarity: 'SuperRare', marketPrice: 232.00 },
      { id: 'OP05-060_p3', name: 'Monkey.D.Luffy (Leader Alt)', rarity: 'Leader', marketPrice: 66.53 },
      { id: 'OP01-060_p2', name: 'Donquixote Doflamingo (Leader Alt)', rarity: 'Leader', marketPrice: 53.20 },
      { id: 'OP03-099_p2', name: 'Charlotte Katakuri (Leader Alt)', rarity: 'Leader', marketPrice: 26.53 },
      { id: 'OP12-087_p1', name: 'Nico Robin (SR Alt)', rarity: 'SuperRare', marketPrice: 23.20 },
      { id: 'OP02-001_p2', name: 'Edward.Newgate (Leader Alt)', rarity: 'Leader', marketPrice: 19.87 },
      { id: 'OP02-025', name: "Kin'emon (SR Base)", rarity: 'SuperRare', marketPrice: 15.00 },
    ],
  },
  'Suzume Sakuragi': {
    name: 'Suzume Sakuragi',
    style: 'Cute & Dynamic Character Portrayals, Vivid Anime Highlights',
    bio: 'Beloved card artist specializing in charming, dynamic fan-favorite heroine illustrations and expressive character poses.',
    totalCards: 1,
    featuredCards: [
      { id: 'OP02-036', name: 'Nami (SR)', rarity: 'SuperRare', marketPrice: 2.13 },
    ],
  },
  lack: {
    name: 'lack',
    style: 'Dynamic Shading, Intense Kinetic Poses, High-Contrast Atmospheric Light',
    bio: 'Prominent Japanese illustrator and character designer acclaimed for dramatic lighting, muscular anatomy, and high-impact battle poses across major TCGs.',
    totalCards: 9,
    featuredCards: [
      { id: 'OP01-120_p5', name: 'Shanks (PRB Parallel)', rarity: 'SecretRare', marketPrice: 1320.00 },
      { id: 'OP16-032_p1', name: 'Boa Hancock (SR Alt)', rarity: 'SuperRare', marketPrice: 33.20 },
      { id: 'OP11-067_p1', name: 'Charlotte Katakuri (SR Alt)', rarity: 'SuperRare', marketPrice: 9.87 },
      { id: 'OP08-002_p1', name: 'Marco (Leader Alt)', rarity: 'Leader', marketPrice: 8.53 },
      { id: 'OP12-030_p1', name: 'Dracule Mihawk (SR Alt)', rarity: 'SuperRare', marketPrice: 6.53 },
      { id: 'OP13-066_p1', name: 'Silvers Rayleigh (SR Alt)', rarity: 'SuperRare', marketPrice: 6.53 },
      { id: 'OP09-065_p1', name: 'Sanji (SR Alt)', rarity: 'SuperRare', marketPrice: 3.87 },
      { id: 'OP07-119', name: 'Portgas.D.Ace (SEC)', rarity: 'SecretRare', marketPrice: 2.13 },
    ],
  },
};

// Verified authentic card ID mappings for specific illustrators
export const EXACT_CARD_ARTISTS: Record<string, string> = {
  "OP01-120_p2": "Makitoshi",
  "OP01-120_p4": "Eiichiro Oda",
  "OP01-120_p6": "Eiichiro Oda",
  "OP02-013_p1": "Akira Egawa",
  "OP02-013_p2": "Eiichiro Oda",
  "OP02-013_p5": "Eiichiro Oda",
  "OP02-013_p6": "Eiichiro Oda",
  "OP03-122_p2": "Eiichiro Oda",
  "OP03-122_p3": "Eiichiro Oda",
  "ST01-012_p1": "Eiichiro Oda",
  "OP04-083_p1": "Akira Egawa",
  "OP04-083_p2": "Eiichiro Oda",
  "OP04-083_p4": "Eiichiro Oda",
  "OP04-083_p5": "Eiichiro Oda",
  "OP04-083_p6": "Eiichiro Oda",
  "OP05-060_p1": "Eiichiro Oda",
  "OP05-060_p4": "Eiichiro Oda",
  "OP05-119_p2": "Eiichiro Oda",
  "OP05-119_p3": "Eiichiro Oda",
  "OP05-119_p6": "Eiichiro Oda",
  "OP05-119_p7": "Eiichiro Oda",
  "OP05-119_p8": "Eiichiro Oda",
  "ST01-012_p3": "Eiichiro Oda",
  "ST01-012_p4": "Eiichiro Oda",
  "OP06-118_p2": "Eiichiro Oda",
  "OP06-118_p4": "Eiichiro Oda",
  "OP07-051_p2": "Eiichiro Oda",
  "OP07-051_p3": "Eiichiro Oda",
  "OP07-119_p2": "Eiichiro Oda",
  "OP08-118_p2": "Eiichiro Oda",
  "OP09-061_p1": "Eiichiro Oda",
  "OP09-061_p3": "Eiichiro Oda",
  "OP09-004_p6": "Eiichiro Oda",
  "OP09-093_p5": "Eiichiro Oda",
  "OP09-118_p2": "Eiichiro Oda",
  "OP09-118_p3": "Eiichiro Oda",
  "OP09-119_p4": "Tacchan",
  "OP10-119_p2": "Eiichiro Oda",
  "OP11-118_p2": "Eiichiro Oda",
  "OP12-118_p2": "Eiichiro Oda",
  "OP13-118_p2": "Eiichiro Oda",
  "OP13-118_p3": "Eiichiro Oda",
  "OP13-118_p4": "Eiichiro Oda",
  "OP13-119_p2": "Eiichiro Oda",
  "OP13-119_p3": "Eiichiro Oda",
  "OP13-119_p4": "Eiichiro Oda",
  "OP13-120_p2": "Eiichiro Oda",
  "OP13-120_p3": "Eiichiro Oda",
  "OP13-120_p4": "Eiichiro Oda",
  "OP14-119_p2": "Eiichiro Oda",
  "OP15-118_p2": "Eiichiro Oda",
  "OP16-063_p2": "Eiichiro Oda",
  "OP16-065_p2": "Eiichiro Oda",
  "OP16-073_p2": "Eiichiro Oda",
  "EB03-061_p2": "Eiichiro Oda",
  "EB04-044_p2": "Eiichiro Oda",
  "OP17-DON-01_p1": "Eiichiro Oda",
  "OP17-DON-02_p1": "Eiichiro Oda",
  "OP17-DON-03_p1": "Eiichiro Oda",
  "OP17-DON-04_p1": "Eiichiro Oda",
  "OP01-016_p1": "Sunohara",
  "OP01-078_p1": "Hashimoto Q",
  "OP01-121_p1": "Berry Verrine",
  "OP02-120_p1": "Demizu Posuka",
  "OP05-034_p1": "Hagane Tsurugi",
  "OP06-022_p1": "Sunohara",
  "OP06-093_p1": "Koushi Rokushiro",
  "OP07-019_p1": "Ryuda",
  "OP08-106_p1": "POKImari",
  "OP01-025_p1": "Akira Egawa",
  "OP03-099_p1": "Anderson",
  "OP05-060_p2": "Hayaken-sarena",
  "OP05-069_p1": "Akira Egawa",
  "OP07-001_p1": "Anderson",
  "OP01-120_p5": "lack",
  "OP07-119": "lack",
  "OP08-002_p1": "lack",
  "OP09-065_p1": "lack",
  "OP10-119": "lack",
  "OP11-067_p1": "lack",
  "OP12-030_p1": "lack",
  "OP13-066_p1": "lack",
  "OP16-032_p1": "lack",
  "OP01-094_p1": "shosuke",
  "OP01-120": "Makitoshi",
  "OP02-001_p1": "Makitoshi",
  "OP02-002_p1": "Makitoshi",
  "OP02-004_p1": "Makitoshi",
  "OP03-001_p1": "Anderson",
  "OP05-001_p1": "Makitoshi",
  "OP08-118": "Akira Egawa",
  "OP09-118": "TAPIOCA",
  "OP01-047_p1": "Makitoshi",
  "OP01-051_p1": "Makitoshi",
  "OP03-099": "BASHIKOU",
  "OP04-083": "BISAI",
  "OP05-098_p1": "BASHIKOU",
  "OP05-119": "TAPIOCA",
  "OP06-086_p1": "Yosuke Adachi",
  "OP07-053": "Hagane Tsurugi",
  "EB04-054": "Ryuda",
  "OP01-014_p1": "Otton",
  "OP01-017_p1": "Otton",
  "OP02-026_p1": "Otton",
  "OP04-039_p1": "Studio Vigor Co. Ltd",
  "OP05-006_p1": "Hatori Kyoka",
  "OP05-007_p1": "Sunohara",
  "OP05-022_p1": "Otton",
  "OP06-001_p1": "Sunohara",
  "OP01-001_p1": "Anderson",
  "OP01-002_p1": "Anderson",
  "OP01-060_p1": "Anderson",
  "OP01-062_p1": "Anderson",
  "OP03-077_p1": "Anderson",
  "ST01-012_p2": "Anderson",
  "OP02-099_p1": "Anderson",
  "OP03-022_p1": "Anderson",
  "OP04-020_p1": "Anderson",
  "OP05-043_p1": "Akira Kano",
  "OP06-080_p1": "Anderson",
  "OP07-079_p1": "Anderson",
  "OP08-001_p1": "Rofta",
  "OP09-001_p1": "Nijihayashi",
  "OP01-070_p1": "Akira Egawa",
  "OP02-071_p1": "Ryuda",
  "OP04-058_p1": "tasaka",
  "OP05-100_p1": "Yosuke Adachi",
  "ST04-001": "kawayoo",
  "OP01-060": "kawayoo",
  "OP02-062": "otumami",
  "OP07-064": "Nijihayashi",
  "OP08-067": "Yuu Shimotsuki",
  "OP01-051": "Naochika Morishita",
  "OP03-078": "nukadokomogera",
  "OP03-092": "otumami",
  "OP05-002_p1": "Naochika Morishita",
  "OP09-093": "Asaki Kuroda",
  "OP01-004": "Hayaken-sarena",
  "OP02-030": "Misa Matoki",
  "OP05-060": "Hayaken-sarena",
  "OP06-021": "Hayaken-sarena",
  "OP07-040": "Koushi Rokushiro",
  "OP01-068": "phima",
  "OP02-025": "BISAI",
  "OP03-040": "BISAI",
  "OP04-024": "Koushi Rokushiro",
  "OP05-005": "Asaki Kuroda",
  "OP01-077": "Ryuda",
  "OP02-036": "Suzume Sakuragi",
  "OP04-032": "Akira Kano",
  "OP06-035": "Hisashi Hujiwara"
};

/**
 * Checks whether an artist name corresponds to a genuine guest illustrator
 */
export function isGuestArtist(artistName?: string | null): boolean {
  if (!artistName) return false;
  const lower = artistName.toLowerCase().trim();
  if (
    lower === 'all' ||
    lower.includes('bandai') ||
    lower.includes('toei') ||
    lower.includes('animation') ||
    lower.includes('official') ||
    lower === 'unknown' ||
    lower === 'none'
  ) {
    return false;
  }
  return true;
}

export function getCardArtist(
  cardId: string, 
  cardName: string = '', 
  cardArtistName?: string | null
): ArtistProfile | null {
  const normId = (cardId || '').trim();

  // 1. Direct from database artistName if present and verified
  if (cardArtistName && isGuestArtist(cardArtistName)) {
    const trimmed = cardArtistName.trim();
    return ARTIST_PROFILES[trimmed] || {
      name: trimmed,
      style: 'Verified Card Illustrator',
      bio: `Official illustrator credited on card ${normId}.`,
      totalCards: 1,
      featuredCards: [],
    };
  }

  // 2. Direct verified exact match from curated registry
  if (EXACT_CARD_ARTISTS[normId]) {
    const artistName = EXACT_CARD_ARTISTS[normId];
    return ARTIST_PROFILES[artistName] || {
      name: artistName,
      style: 'Verified Card Illustrator',
      bio: `Official illustrator credited on card ${normId}.`,
      totalCards: 1,
      featuredCards: [],
    };
  }

  // 3. Strict Manga Rare & Oda Anniversary Signature detection (Eiichiro Oda only!)
  const lowerName = (cardName || '').toLowerCase();
  const isMangaRare = 
    lowerName.includes('(manga)') || 
    lowerName.includes('manga rare') ||
    lowerName.includes('manga alt') ||
    lowerName.includes('manga super rare') ||
    normId === 'OP05-060_p1' ||
    normId === 'OP05-060_p4' ||
    normId === 'OP09-061_p1' ||
    normId === 'OP09-061_p3' ||
    normId === 'ST01-012_p1' ||
    normId === 'ST01-012_p3' ||
    normId === 'ST01-012_p4' ||
    ['OP05-119_p2', 'OP05-119_p3', 'OP05-119_p6', 'OP05-119_p7', 'OP05-119_p8'].includes(normId);

  if (isMangaRare) {
    return ARTIST_PROFILES['Eiichiro Oda'];
  }

  // 4. Normal / Standard base cards: Official Studio Art (No individual guest illustrator credited)
  return null;
}

/**
 * Returns all card IDs associated with a given artist name
 */
export function getCardIdsByArtist(
  artistName: string, 
  allCards: Array<{ id: string; name: string; artistName?: string | null; artist_name?: string | null }>
): string[] {
  const targetLower = artistName.toLowerCase().trim();
  if (!targetLower || targetLower === 'all' || !isGuestArtist(targetLower)) {
    return [];
  }

  return allCards
    .filter((c) => {
      const art = getCardArtist(c.id, c.name, c.artistName || c.artist_name);
      return art && art.name.toLowerCase() === targetLower;
    })
    .map((c) => c.id);
}
