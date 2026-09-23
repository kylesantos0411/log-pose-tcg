import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const SALT = process.env.AUTH_SECRET || 'logpose_pirate_secret_salt_2026';

/**
 * Hash password securely with salt
 */
export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + SALT)
    .digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate unique Collector Pirate Tag
 */
export async function generateUniqueTag(username: string): Promise<string> {
  const clean = username.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10) || 'PIRATE';
  let tag = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const num = Math.floor(1000 + Math.random() * 9000);
    tag = `PIRATE-${clean}-${num}`;
    const user = await prisma.user.findUnique({ where: { tag } });
    if (!user) {
      exists = false;
    }
    attempts++;
  }
  return tag;
}

/**
 * Generate a 6-digit verification code and store in DB with 10 minute expiry
 */
export async function createVerificationCode(
  email: string,
  type: 'register' | 'login' | 'reset',
  userId?: string
): Promise<{ code: string; expiresAt: Date }> {
  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused codes for this email and type
  await prisma.verificationCode.updateMany({
    where: {
      email: cleanEmail,
      type,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Store new code
  await prisma.verificationCode.create({
    data: {
      email: cleanEmail,
      code,
      type,
      expiresAt,
      userId,
    },
  });

  // Attempt to send email via nodemailer if SMTP configured
  await sendVerificationEmail(cleanEmail, code, type);

  return { code, expiresAt };
}

/**
 * Validate a verification code
 */
export async function verifyCode(
  email: string,
  code: string,
  type: 'register' | 'login' | 'reset'
): Promise<{ valid: boolean; error?: string; userId?: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const record = await prisma.verificationCode.findFirst({
    where: {
      email: cleanEmail,
      code: cleanCode,
      type,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    return { valid: false, error: 'Invalid or expired 6-digit verification code. Please request a new one.' };
  }

  // Mark as used
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { valid: true, userId: record.userId };
}

/**
 * Send verification email if SMTP is configured, otherwise log
 */
async function sendVerificationEmail(email: string, code: string, type: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  const subject = 
    type === 'register' 
      ? '⚔️ Log Pose TCG - Verify Your Account Creation'
      : type === 'reset'
      ? '🔒 Log Pose TCG - Reset Account Password'
      : '🗝️ Log Pose TCG - Login Verification Code';

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #1a1c25; color: #ffffff; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #c084fc; margin-top: 0;">Log Pose TCG</h2>
      <p style="color: #cbd5e1; font-size: 15px;">
        ${
          type === 'register'
            ? 'Welcome aboard! Use the following code to confirm your account registration:'
            : type === 'reset'
            ? 'Here is your one-time verification code to reset your account password:'
            : 'Here is your one-time verification code to sign in:'
        }
      </p>
      <div style="background-color: #242836; border: 1px solid #3b82f6; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f59e0b;">${code}</span>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid #334155; padding-top: 12px; margin-top: 20px;">Log Pose TCG • One Piece Card Companion</p>
    </div>
  `;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"Log Pose TCG" <${user}>`,
        to: email,
        subject,
        html: bodyHtml,
      });
      console.log(`[Email] Verification code email sent to ${email}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${email}:`, err);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[AUTH CODE DISPATCH] To: ${email} | Type: ${type}`);
    console.log(`[AUTH CODE]: >>> ${code} <<<`);
    console.log(`======================================================\n`);
  }
}
