'use client';

import React, { useState } from 'react';
import { Anchor, RefreshCw, ShieldAlert, Wrench, Clock, Lock } from 'lucide-react';
import { MaintenanceSetting } from '@/lib/supabase-sync';

interface MaintenanceScreenProps {
  maintenance: MaintenanceSetting;
  onRefresh: () => Promise<void>;
  onAdminLogin?: () => void;
}

export function MaintenanceScreen({ maintenance, onRefresh, onAdminLogin }: MaintenanceScreenProps) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#14161f] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-[#1e2230]/90 border border-[#343a4c] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Icon Badge */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping opacity-35" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-amber-500/25 to-rose-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <Anchor className="w-10 h-10 animate-bounce" style={{ animationDuration: '2.5s' }} />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Dry Dock Maintenance</span>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Log Pose TCG is Docked for Repairs
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            {maintenance.message ||
              'We are currently undergoing scheduled server maintenance, upgrades, and system calibration. We will be back online shortly!'}
          </p>
        </div>

        {/* Estimated Time Notice if set */}
        {maintenance.estimatedTime && (
          <div className="p-3.5 rounded-2xl bg-[#14161f]/80 border border-[#2d3242] flex items-center justify-center gap-2 text-xs font-bold text-gray-300">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Estimated Uptime / Return: <strong className="text-amber-300">{maintenance.estimatedTime}</strong></span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check Server Status'}</span>
          </button>

          {onAdminLogin && (
            <button
              type="button"
              onClick={onAdminLogin}
              className="py-3 px-4 rounded-xl bg-[#282d3d] hover:bg-[#343a4e] border border-[#3b4256] text-gray-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Admin Access</span>
            </button>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-gray-500">
          Your card collection, sales data, and account information remain safe and intact.
        </p>
      </div>
    </div>
  );
}
