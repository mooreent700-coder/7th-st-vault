import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://7thstvault.com'),
  title: {
    default: '7th St Vault',
    template: '%s | 7th St Vault',
  },
  description:
    '7th St Vault turns your products into a clean, premium shopping experience for clothing brands, shoe sellers, jewelry brands, boutiques, and pop-ups.',
  applicationName: '7th St Vault',
  appleWebApp: {
    title: '7th St Vault',
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: '7th St Vault',
    description: 'Fashion. Culture. Success.',
    url: 'https://7thstvault.com',
    siteName: '7th St Vault',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7th St Vault',
    description: 'Fashion. Culture. Success.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
