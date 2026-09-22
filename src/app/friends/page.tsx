'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Users, 
  UserPlus, 
  Sparkles, 
  ArrowLeftRight, 
  Check, 
  Copy, 
  QrCode, 
  Search, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  TrendingUp, 
  Star,
  Eye,
  Clock,
  Award,
  Trash2,
  LogIn
} from 'lucide-react';
import { getSafeCardImageUrl, getEditionCardImageUrl } from '@/lib/card-image';
import { useSettings } from '@/context/SettingsContext';
import { AccountModal } from '@/components/AccountModal';

interface FriendProfile {
  id: string;
  name: string;
  tag: string;
  avatar: string;
  rank: string;
  rankBadge: string;
  status: 'online' | 'recent' | 'offline';
  statusText: string;
  cardCount: number;
  binderValueUSD: number;
  showcaseCards: {
    id: string;
    name: string;
    rarity: string;
    priceUSD: number;
    imageUrl?: string;
  }[];
}

interface TradeMatch {
  id: string;
  friendName: string;
  friendAvatar: string;
  friendCard: {
    id: string;
    name: string;
    rarity: string;
    priceUSD: number;
    imageUrl?: string;
  };
  myCard: {
    id: string;
    name: string;
    rarity: string;
    priceUSD: number;
    imageUrl?: string;
  };
  fairnessNote: string;
  fairnessColor: string;
}

const FRIENDS_STORAGE_KEY = 'logpose_friends_list';
const REQUESTS_STORAGE_KEY = 'logpose_friend_requests';

export default function FriendsPage() {
  const router = useRouter();
  const { user, formatPrice } = useSettings();

  // Active Tab: 'friends' | 'radar' | 'requests'
  const [activeTab, setActiveTab] = useState<'friends' | 'radar' | 'requests'>('friends');

  // Modals
  const [inspectingFriend, setInspectingFriend] = useState<FriendProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMyQrModal, setShowMyQrModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [proposingTrade, setProposingTrade] = useState<TradeMatch | null>(null);
  const [tradeProposedSuccess, setTradeProposedSuccess] = useState(false);

  // My Collector Code
  const myCode = user?.tag || 'PIRATE-KYLE-7721';
  const [copiedCode, setCopiedCode] = useState(false);
  const [newFriendInput, setNewFriendInput] = useState('');
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Friends & Requests lists initialized cleanly
  const [friendsList, setFriendsList] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedFriends = localStorage.getItem(FRIENDS_STORAGE_KEY);
      if (savedFriends) {
        setFriendsList(JSON.parse(savedFriends));
      }
      const savedReqs = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (savedReqs) {
        setPendingRequests(JSON.parse(savedReqs));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveFriends = (newList: FriendProfile[]) => {
    setFriendsList(newList);
    try {
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // Ignore
    }
  };

  const saveRequests = (newReqs: any[]) => {
    setPendingRequests(newReqs);
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(newReqs));
    } catch {
      // Ignore
    }
  };

  // Dynamic trade matches computed from friendsList
  const tradeMatches: TradeMatch[] = friendsList.slice(0, 3).map((friend, idx) => {
    const cardA = friend.showcaseCards[0] || { id: 'OP05-119_p2', name: 'Monkey.D.Luffy (Manga Rare)', rarity: 'SEC-SP', priceUSD: 2400 };
    const myCards = [
      { id: 'OP01-120', name: 'Shanks (Secret Rare Parallel)', rarity: 'SEC', priceUSD: cardA.priceUSD * 0.98 },
      { id: 'OP02-013', name: 'Portgas.D.Ace (Super Rare)', rarity: 'SR', priceUSD: cardA.priceUSD * 0.95 },
      { id: 'OP01-001', name: 'Roronoa Zoro (Alt Art Leader)', rarity: 'L-P', priceUSD: cardA.priceUSD * 1.02 },
    ];
    const pickedMyCard = myCards[idx % myCards.length];
    return {
      id: `match-${friend.id}-${idx}`,
      friendName: friend.name,
      friendAvatar: friend.avatar,
      friendCard: cardA,
      myCard: pickedMyCard,
      fairnessNote: 'Fair Trade • Within 2.5% Balance',
      fairnessColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    };
  });

  const handleCopyMyCode = () => {
    navigator.clipboard?.writeText?.(myCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendFriendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const input = newFriendInput.trim();
    if (!input) return;

    let normalizedTag = input.toUpperCase().replace(/\s+/g, '');
    if (!normalizedTag.startsWith('PIRATE-')) {
      normalizedTag = `PIRATE-${normalizedTag}`;
    }

    // Check if adding self
    if (user && normalizedTag === user.tag.toUpperCase()) {
      setAddSuccessMessage("That is your own Collector Tag!");
      setTimeout(() => setAddSuccessMessage(null), 2500);
      return;
    }

    // Check if already friends
    if (friendsList.some((f) => f.tag.toUpperCase() === normalizedTag)) {
      setAddSuccessMessage(`${normalizedTag} is already in your crew!`);
      setTimeout(() => setAddSuccessMessage(null), 2500);
      return;
    }

    // Parse friend name
    const parts = normalizedTag.replace(/^PIRATE-/, '').split('-');
    const friendName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() : 'Collector';

    const avatarPool = ['⚔️', '🦅', '💎', '💛', '👑', '🐺', '🔥', '🌸', '🍖', '⚡'];
    const rankPool = ['Yonko Collector', 'Wano Champion', 'Supernova', 'Grand Line Captain'];
    const rankBadgePool = ['👑', '🗡️', '🏴‍☠️', '⚓'];
    const randIdx = Math.floor(Math.random() * avatarPool.length);
    const rankIdx = Math.floor(Math.random() * rankPool.length);

    const newFriend: FriendProfile = {
      id: `friend-${Date.now()}`,
      name: friendName,
      tag: normalizedTag,
      avatar: avatarPool[randIdx],
      rank: rankPool[rankIdx],
      rankBadge: rankBadgePool[rankIdx],
      status: 'online',
      statusText: 'Online now',
      cardCount: Math.floor(180 + Math.random() * 350),
      binderValueUSD: Math.floor(1800 + Math.random() * 4200),
      showcaseCards: [
        { id: 'OP05-119_p2', name: 'Monkey.D.Luffy (Manga Rare)', rarity: 'SEC-SP', priceUSD: 2400 },
        { id: 'OP01-120', name: 'Shanks (Secret Rare)', rarity: 'SEC', priceUSD: 1400 },
        { id: 'OP01-016', name: 'Nami (Parallel)', rarity: 'R-P', priceUSD: 450 },
        { id: 'OP02-013', name: 'Portgas.D.Ace (Super Rare)', rarity: 'SR', priceUSD: 380 },
        { id: 'OP01-001', name: 'Roronoa Zoro (Leader)', rarity: 'L', priceUSD: 180 },
      ],
    };

    const updated = [newFriend, ...friendsList];
    saveFriends(updated);

    setAddSuccessMessage(`Added ${newFriend.name} (${newFriend.tag}) to your Crew!`);
    setNewFriendInput('');
    setTimeout(() => {
      setAddSuccessMessage(null);
      setShowAddModal(false);
    }, 1500);
  };

  const handleAddDemoFriend = () => {
    const demoFriends: FriendProfile[] = [
      {
        id: 'friend-marco',
        name: 'Marco The Phoenix',
        tag: 'PIRATE-MARCO-1001',
        avatar: '🦅',
        rank: 'Yonko Collector',
        rankBadge: '👑',
        status: 'online',
        statusText: 'Online now',
        cardCount: 512,
        binderValueUSD: 4950,
        showcaseCards: [
          { id: 'OP05-119_p2', name: 'Monkey.D.Luffy (Manga Rare)', rarity: 'SEC-SP', priceUSD: 2400 },
          { id: 'OP01-120', name: 'Shanks (Secret Rare)', rarity: 'SEC', priceUSD: 1400 },
          { id: 'OP01-016', name: 'Nami (Parallel)', rarity: 'R-P', priceUSD: 450 },
          { id: 'OP02-013', name: 'Portgas.D.Ace (Super Rare)', rarity: 'SR', priceUSD: 380 },
        ],
      },
      {
        id: 'friend-zoro',
        name: 'Wano Swordsman',
        tag: 'PIRATE-ZORO-1080',
        avatar: '⚔️',
        rank: 'Wano Champion',
        rankBadge: '🗡️',
        status: 'recent',
        statusText: 'Active 20m ago',
        cardCount: 340,
        binderValueUSD: 2470,
        showcaseCards: [
          { id: 'OP01-001', name: 'Roronoa Zoro (Alt Art Leader)', rarity: 'L-P', priceUSD: 600 },
          { id: 'OP01-070', name: 'Dracule Mihawk', rarity: 'SR', priceUSD: 420 },
          { id: 'OP02-013', name: 'Portgas.D.Ace', rarity: 'SR', priceUSD: 380 },
        ],
      }
    ];

    const merged = [...friendsList];
    for (const df of demoFriends) {
      if (!merged.some(f => f.tag === df.tag)) {
        merged.push(df);
      }
    }
    saveFriends(merged);
    setAddSuccessMessage('Added Marco & Wano Swordsman demo mates!');
    setTimeout(() => setAddSuccessMessage(null), 1800);
  };

  const handleAcceptRequest = (id: string) => {
    const req = pendingRequests.find((r) => r.id === id);
    if (!req) return;

    const newReqs = pendingRequests.filter((r) => r.id !== id);
    saveRequests(newReqs);

    const newFriend: FriendProfile = {
      id: `friend-${Date.now()}`,
      name: req.name,
      tag: req.tag,
      avatar: req.avatar || '🐺',
      rank: req.rank || 'Samurai Collector',
      rankBadge: '🛡️',
      status: 'online',
      statusText: 'Connected now',
      cardCount: req.cardCount || 156,
      binderValueUSD: req.binderValueUSD || 730,
      showcaseCards: [
        { id: 'OP01-016', name: 'Nami', rarity: 'R', priceUSD: 85 },
        { id: 'ST01-012', name: 'Monkey.D.Luffy', rarity: 'SR', priceUSD: 140 },
        { id: 'OP01-120', name: 'Shanks', rarity: 'SEC', priceUSD: 1400 },
      ],
    };

    saveFriends([newFriend, ...friendsList]);
  };

  const handleDeclineRequest = (id: string) => {
    saveRequests(pendingRequests.filter((r) => r.id !== id));
  };

  const handleRemoveFriend = (id: string) => {
    if (!confirm('Remove this collector from your crew?')) return;
    saveFriends(friendsList.filter((f) => f.id !== id));
    setInspectingFriend(null);
  };

  const handleConfirmTrade = () => {
    setTradeProposedSuccess(true);
    setTimeout(() => {
      setTradeProposedSuccess(false);
      setProposingTrade(null);
    }, 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16 px-1 sm:px-0 font-sans select-none">
      {/* ================= 1. SLEEK TOP APP BAR ================= */}
      <header className="flex items-center justify-between gap-2 pt-2 pb-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            aria-label="Back to Home"
            className="w-9 h-9 rounded-full bg-[#242836] hover:bg-[#2d3244] border border-[#343a4c] text-gray-300 hover:text-white flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-none">
              Friends &amp; Trades
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Connect with local collectors &amp; trade grails
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMyQrModal(true)}
            title="My Collector QR"
            className="w-9 h-9 rounded-full bg-[#242836] hover:bg-[#2d3244] border border-[#343a4c] text-purple-400 hover:text-white flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Friend</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* ================= 2. COLLECTOR SOCIAL STATS BANNER ================= */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#262138] via-[#212433] to-[#202738] border border-purple-500/20 p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
            {user?.avatar || '🏴‍☠️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm sm:text-base text-white truncate">
                {user?.name || 'Guest Collector'}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user?.rank || 'Guest Mode'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 font-mono">
              <span className="text-amber-400 font-bold truncate">{myCode}</span>
              <button 
                type="button" 
                onClick={handleCopyMyCode} 
                className="hover:text-purple-300 transition cursor-pointer flex-shrink-0"
                title="Copy Friend Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="text-[10px] font-bold text-[#f45d6a] hover:underline cursor-pointer ml-1 flex-shrink-0"
                >
                  Claim Tag &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Social Summary */}
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Network Value
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
            {formatPrice(friendsList.reduce((acc, f) => acc + f.binderValueUSD, 0), { source: 'yuyutei' }).full}
          </div>
        </div>
      </div>

      {/* ================= 3. SEGMENTED NAVIGATION TABS ================= */}
      <div className="flex items-center p-1 rounded-2xl bg-[#1d202c] border border-[#2e3346] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Friends ({friendsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'radar'
              ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
          <span>Trade Radar</span>
          {tradeMatches.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {tradeMatches.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= 4. TAB CONTENT ================= */}

      {/* 4A. TAB: FRIENDS LIST */}
      {activeTab === 'friends' && (
        <div className="space-y-3 animate-fadeIn">
          {friendsList.length === 0 ? (
            <div className="py-14 px-4 text-center rounded-3xl bg-[#242836]/70 border border-[#343a4c] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
                🏴‍☠️
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Your Crew is Empty</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Connect with fellow One Piece collectors to inspect their binders, compare wishlists, and trade rare Japanese cards!
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Friend by Tag</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddDemoFriend}
                  className="px-4 py-2.5 rounded-xl bg-[#1d202c] hover:bg-[#282c3c] border border-[#343a4c] text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Add Demo Mates (Marco &amp; Zoro)</span>
                </button>
              </div>
            </div>
          ) : (
            friendsList.map((friend) => (
              <div
                key={friend.id}
                className="rounded-2xl bg-[#242836] border border-[#343a4c] hover:border-purple-500/40 p-4 transition-all duration-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                {/* Left: Friend Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#1d202c] border border-[#363b4f] flex items-center justify-center text-2xl shadow-inner">
                      {friend.avatar}
                    </div>
                    {/* Status Indicator */}
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#242836] ${
                        friend.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-white leading-tight truncate">
                        {friend.name}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">
                        {friend.tag}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <span>{friend.rankBadge}</span>
                        <span>{friend.rank}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="text-gray-300 font-semibold">{friend.cardCount} cards</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatPrice(friend.binderValueUSD, { source: 'yuyutei' }).full} binder
                      </span>
                      <span>•</span>
                      <span className="text-[11px] text-gray-500">{friend.statusText}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2e3346]">
                  <button
                    type="button"
                    onClick={() => setInspectingFriend(friend)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#1e212c] hover:bg-[#2b3040] text-gray-200 hover:text-white border border-[#343a4c] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>View Binder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const match: TradeMatch = {
                        id: `trade-direct-${friend.id}`,
                        friendName: friend.name,
                        friendAvatar: friend.avatar,
                        friendCard: friend.showcaseCards[0] || {
                          id: 'OP01-120',
                          name: 'Shanks (Secret Rare)',
                          rarity: 'SEC',
                          priceUSD: 1400,
                        },
                        myCard: {
                          id: 'OP01-001',
                          name: 'Roronoa Zoro (Leader)',
                          rarity: 'L',
                          priceUSD: 1350,
                        },
                        fairnessNote: 'Direct Peer Exchange',
                        fairnessColor: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
                      };
                      setProposingTrade(match);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Trade</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4B. TAB: TRADE RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Radar Header Explainer */}
          <div className="bg-[#242836] border border-[#343a4c] rounded-2xl p-3.5 flex items-center gap-3 text-xs text-gray-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <strong className="text-white">Live Trade Matchmaker:</strong> Cross-referencing your collection and wishlist with your crew members to suggest balanced, fair trades.
            </div>
          </div>

          {tradeMatches.length === 0 ? (
            <div className="py-14 px-4 text-center rounded-3xl bg-[#242836]/70 border border-[#343a4c] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner text-emerald-400">
                <ArrowLeftRight className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">No Active Trade Matches</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Add friends to your crew or try the demo friends to see live matching trade proposals!
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Friends</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddDemoFriend}
                  className="px-4 py-2.5 rounded-xl bg-[#1d202c] hover:bg-[#282c3c] border border-[#343a4c] text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Add Demo Mates</span>
                </button>
              </div>
            </div>
          ) : (
            tradeMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl sm:rounded-3xl bg-[#242836] border border-[#343a4c] p-4 sm:p-5 shadow-lg space-y-3.5"
              >
                {/* Top Trade Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{match.friendAvatar}</span>
                    <span className="font-black text-sm text-white">
                      Trade with {match.friendName}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${match.fairnessColor}`}>
                    {match.fairnessNote}
                  </span>
                </div>

                {/* Trade Exchange Cards (2 Columns: You Receive ⇄ You Send) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Left: You Receive */}
                  <div className="bg-[#1c1f2b] border border-[#32364a] rounded-2xl p-3 text-left">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                      ↓ You Receive
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 aspect-[2.5/3.5] bg-[#14161f] rounded-lg overflow-hidden border border-[#343a4c] flex-shrink-0">
                        <img
                          src={getEditionCardImageUrl(match.friendCard.id, 'jp', match.friendCard.imageUrl)}
                          alt={match.friendCard.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#f4727d]">
                          {match.friendCard.id}
                        </span>
                        <h4 className="text-xs font-extrabold text-white truncate">
                          {match.friendCard.name}
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatPrice(match.friendCard.priceUSD, { source: 'yuyutei' }).full}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: You Send */}
                  <div className="bg-[#1c1f2b] border border-[#32364a] rounded-2xl p-3 text-left">
                    <span className="text-[10px] font-bold text-[#f4727d] uppercase tracking-wider block mb-2">
                      ↑ You Send
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 aspect-[2.5/3.5] bg-[#14161f] rounded-lg overflow-hidden border border-[#343a4c] flex-shrink-0">
                        <img
                          src={getEditionCardImageUrl(match.myCard.id, 'jp', match.myCard.imageUrl)}
                          alt={match.myCard.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#f4727d]">
                          {match.myCard.id}
                        </span>
                        <h4 className="text-xs font-extrabold text-white truncate">
                          {match.myCard.name}
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatPrice(match.myCard.priceUSD, { source: 'yuyutei' }).full}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Propose Button */}
                <button
                  type="button"
                  onClick={() => setProposingTrade(match)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Propose This Trade</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4C. TAB: REQUESTS & CODE */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-fadeIn">
          {/* My Collector Code Card */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#242836] border border-[#343a4c] p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Your Shareable Friend Tag
              </span>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {myCode}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Share this tag or QR with opponents at local tournaments to trade easily!
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyMyCode}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1e212c] hover:bg-[#2b3040] text-gray-200 hover:text-white border border-[#343a4c] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMyQrModal(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>My QR</span>
              </button>
            </div>
          </div>

          {/* Pending Requests Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">
              Pending Requests ({pendingRequests.length})
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="rounded-2xl bg-[#242836] border border-[#343a4c] p-8 text-center text-gray-400 text-xs">
                No pending friend requests right now.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-[#242836] border border-[#343a4c] p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1d202c] border border-[#363b4f] flex items-center justify-center text-xl">
                      {req.avatar || '🐺'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{req.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{req.tag}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {req.cardCount || 156} cards &bull; {formatPrice(req.binderValueUSD || 730, { source: 'yuyutei' }).full}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#1e212c] hover:bg-[#2b3040] text-gray-400 hover:text-white text-xs font-medium border border-[#343a4c] transition cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: FRIEND'S SHOWCASE BINDER ================= */}
      {inspectingFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-[#232634] border border-[#34384c] rounded-[30px] p-5 sm:p-6 shadow-2xl text-left relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#31364a] pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1a1d27] border border-[#383e54] flex items-center justify-center text-2xl shadow-inner">
                  {inspectingFriend.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {inspectingFriend.name}&apos;s Showcase Binder
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {inspectingFriend.rank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    {inspectingFriend.tag} &bull; <strong className="text-emerald-400">{formatPrice(inspectingFriend.binderValueUSD, { source: 'yuyutei' }).full} Value</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingFriend(null)}
                className="w-8 h-8 rounded-full bg-[#2d3143] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Showcase Cards Grid */}
            <div className="py-4 overflow-y-auto flex-1">
              <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Grails &amp; Top Cards ({inspectingFriend.showcaseCards.length})
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {inspectingFriend.showcaseCards.map((card) => (
                  <div
                    key={card.id}
                    className="group relative rounded-xl overflow-hidden aspect-[2.5/3.5] bg-[#1a1d27] border border-[#363b4f] hover:border-purple-400 transition-all shadow-md cursor-pointer"
                    onClick={() => router.push(`/cards/${card.id}`)}
                  >
                    <img
                      src={getEditionCardImageUrl(card.id, 'jp', card.imageUrl)}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Floating Price Pill */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-emerald-300 font-mono">
                      {formatPrice(card.priceUSD, { source: 'yuyutei' }).full}
                    </div>

                    {/* Card ID Top Right */}
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-black text-white font-mono">
                      {card.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#31364a] flex items-center justify-between gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleRemoveFriend(inspectingFriend.id)}
                className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const match: TradeMatch = {
                    id: `trade-custom-${inspectingFriend.id}`,
                    friendName: inspectingFriend.name,
                    friendAvatar: inspectingFriend.avatar,
                    friendCard: inspectingFriend.showcaseCards[0] || {
                      id: 'OP05-119_p2',
                      name: 'Monkey.D.Luffy (Manga Rare)',
                      rarity: 'SEC-SP',
                      priceUSD: 2400,
                    },
                    myCard: {
                      id: 'OP01-001',
                      name: 'Roronoa Zoro (Leader)',
                      rarity: 'L',
                      priceUSD: 600,
                    },
                    fairnessNote: 'Custom Peer Trade Proposal',
                    fairnessColor: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
                  };
                  setInspectingFriend(null);
                  setProposingTrade(match);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Propose Trade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PROPOSE TRADE MODAL ================= */}
      {proposingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-sm sm:max-w-md bg-[#232634] border border-[#34384c] rounded-[30px] p-5 sm:p-6 shadow-2xl text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setProposingTrade(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2d3143] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
              <span>Confirm Trade Proposal</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Send this card offer to <strong className="text-white">{proposingTrade.friendName}</strong>:
            </p>

            {/* Exchange Summary */}
            <div className="space-y-2.5 mb-4">
              <div className="bg-[#1b1e2a] border border-[#32364a] rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    You Receive
                  </span>
                  <span className="text-xs font-black text-white">
                    {proposingTrade.friendCard.name}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 block">
                    {proposingTrade.friendCard.id} ({formatPrice(proposingTrade.friendCard.priceUSD, { source: 'yuyutei' }).full})
                  </span>
                </div>
                <span className="text-xl">{proposingTrade.friendAvatar}</span>
              </div>

              <div className="bg-[#1b1e2a] border border-[#32364a] rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#f4727d] uppercase tracking-wider block">
                    You Send
                  </span>
                  <span className="text-xs font-black text-white">
                    {proposingTrade.myCard.name}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 block">
                    {proposingTrade.myCard.id} ({formatPrice(proposingTrade.myCard.priceUSD, { source: 'yuyutei' }).full})
                  </span>
                </div>
                <span className="text-xl">🏴‍☠️</span>
              </div>
            </div>

            {/* Submit Trade Proposal */}
            <button
              type="button"
              onClick={handleConfirmTrade}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {tradeProposedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3] animate-bounce" />
                  <span>PROPOSAL SENT TO {proposingTrade.friendName.toUpperCase()}! 🚀</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>SEND PROPOSAL TO {proposingTrade.friendName.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD FRIEND DIALOG ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-sm bg-[#232634] border border-[#34384c] rounded-[30px] p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Add Collector Friend</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#2d3143] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              Enter their unique pirate tag or code (e.g. <code>PIRATE-ZORO-1080</code> or <code>PIRATE-LUFFY-5656</code>):
            </p>

            <form onSubmit={handleSendFriendRequest} className="space-y-3">
              <input
                type="text"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                placeholder="e.g. PIRATE-ZORO-1080..."
                className="w-full bg-[#1a1d27] border border-[#3b4156] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder-gray-500 focus:outline-none"
              />

              {addSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{addSuccessMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/25 transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                Add to Crew
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[#31364a] text-center">
              <button
                type="button"
                onClick={handleAddDemoFriend}
                className="text-xs text-purple-300 hover:text-white flex items-center justify-center gap-1 mx-auto transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Instant Demo Friends (Marco &amp; Zoro)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: MY QR CODE DIALOG ================= */}
      {showMyQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-sm bg-[#232634] border border-[#34384c] rounded-[30px] p-6 shadow-2xl text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMyQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2d3143] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
              {user?.avatar || '🏴‍☠️'}
            </div>

            <h3 className="text-base font-black text-white">
              {user?.name || 'Pirate Collector'}
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono font-bold text-amber-400">
              {myCode}
            </p>

            {/* High-Contrast SVG QR Code Representation */}
            <div className="w-52 h-52 bg-white rounded-2xl p-4 mx-auto shadow-2xl flex items-center justify-center border-4 border-purple-500/40 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* QR Finder Corners */}
                <rect x="5" y="5" width="26" height="26" fill="black" rx="2" />
                <rect x="9" y="9" width="18" height="18" fill="white" rx="1" />
                <rect x="13" y="13" width="10" height="10" fill="black" rx="1" />

                <rect x="69" y="5" width="26" height="26" fill="black" rx="2" />
                <rect x="73" y="9" width="18" height="18" fill="white" rx="1" />
                <rect x="77" y="13" width="10" height="10" fill="black" rx="1" />

                <rect x="5" y="69" width="26" height="26" fill="black" rx="2" />
                <rect x="9" y="73" width="18" height="18" fill="white" rx="1" />
                <rect x="13" y="77" width="10" height="10" fill="black" rx="1" />

                {/* Data Matrix Bits */}
                <rect x="36" y="8" width="6" height="6" fill="black" />
                <rect x="46" y="8" width="6" height="6" fill="black" />
                <rect x="56" y="8" width="6" height="6" fill="black" />
                <rect x="36" y="20" width="6" height="6" fill="black" />
                <rect x="46" y="26" width="6" height="6" fill="black" />
                <rect x="8" y="38" width="6" height="6" fill="black" />
                <rect x="20" y="38" width="6" height="6" fill="black" />
                <rect x="36" y="38" width="6" height="6" fill="black" />
                <rect x="50" y="38" width="6" height="6" fill="black" />
                <rect x="64" y="38" width="6" height="6" fill="black" />
                <rect x="80" y="38" width="6" height="6" fill="black" />
                <rect x="8" y="50" width="6" height="6" fill="black" />
                <rect x="26" y="50" width="6" height="6" fill="black" />
                <rect x="40" y="50" width="6" height="6" fill="black" />
                <rect x="60" y="50" width="6" height="6" fill="black" />
                <rect x="76" y="50" width="6" height="6" fill="black" />
                <rect x="38" y="64" width="6" height="6" fill="black" />
                <rect x="52" y="64" width="6" height="6" fill="black" />
                <rect x="68" y="64" width="6" height="6" fill="black" />
                <rect x="38" y="78" width="6" height="6" fill="black" />
                <rect x="50" y="78" width="6" height="6" fill="black" />
                <rect x="78" y="78" width="6" height="6" fill="black" />
                <rect x="44" y="88" width="6" height="6" fill="black" />
                <rect x="60" y="88" width="6" height="6" fill="black" />

                {/* Central Brand Emblem */}
                <circle cx="50" cy="50" r="10" fill="#9333ea" />
                <text x="50" y="54" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">⚓</text>
              </svg>
            </div>

            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
              Have opponents scan this QR code with their camera to link profiles and view your trade binder instantly.
            </p>

            <div className="pt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMyCode}
                className="flex-1 py-2.5 rounded-xl bg-[#1a1d27] border border-[#3b4156] text-white text-xs font-bold hover:bg-[#252938] transition flex items-center justify-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMyQrModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: ACCOUNT MODAL ================= */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        defaultTab="register"
      />
    </div>
  );
}
