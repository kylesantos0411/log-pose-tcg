import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode, hashPassword } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    const cleanPassword = (newPassword || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!cleanCode || cleanCode.length !== 6) {
      return NextResponse.json({ error: 'Please provide the valid 6-digit verification code.' }, { status: 400 });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    // 1. Verify code for type 'reset'
    const codeCheck = await verifyCode(cleanEmail, cleanCode, 'reset');
    if (!codeCheck.valid) {
      return NextResponse.json(
        { error: codeCheck.error || 'Invalid or expired 6-digit verification code.' },
        { status: 400 }
      );
    }

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No user account found matching this email address.' },
        { status: 404 }
      );
    }

    // 3. Update password hash
    const passwordHash = hashPassword(cleanPassword);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json({
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
        createdAt: updatedUser.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error during password reset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
