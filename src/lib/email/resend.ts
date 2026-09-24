import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendVerificationEmailParams {
  email: string;
  name?: string;
  role?: 'restaurant' | 'ngo';
  code: string;
  verificationLink?: string;
}

/**
 * Sends an email verification email with a 6-digit OTP code and confirmation button.
 */
export async function sendVerificationEmail({
  email,
  name = 'Partner',
  role = 'restaurant',
  code,
  verificationLink,
}: SendVerificationEmailParams): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const resend = getResendClient();
  const themeColor = role === 'ngo' ? '#0d9488' : '#ea580c';
  const roleTitle = role === 'ngo' ? 'NGO / Shelter Partner' : 'Food Donor Partner';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your ResQFood Account</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF5EB; margin: 0; padding: 30px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EADFC7;">
          <div style="background-color: ${themeColor}; padding: 28px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ResQFood</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 600;">Real-Time Surplus Food Rescue</p>
          </div>
          <div style="padding: 36px 30px; text-align: center;">
            <h2 style="color: #2B1B54; margin: 0 0 12px 0; font-size: 22px; font-weight: 800;">Verify Your Email Address</h2>
            <p style="color: #5A467A; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Hello <strong>${name}</strong>, welcome to ResQFood as a <strong>${roleTitle}</strong>. Use the verification code below to verify your email and activate your live surplus rescue console.
            </p>
            
            <div style="display: inline-block; background-color: #FAF5EB; border: 2px dashed ${themeColor}; border-radius: 14px; padding: 16px 32px; margin: 10px 0 24px 0;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: ${themeColor}; font-family: monospace;">${code}</span>
            </div>

            <p style="color: #88749E; font-size: 12px; margin: 0 0 24px 0;">
              This code will expire in 15 minutes. If you did not create a ResQFood account, please ignore this email.
            </p>

            ${
              verificationLink
                ? `<div style="margin-top: 10px;">
                    <a href="${verificationLink}" style="display: inline-block; background-color: ${themeColor}; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 800; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                      Verify Account Directly &rarr;
                    </a>
                  </div>`
                : ''
            }
          </div>
          <div style="background-color: #F8F5EE; padding: 18px; text-align: center; border-top: 1px solid #EFE8DA;">
            <p style="color: #9C8EB2; font-size: 11px; margin: 0;">
              &copy; ${new Date().getFullYear()} ResQFood India. FSSAI Compliant Surplus Food Operations.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(`\n=============================================================`);
    console.log(`[RESEND SIMULATION] Email verification code for ${email}:`);
    console.log(`  To:      ${email}`);
    console.log(`  Code:    ${code}`);
    console.log(`  Role:    ${role}`);
    console.log(`  Notice:  RESEND_API_KEY is not set in .env.local.`);
    console.log(`           To send real emails, set RESEND_API_KEY in .env.local.`);
    console.log(`=============================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const fromAddress = process.env.RESEND_FROM || 'ResQFood <onboarding@resend.dev>';
    const result = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `Your ResQFood Verification Code: ${code}`,
      html,
    });

    if (result.error) {
      console.error('[Resend Error]', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err?.message || 'Failed to dispatch email' };
  }
}

/**
 * Sends email alert when a donation is matched.
 */
export async function sendMatchNotificationEmail({
  email,
  restaurantName,
  ngoName,
  foodTitle,
  pickupOtp,
  pickupAddress,
}: {
  email: string;
  restaurantName: string;
  ngoName: string;
  foodTitle: string;
  pickupOtp: string;
  pickupAddress: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.log(`[Resend Email Mock] Match alert for ${email} (OTP: ${pickupOtp})`);
    return false;
  }

  const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #FAF5EB;">
      <div style="max-width: 500px; margin: auto; background: white; border-radius: 16px; padding: 24px; border: 1px solid #EADFC7;">
        <h2 style="color: #2B1B54; margin-top: 0;">🎉 Your Donation Has Been Claimed!</h2>
        <p style="color: #555;">Hello <strong>${restaurantName}</strong>,</p>
        <p><strong>${ngoName}</strong> has just accepted your surplus food donation: <strong>${foodTitle}</strong>.</p>
        <div style="background: #FFF7ED; border: 2px solid #EA580C; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; color: #EA580C; font-weight: bold; text-transform: uppercase;">Physical Handover OTP</div>
          <div style="font-size: 32px; font-weight: 900; color: #EA580C; letter-spacing: 4px;">${pickupOtp}</div>
          <div style="font-size: 11px; color: #777; margin-top: 4px;">Provide this 4-digit code to the collection driver on arrival</div>
        </div>
        <p style="font-size: 13px; color: #666;">Pickup Location: ${pickupAddress}</p>
      </div>
    </div>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM || 'ResQFood <onboarding@resend.dev>';
    await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `Food Rescued! ${ngoName} claimed "${foodTitle}" (OTP: ${pickupOtp})`,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Resend Match Alert Error]', err);
    return false;
  }
}
