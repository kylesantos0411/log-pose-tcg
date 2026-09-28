'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { MaintenanceSetting } from '@/lib/supabase-sync';

interface MaintenanceScreenProps {
  maintenance: MaintenanceSetting;
  onRefresh?: () => Promise<void> | void;
}

export function MaintenanceScreen({ maintenance, onRefresh }: MaintenanceScreenProps) {
  // Silently check every 30 seconds so users automatically reconnect when maintenance completes
  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-[#181b24] border border-[#2a2f3d] rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 p-1 flex items-center justify-center">
            <img src="/logo.png" alt="Log Pose TCG" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm tracking-wide text-gray-200 uppercase">Log Pose TCG</span>
        </div>

        {/* Professional Alert Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title and Message */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            System Maintenance in Progress
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            {maintenance.message ||
              'We are currently performing scheduled maintenance and updates to improve system performance. Access will be restored shortly.'}
          </p>
        </div>

        {/* Estimated Time Badge (if provided) */}
        {maintenance.estimatedTime && (
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#11131a] border border-[#242836] text-xs text-gray-300 font-medium">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Expected Return: <strong className="text-white font-semibold">{maintenance.estimatedTime}</strong>
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[#262b38] w-full" />

        {/* Simple & Professional Status Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
          <span>Services will automatically reconnect once maintenance is complete.</span>
        </div>
      </div>
    </div>
  );
}
