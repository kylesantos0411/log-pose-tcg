import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const cards = await prisma.card.findMany({
    where: {
      OR: [
        { id: { contains: 'OP05-119' } },
        { id: { contains: 'EB01-006' } },
        { id: { contains: 'OP06-118' } },
        { id: { contains: 'OP09-118' } }
      ]
    },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, promoSource: true },
    orderBy: { id: 'asc' }
  });
  console.table(cards);
}

check().finally(() => prisma.$disconnect());
