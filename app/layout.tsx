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
  openGraph: {
    title: 'MissionBoard | Membership Command Center',
    description: 'Modern membership management for clubs, non-profits, and community groups',
    images: [
      {
        url: '/og.png',
      },
    ],
    type: 'website',
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