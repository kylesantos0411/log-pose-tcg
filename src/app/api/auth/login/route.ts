import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, verifyCode } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { sanitizeString } from '@/lib/sanitizer';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${ip}`, { maxRequests: 10, windowSeconds: 60, namespace: 'login' });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { identifier, password, code, token } = body;

    const cleanId = sanitizeString(identifier, 100);
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

    // 2. Authentication via 6-digit verification code
    if (code) {
      if (!user) {
        return NextResponse.json({
          error: 'Invalid or expired 6-digit verification code.',
        }, { status: 400 });
      }

      const cleanCode = sanitizeString(code, 10);
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

      const sessionPayload = encodeURIComponent(
        JSON.stringify({
          id: user.id,
          tag: user.tag,
          email: user.email,
        })
      );
      res.cookies.set('logpose_session', sessionPayload, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600,
        path: '/',
      });
      res.cookies.delete('logpose_verification_token');
      return res;
    }

    // 3. Authentication via password
    if (password) {
      if (!user) {
        // Return generic message to prevent account enumeration
        return NextResponse.json({
          error: 'Invalid identifier or password. Please verify your credentials.',
        }, { status: 401 });
      }

      const cleanPass = String(password).trim().slice(0, 200);
      const isValid = verifyPassword(cleanPass, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({
          error: 'Invalid identifier or password. Please verify your credentials.',
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

      const res = NextResponse.json({
        success: true,
        user: userSession,
        message: `Welcome back, ${user.username}!`,
      });

      const sessionPayload = encodeURIComponent(
        JSON.stringify({
          id: user.id,
          tag: user.tag,
          email: user.email,
        })
      );
      res.cookies.set('logpose_session', sessionPayload, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600,
        path: '/',
      });

      return res;
    }

    return NextResponse.json({
      error: 'Please provide either your password or a 6-digit verification code to sign in.',
    }, { status: 400 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
