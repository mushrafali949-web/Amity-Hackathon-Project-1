import { createAdminClient } from './supabase/admin';

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<boolean>;
}

export class TwilioSmsProvider implements SmsProvider {
  private accountSid = process.env.TWILIO_ACCOUNT_SID;
  private authToken = process.env.TWILIO_AUTH_TOKEN;
  private fromNumber = process.env.TWILIO_FROM;

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.log(`[SMS mock/skip] To: ${to} | Message: ${message}`);
      return false;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', this.fromNumber);
      params.append('Body', message);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      return res.ok;
    } catch (err) {
      console.error('[Twilio SMS Error]', err);
      return false;
    }
  }
}

export const smsProvider: SmsProvider = new TwilioSmsProvider();

export async function sendEmailNotification(to: string, subject: string, htmlContent: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Email mock/skip] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ResQFood Alerts <alerts@resqfood.app>',
        to: [to],
        subject,
        html: htmlContent,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Resend Email Error]', err);
    return false;
  }
}

/**
 * Dispatches an in-app notification to a user, and optionally emails/SMS them.
 */
export async function notifyUser({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    const admin = createAdminClient();

    // 1. Insert in-app notification
    await (admin.from('notifications') as any).insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
    });

    // 2. Fetch phone/email for optional SMS/email
    const { data: profile } = await admin
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.phone && body) {
      await smsProvider.sendSms(profile.phone, `[ResQFood] ${title}: ${body}`);
    }
  } catch (err) {
    console.error('[notifyUser Error]', err);
  }
}
