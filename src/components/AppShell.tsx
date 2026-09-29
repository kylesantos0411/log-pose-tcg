'use client';

import React, { useState, useEffect } from 'react';
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
  Users,
  Star,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { SettingsTriggerButton } from '@/components/SettingsTriggerButton';
import { useSettings } from '@/context/SettingsContext';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { AccountBannedScreen } from '@/components/AccountBannedScreen';
import { GlobalAnnouncementBanner } from '@/components/GlobalAnnouncementBanner';
import { FeatureLockedScreen } from '@/components/FeatureLockedScreen';
import { 
  fetchSystemSettings, 
  DEFAULT_SYSTEM_SETTINGS, 
  type SystemSettingsState,
  type AppFeatureKey,
  checkIsAdmin,
  touchUserActivity
} from '@/lib/supabase-sync';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, openSettings } = useSettings();
  const isPreview = pathname === '/preview';

  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(DEFAULT_SYSTEM_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const isAdmin = checkIsAdmin(user);

  const loadSettings = async () => {
    try {
      const s = await fetchSystemSettings();
      setSystemSettings(s);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
    const handleUpdate = () => loadSettings();
    window.addEventListener('logpose_settings_updated', handleUpdate);
    return () => window.removeEventListener('logpose_settings_updated', handleUpdate);
  }, []);

  // Periodic/Route-based activity heart-beat (throttled to at most once per 5 minutes per user)
  useEffect(() => {
    if (user?.id) {
      try {
        const key = `logpose_last_touch_${user.id}`;
        const lastTouch = sessionStorage.getItem(key);
        const now = Date.now();
        if (!lastTouch || now - parseInt(lastTouch, 10) > 5 * 60 * 1000) {
          sessionStorage.setItem(key, now.toString());
          touchUserActivity(user.id, false);
        }
      } catch {
        // Ignore sessionStorage restrictions
      }
    }
  }, [user?.id, pathname]);

  // 1. Account Suspended Screen
  if (user?.isBanned) {
    return <AccountBannedScreen banReason={user.banReason} onLogout={logout} />;
  }

  // 2. Maintenance Mode Screen (Non-admins only)
  if (!loadingSettings && systemSettings.maintenance.enabled && !isAdmin && pathname !== '/admin') {
    return (
      <MaintenanceScreen
        maintenance={systemSettings.maintenance}
        onRefresh={loadSettings}
      />
    );
  }

  // In /preview mode, render dedicated studio canvas without outer desktop sidebar
  if (isPreview) {
    return <div className="min-h-screen bg-[#13151b]">{children}</div>;
  }

  const ROUTE_FEATURE_MAP: Record<string, AppFeatureKey> = {
    '/decks': 'decks',
    '/collection': 'collection',
    '/sets': 'sets',
    '/cards': 'cards',
    '/favorites': 'favorites',
    '/friends': 'friends',
  };

  const matchingRoutePrefix = Object.keys(ROUTE_FEATURE_MAP).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const currentFeatureKey = matchingRoutePrefix ? ROUTE_FEATURE_MAP[matchingRoutePrefix] : undefined;
  const currentFeatureLock = currentFeatureKey ? systemSettings.features?.[currentFeatureKey] : undefined;
  const isCurrentFeatureLocked = Boolean(currentFeatureLock?.locked);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItemClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
      isActive(path)
        ? 'bg-[#3b82f6]/15 text-white font-bold border border-[#3b82f6]/30 shadow-sm'
        : 'text-gray-300 hover:text-white hover:bg-[#2c3140] font-medium'
    }`;

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
          <Link href="/" className={navItemClass('/')}>
            <TrendingUp className={`w-4 h-4 ${isActive('/') ? 'text-[#e76d78]' : 'text-[#e76d78]/80'}`} />
            <span>Dashboard</span>
          </Link>

          <Link href="/cards" className={navItemClass('/cards')}>
            <Layers className={`w-4 h-4 ${isActive('/cards') ? 'text-[#3b82f6]' : 'text-[#3b82f6]/80'}`} />
            <span>Card Database</span>
            {systemSettings.features?.cards?.locked && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PAUSED
              </span>
            )}
          </Link>

          <Link href="/sets" className={navItemClass('/sets')}>
            <Boxes className={`w-4 h-4 ${isActive('/sets') ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
            <span>Expansion Sets</span>
            {systemSettings.features?.sets?.locked && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PAUSED
              </span>
            )}
          </Link>

          <Link href="/collection" className={navItemClass('/collection')}>
            <FolderHeart className={`w-4 h-4 ${isActive('/collection') ? 'text-[#f59e0b]' : 'text-[#f59e0b]/80'}`} />
            <span>My Collection</span>
            {systemSettings.features?.collection?.locked && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PAUSED
              </span>
            )}
          </Link>

          <Link href="/favorites" className={navItemClass('/favorites')}>
            <Star className={`w-4 h-4 ${isActive('/favorites') ? 'text-[#c084fc]' : 'text-[#c084fc]/80'}`} />
            <span>Favorites</span>
            {systemSettings.features?.favorites?.locked && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PAUSED
              </span>
            )}
          </Link>

          <Link href="/decks" className={navItemClass('/decks')}>
            <Swords className={`w-4 h-4 ${isActive('/decks') ? 'text-[#f4727d]' : 'text-[#f4727d]/80'}`} />
            <span>Recommended Decks</span>
            {systemSettings.features?.decks?.locked && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PAUSED
              </span>
            )}
          </Link>

          <Link href="/friends" className={navItemClass('/friends')}>
            <Users className={`w-4 h-4 ${isActive('/friends') ? 'text-purple-400' : 'text-purple-400/80'}`} />
            <span>Friends &amp; Trades</span>
            {systemSettings.features?.friends?.locked && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PAUSED
              </span>
            )}
          </Link>

          <Link href="/preview" className={navItemClass('/preview')}>
            <Smartphone className="w-4 h-4 text-[#e76d78]" />
            <span>Phone Simulator</span>
            <span className="ml-auto text-[9px] font-black px-1.5 py-0.2 rounded bg-[#e76d78]/20 text-[#e76d78] border border-[#e76d78]/30">
              SIM
            </span>
          </Link>

          {/* Admin Command Center Link (Admins Only) */}
          {isAdmin && (
            <Link href="/admin" className={navItemClass('/admin')}>
              <ShieldAlert className={`w-4 h-4 ${isActive('/admin') ? 'text-red-400' : 'text-red-400/80'}`} />
              <span>Admin Controls</span>
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                ADMIN
              </span>
            </Link>
          )}

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
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#c084fc] p-0.5 flex items-center justify-center font-bold text-xs text-white shadow">
              <div className="w-full h-full bg-[#1e212b] rounded-full flex items-center justify-center">
                {user ? user.name.slice(0, 2).toUpperCase() : 'LP'}
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-200 truncate">
                {user ? user.name : 'Guest Collector'}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{user ? `${user.crew} (Cloud)` : 'Local DB Active'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-x-hidden">
        {/* Admin Maintenance Active Bypass Notice */}
        {systemSettings.maintenance.enabled && isAdmin && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-md z-30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              <span>⚠️ MAINTENANCE MODE IS ACTIVE — Non-admin visitors see the dry dock screen. (Admin Bypass Enabled)</span>
            </div>
            <Link href="/admin" className="underline font-black hover:text-black">
              Manage Controls &rarr;
            </Link>
          </div>
        )}

        {/* Admin Individual Feature Locked Notice (Admin Bypass Mode) */}
        {!systemSettings.maintenance.enabled && isCurrentFeatureLocked && isAdmin && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm z-30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                ⚠️ FEATURE PAUSED: This section is currently locked for visitors ({currentFeatureLock?.message || 'Scheduled Maintenance'}). Admin Bypass is active.
              </span>
            </div>
            <Link href="/admin" className="underline font-black text-amber-200 hover:text-white">
              Admin Switchboard &rarr;
            </Link>
          </div>
        )}

        {/* Global Announcement Banner */}
        <GlobalAnnouncementBanner announcement={systemSettings.announcement} />

        {/* Main Viewport Content */}
        <main className="flex-1 p-2.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-8 min-w-0">
          {!isAdmin && isCurrentFeatureLocked ? (
            <FeatureLockedScreen
              featureKey={currentFeatureKey!}
              lockStatus={currentFeatureLock}
              isAdmin={isAdmin}
              onRefresh={loadSettings}
            />
          ) : (
            children
          )}
        </main>

        {/* Mobile Floating Admin Shortcut (Mobile phones only, when logged in as Admin) */}
        {isAdmin && pathname !== '/admin' && (
          <div className="fixed bottom-5 right-5 z-40 md:hidden animate-in fade-in zoom-in duration-200">
            <Link
              href="/admin"
              className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs shadow-2xl border border-red-400/50 hover:brightness-110 active:scale-95 transition"
            >
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Admin</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
