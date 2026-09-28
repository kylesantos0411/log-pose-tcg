'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Users, 
  AlertTriangle, 
  Power, 
  Megaphone, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Lock, 
  Unlock, 
  RotateCcw, 
  ArrowLeft,
  Clock,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import {
  fetchSystemSettings,
  updateSystemSetting,
  fetchAllUsersForAdmin,
  adminSetUserBan,
  fetchReportedSalesForAdmin,
  adminDeleteSale,
  adminDismissFlags,
  type SystemSettingsState,
  type AdminUserRecord,
  type CloudSaleRecord,
  DEFAULT_SYSTEM_SETTINGS,
} from '@/lib/supabase-sync';

export default function AdminPage() {
  const { user } = useSettings();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'sales' | 'overview'>('system');

  // System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(DEFAULT_SYSTEM_SETTINGS);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [maintenanceTime, setMaintenanceTime] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'alert'>('info');

  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Users Management state
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'banned' | 'admins'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Ban Modal state
  const [banningUser, setBanningUser] = useState<AdminUserRecord | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('Market manipulation and fraudulent pricing');
  const [submittingBan, setSubmittingBan] = useState(false);

  // Sales Moderation state
  const [reportedSales, setReportedSales] = useState<CloudSaleRecord[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Load initial settings
  useEffect(() => {
    fetchSystemSettings().then((s) => {
      setSystemSettings(s);
      setMaintenanceEnabled(s.maintenance.enabled);
      setMaintenanceMsg(s.maintenance.message || '');
      setMaintenanceTime(s.maintenance.estimatedTime || '');
      setAnnouncementEnabled(s.announcement.enabled);
      setAnnouncementMsg(s.announcement.message || '');
      setAnnouncementType(s.announcement.type || 'info');
    });
  }, []);

  // Load users and reported sales when switching tabs
  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users' || activeTab === 'overview') {
        loadUsers();
      }
      if (activeTab === 'sales' || activeTab === 'overview') {
        loadReportedSales();
      }
    }
  }, [activeTab, user?.role]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const list = await fetchAllUsersForAdmin();
      setUsersList(list);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadReportedSales() {
    setLoadingSales(true);
    try {
      const sales = await fetchReportedSalesForAdmin();
      setReportedSales(sales);
    } finally {
      setLoadingSales(false);
    }
  }

  // Save Maintenance Settings
  async function handleSaveMaintenance() {
    setSavingSettings(true);
    try {
      const res = await updateSystemSetting(
        'maintenance',
        {
          enabled: maintenanceEnabled,
          message: maintenanceMsg.trim() || undefined,
          estimated_time: maintenanceTime.trim() || null,
        },
        user?.tag
      );

      if (res.success) {
        showToast(`Maintenance mode is now ${maintenanceEnabled ? '🔴 ACTIVE' : '🟢 DEACTIVATED'}`);
        // Dispatch event for local AppShell updates
        window.dispatchEvent(new Event('logpose_settings_updated'));
      } else {
        alert(`Error saving maintenance settings: ${res.error}`);
      }
    } finally {
      setSavingSettings(false);
    }
  }

  // Save Announcement Settings
  async function handleSaveAnnouncement() {
    setSavingSettings(true);
    try {
      const res = await updateSystemSetting(
        'announcement',
        {
          enabled: announcementEnabled,
          message: announcementMsg.trim(),
          type: announcementType,
        },
        user?.tag
      );

      if (res.success) {
        showToast(`Global announcement ${announcementEnabled ? 'published' : 'hidden'}`);
        window.dispatchEvent(new Event('logpose_settings_updated'));
      } else {
        alert(`Error saving announcement: ${res.error}`);
      }
    } finally {
      setSavingSettings(false);
    }
  }

  // Confirm Ban User
  async function handleConfirmBan() {
    if (!banningUser) return;
    setSubmittingBan(true);
    try {
      const res = await adminSetUserBan(banningUser.id, true, banReasonInput.trim());
      if (res.success) {
        showToast(`User @${banningUser.tag.replace(/^@/, '')} has been suspended.`);
        setBanningUser(null);
        loadUsers();
      } else {
        alert(`Failed to ban user: ${res.error}`);
      }
    } finally {
      setSubmittingBan(false);
    }
  }

  // Unban User
  async function handleUnban(u: AdminUserRecord) {
    if (!confirm(`Restore access for @${u.tag.replace(/^@/, '')}?`)) return;
    const res = await adminSetUserBan(u.id, false);
    if (res.success) {
      showToast(`User @${u.tag.replace(/^@/, '')} unbanned.`);
      loadUsers();
    } else {
      alert(`Failed to unban user: ${res.error}`);
    }
  }

  // Delete Fraudulent Sale
  async function handleDeleteSale(saleId: string, cardName?: string) {
    if (!confirm(`Permanently delete this sale record (${cardName || saleId})?`)) return;
    const res = await adminDeleteSale(saleId);
    if (res.success) {
      showToast('Sale listing purged from community data.');
      setReportedSales((prev) => prev.filter((s) => s.id !== saleId));
    } else {
      alert(`Failed to delete sale: ${res.error}`);
    }
  }

  // Dismiss Flags on Sale
  async function handleDismissFlags(saleId: string) {
    const res = await adminDismissFlags(saleId);
    if (res.success) {
      showToast('Report flags cleared for this sale.');
      setReportedSales((prev) => prev.filter((s) => s.id !== saleId));
    } else {
      alert(`Failed to dismiss flags: ${res.error}`);
    }
  }

  // Check if current user is admin
  const isChiefAdmin = user?.email?.toLowerCase() === 'kylesantos0411@gmail.com' ||
    user?.tag?.toLowerCase() === '@kaipuccino' ||
    user?.tag?.toLowerCase() === 'kaipuccino' ||
    user?.name?.toLowerCase() === 'kaipuccino';

  const isAdmin = user?.role === 'admin' || isChiefAdmin;

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1e2230] border border-red-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white">Admin Access Restricted</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            This command center is reserved exclusively for Log Pose TCG system administrators. Please sign in with an administrator account to continue.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#282d3d] hover:bg-[#343a4e] text-white font-bold text-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter users list
  const filteredUsers = usersList.filter((u) => {
    const matchQuery =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.tag.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));

    if (!matchQuery) return false;
    if (userFilter === 'banned') return u.isBanned;
    if (userFilter === 'admins') return u.role === 'admin';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/90 text-slate-950 font-bold text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1e2230] via-[#242938] to-[#1a1c26] border border-[#3b4256] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Log Pose Fleet Command
            </h1>
            <p className="text-xs text-gray-400">
              Authenticated as Chief Administrator: <strong className="text-white">@{user?.tag.replace(/^@/, '')}</strong> ({user?.email})
            </p>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3">
            <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
              maintenanceEnabled
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${maintenanceEnabled ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span>{maintenanceEnabled ? 'Maintenance Active' : 'System Normal / Online'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 pt-6 overflow-x-auto no-scrollbar border-t border-white/5 mt-6">
          {[
            { id: 'system', label: '🛑 System Controls & Maintenance', icon: SlidersHorizontal },
            { id: 'users', label: `👥 User Moderation (${usersList.length})`, icon: Users },
            { id: 'sales', label: `🚩 Reported Sales (${reportedSales.length})`, icon: AlertTriangle },
            { id: 'overview', label: '📊 System Telemetry', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-[#181a24] text-gray-400 hover:text-white hover:bg-[#202330] border border-[#2d3242]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SYSTEM CONTROLS & MAINTENANCE                           */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Maintenance Mode Killswitch */}
          <div className="rounded-3xl bg-[#1e2230] border border-[#343a4c] p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Maintenance Mode</h2>
                  <p className="text-[11px] text-gray-400">Lock app for non-admin visitors</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
                className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  maintenanceEnabled ? 'bg-amber-500 justify-end' : 'bg-[#2b3040] justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#14161f] border border-[#2d3242] text-xs text-gray-300">
              {maintenanceEnabled ? (
                <div className="text-amber-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>MAINTENANCE IS TURNED ON: Regular visitors see the dry dock screen. Admins retain full access.</span>
                </div>
              ) : (
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>SYSTEM NORMAL: All collectors can freely access the app.</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Custom Maintenance Notice
                </label>
                <textarea
                  rows={3}
                  value={maintenanceMsg}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  placeholder="Explain why the app is under maintenance..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-[#2d3242] text-white text-xs focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Estimated Uptime / Return (Optional)
                </label>
                <input
                  type="text"
                  value={maintenanceTime}
                  onChange={(e) => setMaintenanceTime(e.target.value)}
                  placeholder="e.g. Back online at 9:30 PM PHT"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-[#2d3242] text-white text-xs focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveMaintenance}
              disabled={savingSettings}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow transition cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Maintenance Settings'}
            </button>
          </div>

          {/* Card 2: Global Announcement Banner */}
          <div className="rounded-3xl bg-[#1e2230] border border-[#343a4c] p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Global Broadcast Banner</h2>
                  <p className="text-[11px] text-gray-400">Broadcast notices to all active users</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  announcementEnabled ? 'bg-blue-500 justify-end' : 'bg-[#2b3040] justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Banner Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'info', label: 'ℹ️ Info (Blue)', color: 'text-blue-400' },
                    { id: 'warning', label: '⚠️ Notice (Amber)', color: 'text-amber-400' },
                    { id: 'alert', label: '🚨 Urgent (Red)', color: 'text-red-400' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setAnnouncementType(lvl.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center ${
                        announcementType === lvl.id
                          ? 'bg-white/10 border-white/40 text-white'
                          : 'bg-[#14161f] border-[#2d3242] text-gray-400 hover:text-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows={3}
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="e.g. OP-09 Expansion cards have been added to the database!"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-[#2d3242] text-white text-xs focus:outline-none focus:border-blue-500 placeholder-gray-500"
                />
              </div>

              {/* Preview */}
              {announcementMsg && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Live Preview:</span>
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    announcementType === 'alert'
                      ? 'bg-red-950/70 border-red-500/40 text-red-200'
                      : announcementType === 'warning'
                      ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                      : 'bg-blue-950/70 border-blue-500/40 text-blue-200'
                  }`}>
                    <Megaphone className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                    <span className="truncate">{announcementMsg}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAnnouncement}
              disabled={savingSettings}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow transition cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save & Broadcast Banner'}
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* TAB 2: USER MODERATION & BANS                                  */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-[#1e2230] border border-[#343a4c] p-6 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Registered Collectors &amp; Users</h2>
              <p className="text-xs text-gray-400">Search, manage roles, and suspend malicious accounts</p>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              className="self-start sm:self-auto py-2 px-3 rounded-xl bg-[#282d3d] hover:bg-[#343a4e] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by tag (@username), email, or name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14161f] border border-[#2d3242] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-1.5">
              {[
                { id: 'all', label: `All (${usersList.length})` },
                { id: 'banned', label: `Banned (${usersList.filter((u) => u.isBanned).length})` },
                { id: 'admins', label: `Admins (${usersList.filter((u) => u.role === 'admin').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUserFilter(f.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                    userFilter === f.id
                      ? 'bg-red-500 text-white'
                      : 'bg-[#14161f] border border-[#2d3242] text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="py-12 text-center text-gray-400 text-xs">Loading user registry...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">No users matching search criteria.</div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2d3242] text-gray-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Collector</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Collection</th>
                    <th className="py-3 px-3 text-center">Sales</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242938]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-black text-xs text-white flex-shrink-0">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {u.username}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              @{u.tag.replace(/^@/, '')} {u.email ? `• ${u.email}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-gray-500/15 text-gray-300 border border-gray-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {u.isBanned ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              <span>Banned</span>
                            </span>
                            {u.banReason && (
                              <span className="block text-[10px] text-gray-400 truncate max-w-xs italic">
                                "{u.banReason}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-300">
                        {u.cardCount} cards
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-300">
                        {u.salesCount} sold
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-[11px] text-gray-500 font-bold">Admin Protected</span>
                        ) : u.isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleUnban(u)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setBanningUser(u);
                              setBanReasonInput('Market manipulation and fraudulent pricing');
                            }}
                            className="py-1 px-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Ban User</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* TAB 3: SALES MODERATION (REPORTED QUEUE)                       */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <div className="rounded-3xl bg-[#1e2230] border border-[#343a4c] p-6 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Reported &amp; Flagged Transactions</h2>
              <p className="text-xs text-gray-400">Review reported sales or outlier prices submitted to community data</p>
            </div>
            <button
              type="button"
              onClick={loadReportedSales}
              className="self-start sm:self-auto py-2 px-3 rounded-xl bg-[#282d3d] hover:bg-[#343a4e] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {loadingSales ? (
            <div className="py-12 text-center text-gray-400 text-xs">Loading reported queue...</div>
          ) : reportedSales.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-black text-white">Queue Clean!</h3>
              <p className="text-xs text-gray-400">There are currently no reported or flagged fraudulent sales.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportedSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 rounded-2xl bg-[#14161f] border border-[#2d3242] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-sm">
                        {sale.cardName || sale.cardId}
                      </span>
                      <span className="font-mono text-xs text-[#3b82f6] font-bold">
                        ({sale.cardId})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                        🚩 {sale.flagsCount} Reports
                      </span>
                      {sale.isOutlier && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⚠️ Market Outlier
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>Sold Price: <strong className="text-emerald-400 font-mono">{sale.soldCurrency === 'PHP' ? '₱' : sale.soldCurrency === 'JPY' ? '¥' : '$'}{sale.soldPrice.toLocaleString()}</strong></span>
                      <span>Condition: <strong className="text-gray-200">{sale.condition}</strong></span>
                      <span>Date: <strong className="text-gray-200">{sale.soldDate}</strong></span>
                      {sale.buyerSource && <span>Channel: <strong className="text-gray-200">{sale.buyerSource}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDismissFlags(sale.id)}
                      className="py-1.5 px-3 rounded-xl bg-[#242938] hover:bg-[#2d3448] text-gray-300 hover:text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dismiss Reports</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSale(sale.id, sale.cardName)}
                      className="py-1.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Sale</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* TAB 4: SYSTEM TELEMETRY                                        */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-[#1e2230] border border-[#343a4c] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Registered Users</span>
            <div className="text-3xl font-black text-white font-mono">{usersList.length}</div>
            <p className="text-[11px] text-gray-500">Cloud profile accounts in database</p>
          </div>

          <div className="p-5 rounded-3xl bg-[#1e2230] border border-[#343a4c] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Banned Accounts</span>
            <div className="text-3xl font-black text-rose-400 font-mono">
              {usersList.filter((u) => u.isBanned).length}
            </div>
            <p className="text-[11px] text-gray-500">Restricted for policy violations</p>
          </div>

          <div className="p-5 rounded-3xl bg-[#1e2230] border border-[#343a4c] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Flagged Sales</span>
            <div className="text-3xl font-black text-amber-400 font-mono">{reportedSales.length}</div>
            <p className="text-[11px] text-gray-500">Pending review in moderation queue</p>
          </div>

          <div className="p-5 rounded-3xl bg-[#1e2230] border border-[#343a4c] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Server Status</span>
            <div className={`text-2xl font-black font-mono ${maintenanceEnabled ? 'text-amber-400' : 'text-emerald-400'}`}>
              {maintenanceEnabled ? 'MAINTENANCE' : 'ONLINE'}
            </div>
            <p className="text-[11px] text-gray-500">Global system gate status</p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* BAN CONFIRMATION MODAL                                         */}
      {/* ────────────────────────────────────────────────────────────── */}
      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setBanningUser(null)} />
          <div className="relative w-full max-w-md bg-[#242836] border border-red-500/40 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Suspend User Account
                </h3>
                <p className="text-xs text-gray-400">
                  Target: <strong className="text-white">@{banningUser.tag.replace(/^@/, '')}</strong> ({banningUser.username})
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">
                Suspension Reason (Visible to user)
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="Specify the reason for suspension..."
                className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-[#2d3242] text-white text-xs focus:outline-none focus:border-red-500 placeholder-gray-500"
              />
            </div>

            <p className="text-[11px] text-red-300/80 leading-snug">
              ⚠️ The user will immediately be blocked from browsing, logging in, or adding cards/sales.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBanningUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-gray-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={submittingBan}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingBan ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
