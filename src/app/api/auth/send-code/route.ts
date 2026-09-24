import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationCode } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type = 'register' } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (type !== 'register' && type !== 'login' && type !== 'reset') {
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

    if (type === 'register' && existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in or use Forgot Password.' },
        { status: 400 }
      );
    }

    if ((type === 'login' || type === 'reset') && !existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please check your email or create an account.' },
        { status: 404 }
      );
    }

    const { code, token } = await createVerificationCode(cleanEmail, type, existingUser?.id);

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
    return NextResponse.json({ error: error.message || 'Failed to send verification code.' }, { status: 500 });
  }
}
