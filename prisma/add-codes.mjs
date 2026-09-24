import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/kyle/.gemini/antigravity/scratch/optcg-app/prisma/dev.db' } },
});

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
  const existingCodes = await prisma.betaInviteCode.findMany();
  const existingCodeStrings = new Set(existingCodes.map(c => c.code));

  console.log(`Current total codes in DB: ${existingCodes.length}`);

  const targetTotal = 15;
  const needed = Math.max(0, targetTotal - existingCodes.length);

  console.log(`Generating ${needed} new codes to reach total of ${targetTotal}...\n`);

  const createdCodes = [];
  while (createdCodes.length < needed) {
    const code = generateSecureCode('POSE');
    if (!existingCodeStrings.has(code) && !createdCodes.includes(code)) {
      createdCodes.push(code);
    }
  }

  for (const code of createdCodes) {
    await prisma.betaInviteCode.create({ data: { code } });
    console.log(`  ➕ Added: ${code}`);
  }

  const allCodes = await prisma.betaInviteCode.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n✅ Total codes now: ${allCodes.length}\n`);
  console.log('=== ALL 15 INVITE CODES ===');
  allCodes.forEach((c, idx) => {
    const status = c.used ? `[USED by ${c.usedBy || 'unknown'}]` : '[AVAILABLE]';
    console.log(`  ${String(idx + 1).padStart(2, ' ')}. ${c.code}  ${status}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
