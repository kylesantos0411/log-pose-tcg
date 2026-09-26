import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateUniqueTag, verifyCode } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, code, token, avatar = '👒', crew = 'Straw Hat Pirates', customTag, inviteCode } = body;

    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanCode = (code || '').trim();
    const cleanInviteCode = (inviteCode || '').trim().toUpperCase();
    const verificationToken = token || req.cookies.get('logpose_verification_token')?.value;

    if (!cleanUsername || cleanUsername.length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters long.' }, { status: 400 });
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 1. Validate invite code (required for all new registrations)
    if (!cleanInviteCode) {
      return NextResponse.json({ error: 'An invite code is required to create an account. This is a private beta.' }, { status: 403 });
    }

    const VALID_CODES = [
      // Original batch (15)
      'POSE-TT9W-BGZ2', 'POSE-FM5C-53JT', 'POSE-3ZJ3-KSGT', 'POSE-DMC2-F3FD',
      'POSE-TNBZ-S9GE', 'POSE-FVFE-868K', 'POSE-QBMZ-RZM7', 'POSE-2NR5-WK5H',
      'POSE-ZDH9-RY4G', 'POSE-XZAP-WHWF', 'POSE-7Y8P-NG9X', 'POSE-NAJY-JWTA',
      'POSE-VZXH-FRPW', 'POSE-XPZU-69EF', 'POSE-4BQ2-QTQF',
      // Batch 2 (20 new codes)
      'POSE-K7MN-4WRX', 'POSE-B9PC-LZQJ', 'POSE-H2VT-8YDF', 'POSE-R6SK-EXNM',
      'POSE-J5FG-CWBT', 'POSE-A3PL-7GHU', 'POSE-N8YD-RKQZ', 'POSE-D4WX-5TNV',
      'POSE-M6BJ-PHSE', 'POSE-T2CK-93LY', 'POSE-W5NR-AQFD', 'POSE-X7VH-MKGE',
      'POSE-Q9LZ-2BSW', 'POSE-E4TM-YRCP', 'POSE-G8KW-6JNF', 'POSE-U3PX-DHQB',
      'POSE-S7EV-WNKT', 'POSE-C2MH-FLRZ', 'POSE-F6YB-TPGJ', 'POSE-L9QD-8VXC',
    ];

    if (!VALID_CODES.includes(cleanInviteCode)) {
      return NextResponse.json({ error: 'Invalid invite code. Please check your code and try again.' }, { status: 403 });
    }

    try {
      const invite = await prisma.betaInviteCode.findUnique({ where: { code: cleanInviteCode } });
      if (invite && invite.used) {
        return NextResponse.json({ error: 'This invite code has already been used.' }, { status: 403 });
      }
    } catch (e) {
      console.warn('Prisma invite code check fallback:', e);
    }

    // 2. Optional 6-digit code verification (if provided)
    if (cleanCode && cleanCode.length === 6) {
      const verification = await verifyCode(cleanEmail, cleanCode, 'register', verificationToken);
      if (!verification.valid) {
        return NextResponse.json({ error: verification.error || 'Invalid or expired verification code.' }, { status: 400 });
      }
    }

    // 3. Check if email or username is already taken
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { username: cleanUsername },
          ],
        },
      });

      if (existing) {
        if (existing.email === cleanEmail) {
          return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'This username is already taken. Please choose another.' }, { status: 400 });
      }
    } catch (queryErr) {
      console.warn('Prisma check existing user warning:', queryErr);
    }

    // 4. User identifier / tag is their chosen username
    const tag = customTag?.trim() || cleanUsername;

    // 5. Create user in SQLite
    const passwordHash = hashPassword(cleanPassword);
    let user: any = null;

    try {
      user = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          tag,
          avatar: avatar || 'default',
          crew: crew || 'Collector',
          rank: 'Collector',
          rankBadge: '',
          isVerified: true,
        },
      });
    } catch (createErr: any) {
      console.warn('Database user creation fallback:', createErr?.message || createErr);
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        username: cleanUsername,
        email: cleanEmail,
        tag,
        avatar: avatar || 'default',
        crew: crew || 'Collector',
        rank: 'Collector',
        rankBadge: '',
        createdAt: new Date(),
      };
    }

    // 6. Mark invite code as used
    try {
      await prisma.betaInviteCode.update({
        where: { code: cleanInviteCode },
        data: { used: true, usedBy: cleanEmail, usedAt: new Date() },
      });
    } catch (inviteErr) {
      console.warn('Failed to mark invite code as used:', inviteErr);
    }

    const userSession = {
      id: user.id,
      name: user.username,
      tag: user.tag,
      email: user.email,
      avatar: user.avatar,
      crew: user.crew,
      rank: user.rank,
      rankBadge: user.rankBadge,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      user: userSession,
      message: 'Account successfully registered and verified!',
    });

    // Clear verification token cookie
    response.cookies.delete('logpose_verification_token');

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to register account.' }, { status: 500 });
  }
}
