import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
import { AppSyncLoadingScreen } from '@/components/AppSyncLoadingScreen';
import { InstallAppPrompt } from '@/components/InstallAppPrompt';
import { MobileOnlyDesktopGuard } from '@/components/MobileOnlyDesktopGuard';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0e1017',
};

export const metadata: Metadata = {
  title: 'Log Pose TCG | One Piece TCG Collection Manager',
  description: 'Manage cards, track real-time prices, build decks, and scan cards.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Log Pose TCG',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Log Pose TCG" />
        <meta name="application-name" content="Log Pose TCG" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof window!=='undefined'&&'serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}`,
          }}
        />
      </head>
      <body className="bg-[#0e1017] text-[#f8fafc] antialiased min-h-screen selection:bg-[#e05d68] selection:text-white overflow-x-hidden">
        <Providers>
          <MobileOnlyDesktopGuard />
          <AppSyncLoadingScreen />
          <InstallAppPrompt />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

