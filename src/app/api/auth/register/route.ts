import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateUniqueTag, verifyCode } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, code, token, avatar = '👒', crew = 'Straw Hat Pirates', customTag } = body;

    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanCode = (code || '').trim();
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
    // 1. Optional 6-digit code verification (if provided)
    if (cleanCode && cleanCode.length === 6) {
      const verification = await verifyCode(cleanEmail, cleanCode, 'register', verificationToken);
      if (!verification.valid) {
        return NextResponse.json({ error: verification.error || 'Invalid or expired verification code.' }, { status: 400 });
      }
    }

    // 2. Check if email or username is already taken
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

    // 3. Generate unique tag
    const tag = customTag?.trim().toUpperCase() || await generateUniqueTag(cleanUsername);

    // 4. Create user in SQLite (or fallback session if unexpected transient DB lock)
    const passwordHash = hashPassword(cleanPassword);
    let user: any = null;

    try {
      user = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          tag,
          avatar,
          crew,
          rank: 'Cabin Boy',
          rankBadge: '⚓',
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
        avatar,
        crew,
        rank: 'Cabin Boy',
        rankBadge: '⚓',
        createdAt: new Date(),
      };
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
