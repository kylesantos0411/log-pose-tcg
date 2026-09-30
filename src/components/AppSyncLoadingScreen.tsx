'use client';

import React, { useState, useEffect } from 'react';

type StepStatus = 'pending' | 'loading' | 'completed';

interface SyncItem {
  id: string;
  label: string;
  status: StepStatus;
}

export function AppSyncLoadingScreen() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    database: 'loading',
    account: 'pending',
    prices: 'pending',
  });

  useEffect(() => {
    // Check if app was already synced in this session (unless forced via query ?sync)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forceSync = urlParams.has('sync');
      if (!forceSync && sessionStorage.getItem('log_pose_app_synced') === 'true') {
        setHidden(true);
        return;
      }
    } catch {
      // ignore
    }

    let isMounted = true;

    async function runSyncSequence() {
      // 1. Step: Database
      try {
        await Promise.race([
          fetch('/api/sets', { cache: 'no-store' }),
          new Promise((r) => setTimeout(r, 450)),
        ]);
      } catch {
        // Continue gracefully
      }

      if (!isMounted) return;
      setSteps((s) => ({ ...s, database: 'completed', account: 'loading' }));

      // 2. Step: Your account
      await new Promise((r) => setTimeout(r, 380));
      try {
        // Read local session or active binder
        const session = localStorage.getItem('logpose_user_session');
        if (session) JSON.parse(session);
      } catch {
        // Continue gracefully
      }

      if (!isMounted) return;
      setSteps((s) => ({ ...s, account: 'completed', prices: 'loading' }));

      // 3. Step: Prices
      try {
        await Promise.race([
          fetch('/api/cards?page=1&limit=30', { cache: 'no-store' }),
          new Promise((r) => setTimeout(r, 480)),
        ]);
      } catch {
        // Continue gracefully
      }

      if (!isMounted) return;
      setSteps((s) => ({ ...s, prices: 'completed' }));

      // Brief delay after all checks turn green
      await new Promise((r) => setTimeout(r, 360));
      if (!isMounted) return;
      setFading(true);

      setTimeout(() => {
        if (!isMounted) return;
        setHidden(true);
        try {
          sessionStorage.setItem('log_pose_app_synced', 'true');
          document.documentElement.classList.add('app-synced');
        } catch {
          // ignore
        }
      }, 350);
    }

    runSyncSequence();

    return () => {
      isMounted = false;
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      id="app-sync-loader"
      className={`fixed inset-0 z-[99999] bg-[#14151f] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-350 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Brand Logo & Title Above */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/50 border border-white/20 flex items-center justify-center mb-3">
          <img
            src="/logo.png"
            alt="Log Pose TCG Logo"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase opacity-90">
          LOG POSE TCG
        </h1>
      </div>

      {/* SYNCHRONIZATION Card matching user screenshot exactly */}
      <div className="w-full max-w-[340px] bg-[#272836] border border-[#37394c]/80 rounded-[22px] px-6 py-5 shadow-2xl text-left transition-all">
        <h3 className="text-[11px] font-black text-white tracking-[0.14em] uppercase mb-4 opacity-95">
          SYNCHRONIZATION
        </h3>

        <div className="space-y-3.5">
          {/* Item 1: Database */}
          <div className="flex items-center gap-3">
            <StatusIcon status={steps.database} />
            <span
              className={`text-[13.5px] transition-colors ${
                steps.database === 'completed'
                  ? 'text-slate-200 font-semibold'
                  : steps.database === 'loading'
                  ? 'text-white font-bold'
                  : 'text-slate-400 font-normal'
              }`}
            >
              Database
            </span>
          </div>

          {/* Item 2: Your account */}
          <div className="flex items-center gap-3">
            <StatusIcon status={steps.account} />
            <span
              className={`text-[13.5px] transition-colors ${
                steps.account === 'completed'
                  ? 'text-slate-200 font-semibold'
                  : steps.account === 'loading'
                  ? 'text-white font-bold'
                  : 'text-slate-400 font-normal'
              }`}
            >
              Your account
            </span>
          </div>

          {/* Item 3: Prices */}
          <div className="flex items-center gap-3">
            <StatusIcon status={steps.prices} />
            <span
              className={`text-[13.5px] transition-colors ${
                steps.prices === 'completed'
                  ? 'text-slate-200 font-semibold'
                  : steps.prices === 'loading'
                  ? 'text-white font-bold'
                  : 'text-slate-400 font-normal'
              }`}
            >
              Prices
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') {
    return (
      <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center text-[#22c55e]">
        <svg className="w-full h-full" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M6.2 10.3L8.8 12.8L13.8 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
        <div className="w-[16px] h-[16px] rounded-full border-[2px] border-slate-600/40 border-t-white animate-spin" />
      </div>
    );
  }

  // Pending
  return (
    <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
      <div className="w-[16px] h-[16px] rounded-full border-[1.5px] border-slate-600/50" />
    </div>
  );
}
