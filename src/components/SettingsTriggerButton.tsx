'use client';

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useSettings, CURRENCIES } from '@/context/SettingsContext';

interface SettingsTriggerProps {
  variant?: 'header' | 'sidebar' | 'pill' | 'mobile';
  className?: string;
}

export function SettingsTriggerButton({ variant = 'header', className = '' }: SettingsTriggerProps) {
  const { openSettings, currency } = useSettings();
  const activeCurrency = CURRENCIES[currency];

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={openSettings}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2e3344] transition cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
          <span>Settings</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1e212c] text-amber-400 border border-[#343a4c]">
          {currency === 'source' ? 'Native' : currency}
        </span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={openSettings}
        title="Change Currency & Settings"
        className={`px-2.5 py-1 rounded-xl bg-[#242836] hover:bg-[#2e3344] border border-[#343a4c] text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm ${className}`}
      >
        <span className="text-xs">{activeCurrency?.flag || '🌐'}</span>
        <span className="text-[11px] font-bold text-amber-400">
          {currency === 'source' ? 'Source Currency' : currency}
        </span>
        <SettingsIcon className="w-3 h-3 text-gray-400 ml-0.5" />
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={openSettings}
        className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-[#e76d78] cursor-pointer transition"
      >
        <SettingsIcon className="w-5 h-5" />
        <span>Settings</span>
      </button>
    );
  }

  // Default: Header button
  return (
    <button
      type="button"
      onClick={openSettings}
      title="Application Settings (Currency, Preferences)"
      className={`p-2 rounded-xl bg-[#242836] hover:bg-[#2e3344] border border-[#343a4c] hover:border-amber-400/50 text-gray-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm ${className}`}
    >
      <SettingsIcon className="w-4 h-4 text-gray-400 hover:text-white" />
      <span className="text-xs font-bold text-amber-400 hidden sm:inline">
        {currency === 'source' ? 'Currency: Native' : currency}
      </span>
    </button>
  );
}
