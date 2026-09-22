'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Maximize2, 
  Copy, 
  Check, 
  Coins, 
  BarChart3, 
  Layers, 
  Trophy, 
  Sparkles,
  ChevronRight,
  PieChart,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { getDeckById, formatDeckExport, DeckCardItem } from '@/lib/recommended-decks';
import { getEditionCardImageUrl } from '@/lib/card-image';
import { useSettings } from '@/context/SettingsContext';
import { CardDetailView, CardDetailData } from '@/components/CardDetailView';

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { formatPrice, currency } = useSettings();

  const deck = getDeckById(resolvedParams.id);
  const [activeTab, setActiveTab] = useState<'CARDS' | 'ANALYSE' | 'STATS'>('CARDS');
  const [showPrice, setShowPrice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardDetailData | null>(null);

  if (!deck) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Deck Not Found</h2>
        <p className="text-xs text-gray-400 mb-4">The requested deck could not be loaded.</p>
        <Link
          href="/decks"
          className="px-4 py-2 rounded-xl bg-[#f4727d] text-white text-xs font-bold"
        >
          Back to Recommended Decks
        </Link>
      </div>
    );
  }

  // Calculate total cards and total market price
  const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
  const totalDeckYen = deck.cards.reduce((sum, c) => sum + (c.yuyuPrice || 100) * c.quantity, 0);
  const totalDeckUsd = deck.cards.reduce((sum, c) => sum + (c.marketPrice || 1) * c.quantity, 0);

  // Group cards for cost curve
  const costDistribution: { [cost: number]: number } = {};
  deck.cards.forEach((c) => {
    const cost = c.cost !== null && c.cost !== undefined ? Math.min(c.cost, 10) : 0;
    costDistribution[cost] = (costDistribution[cost] || 0) + c.quantity;
  });

  const handleCopyDeck = () => {
    const text = formatDeckExport(deck);
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = formatDeckExport(deck);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deck.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convert DeckCardItem to CardDetailData for modal
  const handleCardClick = (cardItem: DeckCardItem) => {
    setSelectedCard({
      id: cardItem.cardId,
      name: cardItem.name,
      category: cardItem.category,
      colors: cardItem.colors,
      cost: cardItem.cost ?? null,
      power: cardItem.power ?? null,
      counter: null,
      rarity: 'Rare',
      attributes: null,
      types: 'Big Mom Pirates',
      effect: null,
      trigger: null,
      imageUrl: cardItem.imageUrl ?? null,
      marketPrice: cardItem.marketPrice ?? 1.0,
      yuyuPrice: cardItem.yuyuPrice ?? 100,
      hasJpPrint: true
    });
  };

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-100 max-w-lg mx-auto">
      {/* Top Header Bar matching Screenshot 2 */}
      <header className="sticky top-0 z-30 bg-[#1e212b]/95 backdrop-blur-md px-4 py-3.5 border-b border-[#2d3242] flex items-center justify-between">
        {/* Left: Back button */}
        <button
          type="button"
          onClick={() => router.push('/decks')}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
          aria-label="Back to Recommended Decks"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Right: Download, Fullscreen, and COPY DECK button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            title="Download Deck Text"
            className="w-9 h-9 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.();
              } else {
                document.exitFullscreen?.();
              }
            }}
            title="Toggle Fullscreen"
            className="w-9 h-9 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* COPY DECK Button matching Screenshot 2 */}
          <button
            type="button"
            onClick={handleCopyDeck}
            className="px-3.5 py-1.5 rounded-xl bg-[#2b3040] hover:bg-[#383f54] text-white border border-[#3e445b] text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-300" />
                <span>COPY DECK &gt;</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Deck Hero Card matching Screenshot 2 */}
      <section className="p-4">
        <div className="bg-[#242735] border border-[#34384c] rounded-3xl p-4 shadow-xl flex items-start gap-4">
          {/* Big Leader Card Art on Left */}
          <div className="w-28 sm:w-32 aspect-[2.5/3.5] bg-[#1a1d27] rounded-2xl overflow-hidden border-2 border-yellow-400/50 shadow-2xl flex-shrink-0 relative">
            <img
              src={getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage)}
              alt={deck.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* SAMPLE watermark badge if desired */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Right Column: Deck Details & Toggles */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div>
              {/* Header row: Title + Rank Badge */}
              <div className="flex items-start justify-between gap-1">
                <h2 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight">
                  {deck.name}
                </h2>
                <span className="text-sm font-black text-white">
                  {deck.rank}
                </span>
              </div>

              {/* Subtitle & Leader ID */}
              <div className="text-xs text-gray-300 font-medium mt-0.5">
                {deck.subname}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-xs font-bold text-gray-400">
                  {deck.leaderId}
                </span>
                {/* Colored circle dot */}
                <div
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: deck.colorDot }}
                />
              </div>
            </div>

            {/* Middle row: Winrate pill */}
            <div className="flex items-center justify-end mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1b1e2a] border border-[#313648] text-xs font-bold text-gray-300">
                {deck.winrate}
              </span>
            </div>

            {/* Bottom row: SHOW PRICE toggle & 50/50 pill */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10">
              {/* SHOW PRICE [ P ] Button */}
              <button
                type="button"
                onClick={() => setShowPrice(!showPrice)}
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  showPrice 
                    ? 'bg-[#f4727d] text-white shadow-md shadow-[#f4727d]/30' 
                    : 'bg-[#2e3344] text-gray-300 hover:text-white border border-[#3d445a]'
                }`}
              >
                <span>SHOW PRICE</span>
                <span className="w-4 h-4 rounded bg-white/20 text-[10px] flex items-center justify-center font-bold">
                  P
                </span>
              </button>

              {/* 50/50 Card Count Pill */}
              <div className="px-3 py-1 rounded-xl bg-[#2e3344] border border-[#3d445a] text-xs font-bold text-white">
                {totalCards}/50
              </div>
            </div>
          </div>
        </div>

        {/* Live Total Market Price Card when SHOW PRICE is enabled */}
        {showPrice && (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#242836] via-[#202330] to-[#242836] border border-emerald-500/30 flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Total Deck Valuation (50 Cards)
                </span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {formatPrice(totalDeckUsd, { source: 'yuyutei' }).full}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-bold text-gray-400">
              {currency === 'source' ? '🇯🇵 Native JPY' : `Converted ${currency}`}
            </span>
          </div>
        )}
      </section>

      {/* Subtabs matching Screenshot 2: CARDS | ANALYSE | STATS */}
      <section className="px-4">
        <div className="flex items-center border-b border-[#313648] text-xs font-black tracking-wider uppercase">
          <button
            type="button"
            onClick={() => setActiveTab('CARDS')}
            className={`flex-1 py-3 text-center transition cursor-pointer relative ${
              activeTab === 'CARDS'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>CARDS</span>
            {activeTab === 'CARDS' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#f4727d]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ANALYSE')}
            className={`flex-1 py-3 text-center transition cursor-pointer relative ${
              activeTab === 'ANALYSE'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>ANALYSE</span>
            {activeTab === 'ANALYSE' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#f4727d]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STATS')}
            className={`flex-1 py-3 text-center transition cursor-pointer relative ${
              activeTab === 'STATS'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>STATS</span>
            {activeTab === 'STATS' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#f4727d]" />
            )}
          </button>
        </div>
      </section>

      {/* ================= TAB 1: CARDS (3-COLUMN ART GRID MATCHING SCREENSHOT 2) ================= */}
      {activeTab === 'CARDS' && (
        <section className="p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {deck.cards.map((cardItem: DeckCardItem) => {
              const unitPrice = cardItem.yuyuPrice || 100;

              return (
                <div
                  key={cardItem.cardId}
                  onClick={() => handleCardClick(cardItem)}
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#181b24] border border-[#34384c] hover:border-yellow-400/70 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col active:scale-95"
                >
                  {/* Card Art Image Container (Aspect 2.5/3.5) */}
                  <div className="relative aspect-[2.5/3.5] w-full overflow-hidden bg-[#13151c]">
                    <img
                      src={getEditionCardImageUrl(cardItem.cardId, 'jp', cardItem.imageUrl)}
                      alt={cardItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Top Left: Cost */}
                    {cardItem.cost !== null && cardItem.cost !== undefined && (
                      <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white font-black text-[11px] sm:text-xs w-5 h-5 rounded-md flex items-center justify-center shadow-md border border-white/20">
                        {cardItem.cost}
                      </div>
                    )}

                    {/* Top Right Power Badge */}
                    {cardItem.power && (
                      <div className="absolute top-1 right-7 bg-black/75 backdrop-blur-xs text-white font-black text-[9px] px-1 py-0.5 rounded-md shadow-md border border-white/20">
                        {cardItem.power}
                      </div>
                    )}

                    {/* Top Right: Yellow Quantity Badge matching Screenshot 2 (e.g. 4) */}
                    <div className="absolute top-1 right-1 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-yellow-200">
                      {cardItem.quantity}
                    </div>

                    {/* Price tag overlay if SHOW PRICE is toggled on */}
                    {showPrice && (
                      <div className="absolute bottom-7 inset-x-1 py-0.5 px-1 rounded-md bg-black/85 backdrop-blur-sm border border-emerald-500/40 text-center shadow-md">
                        <span className="text-[10px] font-black text-emerald-400 font-mono">
                          {formatPrice(cardItem.marketPrice || 1, { source: 'yuyutei' }).full}
                        </span>
                      </div>
                    )}

                    {/* Bottom Label Bar matching Screenshot 2 */}
                    <div className="absolute bottom-0 inset-x-0 bg-[#facc15] text-slate-950 p-1 flex flex-col items-center justify-center text-center shadow-md">
                      <span className="font-mono text-[9px] font-black tracking-tight leading-none">
                        {cardItem.cardId}
                      </span>
                      <span className="text-[8.5px] font-extrabold truncate w-full leading-tight mt-0.5">
                        {cardItem.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= TAB 2: ANALYSE (COST CURVE & DISTRIBUTIONS) ================= */}
      {activeTab === 'ANALYSE' && (
        <section className="p-4 space-y-4">
          {/* DON!! Cost Curve Bar Chart */}
          <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-4 shadow-lg">
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#f4727d]" />
              <span>DON!! Cost Curve Distribution</span>
            </h3>

            <div className="space-y-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cost) => {
                const count = costDistribution[cost] || 0;
                const percentage = Math.round((count / totalCards) * 100);

                return (
                  <div key={cost} className="flex items-center gap-3 text-xs">
                    <span className="w-6 font-mono font-bold text-gray-300 text-right">
                      {cost}c
                    </span>
                    <div className="flex-1 bg-[#1a1d27] rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#f4727d] to-[#f59e0b] transition-all duration-500"
                        style={{ width: `${Math.max(percentage, count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                    <span className="w-10 font-mono text-[11px] font-bold text-gray-400 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Counter Breakdown */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-3 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                +2000 Counter
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                {deck.stats.counters2000}
              </span>
              <span className="text-[10px] text-gray-500">Defense Grails</span>
            </div>

            <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-3 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                +1000 Counter
              </span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                {deck.stats.counters1000}
              </span>
              <span className="text-[10px] text-gray-500">Mid Guards</span>
            </div>

            <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-3 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                No Counter
              </span>
              <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
                {deck.stats.noCounter}
              </span>
              <span className="text-[10px] text-gray-500">High Impact</span>
            </div>
          </div>

          {/* Card Category Distribution */}
          <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-4 shadow-lg">
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#3b82f6]" />
              <span>Card Composition</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-[#1b1e2a] p-2.5 rounded-xl border border-[#313648]">
                <div className="text-[10px] text-gray-400 font-bold">Characters</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {deck.stats.charactersCount}
                </div>
              </div>
              <div className="bg-[#1b1e2a] p-2.5 rounded-xl border border-[#313648]">
                <div className="text-[10px] text-gray-400 font-bold">Events</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {deck.stats.eventsCount}
                </div>
              </div>
              <div className="bg-[#1b1e2a] p-2.5 rounded-xl border border-[#313648]">
                <div className="text-[10px] text-gray-400 font-bold">Stages</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {deck.stats.stagesCount}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= TAB 3: STATS (TOURNAMENT RECORD & STRATEGY) ================= */}
      {activeTab === 'STATS' && (
        <section className="p-4 space-y-3.5">
          {/* Tournament Placement Summary */}
          <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-[#f59e0b] font-black text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Competitive Record</span>
            </div>
            <h4 className="text-sm font-black text-white">
              {deck.tournament}
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {deck.description}
            </p>
          </div>

          {/* Strategy & Mulligan Tips */}
          <div className="bg-[#242735] border border-[#34384c] rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-[#3b82f6] font-black text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Mulligan Priority</span>
            </div>
            <ul className="text-xs text-gray-300 space-y-1.5 pl-4 list-disc">
              <li>Keep hands with 1-cost searchers (e.g. Streusen) or 3-cost Pudding.</li>
              <li>Curve into 4-cost Charlotte Oven on Turn 2 (going second) to remove opponent resters.</li>
              <li>Hold +2000 counters for late game life defense when using Leader skill.</li>
            </ul>
          </div>

          {/* Sourcing Attribution */}
          <div className="p-3 bg-[#1b1e2a] rounded-xl border border-[#313648] text-center text-xs text-gray-400">
            <span>Verified Decklist via </span>
            <strong className="text-white">OnePieceTopDecks.com</strong>
          </div>
        </section>
      )}

      {/* Card Detail Modal when tapping any card in the grid */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl bg-[#232734] border border-[#34384c] shadow-2xl p-2 relative">
            <CardDetailView
              card={selectedCard}
              onBack={() => setSelectedCard(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
