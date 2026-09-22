'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Compass, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone PWA mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // 2. Register Service Worker for Android WebAPK installability
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Log Pose ServiceWorker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('Log Pose ServiceWorker registration failed:', err);
          });
      });
    }

    // 3. Capture beforeinstallprompt event for Android Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredPrompt = promptEvent;
      setInstallPrompt(promptEvent);
      
      // Check if user dismissed recently
      const dismissedUntil = localStorage.getItem('logpose_pwa_dismissed_until');
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        setShowBanner(true);
      }
      
      window.dispatchEvent(new CustomEvent('pwa-can-install'));
    };

    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      setInstallPrompt(null);
      setShowBanner(false);
      setIsStandalone(true);
      console.log('Log Pose App was successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = installPrompt || window.deferredPrompt;
    if (!promptEvent) {
      alert('To install on your device: open Chrome options (⋮) and tap "Install app".');
      return;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
        setInstallPrompt(null);
        window.deferredPrompt = null;
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Suppress for 2 days
    localStorage.setItem('logpose_pwa_dismissed_until', (Date.now() + 2 * 24 * 60 * 60 * 1000).toString());
  };

  if (isStandalone || !showBanner || !installPrompt) return null;

  return (
    <aside
      aria-label="Install App"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 z-50 max-w-sm mx-auto bg-[#1e2230]/95 backdrop-blur-md border border-[#3b4259] rounded-2xl p-3.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300 select-none"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e76d78] to-[#f59e0b] p-0.5 flex-shrink-0 shadow-md">
          <div className="w-full h-full bg-[#181b26] rounded-[10px] flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#e76d78]" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black text-white tracking-wide">Install Log Pose TCG</h4>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Native App
            </span>
          </div>
          <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
            Fast full-screen camera card scanning and offline collection access.
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#e76d78] to-[#f59e0b] text-white text-xs font-bold shadow hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-lg transition -mr-1 -mt-1"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
