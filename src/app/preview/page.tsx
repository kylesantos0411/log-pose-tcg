'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  RotateCw,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Wifi,
  Battery,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  radius: string;
  hasIsland: boolean;
}

const DEVICES: DevicePreset[] = [
  { id: 'iphone-16-pro',      name: 'iPhone 16 Pro',       width: 393, height: 852, radius: '48px', hasIsland: true  },
  { id: 'iphone-16-pro-max',  name: 'iPhone 16 Pro Max',   width: 430, height: 932, radius: '54px', hasIsland: true  },
  { id: 'pixel-9',            name: 'Google Pixel 9',      width: 412, height: 915, radius: '44px', hasIsland: false },
  { id: 'iphone-se',          name: 'iPhone SE',           width: 375, height: 667, radius: '30px', hasIsland: false },
];

const PRESET_PAGES = [
  { label: 'P-041 (4 Vars)', icon: '👑', url: '/cards/P-041' },
  { label: 'Search P-041', icon: '🔍', url: '/cards?q=P-041' },
  { label: 'Chopper MR',   icon: '🦌', url: '/cards/EB01-006_p2' },
  { label: 'Luffy MR',     icon: '🏴‍☠️', url: '/cards/OP05-119_p1' },
  { label: 'Rayleigh SP',  icon: '🃏', url: '/cards/OP14-108_p3' },
  { label: 'Cards',        icon: '🗂️', url: '/cards' },
  { label: 'Sets',         icon: '📦', url: '/sets' },
  { label: 'Collection',   icon: '💼', url: '/collection' },
  { label: 'Scanner',      icon: '📷', url: '/scanner' },
  { label: 'Settings',     icon: '⚙️', url: '/settings' },
  { label: 'Home',         icon: '🏠', url: '/' },
];

export default function PhonePreviewPage() {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICES[0]);
  const [currentUrl, setCurrentUrl] = useState('/');
  const [inputUrl, setInputUrl] = useState('/');
  const [isLandscape, setIsLandscape] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [currentTime, setCurrentTime] = useState('9:41');
  const [showControls, setShowControls] = useState(true);
  const [frameColor, setFrameColor] = useState<'dark' | 'silver' | 'gold'>('dark');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };
    updateTime();
    const t = setInterval(updateTime, 10000);
    return () => clearInterval(t);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentUrl(path);
    setInputUrl(path);
  };

  const handleReload = () => setIframeKey((k) => k + 1);

  const phoneW = isLandscape ? selectedDevice.height : selectedDevice.width;
  const phoneH = isLandscape ? selectedDevice.width : selectedDevice.height;

  // Chassis ring colors
  const ringColor =
    frameColor === 'dark'   ? 'ring-[#1e1e1e]'   :
    frameColor === 'silver' ? 'ring-[#888]'        :
                              'ring-[#b8962e]';
  const frameBg =
    frameColor === 'dark'   ? '#111113' :
    frameColor === 'silver' ? '#4a4a52' :
                              '#7a5c1a';

  return (
    <div
      className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center font-sans overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1d27 0%, #0a0c12 100%)' }}
    >
      {/* Subtle back link — top left */}
      <Link
        href="/cards"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition backdrop-blur"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to App
      </Link>

      {/* Toggle controls */}
      <button
        onClick={() => setShowControls((v) => !v)}
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition backdrop-blur"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#e76d78]" />
        Controls
        {showControls ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* === PHONE — always centered, fills available space === */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-6 px-4">
        {/* Scale wrapper — fit phone to viewport height */}
        <div
          style={{
            transformOrigin: 'center center',
            transform: `scale(${Math.min(
              1,
              (typeof window !== 'undefined' ? (window.innerHeight - 200) / (phoneH + 28) : 0.75)
            )})`,
          }}
        >
          {/* Outer chassis ring */}
          <div
            className={`relative rounded-[${selectedDevice.radius}] ring-[12px] ${ringColor} shadow-[0_30px_80px_rgba(0,0,0,0.9)] select-none`}
            style={{
              width:  phoneW + 24,
              height: phoneH + 24,
              background: frameBg,
              borderRadius: selectedDevice.radius,
              boxShadow: '0 0 0 12px ' + frameBg + ', 0 30px 80px rgba(0,0,0,0.9)',
            }}
          >
            {/* Side buttons */}
            <div className="absolute -left-[14px] top-24 w-[3px] h-7 rounded-l bg-[#333] opacity-80" />
            <div className="absolute -left-[14px] top-36 w-[3px] h-10 rounded-l bg-[#333] opacity-80" />
            <div className="absolute -left-[14px] top-52 w-[3px] h-10 rounded-l bg-[#333] opacity-80" />
            <div className="absolute -right-[14px] top-32 w-[3px] h-14 rounded-r bg-[#333] opacity-80" />

            {/* Inner screen */}
            <div
              className="absolute inset-[0px] overflow-hidden flex flex-col bg-[#181a22]"
              style={{
                borderRadius: `calc(${selectedDevice.radius} - 2px)`,
                width:  phoneW,
                height: phoneH,
                left: 12,
                top: 12,
              }}
            >
              {/* Status bar */}
              <div
                className="relative z-30 flex-shrink-0 flex items-center justify-between px-7 pointer-events-none select-none bg-transparent"
                style={{ height: selectedDevice.hasIsland ? 52 : 36, paddingTop: selectedDevice.hasIsland ? 14 : 8 }}
              >
                <span className="text-[12px] font-semibold text-white tracking-tight">{currentTime}</span>

                {/* Dynamic Island */}
                {selectedDevice.hasIsland && !isLandscape && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full flex items-center justify-between px-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#162035] m-auto mt-0.5" />
                    </div>
                    <div className="text-[10px] text-[#e76d78] font-mono flex items-center gap-1 opacity-80">
                      <Sparkles className="w-2.5 h-2.5 text-[#f59e0b]" />
                      <span>Log Pose</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-white">
                  <div className="flex items-end gap-[1.5px] h-3">
                    <div className="w-[2.5px] h-1 bg-white rounded-sm" />
                    <div className="w-[2.5px] h-1.5 bg-white rounded-sm" />
                    <div className="w-[2.5px] h-2 bg-white rounded-sm" />
                    <div className="w-[2.5px] h-2.5 bg-white rounded-sm" />
                  </div>
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-4 h-4 fill-white" />
                </div>
              </div>

              {/* App iframe */}
              <div className="flex-1 w-full relative">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={currentUrl}
                  title="Log Pose TCG"
                  className="w-full h-full border-0 outline-none"
                  style={{ background: '#181a22' }}
                />
              </div>

              {/* Home indicator */}
              <div className="flex-shrink-0 h-6 flex items-center justify-center bg-transparent pointer-events-none">
                <div className="w-32 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>

          {/* Device label */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-mono text-gray-500">
            <span className="text-gray-300 font-bold">{selectedDevice.name}</span>
            <span>·</span>
            <span>{phoneW} × {phoneH}</span>
            <span>·</span>
            <span className="text-emerald-500">Live &amp; Interactive</span>
          </div>
        </div>
      </div>

      {/* === CONTROLS — collapsible bottom panel === */}
      <div
        className={`w-full max-w-2xl mx-auto px-4 pb-4 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden'}`}
      >
        <div className="bg-[#1a1d27]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 shadow-2xl">

          {/* URL bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#3b82f6] transition">
              <span className="text-gray-500 font-mono text-[10px] select-none mr-1 flex-shrink-0">localhost:3000</span>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    let t = inputUrl.trim();
                    if (!t.startsWith('/')) t = '/' + t;
                    handleNavigate(t);
                  }
                }}
                placeholder="/cards"
                className="w-full bg-transparent outline-none font-mono text-white text-xs"
              />
            </div>
            <button onClick={handleReload} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer" title="Reload">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer" title="Open in new tab">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Quick jump pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PRESET_PAGES.map((p) => {
              const active = currentUrl === p.url;
              return (
                <button
                  key={p.url}
                  onClick={() => handleNavigate(p.url)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[#e76d78] text-white shadow-lg shadow-[#e76d78]/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Device, orientation & finish row */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedDevice.id}
              onChange={(e) => {
                const d = DEVICES.find((x) => x.id === e.target.value);
                if (d) setSelectedDevice(d);
              }}
              className="bg-[#0d0f14] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer hover:border-gray-500 flex-1 min-w-0"
            >
              {DEVICES.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.width}×{d.height})</option>
              ))}
            </select>

            <button
              onClick={() => setIsLandscape((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isLandscape ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {isLandscape ? 'Landscape' : 'Portrait'}
            </button>

            {/* Frame color dots */}
            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10">
              <button onClick={() => setFrameColor('dark')}   className={`w-5 h-5 rounded-full bg-[#111] border-2 transition ${frameColor === 'dark'   ? 'border-white scale-110' : 'border-transparent opacity-60'}`} title="Space Black" />
              <button onClick={() => setFrameColor('silver')} className={`w-5 h-5 rounded-full bg-[#888] border-2 transition ${frameColor === 'silver' ? 'border-white scale-110' : 'border-transparent opacity-60'}`} title="Titanium" />
              <button onClick={() => setFrameColor('gold')}   className={`w-5 h-5 rounded-full bg-[#b8962e] border-2 transition ${frameColor === 'gold'   ? 'border-white scale-110' : 'border-transparent opacity-60'}`} title="Desert Gold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
