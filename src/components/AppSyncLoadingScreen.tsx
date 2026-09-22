'use client';

import React, { useState, useEffect } from 'react';

export function AppSyncLoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Check if app was already synchronized in this session
    try {
      if (sessionStorage.getItem('log_pose_app_synced') === 'true') {
        setHidden(true);
        return;
      }
    } catch {
      // ignore
    }

    setMounted(true);

    // Fade out after database sync duration
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    // Completely unmount after fade
    const removeTimer = setTimeout(() => {
      setHidden(true);
      try {
        sessionStorage.setItem('log_pose_app_synced', 'true');
        document.documentElement.classList.add('app-synced');
      } catch {
        // ignore
      }
    }, 2200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
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
      {/* Centered Circular Logo with Ambient Glow */}
      <div className="relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1b1e2a] border-2 border-white/15 p-3 shadow-2xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 rounded-full bg-[#f4727d]/20 blur-xl pointer-events-none animate-pulse" />
          <img
            src="/logo.png"
            alt="Log Pose TCG Logo"
            className="w-full h-full object-contain relative z-10 drop-shadow-md"
          />
        </div>
      </div>

      {/* Bold App Title matching reference: LOG POSE TCG */}
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase mt-6 drop-shadow-sm">
        LOG POSE TCG
      </h1>

      {/* Circular Rotating Spinner matching reference */}
      <div className="mt-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
      </div>

      {/* Status Subtitle matching reference */}
      <p className="mt-7 text-xs sm:text-sm text-gray-300/90 font-medium text-center max-w-[280px] sm:max-w-xs leading-relaxed">
        Database synchronization in progress, please wait a few seconds...
      </p>
    </div>
  );
}
