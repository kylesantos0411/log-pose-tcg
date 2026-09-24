/**
 * Beta seed script — creates 5 pre-made tester accounts + 5 invite codes.
 * Run with: node prisma/seed-beta.mjs
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/kyle/.gemini/antigravity/scratch/optcg-app/prisma/dev.db' } },
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'logpose_salt_2024').digest('hex');
}

const BETA_ACCOUNTS = [
  { username: 'LuffyBeta',  email: 'luffy.beta@logpose.test',  password: 'LuffyBeta2026!',  avatar: '👒', crew: 'Straw Hat Pirates',   tag: 'PIRATE-LUFFYBETA-0001' },
  { username: 'ZoroBeta',   email: 'zoro.beta@logpose.test',   password: 'ZoroBeta2026!',   avatar: '⚔️', crew: 'Straw Hat Pirates',   tag: 'PIRATE-ZOROBETA-0002' },
  { username: 'NamiBeta',   email: 'nami.beta@logpose.test',   password: 'NamiBeta2026!',   avatar: '🧭', crew: 'Straw Hat Pirates',   tag: 'PIRATE-NAMIBETA-0003' },
  { username: 'SanjiBeta',  email: 'sanji.beta@logpose.test',  password: 'SanjiBeta2026!',  avatar: '🍖', crew: 'Straw Hat Pirates',   tag: 'PIRATE-SANJIBETA-0004' },
  { username: 'RobinBeta',  email: 'robin.beta@logpose.test',  password: 'RobinBeta2026!',  avatar: '🌸', crew: 'Revolutionary Army',  tag: 'PIRATE-ROBINBETA-0005' },
];

const INVITE_CODES = [
  'LOGPOSE-BETA-001',
  'LOGPOSE-BETA-002',
  'LOGPOSE-BETA-003',
  'LOGPOSE-BETA-004',
  'LOGPOSE-BETA-005',
];

async function main() {
  console.log('🏴‍☠️ Seeding beta accounts and invite codes...\n');

  // Create pre-made accounts
  for (const acct of BETA_ACCOUNTS) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: acct.email }, { username: acct.username }] },
    });
    if (existing) {
      console.log(`  ⚠️  Account already exists: ${acct.username} — skipping`);
      continue;
    }
    await prisma.user.create({
      data: {
        username: acct.username,
        email: acct.email,
        passwordHash: hashPassword(acct.password),
        tag: acct.tag,
        avatar: acct.avatar,
        crew: acct.crew,
        rank: 'Cabin Boy',
        rankBadge: '⚓',
        isVerified: true,
      },
    });
    console.log(`  ✅ Created: ${acct.username} (${acct.email}) / ${acct.password}`);
  }

  console.log('');

  // Create invite codes
  for (const code of INVITE_CODES) {
    const existing = await prisma.betaInviteCode.findUnique({ where: { code } });
    if (existing) {
      console.log(`  ⚠️  Invite code already exists: ${code} — skipping`);
      continue;
    }
    await prisma.betaInviteCode.create({ data: { code } });
    console.log(`  🎟️  Created invite code: ${code}`);
  }

  console.log('\n✅ Beta seed complete!\n');
  console.log('=== PRE-MADE ACCOUNTS ===');
  BETA_ACCOUNTS.forEach(a => {
    console.log(`  ${a.username.padEnd(12)} | ${a.email.padEnd(30)} | ${a.password}`);
  });
  console.log('\n=== INVITE CODES ===');
  INVITE_CODES.forEach(c => console.log(`  ${c}`));
  console.log('');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
