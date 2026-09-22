import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const total = await prisma.card.count();
  const withYuyu = await prisma.card.count({ where: { yuyuPrice: { not: null, gt: 0 } } });
  const withoutYuyu = await prisma.card.count({ where: { OR: [{ yuyuPrice: null }, { yuyuPrice: 0 }] } });
  console.log({ total, withYuyu, withoutYuyu });
}

check().finally(() => prisma.$disconnect());
