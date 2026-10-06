import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHIEF_ADMIN_EMAILS = ['kylesantos0411@gmail.com'];
const CHIEF_ADMIN_TAGS = ['kaipuccino', '@kaipuccino'];

function isProtected(user: { email: string; tag?: string | null; username?: string | null; rank?: string | null }) {
  if (CHIEF_ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  if (user.tag && CHIEF_ADMIN_TAGS.includes(user.tag.toLowerCase())) return true;
  if (user.username && CHIEF_ADMIN_TAGS.includes(user.username.toLowerCase())) return true;
  if (user.rank === 'Admiral' || user.rank === 'Fleet Admiral') return true;
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute') || args.includes('-y');
  const daysArgIndex = args.indexOf('--days');
  const days = daysArgIndex !== -1 && args[daysArgIndex + 1] ? parseInt(args[daysArgIndex + 1], 10) : 14;
  const includeGhosts = !args.includes('--no-ghosts');

  console.log('='.repeat(60));
  console.log('       LOG POSE TCG - INACTIVE TESTER PRUNING TOOL');
  console.log('='.repeat(60));
  console.log(`Mode:            ${isExecute ? 'EXECUTE (REAL DELETION)' : 'DRY-RUN (SIMULATION ONLY)'}`);
  console.log(`Inactivity:      > ${days} days without activity`);
  console.log(`Ghost rule:      ${includeGhosts ? 'Active (> 3 days old with 0 cards in collection)' : 'Disabled'}`);
  console.log('='.repeat(60));

  const inactiveCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const ghostCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const allUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: { userCards: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total registered users found: ${allUsers.length}`);

  const candidates = allUsers.filter((u) => {
    if (isProtected(u)) return false;

    const isGhost = includeGhosts && u.createdAt < ghostCutoff && u._count.userCards === 0;
    const isInactive = u.lastActiveAt < inactiveCutoff;

    return isGhost || isInactive;
  });

  if (candidates.length === 0) {
    console.log('\n✅ No inactive or ghost accounts found. All tester accounts are active!');
    return;
  }

  console.log(`\nFound ${candidates.length} candidate(s) for recycling:\n`);
  candidates.forEach((u, idx) => {
    const isGhost = includeGhosts && u.createdAt < ghostCutoff && u._count.userCards === 0;
    const reason = isGhost ? 'Ghost (0 cards, >3d old)' : `Inactive (> ${days}d)`;
    console.log(`  ${idx + 1}. [${u.id}] ${u.username} (${u.email})`);
    console.log(`     Tag: ${u.tag} | Collection: ${u._count.userCards} cards | Last Active: ${u.lastActiveAt.toISOString().slice(0, 10)}`);
    console.log(`     Reason: ${reason}`);
  });

  if (!isExecute) {
    console.log('\n' + '-'.repeat(60));
    console.log('⚠️  DRY RUN ONLY: No database changes were made.');
    console.log('To execute this purge and reclaim slots, run:');
    console.log('  npx tsx scripts/prune_inactive_users.ts --execute');
    console.log('-'.repeat(60));
    return;
  }

  console.log('\n🚀 Executing pruning and recycling invite codes...');
  let reclaimedCount = 0;

  for (const u of candidates) {
    // 1. Recycle invite code
    const invite = await prisma.betaInviteCode.findFirst({
      where: { usedBy: u.email },
    });
    if (invite) {
      await prisma.betaInviteCode.update({
        where: { id: invite.id },
        data: { used: false, usedBy: null, usedAt: null },
      });
      console.log(`  ♻️  Recycled invite code [${invite.code}] from ${u.email}`);
      reclaimedCount++;
    }

    // 2. Cascade delete
    await prisma.user.delete({
      where: { id: u.id },
    });
    console.log(`  🗑️  Deleted user [${u.username}]`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Complete! Successfully pruned ${candidates.length} account(s) and reclaimed ${reclaimedCount} beta slot(s).`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
