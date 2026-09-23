'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Layers, 
  FolderHeart, 
  Swords, 
  TrendingUp, 
  ChevronRight, 
  Boxes, 
  Smartphone,
  Users
} from 'lucide-react';
import { SettingsTriggerButton } from '@/components/SettingsTriggerButton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPreview = pathname === '/preview';

  // In /preview mode, render dedicated studio canvas without outer desktop sidebar
  if (isPreview) {
    return <div className="min-h-screen bg-[#13151b]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Navigation Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 bg-[#232733] border-r border-[#2d3242] flex-col justify-between hidden md:flex z-40">
        {/* Logo / Brand Header */}
        <Link
          href="/"
          className="h-16 flex items-center gap-3 px-6 border-b border-[#2d3242] hover:bg-[#2c3140]/40 transition group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center p-0.5 border border-[#343a4c] group-hover:scale-105 transition-transform flex-shrink-0">
            <img
              src="/logo.png"
              alt="Log Pose TCG"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-black text-base tracking-tight leading-none text-white flex items-center gap-1.5">
              <span className="text-[#e76d78]">Log</span>
              <span className="text-[#3b82f6]">Pose</span>
              <span className="text-[#f59e0b]">TCG</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-1">
              Card Market &amp; Slabs
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2c3140] transition"
          >
            <TrendingUp className="w-4 h-4 text-[#e76d78]" />
            Dashboard
          </Link>

          <Link
            href="/cards"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2c3140] transition"
          >
            <Layers className="w-4 h-4 text-[#3b82f6]" />
            Card Database
          </Link>

          <Link
            href="/sets"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2c3140] transition"
          >
            <Boxes className="w-4 h-4 text-emerald-400" />
            Expansion Sets
          </Link>

          <Link
            href="/collection"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2c3140] transition"
          >
            <FolderHeart className="w-4 h-4 text-[#f59e0b]" />
            My Collection
          </Link>

          <Link
            href="/decks"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2c3140] transition"
          >
            <Swords className="w-4 h-4 text-[#f4727d]" />
            Recommended Decks
          </Link>

          <Link
            href="/friends"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2c3140] transition"
          >
            <Users className="w-4 h-4 text-purple-400" />
            Friends &amp; Trades
          </Link>

          <Link
            href="/preview"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#e76d78] hover:text-white hover:bg-[#2c3140] transition"
          >
            <Smartphone className="w-4 h-4 text-[#e76d78]" />
            <span>Phone Simulator</span>
            <span className="ml-auto text-[9px] font-black px-1.5 py-0.2 rounded bg-[#e76d78]/20 text-[#e76d78] border border-[#e76d78]/30">
              NEW
            </span>
          </Link>

          {/* Settings Trigger Button in Sidebar */}
          <SettingsTriggerButton variant="sidebar" />

          <div className="pt-6 pb-2 px-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Featured Sets
            </span>
            <Link href="/sets" className="text-[10px] text-[#3b82f6] hover:underline font-bold">
              View All
            </Link>
          </div>

          <Link
            href="/cards?set=OP-05"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#2c3140] transition"
          >
            <span>OP-05 Awakening New Era</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>
          <Link
            href="/cards?set=OP-01"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#2c3140] transition"
          >
            <span>OP-01 Romance Dawn</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>
          <Link
            href="/cards?set=ST-01"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#2c3140] transition"
          >
            <span>ST-01 Straw Hat Crew</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </Link>
        </nav>

        {/* User / Storage Status */}
        <div className="p-4 border-t border-[#2d3242]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center font-bold text-xs text-[#3b82f6]">
              LP
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-200">Straw Hat Collector</span>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Local DB Active
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-x-hidden">
        {/* Main Viewport Content */}
        <main className="flex-1 p-2.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
