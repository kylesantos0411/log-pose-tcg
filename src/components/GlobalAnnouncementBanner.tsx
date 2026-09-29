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
    ? 'bg-[#181316] border-red-500/30 text-red-200'
    : isWarning
    ? 'bg-[#181611] border-amber-500/30 text-amber-200'
    : 'bg-[#131722] border-blue-500/30 text-blue-200';

  const badgeBg = isAlert
    ? 'bg-red-500/15 border-red-500/30 text-red-300'
    : isWarning
    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
    : 'bg-blue-500/15 border-blue-500/30 text-blue-300';

  const badgeLabel = isAlert ? 'Urgent' : isWarning ? 'Notice' : 'Broadcast';

  // Calculate speed: comfortable reading speed (~18-40 seconds depending on text length)
  const messageLength = (announcement.message || '').length;
  const duration = Math.max(20, Math.min(50, Math.round(messageLength * 0.4)));

  return (
    <div
      className={`w-full border-b backdrop-blur-md px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2.5 text-xs z-30 transition-all select-none relative overflow-hidden ${bgStyle}`}
      role="alert"
    >
      {/* Pinned Left Pill: Icon + Badge Label */}
      <div className="flex items-center gap-2 flex-shrink-0 z-10 pr-1 sm:pr-2">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider shadow-sm ${badgeBg}`}>
          {isAlert ? (
            <AlertCircle className="w-3 h-3 flex-shrink-0 animate-pulse text-red-400" />
          ) : isWarning ? (
            <AlertCircle className="w-3 h-3 flex-shrink-0 animate-pulse text-amber-400" />
          ) : (
            <Megaphone className="w-3 h-3 flex-shrink-0 animate-pulse text-blue-400" />
          )}
          <span>{badgeLabel}</span>
        </div>
      </div>

      {/* Scrolling Marquee Container (Right-to-Left, Pauses on Hover) */}
      <div
        className="flex-1 overflow-hidden relative cursor-default py-0.5 min-w-0"
        title="Hover or tap to pause"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
        }}
      >
        <div
          className="animate-marquee flex items-center gap-12 group hover:[animation-play-state:paused] active:[animation-play-state:paused]"
          style={{ animationDuration: `${duration}s` }}
        >
          {/* Loop items: repeated 4 times to ensure seamless infinite looping with 0 empty gaps on any screen width */}
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="flex shrink-0 items-center gap-8 pr-4"
              aria-hidden={idx > 0}
            >
              <span className="font-semibold tracking-wide text-xs sm:text-[13px] drop-shadow-sm">
                {announcement.message}
              </span>
              <span className="opacity-40 text-[9px]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned Right: Dismiss [X] Button */}
      <div className="flex items-center flex-shrink-0 z-10 pl-1 sm:pl-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition flex-shrink-0 cursor-pointer active:scale-95"
          title="Dismiss announcement"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
