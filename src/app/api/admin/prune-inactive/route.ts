import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIsChiefAdmin } from '@/lib/supabase-sync';

export const dynamic = 'force-dynamic';

const DEFAULT_SUPABASE_URL = 'https://miywbfkbdscnzxbnycme.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_fv6BrsbJZV-hutcDA-pOcA_cR6rxvLE';

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

  // 2. Check custom header from admin UI
  const userTag = req.headers.get('x-admin-tag');
  const userEmail = req.headers.get('x-admin-email');
  if (userEmail && checkIsChiefAdmin({ email: userEmail, tag: userTag })) {
    return true;
  }

  // 3. Check Admin Session Cookie
  const sessionUser = getSessionUser(req);
  if (sessionUser && (checkIsChiefAdmin(sessionUser) || sessionUser.role === 'admin')) {
    return true;
  }

  return false;
}

async function fetchCloudProfiles(ids?: string[]): Promise<any[]> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return [];

  try {
    let query = `${sbUrl}/rest/v1/profiles?select=id,username,email,tag,role,crew,rank,created_at,updated_at,last_login,last_active_at`;
    if (ids && ids.length > 0) {
      query += `&id=in.(${ids.map(encodeURIComponent).join(',')})`;
    }
    const res = await fetch(query, {
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchCloudProfiles error:', e);
    return [];
  }
}

async function deleteCloudUserData(userId: string): Promise<void> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return;

  const headers = {
    apikey: sbKey,
    Authorization: `Bearer ${sbKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Delete user cards in cloud
  try {
    await fetch(`${sbUrl}/rest/v1/user_cards?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {}

  // 2. Delete user sales in cloud
  try {
    await fetch(`${sbUrl}/rest/v1/card_sales?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {}

  // 3. Delete user friendships if any
  try {
    await fetch(`${sbUrl}/rest/v1/friendships?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers,
    });
    await fetch(`${sbUrl}/rest/v1/friendships?friend_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {}

  // 4. Delete user profile in cloud
  try {
    await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {}
}

async function reclaimInviteCodeForUser(email?: string | null, username?: string | null, crew?: string | null): Promise<string | null> {
  let reclaimed: string | null = null;

  // 1. Check crew for CODE:XYZ format
  if (crew && typeof crew === 'string' && crew.startsWith('CODE:')) {
    const rawCode = crew.replace('CODE:', '').trim().toUpperCase();
    if (rawCode) {
      try {
        await prisma.betaInviteCode.upsert({
          where: { code: rawCode },
          create: { code: rawCode, used: false, usedBy: null, usedAt: null },
          update: { used: false, usedBy: null, usedAt: null },
        });
        reclaimed = rawCode;
      } catch (e) {
        console.warn(`Failed to reclaim crew code ${rawCode}:`, e);
      }
    }
  }

  // 2. Search betaInviteCode by email or username
  try {
    const orConditions: any[] = [];
    if (email) orConditions.push({ usedBy: { contains: email } });
    if (username) orConditions.push({ usedBy: { contains: username } });

    if (orConditions.length > 0) {
      const matchingCodes = await prisma.betaInviteCode.findMany({
        where: { OR: orConditions },
      });

      for (const inv of matchingCodes) {
        await prisma.betaInviteCode.update({
          where: { id: inv.id },
          data: { used: false, usedBy: null, usedAt: null },
        });
        if (!reclaimed) reclaimed = inv.code;
      }
    }
  } catch (e) {
    console.warn('Failed to search/update invite codes by user identifier:', e);
  }

  return reclaimed;
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
    // 1. Fetch Supabase cloud profiles
    const cloudProfiles = await fetchCloudProfiles();

    // 2. Safely fetch SQLite users
    let sqliteUsers: any[] = [];
    try {
      sqliteUsers = await prisma.user.findMany({
        include: { _count: { select: { userCards: true } } },
      });
    } catch {}

    // Merge unique users by email/id
    const userMap = new Map<string, any>();
    for (const p of cloudProfiles) {
      userMap.set(p.id, {
        id: p.id,
        username: p.username || 'Unknown',
        tag: p.tag || `@${p.username || 'unknown'}`,
        email: p.email || '',
        rank: p.rank || 'Collector',
        role: p.role || 'user',
        collectionSize: 0,
        createdAt: new Date(p.created_at || Date.now()),
        lastActiveAt: new Date(p.last_active_at || p.last_login || p.updated_at || p.created_at || Date.now()),
      });
    }

    for (const u of sqliteUsers) {
      const existing = userMap.get(u.id);
      if (existing) {
        existing.collectionSize = u._count?.userCards || existing.collectionSize;
      } else {
        userMap.set(u.id, {
          id: u.id,
          username: u.username,
          tag: u.tag,
          email: u.email,
          rank: u.rank,
          role: u.role,
          collectionSize: u._count?.userCards || 0,
          createdAt: new Date(u.createdAt || Date.now()),
          lastActiveAt: new Date(u.lastActiveAt || u.createdAt || Date.now()),
        });
      }
    }

    const allUsers = Array.from(userMap.values());

    const candidates = allUsers.filter((u) => {
      if (checkIsChiefAdmin(u)) return false;
      if (u.rank === 'Admiral' || u.rank === 'Fleet Admiral' || u.role === 'admin') return false;

      const isGhost = includeGhosts && u.createdAt < ghostCutoff && u.collectionSize === 0;
      const isInactive = u.lastActiveAt < inactiveCutoff;

      return isGhost || isInactive;
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
      candidates: candidates.map((u) => {
        const isGhost = includeGhosts && u.createdAt < ghostCutoff && u.collectionSize === 0;
        return {
          id: u.id,
          username: u.username,
          tag: u.tag,
          email: u.email,
          collectionSize: u.collectionSize,
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

    // 1. Fetch Supabase cloud profiles
    const cloudProfiles = await fetchCloudProfiles(targetUserIds.length > 0 ? targetUserIds : undefined);

    // 2. Fetch SQLite users safely
    let sqliteUsers: any[] = [];
    try {
      sqliteUsers = await prisma.user.findMany({
        where: targetUserIds.length > 0 ? { id: { in: targetUserIds } } : undefined,
        include: { _count: { select: { userCards: true } } },
      });
    } catch (dbErr) {
      console.warn('SQLite user query bypassed:', dbErr);
    }

    // Merge records
    const userMap = new Map<string, any>();
    for (const p of cloudProfiles) {
      userMap.set(p.id, {
        id: p.id,
        username: p.username || 'Unknown',
        tag: p.tag || `@${p.username || 'unknown'}`,
        email: p.email || '',
        crew: p.crew || '',
        rank: p.rank || 'Collector',
        role: p.role || 'user',
        collectionSize: 0,
        createdAt: new Date(p.created_at || Date.now()),
        lastActiveAt: new Date(p.last_active_at || p.last_login || p.updated_at || p.created_at || Date.now()),
      });
    }

    for (const u of sqliteUsers) {
      const existing = userMap.get(u.id);
      if (existing) {
        existing.collectionSize = u._count?.userCards || existing.collectionSize;
      } else {
        userMap.set(u.id, {
          id: u.id,
          username: u.username,
          tag: u.tag,
          email: u.email,
          crew: u.crew || '',
          rank: u.rank,
          role: u.role,
          collectionSize: u._count?.userCards || 0,
          createdAt: new Date(u.createdAt || Date.now()),
          lastActiveAt: new Date(u.lastActiveAt || u.createdAt || Date.now()),
        });
      }
    }

    const allUsers = Array.from(userMap.values());

    const toPrune = allUsers.filter((u) => {
      // Never delete chief admin or protected accounts
      if (checkIsChiefAdmin(u)) return false;
      if (u.rank === 'Admiral' || u.rank === 'Fleet Admiral' || u.role === 'admin') return false;

      // If user IDs were explicitly specified by the admin in checkboxes, prune them
      if (targetUserIds.length > 0) return true;

      const isGhost = includeGhosts && u.createdAt < ghostCutoff && u.collectionSize === 0;
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
      // 1. Recycle used invite codes back to the available pool
      const reclaimedCode = await reclaimInviteCodeForUser(user.email, user.username, user.crew);
      if (reclaimedCode) {
        reclaimedCodes.push(reclaimedCode);
      }

      // 2. Cascade delete in Supabase cloud (user_cards, card_sales, friendships, profile)
      await deleteCloudUserData(user.id);

      // 3. Delete in SQLite if user existed there
      try {
        await prisma.user.deleteMany({
          where: {
            OR: [
              { id: user.id },
              ...(user.email ? [{ email: user.email }] : []),
            ],
          },
        });
      } catch (delErr) {
        console.warn(`Prisma delete bypassed for ${user.id}:`, delErr);
      }

      prunedDetails.push({
        id: user.id,
        username: user.username,
        email: user.email,
        tag: user.tag,
        cardsDeleted: user.collectionSize,
        lastActiveAt: user.lastActiveAt,
        reclaimedCode,
      });
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      prunedCount: prunedDetails.length,
      reclaimedCodesCount: reclaimedCodes.length,
      reclaimedCodes,
      prunedUsers: prunedDetails,
      message: `Successfully recycled ${prunedDetails.length} account(s) and restored ${reclaimedCodes.length} beta invite slot(s).`,
    });
  } catch (error: any) {
    console.error('Prune execution error:', error);
    return NextResponse.json({ error: error.message || 'Failed to prune accounts' }, { status: 500 });
  }
}
