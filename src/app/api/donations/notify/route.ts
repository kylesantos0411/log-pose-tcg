import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory rate limiter: max 10 requests per 10 minutes per IP
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  record.count += 1;
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-client';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many donation requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawDonorName = String(body.donorName || 'Anonymous Supporter').slice(0, 100).trim();
    const rawDonorEmail = String(body.donorEmail || '').slice(0, 100).trim();
    const rawAmount = String(body.amount || 'Treat me a coffee').slice(0, 50).trim();
    const rawReferenceNumber = String(body.referenceNumber || '').slice(0, 100).trim();
    const rawMessage = String(body.message || '').slice(0, 1000).trim();
    const rawPaymentMethod = String(body.paymentMethod || 'QR Payment (GCash / Maya / Bank)').slice(0, 100).trim();

    const recipientEmail = process.env.DONATION_NOTIFY_EMAIL || '';

    // 1. Save to SQLite database so no donation is ever lost
    let donationRecord;
    try {
      donationRecord = await prisma.donation.create({
        data: {
          donorName: rawDonorName || 'Anonymous Supporter',
          donorEmail: rawDonorEmail || null,
          amount: rawAmount || 'Treat me a coffee',
          referenceNumber: rawReferenceNumber || null,
          message: rawMessage || null,
          paymentMethod: rawPaymentMethod,
        },
      });
    } catch (dbErr) {
      console.error('[Donation DB Error]', dbErr);
    }

    // 2. Format plain text notification content
    const subject = `☕ [Log Pose TCG] New Donation from ${rawDonorName || 'a Supporter'}!`;
    const emailBody = `
========================================
🎉 NEW DONATION RECEIVED FOR LOG POSE TCG
========================================

👤 Donor Name: ${rawDonorName || 'Anonymous Supporter'}
📧 Donor Email: ${rawDonorEmail || 'Not provided'}
☕ Donation Amount / Tier: ${rawAmount}
💳 Payment Method: ${rawPaymentMethod}
🔢 Reference / Transaction ID: ${rawReferenceNumber || 'Not provided'}
💬 Personal Message:
"${rawMessage || 'None'}"

📅 Date & Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)
🆔 Record ID: ${donationRecord?.id || 'N/A'}
========================================
Thank you for maintaining Log Pose TCG! 🏴‍☠️
    `.trim();

    let emailSent = false;
    let emailProvider = 'none';

    // 3. Attempt Method A: SMTP / Gmail if configured and recipientEmail is defined
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (recipientEmail && smtpUser && smtpPass) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Log Pose TCG Donations" <${smtpUser}>`,
          to: recipientEmail,
          replyTo: rawDonorEmail || undefined,
          subject,
          text: emailBody,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; background: #1e212b; color: #f8fafc; border-radius: 20px; overflow: hidden; border: 1px solid #343a4c;">
              <div style="background: linear-gradient(135deg, #f4727d, #e44d5b); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">☕ NEW DONATION RECEIVED!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px;">Log Pose TCG Server Maintenance</p>
              </div>

              <div style="padding: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Donor Name:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-weight: 800; text-align: right;">${escapeHtml(rawDonorName || 'Anonymous Supporter')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Donor Email:</td>
                    <td style="padding: 8px 0; color: #f4727d; font-weight: 700; text-align: right;">${escapeHtml(rawDonorEmail || 'Not provided')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Amount:</td>
                    <td style="padding: 8px 0; color: #f59e0b; font-weight: 800; text-align: right;">${escapeHtml(rawAmount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Method:</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right;">${escapeHtml(rawPaymentMethod)}</td>
                  </tr>
                  ${rawReferenceNumber ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Reference #:</td>
                    <td style="padding: 8px 0; color: #38bdf8; font-family: monospace; font-weight: 700; text-align: right;">${escapeHtml(rawReferenceNumber)}</td>
                  </tr>
                  ` : ''}
                </table>

                ${rawMessage ? `
                <div style="margin-top: 18px; padding: 16px; background: #262a38; border-radius: 14px; border: 1px solid #363d52;">
                  <span style="font-size: 11px; font-weight: 800; color: #f4727d; text-transform: uppercase; letter-spacing: 0.5px;">Message from Donor:</span>
                  <p style="margin: 6px 0 0 0; color: #e2e8f0; font-size: 14px; line-height: 1.5; font-style: italic;">"${escapeHtml(rawMessage)}"</p>
                </div>
                ` : ''}

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #31364a; text-align: center; font-size: 11px; color: #64748b;">
                  Log Pose TCG &bull; Non-profit fan companion app &bull; ${new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          `,
        });
        emailSent = true;
        emailProvider = 'smtp';
      } catch (smtpErr) {
        console.warn('[Donation SMTP warning]', smtpErr);
      }
    }

    // 4. Attempt Method B: FormSubmit if recipientEmail is configured
    if (!emailSent && recipientEmail) {
      try {
        const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: 'https://log-pose-tcg.vercel.app',
            Origin: 'https://log-pose-tcg.vercel.app',
          },
          body: JSON.stringify({
            _subject: subject,
            'Donor Name': rawDonorName || 'Anonymous Supporter',
            'Donor Email': rawDonorEmail || 'Not provided',
            'Donation Amount': rawAmount,
            'Payment Method': rawPaymentMethod,
            'Reference Number': rawReferenceNumber || 'None',
            'Message': rawMessage || 'None',
            'Submission Date': new Date().toISOString(),
          }),
        });

        if (formSubmitRes.ok) {
          emailSent = true;
          emailProvider = 'formsubmit';
        }
      } catch (fsErr) {
        console.warn('[Donation FormSubmit warning]', fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      donationId: donationRecord?.id,
      emailSent,
      provider: emailProvider,
      message: 'Donation notification processed successfully.',
    });
  } catch (error: any) {
    console.error('[Donation API Error]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit donation notification.' },
      { status: 500 }
    );
  }
}

