import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.findMany({
    where: { id: { startsWith: 'EB01-015' } },
    select: { id: true, name: true, marketPrice: true, yuyuPrice: true, hasJpPrint: true, isAltArt: true, imageUrl: true }
  });
  console.table(cards);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
