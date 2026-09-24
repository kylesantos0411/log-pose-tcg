'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Star, 
  Search, 
  X, 
  Layers, 
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getSafeCardImageUrl } from '@/lib/card-image';
import { useSettings } from '@/context/SettingsContext';
import { CardDetailView } from '@/components/CardDetailView';
import { getFavoriteCardIds, toggleCardFavorite } from '@/lib/favorites';

interface CardItem {
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
  userCards?: Array<{
    id: string;
    quantity: number;
    condition: string;
    isFoil: boolean;
  }>;
}

export default function FavoritesPage() {
  const { formatYuyuPrice } = useSettings();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);

  // Load initial favorite IDs and listen to updates
  useEffect(() => {
    const syncFavorites = () => {
      const ids = getFavoriteCardIds();
      setFavoriteIds(ids);
    };

    syncFavorites();
    window.addEventListener('logpose_favorites_updated', syncFavorites);
    return () => {
      window.removeEventListener('logpose_favorites_updated', syncFavorites);
    };
  }, []);

  // Fetch card details when favoriteIds change
  useEffect(() => {
    if (favoriteIds.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/cards?ids=${encodeURIComponent(favoriteIds.join(','))}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.cards && Array.isArray(data.cards)) {
          // Sort to match favoriteIds order (most recently favorited first)
          const cardMap = new Map<string, CardItem>();
          data.cards.forEach((c: CardItem) => cardMap.set(c.id, c));
          const orderedCards = favoriteIds
            .map((id) => cardMap.get(id))
            .filter((c): c is CardItem => Boolean(c));
          setCards(orderedCards);
        } else {
          setCards([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load favorite cards', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [favoriteIds]);

  const handleToggleFavorite = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    toggleCardFavorite(cardId);
    const updated = getFavoriteCardIds();
    setFavoriteIds(updated);
  };

  // Filter cards by search, color, category
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesId = card.id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      if (selectedColor !== 'All') {
        if (!card.colors || !card.colors.toLowerCase().includes(selectedColor.toLowerCase())) {
          return false;
        }
      }
      if (selectedCategory !== 'All') {
        if (!card.category || card.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [cards, search, selectedColor, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#1e202a] text-white pb-20 select-none font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-[#1e202a]/95 backdrop-blur-md border-b border-[#313647] px-3 sm:px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-2 rounded-xl bg-[#242836] border border-[#343a4c] text-gray-300 hover:text-white hover:bg-[#2c3142] transition cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#c084fc]/15 border border-[#c084fc]/30 flex items-center justify-center text-[#c084fc]">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-wide leading-none text-white">
                    Favorites
                  </h1>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/30">
                    {favoriteIds.length}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Your saved favorite cards
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/cards"
            className="px-3 py-1.5 rounded-xl bg-[#242836] hover:bg-[#2c3142] border border-[#343a4c] text-xs font-bold text-gray-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Browse All</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3.5 space-y-3.5">
        {/* Search & Quick Filters Bar (Only show if cards exist) */}
        {favoriteIds.length > 0 && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by card name or code (e.g. OP01-001)..."
                className="w-full bg-[#242836] border border-[#343a4c] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#c084fc] transition shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Color Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
              {['All', 'Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'].map((col) => {
                const isSelected = selectedColor === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#c084fc] text-[#1e202a] border-[#c084fc] font-extrabold shadow-sm'
                        : 'bg-[#242836] text-gray-300 border-[#343a4c] hover:bg-[#2c3142] hover:text-white'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
              {(search || selectedColor !== 'All' || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedColor('All');
                    setSelectedCategory('All');
                  }}
                  className="text-[#e76d78] hover:underline font-bold text-[11px] px-2 py-1 flex-shrink-0 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Cards Grid / States */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2.5/3.5] rounded-xl sm:rounded-2xl bg-[#222533] animate-pulse border border-[#2d3140]/40"
              />
            ))}
          </div>
        ) : favoriteIds.length === 0 ? (
          /* Empty State: No favorites at all */
          <div className="text-center py-16 sm:py-24 px-4 bg-[#202330]/60 rounded-3xl border border-[#313647] my-4 shadow-lg">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#c084fc]/10 border border-[#c084fc]/25 mx-auto mb-4 flex items-center justify-center text-[#c084fc]">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              No Favorite Cards Yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Tap the star icon on any card in the catalog or card detail view to add it to your favorites.
            </p>
            <div className="mt-6">
              <Link
                href="/cards"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c084fc] hover:bg-[#b072ec] text-[#1e202a] text-xs font-extrabold transition shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Explore Cards</span>
              </Link>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          /* Filtered empty state */
          <div className="text-center py-16 px-4 bg-[#202330]/40 rounded-2xl border border-[#313647] my-4">
            <Layers className="w-10 h-10 text-gray-500 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-white">No matching favorites</h3>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search query or color filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedColor('All');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-1.5 rounded-xl bg-[#242836] border border-[#343a4c] text-xs font-bold text-white hover:bg-[#2c3142] transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Grid of Favorited Cards */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {filteredCards.map((card) => {
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveCard(card)}
                  className="group relative aspect-[2.5/3.5] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.97] bg-[#1a1c25] border border-[#343a4c]/50 hover:border-[#c084fc]"
                >
                  {/* Card Artwork */}
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
                    {card.pack?.code || card.id.split('-')[0]}
                  </div>

                  {/* Top-Right Favorite Unstar Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, card.id)}
                    title="Remove from Favorites"
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-[#c084fc] shadow-md transition-all active:scale-80 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Bottom-Left Price Badge */}
                  <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-amber-300 border border-white/10 shadow-sm pointer-events-none">
                    {formatYuyuPrice(card.yuyuPrice || Math.round((card.marketPrice || 1) * 140)).full}
                  </div>

                  {/* Bottom-Right Card Code */}
                  <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[8px] sm:text-[9px] font-bold text-gray-300 border border-white/10 shadow-sm pointer-events-none">
                    {card.id}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Card Detail Modal */}
      {activeCard && (
        <div className="fixed inset-0 z-50 bg-[#181a22] overflow-y-auto sm:bg-black/85 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl min-h-screen sm:min-h-0 sm:my-auto">
            <CardDetailView
              card={activeCard as any}
              initialLanguage="jp"
              onBack={() => setActiveCard(null)}
              onSelectCard={(selected: any) => setActiveCard(selected)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
