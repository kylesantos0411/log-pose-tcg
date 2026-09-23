import { PrismaClient } from '@prisma/client';
import { EXACT_CARD_ARTISTS, getCardArtist } from '../src/lib/artist-data';

const prisma = new PrismaClient();

function parseCardDetails(cardId: string, packCode?: string | null, promoSource?: string | null, isAltArt?: boolean) {
  // Extract physical card number from ID
  // e.g. OP05-119_p1 -> OP05-119
  // e.g. OP17_EB04-061_p2 -> EB04-061
  let cleanId = cardId;
  if (cleanId.includes('_') && cleanId.match(/^[A-Z0-9]+_[A-Z0-9]+-/)) {
    cleanId = cleanId.substring(cleanId.indexOf('_') + 1);
  }
  const cardNumber = cleanId.split('_')[0].trim();

  // Extract prefix from card number
  let printedSetCode = '';
  let originalSet = '';

  if (cardNumber.startsWith('P-')) {
    printedSetCode = 'P';
    originalSet = 'PROMO';
  } else if (cardNumber === '-' || cardNumber.includes('DON')) {
    printedSetCode = 'DON';
    originalSet = 'DON';
  } else {
    const dashIdx = cardNumber.indexOf('-');
    if (dashIdx > 0) {
      printedSetCode = cardNumber.substring(0, dashIdx);
      const match = printedSetCode.match(/^([A-Za-z]+)(\d+)$/);
      if (match) {
        originalSet = `${match[1].toUpperCase()}-${match[2]}`;
      } else {
        originalSet = printedSetCode;
      }
    } else {
      printedSetCode = cardNumber;
      originalSet = cardNumber;
    }
  }

  // Yuyu-tei set comes from the pack context
  const yuyuteiSet = packCode || originalSet;
  const displaySet = yuyuteiSet;

  // Determine printing type
  let printingType = 'Original';
  const promoUpper = (promoSource || '').toUpperCase();
  if (promoUpper.includes('スーパーパラレル') || promoUpper.includes('SUPER PARALLEL') || promoUpper.includes('MANGA')) {
    printingType = 'Super Parallel';
  } else if (promoUpper.includes('パラレル') || isAltArt || cardId.includes('_p')) {
    printingType = 'Parallel';
  } else if (originalSet !== yuyuteiSet && originalSet !== 'DON' && yuyuteiSet !== 'PROMO') {
    printingType = 'Reprint';
  }

  // Artist data
  const artProfile = getCardArtist(cardId);
  const artistName = artProfile?.name || null;
  const artistSource = artistName ? 'Binder Pirates' : null;
  const artistSourceUrl = artistName ? `https://www.binderpirates.com/cards/${cardNumber}` : null;
  const artistVerificationStatus = artistName ? 'verified' : 'missing';

  return {
    cardNumber,
    printedSetCode,
    originalSet,
    yuyuteiSet,
    displaySet,
    printingType,
    artistName,
    artistSource,
    artistSourceUrl,
    artistVerificationStatus,
  };
}

async function main() {
  console.log('🔄 Starting backfill of card fields in database...');
  const cards = await prisma.card.findMany({
    include: { pack: { select: { code: true } } },
  });

  console.log(`Found ${cards.length} cards to inspect and update.`);

  let updated = 0;
  for (const c of cards) {
    const details = parseCardDetails(c.id, c.pack?.code, c.promoSource, c.isAltArt);

    await prisma.card.update({
      where: { id: c.id },
      data: details,
    });
    updated++;
    if (updated % 500 === 0) {
      console.log(`  Updated ${updated}/${cards.length} cards...`);
    }
  }

  console.log(`✅ Backfill complete! Updated ${updated} cards.`);

  // Sample verification
  const sample = await prisma.card.findMany({
    where: { pack: { code: 'OP-17' } },
    select: {
      id: true,
      name: true,
      cardNumber: true,
      printedSetCode: true,
      originalSet: true,
      yuyuteiSet: true,
      displaySet: true,
      printingType: true,
      artistName: true,
    },
    take: 8,
  });

  console.log('\n--- VERIFIED OP-17 SAMPLE ---');
  console.table(sample);

  await prisma.$disconnect();
}

main().catch(console.error);
