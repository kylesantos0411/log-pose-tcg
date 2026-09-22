import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const cards = await prisma.card.findMany({
    where: { promoSource: { not: null } },
    select: { promoSource: true },
    distinct: ['promoSource'],
  });
  console.log('Total distinct promo sources:', cards.length);
  console.log(cards.map((c) => c.promoSource).filter(Boolean));
}

check().finally(() => prisma.$disconnect());
