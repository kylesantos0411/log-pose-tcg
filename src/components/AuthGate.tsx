'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { AccountModal } from '@/components/AccountModal';
import { ShieldAlert, Compass } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mounting on the client, render an initial dark placeholder
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#14161f] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#e76d78] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Loading Log Pose...</span>
        </div>
      </div>
    );
  }

  // If the user is not authenticated, block access completely
  if (!user) {
    return (
      <div className="min-h-screen bg-[#14161f] relative overflow-hidden flex flex-col items-center justify-center p-4">
        {/* Background decorative atmosphere */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#e76d78]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#3b82f6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-6 text-center z-0 opacity-40">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-1 border border-[#343a4c] mb-3">
            <img src="/logo.png" alt="Log Pose TCG" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span className="text-[#e76d78]">Log</span>
            <span className="text-[#3b82f6]">Pose</span>
            <span className="text-[#f59e0b]">TCG</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">One Piece TCG Market & Collection Tracker</p>
        </div>

        {/* Mandatory Account Modal - Cannot be dismissed */}
        <AccountModal
          isOpen={true}
          onClose={() => {}}
          defaultTab="register"
          isMandatory={true}
        />
      </div>
    );
  }

  // Authenticated: Render full application
  return <>{children}</>;
}
