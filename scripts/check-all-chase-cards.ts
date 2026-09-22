import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const codes = ['OP01-120', 'OP02-013', 'OP03-122', 'OP04-083'];

async function main() {
  for (const c of codes) {
    const cards = await p.card.findMany({
      where: { id: { startsWith: c } },
      select: { id: true, name: true, marketPrice: true, yuyuPrice: true, isAltArt: true, imageUrl: true }
    });
    console.log('\n--- ' + c + ' ---');
    console.table(cards.map(x => ({ id: x.id, usd: x.marketPrice, jpy: x.yuyuPrice, isAlt: x.isAltArt, img: x.imageUrl?.split('?')[0] })));
  }
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
