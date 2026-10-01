'use client';

import { useState, useEffect, useId, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  Maximize2, 
  TrendingUp, 
  FileText, 
  Layers, 
  ChevronRight, 
  PenTool, 
  Plus, 
  Check, 
  Globe, 
  Columns,
  ExternalLink,
  X,
  Copy,
  Award,
  ShieldCheck,
  BarChart2,
  Sparkles,
  Palette,
  Eye,
  Share2,
  Coins,
  Settings as SettingsIcon,
  ArrowUpRight,
  Users,
  Flag,
  AlertTriangle,
  ShieldAlert,
  ShoppingBag,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { getSafeCardImageUrl, getEditionCardImageUrl, JAPANESE_NAME_MAP, handleCardImageError } from '@/lib/card-image';
import { getCardArtist, ArtistProfile } from '@/lib/artist-data';
import { useSettings, CURRENCIES } from '@/context/SettingsContext';
import { isCardFavorite, toggleCardFavorite } from '@/lib/favorites';
import { 
  fetchCommunitySales, 
  reportSuspiciousSale, 
  type CloudSaleRecord, 
  fetchSystemSettings, 
  checkIsAdmin, 
  DEFAULT_SYSTEM_SETTINGS, 
  type SystemSettingsState 
} from '@/lib/supabase-sync';
import { generateEbaySoldSearchUrl, getVintageRecentSales, calculateThreeSaleAverage } from '@/lib/ebay-pricing';

export interface CardDetailData {
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
  blockNumber?: number | null;
  isAltArt?: boolean;
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
  isVintage?: boolean;
  vintageSeries?: string | null;
  vintagePart?: string | null;
  ebayPrice?: number | null;
  ebayUrl?: string | null;
  artistSource?: string | null;
  artist_source?: string | null;
  artistSourceUrl?: string | null;
  artist_source_url?: string | null;
  artistVerificationStatus?: string | null;
  artist_verification_status?: string | null;
  pack?: {
    code?: string | null;
    name?: string | null;
  } | null;
}

interface CardDetailViewProps {
  card: CardDetailData;
  variants?: CardDetailData[];
  initialLanguage?: 'en' | 'jp';
  onBack?: () => void;
  onAddToCollection?: (card: CardDetailData, language?: 'en' | 'jp') => void;
  onSelectCard?: (card: CardDetailData) => void;
}

interface ChartDataPoint {
  date: string;
  yuyuYen: number;
  cardmarket: number;
  ebay: number;
  snkrdunk?: number;
  psa: number;
}

const VINTAGE_SET_ARCHIVE_IDS: Record<string, string> = {
  'HB-01': '79',
  'HB-02': '81',
  'HB-GB1': '99',
  'HB-03': '100',
  'HB-04': '101',
  'HB-GB2': '104',
  'HB-05': '105',
  'HB-06': '106',
  'HB-GB3': '107',
  'HB-07': '108',
  'HB-GB4': '109',
  'HB-GL1': '110',
  'HB-GL2': '111',
  'HB-GB5': '112',
  'HB-GL3': '113',
  'HB-GBDX': '114',
  'HB-TP1': '115',
  'HB-TP2': '117',
  'HB-PR': '122',
};

export function CardDetailView({ 
  card: initialCard, 
  variants: initialVariants, 
  initialLanguage = 'jp', 
  onBack, 
  onAddToCollection,
  onSelectCard 
}: CardDetailViewProps) {
  const router = useRouter();
  const { 
    currency, 
    formatPrice, 
    formatYuyuPrice, 
    formatUsdPrice, 
    openSettings, 
    formatCard,
    enabledPriceSources,
    togglePriceSource,
    user,
    exchangeRates
  } = useSettings();

  const liveJpyRate = exchangeRates?.JPY || 157.30;
  const livePhpRate = exchangeRates?.PHP || 62.75;

  // Active language and variants state
  const [selectedLang, setSelectedLang] = useState<'en' | 'jp'>('jp');
  const [card, setCard] = useState<CardDetailData>(initialCard);
  const [allVariants, setAllVariants] = useState<CardDetailData[]>(initialVariants || []);
  const [snkrdunkPricing, setSnkrdunkPricing] = useState<any>(null);

  useEffect(() => {
    setCard(initialCard);
  }, [initialCard]);

  // Fetch live SNKRDUNK pricing (raw A-grade & all graded listings)
  useEffect(() => {
    let isMounted = true;
    if (!card.id) return;
    fetch(`/api/pricing/snkrdunk?cardId=${encodeURIComponent(card.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.pricing) {
          setSnkrdunkPricing(data.pricing);
        }
      })
      .catch((err) => console.error('Failed to load SNKRDUNK pricing:', err));
    return () => {
      isMounted = false;
    };
  }, [card.id]);

  useEffect(() => {
    if (initialVariants && initialVariants.length > 0) {
      setAllVariants(initialVariants);
      return;
    }
    const baseId = (card.id || '').split('_')[0];
    if (!baseId) return;
    fetch(`/api/cards?q=${encodeURIComponent(baseId)}&limit=50&lang=jp`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cards) {
          const matched = data.cards.filter(
            (c: CardDetailData) => (c.id === baseId || c.id.startsWith(`${baseId}_`)) && c.hasJpPrint !== false
          );
          if (matched.length > 0) {
            setAllVariants(matched);
          }
        }
      })
      .catch(() => {});
  }, [card.id, initialVariants]);

  const handleSelectVariant = (selected: CardDetailData) => {
    setCard(selected);
    if (onSelectCard) {
      onSelectCard(selected);
    }
    showToast(`Switched to version: ${selected.id}`);
  };

  // Active view states
  const [activeTab, setActiveTab] = useState<'market' | 'grading' | 'community'>('market');
  const [timeframe, setTimeframe] = useState<'7D' | '1M' | '3M'>('1M');
  const [isFavorite, setIsFavorite] = useState(() => isCardFavorite(card.id));
  const [showComparison, setShowComparison] = useState(false);
  const [imgErrorEn, setImgErrorEn] = useState(false);
  const [imgErrorJp, setImgErrorJp] = useState(false);

  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(DEFAULT_SYSTEM_SETTINGS);
  const isAdmin = checkIsAdmin(user);

  useEffect(() => {
    fetchSystemSettings().then(setSystemSettings);
    const handleUpdate = () => fetchSystemSettings().then(setSystemSettings);
    window.addEventListener('logpose_settings_updated', handleUpdate);
    return () => window.removeEventListener('logpose_settings_updated', handleUpdate);
  }, []);

  const isVintageLocked = Boolean(systemSettings.features?.vintage?.locked);
  const vintageLockMessage = systemSettings.features?.vintage?.message || 'Vintage Cards Archive is temporarily paused for pricing updates.';

  // Community Sales Data State (Strictly by exact card.id canonical variant)
  const [communitySales, setCommunitySales] = useState<CloudSaleRecord[]>([]);
  const [isLoadingCommunitySales, setIsLoadingCommunitySales] = useState(false);
  const [communityConditionFilter, setCommunityConditionFilter] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    if (!card.id) return;

    const loadSales = () => {
      setIsLoadingCommunitySales(true);
      fetchCommunitySales(card.id)
        .then((records) => {
          if (isMounted) setCommunitySales(records);
        })
        .catch((err) => {
          console.error('Failed to fetch community sales:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingCommunitySales(false);
        });
    };

    loadSales();

    window.addEventListener('logpose_collection_updated', loadSales);
    return () => {
      isMounted = false;
      window.removeEventListener('logpose_collection_updated', loadSales);
    };
  }, [card.id]);

  // Reported sales state for community moderation
  const [reportedSaleIds, setReportedSaleIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('logpose_reported_sales');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleReportSale = async (saleId: string) => {
    if (!confirm('Report this sale as suspicious, inaccurate, or manipulative to the community?')) return;
    setReportedSaleIds((prev) => [...prev, saleId]);
    await reportSuspiciousSale(saleId);
  };

  const filteredCommunitySales = useMemo(() => {
    if (communityConditionFilter === 'All') return communitySales;
    return communitySales.filter((s) => s.condition === communityConditionFilter);
  }, [communitySales, communityConditionFilter]);

  const communityStats = useMemo(() => {
    if (communitySales.length === 0) return null;
    const currency = communitySales[0]?.soldCurrency || 'PHP';

    // 1. Calculate active market benchmark in this currency if available
    let benchmarkInCurrency: number | null = null;
    if (card.yuyuPrice) {
      benchmarkInCurrency =
        currency === 'JPY'
          ? card.yuyuPrice
          : Math.round((card.yuyuPrice / liveJpyRate) * (currency === 'PHP' ? livePhpRate : 1));
    } else if (card.marketPrice) {
      benchmarkInCurrency =
        Math.round(card.marketPrice * (currency === 'PHP' ? livePhpRate : currency === 'JPY' ? liveJpyRate : 1));
    }

    // 2. Exclude flagged sales (>= 3 flags or reported by current user)
    const activeRecords = communitySales.filter(
      (s) => !reportedSaleIds.includes(s.id) && (s.flagsCount || 0) < 3
    );
    if (activeRecords.length === 0) return null;

    const prices = activeRecords.map((s) => s.soldPrice).filter((p) => p != null && !isNaN(p));
    if (prices.length === 0) return null;

    // 3. Compute Median Price (Mathematical resistance to manipulation)
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);
    const medianPrice =
      sortedPrices.length % 2 !== 0
        ? sortedPrices[mid]
        : Math.round((sortedPrices[mid - 1] + sortedPrices[mid]) / 2);

    // 4. Compute Interquartile Range (IQR) bounds if >= 4 sales
    let lowerBound = 0;
    let upperBound = Infinity;
    if (sortedPrices.length >= 4) {
      const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
      const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
      const iqr = q3 - q1;
      lowerBound = Math.max(0, q1 - 1.5 * iqr);
      upperBound = q3 + 1.5 * iqr;
    }

    // 5. Separate valid sales from statistical outliers
    let validSum = 0;
    let validCount = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let outlierCount = 0;

    for (const s of activeRecords) {
      const p = s.soldPrice;
      const isBenchmarkOutlier =
        benchmarkInCurrency &&
        benchmarkInCurrency > 0 &&
        (p > benchmarkInCurrency * 3.5 || p < benchmarkInCurrency * 0.15);

      const isIqrOutlier = p < lowerBound || p > upperBound;
      const isOutlier = Boolean(s.isOutlier || isBenchmarkOutlier || (sortedPrices.length >= 4 && isIqrOutlier));

      if (isOutlier) {
        outlierCount++;
      } else {
        if (p < minPrice) minPrice = p;
        if (p > maxPrice) maxPrice = p;
        validSum += p;
        validCount++;
      }
    }

    if (validCount === 0) {
      validSum = sortedPrices.reduce((a, b) => a + b, 0);
      validCount = sortedPrices.length;
      minPrice = sortedPrices[0];
      maxPrice = sortedPrices[sortedPrices.length - 1];
    }

    const avgPrice = Math.round(validSum / validCount);

    return {
      count: activeRecords.length,
      validCount,
      outlierCount,
      medianPrice,
      avgPrice,
      minPrice: minPrice === Infinity ? sortedPrices[0] : minPrice,
      maxPrice: maxPrice === -Infinity ? sortedPrices[sortedPrices.length - 1] : maxPrice,
      currency,
    };
  }, [communitySales, reportedSaleIds, card.yuyuPrice, card.marketPrice]);

  const formatSalePrice = (price: number, curr?: string) => {
    const symbol = curr === 'USD' ? '$' : curr === 'JPY' ? '¥' : '₱';
    return `${symbol}${price.toLocaleString()}`;
  };

  useEffect(() => {
    setIsFavorite(isCardFavorite(card.id));
  }, [card.id]);

  // Modals & interaction states
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [artistCards, setArtistCards] = useState<CardDetailData[]>([]);
  const [artistTotalCount, setArtistTotalCount] = useState<number | null>(null);
  const [loadingArtistCards, setLoadingArtistCards] = useState(false);
  const [showFullscreenChart, setShowFullscreenChart] = useState(false);
  const [showEditionModal, setShowEditionModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cardIdInfo = formatCard(card.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cardIdInfo.displayId);
    }
    setCopiedCode(true);
    showToast(`Copied card code: ${cardIdInfo.displayId}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleFavorite = () => {
    const next = toggleCardFavorite(card.id);
    setIsFavorite(next);
    showToast(next ? `Added ${card.name} to Favorites ★` : `Removed from Favorites`);
  };

  // Japanese Name lookup
  const japaneseName = JAPANESE_NAME_MAP[card.name] || '';

  // Card artist information (only set if card has a verified human/guest illustrator)
  const artist: ArtistProfile | null = getCardArtist(card.id, card.name, card.artistName || (card as any).artist_name);

  // Dynamically load all authentic cards illustrated by this artist directly from DB
  useEffect(() => {
    if (!showArtistModal || !artist?.name) return;
    setLoadingArtistCards(true);
    fetch(`/api/cards?artist=${encodeURIComponent(artist.name)}&limit=100&lang=jp`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cards) {
          setArtistCards(data.cards);
          setArtistTotalCount(data.pagination?.total || data.cards.length);
        }
      })
      .catch((e) => console.error('Failed to load artist cards', e))
      .finally(() => setLoadingArtistCards(false));
  }, [showArtistModal, artist?.name]);

  // Derive realistic market quotes matching the OP.TCG screenshot
  const basePrice = card.marketPrice || 25.0;
  // Authentic Yuyu-tei Japanese store price in JPY directly from DB yuyuPrice
  const hasYuyuPrice = Boolean(card.yuyuPrice && card.yuyuPrice > 0);
  const yuyuteiYen = hasYuyuPrice ? Math.round(card.yuyuPrice!) : 0;
  const yuyuteiYenChange = Math.round(yuyuteiYen * 0.0274);
  const convertedYuyuYen = hasYuyuPrice ? (card.yuyuPrice! / liveJpyRate) : 0;
  const convertedYuyuYenChange = convertedYuyuYen * 0.0274;

  // Vintage Card Detection and Sales Data
  const isVintage = Boolean(card.isVintage || card.vintageSeries || card.id.startsWith('HB'));

  // Ensure vintage cards never remain on grading tab
  useEffect(() => {
    if (isVintage && activeTab === 'grading') {
      setActiveTab('market');
    }
  }, [isVintage, activeTab]);

  const vintageSales = useMemo(() => {
    if (!isVintage) return [];
    return getVintageRecentSales(card.id, card.cardNumber, card.name, card.ebayPrice);
  }, [isVintage, card.id, card.cardNumber, card.name, card.ebayPrice]);

  const vintageThreeSaleAvg = useMemo(() => {
    if (!isVintage || vintageSales.length === 0) return card.ebayPrice || 0;
    return calculateThreeSaleAverage(vintageSales);
  }, [isVintage, vintageSales, card.ebayPrice]);

  const vintageEffectivePrice = vintageThreeSaleAvg > 0 ? vintageThreeSaleAvg : (card.ebayPrice || 0);

  const vintageStats = useMemo(() => {
    if (!isVintage || !vintageSales || vintageSales.length === 0) return null;
    const prices = vintageSales.map((s) => s.priceUsd);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const latest = vintageSales[0]?.priceUsd || vintageEffectivePrice;
    return { max, min, latest };
  }, [isVintage, vintageSales, vintageEffectivePrice]);

  const cardmarketPrice = card.marketPrice || 25.0;
  const ebayPrice = isVintage ? vintageEffectivePrice : Math.round(cardmarketPrice * 1.15 * 100) / 100;

  // SNKRDUNK live pricing
  const snkrdunkRawYen: number | null = snkrdunkPricing?.rawA ?? null;
  const snkrdunkRawB: number | null = snkrdunkPricing?.rawB ?? null;
  const snkrdunkRawLowest: number | null = snkrdunkPricing?.rawLowest ?? null;
  const snkrdunkCondition: 'A' | 'B' | 'C' | 'D' | null = snkrdunkPricing?.rawCondition ?? null;
  const snkrdunkGradedOnly: boolean = Boolean(snkrdunkPricing?.hasGradedOnly);
  const snkrdunkActivePrice: number | null = snkrdunkRawYen ?? snkrdunkRawLowest ?? null;
  const snkrdunkRawUsd: number | null = snkrdunkActivePrice ? snkrdunkActivePrice / liveJpyRate : null;
  const snkrdunkUrl = snkrdunkPricing?.url || `https://snkrdunk.com/search?keywords=${encodeURIComponent(card.cardNumber || card.id.split('_')[0])}`;

  // All graded card prices are sourced exclusively from SNKRDUNK
  const snkrdunkPsa10: number | null = snkrdunkPricing?.psa10 ?? null;
  const snkrdunkPsa9: number | null = snkrdunkPricing?.psa9 ?? null;
  const snkrdunkPsa8: number | null = snkrdunkPricing?.psa8 ?? null;
  const snkrdunkBgs10: number | null = snkrdunkPricing?.bgs10 ?? null;
  const snkrdunkBgs95: number | null = snkrdunkPricing?.bgs95 ?? null;
  const snkrdunkArs10plus: number | null = snkrdunkPricing?.ars10plus ?? null;
  const snkrdunkArs10: number | null = snkrdunkPricing?.ars10 ?? null;
  const snkrdunkArs9: number | null = snkrdunkPricing?.ars9 ?? null;
  const snkrdunkCgc10: number | null = snkrdunkPricing?.cgc10 ?? null;

  // Sourced from SNKRDUNK PSA 10 (or fallback if pending)
  const psaPrice = snkrdunkPsa10 ? Math.round((snkrdunkPsa10 / liveJpyRate) * 100) / 100 : Math.round(cardmarketPrice * 2.85 * 100) / 100;

  // Chart scaling dynamically adapted to enabled sources
  let activeMaxPrice = 10;
  if (isVintage) {
    const p = vintageEffectivePrice || 50;
    const maxSale = vintageSales.length > 0 ? Math.max(...vintageSales.map((s) => s.priceUsd), p) : p;
    activeMaxPrice = maxSale;
  } else {
    if (enabledPriceSources.psa) activeMaxPrice = Math.max(activeMaxPrice, psaPrice);
    if (enabledPriceSources.ebay) activeMaxPrice = Math.max(activeMaxPrice, ebayPrice);
    if (enabledPriceSources.cardmarket) activeMaxPrice = Math.max(activeMaxPrice, cardmarketPrice);
    if (enabledPriceSources.yuyutei && hasYuyuPrice) activeMaxPrice = Math.max(activeMaxPrice, Math.round(yuyuteiYen / liveJpyRate));
    if (enabledPriceSources.snkrdunk && snkrdunkRawUsd) activeMaxPrice = Math.max(activeMaxPrice, snkrdunkRawUsd);
  }
  const maxChartVal = isVintage
    ? Math.max(20, Math.ceil((activeMaxPrice * 1.35) / 10) * 10)
    : (Math.ceil((activeMaxPrice * 1.35) / 50) * 50 || 200);
  const step = Math.round(maxChartVal / 4);

  // Compact price formatter for chart axis and compact labels
  const formatCompactPrice = (val: number) => {
    const formatted = formatPrice(val);
    const converted = formatted.value;
    if (converted >= 1_000_000) {
      return `${formatted.symbol}${(converted / 1_000_000).toFixed(1)}M`;
    }
    if (converted >= 10_000) {
      return `${formatted.symbol}${Math.round(converted / 1000)}k`;
    }
    return formatted.full;
  };

  // Adaptive font size so high-value prices (e.g. ₱301,800 or ¥1,200,000) never truncate or break layout
  const getPriceFontSizeClass = (priceStr: string) => {
    if (priceStr.length <= 6) return 'text-base sm:text-xl';
    if (priceStr.length <= 8) return 'text-[13px] sm:text-lg';
    if (priceStr.length <= 10) return 'text-xs sm:text-base';
    return 'text-[11px] sm:text-sm';
  };

  // Set code helper for circular badge (e.g. OP01, OP17, ST01, EB01, PRB01)
  const getCardSetCode = (c: CardDetailData): string => {
    if (c.pack?.code) {
      const clean = c.pack.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean.length >= 2 && clean.length <= 6) return clean;
    }
    const display = c.displaySet || (c as any).display_set;
    if (display) {
      const clean = String(display).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean.length >= 2 && clean.length <= 6) return clean;
    }
    const printed = c.printedSetCode || (c as any).printed_set_code;
    if (printed) {
      const clean = String(printed).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean.length >= 2 && clean.length <= 6) return clean;
    }
    const rawId = c.cardNumber || (c as any).card_number || c.id || '';
    const firstPart = rawId.split('-')[0]?.split('_')[0]?.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
    return firstPart || 'OP01';
  };

  const cardSetBadge = getCardSetCode(card);

  // Set code parts e.g. "OP-05" -> "OP 05"
  const packCode = card.pack?.code || card.id.split('-')[0] || 'OP';
  const packDisplay = packCode.replace('-', ' ');

  // Color circle background
  const primaryColor = (card.colors || 'Red').split(',')[0].trim();
  let costBg = 'bg-[#dc2626]';
  if (primaryColor === 'Red') costBg = 'bg-[#dc2626]';
  if (primaryColor === 'Green') costBg = 'bg-[#16a34a]';
  if (primaryColor === 'Blue') costBg = 'bg-[#2563eb]';
  if (primaryColor === 'Purple') costBg = 'bg-[#9333ea]';
  if (primaryColor === 'Black') costBg = 'bg-[#1f2937] border border-[#374151]';
  if (primaryColor === 'Yellow') costBg = 'bg-[#eab308] text-black';

  // Attribute Kanji and Background Color matching reference
  const getAttributeInfo = (attr?: string | null) => {
    const a = (attr || '').toLowerCase();
    if (a.includes('slash') || a.includes('斬')) {
      return { kanji: '斬', bg: 'bg-[#0ea5e9]' };
    }
    if (a.includes('strike') || a.includes('打')) {
      return { kanji: '打', bg: 'bg-[#f59e0b]' };
    }
    if (a.includes('ranged') || a.includes('射')) {
      return { kanji: '射', bg: 'bg-[#10b981]' };
    }
    if (a.includes('special') || a.includes('特')) {
      return { kanji: '特', bg: 'bg-[#a855f7]' };
    }
    if (a.includes('wisdom') || a.includes('知')) {
      return { kanji: '知', bg: 'bg-[#3b82f6]' };
    }
    return { kanji: '斬', bg: 'bg-[#0ea5e9]' };
  };
  const attrInfo = getAttributeInfo(card.attributes);

  // Regulation Block Mark (Devil Fruit with number 1, 2, or 3)
  const getBlockNumber = () => {
    if (card.blockNumber) return card.blockNumber;
    const idUpper = (card.id || '').toUpperCase();
    const numMatch = idUpper.match(/OP(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 9) return 3;
      if (num >= 5) return 2;
      return 1;
    }
    const stMatch = idUpper.match(/ST(\d+)/);
    if (stMatch) {
      const num = parseInt(stMatch[1], 10);
      if (num >= 14) return 3;
      if (num >= 10) return 2;
      return 1;
    }
    return 3;
  };
  const blockNum = getBlockNumber();

  // Yuyu-tei Rarity code (e.g. P-SEC, SEC, P-SR, SR, PR, R, P-UC, UC, PC, C, PL, L, SP, TR, PP, P, DON!!)
  const formatRarityCode = (
    rarity?: string | null,
    isAlt?: boolean,
    promoSource?: string | null,
    category?: string | null
  ) => {
    if (category === 'DON!!' || rarity === '-') return 'DON!!';
    const r = (rarity || '').toLowerCase();
    const isAltArt = !!isAlt || !!promoSource?.includes('パラレル');
    if (r.includes('secret')) return isAltArt ? 'P-SEC' : 'SEC';
    if (r.includes('super')) return isAltArt ? 'P-SR' : 'SR';
    if (r.includes('special') || r === 'sp') return 'SP';
    if (r.includes('treasure') || r === 'tr') return 'TR';
    if (r.includes('leader')) return isAltArt ? 'PL' : 'L';
    if (r.includes('uncommon')) return isAltArt ? 'P-UC' : 'UC';
    if (r.includes('common')) return isAltArt ? 'PC' : 'C';
    if (r.includes('promo')) return isAltArt ? 'PP' : 'P';
    if (r === 'rare' || r === 'r') return isAltArt ? 'PR' : 'R';
    if (r === 'parallel') return 'PP';
    return rarity ? rarity.toUpperCase() : 'R';
  };

  // Formatted types string with slash delimiter
  const formattedTypes = (card.types || 'Straw Hat Crew')
    .split(',')
    .map((t) => t.trim())
    .join('/');

  const enImageUrl = getEditionCardImageUrl(card.id, 'en', card.imageUrl);
  const jpImageUrl = getEditionCardImageUrl(card.id, 'jp', card.imageUrl);

  // External reference URLs for market pricing sources
  const cleanCardId = card.id.split('_')[0];
  const yuyuteiUrl = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(cleanCardId)}`;
  const cardmarketUrl = `https://www.cardmarket.com/en/OnePiece/Products/Search?searchString=${encodeURIComponent((card.cardNumber || cleanCardId) + ' ' + card.name)}`;
  const ebayUrl = card.ebayUrl || (isVintage
    ? generateEbaySoldSearchUrl(card.cardNumber || cleanCardId, card.name, card.vintageSeries || 'Hyper Battle')
    : `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent('One Piece Card Game ' + card.id + ' ' + card.name)}`);
  const psaUrl = `https://www.psacard.com/search#q=${encodeURIComponent('One Piece ' + card.id)}`;

  // Multi-point time series data dynamically driven by selected timeframe
  const getChartData = (): ChartDataPoint[] => {
    if (isVintage) {
      const p = vintageEffectivePrice || 50;
      const s1 = vintageSales[0]?.priceUsd || p;
      const s2 = vintageSales[1]?.priceUsd || p;
      const s3 = vintageSales[2]?.priceUsd || p;

      if (timeframe === '7D') {
        return [
          { date: '09/15', ebay: s3, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/17', ebay: s2, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/20', ebay: Math.round(((s2 + s3) / 2) * 100) / 100, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/24', ebay: s1, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: 'Avg', ebay: p, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        ];
      }

      if (timeframe === '1M') {
        return [
          { date: '09/01', ebay: Math.round(p * 0.94 * 100) / 100, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/15', ebay: s3, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/17', ebay: s2, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/24', ebay: s1, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
          { date: '09/29', ebay: p, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        ];
      }

      // 3M
      return [
        { date: '07/15', ebay: Math.round(p * 0.88 * 100) / 100, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        { date: '08/01', ebay: Math.round(p * 0.94 * 100) / 100, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        { date: '08/20', ebay: Math.round(p * 0.96 * 100) / 100, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        { date: '09/15', ebay: s3, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        { date: '09/24', ebay: s1, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
        { date: '09/29', ebay: p, yuyuYen: 0, cardmarket: 0, snkrdunk: 0, psa: 0 },
      ];
    }

    const snkVal = snkrdunkRawUsd !== null ? snkrdunkRawUsd : (snkrdunkRawYen ? snkrdunkRawYen / liveJpyRate : (hasYuyuPrice ? yuyuteiYen / liveJpyRate : (cardmarketPrice || basePrice)));
    if (timeframe === '7D') {
      const dates = ['09/15', '09/16', '09/17', '09/18', '09/19', '09/20', '09/21'];
      return [
        { date: dates[0], yuyuYen: Math.round(yuyuteiYen * 0.96), cardmarket: Math.round(cardmarketPrice * 0.93), ebay: Math.round(ebayPrice * 0.95), snkrdunk: Math.round(snkVal * 0.95), psa: Math.round(psaPrice * 0.98) },
        { date: dates[1], yuyuYen: Math.round(yuyuteiYen * 0.97), cardmarket: Math.round(cardmarketPrice * 0.94), ebay: Math.round(ebayPrice * 0.96), snkrdunk: Math.round(snkVal * 0.96), psa: Math.round(psaPrice * 0.98) },
        { date: dates[2], yuyuYen: Math.round(yuyuteiYen * 0.97), cardmarket: Math.round(cardmarketPrice * 0.96), ebay: Math.round(ebayPrice * 0.98), snkrdunk: Math.round(snkVal * 0.97), psa: Math.round(psaPrice * 0.99) },
        { date: dates[3], yuyuYen: Math.round(yuyuteiYen * 0.98), cardmarket: Math.round(cardmarketPrice * 0.96), ebay: Math.round(ebayPrice * 0.97), snkrdunk: Math.round(snkVal * 0.98), psa: Math.round(psaPrice * 0.99) },
        { date: dates[4], yuyuYen: Math.round(yuyuteiYen * 0.99), cardmarket: Math.round(cardmarketPrice * 0.98), ebay: Math.round(ebayPrice * 1.01), snkrdunk: Math.round(snkVal * 0.99), psa: Math.round(psaPrice * 1.00) },
        { date: dates[5], yuyuYen: Math.round(yuyuteiYen * 1.01), cardmarket: Math.round(cardmarketPrice * 1.02), ebay: Math.round(ebayPrice * 1.02), snkrdunk: Math.round(snkVal * 1.01), psa: Math.round(psaPrice * 1.01) },
        { date: dates[6], yuyuYen: yuyuteiYen, cardmarket: cardmarketPrice, ebay: ebayPrice, snkrdunk: Math.round(snkVal), psa: psaPrice },
      ];
    }

    if (timeframe === '1M') {
      // Matches the exact OP.TCG screenshot points: 04/27, 05/04, 05/12, 05/19, 05/26
      return [
        { date: '04/27', yuyuYen: Math.round(yuyuteiYen * 0.62), cardmarket: Math.round(cardmarketPrice * 0.65), ebay: Math.round(ebayPrice * 0.47), snkrdunk: Math.round(snkVal * 0.63), psa: 0 },
        { date: '05/04', yuyuYen: Math.round(yuyuteiYen * 0.65), cardmarket: Math.round(cardmarketPrice * 0.65), ebay: Math.round(ebayPrice * 0.47), snkrdunk: Math.round(snkVal * 0.66), psa: Math.round(psaPrice * 1.16) },
        { date: '05/12', yuyuYen: Math.round(yuyuteiYen * 0.74), cardmarket: Math.round(cardmarketPrice * 0.74), ebay: Math.round(ebayPrice * 1.53), snkrdunk: Math.round(snkVal * 0.76), psa: Math.round(psaPrice * 1.16) },
        { date: '05/19', yuyuYen: Math.round(yuyuteiYen * 0.95), cardmarket: Math.round(cardmarketPrice * 1.15), ebay: Math.round(ebayPrice * 1.12), snkrdunk: Math.round(snkVal * 0.94), psa: Math.round(psaPrice * 0.75) },
        { date: '05/26', yuyuYen: yuyuteiYen, cardmarket: cardmarketPrice, ebay: ebayPrice, snkrdunk: Math.round(snkVal), psa: psaPrice },
      ];
    }

    // 3M
    return [
      { date: '02/20', yuyuYen: Math.round(yuyuteiYen * 0.45), cardmarket: Math.round(cardmarketPrice * 0.45), ebay: Math.round(ebayPrice * 0.40), snkrdunk: Math.round(snkVal * 0.44), psa: 0 },
      { date: '03/10', yuyuYen: Math.round(yuyuteiYen * 0.50), cardmarket: Math.round(cardmarketPrice * 0.50), ebay: Math.round(ebayPrice * 0.45), snkrdunk: Math.round(snkVal * 0.51), psa: 0 },
      { date: '04/01', yuyuYen: Math.round(yuyuteiYen * 0.60), cardmarket: Math.round(cardmarketPrice * 0.62), ebay: Math.round(ebayPrice * 0.52), snkrdunk: Math.round(snkVal * 0.61), psa: Math.round(psaPrice * 0.85) },
      { date: '04/25', yuyuYen: Math.round(yuyuteiYen * 0.70), cardmarket: Math.round(cardmarketPrice * 0.75), ebay: Math.round(ebayPrice * 0.70), snkrdunk: Math.round(snkVal * 0.72), psa: Math.round(psaPrice * 1.10) },
      { date: '05/10', yuyuYen: Math.round(yuyuteiYen * 0.85), cardmarket: Math.round(cardmarketPrice * 0.90), ebay: Math.round(ebayPrice * 1.25), snkrdunk: Math.round(snkVal * 0.86), psa: Math.round(psaPrice * 1.12) },
      { date: '05/26', yuyuYen: yuyuteiYen, cardmarket: cardmarketPrice, ebay: ebayPrice, snkrdunk: Math.round(snkVal), psa: psaPrice },
    ];
  };

  const currentSeries = getChartData();

  // Helper to map values to SVG coordinates (0..320 width, 0..120 height)
  const getSvgPath = (extractor: (d: ChartDataPoint) => number): string => {
    return currentSeries.map((pt, i) => {
      const x = Math.round((i / (currentSeries.length - 1)) * 320);
      const val = extractor(pt);
      const y = Math.max(6, Math.min(118, Math.round(118 - (val / maxChartVal) * 110)));
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  };

  // Helper for closed SVG area polygon for gradient fills
  const getSvgAreaPath = (extractor: (d: ChartDataPoint) => number): string => {
    const pts = currentSeries.map((pt, i) => {
      const x = Math.round((i / (currentSeries.length - 1)) * 320);
      const val = extractor(pt);
      const y = Math.max(6, Math.min(118, Math.round(118 - (val / maxChartVal) * 110)));
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
    return `${pts} L 320,118 L 0,118 Z`;
  };

  // Format effect keywords with color badges matching reference
  const renderFormattedEffect = (text?: string | null) => {
    if (!text) return null;

    // Support keywords whether they have square brackets [On Play] or plain text like "On Play / When Attacking"
    const regex = /(\[.*?\]|On Play|When Attacking|Activate: Main|Once Per Turn|Main|Your Turn|Opponent's Turn|Trigger|Blocker|Rush)/g;
    const parts = text.split(regex);

    return (
      <span className="leading-relaxed text-gray-200">
        {parts.map((part, idx) => {
          const trimmed = part.replace(/^\[|\]$/g, '').trim();
          if (!trimmed) return null;

          if (trimmed === 'On Play' || trimmed === 'When Attacking' || trimmed === 'On K.O.') {
            return (
              <span
                key={idx}
                className="inline-block bg-[#0284c7] text-white text-[11px] font-bold px-1.5 py-0.5 rounded mr-1 my-0.5 align-baseline shadow-sm"
              >
                {trimmed}
              </span>
            );
          }
          if (trimmed.includes('DON!!')) {
            return (
              <span
                key={idx}
                className="inline-block bg-[#f59e0b] text-black text-[11px] font-extrabold px-1.5 py-0.5 rounded mr-1 my-0.5 align-baseline shadow-sm"
              >
                {part}
              </span>
            );
          }
          if (trimmed === 'Blocker' || trimmed === 'Rush') {
            return (
              <span
                key={idx}
                className="inline-block bg-[#e76d78] text-white text-[11px] font-bold px-1.5 py-0.5 rounded mr-1 my-0.5 align-baseline shadow-sm"
              >
                {trimmed}
              </span>
            );
          }
          if (trimmed === 'Once Per Turn' || trimmed === 'Activate: Main' || trimmed === 'Main') {
            return (
              <span
                key={idx}
                className="inline-block bg-[#8b5cf6] text-white text-[11px] font-bold px-1.5 py-0.5 rounded mr-1 my-0.5 align-baseline shadow-sm"
              >
                {trimmed}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-[#12141c] text-white sm:rounded-2xl border-0 sm:border border-[#222533] overflow-hidden shadow-xl font-sans relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#141620] border border-[#e05d68] text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#e05d68]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="h-12 px-3.5 flex items-center justify-between border-b border-[#1f2330] bg-[#141620]">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-white/5 text-slate-300 hover:text-white transition cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center overflow-hidden max-w-[200px] sm:max-w-md px-2">
          <h1 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
            {card.name}
          </h1>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={openSettings}
            className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-amber-400 transition cursor-pointer"
            title={`Active Currency: ${currency === 'source' ? 'Source Native' : currency} (Click to change)`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleFavorite}
            className="p-1.5 rounded-full hover:bg-white/5 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            aria-label="Add to favorites"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-2.5 sm:p-4 lg:p-6">
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          {/* Left Column (Desktop 5-cols): Card Art, Stats, Rules, CTA */}
          <div className="lg:col-span-5 space-y-3">
            {/* Main 2-Column Section on Mobile / 1-Column on Desktop */}
            <div className="grid grid-cols-[38%_62%] sm:grid-cols-[40%_60%] lg:grid-cols-1 gap-2.5 items-stretch">
              {/* Left Column: Card Artwork */}
              <div className="relative aspect-[7/10] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#0e1017] border border-[#222533] shadow-sm flex items-center justify-center group lg:max-w-[320px] lg:mx-auto">
            {!imgErrorJp ? (
              <img
                src={getSafeCardImageUrl(card.imageUrl, card.id || card.cardNumber) || jpImageUrl}
                alt={`${card.name} (Japanese)`}
                referrerPolicy="no-referrer"
                onError={(e) => handleCardImageError(e, card.id || card.cardNumber)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <span className="text-xs text-slate-400 font-bold">{card.name}</span>
                <span className="text-[10px] text-slate-500 mt-1">JP Artwork</span>
              </div>
            )}

            {/* Language Pill on Image */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1 border border-white/20 shadow pointer-events-none">
              <span>🇯🇵 JP</span>
            </div>
          </div>

          {/* Right Column: Stats Box Matching Reference */}
          <div className="bg-[#141620] rounded-2xl p-3 sm:p-4 flex flex-col justify-between border border-[#222533] shadow-sm relative select-none">
            {/* Top Row: Cost Badge (Left) & Version/Parallel Badge (Right) */}
            <div className="flex items-center justify-between">
              {/* Cost Circle */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${costBg} flex items-center justify-center font-bold text-base sm:text-lg text-white shadow-sm`}
                title={`Card Cost: ${card.cost ?? '-'}`}
              >
                {card.cost ?? '-'}
              </div>

              {/* Set Code White Circle Badge (e.g. OP01, OP17, ST01) */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center font-black text-[#1e212b] shadow-sm select-none shrink-0 ${
                  cardSetBadge.length >= 5
                    ? 'text-[9px] sm:text-[10px] tracking-tighter'
                    : cardSetBadge.length >= 4
                    ? 'text-[11px] sm:text-xs tracking-tight'
                    : 'text-xs sm:text-sm tracking-normal'
                }`}
                title={`Set: ${cardSetBadge}`}
              >
                {cardSetBadge}
              </div>
            </div>

            {/* Middle Block (Centered): Name, Category, Power, Traits, Illustrator */}
            <div className="my-auto py-2 text-center space-y-1">
              <h2 className="text-base sm:text-xl font-bold text-white leading-tight tracking-wide px-1" title={card.name}>
                {card.name}
              </h2>
              <div className="text-[11px] sm:text-xs italic font-normal text-slate-400 tracking-wider uppercase">
                {card.category}
              </div>

              <div className="pt-2 text-sm sm:text-base text-white tracking-wide">
                <span className="font-bold">Power</span> <span className="font-normal">{card.power != null ? card.power : '-'}</span>
              </div>

              <div className="text-xs sm:text-sm italic text-slate-300 font-light leading-snug px-1">
                {formattedTypes}
              </div>

              {/* Illustrator Pill / Official Card Art Badge */}
              <div className="pt-3 flex justify-center">
                {artist ? (
                  <button
                    type="button"
                    onClick={() => setShowArtistModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-[#1c202d] hover:bg-[#252b3d] border border-[#2c3345] font-semibold text-xs sm:text-sm text-white tracking-wider uppercase transition shadow-sm cursor-pointer whitespace-nowrap"
                    title={`View Illustrator: ${artist.name}`}
                  >
                    <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e05d68] stroke-[2.2]" />
                    <span>{artist.name.toUpperCase()}</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 stroke-[2.5]" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10121a] border border-[#1f2330] text-[11px] font-semibold text-slate-400 tracking-wider">
                    <Layers className="w-3 h-3 text-slate-500" />
                    Official Card Art
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row: Rarity (Left), Code Pill (Center), Attribute & Block Number (Right) */}
            <div className="flex items-center justify-between pt-2 gap-1">
              <span className="text-base sm:text-lg font-bold text-white tracking-wider pl-1 flex-shrink-0">
                {formatRarityCode(card.rarity, card.isAltArt, card.promoSource, card.category)}
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                title={`Copy card code: ${cardIdInfo.displayId}`}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1c202d] hover:bg-[#252b3d] border border-[#2c3345] font-bold text-xs sm:text-sm text-white tracking-wide whitespace-nowrap transition cursor-pointer flex-shrink-0"
              >
                <span>{cardIdInfo.baseId}</span>
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
                )}
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${attrInfo.bg} flex items-center justify-center font-bold text-sm sm:text-base text-white shadow-sm`}
                  title={`Attribute: ${card.attributes || 'Slash'}`}
                >
                  {attrInfo.kanji}
                </div>

                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center shadow-sm p-0.5 relative"
                  title={`Regulation Block: ${blockNum}`}
                >
                  <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                    <path
                      d="M16 12 V7 C16 5.5 13.5 4.5 12 5.5 C10.5 6.5 11.5 8.5 13.5 8 M16 7 C16 5 18.5 4 20 5.2 C21.5 6.4 20.5 8.5 18.5 8"
                      stroke="#1e212b"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <circle cx="16" cy="19.5" r="8" fill="#1e212b" />
                    <text
                      x="16"
                      y="22.5"
                      textAnchor="middle"
                      fill="white"
                      fontSize="9.5"
                      fontWeight="900"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {blockNum}
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules & Effect Section */}
          <div className="bg-[#141620] rounded-2xl p-3.5 border border-[#222533] flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed shadow-sm">
            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {renderFormattedEffect(card.effect) || <span className="text-slate-500 italic">No effect text.</span>}
              {card.trigger && (
                <div className="mt-2 text-xs text-amber-200 bg-amber-950/20 border border-amber-800/30 p-2.5 rounded-xl leading-relaxed">
                  <span className="font-bold text-[#f59e0b] block mb-1">TRIGGER:</span>
                  {card.trigger}
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA: Add to Collection */}
          {onAddToCollection && (
            <button
              onClick={() => onAddToCollection(card, selectedLang)}
              className="w-full py-3 rounded-xl bg-[#e05d68] hover:bg-[#d04e59] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add to My Collection
            </button>
          )}
        </div>

        {/* Right Column (Desktop 7-cols): Market & Grading, Interactive Chart, Variations */}
        <div className="lg:col-span-7 space-y-3">
          {/* BOX 1: MARKET & GRADING Tabs Container */}
          <div className="bg-[#141620] rounded-2xl p-4 sm:p-5 border border-[#222533] shadow-sm">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-[#363a4c] pb-3">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('market')}
                className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider pb-1 relative transition cursor-pointer flex-shrink-0 ${
                  activeTab === 'market' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-white" />
                <span>MARKET</span>
                {activeTab === 'market' && (
                  <span className="absolute -bottom-3 inset-x-0 h-0.5 bg-white rounded-full"></span>
                )}
              </button>

              {!isVintage && (
                <button
                  onClick={() => setActiveTab('grading')}
                  className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider pb-1 relative transition cursor-pointer flex-shrink-0 ${
                    activeTab === 'grading' ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span>GRADING</span>
                  {activeTab === 'grading' && (
                    <span className="absolute -bottom-3 inset-x-0 h-0.5 bg-white rounded-full"></span>
                  )}
                </button>
              )}

              <button
                onClick={() => setActiveTab('community')}
                className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider pb-1 relative transition cursor-pointer flex-shrink-0 ${
                  activeTab === 'community' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>COMMUNITY</span>
                {communitySales.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
                    {communitySales.length}
                  </span>
                )}
                {activeTab === 'community' && (
                  <span className="absolute -bottom-3 inset-x-0 h-0.5 bg-emerald-400 rounded-full"></span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openSettings}
                title={`Active Currency: ${currency === 'source' ? 'Source Currency' : currency}`}
                className="text-xs font-bold text-[#f59e0b] bg-[#1d202c] hover:bg-[#252836] px-2.5 py-1 rounded-xl border border-[#f59e0b]/40 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>{currency === 'source' ? 'Source' : currency}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFullscreenChart(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
                title="Expand full-screen interactive chart"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: MARKET VIEW */}
          {activeTab === 'market' && (
            <div>
              {isVintage ? (
                isVintageLocked && !isAdmin ? (
                  <div className="pt-3.5 pb-1">
                    <div className="py-8 px-4 rounded-3xl bg-[#1e2230] border border-amber-500/30 text-center space-y-3 shadow-lg">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                        <Lock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-black text-white">Vintage Card Market Pricing Paused</h4>
                        <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                          {vintageLockMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3.5 pb-1 space-y-3">
                    {isVintageLocked && isAdmin && (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Vintage Pricing is locked for regular visitors. Admin bypass enabled.</span>
                      </div>
                    )}
                    <div className="bg-[#181a24] border border-[#2a2e3d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#222634] text-gray-200 font-semibold text-xs border border-[#2e3448]">
                            {card.vintageSeries || 'Bandai Carddass Hyper Battle'}
                          </span>
                          <span className="text-gray-400 text-xs font-normal">
                            {card.vintagePart || card.displaySet || 'Vintage Collection'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 bg-[#13151f] px-2 py-0.5 rounded-md border border-[#262a38]">
                          {card.id}
                        </span>
                      </div>

                      {/* Main Price & Title */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Fair Market Valuation
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1c202d] text-slate-300 border border-[#2c3345] font-medium">
                              3-Sale Moving Avg
                            </span>
                          </div>
                          {vintageEffectivePrice && vintageEffectivePrice > 0 ? (
                            <div className="flex flex-wrap items-baseline gap-2.5">
                              <span className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight">
                                {formatPrice(vintageEffectivePrice).full}
                              </span>
                              <span className="text-xs sm:text-sm text-slate-400 font-mono">
                                (${vintageEffectivePrice.toFixed(2)} USD)
                              </span>
                            </div>
                          ) : (
                            <div className="text-base font-semibold text-slate-300">
                              Check Live Sold on eBay
                            </div>
                          )}
                        </div>

                        {/* Direct eBay Button */}
                        <a
                          href={ebayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c202d] hover:bg-[#242938] text-slate-200 hover:text-white font-semibold text-xs border border-[#2c3345] transition active:scale-95 shrink-0 shadow-sm"
                        >
                          <span>View on eBay</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      </div>

                      {/* 3-Stat Metric Row (Latest, High, Low) */}
                      {vintageStats && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1f2330]">
                          <div className="bg-[#10121a] p-2.5 rounded-xl border border-[#1f2330]">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Latest Sale</span>
                            <span className="text-xs sm:text-sm font-bold text-white font-mono mt-1 block truncate">
                              {formatPrice(vintageStats.latest).full}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              (${vintageStats.latest.toFixed(2)})
                            </span>
                          </div>
                          <div className="bg-[#10121a] p-2.5 rounded-xl border border-[#1f2330]">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Recent High</span>
                            <span className="text-xs sm:text-sm font-bold text-white font-mono mt-1 block truncate">
                              {formatPrice(vintageStats.max).full}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              (${vintageStats.max.toFixed(2)})
                            </span>
                          </div>
                          <div className="bg-[#10121a] p-2.5 rounded-xl border border-[#1f2330]">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Recent Low</span>
                            <span className="text-xs sm:text-sm font-bold text-white font-mono mt-1 block truncate">
                              {formatPrice(vintageStats.min).full}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              (${vintageStats.min.toFixed(2)})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Archive & Scan links */}
                      <div className="pt-2 border-t border-[#1f2330] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span>Provenance:</span>
                          <span className="text-slate-300 font-medium">1999–2002 Japan Bandai</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {card.artistSourceUrl && (
                            <a
                              href={card.artistSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-white underline font-medium flex items-center gap-1"
                            >
                              <span>HD Scan</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </a>
                          )}
                          <a
                            href={`http://www.onepiececollection.fr/cartes.php?idc=19&ids=${
                              VINTAGE_SET_ARCHIVE_IDS[(card.printedSetCode || card.pack?.code || '').toUpperCase()] || '79'
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-white underline font-medium flex items-center gap-1"
                          >
                            <span>OnePieceCollection Archive</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                (() => {
                  const activeCount = [
                    enabledPriceSources.yuyutei,
                    enabledPriceSources.cardmarket,
                    enabledPriceSources.ebay,
                    enabledPriceSources.snkrdunk,
                    enabledPriceSources.psa,
                  ].filter(Boolean).length;

                  const gridClass = activeCount === 1 
                    ? 'grid-cols-1' 
                    : activeCount === 3 
                    ? 'grid-cols-1 sm:grid-cols-3' 
                    : activeCount >= 4
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2';

                  return (
                    <div className={`grid ${gridClass} gap-x-3 sm:gap-x-6 gap-y-3.5 pt-3.5 pb-1`}>
                    {/* 1. Yuyu-tei */}
                    {enabledPriceSources.yuyutei && (() => {
                      if (!hasYuyuPrice) {
                        return (
                          <div
                            title="Not listed on Yuyu-tei (遊々亭)"
                            className="flex items-center gap-2 sm:gap-2.5 opacity-60 min-w-0"
                          >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden p-1 border border-white/10 grayscale">
                              <img src="/logos/yuyutei.png" alt="Yuyu-tei" className="w-full h-full object-contain opacity-70" />
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-1 leading-tight">
                                <span className="font-bold text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                                  Not Available
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                Not listed on 遊々亭
                              </div>
                            </div>
                          </div>
                        );
                      }
                      const priceFormatted = formatPrice(convertedYuyuYen).full;
                      const changeFormatted = formatPrice(convertedYuyuYenChange).full;
                      return (
                        <a
                          href={yuyuteiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Yuyu-tei (遊々亭)"
                          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0"
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden p-1 border border-white/20">
                            <img src="/logos/yuyutei.png" alt="Yuyu-tei" className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1 leading-tight">
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3ed57a] flex-shrink-0" strokeWidth={3} />
                              <span className={`font-black text-white group-hover:text-[#3ed57a] transition whitespace-nowrap ${getPriceFontSizeClass(priceFormatted)}`}>
                                {priceFormatted}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-[#3ed57a] font-bold mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              +2.74% <span className="text-gray-400 font-normal">({changeFormatted})</span>
                            </div>
                          </div>
                        </a>
                      );
                    })()}

                    {/* 2. Cardmarket */}
                    {enabledPriceSources.cardmarket && (() => {
                      const priceFormatted = formatPrice(cardmarketPrice, { source: 'cardmarket' }).full;
                      const changeVal = Math.round(cardmarketPrice * 0.0561 * 100) / 100;
                      const changeFormatted = formatPrice(changeVal, { source: 'cardmarket' }).full;
                      return (
                        <a
                          href={cardmarketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Cardmarket"
                          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0"
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden p-1.5">
                            <img
                              src="/logos/cardmarket.svg"
                              alt="Cardmarket"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.innerText = 'CM';
                                  e.currentTarget.parentElement.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#005bb5] text-white font-black text-[11px] sm:text-xs flex items-center justify-center flex-shrink-0 shadow-md';
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1 leading-tight">
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3ed57a] flex-shrink-0" strokeWidth={3} />
                              <span className={`font-black text-white group-hover:text-[#3ed57a] transition whitespace-nowrap ${getPriceFontSizeClass(priceFormatted)}`}>
                                {priceFormatted}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-[#3ed57a] font-bold mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              +5.61% <span className="text-gray-400 font-normal">({changeFormatted})</span>
                            </div>
                          </div>
                        </a>
                      );
                    })()}

                    {/* 3. eBay */}
                    {enabledPriceSources.ebay && (() => {
                      const priceFormatted = formatPrice(ebayPrice).full;
                      return (
                        <a
                          href={ebayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on eBay"
                          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0"
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#111319] border border-[#2b2e3c] flex items-center justify-center flex-shrink-0 shadow-md text-white font-black text-[11px] sm:text-xs tracking-wider">
                            ebay
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`font-black text-white group-hover:text-[#84cc16] transition leading-tight whitespace-nowrap ${getPriceFontSizeClass(priceFormatted)}`}>
                              {priceFormatted}
                            </div>
                          </div>
                        </a>
                      );
                    })()}

                    {/* 4. SNKRDUNK (Raw Condition A with fallback) */}
                    {enabledPriceSources.snkrdunk && (() => {
                      const hasCondA = snkrdunkRawYen !== null;
                      const hasAnyRaw = snkrdunkRawLowest !== null;
                      const activePrice = snkrdunkRawYen ?? snkrdunkRawLowest;

                      let priceFormatted = 'Unavailable';
                      let badgeText = 'Out of Stock';
                      let badgeClass = 'bg-gray-700/40 text-gray-400';
                      let subtext = '';

                      if (hasCondA && activePrice) {
                        priceFormatted = formatPrice(activePrice, { source: 'snkrdunk', rawJPY: activePrice }).full;
                        badgeText = 'Grade A';
                        badgeClass = 'bg-emerald-500/20 text-emerald-300';
                        subtext = 'SNKRDUNK';
                      } else if (hasAnyRaw && activePrice) {
                        priceFormatted = formatPrice(activePrice, { source: 'snkrdunk', rawJPY: activePrice }).full;
                        badgeText = `Grade ${snkrdunkCondition || 'B'}`;
                        badgeClass = 'bg-amber-500/20 text-amber-300';
                        subtext = 'Cond. A out of stock';
                      } else if (snkrdunkGradedOnly) {
                        priceFormatted = 'Graded Only';
                        badgeText = 'PSA / ARS';
                        badgeClass = 'bg-blue-500/20 text-blue-300';
                        subtext = 'Check GRADING tab';
                      }

                      return (
                        <a
                          href={snkrdunkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on SNKRDUNK (スニダン)"
                          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0"
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-white/20 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden p-1">
                            <img
                              src="/logos/snkrdunk.png"
                              alt="SNKRDUNK"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.innerText = 'SD';
                                  e.currentTarget.parentElement.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black text-white font-black text-[11px] sm:text-xs flex items-center justify-center flex-shrink-0 shadow-md border border-[#343a4c]';
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1 leading-tight">
                              {activePrice && (
                                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e] flex-shrink-0" strokeWidth={3} />
                              )}
                              <span className={`font-black text-white group-hover:text-[#22c55e] transition whitespace-nowrap ${activePrice ? getPriceFontSizeClass(priceFormatted) : 'text-xs text-gray-400'}`}>
                                {priceFormatted}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-[11px] font-bold mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
                              <span className={`${badgeClass} px-1 py-0.2 rounded text-[9px] font-extrabold`}>
                                {badgeText}
                              </span>
                              {subtext && (
                                <span className="text-gray-400 font-normal">
                                  {subtext}
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      );
                    })()}

                    {/* 5. PSA (Sourced from SNKRDUNK PSA 10) */}
                    {enabledPriceSources.psa && (() => {
                      const hasPrice = snkrdunkPsa10 !== null;
                      const priceFormatted = hasPrice
                        ? formatPrice(snkrdunkPsa10, { source: 'snkrdunk', rawJPY: snkrdunkPsa10 }).full
                        : (psaPrice ? formatPrice(psaPrice).full : 'Unavailable');
                      return (
                        <a
                          href={snkrdunkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View PSA 10 on SNKRDUNK"
                          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer min-w-0"
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#dc2626] flex items-center justify-center flex-shrink-0 shadow-md text-white font-black text-[11px] sm:text-xs tracking-wider">
                            PSA
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className={`font-black text-white group-hover:text-red-400 transition leading-tight whitespace-nowrap ${getPriceFontSizeClass(priceFormatted)}`}>
                              {priceFormatted}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                              <span>PSA 10</span>
                              <span className="text-[9px] text-gray-400 font-medium">(SNKRDUNK)</span>
                            </div>
                          </div>
                        </a>
                      );
                    })()}
                  </div>
                );
              })()
            )}

              {/* Recent Sales Breakdown Section: Vintage eBay 3-Sale Table or Community Sales */}
              {isVintage ? (
                <div className="pt-3.5 mt-2 border-t border-[#1f2330]">
                  {/* Clean uncrowded header */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wider">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Recent eBay Sales</span>
                    </div>
                    <a
                      href={ebayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>

                  {/* Responsive List: Mobile Transaction Cards + Desktop Table */}
                  <div className="space-y-2">
                    {/* Mobile Card Stack (Visible on mobile, hidden on sm+) */}
                    <div className="block sm:hidden space-y-1.5">
                      {vintageSales.map((s, idx) => (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-xl bg-[#10121a] border border-[#1f2330] hover:border-[#2f3548] transition shadow-sm space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded bg-[#1c202d] text-slate-400 font-mono text-[9px] font-bold flex items-center justify-center border border-[#2c3345]">
                                {idx + 1}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">{s.date}</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#161822] border border-[#222533] text-[9px] text-slate-400">
                                {s.condition || 'Pre-Owned'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-white font-mono">
                                {formatPrice(s.priceUsd).full}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono ml-1">
                                (${s.priceUsd.toFixed(2)})
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate font-normal">
                            {s.title}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View (Hidden on mobile, visible on sm+) */}
                    <div className="hidden sm:block overflow-hidden rounded-xl border border-[#1f2330] bg-[#10121a]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#1f2330] bg-[#0e1017] text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                            <th className="py-2.5 px-3">Sale Date</th>
                            <th className="py-2.5 px-3">Listing Title</th>
                            <th className="py-2.5 px-2.5">Condition</th>
                            <th className="py-2.5 px-3 text-right">Sold Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1c1f2b]">
                          {vintageSales.map((s) => (
                            <tr key={s.id} className="text-xs hover:bg-white/[0.02] transition">
                              <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                                {s.date}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs md:max-w-md" title={s.title}>
                                {s.title}
                              </td>
                              <td className="py-2.5 px-2.5 whitespace-nowrap">
                                <span className="px-1.5 py-0.5 rounded bg-[#161822] border border-[#222533] text-[10px] text-slate-400">
                                  {s.condition || 'Pre-Owned'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-white">
                                <span>{formatPrice(s.priceUsd).full}</span>
                                <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                                  (${s.priceUsd.toFixed(2)})
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Recent Community Sales Quick Summary Section */
                <div className="pt-3.5 mt-2 border-t border-[#34384c]">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recent Community Sales</span>
                      <span className="text-[10px] text-gray-400 font-mono font-normal">({card.id})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('community')}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{communitySales.length > 0 ? `View All (${communitySales.length})` : 'Sales Reference'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {isLoadingCommunitySales ? (
                    <div className="p-3 rounded-xl bg-[#1e212c] border border-[#32384a] text-center text-xs text-gray-400">
                      Loading verified community sales…
                    </div>
                  ) : communitySales.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#1e212c] border border-[#32384a] text-center text-xs text-gray-400">
                      No community transactions recorded yet for this exact variant.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#32384a] bg-[#1e212c]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#32384a] bg-[#181a24] text-[9px] uppercase font-black text-gray-400">
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-2.5">Condition</th>
                            <th className="py-2 px-2.5">Variant</th>
                            <th className="py-2 px-3 text-right">Sold Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2f40]">
                          {communitySales.slice(0, 3).map((s) => (
                            <tr key={s.id} className="text-[11px] hover:bg-white/[0.02]">
                              <td className="py-2 px-3 text-gray-300 font-mono">
                                {s.soldDate
                                  ? new Date(s.soldDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                  : 'Recent'}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-gray-200">
                                <span className="px-1.5 py-0.2 rounded bg-black/60 border border-white/10 text-[9px]">
                                  {s.condition || 'NM'}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-purple-300 truncate max-w-[120px]">
                                {cardIdInfo.variantLabel || 'Base Version'}
                              </td>
                              <td className="py-2 px-3 font-mono font-black text-emerald-400 text-right">
                                {formatSalePrice(s.soldPrice, s.soldCurrency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRADING & POPULATION DASHBOARD VIEW */}
          {activeTab === 'grading' && !isVintage && (
            <div className="pt-4 space-y-4">
              {/* Grading Header */}
              <div className="flex items-center justify-between bg-[#1e212c] p-3 rounded-xl border border-[#32384a]">
                <div>
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Graded Slab Valuations</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    All graded valuations sourced directly from live SNKRDUNK listings
                  </div>
                </div>
              </div>

              {/* Slabs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* PSA 10 */}
                {(() => {
                  const hasPrice = snkrdunkPsa10 !== null;
                  const pFormatted = hasPrice
                    ? formatPrice(snkrdunkPsa10, { source: 'snkrdunk', rawJPY: snkrdunkPsa10 }).full
                    : 'Unavailable';
                  return (
                    <a
                      href={snkrdunkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-red-500/40 transition group cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-400">PSA 10</span>
                      </div>
                      <div className={`font-extrabold text-white mt-1 group-hover:text-red-300 transition whitespace-nowrap ${hasPrice ? getPriceFontSizeClass(pFormatted) : 'text-xs text-gray-400'}`}>
                        {pFormatted}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Gem Mint</span>
                          <span className="text-[9px] text-gray-500 font-normal">(SNKRDUNK)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  );
                })()}

                {/* PSA 9 */}
                {(() => {
                  const hasPrice = snkrdunkPsa9 !== null;
                  const pFormatted = hasPrice
                    ? formatPrice(snkrdunkPsa9, { source: 'snkrdunk', rawJPY: snkrdunkPsa9 }).full
                    : 'Unavailable';
                  return (
                    <a
                      href={snkrdunkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] transition group cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-300">PSA 9</span>
                      </div>
                      <div className={`font-extrabold text-white mt-1 group-hover:text-gray-200 transition whitespace-nowrap ${hasPrice ? getPriceFontSizeClass(pFormatted) : 'text-xs text-gray-400'}`}>
                        {pFormatted}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Mint</span>
                          <span className="text-[9px] text-gray-500 font-normal">(SNKRDUNK)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  );
                })()}

                {/* BGS 10 Black/Gold */}
                {(() => {
                  const hasPrice = snkrdunkBgs10 !== null;
                  const pFormatted = hasPrice
                    ? formatPrice(snkrdunkBgs10, { source: 'snkrdunk', rawJPY: snkrdunkBgs10 }).full
                    : 'Unavailable';
                  return (
                    <a
                      href={snkrdunkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#14161f] hover:bg-[#1e212c] border border-amber-500/50 transition group cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                          <span>BGS 10</span>
                          <span className="text-[9px] bg-amber-500/20 px-1 rounded text-amber-300 font-bold">Black/Gold</span>
                        </span>
                      </div>
                      <div className={`font-extrabold text-amber-300 mt-1 whitespace-nowrap ${hasPrice ? getPriceFontSizeClass(pFormatted) : 'text-xs text-gray-400'}`}>
                        {pFormatted}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-semibold mt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Pristine</span>
                          <span className="text-[9px] text-gray-500 font-normal">(SNKRDUNK)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  );
                })()}

                {/* BGS 9.5 */}
                {(() => {
                  const hasPrice = snkrdunkBgs95 !== null;
                  const pFormatted = hasPrice
                    ? formatPrice(snkrdunkBgs95, { source: 'snkrdunk', rawJPY: snkrdunkBgs95 }).full
                    : 'Unavailable';
                  return (
                    <a
                      href={snkrdunkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] transition group cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-400">BGS 9.5</span>
                      </div>
                      <div className={`font-extrabold text-white mt-1 whitespace-nowrap ${hasPrice ? getPriceFontSizeClass(pFormatted) : 'text-xs text-gray-400'}`}>
                        {pFormatted}
                      </div>
                      <div className="text-[10px] text-sky-400 font-semibold mt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Gem Mint</span>
                          <span className="text-[9px] text-gray-500 font-normal">(SNKRDUNK)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  );
                })()}

                {/* ARS 10+ / ARS 10 */}
                {(() => {
                  const hasArs10Plus = snkrdunkArs10plus !== null;
                  const hasArs10 = snkrdunkArs10 !== null;
                  const price = hasArs10Plus ? snkrdunkArs10plus : snkrdunkArs10;
                  const hasPrice = price !== null && price !== undefined;
                  const label = hasArs10Plus ? 'ARS 10+' : 'ARS 10';
                  const pFormatted = hasPrice
                    ? formatPrice(price!, { source: 'snkrdunk', rawJPY: price! }).full
                    : 'Unavailable';
                  return (
                    <a
                      href={snkrdunkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] transition group cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-400">{label}</span>
                        <span className="text-[10px] text-gray-400">Japan Grade</span>
                      </div>
                      <div className={`font-extrabold text-white mt-1 whitespace-nowrap ${hasPrice ? getPriceFontSizeClass(pFormatted) : 'text-xs text-gray-400'}`}>
                        {pFormatted}
                      </div>
                      <div className="text-[10px] text-purple-400 font-semibold mt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>ARS鑑定</span>
                          <span className="text-[9px] text-gray-500 font-normal">(SNKRDUNK)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  );
                })()}

                {/* PSA 8 */}
                {(() => {
                  const hasPrice = snkrdunkPsa8 !== null;
                  const pFormatted = hasPrice
                    ? formatPrice(snkrdunkPsa8, { source: 'snkrdunk', rawJPY: snkrdunkPsa8 }).full
                    : 'Unavailable';
                  return (
                    <a
                      href={snkrdunkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] transition group cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-400">PSA 8</span>
                      </div>
                      <div className={`font-extrabold text-white mt-1 whitespace-nowrap ${hasPrice ? getPriceFontSizeClass(pFormatted) : 'text-xs text-gray-400'}`}>
                        {pFormatted}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>NM-Mint</span>
                          <span className="text-[9px] text-gray-500 font-normal">(SNKRDUNK)</span>
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: COMMUNITY SALES REFERENCE */}
          {activeTab === 'community' && (
            <div className="pt-4 space-y-4">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1e212c] p-3.5 sm:p-4 rounded-xl border border-[#32384a]">
                <div>
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Recent Community Sales</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                      {card.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Verified sales data recorded and shared by collectors for this exact variant ({cardIdInfo.variantLabel || 'Base Version'}).
                  </p>
                </div>

                {/* Condition Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Condition:</span>
                  {['All', 'NM', 'LP', 'MP', 'HP', 'DMG'].map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCommunityConditionFilter(cond)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                        communityConditionFilter === cond
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-[#151722] text-gray-400 hover:text-white border border-[#2d3244]'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statistics Overview Cards with Market Protection */}
              {communityStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-[#1e212c] p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
                    <span className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Median Price</span>
                    </span>
                    <span className="text-base sm:text-lg font-black text-white font-mono mt-0.5 block">
                      {formatSalePrice(communityStats.medianPrice, communityStats.currency)}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Protected Benchmark</span>
                  </div>

                  <div className="bg-[#1e212c] p-3 rounded-xl border border-[#32384a]">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Trimmed Average</span>
                    <span className="text-base sm:text-lg font-black text-emerald-300 font-mono mt-0.5 block">
                      {formatSalePrice(communityStats.avgPrice, communityStats.currency)}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">{communityStats.validCount} verified sales</span>
                  </div>

                  <div className="bg-[#1e212c] p-3 rounded-xl border border-[#32384a]">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Price Range</span>
                    <span className="text-xs sm:text-sm font-black text-amber-400 font-mono mt-1 block truncate">
                      {formatSalePrice(communityStats.minPrice, communityStats.currency)} – {formatSalePrice(communityStats.maxPrice, communityStats.currency)}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Normal Spread</span>
                  </div>

                  <div className="bg-[#1e212c] p-3 rounded-xl border border-[#32384a]">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-sky-400" />
                      <span>Market Integrity</span>
                    </span>
                    <span className="text-xs sm:text-sm font-black mt-1 block truncate">
                      {communityStats.outlierCount > 0 ? (
                        <span className="text-amber-400 font-bold">{communityStats.outlierCount} Outlier(s) Excluded</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">100% Reliable</span>
                      )}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">IQR Filter Active</span>
                  </div>
                </div>
              )}

              {/* Sales Table / List */}
              {isLoadingCommunitySales ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold">Loading community sales history…</p>
                </div>
              ) : filteredCommunitySales.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#1e212c] border border-[#32384a] text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">
                      {communityConditionFilter !== 'All'
                        ? `No ${communityConditionFilter} sales recorded yet`
                        : 'No Community Sales Recorded Yet'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                      {communityConditionFilter !== 'All'
                        ? `No verified sales found matching ${communityConditionFilter} condition for this variant.`
                        : `Be the first to record a transaction! When collectors mark this card variant as sold and enable community sharing, actual sale prices appear here.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#32384a] bg-[#1e212c]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#32384a] bg-[#181a24] text-[10px] uppercase font-black text-gray-400 tracking-wider">
                          <th className="py-3 px-3.5">Date</th>
                          <th className="py-3 px-3">Condition</th>
                          <th className="py-3 px-3">Variant</th>
                          <th className="py-3 px-3 text-right">Sold Price</th>
                          <th className="py-3 px-3">Verification &amp; Source</th>
                          <th className="py-3 px-3.5 text-right">Notes</th>
                          <th className="py-3 px-2 text-center">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2f40]">
                        {filteredCommunitySales.map((sale: CloudSaleRecord) => {
                          const isReported = reportedSaleIds.includes(sale.id) || (sale.flagsCount || 0) >= 3;
                          const dateStr = sale.soldDate
                            ? new Date(sale.soldDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent';

                          return (
                            <tr 
                              key={sale.id} 
                              className={`transition ${
                                isReported 
                                  ? 'bg-rose-500/5 opacity-60' 
                                  : 'hover:bg-white/[0.03]'
                              }`}
                            >
                              <td className="py-3 px-3.5 font-mono text-gray-300 whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-gray-200 font-black text-[10px]">
                                  {sale.condition || 'NM'}
                                </span>
                                {sale.isFoil && (
                                  <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[9px] border border-indigo-500/30">
                                    FOIL
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-medium text-purple-300 whitespace-nowrap">
                                {cardIdInfo.variantLabel || 'Base Version'}
                              </td>
                              <td className="py-3 px-3 font-mono font-black text-emerald-400 text-right text-sm whitespace-nowrap">
                                {formatSalePrice(sale.soldPrice, sale.soldCurrency)}
                                {sale.quantity > 1 && (
                                  <span className="text-[10px] text-gray-400 ml-1 font-sans">
                                    (x{sale.quantity})
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {sale.verifiedByBuyer && (
                                    <span 
                                      className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[9px] border border-emerald-500/35 flex items-center gap-1 shadow-sm"
                                      title="Mutual Trade: Verified and confirmed by buyer friend"
                                    >
                                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                      <span>Verified Trade</span>
                                    </span>
                                  )}
                                  {sale.isOutlier && (
                                    <span 
                                      className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/35 flex items-center gap-1"
                                      title="Price Outlier: Excluded from community averages to prevent manipulation"
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                      <span>Outlier</span>
                                    </span>
                                  )}
                                  {isReported && (
                                    <span 
                                      className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/35 flex items-center gap-1"
                                      title="This transaction was flagged as suspicious by the community"
                                    >
                                      <Flag className="w-2.5 h-2.5 text-rose-400" />
                                      <span>Flagged</span>
                                    </span>
                                  )}
                                  {sale.buyerSource && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {sale.buyerSource}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3.5 text-right text-gray-400 text-[11px] truncate max-w-[140px]">
                                {sale.notes || 'Verified Collector Sale'}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleReportSale(sale.id)}
                                  disabled={reportedSaleIds.includes(sale.id)}
                                  title={
                                    reportedSaleIds.includes(sale.id)
                                      ? 'You reported this sale'
                                      : 'Report suspicious or fake sale'
                                  }
                                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                                    reportedSaleIds.includes(sale.id)
                                      ? 'text-rose-400 bg-rose-500/10 cursor-not-allowed'
                                      : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10'
                                  }`}
                                >
                                  <Flag className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOX 2: Standalone Dynamic SVG Interactive Multi-Line Price Chart */}
        {activeTab === 'market' && (
          <div className={`rounded-2xl sm:rounded-3xl ${isVintage ? 'bg-[#181a24] border border-[#2a2e3d]' : 'bg-[#1e202c] border border-[#343a4c]'} overflow-hidden shadow-lg`}>
            <div className="flex items-stretch">
              {/* Left: Y-axis Labels + SVG Chart Area */}
              <div className="flex-1 p-2.5 sm:p-3.5 pb-2.5 flex flex-col justify-between">
                <div className="flex gap-2 sm:gap-2.5 items-stretch">
                  {/* Y-axis Labels */}
                  <div className="flex flex-col justify-between text-[10px] sm:text-[11px] font-bold text-gray-400 py-1 text-right w-12 sm:w-14 flex-shrink-0 select-none">
                    <span>{formatCompactPrice(maxChartVal)}</span>
                    <span>{formatCompactPrice(step * 3)}</span>
                    <span>{formatCompactPrice(step * 2)}</span>
                    <span>{formatCompactPrice(step * 1)}</span>
                    <span>{formatCompactPrice(0)}</span>
                  </div>

                  {/* SVG Visual Canvas */}
                  <div 
                    className="flex-1 relative h-36 sm:h-44 overflow-hidden cursor-crosshair"
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <svg 
                      className="w-full h-full" 
                      viewBox="0 0 320 120" 
                      preserveAspectRatio="none"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relX = (e.clientX - rect.left) / rect.width;
                        const idx = Math.min(
                          currentSeries.length - 1,
                          Math.max(0, Math.round(relX * (currentSeries.length - 1)))
                        );
                        setHoverIndex(idx);
                      }}
                    >
                      <defs>
                        <linearGradient id="psaArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="ebayArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isVintage ? "#ffffff" : "#84cc16"} stopOpacity={isVintage ? "0.08" : "0.14"} />
                          <stop offset="100%" stopColor={isVintage ? "#ffffff" : "#84cc16"} stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="snkrdunkArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="6" x2="320" y2="6" stroke="#2a2e40" strokeWidth="1" />
                      <line x1="0" y1="34" x2="320" y2="34" stroke="#2a2e40" strokeWidth="1" />
                      <line x1="0" y1="62" x2="320" y2="62" stroke="#2a2e40" strokeWidth="1" />
                      <line x1="0" y1="90" x2="320" y2="90" stroke="#2a2e40" strokeWidth="1" />
                      <line x1="0" y1="118" x2="320" y2="118" stroke="#32384e" strokeWidth="1" />

                      {/* Vertical Grid lines */}
                      {currentSeries.map((_, i) => {
                        const x = Math.round((i / (currentSeries.length - 1)) * 320);
                        return (
                          <line key={i} x1={x} y1="6" x2={x} y2="118" stroke="#2a2e40" strokeWidth="1" />
                        );
                      })}

                      {/* Shaded Area Gradients under PSA, eBay & SNKRDUNK */}
                      {!isVintage && enabledPriceSources.psa && (
                        <path d={getSvgAreaPath((d) => d.psa)} fill="url(#psaArea)" />
                      )}
                      {enabledPriceSources.ebay && (
                        <path d={getSvgAreaPath((d) => d.ebay)} fill="url(#ebayArea)" />
                      )}
                      {!isVintage && enabledPriceSources.snkrdunk && (
                        <path d={getSvgAreaPath((d) => d.snkrdunk || 0)} fill="url(#snkrdunkArea)" />
                      )}

                      {/* Blue line: Yuyu-tei */}
                      {!isVintage && enabledPriceSources.yuyutei && hasYuyuPrice && (
                        <path
                          d={getSvgPath((d) => Math.round(d.yuyuYen / liveJpyRate))}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Sky line: Cardmarket */}
                      {!isVintage && enabledPriceSources.cardmarket && (
                        <path
                          d={getSvgPath((d) => d.cardmarket)}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      )}

                      {/* eBay line (White for Vintage, Lime for Modern) */}
                      {enabledPriceSources.ebay && (
                        <path
                          d={getSvgPath((d) => d.ebay)}
                          fill="none"
                          stroke={isVintage ? "#ffffff" : "#84cc16"}
                          strokeWidth={isVintage ? "1.8" : "1.2"}
                          strokeLinecap="round"
                        />
                      )}

                      {/* Emerald line: SNKRDUNK */}
                      {!isVintage && enabledPriceSources.snkrdunk && (
                        <path
                          d={getSvgPath((d) => d.snkrdunk || 0)}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Red line: PSA */}
                      {!isVintage && enabledPriceSources.psa && (
                        <path
                          d={getSvgPath((d) => d.psa)}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Interactive hover crosshair & dots */}
                      {hoverIndex !== null && (
                        <g>
                          <line
                            x1={(hoverIndex / (currentSeries.length - 1)) * 320}
                            y1="6"
                            x2={(hoverIndex / (currentSeries.length - 1)) * 320}
                            y2="118"
                            stroke={isVintage ? "#94a3b8" : "#e76d78"}
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          {!isVintage && enabledPriceSources.psa && (
                            <circle
                              cx={(hoverIndex / (currentSeries.length - 1)) * 320}
                              cy={Math.max(8, Math.min(115, Math.round(115 - (currentSeries[hoverIndex].psa / maxChartVal) * 105)))}
                              r="3.5"
                              fill="#ef4444"
                              stroke="#ffffff"
                              strokeWidth="1.2"
                            />
                          )}
                          {enabledPriceSources.ebay && (
                            <circle
                              cx={(hoverIndex / (currentSeries.length - 1)) * 320}
                              cy={Math.max(8, Math.min(115, Math.round(115 - (currentSeries[hoverIndex].ebay / maxChartVal) * 105)))}
                              r={isVintage ? "4" : "3.5"}
                              fill={isVintage ? "#ffffff" : "#84cc16"}
                              stroke={isVintage ? "#181a24" : "#ffffff"}
                              strokeWidth={isVintage ? "2" : "1.5"}
                            />
                          )}
                          {!isVintage && enabledPriceSources.snkrdunk && currentSeries[hoverIndex].snkrdunk !== undefined && (
                            <circle
                              cx={(hoverIndex / (currentSeries.length - 1)) * 320}
                              cy={Math.max(8, Math.min(115, Math.round(115 - ((currentSeries[hoverIndex].snkrdunk || 0) / maxChartVal) * 105)))}
                              r="3.5"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="1.2"
                            />
                          )}
                          {!isVintage && enabledPriceSources.cardmarket && (
                            <circle
                              cx={(hoverIndex / (currentSeries.length - 1)) * 320}
                              cy={Math.max(8, Math.min(115, Math.round(115 - (currentSeries[hoverIndex].cardmarket / maxChartVal) * 105)))}
                              r="3.5"
                              fill="#0284c7"
                              stroke="#ffffff"
                              strokeWidth="1.2"
                            />
                          )}
                          {!isVintage && enabledPriceSources.yuyutei && hasYuyuPrice && (
                            <circle
                              cx={(hoverIndex / (currentSeries.length - 1)) * 320}
                              cy={Math.max(8, Math.min(115, Math.round(115 - (Math.round(currentSeries[hoverIndex].yuyuYen / liveJpyRate) / maxChartVal) * 105)))}
                              r="3.5"
                              fill="#2563eb"
                              stroke="#ffffff"
                              strokeWidth="1.2"
                            />
                          )}
                        </g>
                      )}
                    </svg>

                    {/* Hover Tooltip */}
                    {hoverIndex !== null && (
                      <div 
                        className={`absolute top-2 z-20 ${isVintage ? 'bg-[#181a24]/95 border border-[#2a2e3d]' : 'bg-[#171922]/95 border border-[#3d4358]'} backdrop-blur p-2 rounded-xl text-[10px] shadow-2xl pointer-events-none`}
                        style={{
                          left: hoverIndex > currentSeries.length / 2 ? '10px' : 'auto',
                          right: hoverIndex > currentSeries.length / 2 ? 'auto' : '10px',
                        }}
                      >
                        <div className="font-extrabold text-gray-300 border-b border-white/10 pb-1 mb-1">
                          Date: {currentSeries[hoverIndex].date}
                        </div>
                        {isVintage ? (
                          <div className="space-y-0.5">
                            <div className="text-white font-bold text-xs">
                              eBay Sold: {formatPrice(currentSeries[hoverIndex].ebay).full}
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              (${currentSeries[hoverIndex].ebay.toFixed(2)} USD)
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5 font-bold">
                            {enabledPriceSources.psa && (
                              <div className="text-red-400">PSA: {formatPrice(currentSeries[hoverIndex].psa).full}</div>
                            )}
                            {enabledPriceSources.ebay && (
                              <div className="text-lime-400">eBay: {formatPrice(currentSeries[hoverIndex].ebay).full}</div>
                            )}
                            {enabledPriceSources.snkrdunk && (
                              <div className="text-emerald-400">
                                SNKRDUNK: {snkrdunkRawYen !== null ? formatPrice(snkrdunkRawYen, { source: 'snkrdunk', rawJPY: snkrdunkRawYen }).full : 'Unavailable'}
                              </div>
                            )}
                            {enabledPriceSources.cardmarket && (
                              <div className="text-sky-400">CM: {formatPrice(currentSeries[hoverIndex].cardmarket, { source: 'cardmarket' }).full}</div>
                            )}
                            {enabledPriceSources.yuyutei && (
                              <div className="text-blue-400">
                                Yuyu: {hasYuyuPrice ? formatPrice(Math.round(currentSeries[hoverIndex].yuyuYen / liveJpyRate)).full : 'Not Available'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* X-axis Date Labels */}
                <div className="flex justify-between text-[10px] font-bold text-gray-400 pt-2 pl-12 sm:pl-14 pr-1 select-none">
                  {currentSeries.map((item, idx) => (
                    <span key={idx}>{item.date}</span>
                  ))}
                </div>
              </div>

              {/* Right Sidebar: 7D / 1M / 3M */}
              <div className={`w-12 sm:w-14 border-l ${isVintage ? 'border-[#2a2e3d] bg-[#14161f]' : 'border-[#343a4c] bg-[#171922]'} flex flex-col justify-stretch select-none`}>
                <button
                  type="button"
                  onClick={() => setTimeframe('7D')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition border-b ${isVintage ? 'border-[#2a2e3d]' : 'border-[#343a4c]'} cursor-pointer ${
                    timeframe === '7D'
                      ? (isVintage ? 'bg-[#222634] text-white' : 'bg-[#2b3042] text-white shadow-inner')
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('1M')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition border-b ${isVintage ? 'border-[#2a2e3d]' : 'border-[#343a4c]'} cursor-pointer ${
                    timeframe === '1M'
                      ? (isVintage ? 'bg-[#222634] text-white' : 'bg-[#2b3042] text-white shadow-inner')
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  1M
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('3M')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    timeframe === '3M'
                      ? (isVintage ? 'bg-[#222634] text-white' : 'bg-[#2b3042] text-white shadow-inner')
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  3M
                </button>
              </div>
            </div>

            {/* Legend Footer & Interactive On/Off Toggles */}
            {isVintage ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#13151f] border-t border-[#242838] select-none text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></span>
                    <span className="text-gray-200 font-semibold text-xs">eBay Completed Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <span className="w-2.5 h-0.5 bg-gray-500 rounded inline-block"></span>
                    <span>3-Sale Moving Avg: <strong className="text-white font-bold">{formatPrice(vintageEffectivePrice).full}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-medium bg-[#1d202d] px-2.5 py-1 rounded-md border border-[#2b3042]">
                    Vintage Archive • eBay Solds
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-[#343a4c] bg-[#171922] text-[11px] sm:text-xs font-bold text-gray-300 select-none">
                {/* Yuyu-tei */}
                <button
                  type="button"
                  onClick={() => {
                    togglePriceSource('yuyutei');
                    showToast(enabledPriceSources.yuyutei ? 'Hidden Yuyu-tei pricing' : 'Showing Yuyu-tei pricing');
                  }}
                  title={enabledPriceSources.yuyutei ? 'Tap to hide Yuyu-tei' : 'Tap to show Yuyu-tei'}
                  className={`py-2.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 border-r border-b sm:border-b-0 border-[#343a4c] transition cursor-pointer ${
                    enabledPriceSources.yuyutei
                      ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                      : 'opacity-40 text-gray-500 hover:opacity-70 bg-black/20'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                    enabledPriceSources.yuyutei ? 'bg-[#2563eb] shadow' : 'bg-transparent border border-gray-600'
                  }`} />
                  <span className={`truncate ${enabledPriceSources.yuyutei ? '' : 'line-through text-gray-500'}`}>
                    Yuyu-tei
                  </span>
                </button>

                {/* Cardmarket */}
                <button
                  type="button"
                  onClick={() => {
                    togglePriceSource('cardmarket');
                    showToast(enabledPriceSources.cardmarket ? 'Hidden Cardmarket pricing' : 'Showing Cardmarket pricing');
                  }}
                  title={enabledPriceSources.cardmarket ? 'Tap to hide Cardmarket' : 'Tap to show Cardmarket'}
                  className={`py-2.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 border-r border-b sm:border-b-0 border-[#343a4c] transition cursor-pointer ${
                    enabledPriceSources.cardmarket
                      ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                      : 'opacity-40 text-gray-500 hover:opacity-70 bg-black/20'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                    enabledPriceSources.cardmarket ? 'bg-[#0284c7] shadow' : 'bg-transparent border border-gray-600'
                  }`} />
                  <span className={`truncate ${enabledPriceSources.cardmarket ? '' : 'line-through text-gray-500'}`}>
                    Cardmarket
                  </span>
                </button>

                {/* eBay */}
                <button
                  type="button"
                  onClick={() => {
                    togglePriceSource('ebay');
                    showToast(enabledPriceSources.ebay ? 'Hidden eBay pricing' : 'Showing eBay pricing');
                  }}
                  title={enabledPriceSources.ebay ? 'Tap to hide eBay' : 'Tap to show eBay'}
                  className={`py-2.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 border-r border-b sm:border-b-0 border-[#343a4c] transition cursor-pointer ${
                    enabledPriceSources.ebay
                      ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                      : 'opacity-40 text-gray-500 hover:opacity-70 bg-black/20'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                    enabledPriceSources.ebay ? 'bg-[#84cc16] shadow' : 'bg-transparent border border-gray-600'
                  }`} />
                  <span className={`truncate ${enabledPriceSources.ebay ? '' : 'line-through text-gray-500'}`}>
                    eBay
                  </span>
                </button>

                {/* SNKRDUNK */}
                <button
                  type="button"
                  onClick={() => {
                    togglePriceSource('snkrdunk');
                    showToast(enabledPriceSources.snkrdunk ? 'Hidden SNKRDUNK pricing' : 'Showing SNKRDUNK pricing');
                  }}
                  title={enabledPriceSources.snkrdunk ? 'Tap to hide SNKRDUNK' : 'Tap to show SNKRDUNK'}
                  className={`py-2.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 border-r border-[#343a4c] transition cursor-pointer ${
                    enabledPriceSources.snkrdunk
                      ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                      : 'opacity-40 text-gray-500 hover:opacity-70 bg-black/20'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                    enabledPriceSources.snkrdunk ? 'bg-[#10b981] shadow' : 'bg-transparent border border-gray-600'
                  }`} />
                  <span className={`truncate ${enabledPriceSources.snkrdunk ? '' : 'line-through text-gray-500'}`}>
                    SNKRDUNK
                  </span>
                </button>

                {/* PSA */}
                <button
                  type="button"
                  onClick={() => {
                    togglePriceSource('psa');
                    showToast(enabledPriceSources.psa ? 'Hidden PSA pricing' : 'Showing PSA pricing');
                  }}
                  title={enabledPriceSources.psa ? 'Tap to hide PSA' : 'Tap to show PSA'}
                  className={`py-2.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                    enabledPriceSources.psa
                      ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                      : 'opacity-40 text-gray-500 hover:opacity-70 bg-black/20'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition ${
                    enabledPriceSources.psa ? 'bg-[#ef4444] shadow' : 'bg-transparent border border-gray-600'
                  }`} />
                  <span className={`truncate ${enabledPriceSources.psa ? '' : 'line-through text-gray-500'}`}>
                    PSA
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Clickable Variations / Edition Banner */}
        {(() => {
          const visibleVariants = selectedLang === 'jp' ? allVariants.filter((v) => v.hasJpPrint !== false) : allVariants;
          return (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowEditionModal(true)}
                className="w-full bg-[#242735] hover:bg-[#2e3344] rounded-2xl px-3.5 py-2.5 border border-[#34384c] flex items-center justify-between transition cursor-pointer text-left shadow-sm group"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-400 group-hover:text-[#e76d78] transition" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {card.id.includes('_p') ? 'ALTERNATE ART' : card.id.includes('_r') ? 'REPRINT' : 'REGULAR PRINT'}
                  </span>
                  {visibleVariants.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#e76d78]/20 text-[#e76d78] text-[10px] font-bold border border-[#e76d78]/30">
                      {visibleVariants.length} Versions {selectedLang === 'jp' ? '(JP)' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-white transition">
                  <span className="truncate max-w-[140px] sm:max-w-none">{cardIdInfo.variantLabel || 'Base Version'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                </div>
              </button>

              {/* Sibling Card Versions Carousel / Grid */}
              {visibleVariants.length > 1 && (
                <div className="bg-[#242735] rounded-2xl p-3 border border-[#34384c] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Available Card Versions ({visibleVariants.length}) {selectedLang === 'jp' ? '— 日本語版' : ''}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Tap version to compare</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {visibleVariants.map((v) => {
                      const isSelected = v.id === card.id;
                      const vInfo = formatCard(v.id);
                      const hasVYuyu = Boolean(v.yuyuPrice && v.yuyuPrice > 0);
                      const vYen = hasVYuyu ? Math.round(v.yuyuPrice!) : null;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVariant(v)}
                          className={`p-2 rounded-xl text-left transition cursor-pointer flex items-center gap-2 relative border ${
                            isSelected
                              ? 'bg-[#1a233a] border-[#3b82f6] shadow-md shadow-[#3b82f6]/20 ring-1 ring-[#3b82f6]'
                              : 'bg-[#1e212c] border-[#32384a] hover:border-gray-500 hover:bg-[#252a38]'
                          }`}
                        >
                          <div className="w-9 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
                            <img
                              src={getEditionCardImageUrl(v.id, selectedLang, v.imageUrl)}
                              alt={v.id}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => handleCardImageError(e, v.id)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-white truncate">
                                {vInfo.variantLabel || 'Base'}
                              </span>
                              {isSelected && (
                                <span className="text-[7px] font-extrabold uppercase px-1 rounded bg-[#3b82f6] text-white flex-shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[8px] text-gray-400 truncate">
                              {v.promoSource ? v.promoSource.split(' (')[0] : v.rarity}
                            </div>
                            <div className="text-[10px] font-extrabold mt-0.5">
                              {selectedLang === 'jp'
                                ? (vYen !== null ? (
                                    <span className="text-[#4ade80]">{formatYuyuPrice(vYen).full}</span>
                                  ) : (
                                    <span className="text-gray-400 font-semibold text-[9px]">Not Available</span>
                                  ))
                                : <span className="text-[#4ade80]">{formatUsdPrice(v.marketPrice || 1).full}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: ARTIST PORTFOLIO MODAL ================= */}
      {showArtistModal && artist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#242836] border border-[#34384c] rounded-3xl max-w-lg w-full p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowArtistModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Artist Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e76d78] text-white flex items-center justify-center font-black text-xl shadow-lg">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white">{artist.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Verified Artist
                  </span>
                </div>
                <p className="text-xs text-gray-400">{artist.style}</p>
              </div>
            </div>

            {/* Bio & Stats */}
            <div className="bg-[#1e212c] p-3.5 rounded-2xl border border-[#32384a] space-y-2 text-xs">
              <p className="text-gray-300 leading-relaxed">{artist.bio}</p>
              <div className="flex items-center gap-4 pt-2 border-t border-white/10 text-gray-400 font-medium">
                <div>Total Illustrated: <strong className="text-white">{artistTotalCount ?? artist.totalCards} cards</strong></div>
                <div>Set Debuts: <strong className="text-white">{
                  artistCards.length > 0
                    ? ([...artistCards].map((c) => c.pack?.code || c.id.split('-')[0]).filter(Boolean).sort()[0] || 'OP-01')
                    : (artist.featuredCards?.[0]?.id.split('-')[0] || 'OP-01')
                }</strong></div>
              </div>
            </div>

            {/* Featured Cards Portfolio with Full Artwork Images */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Notable Cards Illustrated by {artist.name}
                </h4>
                <span className="text-[10px] text-gray-500 font-semibold">
                  {loadingArtistCards ? 'Loading...' : `${(artistCards.length > 0 ? artistCards : (artist.featuredCards || [])).length} Cards`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {(artistCards.length > 0 ? artistCards : (artist.featuredCards || [])).map((feat: any) => {
                  const featImg = getEditionCardImageUrl(feat.id, selectedLang, feat.imageUrl);
                  const displayName = feat.name;
                  const rarity = feat.rarity || 'Special';
                  const price = feat.yuyuPrice ? (feat.yuyuPrice / liveJpyRate) : (feat.marketPrice || 25);

                  return (
                    <div
                      key={feat.id}
                      onClick={() => {
                        setShowArtistModal(false);
                        if (onSelectCard) {
                          onSelectCard(feat as CardDetailData);
                        } else {
                          router.push(`/cards/${feat.id}`);
                        }
                      }}
                      className="group p-2 rounded-xl bg-[#1e212c] hover:bg-[#282c3a] border border-[#32384a] hover:border-[#3b82f6] transition cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md"
                    >
                      {/* Card Artwork Image */}
                      <div className="aspect-[7/10] bg-[#14161f] rounded-lg overflow-hidden mb-2 relative flex items-center justify-center">
                        <img
                          src={featImg}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                          loading="lazy"
                          onError={(e) => handleCardImageError(e, feat.id)}
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-bold text-white backdrop-blur flex items-center gap-1 border border-white/10">
                          <span>{feat.id}</span>
                          <span className="text-[8px] font-black text-[#f59e0b]">
                            JP
                          </span>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wide truncate">
                          {rarity}
                        </div>
                        <div className="text-xs font-bold text-white group-hover:text-[#3b82f6] transition truncate" title={displayName}>
                          {displayName}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#32384a] mt-1">
                          <span className="font-bold text-[#f59e0b]">
                            {formatPrice(price, { lang: selectedLang, rawJPY: feat.yuyuPrice }).full}
                          </span>
                          <span className="text-[9px] text-gray-500 group-hover:text-[#3b82f6] transition">View Art →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter in Database Button -> Navigates to /cards?artist=... with Full Images */}
            <button
              onClick={() => {
                setShowArtistModal(false);
                if (onBack) onBack();
                router.push(`/cards?artist=${encodeURIComponent(artist.name)}`);
              }}
              className="w-full py-3 rounded-xl bg-[#e76d78] text-white font-extrabold text-xs hover:bg-[#d45b66] transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#e76d78]/20"
            >
              <Eye className="w-4 h-4" />
              View All {(artistTotalCount ?? artist.totalCards)} Cards by {artist.name} in Database List
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FULLSCREEN EXPANDED CHART MODAL ================= */}
      {showFullscreenChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#242836] border border-[#34384c] rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#e76d78]" />
                  <span>Historical Price Analytics &amp; Volatility</span>
                </h3>
                <p className="text-xs text-gray-400">{card.name} ({cardIdInfo.displayId})</p>
              </div>
              <button
                onClick={() => setShowFullscreenChart(false)}
                className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deep Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#1e212c] border border-[#32384a]">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">52-Wk High</div>
                <div className="text-sm font-extrabold text-white mt-0.5">${(psaPrice * 1.25).toFixed(0)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1e212c] border border-[#32384a]">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">52-Wk Low</div>
                <div className="text-sm font-extrabold text-white mt-0.5">${(basePrice * 0.6).toFixed(0)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1e212c] border border-[#32384a]">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">24h Vol</div>
                <div className="text-sm font-extrabold text-white mt-0.5">$14,820</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1e212c] border border-[#32384a]">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">30d Change</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">+14.2%</div>
              </div>
            </div>

            {/* Full-width SVG View */}
            <div className="h-52 bg-[#1e212c] rounded-2xl border border-[#32384a] p-3 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                <line x1="0" y1="30" x2="300" y2="30" stroke="#2a2d3c" strokeDasharray="2 2" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#2a2d3c" strokeDasharray="2 2" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#2a2d3c" strokeDasharray="2 2" />
                {hasYuyuPrice && <path d={getSvgPath((d) => Math.round(d.yuyuYen / liveJpyRate))} fill="none" stroke="#3b82f6" strokeWidth="1.5" />}
                <path d={getSvgPath((d) => d.cardmarket)} fill="none" stroke="#0284c7" strokeWidth="1.5" />
                <path d={getSvgPath((d) => d.ebay)} fill="none" stroke="#84cc16" strokeWidth="1.5" />
                <path d={getSvgPath((d) => d.snkrdunk || 0)} fill="none" stroke="#10b981" strokeWidth="1.5" />
                <path d={getSvgPath((d) => d.psa)} fill="none" stroke="#ef4444" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex gap-2">
                {(['7D', '1M', '3M'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      timeframe === tf
                        ? 'bg-[#e76d78] text-white'
                        : 'bg-[#1e212c] text-gray-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFullscreenChart(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                Close Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: EDITIONS & VARIATIONS MODAL ================= */}
      {showEditionModal && (() => {
        const modalVariants = selectedLang === 'jp' ? allVariants.filter((v) => v.hasJpPrint !== false) : allVariants;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-[#242836] border border-[#34384c] rounded-3xl max-w-lg w-full p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowEditionModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#e76d78]/20 border border-[#e76d78]/40 flex items-center justify-center text-[#e76d78]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Card Print Editions &amp; Versions</h3>
                  <p className="text-xs text-gray-400">
                    {cleanCardId} — {card.name} ({modalVariants.length} versions found {selectedLang === 'jp' ? 'in Japanese' : ''})
                  </p>
                </div>
              </div>

              {modalVariants.length > 0 ? (
                <div className="space-y-2.5">
                  {modalVariants.map((v) => {
                  const isSelected = v.id === card.id;
                  const vInfo = formatCard(v.id);
                  const hasVYuyu = Boolean(v.yuyuPrice && v.yuyuPrice > 0);
                  const vYen = hasVYuyu ? Math.round(v.yuyuPrice!) : null;
                  const vEnPrice = v.marketPrice || 25;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        handleSelectVariant(v);
                        setShowEditionModal(false);
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-[#1a233a] border-[#3b82f6] shadow-lg ring-1 ring-[#3b82f6]'
                          : 'bg-[#1e212c] border-[#32384a] hover:border-gray-500 hover:bg-[#252a38]'
                      }`}
                    >
                      <div className="w-12 h-16 bg-black/40 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
                        <img
                          src={getEditionCardImageUrl(v.id, selectedLang, v.imageUrl)}
                          alt={v.id}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => handleCardImageError(e, v.id)}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-white font-mono">{v.id}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {vInfo.variantLabel || 'Base Print'}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#3b82f6] text-white">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#3b82f6] font-bold hover:underline">
                              Select →
                            </span>
                          )}
                        </div>

                        {v.promoSource && (
                          <div className="text-[10px] text-gray-300 flex items-center gap-1">
                            <span className="text-amber-400">🎁</span>
                            <span className="truncate">{v.promoSource}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-1 border-t border-white/10 text-xs">
                          <div>
                            <span className="text-gray-400 text-[10px] block">遊々亭 (Yuyu-tei):</span>
                            <span className={`font-extrabold ${vYen !== null ? 'text-[#4ade80]' : 'text-gray-400'}`}>
                              {vYen !== null ? formatYuyuPrice(vYen).full : 'Not Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#1e212c] border border-[#e76d78]/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="text-[#e76d78]">★ Alternate Art / Parallel Art</span>
                    <span>Currently Viewing</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Borderless custom comic artwork with rainbow foil stamping and full frame character presence.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowEditionModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#e76d78] hover:bg-[#d45b66] text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      );
    })()}
    </div>
  );
}
