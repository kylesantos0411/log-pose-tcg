import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkIsChiefAdmin } from '@/lib/supabase-sync';

export const dynamic = 'force-dynamic';

const STANDARD_CODES = [
  // Original batch (15)
  'POSE-TT9W-BGZ2',
  'POSE-FM5C-53JT',
  'POSE-3ZJ3-KSGT',
  'POSE-DMC2-F3FD',
  'POSE-TNBZ-S9GE',
  'POSE-FVFE-868K',
  'POSE-QBMZ-RZM7',
  'POSE-2NR5-WK5H',
  'POSE-ZDH9-RY4G',
  'POSE-XZAP-WHWF',
  'POSE-7Y8P-NG9X',
  'POSE-NAJY-JWTA',
  'POSE-VZXH-FRPW',
  'POSE-XPZU-69EF',
  'POSE-4BQ2-QTQF',
  // Batch 2 (20 new codes)
  'POSE-K7MN-4WRX',
  'POSE-B9PC-LZQJ',
  'POSE-H2VT-8YDF',
  'POSE-R6SK-EXNM',
  'POSE-J5FG-CWBT',
  'POSE-A3PL-7GHU',
  'POSE-N8YD-RKQZ',
  'POSE-D4WX-5TNV',
  'POSE-M6BJ-PHSE',
  'POSE-T2CK-93LY',
  'POSE-W5NR-AQFD',
  'POSE-X7VH-MKGE',
  'POSE-Q9LZ-2BSW',
  'POSE-E4TM-YRCP',
  'POSE-G8KW-6JNF',
  'POSE-U3PX-DHQB',
  'POSE-S7EV-WNKT',
  'POSE-C2MH-FLRZ',
  'POSE-F6YB-TPGJ',
  'POSE-L9QD-8VXC',
];

const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateSecureCode(prefix = 'POSE'): string {
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
  // 1. Check Secret Header (useful for CLI/cron)
  const secretHeader = req.headers.get('x-admin-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (expectedSecret && secretHeader === expectedSecret) {
    return true;
  }

  // 2. Check Admin Session Cookie
  const sessionUser = getSessionUser(req);
  if (sessionUser && (checkIsChiefAdmin(sessionUser) || sessionUser.role === 'admin')) {
    return true;
  }

  // 3. Check custom header from admin UI
  const userTag = req.headers.get('x-admin-tag');
  const userEmail = req.headers.get('x-admin-email');
  if (userEmail && checkIsChiefAdmin({ email: userEmail, tag: userTag })) {
    return true;
  }

  return false;
}

/**
 * Ensure the baseline 35 invite codes exist in the database table
 */
async function ensureStandardCodesExist() {
  try {
    const existing = await prisma.betaInviteCode.findMany({
      select: { code: true },
    });
    const existingSet = new Set(existing.map((e) => e.code));

    const missing = STANDARD_CODES.filter((c) => !existingSet.has(c));
    if (missing.length > 0) {
      for (const code of missing) {
        await prisma.betaInviteCode.create({
          data: { code, used: false },
        });
      }
    }
  } catch (err) {
    console.warn('Failed to ensure standard invite codes exist:', err);
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    await ensureStandardCodesExist();

    const allCodes = await prisma.betaInviteCode.findMany({
      orderBy: [
        { used: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const availableCodes = allCodes.filter((c) => !c.used);
    const usedCodes = allCodes.filter((c) => c.used);

    return NextResponse.json({
      success: true,
      totalCount: allCodes.length,
      availableCount: availableCodes.length,
      usedCount: usedCodes.length,
      availableCodes,
      usedCodes,
    });
  } catch (err: any) {
    console.error('Failed to fetch invite codes:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch invite codes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'generate';

    if (action === 'generate') {
      const count = Math.min(Math.max(parseInt(body.count || '5', 10), 1), 50);
      const existing = await prisma.betaInviteCode.findMany({ select: { code: true } });
      const existingSet = new Set(existing.map((c) => c.code));

      const newCodes: string[] = [];
      while (newCodes.length < count) {
        const candidate = generateSecureCode('POSE');
        if (!existingSet.has(candidate) && !newCodes.includes(candidate)) {
          newCodes.push(candidate);
        }
      }

      for (const code of newCodes) {
        await prisma.betaInviteCode.create({
          data: { code, used: false },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully generated ${newCodes.length} new beta invite code(s)!`,
        generatedCodes: newCodes,
      });
    }

    if (action === 'create') {
      const rawCode = String(body.code || '').trim().toUpperCase();
      if (!rawCode || rawCode.length < 5 || rawCode.length > 30) {
        return NextResponse.json({ error: 'Invite code must be between 5 and 30 characters.' }, { status: 400 });
      }

      const existing = await prisma.betaInviteCode.findUnique({
        where: { code: rawCode },
      });

      if (existing) {
        return NextResponse.json({ error: `Invite code "${rawCode}" already exists.` }, { status: 400 });
      }

      const created = await prisma.betaInviteCode.create({
        data: { code: rawCode, used: false },
      });

      return NextResponse.json({
        success: true,
        message: `Custom invite code "${created.code}" created!`,
        inviteCode: created,
      });
    }

    if (action === 'reset') {
      const code = String(body.code || '').trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ error: 'Code is required to reset.' }, { status: 400 });
      }

      const updated = await prisma.betaInviteCode.update({
        where: { code },
        data: {
          used: false,
          usedBy: null,
          usedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Invite code "${code}" has been reset and is now available!`,
        inviteCode: updated,
      });
    }

    if (action === 'delete') {
      const code = String(body.code || '').trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ error: 'Code is required to delete.' }, { status: 400 });
      }

      await prisma.betaInviteCode.delete({
        where: { code },
      });

      return NextResponse.json({
        success: true,
        message: `Invite code "${code}" deleted.`,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Invite codes operation error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
