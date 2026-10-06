import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIsChiefAdmin } from '@/lib/supabase-sync';

export const dynamic = 'force-dynamic';

function getSessionUser(req: NextRequest) {
  try {
    const raw = req.cookies.get('logpose_session')?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

function isAuthorized(req: NextRequest): boolean {
  // 1. Check Secret Header (useful for cron jobs or CLI triggers)
  const secretHeader = req.headers.get('x-admin-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (expectedSecret && secretHeader === expectedSecret) {
    return true;
  }

  // 2. Check Admin Session Cookie
  const sessionUser = getSessionUser(req);
  if (sessionUser && checkIsChiefAdmin(sessionUser)) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '14', 10);
  const includeGhosts = searchParams.get('includeGhosts') !== 'false';

  const inactiveCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const ghostCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  try {
    const allUsers = await prisma.user.findMany({
      include: {
        _count: {
          select: { userCards: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const candidates = allUsers.filter((u) => {
      // Never delete chief admin or protected accounts
      if (checkIsChiefAdmin(u)) return false;
      if (u.rank === 'Admiral' || u.rank === 'Fleet Admiral') return false;

      const isGhost = includeGhosts && u.createdAt < ghostCutoff && u._count.userCards === 0;
      const isInactive = u.lastActiveAt < inactiveCutoff;

      return isGhost || isInactive;
    });

    const candidateEmails = candidates.map((c) => c.email.toLowerCase());
    const usedInviteCodes = await prisma.betaInviteCode.findMany({
      where: {
        usedBy: { in: candidateEmails },
      },
    });

    return NextResponse.json({
      success: true,
      dryRun: true,
      rules: {
        inactivityDays: days,
        inactiveCutoff: inactiveCutoff.toISOString(),
        ghostDays: 3,
        ghostCutoff: ghostCutoff.toISOString(),
      },
      totalRegisteredUsers: allUsers.length,
      candidateCount: candidates.length,
      reclaimableInviteCodesCount: usedInviteCodes.length,
      candidates: candidates.map((u) => {
        const isGhost = includeGhosts && u.createdAt < ghostCutoff && u._count.userCards === 0;
        return {
          id: u.id,
          username: u.username,
          tag: u.tag,
          email: u.email,
          collectionSize: u._count.userCards,
          createdAt: u.createdAt,
          lastActiveAt: u.lastActiveAt,
          reason: isGhost ? 'Ghost Account (0 cards, registered >3 days)' : `Inactive (> ${days} days)`,
        };
      }),
    });
  } catch (error: any) {
    console.error('Prune preview error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch prune candidates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const days = parseInt(body.daysInactive || '14', 10);
    const includeGhosts = body.includeGhosts !== false;
    const dryRun = Boolean(body.dryRun);
    const targetUserIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];

    const inactiveCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const ghostCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const allUsers = await prisma.user.findMany({
      where: targetUserIds.length > 0 ? { id: { in: targetUserIds } } : undefined,
      include: {
        _count: {
          select: { userCards: true },
        },
      },
    });

    const toPrune = allUsers.filter((u) => {
      // Never delete chief admin or protected accounts
      if (checkIsChiefAdmin(u)) return false;
      if (u.rank === 'Admiral' || u.rank === 'Fleet Admiral') return false;

      if (targetUserIds.length > 0) return true;

      const isGhost = includeGhosts && u.createdAt < ghostCutoff && u._count.userCards === 0;
      const isInactive = u.lastActiveAt < inactiveCutoff;

      return isGhost || isInactive;
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        prunedCount: toPrune.length,
        candidateIds: toPrune.map((u) => u.id),
      });
    }

    const prunedDetails: any[] = [];
    const reclaimedCodes: string[] = [];

    for (const user of toPrune) {
      // 1. Recycle used invite codes back to available pool
      try {
        const invite = await prisma.betaInviteCode.findFirst({
          where: { usedBy: user.email },
        });
        if (invite) {
          await prisma.betaInviteCode.update({
            where: { id: invite.id },
            data: {
              used: false,
              usedBy: null,
              usedAt: null,
            },
          });
          reclaimedCodes.push(invite.code);
        }
      } catch (e) {
        console.warn(`Failed to recycle invite code for ${user.email}:`, e);
      }

      // 2. Cascade delete user (automatically wipes UserCard and VerificationCode)
      await prisma.user.delete({
        where: { id: user.id },
      });

      prunedDetails.push({
        id: user.id,
        username: user.username,
        email: user.email,
        tag: user.tag,
        cardsDeleted: user._count.userCards,
        lastActiveAt: user.lastActiveAt,
      });
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      prunedCount: prunedDetails.length,
      reclaimedCodesCount: reclaimedCodes.length,
      reclaimedCodes,
      prunedUsers: prunedDetails,
      message: `Successfully pruned ${prunedDetails.length} inactive accounts and recycled ${reclaimedCodes.length} beta invite slots.`,
    });
  } catch (error: any) {
    console.error('Prune execution error:', error);
    return NextResponse.json({ error: error.message || 'Failed to prune accounts' }, { status: 500 });
  }
}
