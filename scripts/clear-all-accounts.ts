import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllAccounts() {
  console.log('Clearing all accounts, user cards, and verification codes...');

  const deletedCodes = await prisma.verificationCode.deleteMany();
  console.log(`Deleted ${deletedCodes.count} verification codes.`);

  const deletedUserCards = await prisma.userCard.deleteMany();
  console.log(`Deleted ${deletedUserCards.count} user cards.`);

  const deletedUsers = await prisma.user.deleteMany();
  console.log(`Deleted ${deletedUsers.count} user accounts.`);

  console.log('✅ Successfully cleared all created accounts from database.');
}

clearAllAccounts()
  .catch((e) => {
    console.error('Error clearing accounts:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
