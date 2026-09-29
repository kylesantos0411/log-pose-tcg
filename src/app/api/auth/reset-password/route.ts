import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode, hashPassword } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { sanitizeEmail, sanitizeString } from '@/lib/sanitizer';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`reset-password:${ip}`, { maxRequests: 5, windowSeconds: 60, namespace: 'reset-password' });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many password reset attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { email, code, newPassword, token } = body;

    const cleanEmail = sanitizeEmail(email);
    const cleanCode = sanitizeString(code, 10);
    const cleanPassword = String(newPassword || '').trim();
    const verificationToken = token || req.cookies.get('logpose_verification_token')?.value;

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!cleanCode || cleanCode.length !== 6) {
      return NextResponse.json({ error: 'Please provide the valid 6-digit verification code.' }, { status: 400 });
    }

    if (!cleanPassword || cleanPassword.length < 6 || cleanPassword.length > 100) {
      return NextResponse.json({ error: 'New password must be between 6 and 100 characters long.' }, { status: 400 });
    }

    // 1. Verify code for type 'reset'
    const codeCheck = await verifyCode(cleanEmail, cleanCode, 'reset', verificationToken);
    if (!codeCheck.valid) {
      return NextResponse.json(
        { error: codeCheck.error || 'Invalid or expired 6-digit verification code.' },
        { status: 400 }
      );
    }

    // 2. Find user in database
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } catch (e) {
      console.warn('Prisma find user error in reset-password:', e);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user account found matching this email address.' },
        { status: 404 }
      );
    }

    // 3. Update password hash
    const passwordHash = hashPassword(cleanPassword);
    let updatedUser: any = user;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
        },
      });
    } catch (updateErr) {
      console.warn('Prisma update user password error:', updateErr);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Password successfully updated! You are now signed in.',
      user: {
        id: updatedUser.id,
        name: updatedUser.username,
        tag: updatedUser.tag,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        crew: updatedUser.crew,
        rank: updatedUser.rank,
        rankBadge: updatedUser.rankBadge,
        createdAt: updatedUser.createdAt instanceof Date ? updatedUser.createdAt.toISOString() : updatedUser.createdAt,
      },
    });

    const sessionPayload = encodeURIComponent(
      JSON.stringify({
        id: updatedUser.id,
        tag: updatedUser.tag,
        email: updatedUser.email,
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
  } catch (error: any) {
    console.error('Error during password reset:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
