import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
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
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('log_pose_app_synced')==='true'){document.documentElement.classList.add('app-synced');}}catch(e){}
if(typeof window!=='undefined'){
  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){
        for(var r of regs){r.unregister();}
      });
    }
    if(window.caches){
      caches.keys().then(function(names){
        for(var n of names){caches.delete(n);}
      });
    }
  }catch(e){}
}`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `html.app-synced #app-sync-loader{display:none!important;}`,
          }}
        />
      </head>
      <body className="bg-[#1e212b] text-[#f8fafc] antialiased min-h-screen selection:bg-[#e76d78] selection:text-white overflow-x-hidden">
        <Providers>
          <AppSyncLoadingScreen />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
