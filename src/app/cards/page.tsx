'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search, 
  Layers, 
  Plus, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  PenTool, 
  Coins, 
  SlidersHorizontal,
  Settings as SettingsIcon,
  Flame,
  Calendar,
} from 'lucide-react';
import { getSafeCardImageUrl } from '@/lib/card-image';
import { ARTIST_PROFILES } from '@/lib/artist-data';
import { CardDetailView } from '@/components/CardDetailView';
import { useSettings } from '@/context/SettingsContext';
import { addCardToLocalBinder } from '@/lib/user-collection';

interface CardItem {
  id: string;
  name: string;
  category: string;
  colors: string;
  cost: number | null;
  power: number | null;
  counter: number | null;
  rarity: string;
  attributes: string | null;
  types: string | null;
  effect: string | null;
  trigger: string | null;
  imageUrl: string | null;
  marketPrice: number | null;
  yuyuPrice?: number | null;
  promoSource?: string | null;
  hasJpPrint?: boolean;
  releaseDate?: string | null;
  cardNumber?: string | null;
  card_number?: string | null;
  printedSetCode?: string | null;
  printed_set_code?: string | null;
  originalSet?: string | null;
  original_set?: string | null;
  yuyuteiSet?: string | null;
  yuyutei_set?: string | null;
  displaySet?: string | null;
  display_set?: string | null;
  printingType?: string | null;
  printing_type?: string | null;
  artistName?: string | null;
  artist_name?: string | null;
  artistSource?: string | null;
  artist_source?: string | null;
  artistSourceUrl?: string | null;
  artist_source_url?: string | null;
  artistVerificationStatus?: string | null;
  artist_verification_status?: string | null;
  pack?: {
    code: string;
    name: string;
    releaseDate?: string | null;
  };
  userCards?: Array<{
    id: string;
    quantity: number;
    condition: string;
    isFoil: boolean;
  }>;
}

const COLORS = ['All', 'Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
const YUYU_KINDS = [
  { value: 'All', label: 'All Kinds' },
  { value: 'character', label: 'character' },
  { value: 'event', label: 'event' },
  { value: 'stage', label: 'stage' },
  { value: 'Don!! Card', label: 'Don!! Card' },
  { value: 'leader', label: 'leader' },
];
const YUYU_RARITIES = [
  'All',
  'P-SEC',
  'SEC',
  'P-SR',
  'SR',
  'PR',
  'R',
  'P-UC',
  'UC',
  'PC',
  'C',
  'PL',
  'L',
  'SP',
  'TR',
  'PP',
  'P',
  '-',
];

export default function CardsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading cards...</div>}>
      <CardsContent />
    </Suspense>
  );
}

function CardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, formatYuyuPrice, openSettings, formatCard, user } = useSettings();
  
  const sortParam = searchParams.get('sort') || '';
  const initialQuery = searchParams.get('q') || '';
  const initialSet = searchParams.get('set') || 'All';
  const initialCategory = searchParams.get('category') || 'All';
  const initialRarity = searchParams.get('rarity') || 'All';
  const initialArtist = searchParams.get('artist') || 'All';

  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState(sortParam || 'latest');
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedRarity, setSelectedRarity] = useState(initialRarity);
  const [selectedSet, setSelectedSet] = useState(initialSet);
  const [selectedArtist, setSelectedArtist] = useState(initialArtist);
  const [availableSets, setAvailableSets] = useState<Array<{ id: string; code: string; name: string; cardsCount: number }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);

  // Layout and Filter Tray State
  const [gridCols, setGridCols] = useState<2 | 3>(3);
  const [showFilters, setShowFilters] = useState(false);

  // Add to collection state
  const [addModalCard, setAddModalCard] = useState<CardItem | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addCondition, setAddCondition] = useState('NM');
  const [addIsFoil, setAddIsFoil] = useState(false);
  const [addPrice, setAddPrice] = useState('');
  const [savingCollection, setSavingCollection] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/sets')
      .then((res) => res.json())
      .then((data) => {
        if (data.sets) setAvailableSets(data.sets);
      })
      .catch((e) => console.error('Failed to load sets list', e));
  }, []);

  useEffect(() => {
    const artistParam = searchParams.get('artist') || 'All';
    setSelectedArtist(artistParam);
    const setParam = searchParams.get('set');
    if (setParam) {
      setSelectedSet(setParam);
      setPage(1);
    }
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setPage(1);
    }
    const rarityParam = searchParams.get('rarity');
    if (rarityParam) {
      setSelectedRarity(rarityParam);
      setPage(1);
    }
    const queryParam = searchParams.get('q');
    if (queryParam !== null && queryParam !== undefined) {
      setSearch(queryParam);
      setPage(1);
    }
    const currentSort = searchParams.get('sort');
    if (currentSort) {
      setSortBy(currentSort);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCards();
  }, [search, selectedColor, selectedCategory, selectedRarity, selectedSet, selectedArtist, page, sortBy]);

  async function fetchCards() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: search,
        color: selectedColor,
        category: selectedCategory,
        rarity: selectedRarity,
        set: selectedSet,
        sort: sortBy,
        lang: 'jp',
        page: page.toString(),
        limit: '36',
      });

      if (selectedArtist && selectedArtist !== 'All') {
        params.set('artist', selectedArtist);
      }

      const res = await fetch(`/api/cards?${params.toString()}`);
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!addModalCard) return;

    const parsedPrice = addPrice ? parseFloat(addPrice) : null;
    let purchasePriceUSD = addModalCard.marketPrice;
    if (parsedPrice !== null && !isNaN(parsedPrice)) {
      purchasePriceUSD = parsedPrice / 152;
    }

    setSavingCollection(true);
    try {
      // 1. Always save immediately to local binder (guaranteed offline & multi-user device safety)
      addCardToLocalBinder({
        cardId: addModalCard.id,
        card: {
          id: addModalCard.id,
          name: addModalCard.name,
          category: addModalCard.category,
          colors: addModalCard.colors,
          cost: addModalCard.cost,
          power: addModalCard.power,
          rarity: addModalCard.rarity,
          imageUrl: addModalCard.imageUrl,
          marketPrice: addModalCard.marketPrice,
          yuyuPrice: addModalCard.yuyuPrice,
          pack: addModalCard.pack ? { code: addModalCard.pack.code, name: addModalCard.pack.name } : undefined,
        },
        quantity: addQuantity,
        condition: addCondition,
        isFoil: addIsFoil,
        language: 'jp',
        purchasePrice: purchasePriceUSD,
      }, user?.tag || null);

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setAddModalCard(null);
        fetchCards();
      }, 800);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCollection(false);
    }
  }

  const activeDetailedFilterCount = 
    (selectedColor !== 'All' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedRarity !== 'All' ? 1 : 0) +
    (selectedSet !== 'All' ? 1 : 0) +
    (selectedArtist !== 'All' ? 1 : 0);

  const activeFilterCount = activeDetailedFilterCount + (search.trim() ? 1 : 0);

  const resetFilters = () => {
    setSelectedColor('All');
    setSelectedCategory('All');
    setSelectedRarity('All');
    setSelectedSet('All');
    setSelectedArtist('All');
    setSearch('');
    setPage(1);
  };

  // Header Title Logic
  const isLatestMode = sortBy === 'latest' && !search.trim() && selectedSet === 'All' && selectedArtist === 'All';
  let pageTitle = 'Card Catalog';
  if (isLatestMode) {
    pageTitle = 'Latest Released Cards';
  } else if (selectedArtist !== 'All') {
    pageTitle = selectedArtist;
  } else if (selectedSet !== 'All') {
    pageTitle = `${selectedSet} Cards`;
  } else if (search.trim()) {
    pageTitle = `Search: "${search}"`;
  } else if (sortBy === 'price-desc') {
    pageTitle = 'Most Valuable Cards';
  } else if (sortBy === 'price-asc') {
    pageTitle = 'Budget Cards';
  } else if (sortBy === 'date-asc') {
    pageTitle = 'Oldest Released Cards';
  }

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto pb-16 select-none">
      {/* 1. Sleek Top Bar with Permanent Always-Visible Search Bar */}
      <header className="sticky top-0 z-30 bg-[#1e202a]/95 backdrop-blur-md border-b border-[#2d3140]/60 px-2 sm:px-4 py-2 sm:py-2.5 shadow-sm space-y-2">
        {/* Top Row: Navigation, Page Title, and Quick Actions */}
        <div className="flex items-center justify-between">
          {/* Left: Back Arrow & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="p-1 text-white hover:text-gray-300 transition-transform active:scale-90"
              title="Go to Home"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {pageTitle}
                </h1>
                {isLatestMode && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/40 shrink-0 flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    NEWEST FIRST
                  </span>
                )}
              </div>
              {isLatestMode && (
                <p className="text-[10px] text-amber-300 font-semibold tracking-wide">
                  Sorted by release date: OP-17, OP-16, OP-15 &amp; newest sets first (OP-18 upcoming)
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions (Collection, Grid View Toggle) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Diamond / Collection Icon */}
            <Link
              href="/collection"
              className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
              title="Collection"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
                <path d="M12 21L8 9" />
                <path d="M12 21l4-12" />
                <path d="M2 9h20" />
                <path d="M7 3l3 6" />
                <path d="M17 3l-3 6" />
              </svg>
            </Link>

            {/* Grid Layout Toggle Button (▦) */}
            <button
              type="button"
              onClick={() => setGridCols(gridCols === 3 ? 2 : 3)}
              className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
              title={`Toggle between 2 and 3 columns (Current: ${gridCols})`}
            >
              {gridCols === 3 ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: ALWAYS-VISIBLE SEARCH BAR + FILTERS BUTTON */}
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search card or code (e.g. OP05-119, Luffy)..."
              className="w-full bg-[#181a24] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl pl-9.5 pr-8 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none transition shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showFilters || activeDetailedFilterCount > 0
                ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/50 shadow-sm'
                : 'bg-[#181a24] text-gray-300 border-[#343a4c] hover:border-gray-500'
            }`}
            title="Toggle Detailed Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs">Filter</span>
            {activeDetailedFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#e76d78] text-white text-[9px] font-black flex items-center justify-center shadow">
                {activeDetailedFilterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Collapsible Filter Drawer for Advanced Filters (Categories, Rarities, Sets, Colors) */}
      {showFilters && (
        <div className="mx-2 sm:mx-3 mt-2 mb-3 p-3.5 rounded-2xl bg-[#242836] border border-[#343a4c] shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#32384a]">
            <span className="text-xs font-bold text-gray-300">Advanced Filters</span>
            <div className="flex items-center gap-2">
              {activeDetailedFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-[#e76d78] hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
              <button
                type="button"
                onClick={openSettings}
                className="px-2 py-1 rounded-lg bg-[#1e212c] border border-[#343a4c] text-[11px] font-bold text-[#f59e0b] flex items-center gap-1 hover:border-[#f59e0b] transition cursor-pointer"
              >
                <Coins className="w-3 h-3" />
                <span>{currency === 'source' ? '¥ JPY' : currency}</span>
                <SettingsIcon className="w-2.5 h-2.5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                title="Close Filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {/* Sort Order Selector */}
            <select
              value={sortBy}
              onChange={(e) => {
                const s = e.target.value;
                setSortBy(s);
                setPage(1);
                router.replace(`/cards?sort=${s}`);
              }}
              className="bg-[#1e212c] border border-amber-500/40 text-amber-300 font-bold focus:border-[#3b82f6] rounded-xl px-3 py-2 text-xs focus:outline-none transition cursor-pointer"
            >
              <option value="latest">📅 Release Date (Latest First)</option>
              <option value="date-asc">📅 Release Date (Oldest First)</option>
              <option value="price-desc">💰 Price: High to Low</option>
              <option value="price-asc">💰 Price: Low to High</option>
              <option value="id-asc">🔤 Card Number (A-Z)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="bg-[#1e212c] border border-[#32384a] focus:border-[#3b82f6] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none transition cursor-pointer"
            >
              {YUYU_KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>

            <select
              value={selectedRarity}
              onChange={(e) => { setSelectedRarity(e.target.value); setPage(1); }}
              className="bg-[#1e212c] border border-[#32384a] focus:border-[#3b82f6] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Rarities</option>
              {YUYU_RARITIES.slice(1).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={selectedSet}
              onChange={(e) => { setSelectedSet(e.target.value); setPage(1); }}
              className="bg-[#1e212c] border border-[#32384a] focus:border-[#3b82f6] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Sets ({availableSets.length} Sets)</option>
              {availableSets.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedArtist}
              onChange={(e) => { setSelectedArtist(e.target.value); setPage(1); }}
              className="bg-[#1e212c] border border-[#32384a] focus:border-[#3b82f6] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none transition cursor-pointer"
            >
              <option value="All">All Illustrators</option>
              {Object.keys(ARTIST_PROFILES).map((artistName) => (
                <option key={artistName} value={artistName}>
                  {artistName}
                </option>
              ))}
            </select>
          </div>

          {/* Color Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#32384a]">
            <span className="text-[11px] text-gray-400 mr-1 font-medium">Color:</span>
            {COLORS.map((col) => {
              const active = selectedColor === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => { setSelectedColor(col); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[#e76d78] text-white shadow-sm'
                      : 'bg-[#1e212c] text-gray-300 hover:text-white border border-[#32384a]'
                  }`}
                >
                  {col}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Chips (if any filter is selected and drawer is closed) */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-gray-400 flex-shrink-0">Filters:</span>
          {selectedArtist !== 'All' && (
            <span className="px-2 py-0.5 rounded-md bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 font-bold flex-shrink-0 flex items-center gap-1">
              🎨 {selectedArtist}
              <button type="button" onClick={() => setSelectedArtist('All')}>&times;</button>
            </span>
          )}
          {selectedSet !== 'All' && (
            <span className="px-2 py-0.5 rounded-md bg-[#e76d78]/20 text-[#e76d78] border border-[#e76d78]/30 font-bold flex-shrink-0 flex items-center gap-1">
              {selectedSet}
              <button type="button" onClick={() => setSelectedSet('All')}>&times;</button>
            </span>
          )}
          {selectedCategory !== 'All' && (
            <span className="px-2 py-0.5 rounded-md bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30 font-bold flex-shrink-0 flex items-center gap-1">
              {selectedCategory}
              <button type="button" onClick={() => setSelectedCategory('All')}>&times;</button>
            </span>
          )}
          {selectedColor !== 'All' && (
            <span className="px-2 py-0.5 rounded-md bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 font-bold flex-shrink-0 flex items-center gap-1">
              {selectedColor}
              <button type="button" onClick={() => setSelectedColor('All')}>&times;</button>
            </span>
          )}
          {selectedRarity !== 'All' && (
            <span className="px-2 py-0.5 rounded-md bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 font-bold flex-shrink-0 flex items-center gap-1">
              {selectedRarity}
              <button type="button" onClick={() => setSelectedRarity('All')}>&times;</button>
            </span>
          )}
          {search && (
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 border border-white/15 font-bold flex-shrink-0 flex items-center gap-1">
              &ldquo;{search}&rdquo;
              <button type="button" onClick={() => setSearch('')}>&times;</button>
            </span>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="text-[#e76d78] hover:underline font-bold text-[10px] ml-1 flex-shrink-0 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Artist Showcase Header (if filtering by artist) */}
      {selectedArtist !== 'All' && (
        <div className="mx-2 sm:mx-3 my-2 p-3 rounded-2xl bg-[#242836] border border-[#3b82f6]/40 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{selectedArtist}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">Illustrator</span>
              </div>
              <p className="text-[10px] text-gray-400 line-clamp-1">
                {ARTIST_PROFILES[selectedArtist]?.bio || `${totalCount} cards illustrated`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedArtist('All')}
            className="p-1 text-gray-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Pure Card Art Grid (Matching media_1790063450672.jpg) */}
      <main className="px-2 sm:px-3 pt-2">
        {(() => {
          if (loading) {
            return (
              <div className={`grid ${gridCols === 3 ? 'grid-cols-3' : 'grid-cols-2'} sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3`}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2.5/3.5] rounded-xl sm:rounded-2xl bg-[#222533] animate-pulse border border-[#2d3140]/40"
                  />
                ))}
              </div>
            );
          }

          if (cards.length === 0) {
            return (
              <div className="text-center py-20 bg-[#222533]/60 rounded-3xl border border-[#2d3140] my-4">
                <Layers className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No cards found</h3>
                <p className="text-xs text-gray-400 mt-1">Try resetting the filters or searching a different card.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#e76d78] text-white text-xs font-bold hover:bg-[#d45b66] transition cursor-pointer shadow"
                >
                  Reset Filters
                </button>
              </div>
            );
          }

          return (
            <div className={`grid ${gridCols === 3 ? 'grid-cols-3' : 'grid-cols-2'} sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5`}>
              {cards.map((card) => {
                const ownedQty = (card.userCards || []).reduce((sum, u) => sum + u.quantity, 0);

                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveCard(card)}
                    className="group relative aspect-[2.5/3.5] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.97] bg-[#1a1c25] border border-[#343a4c]/50 hover:border-[#3b82f6]"
                  >
                    {/* Pure Edge-to-Edge Card Artwork */}
                    <img
                      src={getSafeCardImageUrl(card.imageUrl)}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        if (card.imageUrl) {
                          (e.target as HTMLImageElement).src = `/api/card-image?url=${encodeURIComponent(card.imageUrl)}`;
                        }
                      }}
                    />

                    {/* Top-Left Release Set Badge */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[8px] sm:text-[9px] font-black text-amber-300 border border-white/10 shadow pointer-events-none">
                      {card.displaySet || card.display_set || card.pack?.code || card.id.split('-')[0]}
                    </div>

                    {/* Subtle Floating Price Badge on Bottom-Left */}
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-amber-300 border border-white/10 shadow-sm pointer-events-none">
                      {formatYuyuPrice(card.yuyuPrice || Math.round((card.marketPrice || 1) * 140)).full}
                    </div>

                    {/* Circular Emblem on Bottom-Right (Matching media_1790063450672.jpg) */}
                    <div
                      className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 backdrop-blur-sm flex items-center justify-center shadow-md transition-transform ${
                        ownedQty > 0
                          ? 'border-emerald-400 bg-emerald-500/85 text-white'
                          : 'border-white/80 bg-black/40'
                      }`}
                    >
                      {ownedQty > 0 ? (
                        <span className="text-[10px] font-black leading-none">
                          {ownedQty > 1 ? `x${ownedQty}` : '✓'}
                        </span>
                      ) : (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/50"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* 4. Minimalist Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6 pb-4">
            <button
              disabled={page <= 1}
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="p-2 rounded-xl bg-[#242836] border border-[#343a4c] text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e3344] transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 font-medium">
              Page <strong className="text-white">{page}</strong> of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="p-2 rounded-xl bg-[#242836] border border-[#343a4c] text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e3344] transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Card Detail Modal */}
      {activeCard && (
        <div className="fixed inset-0 z-50 bg-[#181a22] overflow-y-auto sm:bg-black/85 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:my-auto">
            <CardDetailView
              card={activeCard}
              initialLanguage="jp"
              onBack={() => setActiveCard(null)}
              onSelectCard={(selected) => setActiveCard(selected as CardItem)}
              onAddToCollection={(c) => {
                setAddModalCard(c as CardItem);
                setAddPrice(c.yuyuPrice ? c.yuyuPrice.toString() : Math.round((c.marketPrice || 0.25) * 140).toString());
              }}
            />
          </div>
        </div>
      )}

      {/* Add To Collection Modal */}
      {addModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#242836] border border-[#343a4c] rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setAddModalCard(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Add to Collection Binder</h3>
            <p className="text-xs text-gray-400 mb-4">Log your Japanese card with condition and purchase price</p>

            {savedSuccess ? (
              <div className="py-8 text-center text-emerald-400 font-semibold flex flex-col items-center gap-2">
                <Check className="w-8 h-8 rounded-full bg-emerald-500/20 p-1.5" />
                Successfully added to your collection!
              </div>
            ) : (
              <form onSubmit={handleAddToCollection} className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#1e212c] border border-[#343a4c] flex items-center gap-3">
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#242836] border border-[#343a4c] flex-shrink-0 flex items-center justify-center">
                    <img
                      src={getSafeCardImageUrl(addModalCard.imageUrl)}
                      alt={addModalCard.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#3b82f6] text-white">
                        🇯🇵 JAPANESE PRINT
                      </span>
                      <span className="text-xs text-amber-400 font-bold">{addModalCard.rarity}</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate mt-0.5">
                      {addModalCard.name}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {formatCard(addModalCard.id).displayId} &bull; {addModalCard.pack?.code || 'SET'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#1e212c] border border-[#32384a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Condition</label>
                    <select
                      value={addCondition}
                      onChange={(e) => setAddCondition(e.target.value)}
                      className="w-full bg-[#1e212c] border border-[#32384a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="NM">Near Mint (NM)</option>
                      <option value="LP">Lightly Played (LP)</option>
                      <option value="MP">Moderately Played (MP)</option>
                      <option value="HP">Heavily Played (HP)</option>
                      <option value="Graded">Graded Slab</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFoil"
                    checked={addIsFoil}
                    onChange={(e) => setAddIsFoil(e.target.checked)}
                    className="rounded bg-[#1e212c] border-[#32384a] text-[#e76d78] focus:ring-0"
                  />
                  <label htmlFor="isFoil" className="text-xs text-gray-300 select-none">
                    Foil / Parallel / Alternate Art
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-300 font-bold">Purchase Price (¥ Japanese Yen)</label>
                    <span className="text-[11px] text-gray-400">
                      Market: ¥{(addModalCard.yuyuPrice || Math.round((addModalCard.marketPrice || 0) * 140)).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    placeholder={`e.g. ${addModalCard.yuyuPrice || Math.round((addModalCard.marketPrice || 0) * 140)}`}
                    className="w-full bg-[#1e212c] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl px-3 py-2 text-sm text-white focus:outline-none placeholder-gray-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Denominated in Japanese Yen (¥) from Yuyu-tei. Portfolio value auto-calculated.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingCollection}
                  className="w-full py-2.5 rounded-xl bg-[#e76d78] text-white font-bold text-sm hover:bg-[#d45b66] transition disabled:opacity-50 cursor-pointer shadow-md shadow-[#e76d78]/20"
                >
                  {savingCollection ? 'Saving...' : 'Confirm & Add to Binder'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
