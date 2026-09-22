import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const total = await prisma.card.count();
  const baseCards = await prisma.card.count({
    where: {
      NOT: [
        { id: { contains: '_p' } },
        { id: { contains: '_r' } },
      ],
    },
  });
  const parallels = await prisma.card.count({ where: { id: { contains: '_p' } } });
  const reprints = await prisma.card.count({ where: { id: { contains: '_r' } } });

  console.log({ total, baseCards, parallels, reprints });
}

check().finally(() => prisma.$disconnect());
