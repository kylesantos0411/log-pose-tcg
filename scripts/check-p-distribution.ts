import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const cards = await prisma.card.findMany({
    where: { id: { contains: '_p' } },
    select: { id: true, promoSource: true },
  });

  const pSuffixCounts: Record<string, number> = {};
  for (const c of cards) {
    const match = c.id.match(/_p(\d+)/);
    if (match) {
      const suffix = `_p${match[1]}`;
      pSuffixCounts[suffix] = (pSuffixCounts[suffix] || 0) + 1;
    }
  }

  console.log('Parallel suffix counts:');
  console.table(pSuffixCounts);
}

check().finally(() => prisma.$disconnect());
