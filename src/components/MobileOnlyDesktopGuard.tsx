'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Smartphone, 
  QrCode, 
  Sparkles, 
  ArrowRight,
  Camera,
  Layers,
  TrendingUp,
  Compass
} from 'lucide-react';

export function MobileOnlyDesktopGuard() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Exempt administration routes
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check session bypass
    const bypassed = sessionStorage.getItem('logpose_desktop_bypassed') === 'true';
    if (bypassed) {
      setIsBypassed(true);
    }

    setCurrentUrl(window.location.href);

    const checkDevice = () => {
      // Screen width 1024px or higher (standard laptop / desktop monitor)
      const isWide = window.innerWidth >= 1024;
      
      // Also check user agent for mobile indicators
      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

      setIsDesktop(isWide && !isMobileUA);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleBypass = () => {
    sessionStorage.setItem('logpose_desktop_bypassed', 'true');
    setIsBypassed(true);
  };

  // Do not show if not desktop, or if bypassed, or if on admin route
  if (!isDesktop || isBypassed || isAdminRoute) {
    return null;
  }

  // QR Code URL pointing to current page or home
  const qrTarget = currentUrl || 'https://log-pose-tcg.vercel.app';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrTarget)}&color=f8fafc&bgcolor=151824&margin=10`;

  return (
    <aside 
      aria-label="Mobile Experience Notice"
      className="fixed inset-0 z-[99999] bg-[#090b10] flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto"
    >
      {/* Background ambient decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-amber-500/15 via-[#e05d68]/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-t from-blue-600/10 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-lg w-full bg-[#12151e]/90 border border-amber-500/25 rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center my-auto">
        
        {/* Animated Mobile Icon & Compass Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-[#e05d68]/20 to-blue-500/10 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Smartphone className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#0e1017] p-1.5 rounded-xl border border-amber-500/40">
            <Compass className="w-5 h-5 text-amber-400 animate-[spin_10s_linear_infinite]" />
          </div>
        </div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Mobile Experience Required
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
          Designed Exclusively for Mobile
        </h1>

        <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed mb-6">
          <strong className="text-amber-400 font-semibold">Log Pose TCG</strong> is a touch-first companion app engineered for smartphones. Open this page on your mobile device to access the authentic Japanese card database, live Yuyu-tei market prices, camera lens scanner, and your collector binder.
        </p>

        {/* Live QR Code Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#181c29] border border-white/10 rounded-2xl shadow-inner mb-6 w-full max-w-[240px]">
          <div className="w-40 h-40 bg-[#151824] rounded-xl flex items-center justify-center overflow-hidden border border-white/5 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrApiUrl} 
              alt="Scan QR Code to open Log Pose TCG on Mobile" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-2.5">
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Scan with your phone camera</span>
          </div>
        </div>

        {/* Mobile Features List */}
        <div className="grid grid-cols-3 gap-2 w-full text-left mb-6 text-xs text-slate-300">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col items-center text-center">
            <Camera className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="font-semibold text-white">Card Lens</span>
            <span className="text-[10px] text-slate-400">Camera scan</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col items-center text-center">
            <Layers className="w-4 h-4 text-amber-400 mb-1" />
            <span className="font-semibold text-white">3-Col Binder</span>
            <span className="text-[10px] text-slate-400">Pure card art</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col items-center text-center">
            <TrendingUp className="w-4 h-4 text-blue-400 mb-1" />
            <span className="font-semibold text-white">Yuyu-tei</span>
            <span className="text-[10px] text-slate-400">Live JPY/PHP</span>
          </div>
        </div>

        {/* Developer / Admin Preview Bypass Button */}
        <button
          type="button"
          onClick={handleBypass}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 flex items-center gap-1.5 group cursor-pointer"
        >
          <span>Continue in desktop browser anyway (Preview Mode)</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>

      {/* Footer Branding */}
      <div className="mt-4 text-[11px] text-slate-400 flex items-center gap-2">
        <span>LOG POSE TCG</span>
        <span>•</span>
        <span>Japanese One Piece Card Game Companion</span>
      </div>
    </aside>
  );
}