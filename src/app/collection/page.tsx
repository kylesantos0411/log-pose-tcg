'use client';

import { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { getSafeCardImageUrl } from '@/lib/card-image';
import { useSettings } from '@/context/SettingsContext';
import { CardDetailView } from '@/components/CardDetailView';
import { AccountModal } from '@/components/AccountModal';
import { 
  getLocalBinder, 
  removeCardFromLocalBinder, 
  getLocalBinderStats, 
  exportBinderToJSON,
  importBinderFromJSON,
  saveLocalBinder,
  LocalUserCard 
} from '@/lib/user-collection';

interface UserCardRecord {
  id: string;
  quantity: number;
  condition: string;
  isFoil: boolean;
  language?: string;
  purchasePrice: number | null;
  notes: string | null;
  card: {
    id: string;
    name: string;
    category: string;
    colors: string;
    cost: number | null;
    power: number | null;
    rarity: string;
    imageUrl: string | null;
    marketPrice: number | null;
    yuyuPrice?: number | null;
    pack?: {
      code: string;
      name: string;
    };
  };
}

interface Stats {
  totalCardsCount: number;
  uniqueCardsCount: number;
  totalEstimatedValue: number;
  totalInvested: number;
  netProfit: number;
  profitPercentage: number;
  conditionsCount: Record<string, number>;
  foilsCount: number;
  enCount?: number;
  jpCount?: number;
}

export default function CollectionPage() {
  const { currency, formatPrice, formatYuyuPrice, openSettings, formatCard, user, logout } = useSettings();
  const [items, setItems] = useState<UserCardRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'register' | 'login'>('login');

  useEffect(() => {
    loadCollection();

    const handleUpdate = () => {
      loadCollection();
    };

    window.addEventListener('logpose_collection_updated', handleUpdate);
    window.addEventListener('logpose_auth_changed', handleUpdate);
    return () => {
      window.removeEventListener('logpose_collection_updated', handleUpdate);
      window.removeEventListener('logpose_auth_changed', handleUpdate);
    };
  }, [user?.tag]);

  async function loadCollection() {
    setLoading(true);
    try {
      const local = getLocalBinder(user?.tag || null);
      setItems(local as any);
      setStats(local.length > 0 ? getLocalBinderStats(local) : null);
    } catch (e) {
      console.error('Error loading collection:', e);
      setItems([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, cardName: string) {
    if (!confirm(`Remove ${cardName} from your collection?`)) return;

    removeCardFromLocalBinder(id, user?.tag || null);
    loadCollection();
  }

  const filteredItems = items.filter((it) => {
    const q = searchTerm.toLowerCase().trim();
    const formattedId = formatCard(it.card.id).displayId.toLowerCase();
    return (
      it.card.name.toLowerCase().includes(q) ||
      it.card.id.toLowerCase().includes(q) ||
      formattedId.includes(q) ||
      (it.card.pack?.code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto space-y-3 pb-32 sm:pb-24 font-sans select-none px-2 sm:px-3">
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
            Collection
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
                viewMode === 'list'
                  ? 'bg-[#3b82f6] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#3b82f6] text-white shadow'
                  : 'text-gray-400 hover:text-white'
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
                  You are currently logged out. Cards added in guest mode stay local to this browser. Sign in or create an account to access your permanent collector binder.
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

      {/* 2. Compact Portfolio Stats Summary (Never cut off) */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Total Estimated Value */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#242836] border border-[#343a4c] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              Portfolio Value
            </span>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 truncate mt-0.5">
              {formatPrice(stats.totalEstimatedValue, { source: 'yuyutei', lang: 'jp' }).full}
            </div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              Cost: {formatPrice(stats.totalInvested, { source: 'yuyutei', lang: 'jp' }).full}
              {stats.profitPercentage !== 0 && (
                <span className={`ml-1 font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({stats.netProfit >= 0 ? '+' : ''}{stats.profitPercentage.toFixed(0)}%)
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
              {stats.totalCardsCount}
              <span className="text-xs sm:text-sm font-semibold text-gray-400 ml-1.5">
                ({stats.uniqueCardsCount} unique)
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 truncate mt-0.5">
              <span>{stats.foilsCount} Foils</span>
              <span>&bull;</span>
              <span className="text-[#3b82f6] font-bold">🇯🇵 Japanese</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search your binder (e.g. Luffy, OP05, ST01)..."
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

      {/* 4. Content: Empty State, Mobile Card List, or Grid Binder */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-xs">Loading binder cards...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-[#242836]/60 rounded-3xl border border-[#343a4c] my-4 px-4">
          <FolderHeart className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No cards found</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            {searchTerm ? `No cards match "${searchTerm}"` : 'Your collection is empty. Start adding cards from the database!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
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
                    if (ok) {
                      loadCollection();
                    } else {
                      alert('Invalid backup file');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* RESPONSIVE MOBILE-OPTIMIZED CARD LIST (NO CUT-OFF ELEMENTS) */
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const card = item.card;
            const currentPrice = card.yuyuPrice || Math.round((card.marketPrice || 1) * 140);
            const buyPrice = item.purchasePrice !== null && item.purchasePrice !== undefined
              ? item.purchasePrice
              : currentPrice;
            const itemValue = currentPrice * item.quantity;
            const profit = (currentPrice - buyPrice) * item.quantity;
            const cardIdInfo = formatCard(card.id);

            return (
              <div
                key={item.id}
                onClick={() => setActiveCard(card)}
                className="group relative flex items-center gap-3 p-2.5 sm:p-3 bg-[#242836] hover:bg-[#282d3e] rounded-2xl border border-[#343a4c] hover:border-[#3b82f6]/50 transition-all cursor-pointer shadow-sm"
              >
                {/* Card Artwork Thumbnail */}
                <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[#1a1c25] rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative shadow-inner">
                  <img
                    src={getSafeCardImageUrl(card.imageUrl)}
                    alt={card.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const baseId = card.id.split('_')[0];
                      const fallback = `/api/card-image?url=${encodeURIComponent(`https://onepiece-cardgame.com/images/cardlist/card/${baseId}.png`)}`;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
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
                  </div>

                  {/* Card Name */}
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate mt-1 group-hover:text-[#3b82f6] transition leading-snug">
                    {card.name}
                  </h4>

                  {/* Set & Price Details */}
                  <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{card.pack?.code || 'SET'}</span>
                    <span>&bull;</span>
                    <span>{formatYuyuPrice(currentPrice).full} / ea</span>
                  </div>
                </div>

                {/* Price & Delete Action (Right) */}
                <div className="text-right flex-shrink-0 flex flex-col items-end justify-between self-stretch py-0.5">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-emerald-400">
                      {formatYuyuPrice(itemValue).full}
                    </div>
                    {profit !== 0 && (
                      <div className={`text-[9px] sm:text-[10px] font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{formatYuyuPrice(profit).full}
                      </div>
                    )}
                  </div>

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
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID BINDER VIEW (Visual 3-column binder matching /cards) */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5">
          {filteredItems.map((item) => {
            const card = item.card;
            const currentPrice = card.yuyuPrice || Math.round((card.marketPrice || 1) * 140);
            const itemValue = currentPrice * item.quantity;

            return (
              <div
                key={item.id}
                onClick={() => setActiveCard(card)}
                className="group relative aspect-[2.5/3.5] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.97] bg-[#1a1c25] border border-[#343a4c]/50 hover:border-[#3b82f6]"
              >
                {/* Pure Card Artwork */}
                <img
                  src={getSafeCardImageUrl(card.imageUrl)}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const baseId = card.id.split('_')[0];
                    const fallback = `/api/card-image?url=${encodeURIComponent(`https://onepiece-cardgame.com/images/cardlist/card/${baseId}.png`)}`;
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />

                {/* Bottom-Left Price Tag */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-white/10 shadow-sm pointer-events-none">
                  {formatYuyuPrice(itemValue).full}
                </div>

                {/* Bottom-Right Quantity Badge */}
                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-black backdrop-blur-sm border border-emerald-400 shadow">
                  x{item.quantity}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Detail Modal */}
      {activeCard && (
        <div className="fixed inset-0 z-50 bg-[#181a22] overflow-y-auto sm:bg-black/85 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:my-auto">
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
