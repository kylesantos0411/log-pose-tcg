import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official Japanese Release Dates & Chronological Ordering
// Year 2026 current status: OP-17 is the current latest released set (August 2026).
// OP-18 is scheduled / upcoming (November 2026).
const PACK_DATES: Record<string, { date: string; order: number }> = {
  // Upcoming / Pre-release
  'OP-18': { date: '2026-11-28', order: 20261128 },

  // Boosters (OP)
  'OP-17': { date: '2026-08-29', order: 20260829 }, // The World’s Strongest Warriors (LATEST RELEASED)
  'OP-16': { date: '2026-05-30', order: 20260530 }, // The Time of Battle
  'OP15-EB04': { date: '2026-02-28', order: 20260228 }, // Booster Pack OP-15
  'OP-15': { date: '2026-02-28', order: 20260228 },
  'OP14-EB04': { date: '2025-11-29', order: 20251129 }, // The Azure Sea’s Seven
  'OP-14': { date: '2025-11-29', order: 20251129 },
  'OP-13': { date: '2025-08-30', order: 20250830 }, // Carrying On His Will
  'OP-12': { date: '2025-05-31', order: 20250531 }, // Legacy of the Master
  'OP-11': { date: '2025-02-22', order: 20250222 }, // A Fist of Divine Speed
  'OP-10': { date: '2024-11-30', order: 20241130 }, // Royal Bloodlines
  'OP-09': { date: '2024-08-31', order: 20240831 }, // Emperors in the New World
  'OP-08': { date: '2024-05-25', order: 20240525 }, // Two Legends
  'OP-07': { date: '2024-02-24', order: 20240224 }, // 500 Years in the Future
  'OP-06': { date: '2023-11-25', order: 20231125 }, // Wings of the Captain
  'OP-05': { date: '2023-08-26', order: 20230826 }, // Awakening of the New Era
  'OP-04': { date: '2023-05-27', order: 20230527 }, // Kingdoms of Intrigue
  'OP-03': { date: '2023-02-11', order: 20230211 }, // Pillars of Strength
  'OP-02': { date: '2022-11-04', order: 20221104 }, // Paramount War
  'OP-01': { date: '2022-07-22', order: 20220722 }, // Romance Dawn

  // Extra Boosters (EB)
  'EB-03': { date: '2025-06-28', order: 20250628 }, // One Piece Heroines Edition
  'EB-02': { date: '2024-10-26', order: 20241026 }, // Anime 25th Collection
  'EB-01': { date: '2024-01-27', order: 20240127 }, // Memorial Collection

  // Premium Boosters (PRB)
  'PRB-02': { date: '2025-07-26', order: 20250726 }, // One Piece Card The Best vol.2
  'PRB-01': { date: '2024-07-27', order: 20240727 }, // One Piece Card The Best vol.1

  // Starter Decks (ST)
  'ST-36': { date: '2026-03-21', order: 20260321 },
  'ST-35': { date: '2026-03-21', order: 20260321 },
  'ST-34': { date: '2026-03-21', order: 20260321 },
  'ST-33': { date: '2026-03-21', order: 20260321 },
  'ST-32': { date: '2026-03-21', order: 20260321 },
  'ST-31': { date: '2026-03-21', order: 20260321 },
  'ST-30': { date: '2025-09-20', order: 20250920 },
  'ST-29': { date: '2025-09-20', order: 20250920 },
  'ST-28': { date: '2025-04-12', order: 20250412 },
  'ST-27': { date: '2025-04-12', order: 20250412 },
  'ST-26': { date: '2025-04-12', order: 20250412 },
  'ST-25': { date: '2025-04-12', order: 20250412 },
  'ST-24': { date: '2025-04-12', order: 20250412 },
  'ST-23': { date: '2025-04-12', order: 20250412 },
  'ST-22': { date: '2025-01-25', order: 20250125 },
  'ST-21': { date: '2024-12-21', order: 20241221 }, // GEAR5
  'ST-20': { date: '2024-08-10', order: 20240810 },
  'ST-19': { date: '2024-08-10', order: 20240810 },
  'ST-18': { date: '2024-08-10', order: 20240810 },
  'ST-17': { date: '2024-08-10', order: 20240810 },
  'ST-16': { date: '2024-08-10', order: 20240810 },
  'ST-15': { date: '2024-08-10', order: 20240810 },
  'ST-14': { date: '2024-05-25', order: 20240525 },
  'ST-13': { date: '2023-12-23', order: 20231223 },
  'ST-12': { date: '2023-10-28', order: 20231028 },
  'ST-11': { date: '2023-10-07', order: 20231007 },
  'ST-10': { date: '2023-07-29', order: 20230729 },
  'ST-09': { date: '2023-01-21', order: 20230121 },
  'ST-08': { date: '2023-01-21', order: 20230121 },
  'ST-07': { date: '2023-01-21', order: 20230121 },
  'ST-06': { date: '2022-09-30', order: 20220930 },
  'ST-05': { date: '2022-08-06', order: 20220806 },
  'ST-04': { date: '2022-07-08', order: 20220708 },
  'ST-03': { date: '2022-07-08', order: 20220708 },
  'ST-02': { date: '2022-07-08', order: 20220708 },
  'ST-01': { date: '2022-07-08', order: 20220708 },

  // Specials & Promos
  'SPECIAL': { date: '2024-06-01', order: 20240601 },
  'PROMO': { date: '2023-06-01', order: 20230601 },
};

function resolveCardRelease(cardId: string, packCode: string | null): { date: string; order: number } {
  // 1. Prioritize the pack code the card is released in!
  if (packCode) {
    const cleanCode = packCode.toUpperCase().trim();
    if (PACK_DATES[cleanCode]) {
      return PACK_DATES[cleanCode];
    }
    const withDashMatch = cleanCode.match(/^([A-Z]+)(\d+)$/);
    if (withDashMatch) {
      const dashed = `${withDashMatch[1]}-${withDashMatch[2].padStart(2, '0')}`;
      if (PACK_DATES[dashed]) return PACK_DATES[dashed];
    }
  }

  // 2. Fallback to card ID prefix (e.g. OP17-001 -> OP-17)
  const opMatch = cardId.match(/^(OP|EB|ST|PRB)(\d+)/i);
  if (opMatch) {
    const type = opMatch[1].toUpperCase();
    const num = parseInt(opMatch[2], 10);
    const standardCode = `${type}-${num.toString().padStart(2, '0')}`;
    if (PACK_DATES[standardCode]) {
      return PACK_DATES[standardCode];
    }
  }

  return { date: '2023-01-01', order: 20230101 };
}

async function ensureOP18PackAndCards() {
  console.log('📦 Checking / seeding OP-18 upcoming pack & preview cards...');
  
  // 1. Upsert OP-18 pack
  const pack18 = await prisma.pack.upsert({
    where: { id: '569118' },
    update: {
      code: 'OP-18',
      name: 'BOOSTER PACK OP-18 [COMING SOON / PRE-RELEASE]',
      seriesType: 'BOOSTER',
      language: 'ja',
      releaseDate: '2026-11-28',
      releaseOrder: 20261128,
      cardsCount: 4,
    },
    create: {
      id: '569118',
      code: 'OP-18',
      name: 'BOOSTER PACK OP-18 [COMING SOON / PRE-RELEASE]',
      seriesType: 'BOOSTER',
      language: 'ja',
      releaseDate: '2026-11-28',
      releaseOrder: 20261128,
      cardsCount: 4,
    },
  });
  console.log('  OP-18 pack confirmed:', pack18.name);

  // 2. Teaser / Preview cards for OP-18 (Revolutionary Army & New Dawn)
  const op18Cards = [
    {
      id: 'OP18-001',
      packId: '569118',
      name: 'Monkey.D.Dragon',
      category: 'Leader',
      colors: 'Red,Black',
      cost: 5,
      power: 5000,
      counter: null,
      attributes: 'Special',
      types: 'Revolutionary Army',
      rarity: 'Leader',
      effect: '[Activate: Main] [Once Per Turn] Give up to 1 of your Leader or Character cards +1000 power during this turn.',
      trigger: null,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10001.jpg',
      isAltArt: false,
      hasJpPrint: true,
      releaseDate: '2026-11-28',
      releaseOrder: 20261128.9,
      yuyuPrice: 3500,
      marketPrice: 3500,
    },
    {
      id: 'OP18-002',
      packId: '569118',
      name: 'Sabo',
      category: 'Character',
      colors: 'Red',
      cost: 6,
      power: 7000,
      counter: 1000,
      attributes: 'Special',
      types: 'Revolutionary Army',
      rarity: 'SuperRare',
      effect: '[On Play] If your Leader has the {Revolutionary Army} type, K.O. up to 1 of your opponent\'s Characters with 5000 power or less.',
      trigger: null,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10002.jpg',
      isAltArt: false,
      hasJpPrint: true,
      releaseDate: '2026-11-28',
      releaseOrder: 20261128.8,
      yuyuPrice: 1800,
      marketPrice: 1800,
    },
    {
      id: 'OP18-003',
      packId: '569118',
      name: 'Bartholomew Kuma',
      category: 'Character',
      colors: 'Black',
      cost: 7,
      power: 8000,
      counter: null,
      attributes: 'Strike',
      types: 'Revolutionary Army',
      rarity: 'SecretRare',
      effect: '[Blocker] [On K.O.] Choose up to 1 of your opponent\'s Characters with cost 6 or less and place it at the bottom of the owner\'s deck.',
      trigger: null,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10174.jpg',
      isAltArt: false,
      hasJpPrint: true,
      releaseDate: '2026-11-28',
      releaseOrder: 20261128.7,
      yuyuPrice: 6800,
      marketPrice: 6800,
    },
    {
      id: 'OP18-004',
      packId: '569118',
      name: 'Emporio.Ivankov',
      category: 'Character',
      colors: 'Red',
      cost: 4,
      power: 5000,
      counter: 1000,
      attributes: 'Special',
      types: 'Revolutionary Army,Newkama',
      rarity: 'Rare',
      effect: '[On Play] Draw cards until you have 4 cards in your hand.',
      trigger: null,
      imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10004.jpg',
      isAltArt: false,
      hasJpPrint: true,
      releaseDate: '2026-11-28',
      releaseOrder: 20261128.6,
      yuyuPrice: 600,
      marketPrice: 600,
    },
  ];

  for (const c of op18Cards) {
    await prisma.card.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  console.log('  OP-18 preview cards upserted successfully!');
}

async function main() {
  console.log('🗓️  Starting official release dates & chronological order population...');

  // 0. Ensure OP-18 pack and preview cards
  await ensureOP18PackAndCards();

  // 1. Update all packs
  const packs = await prisma.pack.findMany();
  console.log(`Found ${packs.length} packs to update.`);

  for (const pack of packs) {
    const code = pack.code || '';
    const dateInfo = PACK_DATES[code] || resolveCardRelease(code, code);
    await prisma.pack.update({
      where: { id: pack.id },
      data: {
        releaseDate: dateInfo.date,
        releaseOrder: dateInfo.order,
      },
    });
  }
  console.log('✅ Packs release dates updated!');

  // 2. Update all cards in batches
  const totalCards = await prisma.card.count();
  console.log(`Updating ${totalCards} cards with exact release dates...`);

  const BATCH_SIZE = 500;
  for (let skip = 0; skip < totalCards; skip += BATCH_SIZE) {
    const batch = await prisma.card.findMany({
      skip,
      take: BATCH_SIZE,
      select: {
        id: true,
        pack: {
          select: { code: true },
        },
      },
    });

    const updates = batch.map((card) => {
      const info = resolveCardRelease(card.id, card.pack?.code || null);
      return prisma.card.update({
        where: { id: card.id },
        data: {
          releaseDate: info.date,
          releaseOrder: info.order,
        },
      });
    });

    await prisma.$transaction(updates);
    console.log(`  Processed ${Math.min(skip + BATCH_SIZE, totalCards)} / ${totalCards} cards`);
  }

  console.log('🎉 Successfully populated release dates and chronological order for all cards!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
