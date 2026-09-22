import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      donorName = 'Anonymous Supporter',
      donorEmail = '',
      amount = 'Treat me a coffee',
      referenceNumber = '',
      message = '',
      paymentMethod = 'QR Payment (GCash / Maya / Bank)',
    } = body;

    const recipientEmail = process.env.DONATION_NOTIFY_EMAIL || 'kylesantos0411@gmail.com';

    // 1. Save to SQLite database so no donation is ever lost
    let donationRecord;
    try {
      donationRecord = await prisma.donation.create({
        data: {
          donorName: String(donorName).trim() || 'Anonymous Supporter',
          donorEmail: donorEmail ? String(donorEmail).trim() : null,
          amount: amount ? String(amount).trim() : 'Treat me a coffee',
          referenceNumber: referenceNumber ? String(referenceNumber).trim() : null,
          message: message ? String(message).trim() : null,
          paymentMethod: String(paymentMethod).trim(),
        },
      });
    } catch (dbErr) {
      console.error('[Donation DB Error]', dbErr);
    }

    // 2. Format notification content
    const subject = `☕ [Log Pose TCG] New Donation from ${donorName || 'a Supporter'}!`;
    const emailBody = `
========================================
🎉 NEW DONATION RECEIVED FOR LOG POSE TCG
========================================

👤 Donor Name: ${donorName || 'Anonymous Supporter'}
📧 Donor Email: ${donorEmail || 'Not provided'}
☕ Donation Amount / Tier: ${amount}
💳 Payment Method: ${paymentMethod}
🔢 Reference / Transaction ID: ${referenceNumber || 'Not provided'}
💬 Personal Message:
"${message || 'None'}"

📅 Date & Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)
🆔 Record ID: ${donationRecord?.id || 'N/A'}
========================================
Thank you for maintaining Log Pose TCG! 🏴‍☠️
    `.trim();

    let emailSent = false;
    let emailProvider = 'none';

    // 3. Attempt Method A: SMTP / Gmail if env variables are configured
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (smtpUser && smtpPass) {
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
          replyTo: donorEmail || undefined,
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
                    <td style="padding: 8px 0; color: #ffffff; font-weight: 800; text-align: right;">${donorName || 'Anonymous Supporter'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Donor Email:</td>
                    <td style="padding: 8px 0; color: #f4727d; font-weight: 700; text-align: right;">${donorEmail || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Amount:</td>
                    <td style="padding: 8px 0; color: #f59e0b; font-weight: 800; text-align: right;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Method:</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right;">${paymentMethod}</td>
                  </tr>
                  ${referenceNumber ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 600;">Reference #:</td>
                    <td style="padding: 8px 0; color: #38bdf8; font-family: monospace; font-weight: 700; text-align: right;">${referenceNumber}</td>
                  </tr>
                  ` : ''}
                </table>

                ${message ? `
                <div style="margin-top: 18px; padding: 16px; background: #262a38; border-radius: 14px; border: 1px solid #363d52;">
                  <span style="font-size: 11px; font-weight: 800; color: #f4727d; text-transform: uppercase; letter-spacing: 0.5px;">Message from Donor:</span>
                  <p style="margin: 6px 0 0 0; color: #e2e8f0; font-size: 14px; line-height: 1.5; font-style: italic;">"${message}"</p>
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

    // 4. Attempt Method B: Direct Web Dispatch (FormSubmit) as instant fallback
    if (!emailSent) {
      try {
        const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: 'https://log-pose-tcg.vercel.app',
            Origin: 'https://log-pose-tcg.vercel.app',
          },
          body: JSON.stringify({
            _subject: subject,
            'Donor Name': donorName || 'Anonymous Supporter',
            'Donor Email': donorEmail || 'Not provided',
            'Donation Amount': amount,
            'Payment Method': paymentMethod,
            'Reference Number': referenceNumber || 'None',
            'Message to Kyle': message || 'None',
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
