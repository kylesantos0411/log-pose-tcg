'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { type FeatureLockStatus, FEATURE_DEFINITIONS, type AppFeatureKey } from '@/lib/supabase-sync';

interface FeatureLockedScreenProps {
  featureKey: AppFeatureKey;
  lockStatus?: FeatureLockStatus;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export function FeatureLockedScreen({
  featureKey,
  lockStatus,
  isAdmin,
  onRefresh,
}: FeatureLockedScreenProps) {
  const definition = FEATURE_DEFINITIONS.find((f) => f.key === featureKey);
  const featureLabel = definition?.label || featureKey;
  const message = lockStatus?.message || definition?.defaultMessage || 'This section is temporarily paused for updates.';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-gradient-to-b from-[#1e2230] via-[#1a1d27] to-[#141620] border border-amber-500/30 p-7 sm:p-9 shadow-2xl text-center relative overflow-hidden space-y-6">
        {/* Ambient glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Lock className="w-10 h-10 text-amber-400 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-amber-500/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
            <span>Maintenance Paused</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {featureLabel}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Admin Bypass Pill (If Admin is testing) */}
        {isAdmin && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-red-300 font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Admin Mode Active</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Regular visitors see this locked screen. Admins can bypass locks from the Admin switchboard.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-10">
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2c3244] to-[#242938] hover:from-[#343b52] hover:to-[#2c3244] text-white font-bold text-xs flex items-center justify-center gap-2 border border-[#3b435a] transition active:scale-95 shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Status</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
          Log Pose TCG Fleet Command
        </div>
      </div>
    </div>
  );
}
