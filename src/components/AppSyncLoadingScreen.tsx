'use client';

import React, { useState, useEffect } from 'react';

type StepStatus = 'pending' | 'loading' | 'completed';

export function AppSyncLoadingScreen() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    database: 'loading',
    account: 'pending',
    prices: 'pending',
  });

  useEffect(() => {
    let isMounted = true;

    async function runSyncSequence() {
      // Step 1: Database (Pre-warm DB & sets catalog with authentic pacing)
      const t1 = Date.now();
      try {
        await fetch('/api/sets', { cache: 'no-store' });
      } catch {
        // Fallback gracefully
      }
      const elapsed1 = Date.now() - t1;
      const minDuration1 = 1200; // 1.2s deliberate pacing
      if (elapsed1 < minDuration1) {
        await new Promise((r) => setTimeout(r, minDuration1 - elapsed1));
      }

      if (!isMounted) return;
      setSteps((s) => ({ ...s, database: 'completed', account: 'loading' }));

      // Step 2: Your account (Verify local binder, wishlist, collection and settings)
      const t2 = Date.now();
      try {
        const session = localStorage.getItem('logpose_user_session');
        const binder = localStorage.getItem('optcg_binder');
        if (session) JSON.parse(session);
        if (binder) JSON.parse(binder);
      } catch {
        // Fallback gracefully
      }
      const elapsed2 = Date.now() - t2;
      const minDuration2 = 1000; // 1.0s deliberate pacing
      if (elapsed2 < minDuration2) {
        await new Promise((r) => setTimeout(r, minDuration2 - elapsed2));
      }

      if (!isMounted) return;
      setSteps((s) => ({ ...s, account: 'completed', prices: 'loading' }));

      // Step 3: Prices (Pre-warm live card market prices & currency exchange rates)
      const t3 = Date.now();
      try {
        await Promise.allSettled([
          fetch('/api/cards?page=1&limit=30', { cache: 'no-store' }),
          fetch('/api/currency', { cache: 'no-store' }),
        ]);
      } catch {
        // Fallback gracefully
      }
      const elapsed3 = Date.now() - t3;
      const minDuration3 = 1300; // 1.3s deliberate pacing
      if (elapsed3 < minDuration3) {
        await new Promise((r) => setTimeout(r, minDuration3 - elapsed3));
      }

      if (!isMounted) return;
      setSteps((s) => ({ ...s, prices: 'completed' }));

      // Success hold: give the user 650ms to register all 3 green checkmarks
      await new Promise((r) => setTimeout(r, 650));
      if (!isMounted) return;
      setFading(true);

      setTimeout(() => {
        if (!isMounted) return;
        setHidden(true);
      }, 450);
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
      className={`fixed inset-0 z-[99999] bg-[#12131c] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-450 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Brand Logo & Name */}
      <div className="flex flex-col items-center mb-7 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/60 border border-white/20 flex items-center justify-center mb-3">
          <img
            src="/logo.png"
            alt="Log Pose TCG Logo"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="text-[13px] font-black text-white tracking-[0.22em] uppercase opacity-90">
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
              className={`text-[13.5px] transition-colors duration-200 ${
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
              className={`text-[13.5px] transition-colors duration-200 ${
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
              className={`text-[13.5px] transition-colors duration-200 ${
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
      <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center text-[#22c55e] transition-transform duration-200 scale-100">
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
        <div className="w-[16px] h-[16px] rounded-full border-[2px] border-slate-600/30 border-t-white animate-spin" />
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
