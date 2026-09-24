import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ResQFood — Real-time Surplus Food Rescue Platform',
  description:
    'Instantly connect restaurants and catering surplus with nearby verified NGOs and shelters before food spoils. Real-time matching, OTP driver dispatch, and zero food waste.',
  keywords: ['surplus food', 'food rescue', 'NGO donation', 'zero hunger', 'food waste reduction'],
  authors: [{ name: 'ResQFood Team' }],
  openGraph: {
    title: 'ResQFood — Real-time Surplus Food Rescue Platform',
    description:
      'Instantly connect restaurants with nearby verified NGOs. Rescue fresh surplus food in under 60 seconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
