'use client';

import React from 'react';
import { ShieldAlert, LogOut, AlertTriangle } from 'lucide-react';

interface AccountBannedScreenProps {
  banReason?: string;
  onLogout: () => void;
}

export function AccountBannedScreen({ banReason, onLogout }: AccountBannedScreenProps) {
  return (
    <div className="min-h-screen bg-[#14161f] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-[#1e2230]/95 border border-red-500/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Red Shield Alert */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-black uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>Account Suspended</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-white">
            Access to Log Pose TCG Restricted
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Your account has been suspended by an administrator for violating community guidelines, fair trading policies, or suspected fraudulent activity.
          </p>
        </div>

        {/* Reason box */}
        <div className="p-3.5 rounded-2xl bg-[#14161f] border border-red-500/25 text-left space-y-1">
          <span className="text-[10px] font-bold uppercase text-red-400 block tracking-wider">
            Suspension Reason
          </span>
          <p className="text-xs text-gray-200 font-medium italic">
            "{banReason || 'Violation of fair trading and community policies.'}"
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl bg-[#282d3d] hover:bg-[#343a4e] border border-[#3b4256] text-gray-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-500">
          If you believe this suspension was made in error, contact community support.
        </p>
      </div>
    </div>
  );
}
