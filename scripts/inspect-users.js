const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectUsers() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { userCards: true, verificationCodes: true },
      },
    },
  });
  console.log(`Total Users in DB: ${users.length}`);
  users.forEach((u) => {
    console.log(`User: ${u.id} | username: ${u.username} | email: ${u.email} | tag: ${u.tag} | cards: ${u._count.userCards} | codes: ${u._count.verificationCodes}`);
  });
  const totalCodes = await prisma.verificationCode.count();
  console.log(`Total verification codes in DB: ${totalCodes}`);
}

inspectUsers().finally(() => prisma.$disconnect());
