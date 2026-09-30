'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Smartphone, QrCode } from 'lucide-react';

export function MobileOnlyDesktopGuard() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sessionStorage.getItem('logpose_desktop_bypassed') === 'true') {
      setIsBypassed(true);
    }

    setCurrentUrl(window.location.href);

    const checkDevice = () => {
      const isWide = window.innerWidth >= 1024;
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

  if (!isDesktop || isBypassed || isAdminRoute) {
    return null;
  }

  const qrTarget = currentUrl || 'https://log-pose-tcg.vercel.app';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTarget)}&color=0f172a&bgcolor=ffffff&margin=6`;

  return (
    <aside 
      aria-label="Mobile Notice"
      className="fixed inset-0 z-[99999] bg-[#0b0d13] flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="max-w-sm w-full bg-[#12151e] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
        
        {/* Simple Minimal Icon */}
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 mb-5">
          <Smartphone className="w-6 h-6 stroke-[1.75]" />
        </div>

        {/* Short, direct headline */}
        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          Open on Mobile
        </h1>

        <p className="text-sm text-zinc-400 mb-6 max-w-[280px]">
          Log Pose TCG is designed for mobile screens. Scan the code to continue on your phone.
        </p>

        {/* Clean White QR Card */}
        <div className="bg-white p-3 rounded-xl shadow-md mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={qrApiUrl} 
            alt="Scan QR code" 
            className="w-36 h-36 object-contain block"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
          <QrCode className="w-3.5 h-3.5" />
          <span>Point your phone camera here</span>
        </div>

        {/* Subtle, muted bypass option */}
        <button
          type="button"
          onClick={handleBypass}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer py-1"
        >
          Continue on desktop browser
        </button>

      </div>
    </aside>
  );
}