'use server';

import { sendVerificationEmail } from '@/lib/email/resend';
import { z } from 'zod';

const SendSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['restaurant', 'ngo']).default('restaurant'),
});

export async function requestVerificationEmailAction(formData: FormData) {
  const email = formData.get('email') as string;
  const name = (formData.get('name') as string) || 'Partner';
  const role = ((formData.get('role') as string) || 'restaurant') as 'restaurant' | 'ngo';

  const validated = SendSchema.safeParse({ email, name, role });
  if (!validated.success) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/auth/callback?email=${encodeURIComponent(email)}`;

  const res = await sendVerificationEmail({
    email,
    name,
    role,
    code,
    verificationLink,
  });

  if (!res.success) {
    return { success: false, error: res.error || 'Failed to send verification email.' };
  }

  return {
    success: true,
    simulated: res.simulated,
    message: res.simulated
      ? `Resend in demo mode. Verification code is ${code} (logged to server console). Set RESEND_API_KEY to send real emails.`
      : `Verification email sent successfully via Resend API to ${email}!`,
  };
}
