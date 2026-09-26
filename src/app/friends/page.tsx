'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Users,
  UserPlus,
  Check,
  Copy,
  Search,
  X,
  UserMinus,
  User,
  Loader2,
  UserCheck,
  Bell,
  Clock,
  LogIn,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { AccountModal } from '@/components/AccountModal';
import {
  fetchFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  searchUserByUsername,
  type FriendshipProfile,
  type SearchedUser,
} from '@/lib/supabase-sync';

// Avatar color based on username
function avatarColor(name: string) {
  const colors = [
    'from-purple-500 to-indigo-600',
    'from-red-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-blue-500 to-cyan-600',
    'from-rose-500 to-red-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function AvatarCircle({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-11 h-11 text-base';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center font-black text-white shadow-md flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const { user } = useSettings();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // My handle
  const myHandle = user?.username ? `@${user.username}` : (user?.tag?.startsWith('@') ? user.tag : `@${user?.tag || ''}`);
  const [copiedHandle, setCopiedHandle] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<SearchedUser | null | 'not_found'>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSendingReq, setIsSendingReq] = useState(false);
  const [addMsg, setAddMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Friendships
  const [friendships, setFriendships] = useState<FriendshipProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unfriendTarget, setUnfriendTarget] = useState<FriendshipProfile | null>(null);

  const friends = friendships.filter((f) => f.status === 'accepted');
  const pendingReceived = friendships.filter((f) => f.status === 'pending_received');
  const pendingSent = friendships.filter((f) => f.status === 'pending_sent');
  const incomingCount = pendingReceived.length;

  const loadFriendships = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await fetchFriendships(user.id);
    setFriendships(data);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    setIsMounted(true);
    loadFriendships();
  }, [loadFriendships]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyHandle = () => {
    navigator.clipboard?.writeText?.(myHandle);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q || !user?.id) return;
    setIsSearching(true);
    setSearchResult(null);
    setAddMsg(null);
    const result = await searchUserByUsername(q, user.id);
    setSearchResult(result ?? 'not_found');
    setIsSearching(false);
  };

  const handleSendRequest = async (targetId: string, targetName: string) => {
    if (!user?.id) return;
    setIsSendingReq(true);
    const res = await sendFriendRequest(user.id, targetId);
    setIsSendingReq(false);
    if (res.success) {
      setAddMsg({ text: `Friend request sent to ${targetName}!`, ok: true });
      if (searchResult && searchResult !== 'not_found') {
        setSearchResult({ ...searchResult, friendshipStatus: 'pending_sent' });
      }
      await loadFriendships();
    } else {
      setAddMsg({ text: res.error || 'Failed to send request.', ok: false });
    }
  };

  const handleAccept = async (friendshipId: string, name: string) => {
    const res = await acceptFriendRequest(friendshipId);
    if (res.success) {
      showToast(`You and ${name} are now friends! 🎉`);
      await loadFriendships();
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    await removeFriendship(friendshipId);
    await loadFriendships();
  };

  const handleCancelRequest = async (friendshipId: string, name: string) => {
    await removeFriendship(friendshipId);
    showToast(`Cancelled request to ${name}.`);
    await loadFriendships();
  };

  const handleConfirmUnfriend = async () => {
    if (!unfriendTarget) return;
    const name = unfriendTarget.username;
    await removeFriendship(unfriendTarget.id);
    setUnfriendTarget(null);
    showToast(`Unfriended ${name}.`);
    await loadFriendships();
  };

  if (!isMounted) return null;

  // ── Not logged in ──────────────────────────────────────────────────
  if (!user?.id) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-16 px-1 sm:px-0 font-sans select-none">
        <header className="flex items-center gap-2.5 pt-2 pb-1">
          <Link href="/" className="w-9 h-9 rounded-full bg-[#242836] hover:bg-[#2d3244] border border-[#343a4c] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer">
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <h1 className="text-xl font-black text-white">Friends</h1>
        </header>
        <div className="rounded-2xl bg-[#242836] border border-[#343a4c] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <p className="text-white font-black text-lg">Sign in to use Friends</p>
            <p className="text-gray-400 text-sm mt-1">Connect with other collectors, send friend requests, and see each other's collection.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 mx-auto cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In / Create Account
          </button>
        </div>
        {showAccountModal && <AccountModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />}
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16 px-1 sm:px-0 font-sans select-none">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2d3347] border border-[#4b5280] text-white text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between gap-2 pt-2 pb-1">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="w-9 h-9 rounded-full bg-[#242836] hover:bg-[#2d3244] border border-[#343a4c] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer">
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-none">Friends</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Connect with other collectors</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setShowAddModal(true); setSearchInput(''); setSearchResult(null); setAddMsg(null); }}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Friend</span>
        </button>
      </header>

      {/* My Handle Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#262138] via-[#212433] to-[#202738] border border-purple-500/20 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarCircle name={user.username || user.name || 'U'} />
          <div className="min-w-0">
            <p className="font-black text-white text-sm truncate">{user.name || user.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-amber-400 font-bold text-xs font-mono truncate">{myHandle}</span>
              <button type="button" onClick={handleCopyHandle} className="text-gray-400 hover:text-purple-300 transition cursor-pointer flex-shrink-0">
                {copiedHandle ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 text-xs">
          <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Friends</p>
          <p className="text-white font-black text-lg">{friends.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-2xl bg-[#1d202c] border border-[#2e3346] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'friends' ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Friends ({friends.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'requests' ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          <span>Requests</span>
          {incomingCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {incomingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── FRIENDS TAB ── */}
      {activeTab === 'friends' && (
        <section className="space-y-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
              <span className="text-sm font-bold">Loading friends…</span>
            </div>
          ) : friends.length === 0 ? (
            <div className="rounded-2xl bg-[#1e2130] border border-[#2e3346] p-8 text-center space-y-3">
              <Users className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-gray-400 font-bold text-sm">No friends yet</p>
              <p className="text-gray-500 text-xs">Search for a user by their username to send a friend request.</p>
              <button
                type="button"
                onClick={() => { setShowAddModal(true); setSearchInput(''); setSearchResult(null); setAddMsg(null); }}
                className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold text-xs hover:bg-purple-600/30 transition cursor-pointer mx-auto"
              >
                + Add Your First Friend
              </button>
            </div>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#242836] border border-[#343a4c] hover:border-purple-500/30 transition">
                <AvatarCircle name={f.username} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm truncate">{f.username}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{f.tag}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{f.cardCount} cards in binder · {f.rank}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUnfriendTarget(f)}
                  className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer flex-shrink-0"
                  title="Unfriend"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {/* Sent pending requests */}
          {pendingSent.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider px-1 mb-2">Sent Requests</p>
              {pendingSent.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1e2130] border border-[#2e3346]">
                  <AvatarCircle name={f.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-300 text-sm truncate">{f.username}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending…</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelRequest(f.id, f.username)}
                    className="text-xs text-gray-500 hover:text-red-400 font-bold transition cursor-pointer flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <section className="space-y-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
            </div>
          ) : pendingReceived.length === 0 ? (
            <div className="rounded-2xl bg-[#1e2130] border border-[#2e3346] p-8 text-center space-y-2">
              <Bell className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-gray-400 font-bold text-sm">No pending requests</p>
              <p className="text-gray-500 text-xs">When someone sends you a friend request, it will appear here.</p>
            </div>
          ) : (
            pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#242836] border border-cyan-500/20">
                <AvatarCircle name={f.username} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm truncate">{f.username}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{f.tag}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{f.cardCount} cards · {f.rank}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDecline(f.id)}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept(f.id, f.username)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase flex items-center gap-1 transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Accept
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── ADD FRIEND MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-sm bg-[#242836] border border-[#3b4156] rounded-3xl p-5 shadow-2xl z-10 space-y-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-white">Add Friend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Search by username (e.g. <span className="text-amber-400">@kaipuccino</span>)</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="@username"
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </form>

            {/* Search Result */}
            {searchResult === 'not_found' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold text-center">
                No user found with that username.
              </div>
            )}

            {searchResult && searchResult !== 'not_found' && (
              <div className="p-3.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarCircle name={searchResult.username} />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm truncate">{searchResult.username}</p>
                    <p className="text-xs text-gray-400 font-mono">{searchResult.tag}</p>
                    <p className="text-[10px] text-gray-500">{searchResult.cardCount} cards · {searchResult.rank}</p>
                  </div>
                </div>

                {searchResult.friendshipStatus === 'none' && (
                  <button
                    type="button"
                    onClick={() => handleSendRequest(searchResult.id, searchResult.username)}
                    disabled={isSendingReq}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSendingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Send Friend Request
                  </button>
                )}
                {searchResult.friendshipStatus === 'pending_sent' && (
                  <div className="w-full py-2.5 rounded-xl bg-[#2a2e40] border border-[#3b4159] text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Request Sent — Waiting…
                  </div>
                )}
                {searchResult.friendshipStatus === 'pending_received' && (
                  <button
                    type="button"
                    onClick={() => searchResult.friendshipId && handleAccept(searchResult.friendshipId, searchResult.username)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Accept Their Request
                  </button>
                )}
                {searchResult.friendshipStatus === 'accepted' && (
                  <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Already Friends
                  </div>
                )}
              </div>
            )}

            {addMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold text-center ${addMsg.ok ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                {addMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── UNFRIEND CONFIRM MODAL ── */}
      {unfriendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setUnfriendTarget(null)} />
          <div className="relative w-full max-w-xs bg-[#242836] border border-[#3b4156] rounded-2xl p-5 shadow-2xl z-10 space-y-4 text-center">
            <UserMinus className="w-10 h-10 text-red-400 mx-auto" />
            <div>
              <p className="font-black text-white">Unfriend {unfriendTarget.username}?</p>
              <p className="text-xs text-gray-400 mt-1">They won't be notified. You can add them again later.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setUnfriendTarget(null)} className="flex-1 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-gray-300 font-bold text-sm transition cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmUnfriend} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition cursor-pointer">
                Unfriend
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountModal && <AccountModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />}
    </div>
  );
}
