import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
import { PwaRegister } from '@/components/PwaRegister';
import { AppSyncLoadingScreen } from '@/components/AppSyncLoadingScreen';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#14161f',
};

export const metadata: Metadata = {
  title: 'Log Pose TCG | One Piece TCG Collection Manager',
  description: 'Manage cards, track real-time prices, build decks, and scan cards.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Log Pose',
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
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('log_pose_app_synced')==='true'){document.documentElement.classList.add('app-synced');}}catch(e){}`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `html.app-synced #app-sync-loader{display:none!important;}`,
          }}
        />
      </head>
      <body className="bg-[#1e212b] text-[#f8fafc] antialiased min-h-screen selection:bg-[#e76d78] selection:text-white">
        <Providers>
          <AppSyncLoadingScreen />
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
