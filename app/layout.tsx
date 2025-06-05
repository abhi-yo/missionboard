import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth-provider';
import { fonts, satoshi } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'MissionBoard | Membership Command Center',
  description: 'Modern membership management for clubs, non-profits, and community groups',
  icons: {
    icon: '/appicon.png',
    apple: '/appicon.png',
  },
  metadataBase: new URL('https://missionboard-one.vercel.app'),
  openGraph: {
    title: "MissionBoard | Membership Command Center",
    description: "Modern membership management for clubs, non-profits, and community groups",
    url: "https://missionboard-one.vercel.app/",
    siteName: "MissionBoard",
    images: [
      {
        url: "https://missionboard-one.vercel.app/og.png",
        width: 1200,
        height: 630,
        alt: "MissionBoard"
      },
    ],
    locale: "en_US",
    type: "website",
  },
  other: {
    'og:logo': 'https://missionboard-one.vercel.app/appicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={satoshi.variable}>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        satoshi.variable
      )}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}