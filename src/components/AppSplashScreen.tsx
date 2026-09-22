'use client';

import React, { useState, useEffect } from 'react';

export function AppSplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show once per session to maintain quick subsequent in-app transitions
    const alreadyShown = sessionStorage.getItem('log_pose_splash_shown');
    if (alreadyShown) {
      setVisible(false);
      return;
    }

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1100);

    const removeTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('log_pose_splash_shown', 'true');
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#242735] flex flex-col items-center justify-center p-6 text-center font-sans select-none transition-opacity duration-400 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Centered Circular Logo */}
      <div className="relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1b1e2a] border-2 border-white/15 p-3 shadow-2xl flex items-center justify-center relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-[#f4727d]/15 blur-xl pointer-events-none animate-pulse" />
          <img
            src="/logo.png"
            alt="Log Pose TCG Logo"
            className="w-full h-full object-contain relative z-10 drop-shadow-md"
          />
        </div>
      </div>

      {/* Bold App Title: LOG POSE TCG */}
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
