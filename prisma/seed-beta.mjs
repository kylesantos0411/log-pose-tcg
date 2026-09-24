/**
 * Script to:
 * 1. Delete the 5 pre-made tester accounts from local SQLite
 * 2. Delete old predictable invite codes (LOGPOSE-BETA-001..005)
 * 3. Seed 10 new cryptographically secure, non-guessable invite codes
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/kyle/.gemini/antigravity/scratch/optcg-app/prisma/dev.db' } },
});

// Characters excluding ambiguous 0, O, 1, I, L
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateSecureCode(prefix = 'POSE') {
  const bytes = crypto.randomBytes(8);
  let chunk1 = '';
  let chunk2 = '';
  for (let i = 0; i < 4; i++) {
    chunk1 += CHARSET[bytes[i] % CHARSET.length];
  }
  for (let i = 4; i < 8; i++) {
    chunk2 += CHARSET[bytes[i] % CHARSET.length];
  }
  return `${prefix}-${chunk1}-${chunk2}`;
}

async function main() {
  console.log('🧹 Cleaning up pre-made tester accounts...\n');

  const emailsToDelete = [
    'luffy.beta@logpose.test',
    'zoro.beta@logpose.test',
    'nami.beta@logpose.test',
    'sanji.beta@logpose.test',
    'robin.beta@logpose.test',
  ];

  for (const email of emailsToDelete) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.delete({ where: { email } });
      console.log(`  🗑️ Deleted account: ${user.username} (${email})`);
    } else {
      console.log(`  ℹ️ Not found: ${email}`);
    }
  }

  console.log('\n🧹 Clearing old beta invite codes...\n');
  const deletedOldCodes = await prisma.betaInviteCode.deleteMany({
    where: {
      code: {
        startsWith: 'LOGPOSE-BETA-',
      },
    },
  });
  console.log(`  🗑️ Removed ${deletedOldCodes.count} old predictable invite codes.`);

  console.log('\n🎟️ Generating 15 secure, non-guessable invite codes...\n');
  const newCodes = [];
  while (newCodes.length < 15) {
    const code = generateSecureCode('POSE');
    if (!newCodes.includes(code)) {
      newCodes.push(code);
    }
  }

  for (const code of newCodes) {
    await prisma.betaInviteCode.create({
      data: {
        code,
      },
    });
    console.log(`  🔑 ${code}`);
  }

  console.log('\n✅ 10 secure invite codes generated and ready in database!');
}

main()
  .catch((e) => {
    console.error('Error during update:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
