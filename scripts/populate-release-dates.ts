import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official Japanese Release Dates & Chronological Ordering
const PACK_DATES: Record<string, { date: string; order: number }> = {
  // Boosters (OP) - Released in Japan
  'OP-10': { date: '2024-11-30', order: 20241130 }, // Royal Bloodlines (Nov 30, 2024) - LATEST RELEASE
  'OP-09': { date: '2024-08-31', order: 20240831 }, // Emperors in the New World (Aug 31, 2024)
  'OP-08': { date: '2024-05-25', order: 20240525 }, // Two Legends (May 25, 2024)
  'OP-07': { date: '2024-02-24', order: 20240224 }, // 500 Years in the Future (Feb 24, 2024)
  'OP-06': { date: '2023-11-25', order: 20231125 }, // Wings of the Captain (Nov 25, 2023)
  'OP-05': { date: '2023-08-26', order: 20230826 }, // Awakening of the New Era (Aug 26, 2023)
  'OP-04': { date: '2023-05-27', order: 20230527 }, // Kingdoms of Intrigue (May 27, 2023)
  'OP-03': { date: '2023-02-11', order: 20230211 }, // Pillars of Strength (Feb 11, 2023)
  'OP-02': { date: '2022-11-04', order: 20221104 }, // Paramount War (Nov 4, 2022)
  'OP-01': { date: '2022-07-22', order: 20220722 }, // Romance Dawn (Jul 22, 2022)

  // Extra Boosters (EB)
  'EB-02': { date: '2024-10-26', order: 20241026 }, // Anime 25th Collection (Oct 26, 2024)
  'EB-01': { date: '2024-01-27', order: 20240127 }, // Memorial Collection (Jan 27, 2024)

  // Premium Boosters (PRB)
  'PRB-01': { date: '2024-07-27', order: 20240727 }, // One Piece Card The Best (Jul 27, 2024)

  // Starter Decks (ST)
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

  // Unreleased / Future Pre-announcements (Placed in unreleased tier)
  'OP-11': { date: '2025-02-22', order: 10000011 },
  'OP-12': { date: '2025-05-31', order: 10000012 },
  'OP-13': { date: '2025-08-30', order: 10000013 },
  'OP-14': { date: '2025-11-29', order: 10000014 },
  'OP-15': { date: '2026-02-28', order: 10000015 },
  'OP-16': { date: '2026-05-30', order: 10000016 },
  'OP-17': { date: '2026-08-29', order: 10000017 },
  'OP14-EB04': { date: '2025-11-29', order: 10000014 },
  'OP15-EB04': { date: '2026-02-28', order: 10000015 },
  'EB-03': { date: '2025-06-28', order: 10000003 },
  'PRB-02': { date: '2025-07-26', order: 10000002 },
  'ST-21': { date: '2024-12-21', order: 10000021 },
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
  // 1. Try matching from card id prefix (e.g. OP10-001 -> OP-10)
  const opMatch = cardId.match(/^(OP|EB|ST|PRB)(\d+)/i);
  if (opMatch) {
    const type = opMatch[1].toUpperCase();
    const num = parseInt(opMatch[2], 10);
    const standardCode = `${type}-${num.toString().padStart(2, '0')}`;
    if (PACK_DATES[standardCode]) {
      return PACK_DATES[standardCode];
    }
  }

  // 2. Try matching from pack code
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

  return { date: '2023-01-01', order: 20230101 };
}

async function main() {
  console.log('🗓️  Starting official release dates & order population...');

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
