import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, verifyCode } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, code, token } = body;

    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      return NextResponse.json({ error: 'Please enter your email, Collector Tag, or username.' }, { status: 400 });
    }

    const verificationToken = token || req.cookies.get('logpose_verification_token')?.value;
    const cleanIdLower = cleanId.toLowerCase();

    // 1. Find user in database by email, username, or tag
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanIdLower },
            { username: cleanId },
            { tag: cleanId.toUpperCase() },
            { tag: cleanId },
          ],
        },
      });
    } catch (findErr) {
      console.warn('Prisma find user error:', findErr);
    }

    if (!user) {
      return NextResponse.json({
        error: 'No account found matching this identifier. Please verify your details or create a new account.',
      }, { status: 404 });
    }

    // 2. Authentication via 6-digit verification code
    if (code) {
      const cleanCode = code.trim();
      const verification = await verifyCode(user.email, cleanCode, 'login', verificationToken);
      if (!verification.valid) {
        return NextResponse.json({
          error: verification.error || 'Invalid or expired 6-digit verification code.',
        }, { status: 400 });
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

      const res = NextResponse.json({
        success: true,
        user: userSession,
        message: `Welcome back, ${user.username}!`,
      });
      res.cookies.delete('logpose_verification_token');
      return res;
    }

    // 3. Authentication via password
    if (password) {
      const cleanPass = password.trim();
      const isValid = verifyPassword(cleanPass, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({
          error: 'Incorrect password. Please check your credentials or reset your password.',
        }, { status: 401 });
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

      return NextResponse.json({
        success: true,
        user: userSession,
        message: `Welcome back, ${user.username}!`,
      });
    }

    return NextResponse.json({
      error: 'Please provide either your password or a 6-digit verification code to sign in.',
    }, { status: 400 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed.' }, { status: 500 });
  }
}
