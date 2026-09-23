'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Boxes, 
  Search, 
  ArrowLeft,
  ChevronRight, 
  Plus, 
  Minus,
  LayoutGrid,
  ListFilter,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getSafeCardImageUrl } from '@/lib/card-image';

interface SampleCard {
  id: string;
  name: string;
  imageUrl: string | null;
  rarity: string;
  category: string;
}

interface SetItem {
  id: string;
  code: string;
  name: string;
  seriesType: string;
  cardsCount: number;
  sampleCards: SampleCard[];
}

interface YuyuteiSetDefinition {
  id: string;
  code?: string;
  displayCode?: string;
  title: string;
  targetSet: string;
  query?: string;
  categoryParam?: string;
}

// Exact set categories and order matching Yuyu-tei official layout
const BOOSTER_SETS: YuyuteiSetDefinition[] = [
  { id: 'op18', code: 'OP18', title: 'Booster Pack OP-18 [Coming Soon]', targetSet: 'OP-18' },
  { id: 'op17', code: 'OP17', title: "The World's Strongest Warrior", targetSet: 'OP-17' },
  { id: 'op16', code: 'OP16', title: 'The Moment of Decisive Battle', targetSet: 'OP-16' },
  { id: 'op15', code: 'OP15', title: 'Adventure on the Island of the Gods', targetSet: 'OP-15' },
  { id: 'op14', code: 'OP14', title: 'The Seven Heroes of the Azure Sea', targetSet: 'OP-14' },
  { id: 'op13', code: 'OP13', title: 'Inherited Will', targetSet: 'OP-13' },
  { id: 'prb02', code: 'PRB02', title: 'ONE PIECE CARD THE BESTvol.2', targetSet: 'PRB-02' },
  { id: 'op12', code: 'OP12', title: 'The bond between master and disciple', targetSet: 'OP-12' },
  { id: 'op11', code: 'OP11', title: 'Lightning-fast punch', targetSet: 'OP-11' },
  { id: 'op10', code: 'OP10', title: 'Royal bloodline', targetSet: 'OP-10' },
  { id: 'op09', code: 'OP09', title: 'The New Emperor', targetSet: 'OP-09' },
  { id: 'prb01', code: 'PRB01', title: 'ONE PIECE CARD THE BEST', targetSet: 'PRB-01' },
  { id: 'op08', code: 'OP08', title: 'Two Legends', targetSet: 'OP-08' },
  { id: 'op07', code: 'OP07', title: '500 years into the future', targetSet: 'OP-07' },
  { id: 'op06', code: 'OP06', title: 'The Two Great Champions', targetSet: 'OP-06' },
  { id: 'op05', code: 'OP05', title: 'The protagonist of a new era', targetSet: 'OP-05' },
  { id: 'op04', code: 'OP04', title: 'Kingdom of Intrigue', targetSet: 'OP-04' },
  { id: 'op03', code: 'OP03', title: 'A formidable enemy', targetSet: 'OP-03' },
  { id: 'op02', code: 'OP02', title: 'The Ultimate Showdown', targetSet: 'OP-02' },
  { id: 'op01', code: 'OP01', title: 'ROMANCE DAWN', targetSet: 'OP-01' },
];

const STARTER_DECK_SETS: YuyuteiSetDefinition[] = [
  { id: 'st36', code: 'ST36', title: 'Yellow Eustass Kidd', targetSet: 'ST-36' },
  { id: 'st35', code: 'ST35', title: 'Red and Black Sabo', targetSet: 'ST-35' },
  { id: 'st34', code: 'ST34', title: 'Purple Charlotte Katakuri', targetSet: 'ST-34' },
  { id: 'st33', code: 'ST33', title: 'Blue Kuzan', targetSet: 'ST-33' },
  { id: 'st32', code: 'ST32', title: 'Green Roronoa Zoro', targetSet: 'ST-32' },
  { id: 'st31', code: 'ST31', title: 'Red Monkey D. Luffy', targetSet: 'ST-31' },
  { id: 'st30', code: 'ST30', title: 'Luffy & Ace', targetSet: 'ST-30' },
  { id: 'st29', code: 'ST29', title: 'EGGHEAD', targetSet: 'ST-29' },
  { id: 'st28', code: 'ST28', title: 'Green and Yellow Yamato', targetSet: 'ST-28' },
  { id: 'st27', code: 'ST27', title: 'Black Marshall D. Teach', targetSet: 'ST-27' },
  { id: 'st26', code: 'ST26', title: 'Purple and Black Monkey D. Luffy', targetSet: 'ST-26' },
  { id: 'st25', code: 'ST25', title: 'Blue Buggy', targetSet: 'ST-25' },
  { id: 'st24', code: 'ST24', title: 'Green Jewelry Bonney', targetSet: 'ST-24' },
  { id: 'st23', code: 'ST23', title: 'Red Shanks', targetSet: 'ST-23' },
  { id: 'st22', code: 'ST22', title: 'Ace & Newgate', targetSet: 'ST-22' },
  { id: 'st21', code: 'ST21', title: 'GEAR5', targetSet: 'ST-21' },
  { id: 'st20', code: 'ST20', title: 'Yellow Charlotte Katakuri', targetSet: 'ST-20' },
  { id: 'st19', code: 'ST19', title: 'Black Smoker', targetSet: 'ST-19' },
  { id: 'st18', code: 'ST18', title: 'Purple Monkey D. Luffy', targetSet: 'ST-18' },
  { id: 'st17', code: 'ST17', title: 'Blue Donquixote Doflamingo', targetSet: 'ST-17' },
  { id: 'st16', code: 'ST16', title: 'Green Uta', targetSet: 'ST-16' },
  { id: 'st15', code: 'ST15', title: 'Red Edward.Newgate', targetSet: 'ST-15' },
  { id: 'st14', code: 'ST14', title: '3D2Y', targetSet: 'ST-14' },
  { id: 'st13', code: 'ST13', title: 'The Three Brothers', targetSet: 'ST-13' },
  { id: 'st12', code: 'ST12', title: 'Zoro and Sanji', targetSet: 'ST-12' },
  { id: 'st11', code: 'ST11', title: 'Uta', targetSet: 'ST-11' },
  { id: 'st10', code: 'ST10', title: 'The Three Captains', targetSet: 'ST-10' },
  { id: 'st09', code: 'ST09', title: 'Yamato', targetSet: 'ST-09' },
  { id: 'st08', code: 'ST08', title: 'Monkey D. Luffy', targetSet: 'ST-08' },
  { id: 'st07', code: 'ST07', title: 'Big Mom Pirates', targetSet: 'ST-07' },
  { id: 'st06', code: 'ST06', title: 'Absolute Justice', targetSet: 'ST-06' },
  { id: 'st05', code: 'ST05', title: 'ONE PIECE FILM edition', targetSet: 'ST-05' },
  { id: 'st04', code: 'ST04', title: 'Animal Kingdom Pirates', targetSet: 'ST-04' },
  { id: 'st03', code: 'ST03', title: 'The Seven Warlords of the Sea', targetSet: 'ST-03' },
  { id: 'st02', code: 'ST02', title: 'Worst Generation', targetSet: 'ST-02' },
  { id: 'st01', code: 'ST01', title: 'Straw Hat Crew', targetSet: 'ST-01' },
];

const EXTRA_SETS: YuyuteiSetDefinition[] = [
  { id: 'eb04', code: 'EB04', title: 'EGGHEAD CRISIS', targetSet: 'EB-04' },
  { id: 'eb03', code: 'EB03', title: 'Heroines Edition', targetSet: 'EB-03' },
  { id: 'eb02', code: 'EB02', title: 'Anime 25th collection', targetSet: 'EB-02' },
  { id: 'eb01', code: 'EB01', title: 'Memorial Collection', targetSet: 'EB-01' },
];

const PROMO_SETS: YuyuteiSetDefinition[] = [
  { id: 'promo-p2', displayCode: '[P-101] to [P-200]', title: '', targetSet: 'PROMO', query: 'P-' },
  { id: 'promo-p1', displayCode: '[P-001] to [P-100]', title: '', targetSet: 'PROMO', query: 'P-' },
  { id: 'promo-op2', displayCode: '[OP11] to [OP20]', title: '', targetSet: 'PROMO', query: 'OP' },
  { id: 'promo-op1', displayCode: '[OP01] to [OP10]', title: '', targetSet: 'PROMO', query: 'OP' },
  { id: 'promo-st', displayCode: '[ST01] to [ST30]', title: '', targetSet: 'PROMO', query: 'ST' },
  { id: 'promo-eb', displayCode: '[EB01] to [EB20]', title: '', targetSet: 'PROMO', query: 'EB' },
  { id: 'promo-prb', displayCode: '[PRB01] to [PRB10]', title: '', targetSet: 'PROMO', query: 'PRB' },
];

const DON_SETS: YuyuteiSetDefinition[] = [
  { id: 'don', displayCode: 'Don!! Card', title: '', targetSet: 'All', categoryParam: 'DON!!', query: 'DON!!' },
];

interface AccordionCategory {
  id: string;
  name: string;
  accentColor: string;
  items: YuyuteiSetDefinition[];
}

const CATEGORIES: AccordionCategory[] = [
  { id: 'booster', name: 'booster', accentColor: '#3b82f6', items: BOOSTER_SETS },
  { id: 'starter', name: 'Starter Deck', accentColor: '#e76d78', items: STARTER_DECK_SETS },
  { id: 'extra', name: 'Extra', accentColor: '#f59e0b', items: EXTRA_SETS },
  { id: 'promo', name: 'Promotional card', accentColor: '#10b981', items: PROMO_SETS },
  { id: 'don', name: 'Don!! Card', accentColor: '#a855f7', items: DON_SETS },
];

export default function SetsPage() {
  const [dbSets, setDbSets] = useState<SetItem[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'yuyutei' | 'grid'>('yuyutei');

  const [columnCount, setColumnCount] = useState<'1' | '2' | '3'>('3');

  // Accordion state: ALWAYS collapsed by default when user opens the screen
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSets();
  }, []);

  async function loadSets() {
    setLoading(true);
    try {
      const res = await fetch('/api/sets');
      const data = await res.json();
      if (data.sets) {
        setDbSets(data.sets);
      }
    } catch (e) {
      console.error('Failed to load sets', e);
    } finally {
      setLoading(false);
    }
  }

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    CATEGORIES.forEach((c) => {
      allExpanded[c.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  // Map DB set counts to Yuyu-tei definitions for instant card badges
  const dbSetMap = useMemo(() => {
    const map = new Map<string, SetItem>();
    dbSets.forEach((s) => {
      const cleanCode = (s.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      map.set(cleanCode, s);
      map.set((s.code || '').toUpperCase(), s);
    });
    return map;
  }, [dbSets]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase().trim();

    return CATEGORIES.map((cat) => {
      const matchingItems = cat.items.filter((item) => {
        const fullText = `${item.code || ''} ${item.displayCode || ''} ${item.title} ${item.targetSet}`.toLowerCase();
        return fullText.includes(q);
      });
      return {
        ...cat,
        items: matchingItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [search]);

  // Total cards in database
  const totalCardsCount = useMemo(() => {
    return dbSets.reduce((sum, s) => sum + s.cardsCount, 0);
  }, [dbSets]);

  // Dynamic grid classes based on column layout
  const gridClass = useMemo(() => {
    if (columnCount === '1') return 'grid grid-cols-1 max-w-lg mx-auto gap-2 sm:gap-2.5 pt-1';
    if (columnCount === '2') return 'grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 pt-1';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 pt-1';
  }, [columnCount]);

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto space-y-3 pb-32 sm:pb-24 font-sans select-none px-2 sm:px-3">
      {/* Sleek Top Header Bar: Back Button, Clean Title, View Mode Switcher */}
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
            Sets &amp; Decks
          </h1>
        </div>

        {/* View Mode Toggle: List vs Grid */}
        <div className="flex items-center bg-[#1e212c] p-0.5 sm:p-1 rounded-xl border border-[#343a4c]">
          <button
            type="button"
            onClick={() => setViewMode('yuyutei')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'yuyutei'
                ? 'bg-[#3b82f6] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
            title="List View"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#3b82f6] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </header>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search set code or name (e.g. OP17, Romance Dawn, ST36)..."
            className="w-full bg-[#1e212c] border border-[#343a4c] focus:border-[#3b82f6] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition shadow-inner"
          />
        </div>

        {viewMode === 'yuyutei' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#242836] hover:bg-[#2c3142] border border-[#343a4c] text-gray-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="Expand All"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand All</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#242836] hover:bg-[#2c3142] border border-[#343a4c] text-gray-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="Collapse All"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Collapse All</span>
            </button>
          </div>
        )}
      </div>

      {/* DARK THEMED ACCORDION LIST VIEW (Optimized to App Theme & Collapsed by Default) */}
      {viewMode === 'yuyutei' ? (
        <div className="bg-[#242836] rounded-2xl border border-[#343a4c] shadow-xl overflow-hidden divide-y divide-[#32384a]">
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Boxes className="w-10 h-10 mx-auto mb-2 text-gray-500" />
              <p className="text-sm font-bold text-gray-200">No sets found matching &quot;{search}&quot;</p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-[#3b82f6] hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded = !!expandedSections[category.id];

              return (
                <div key={category.id} className="transition-colors">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(category.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 bg-[#242836] hover:bg-[#2a2f40] transition select-none group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Vertical Accent Bar */}
                      <span 
                        className="w-1.5 h-4.5 sm:h-5 rounded-full inline-block shadow-sm"
                        style={{ backgroundColor: category.accentColor }}
                      />

                      {/* Title */}
                      <span
                        className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                          isExpanded ? 'text-white' : 'text-gray-200 group-hover:text-white'
                        }`}
                      >
                        {category.name}
                      </span>

                      {/* Item Count Badge */}
                      <span className="text-[11px] font-bold text-gray-400 bg-[#1e212c] border border-[#343a4c] px-2 py-0.5 rounded-full ml-1">
                        {category.items.length}
                      </span>
                    </div>

                    {/* Right Toggle Icon: + when collapsed, - when expanded */}
                    <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-white font-black transition-colors">
                      {isExpanded ? (
                        <Minus className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>
                  </button>

                  {/* Category Content: Chamfered Cards matching App Theme */}
                  {isExpanded && (
                    <div className="px-3 pb-4 pt-3 sm:px-6 sm:pb-5 bg-[#181a22]/70 border-t border-[#2e3346]">
                      <div className={gridClass}>
                        {category.items.map((item) => {
                          const cleanCode = (item.code || '').replace(/[^A-Z0-9]/g, '');
                          const matchedDb = dbSetMap.get(cleanCode) || dbSetMap.get(item.targetSet.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                          
                          // Build navigation URL
                          let href = `/cards?set=${encodeURIComponent(item.targetSet)}`;
                          if (item.categoryParam) {
                            href += `&category=${encodeURIComponent(item.categoryParam)}`;
                          }
                          if (item.query) {
                            href += `&q=${encodeURIComponent(item.query)}`;
                          }

                          return (
                            <Link
                              key={item.id}
                              href={href}
                              className="group block relative w-full transition-transform active:scale-[0.98]"
                            >
                              {/* Outer border container with chamfered top-right corner */}
                              <div
                                className="w-full bg-[#343a4c] group-hover:bg-[#3b82f6] transition-colors p-[1px] shadow-sm"
                                style={{
                                  clipPath: 'polygon(0 4px, 4px 0, calc(100% - 11px) 0, 100% 11px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
                                }}
                              >
                                {/* Inner dark container matching app theme */}
                                <div
                                  className="w-full bg-[#1e212c] group-hover:bg-[#252a3b] transition-colors px-3 py-2 sm:py-2.5 flex items-center justify-between gap-2 min-h-[44px]"
                                  style={{
                                    clipPath: 'polygon(0 3px, 3px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px))',
                                  }}
                                >
                                  {/* Left text: [Code] Title */}
                                  <div className="flex items-center gap-1.5 min-w-0 pr-1 text-left flex-wrap">
                                    {item.displayCode ? (
                                      <span className="font-mono font-black text-[#3b82f6] text-xs sm:text-[13px] tracking-tight shrink-0">
                                        {item.displayCode}
                                      </span>
                                    ) : item.code ? (
                                      <span className="font-mono font-black text-[#3b82f6] text-xs sm:text-[13px] tracking-tight shrink-0">
                                        [{item.code}]
                                      </span>
                                    ) : null}

                                    {item.title && (
                                      <span className="font-bold text-gray-200 group-hover:text-white text-xs sm:text-[12.5px] leading-tight break-words">
                                        {item.title}
                                      </span>
                                    )}
                                  </div>

                                  {/* Right: Chevron Arrow > */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {matchedDb && matchedDb.cardsCount > 0 && (
                                      <span className="text-[10px] font-bold text-[#f59e0b] bg-[#181a22] border border-[#343a4c] px-1.5 py-0.5 rounded">
                                        {matchedDb.cardsCount}
                                      </span>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3b82f6] group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CARD ARTWORKS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dbSets.map((set) => (
            <Link
              key={set.id}
              href={`/cards?set=${encodeURIComponent(set.code || set.id)}`}
              className="group p-5 rounded-2xl bg-[#242836] hover:bg-[#282d3e] border border-[#343a4c] hover:border-[#3b82f6]/60 transition duration-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black border bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30">
                    {set.code}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 px-2 py-0.5 rounded-lg bg-[#1e212c] border border-[#343a4c]">
                    {set.cardsCount} Cards
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white group-hover:text-[#3b82f6] transition leading-snug line-clamp-2">
                  {set.name}
                </h3>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  <span>{set.seriesType}</span>
                </div>

                {set.sampleCards && set.sampleCards.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#343a4c]/60">
                    <div className="flex items-center justify-center -space-x-3 py-1">
                      {set.sampleCards.slice(0, 3).map((c, idx) => (
                        <div
                          key={c.id}
                          className={`w-14 h-20 rounded-lg overflow-hidden bg-[#1e212c] border-2 border-[#242836] shadow-md transition transform group-hover:scale-105 ${
                            idx === 1 ? 'z-10 -translate-y-1' : 'z-0 opacity-85 group-hover:opacity-100'
                          }`}
                        >
                          {c.imageUrl ? (
                            <img
                              src={getSafeCardImageUrl(c.imageUrl)}
                              alt={c.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
                              {c.id}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#343a4c] flex items-center justify-between text-xs font-bold text-gray-300 group-hover:text-white">
                <span>Explore Set Cards</span>
                <div className="flex items-center gap-1 text-[#3b82f6] group-hover:translate-x-1 transition">
                  <span>View Cards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
