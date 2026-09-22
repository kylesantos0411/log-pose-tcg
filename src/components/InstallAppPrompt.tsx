'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, Check, ArrowUpRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);

      // Check if iOS
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      setIsIOS(isIosDevice);

      // Check dismissed timestamp from localStorage (suppress auto-popup for 24 hours if dismissed)
      const lastDismissed = localStorage.getItem('logpose_install_dismissed');
      const isDismissedRecently = lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 24 * 60 * 60 * 1000;

      // 2. Capture Chrome's beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const installEvent = e as BeforeInstallPromptEvent;
        setDeferredPrompt(installEvent);

        // Store globally on window so other triggers (like Settings) can access it
        (window as unknown as { __logposeInstallPrompt?: BeforeInstallPromptEvent }).__logposeInstallPrompt = installEvent;

        // Auto-show popup if not standalone and not dismissed recently
        if (!isStandaloneMode && !isDismissedRecently) {
          setShowPopup(true);
        }
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setShowPopup(false);
        setDeferredPrompt(null);
        localStorage.removeItem('logpose_install_dismissed');
      };

      const handleManualOpen = () => {
        setShowPopup(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('open_install_prompt', handleManualOpen);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('open_install_prompt', handleManualOpen);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert("To install on iOS: Tap the Share button (square with arrow) at the bottom of Safari, then choose 'Add to Home Screen'.");
      } else {
        alert("To install: Open Chrome's menu (three dots at the top right) and select 'Install Log Pose TCG' or 'Add to Home screen'.");
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setShowPopup(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    localStorage.setItem('logpose_install_dismissed', Date.now().toString());
  };

  // If already running standalone or installed, don't show the prompt
  if (isStandalone || isInstalled || !showPopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to dismiss */}
      <div className="fixed inset-0" onClick={handleDismiss} />

      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-[#242836] border border-[#3b4156] rounded-3xl p-5 sm:p-6 shadow-2xl z-10 font-sans space-y-4 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          aria-label="Close install prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Icon & Header Title */}
        <div className="flex items-center gap-3.5 pr-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#e76d78] to-[#f59e0b] p-0.5 shadow-lg flex-shrink-0">
            <img 
              src="/icons/icon-192.png" 
              alt="Log Pose TCG Logo" 
              className="w-full h-full rounded-[14px] object-cover bg-[#1e212b]"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Official Web App</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              Install Log Pose TCG
            </h3>
            <p className="text-xs text-gray-300">
              One Piece TCG Companion
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="bg-[#1b1e2a] rounded-2xl p-3.5 border border-[#313648] space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-gray-200">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Fast launch right from your Home Screen</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-200">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Clean, full-screen app view (no URL bar)</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-200">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Download className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Instant access to decks, collections, &amp; price scanner</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#e76d78] to-[#f59e0b] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#e76d78]/25 active:scale-[0.98] transition cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Install App on Device</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 text-center text-xs font-bold text-gray-400 hover:text-gray-200 transition cursor-pointer"
          >
            Not Now (Continue in Browser)
          </button>
        </div>
      </div>
    </div>
  );
}
