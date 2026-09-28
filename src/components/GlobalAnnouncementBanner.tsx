'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, Info, X } from 'lucide-react';
import { AnnouncementSetting } from '@/lib/supabase-sync';

interface GlobalAnnouncementBannerProps {
  announcement: AnnouncementSetting;
}

export function GlobalAnnouncementBanner({ announcement }: GlobalAnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('logpose_dismissed_announcement');
      if (saved && saved === announcement.message) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      // Ignore
    }
  }, [announcement.message]);

  if (!announcement.enabled || !announcement.message || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('logpose_dismissed_announcement', announcement.message || '');
    } catch {
      // Ignore
    }
  };

  const isAlert = announcement.type === 'alert';
  const isWarning = announcement.type === 'warning';

  const bgStyle = isAlert
    ? 'bg-gradient-to-r from-red-950/90 via-rose-900/90 to-red-950/90 border-red-500/40 text-red-100'
    : isWarning
    ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-amber-950/90 border-amber-500/40 text-amber-100'
    : 'bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-blue-950/90 border-blue-500/40 text-blue-100';

  const iconColor = isAlert ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className={`w-full border-b backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-30 transition-all ${bgStyle}`}>
      <div className="flex items-center gap-2.5 min-w-0 mx-auto">
        <Megaphone className={`w-4 h-4 flex-shrink-0 animate-pulse ${iconColor}`} />
        <span className="font-semibold tracking-wide truncate sm:whitespace-normal">
          {announcement.message}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition flex-shrink-0"
        title="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
