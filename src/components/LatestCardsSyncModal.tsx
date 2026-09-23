'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface LatestCardsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LatestCardsSyncModal({ isOpen, onClose }: LatestCardsSyncModalProps) {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [syncStep, setSyncStep] = useState('Connecting to card database...');
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      setFading(false);
      setSyncStep('Connecting to card database...');
      return;
    }

    let isMounted = true;
    setFading(false);
    setSyncStep('Connecting to card database...');

    // Pre-fetch latest cards & trigger sync in background
    Promise.allSettled([
      fetch('/api/cards/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set: 'latest' }),
      }),
      fetch('/api/cards?sort=latest&limit=36', { cache: 'no-store' }),
    ]).catch(() => {});

    const t1 = setTimeout(() => {
      if (isMounted) setSyncStep('Checking latest card releases...');
    }, 450);

    const t2 = setTimeout(() => {
      if (isMounted) setSyncStep('Syncing live Yuyu-tei market prices...');
    }, 950);

    const t3 = setTimeout(() => {
      if (isMounted) setSyncStep('Opening latest cards...');
    }, 1450);

    const t4 = setTimeout(() => {
      if (!isMounted) return;
      setFading(true);
      setTimeout(() => {
        window.location.href = '/cards?sort=latest';
      }, 300);
    }, 1700);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-[#242735] flex flex-col items-center justify-center p-6 text-center font-sans select-none transition-opacity duration-400 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle cancel button in top-right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        title="Cancel"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Centered App Icon Badge with Seamless White Background */}
      <div className="relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2.5 shadow-2xl shadow-black/40 border-2 border-white/30 flex items-center justify-center relative overflow-hidden">
          <img
            src="/logo.png"
            alt="Log Pose TCG Logo"
            className="w-full h-full object-contain relative z-10 drop-shadow-sm"
          />
        </div>
      </div>

      {/* Bold App Title: LOG POSE TCG */}
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase mt-6 drop-shadow-sm">
        LOG POSE TCG
      </h1>

      {/* Circular Rotating Spinner */}
      <div className="mt-7 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
      </div>

      {/* Real-time Status Subtitle */}
      <p className="mt-6 text-xs sm:text-sm text-gray-300 font-medium text-center max-w-[280px] sm:max-w-xs leading-relaxed transition-all">
        {syncStep}
      </p>
    </div>
  );
}
