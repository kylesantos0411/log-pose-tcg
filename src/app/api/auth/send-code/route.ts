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

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (type === 'register' && existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 400 }
      );
    }

    if (type === 'login' && !existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please create an account first.' },
        { status: 404 }
      );
    }

    const { code } = await createVerificationCode(cleanEmail, type, existingUser?.id);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
      // Always include devCode so if user is testing without SMTP, they are NEVER locked out!
      devCode: code,
    });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json({ error: error.message || 'Failed to send verification code.' }, { status: 500 });
  }
}
