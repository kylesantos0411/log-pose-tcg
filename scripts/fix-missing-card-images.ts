import { prisma } from '../src/lib/prisma';
import https from 'node:https';

function checkUrlStatus(url: string): Promise<number> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        family: 4,
        timeout: 4000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://onepiece-cardgame.com/',
        },
      },
      (res) => {
        resolve(res.statusCode || 0);
      }
    );
    req.on('error', () => resolve(0));
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
  });
}

async function main() {
  const cards = await prisma.card.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: '' }],
    },
  });

  console.log(`Found ${cards.length} cards with missing imageUrl.`);

  for (const card of cards) {
    const baseCode = card.cardNumber || card.id.split('_')[0];
    const candidate1 = `https://onepiece-cardgame.com/images/cardlist/card/${card.id}.png`;
    const candidate2 = `https://onepiece-cardgame.com/images/cardlist/card/${baseCode}.png`;
    const candidate3 = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${card.id}.png`;
    const candidate4 = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${baseCode}.png`;

    let chosenUrl = candidate1;
    const status1 = await checkUrlStatus(candidate1);
    if (status1 >= 200 && status1 < 300) {
      chosenUrl = candidate1;
    } else {
      const status2 = await checkUrlStatus(candidate2);
      if (status2 >= 200 && status2 < 300) {
        chosenUrl = candidate2;
      } else {
        const status3 = await checkUrlStatus(candidate3);
        if (status3 >= 200 && status3 < 300) {
          chosenUrl = candidate3;
        } else {
          chosenUrl = candidate4;
        }
      }
    }

    await prisma.card.update({
      where: { id: card.id },
      data: { imageUrl: chosenUrl },
    });
    console.log(`[FIXED] ${card.id} -> ${chosenUrl}`);
  }

  const remaining = await prisma.card.count({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: '' }],
    },
  });
  console.log(`Remaining null cards in database: ${remaining}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
