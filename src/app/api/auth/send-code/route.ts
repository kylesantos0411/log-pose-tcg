import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationCode } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { sanitizeEmail, sanitizeString } from '@/lib/sanitizer';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRate = checkRateLimit(`send-code-ip:${ip}`, { maxRequests: 5, windowSeconds: 300, namespace: 'send-code' });
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: `Too many verification requests. Please wait ${ipRate.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(ipRate.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { email, type = 'register' } = body;

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const emailRate = checkRateLimit(`send-code-target:${cleanEmail}`, { maxRequests: 3, windowSeconds: 300, namespace: 'send-code-target' });
    if (!emailRate.allowed) {
      return NextResponse.json(
        { error: `Verification code already requested recently. Please wait ${emailRate.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(emailRate.retryAfterSeconds) } }
      );
    }

    const cleanType = sanitizeString(type, 20);
    if (cleanType !== 'register' && cleanType !== 'login' && cleanType !== 'reset') {
      return NextResponse.json({ error: 'Invalid verification request type.' }, { status: 400 });
    }

    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } catch (e) {
      console.warn('Could not query user from database:', e);
    }

    if (cleanType === 'register' && existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in or use Forgot Password.' },
        { status: 400 }
      );
    }

    if ((cleanType === 'login' || cleanType === 'reset') && !existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please check your email or create an account.' },
        { status: 404 }
      );
    }

    const { code, token } = await createVerificationCode(cleanEmail, cleanType, existingUser?.id);

    const res = NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
      token,
    });

    // Also set HTTP-only cookie as a transparent fallback
    res.cookies.set('logpose_verification_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
  }
}
