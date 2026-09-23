'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  RotateCw, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Database, 
  Layers, 
  TrendingUp,
  ChevronRight,
  Flame
} from 'lucide-react';
import { getSafeCardImageUrl } from '@/lib/card-image';

interface LatestCardsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYNC_STAGES = [
  {
    step: 1,
    title: 'Connecting to Official Registry',
    desc: 'Pinging Bandai Carddass Japanese master server...',
    icon: Database,
  },
  {
    step: 2,
    title: 'Checking Latest Booster Releases',
    desc: 'Scanning OP-10 (Royal Bloodlines), OP-09, and ST-15–20 decks...',
    icon: Flame,
  },
  {
    step: 3,
    title: 'Downloading Card Graphics & Manga Arts',
    desc: 'Verifying high-res artwork, frame proxies & manga parallel arts...',
    icon: Layers,
  },
  {
    step: 4,
    title: 'Syncing Live Yuyu-tei Market Pricing',
    desc: 'Fetching authentic Japanese store valuations (JPY ¥)...',
    icon: TrendingUp,
  },
  {
    step: 5,
    title: 'Catalog Synchronized',
    desc: '4,511+ Japanese cards with live valuations ready!',
    icon: CheckCircle2,
  },
];

const PREVIEW_NEW_CARDS = [
  { id: 'OP09-119_p1', name: 'Shanks (Manga Rare)', pack: 'OP-09', priceYen: 198000, img: 'https://onepiece-cardgame.com/images/cardlist/card/OP09-119_p1.png' },
  { id: 'OP09-001_p1', name: 'Monkey.D.Luffy (Leader Alt)', pack: 'OP-09', priceYen: 32000, img: 'https://onepiece-cardgame.com/images/cardlist/card/OP09-001_p1.png' },
  { id: 'OP08-118_p1', name: 'Silvers Rayleigh (Manga)', pack: 'OP-08', priceYen: 148000, img: 'https://onepiece-cardgame.com/images/cardlist/card/OP08-118_p1.png' },
  { id: 'OP07-119_p1', name: 'Boa Hancock (Manga Rare)', pack: 'OP-07', priceYen: 178000, img: 'https://onepiece-cardgame.com/images/cardlist/card/OP07-119_p1.png' },
];

export function LatestCardsSyncModal({ isOpen, onClose }: LatestCardsSyncModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(10);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setProgress(10);
      setIsDone(false);
      return;
    }

    // Realistic multi-step progress progression
    const t1 = setTimeout(() => { setCurrentStep(2); setProgress(35); }, 700);
    const t2 = setTimeout(() => { setCurrentStep(3); setProgress(65); }, 1600);
    const t3 = setTimeout(() => { setCurrentStep(4); setProgress(88); }, 2500);
    const t4 = setTimeout(() => {
      setCurrentStep(5);
      setProgress(100);
      setIsDone(true);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleViewLatest = () => {
    onClose();
    router.push('/cards?sort=latest');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div 
        className="relative bg-[#202330] border border-[#3b4056] rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl z-10 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#3ed57a]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#343a4c] pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3ed57a] to-[#3b82f6] p-0.5 shadow-md">
              <div className="w-full h-full bg-[#1b1e2a] rounded-[14px] flex items-center justify-center text-[#3ed57a]">
                <Flame className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white leading-tight">
                  Latest Released Cards
                </h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#3ed57a]/20 text-[#3ed57a] border border-[#3ed57a]/40">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                Official Bandai JP release pipeline &amp; live prices
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-1.5 flex-shrink-0">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-300 flex items-center gap-1.5">
              {!isDone ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 text-[#3ed57a] animate-spin" />
                  <span>Synchronizing Latest Cards...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3ed57a]" />
                  <span>Synchronization Complete</span>
                </>
              )}
            </span>
            <span className="font-mono text-[#3ed57a]">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-[#161822] rounded-full overflow-hidden p-0.5 border border-[#2e3346]">
            <div 
              className="h-full bg-gradient-to-r from-[#3ed57a] via-[#3b82f6] to-[#f59e0b] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Sync Step Timeline */}
        <div className="space-y-2 py-1 flex-shrink-0">
          {SYNC_STAGES.map((s) => {
            const isPassed = currentStep > s.step || isDone;
            const isCurrent = currentStep === s.step && !isDone;
            const Icon = s.icon;

            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                  isCurrent
                    ? 'bg-[#1e2334] border-[#3ed57a]/50 shadow-sm'
                    : isPassed
                    ? 'bg-[#191c28] border-white/5 opacity-80'
                    : 'bg-[#141620] border-transparent opacity-40'
                }`}
              >
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCurrent
                      ? 'bg-[#3ed57a]/20 text-[#3ed57a] animate-pulse'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="truncate">{s.title}</span>
                    {isPassed && <span className="text-[10px] text-emerald-400 font-semibold">Done</span>}
                    {isCurrent && <span className="text-[10px] text-[#3ed57a] font-semibold animate-pulse">Running...</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview of Latest Cards */}
        {isDone && (
          <div className="space-y-2 pt-1 flex-shrink-0 animate-fadeIn">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Freshly Synchronized Highlights:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PREVIEW_NEW_CARDS.map((card) => (
                <div 
                  key={card.id}
                  className="rounded-xl overflow-hidden bg-[#161822] border border-white/10 p-1 flex flex-col items-center gap-1 group hover:border-[#3ed57a]/60 transition"
                >
                  <div className="w-full aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/50">
                    <img 
                      src={getSafeCardImageUrl(card.img)} 
                      alt={card.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy" 
                    />
                  </div>
                  <div className="text-[9px] font-bold text-white truncate w-full text-center">
                    {card.pack}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-[#343a4c] text-gray-300 font-bold text-xs transition cursor-pointer text-center"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleViewLatest}
            className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#3ed57a] to-[#22c55e] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-[#3ed57a]/20 flex items-center justify-center gap-1.5"
          >
            <span>View Latest Released Cards</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
