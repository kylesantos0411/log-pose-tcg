import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const cards = await prisma.card.findMany({
    where: { id: { contains: 'OP05-119' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, imageUrl: true, promoSource: true },
    orderBy: { id: 'asc' }
  });
  console.log(JSON.stringify(cards, null, 2));
}

check().finally(() => prisma.$disconnect());
