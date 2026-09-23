'use client';

import React, { useState, useEffect } from 'react';

export function AppSyncLoadingScreen() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [syncStep, setSyncStep] = useState('Initializing card catalog...');

  useEffect(() => {
    // Check if app was already loaded/synced in this session
    try {
      if (sessionStorage.getItem('log_pose_app_synced') === 'true') {
        setHidden(true);
        return;
      }
    } catch {
      // ignore
    }

    let isMounted = true;
    const startTime = Date.now();

    async function initializeApp() {
      try {
        setSyncStep('Connecting to local card database...');
        
        // Actually pre-warm the database and network queries in parallel
        await Promise.allSettled([
          fetch('/api/sets', { cache: 'no-store' }),
          fetch('/api/cards?page=1&limit=30', { cache: 'no-store' }),
        ]);

        if (isMounted) {
          setSyncStep('Loading market prices & currency rates...');
        }
      } catch {
        // Safe to ignore offline or serverless
      }

      // Ensure smooth, polished transition timing (between 1.2s and 1.8s)
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 1400;
      const remaining = Math.max(minDisplayTime - elapsed, 200);

      setTimeout(() => {
        if (!isMounted) return;
        setSyncStep('Ready!');
        setFading(true);

        setTimeout(() => {
          if (!isMounted) return;
          setHidden(true);
          try {
            sessionStorage.setItem('log_pose_app_synced', 'true');
            document.documentElement.classList.add('app-synced');
          } catch {
            // ignore
          }
        }, 400);
      }, remaining);
    }

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (hidden) return null;

  return (
    <div 
      id="app-sync-loader"
      className={`fixed inset-0 z-[99999] bg-[#242735] flex flex-col items-center justify-center p-6 text-center font-sans select-none transition-opacity duration-400 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
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
