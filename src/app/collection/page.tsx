'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  FolderHeart, 
  Trash2, 
  Plus, 
  Search,
  Coins,
  Settings as SettingsIcon,
  ListFilter,
  LayoutGrid,
  X,
  Upload,
  Download,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Tag,
  Undo2,
  Pencil,
  CheckCircle2,
  Globe,
  Lock,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { getSafeCardImageUrl } from '@/lib/card-image';
import { useSettings } from '@/context/SettingsContext';
import { CardDetailView } from '@/components/CardDetailView';
import { AccountModal } from '@/components/AccountModal';
import {
  fetchFriendships,
  fetchPendingTradeConfirmations,
  confirmMutualTrade,
  type FriendshipProfile,
  type CloudSaleRecord
} from '@/lib/supabase-sync';
import { 
  getLocalBinder, 
  removeCardFromLocalBinder, 
  getLocalBinderStats, 
  getSoldStats,
  markCardAsSold,
  undoCardSale,
  editCardSale,
  exportBinderToJSON,
  importBinderFromJSON,
  saveLocalBinder,
  LocalUserCard 
} from '@/lib/user-collection';

interface UserCardRecord extends LocalUserCard {}

export default function CollectionPage() {
  const { currency, formatPrice, formatYuyuPrice, openSettings, formatCard, user, logout } = useSettings();
  
  const [items, setItems] = useState<UserCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState<'collection' | 'sold'>('collection');

  const setActiveTab = (tab: 'collection' | 'sold') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('logpose_collection_active_tab', tab);
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('logpose_collection_active_tab');
        if (saved === 'collection' || saved === 'sold') {
          setActiveTabState(saved);
        }
      } catch (e) {}
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'register' | 'login'>('login');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Mark as Sold Modal state
  const [sellingItem, setSellingItem] = useState<UserCardRecord | null>(null);
  const [sellStep, setSellStep] = useState<'form' | 'confirm'>('form');
  const [soldPrice, setSoldPrice] = useState<string>('');
  const [soldCurrency, setSoldCurrency] = useState<'PHP' | 'USD' | 'JPY'>('PHP');
  const [soldDate, setSoldDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [soldQuantity, setSoldQuantity] = useState<number>(1);
  const [buyerSource, setBuyerSource] = useState<string>('');
  const [soldNotes, setSoldNotes] = useState<string>('');
  const [isPublicSale, setIsPublicSale] = useState<boolean>(true);
  const [sellError, setSellError] = useState<string | null>(null);

  // Anti-Manipulation & Mutual Trade state
  const [friendsList, setFriendsList] = useState<FriendshipProfile[]>([]);
  const [pendingTrades, setPendingTrades] = useState<CloudSaleRecord[]>([]);
  const [isFriendSale, setIsFriendSale] = useState(false);
  const [selectedFriendTag, setSelectedFriendTag] = useState<string>('');

  // Undo Sale Confirmation state
  const [undoingItem, setUndoingItem] = useState<UserCardRecord | null>(null);

  // Edit Sale Modal state
  const [editingItem, setEditingItem] = useState<UserCardRecord | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editCurrency, setEditCurrency] = useState<'PHP' | 'USD' | 'JPY'>('PHP');
  const [editDate, setEditDate] = useState<string>('');
  const [editPublic, setEditPublic] = useState<boolean>(true);
  const [editNotes, setEditNotes] = useState<string>('');

  useEffect(() => {
    loadCollection();

    const handleUpdate = () => {
      loadCollection();
      if (user?.tag) {
        fetchPendingTradeConfirmations(user.tag).then(setPendingTrades).catch(() => {});
      }
    };

    window.addEventListener('logpose_collection_updated', handleUpdate);
    window.addEventListener('logpose_auth_changed', handleUpdate);
    return () => {
      window.removeEventListener('logpose_collection_updated', handleUpdate);
      window.removeEventListener('logpose_auth_changed', handleUpdate);
    };
  }, [user?.tag]);

  // Load friends and pending trade confirmations for anti-manipulation
  useEffect(() => {
    if (user?.id) {
      fetchFriendships(user.id)
        .then((fs) => {
          setFriendsList(fs.filter((f) => f.status === 'accepted'));
        })
        .catch(() => {});
    }
    if (user?.tag) {
      fetchPendingTradeConfirmations(user.tag)
        .then((trades) => {
          setPendingTrades(trades);
        })
        .catch(() => {});
    }
  }, [user?.id, user?.tag]);

  // Set default sold currency based on user currency setting
  useEffect(() => {
    if (currency === 'PHP') setSoldCurrency('PHP');
    else if (currency === 'USD') setSoldCurrency('USD');
    else if (currency === 'JPY' || currency === 'source') setSoldCurrency('JPY');
  }, [currency]);

  function showToast(msg: string) {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  }

  async function loadCollection() {
    setLoading(true);
    try {
      const local = getLocalBinder(user?.tag || null);
      setItems(local as any);
    } catch (e) {
      console.error('Error loading collection:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Split into Owned vs Sold cards
  const ownedItems = useMemo(() => items.filter((it) => it.status !== 'SOLD'), [items]);
  const soldItems = useMemo(() => items.filter((it) => it.status === 'SOLD'), [items]);

  // Stats calculation
  const portfolioStats = useMemo(() => (ownedItems.length > 0 ? getLocalBinderStats(ownedItems) : null), [ownedItems]);
  const soldStats = useMemo(() => (soldItems.length > 0 ? getSoldStats(soldItems) : null), [soldItems]);

  // Calculate benchmark in active soldCurrency for outlier warning
  const suggestedBenchmark = useMemo(() => {
    if (!sellingItem?.card) return null;
    const c = sellingItem.card;
    if (c.yuyuPrice) {
      return soldCurrency === 'JPY'
        ? c.yuyuPrice
        : Math.round((c.yuyuPrice / 152) * (soldCurrency === 'PHP' ? 57.5 : 1));
    }
    if (c.marketPrice) {
      return Math.round(c.marketPrice * (soldCurrency === 'PHP' ? 57.5 : soldCurrency === 'JPY' ? 152 : 1));
    }
    return null;
  }, [sellingItem, soldCurrency]);

  const isOutlierPrice = useMemo(() => {
    const num = parseFloat(soldPrice);
    if (!num || isNaN(num) || !suggestedBenchmark || suggestedBenchmark <= 0) return false;
    return num > suggestedBenchmark * 3.0 || num < suggestedBenchmark * 0.2;
  }, [soldPrice, suggestedBenchmark]);

  async function handleDelete(id: string, cardName: string) {
    if (!confirm(`Remove ${cardName} from your collection?`)) return;
    removeCardFromLocalBinder(id, user?.tag || null);
    loadCollection();
    showToast(`Removed ${cardName} from binder.`);
  }

  // Open "Mark as Sold" modal
  function handleOpenSellModal(item: UserCardRecord) {
    setSellingItem(item);
    setSellStep('form');
    // Pre-fill suggested market price if available
    const initialPrice = item.card.yuyuPrice
      ? soldCurrency === 'JPY'
        ? item.card.yuyuPrice.toString()
        : Math.round((item.card.yuyuPrice / 152) * (soldCurrency === 'PHP' ? 57.5 : 1)).toString()
      : item.card.marketPrice
      ? Math.round(item.card.marketPrice * (soldCurrency === 'PHP' ? 57.5 : soldCurrency === 'JPY' ? 152 : 1)).toString()
      : '';
    setSoldPrice(initialPrice);
    setSoldQuantity(1);
    setSoldDate(new Date().toISOString().slice(0, 10));
    setBuyerSource('');
    setIsFriendSale(false);
    setSelectedFriendTag('');
    setSoldNotes(item.notes || '');
    setIsPublicSale(true);
    setSellError(null);
  }

  // Validate and advance to Confirmation Step
  function handleProceedToConfirm(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = parseFloat(soldPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setSellError('Please enter a valid sold price greater than zero.');
      return;
    }
    if (!soldDate) {
      setSellError('Please select a valid sold date.');
      return;
    }
    if (isFriendSale && !selectedFriendTag) {
      setSellError('Please select or specify the friend tag you sold this card to.');
      return;
    }
    setSellError(null);
    setSellStep('confirm');
  }

  // Confirm Sale submission
  function handleConfirmSale() {
    if (!sellingItem) return;
    const priceNum = parseFloat(soldPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    markCardAsSold(
      sellingItem.id,
      {
        soldPrice: priceNum,
        soldCurrency,
        soldDate,
        quantity: soldQuantity,
        isPublic: isPublicSale,
        buyerSource: isFriendSale ? 'Sold to Friend' : (buyerSource.trim() || undefined),
        buyerUserTag: isFriendSale && selectedFriendTag ? selectedFriendTag : undefined,
        isOutlier: isOutlierPrice,
        notes: soldNotes.trim() || undefined,
      },
      user?.tag || null
    );

    loadCollection();
    setActiveTab('sold');
    const cardTitle = sellingItem.card?.name || sellingItem.cardId;
    setSellingItem(null);
    showToast(`Marked ${cardTitle} as sold for ${soldCurrency === 'PHP' ? '₱' : soldCurrency === 'JPY' ? '¥' : '$'}${priceNum.toLocaleString()}!`);
  }

  // Confirm a trade from a friend with 1 click
  async function handleConfirmPendingTrade(sale: CloudSaleRecord) {
    if (!user?.tag) return;
    const currSymbol = sale.soldCurrency === 'PHP' ? '₱' : sale.soldCurrency === 'JPY' ? '¥' : '$';
    if (!confirm(`Confirm trade of ${sale.cardName || sale.cardId} for ${currSymbol}${sale.soldPrice.toLocaleString()}? This will verify the trade and award a Verified Mutual Trade badge.`)) return;

    await confirmMutualTrade(sale.id, user.tag);
    setPendingTrades((prev) => prev.filter((p) => p.id !== sale.id));
    showToast(`Verified trade for ${sale.cardName || sale.cardId}! Verified badge awarded.`);
    loadCollection();
  }

  // Confirm Undo Sale
  function handleConfirmUndoSale() {
    if (!undoingItem) return;
    const cardTitle = undoingItem.card?.name || undoingItem.cardId;
    undoCardSale(undoingItem.id, user?.tag || null);
    setUndoingItem(null);
    loadCollection();
    showToast(`Reversed sale: ${cardTitle} returned to your active collection.`);
  }

  // Open Edit Sale modal
  function handleOpenEditModal(item: UserCardRecord) {
    setEditingItem(item);
    setEditPrice(item.soldPrice ? item.soldPrice.toString() : '');
    setEditCurrency((item.soldCurrency as any) || 'PHP');
    setEditDate(item.soldDate || new Date().toISOString().slice(0, 10));
    setEditPublic(item.isPublicSale !== false);
    setEditNotes(item.buyerNotes || '');
  }

  // Confirm Edit Sale
  function handleConfirmEditSale(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid sold price.');
      return;
    }

    editCardSale(
      editingItem.id,
      {
        soldPrice: priceNum,
        soldCurrency: editCurrency,
        soldDate: editDate,
        isPublic: editPublic,
        notes: editNotes.trim() || undefined,
      },
      user?.tag || null
    );

    setEditingItem(null);
    loadCollection();
    showToast(`Updated sale record for ${editingItem.card?.name || editingItem.cardId}.`);
  }

  // Filter items based on active tab & search query
  const displayedItems = useMemo(() => {
    const list = activeTab === 'collection' ? ownedItems : soldItems;
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter((it) => {
      const formattedId = formatCard(it.card.id).displayId.toLowerCase();
      return (
        it.card.name.toLowerCase().includes(q) ||
        it.card.id.toLowerCase().includes(q) ||
        formattedId.includes(q) ||
        (it.card.pack?.code || '').toLowerCase().includes(q)
      );
    });
  }, [activeTab, ownedItems, soldItems, searchTerm, formatCard]);

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-7xl mx-auto space-y-3 pb-32 sm:pb-24 font-sans select-none px-2 sm:px-3">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#282d3e] border border-[#3b4159] text-white text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 1. Sleek Single-Line Header Bar */}
      <header className="sticky top-0 z-30 bg-[#1e202a]/95 backdrop-blur-md border-b border-[#2d3140]/60 -mx-2 sm:-mx-3 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="p-1 text-white hover:text-gray-300 transition-transform active:scale-90"
            title="Go to Home"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            Collection &amp; Sales
          </h1>
        </div>

        {/* Right Actions: Currency, View Toggle, Add Cards */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Currency Switcher */}
          <button
            type="button"
            onClick={openSettings}
            title={`Active Currency: ${currency === 'source' ? 'Source Currency' : currency}`}
            className="px-2 py-1 rounded-xl bg-[#242836] hover:bg-[#2c3142] border border-[#343a4c] text-xs font-bold text-[#f59e0b] flex items-center gap-1 transition cursor-pointer shadow-sm"
          >
            <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>{currency === 'source' ? '¥ JPY' : currency}</span>
            <SettingsIcon className="w-2.5 h-2.5 text-gray-500" />
          </button>

          {/* List / Grid Toggle */}
          <div className="flex items-center bg-[#1e212c] p-0.5 rounded-xl border border-[#343a4c]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list' ? 'bg-[#3b82f6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#3b82f6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Cards Shortcut */}
          <Link
            href="/cards"
            className="px-2.5 py-1.5 rounded-xl bg-[#e76d78] text-white font-bold text-xs hover:bg-[#d45b66] transition flex items-center gap-1 cursor-pointer shadow-sm"
            title="Browse & Add Cards"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Link>
        </div>
      </header>

      {/* Account Identity Bar or Guest Mode Alert Banner */}
      {user ? (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#202433] border border-[#343a4c] shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-purple-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white truncate">{user.name}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {user.crew}
                </span>
              </div>
              <div className="font-mono text-[10px] text-gray-400 flex items-center gap-1 truncate">
                <span>Tag: <strong className="text-amber-400 font-bold">{user.tag}</strong></span>
                <span className="text-gray-500">&bull;</span>
                <span className="truncate">{user.rank}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setAccountModalTab('login');
                setShowAccountModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#292e40] hover:bg-[#343a50] border border-[#3b4258] text-[11px] font-bold text-gray-300 hover:text-white transition cursor-pointer"
              title="Switch Account"
            >
              Switch
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to log out of your account?')) {
                  logout();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[11px] font-bold text-red-400 hover:text-red-300 transition cursor-pointer flex items-center gap-1"
              title="Log Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#202433] via-[#24283b] to-[#1e2230] border border-amber-500/35 shadow-md space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl flex-shrink-0">
                👤
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">Guest Mode (Logged Out)</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Not Synced
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  You are currently logged out. Cards and sales stay local to this device. Sign in to sync your sales with community market data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setAccountModalTab('login');
                setShowAccountModal(true);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-black transition text-center shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountModalTab('register');
                setShowAccountModal(true);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#f45d6a] hover:bg-[#e04f5c] text-white text-xs font-black transition text-center shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Mutual Trade Confirmations Banner */}
      {pendingTrades.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#202938] to-[#1c2230] border border-emerald-500/40 shadow-md space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white">
                Pending Trade Verifications ({pendingTrades.length})
              </span>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Verified Trades
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            Friends logged a sale to you. Confirm the purchase below to award a <strong>Verified Mutual Trade</strong> badge!
          </p>
          <div className="space-y-2 pt-0.5">
            {pendingTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#161922] border border-[#2d3246] text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-white truncate block">{t.cardName || t.cardId}</span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Price:{' '}
                    <strong className="text-emerald-400 font-bold">
                      {t.soldCurrency === 'PHP' ? '₱' : t.soldCurrency === 'JPY' ? '¥' : '$'}
                      {t.soldPrice.toLocaleString()}
                    </strong>{' '}
                    &bull; {t.soldDate}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirmPendingTrade(t)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1 shadow flex-shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Purchase</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Collection vs Sold Cards Segmented Tab Navigation */}
      <div className="flex items-center p-1 rounded-2xl bg-[#1d202c] border border-[#2e3346] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('collection')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'collection'
              ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FolderHeart className="w-3.5 h-3.5 text-rose-400" />
          <span>Collection ({ownedItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sold')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'sold'
              ? 'bg-[#2a2e40] text-white shadow-md border border-[#3b4159]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sold Cards ({soldItems.length})</span>
          {soldItems.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {soldItems.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Stats Summary Bar based on active tab */}
      {activeTab === 'collection' && portfolioStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 pt-1">
          {/* Total Estimated Value */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#242836] border border-[#343a4c] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              Portfolio Value
            </span>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 truncate mt-0.5">
              {formatPrice(portfolioStats.totalEstimatedValue, { source: 'yuyutei', lang: 'jp' }).full}
            </div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              Cost: {formatPrice(portfolioStats.totalInvested, { source: 'yuyutei', lang: 'jp' }).full}
              {portfolioStats.profitPercentage !== 0 && (
                <span className={`ml-1 font-bold ${portfolioStats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({portfolioStats.netProfit >= 0 ? '+' : ''}{portfolioStats.profitPercentage.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>

          {/* Cards Count */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#242836] border border-[#343a4c] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              Cards Owned
            </span>
            <div className="text-lg sm:text-2xl font-black text-white truncate mt-0.5">
              {portfolioStats.totalCardsCount}
              <span className="text-xs sm:text-sm font-semibold text-gray-400 ml-1.5">
                ({portfolioStats.uniqueCardsCount} unique)
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 truncate mt-0.5">
              <span>{portfolioStats.foilsCount} Foils</span>
              <span>&bull;</span>
              <span className="text-[#3b82f6] font-bold">🇯🇵 Japanese</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sold' && soldStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 pt-1">
          {/* Total Revenue */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#242836] border border-emerald-500/20 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              Total Sales Revenue
            </span>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 truncate mt-0.5">
              {soldStats.totalRevenuePHP > 0
                ? `₱${Math.round(soldStats.totalRevenuePHP).toLocaleString()}`
                : soldStats.totalRevenueJPY > 0
                ? `¥${Math.round(soldStats.totalRevenueJPY).toLocaleString()}`
                : `$${soldStats.totalRevenueUSD.toLocaleString()}`}
            </div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              Across {soldStats.totalSalesCount} confirmed sale{soldStats.totalSalesCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Sold Copies Count */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#242836] border border-[#343a4c] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              Cards Liquidated
            </span>
            <div className="text-lg sm:text-2xl font-black text-white truncate mt-0.5">
              {soldStats.totalSoldCardsCount} Copies
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 truncate mt-0.5">
              <span className="text-emerald-400 font-bold">Realized History</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={activeTab === 'collection' ? 'Search your binder (e.g. Luffy, OP05, ST01)...' : 'Search sold cards history...'}
          className="w-full bg-[#1e212c] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition shadow-inner"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5. Content Area */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-xs">Loading binder cards...</div>
      ) : displayedItems.length === 0 ? (
        <div className="py-16 text-center bg-[#242836]/60 rounded-3xl border border-[#343a4c] my-4 px-4 space-y-3">
          {activeTab === 'collection' ? (
            <>
              <FolderHeart className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No collection cards found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {searchTerm ? `No cards match "${searchTerm}"` : 'Your collection is empty. Start adding cards from the database!'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link
                  href="/cards"
                  className="px-4 py-2 rounded-xl bg-[#e76d78] text-white text-xs font-bold hover:bg-[#d45b66] transition inline-block shadow cursor-pointer"
                >
                  Browse Cards Catalog
                </Link>
                <label className="px-4 py-2 rounded-xl bg-[#242836] border border-[#343a4c] hover:bg-[#2c3142] text-xs font-bold text-gray-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow">
                  <Upload className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Import Backup</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        const ok = importBinderFromJSON(text);
                        if (ok) loadCollection();
                        else alert('Invalid backup file');
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No sold cards yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                When you sell cards from your collection, tap "Mark as Sold" on any card. Your sales history and community market contributions will appear here.
              </p>
            </>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="space-y-2">
          {displayedItems.map((item) => {
            const card = item.card;
            const currentPrice = card.yuyuPrice || Math.round((card.marketPrice || 1) * 140);
            const cardIdInfo = formatCard(card.id);
            const isSold = item.status === 'SOLD';

            return (
              <div
                key={item.id}
                onClick={() => setActiveCard(card)}
                className={`group relative flex items-center gap-3 p-2.5 sm:p-3 bg-[#242836] hover:bg-[#282d3e] rounded-2xl border ${
                  isSold ? 'border-emerald-500/25' : 'border-[#343a4c]'
                } hover:border-[#3b82f6]/50 transition-all cursor-pointer shadow-sm`}
              >
                {/* Card Artwork Thumbnail */}
                <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[#1a1c25] rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative shadow-inner">
                  <img
                    src={getSafeCardImageUrl(card.imageUrl)}
                    alt={card.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {item.quantity > 1 && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/85 backdrop-blur-sm text-[9px] font-black text-white border border-white/20">
                      x{item.quantity}
                    </span>
                  )}
                </div>

                {/* Card Details (Center) */}
                <div className="flex-1 min-w-0 pr-1">
                  {/* Badges Row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-extrabold text-[#3b82f6]">
                      {cardIdInfo.displayId}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {card.rarity}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-semibold border border-white/5">
                      {item.condition}
                    </span>
                    {item.isFoil && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        FOIL
                      </span>
                    )}
                    {isSold && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40 uppercase">
                        SOLD
                      </span>
                    )}
                    {isSold && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e2230] text-gray-400 flex items-center gap-0.5 border border-white/5">
                        {item.isPublicSale !== false ? <Globe className="w-2.5 h-2.5 text-cyan-400" /> : <Lock className="w-2.5 h-2.5 text-gray-500" />}
                        <span>{item.isPublicSale !== false ? 'Community' : 'Private'}</span>
                      </span>
                    )}
                  </div>

                  {/* Card Name */}
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate mt-1 group-hover:text-[#3b82f6] transition leading-snug">
                    {card.name}
                  </h4>

                  {/* Secondary info */}
                  {isSold ? (
                    <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Sold: {item.soldDate}</span>
                      {item.buyerSource && <span>&bull; via {item.buyerSource}</span>}
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{card.pack?.code || 'SET'}</span>
                      <span>&bull;</span>
                      <span>Market: {formatYuyuPrice(currentPrice).full} / ea</span>
                    </div>
                  )}
                </div>

                {/* Right Actions & Pricing */}
                <div className="text-right flex-shrink-0 flex flex-col items-end justify-between self-stretch py-0.5">
                  <div>
                    {isSold ? (
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Sold Price</span>
                        <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                          {item.soldCurrency === 'PHP' ? '₱' : item.soldCurrency === 'JPY' ? '¥' : '$'}
                          {item.soldPrice ? item.soldPrice.toLocaleString() : '0'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm font-black text-emerald-400">
                        {formatYuyuPrice(currentPrice * item.quantity).full}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1 mt-1">
                    {isSold ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-gray-300 hover:text-white rounded-lg bg-[#1a1c25] hover:bg-[#2d3244] border border-[#3b4159] transition cursor-pointer flex items-center gap-1"
                          title="Edit Sale Details"
                        >
                          <Pencil className="w-3 h-3 text-cyan-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUndoingItem(item);
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-amber-300 hover:text-white rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer flex items-center gap-1"
                          title="Undo Sale and return to Collection"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSellModal(item);
                          }}
                          className="px-2.5 py-1 text-[11px] font-black text-emerald-300 hover:text-white rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/35 transition cursor-pointer flex items-center gap-1"
                          title="Mark Card as Sold"
                        >
                          <Tag className="w-3 h-3" />
                          <span>Mark Sold</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id, card.name);
                          }}
                          className="p-1 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                          title="Remove from collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID BINDER VIEW */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5">
          {displayedItems.map((item) => {
            const card = item.card;
            const currentPrice = card.yuyuPrice || Math.round((card.marketPrice || 1) * 140);
            const itemValue = currentPrice * item.quantity;
            const isSold = item.status === 'SOLD';

            return (
              <div
                key={item.id}
                onClick={() => setActiveCard(card)}
                className={`group relative aspect-[2.5/3.5] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.97] bg-[#1a1c25] border ${
                  isSold ? 'border-emerald-500/40' : 'border-[#343a4c]/50'
                } hover:border-[#3b82f6]`}
              >
                {/* Pure Card Artwork */}
                <img
                  src={getSafeCardImageUrl(card.imageUrl)}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Top Badge: SOLD / Quantity */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  {isSold ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white font-black text-[8px] uppercase tracking-wider shadow">
                      SOLD
                    </span>
                  ) : item.quantity > 1 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-white font-black text-[9px] border border-white/20">
                      x{item.quantity}
                    </span>
                  ) : null}
                </div>

                {/* Bottom Price Tag */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                  <div className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-white/10 shadow-sm">
                    {isSold
                      ? `${item.soldCurrency === 'PHP' ? '₱' : item.soldCurrency === 'JPY' ? '¥' : '$'}${item.soldPrice?.toLocaleString() || '0'}`
                      : formatYuyuPrice(itemValue).full}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 6. MARK AS SOLD MODAL (Step 1: Form & Step 2: Confirm Summary) */}
      {/* ────────────────────────────────────────────────────────────── */}
      {sellingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSellingItem(null)} />
          <div className="relative w-full max-w-md bg-[#242836] border border-[#3b4156] rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#343a4c] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  {sellStep === 'form' ? 'Mark Card as Sold' : 'Confirm Sale Summary'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSellingItem(null)}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card Preview Strip */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1b1e2a] border border-[#343a4c]">
              <div className="w-12 h-16 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
                <img
                  src={getSafeCardImageUrl(sellingItem.card.imageUrl)}
                  alt={sellingItem.card.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-[#3b82f6]">
                  {formatCard(sellingItem.card.id).displayId}
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm truncate leading-tight">
                  {sellingItem.card.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                  <span className="text-amber-400 font-bold">{sellingItem.card.rarity}</span>
                  <span>&bull;</span>
                  <span>{sellingItem.condition}</span>
                  {sellingItem.isFoil && <span>&bull; FOIL</span>}
                </div>
              </div>
            </div>

            {sellStep === 'form' ? (
              /* STEP 1: INPUT FORM */
              <form onSubmit={handleProceedToConfirm} className="space-y-3.5">
                {sellError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{sellError}</span>
                  </div>
                )}

                {/* Sold Price & Currency */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Sold Price <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={soldCurrency}
                      onChange={(e) => setSoldCurrency(e.target.value as any)}
                      className="px-3 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="PHP">₱ PHP</option>
                      <option value="USD">$ USD</option>
                      <option value="JPY">¥ JPY</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={soldPrice}
                      onChange={(e) => setSoldPrice(e.target.value)}
                      placeholder="e.g. 18500"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white font-black text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {isOutlierPrice && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-[11px] text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Market Benchmark Alert</span>
                        This price deviates significantly from the current market benchmark (~{soldCurrency === 'PHP' ? '₱' : soldCurrency === 'JPY' ? '¥' : '$'}{suggestedBenchmark?.toLocaleString()}). It will be marked with an <strong className="text-amber-200">Outlier tag</strong> to protect community statistics.
                      </div>
                    </div>
                  )}
                </div>

                {/* Sold Date */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Sold Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quantity if > 1 */}
                {sellingItem.quantity > 1 && (
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Quantity Sold (You own {sellingItem.quantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={sellingItem.quantity}
                      value={soldQuantity}
                      onChange={(e) => setSoldQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Buyer / Marketplace & Friend Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Buyer / Marketplace Channel
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {[
                      { id: 'friend', label: '👥 Friend on App', isFriend: true },
                      { id: 'fb', label: '💬 FB / Local Shop', isFriend: false, val: 'Facebook / LGS' },
                      { id: 'online', label: '📦 Shopee / Online', isFriend: false, val: 'Shopee / Online' },
                      { id: 'tourney', label: '🏆 Tournament / Event', isFriend: false, val: 'Tournament / Event' },
                    ].map((ch) => {
                      const isActive = ch.isFriend ? isFriendSale : (!isFriendSale && buyerSource === ch.val);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            if (ch.isFriend) {
                              setIsFriendSale(true);
                              setBuyerSource('Sold to Friend');
                            } else {
                              setIsFriendSale(false);
                              setSelectedFriendTag('');
                              setBuyerSource(ch.val || '');
                            }
                          }}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isActive
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                              : 'bg-[#1b1e2a] border-[#343a4c] text-gray-400 hover:text-white hover:border-gray-500'
                          }`}
                        >
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>

                  {isFriendSale ? (
                    <div className="p-3 rounded-2xl bg-[#1d2232] border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Select Friend to Confirm Trade</span>
                        </span>
                        <span className="text-[10px] text-gray-400">Enables Verified Badge</span>
                      </div>
                      {friendsList.length > 0 ? (
                        <select
                          value={selectedFriendTag}
                          onChange={(e) => setSelectedFriendTag(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-[#343a4c] text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Choose from your Friends --</option>
                          {friendsList.map((f) => (
                            <option key={f.tag} value={f.tag}>
                              {f.username} (@{f.tag})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedFriendTag}
                          onChange={(e) => setSelectedFriendTag(e.target.value)}
                          placeholder="Enter your friend's user tag (e.g. luffy_01)"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-[#343a4c] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      )}
                      <p className="text-[11px] text-blue-300/80 leading-snug">
                        Your friend will see a 1-click confirmation request in their collection. Once confirmed, this trade gets the 🛡️ <strong>Verified Mutual Trade</strong> badge!
                      </p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={buyerSource}
                      onChange={(e) => setBuyerSource(e.target.value)}
                      placeholder="e.g. Local Card Shop, Facebook Group, Meetup (Optional)"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                {/* Community Market Data Sharing Toggle */}
                <div className="p-3 rounded-2xl bg-[#1d2232] border border-[#343a4c] space-y-1.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Share with Community Market Data</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isPublicSale}
                      onChange={(e) => setIsPublicSale(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Helps other collectors see real recent transaction prices on the card's page. Contributes to verified market pricing while keeping your identity private.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSellingItem(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-gray-300 font-bold text-xs hover:bg-[#282d3e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer"
                  >
                    Review Summary &rarr;
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: CONFIRMATION SUMMARY */
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#1b1e2a] border border-[#343a4c] p-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Card</span>
                    <span className="font-bold text-white text-right">{sellingItem.card.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Exact Variant</span>
                    <span className="font-mono font-bold text-[#3b82f6]">
                      {formatCard(sellingItem.card.id).variantLabel || 'Base Art'} ({sellingItem.card.id})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Condition</span>
                    <span className="font-bold text-white">{sellingItem.condition} {sellingItem.isFoil ? '(FOIL)' : ''}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Sold Price</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {soldCurrency === 'PHP' ? '₱' : soldCurrency === 'JPY' ? '¥' : '$'}{parseFloat(soldPrice).toLocaleString()}
                      </span>
                      {isOutlierPrice && (
                        <span className="block text-[10px] text-amber-400 font-bold mt-0.5">
                          ⚠️ Flagged as Market Outlier
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Sold Date</span>
                    <span className="font-bold text-white">{soldDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Buyer / Channel</span>
                    <div className="text-right">
                      <span className="font-bold text-white block">
                        {isFriendSale ? `Sold to Friend (@${selectedFriendTag})` : (buyerSource || 'Unspecified')}
                      </span>
                      {isFriendSale && (
                        <span className="text-[10px] text-blue-400 font-bold flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Mutual Verification Pending</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Community Reference</span>
                    <span className={`font-bold flex items-center gap-1 ${isPublicSale ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {isPublicSale ? <Globe className="w-3 h-3 text-cyan-400" /> : <Lock className="w-3 h-3" />}
                      <span>{isPublicSale ? 'Enabled (Public Data)' : 'Disabled (Private)'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSellStep('form')}
                    className="flex-1 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-gray-300 font-bold text-xs hover:bg-[#282d3e]"
                  >
                    Back / Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSale}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Sale</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 7. UNDO SALE CONFIRMATION MODAL                                */}
      {/* ────────────────────────────────────────────────────────────── */}
      {undoingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setUndoingItem(null)} />
          <div className="relative w-full max-w-sm bg-[#242836] border border-[#3b4156] rounded-3xl p-5 shadow-2xl z-10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Undo2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Undo this card sale?</h3>
              <p className="text-xs text-gray-400 mt-1">
                <strong>{undoingItem.card.name}</strong> will return to your active collection, and the transaction will be removed from community market records.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUndoingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-gray-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUndoSale}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
              >
                Yes, Undo Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 8. EDIT SALE MODAL                                             */}
      {/* ────────────────────────────────────────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setEditingItem(null)} />
          <div className="relative w-full max-w-sm bg-[#242836] border border-[#3b4156] rounded-3xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#343a4c] pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-cyan-400" />
                <span>Edit Sale Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditSale} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Sold Price</label>
                <div className="flex gap-2">
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white text-xs font-bold"
                  >
                    <option value="PHP">₱ PHP</option>
                    <option value="USD">$ USD</option>
                    <option value="JPY">¥ JPY</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Sold Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-white text-xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#1d2232] border border-[#343a4c] flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Public Community Reference</span>
                </span>
                <input
                  type="checkbox"
                  checked={editPublic}
                  onChange={(e) => setEditPublic(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-xl bg-[#1b1e2a] border border-[#343a4c] text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {activeCard && (
        <div className="fixed inset-0 z-50 bg-[#181a22] overflow-y-auto sm:bg-black/85 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl min-h-screen sm:min-h-0 sm:my-auto">
            <CardDetailView
              card={activeCard}
              initialLanguage="jp"
              onBack={() => setActiveCard(null)}
              onSelectCard={(selected) => setActiveCard(selected)}
            />
          </div>
        </div>
      )}

      {/* Account Modal for Sign In / Registration */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        defaultTab={accountModalTab}
      />
    </div>
  );
}
