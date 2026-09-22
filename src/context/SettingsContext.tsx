'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCardId, AltArtLabelStyle, FormattedCardId } from '@/lib/card-format';

export type CurrencyCode =
  | 'source' // Default: uses each marketplace source's native currency (Yuyu-tei: JPY ¥, TCGPlayer/eBay/PSA: USD $)
  | 'USD'
  | 'JPY'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'PHP';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  name: string;
  symbol: string;
  flag: string;
  rateToUSD: number; // 1 USD = X in this currency
  description: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  source: {
    code: 'source',
    label: 'Source Native',
    name: 'Source Native Currency',
    symbol: 'Auto',
    flag: '🌐',
    rateToUSD: 1.0,
    description: 'Uses each marketplace original currency (Yuyu-tei: ¥ JPY, TCGPlayer/eBay/PSA: $ USD)',
  },
  USD: {
    code: 'USD',
    label: 'USD ($)',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateToUSD: 1.0,
    description: 'Universal benchmark currency used by TCGPlayer, eBay US, and PSA',
  },
  JPY: {
    code: 'JPY',
    label: 'JPY (¥)',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    rateToUSD: 152.0,
    description: 'Official Bandai Japanese card game currency (used by Yuyu-tei)',
  },
  EUR: {
    code: 'EUR',
    label: 'EUR (€)',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateToUSD: 0.92,
    description: 'European Union domestic pricing',
  },
  GBP: {
    code: 'GBP',
    label: 'GBP (£)',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    rateToUSD: 0.78,
    description: 'United Kingdom domestic pricing',
  },
  CAD: {
    code: 'CAD',
    label: 'CAD (C$)',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    rateToUSD: 1.36,
    description: 'Canadian domestic pricing',
  },
  AUD: {
    code: 'AUD',
    label: 'AUD (A$)',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    rateToUSD: 1.52,
    description: 'Oceania & Australian domestic pricing',
  },
  SGD: {
    code: 'SGD',
    label: 'SGD (S$)',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    rateToUSD: 1.32,
    description: 'Southeast Asia benchmark pricing',
  },
  PHP: {
    code: 'PHP',
    label: 'PHP (₱)',
    name: 'Philippine Peso',
    symbol: '₱',
    flag: '🇵🇭',
    rateToUSD: 57.5,
    description: 'Philippine card community pricing',
  },
};

interface FormattedPriceResult {
  symbol: string;
  value: number;
  formatted: string;
  full: string;
  currencyCode: string;
}

export type PriceSource = 'yuyutei' | 'tcgplayer' | 'ebay' | 'psa';

export interface EnabledPriceSources {
  yuyutei: boolean;
  tcgplayer: boolean;
  ebay: boolean;
  psa: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  tag: string;
  email?: string;
  avatar: string;
  crew: string;
  rank: string;
  rankBadge: string;
  createdAt?: string;
}

export function generateCollectorTag(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PIRATE';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PIRATE-${clean}-${num}`;
}

interface SettingsContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  altArtStyle: AltArtLabelStyle;
  setAltArtStyle: (style: AltArtLabelStyle) => void;
  enabledPriceSources: EnabledPriceSources;
  togglePriceSource: (source: PriceSource) => void;
  setEnabledPriceSources: (sources: EnabledPriceSources) => void;
  formatCard: (cardId?: string | null) => FormattedCardId;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  shareCrashReports: boolean;
  setShareCrashReports: (val: boolean) => void;
  user: UserProfile | null;
  register: (data: { name: string; email?: string; avatar?: string; crew?: string; tag?: string }) => UserProfile;
  login: (emailOrTag: string, name?: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
  clearUserData: () => void;
  formatPrice: (
    amountUSD: number,
    options?: {
      source?: 'yuyutei' | 'tcgplayer' | 'ebay' | 'psa' | 'generic';
      lang?: 'en' | 'jp';
      decimals?: number;
      /** Pass the raw JPY amount directly when source=yuyutei so no USD→JPY conversion is needed */
      rawJPY?: number;
    }
  ) => FormattedPriceResult;
  convertPrice: (
    amountUSD: number,
    targetCurrency?: CurrencyCode,
    source?: 'yuyutei' | 'tcgplayer' | 'ebay' | 'psa' | 'generic'
  ) => number;
  /** Format a raw JPY price (Yuyu-tei) into the user's chosen currency */
  formatYuyuPrice: (yenAmount: number) => FormattedPriceResult;
  /** Format a raw USD price (TCGPlayer/eBay/PSA) into the user's chosen currency */
  formatUsdPrice: (usdAmount: number) => FormattedPriceResult;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'logpose_preferred_currency';
const ALT_ART_STORAGE_KEY = 'logpose_alt_art_style';
const PRICE_SOURCES_STORAGE_KEY = 'logpose_enabled_price_sources';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('source');
  const [altArtStyle, setAltArtStyleState] = useState<AltArtLabelStyle>('alt_art');
  const [enabledPriceSources, setEnabledPriceSourcesState] = useState<EnabledPriceSources>({
    yuyutei: true,
    tcgplayer: true,
    ebay: true,
    psa: true,
  });
  const [shareCrashReports, setShareCrashReportsState] = useState<boolean>(true);
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const currParam = urlParams.get('currency') || urlParams.get('curr');
      if (currParam && (CURRENCIES[currParam.toUpperCase() as CurrencyCode] || currParam.toLowerCase() === 'source')) {
        setCurrencyState((currParam.toLowerCase() === 'source' ? 'source' : currParam.toUpperCase()) as CurrencyCode);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
        if (saved && CURRENCIES[saved]) {
          setCurrencyState(saved);
        }
      }
      const savedAltArt = localStorage.getItem(ALT_ART_STORAGE_KEY) as AltArtLabelStyle | null;
      if (savedAltArt === 'alt_art' || savedAltArt === 'parallel') {
        setAltArtStyleState(savedAltArt);
      }

      const savedSources = localStorage.getItem(PRICE_SOURCES_STORAGE_KEY);
      if (savedSources) {
        try {
          const parsed = JSON.parse(savedSources);
          if (parsed && typeof parsed === 'object') {
            setEnabledPriceSourcesState({
              yuyutei: parsed.yuyutei !== false,
              tcgplayer: parsed.tcgplayer !== false,
              ebay: parsed.ebay !== false,
              psa: parsed.psa !== false,
            });
          }
        } catch {
          // Ignore json parse error
        }
      }

      const savedCrash = localStorage.getItem('logpose_share_crash_reports');
      if (savedCrash !== null) {
        try {
          setShareCrashReportsState(JSON.parse(savedCrash));
        } catch {
          // Ignore
        }
      }

      const savedUser = localStorage.getItem('logpose_user_session');
      if (savedUser) {
        try {
          setUserState(JSON.parse(savedUser));
        } catch {
          // Ignore
        }
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, []);

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore
    }
  };

  const setAltArtStyle = (next: AltArtLabelStyle) => {
    setAltArtStyleState(next);
    try {
      localStorage.setItem(ALT_ART_STORAGE_KEY, next);
    } catch {
      // Ignore
    }
  };

  const togglePriceSource = (source: PriceSource) => {
    setEnabledPriceSourcesState((prev) => {
      // Prevent disabling all sources - keep at least one active
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[source] && activeCount <= 1) {
        return prev;
      }
      const next = { ...prev, [source]: !prev[source] };
      try {
        localStorage.setItem(PRICE_SOURCES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const setEnabledPriceSources = (sources: EnabledPriceSources) => {
    setEnabledPriceSourcesState(sources);
    try {
      localStorage.setItem(PRICE_SOURCES_STORAGE_KEY, JSON.stringify(sources));
    } catch {
      // Ignore
    }
  };

  const formatCard = (cardId?: string | null): FormattedCardId => {
    return formatCardId(cardId, altArtStyle);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);

  const setShareCrashReports = (val: boolean) => {
    setShareCrashReportsState(val);
    try {
      localStorage.setItem('logpose_share_crash_reports', JSON.stringify(val));
    } catch {
      // Ignore
    }
  };

  const register = (data: { name: string; email?: string; avatar?: string; crew?: string; tag?: string }): UserProfile => {
    const rawTag = data.tag || generateCollectorTag(data.name);
    const formattedTag = rawTag.toUpperCase().startsWith('PIRATE-') ? rawTag.toUpperCase() : `PIRATE-${rawTag.toUpperCase()}`;
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: data.name.trim() || 'Pirate Collector',
      tag: formattedTag,
      email: data.email?.trim() || undefined,
      avatar: data.avatar || '👒',
      crew: data.crew || 'Straw Hat Pirates',
      rank: 'Supernova Collector',
      rankBadge: '🏴‍☠️',
      createdAt: new Date().toISOString(),
    };
    setUserState(newUser);
    try {
      localStorage.setItem('logpose_user_session', JSON.stringify(newUser));
    } catch {
      // Ignore
    }
    return newUser;
  };

  const login = (emailOrTag: string, name?: string) => {
    const identifier = emailOrTag.trim();
    const isTag = identifier.toUpperCase().startsWith('PIRATE-');
    const detectedName = name || (isTag ? identifier.replace(/^PIRATE-/, '').split('-')[0] : identifier.split('@')[0]) || 'Collector';
    const tag = isTag ? identifier.toUpperCase() : generateCollectorTag(detectedName);

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: detectedName,
      tag: tag,
      email: !isTag && identifier.includes('@') ? identifier : undefined,
      avatar: '👒',
      crew: 'Straw Hat Pirates',
      rank: 'Supernova Collector',
      rankBadge: '🏴‍☠️',
      createdAt: new Date().toISOString(),
    };
    setUserState(newUser);
    try {
      localStorage.setItem('logpose_user_session', JSON.stringify(newUser));
    } catch {
      // Ignore
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUserState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem('logpose_user_session', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const logout = () => {
    setUserState(null);
    try {
      localStorage.removeItem('logpose_user_session');
    } catch {
      // Ignore
    }
  };

  const clearUserData = () => {
    setUserState(null);
    try {
      localStorage.removeItem('logpose_user_session');
      localStorage.removeItem('logpose_user_collection');
      localStorage.removeItem('optcg_user_collection');
      localStorage.removeItem('logpose_friends_list');
      localStorage.removeItem('logpose_friend_requests');
    } catch {
      // Ignore
    }
  };

  const convertPrice = (
    amountUSD: number,
    targetCurrency?: CurrencyCode,
    source: 'yuyutei' | 'tcgplayer' | 'ebay' | 'psa' | 'generic' = 'generic'
  ): number => {
    const activeCurr = targetCurrency || currency;

    if (activeCurr === 'source') {
      if (source === 'yuyutei') {
        // Yuyu-tei native is JPY
        return Math.round(amountUSD * 0.92 * 152);
      }
      return amountUSD;
    }

    const config = CURRENCIES[activeCurr] || CURRENCIES.USD;
    return amountUSD * config.rateToUSD;
  };

  const formatPrice = (
    amountUSD: number,
    options?: {
      source?: 'yuyutei' | 'tcgplayer' | 'ebay' | 'psa' | 'generic';
      lang?: 'en' | 'jp';
      decimals?: number;
      rawJPY?: number;
    }
  ): FormattedPriceResult => {
    const source = options?.source || 'generic';
    const lang = options?.lang || 'jp';
    const decimals = options?.decimals;

    // If rawJPY was supplied for yuyutei source or japanese language
    if (options?.rawJPY !== undefined && (source === 'yuyutei' || lang === 'jp')) {
      return formatYuyuPrice(options.rawJPY);
    }

    // 1. If Currency is set to 'source' (Default):
    if (currency === 'source') {
      if (source === 'yuyutei') {
        const yenVal = options?.rawJPY !== undefined ? Math.round(options.rawJPY) : Math.round(amountUSD * 152);
        return {
          symbol: '¥',
          value: yenVal,
          formatted: yenVal.toLocaleString(),
          full: `¥${yenVal.toLocaleString()}`,
          currencyCode: 'JPY',
        };
      }

      if (source === 'generic' && lang === 'jp') {
        const yenVal = options?.rawJPY !== undefined ? Math.round(options.rawJPY) : Math.round(amountUSD * 152);
        return {
          symbol: '¥',
          value: yenVal,
          formatted: yenVal.toLocaleString(),
          full: `¥${yenVal.toLocaleString()}`,
          currencyCode: 'JPY',
        };
      }

      // Default USD for TCGPlayer, eBay, PSA, and generic EN
      const val = amountUSD;
      const dec = decimals !== undefined ? decimals : val >= 100 ? 0 : 2;
      return {
        symbol: '$',
        value: val,
        formatted: val.toLocaleString(undefined, {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        }),
        full: `$${val.toLocaleString(undefined, {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        })}`,
        currencyCode: 'USD',
      };
    }

    // 2. User chose an explicit target currency
    const config = CURRENCIES[currency] || CURRENCIES.USD;
    let baseUsd = amountUSD;

    // If computing for Yuyu-tei specifically when converting to another currency
    if (source === 'yuyutei') {
      if (options?.rawJPY !== undefined) {
        baseUsd = options.rawJPY * JPY_TO_USD;
      }
    }

    const convertedVal = baseUsd * config.rateToUSD;

    if (currency === 'JPY') {
      const yen = Math.round(convertedVal);
      return {
        symbol: '¥',
        value: yen,
        formatted: yen.toLocaleString(),
        full: `¥${yen.toLocaleString()}`,
        currencyCode: 'JPY',
      };
    }

    const dec = decimals !== undefined ? decimals : (currency === 'PHP' || convertedVal >= 100) ? 0 : 2;
    const formattedNum = convertedVal.toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });

    return {
      symbol: config.symbol,
      value: convertedVal,
      formatted: formattedNum,
      full: `${config.symbol}${formattedNum}`,
      currencyCode: config.code,
    };
  };

  /**
   * formatYuyuPrice — converts a raw Yuyu-tei JPY price to the user's selected currency.
   * Source of truth: yuyuPrice field in the DB (already in JPY ¥).
   * JPY → user currency without any lossy intermediate conversion.
   */
  const JPY_TO_USD = 1 / 152.0; // 1 JPY = 0.00657 USD

  const formatYuyuPrice = (yenAmount: number): FormattedPriceResult => {
    if (currency === 'source' || currency === 'JPY') {
      const yen = Math.round(yenAmount);
      return { symbol: '¥', value: yen, formatted: yen.toLocaleString(), full: `¥${yen.toLocaleString()}`, currencyCode: 'JPY' };
    }
    // Convert JPY → target currency via USD pivot
    const usd = yenAmount * JPY_TO_USD;
    const config = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = usd * config.rateToUSD;
    const dec = (currency === 'PHP' || converted >= 100) ? 0 : 2;
    const formatted = converted.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return { symbol: config.symbol, value: converted, formatted, full: `${config.symbol}${formatted}`, currencyCode: config.code };
  };

  /**
   * formatUsdPrice — converts a raw USD market price (TCGPlayer / eBay / PSA) to the user's selected currency.
   * Source of truth: marketPrice field in DB (already in USD $).
   */
  const formatUsdPrice = (usdAmount: number): FormattedPriceResult => {
    if (currency === 'source' || currency === 'USD') {
      const dec = usdAmount >= 100 ? 0 : 2;
      const formatted = usdAmount.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return { symbol: '$', value: usdAmount, formatted, full: `$${formatted}`, currencyCode: 'USD' };
    }
    if (currency === 'JPY') {
      const yen = Math.round(usdAmount * 152);
      return { symbol: '¥', value: yen, formatted: yen.toLocaleString(), full: `¥${yen.toLocaleString()}`, currencyCode: 'JPY' };
    }
    const config = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = usdAmount * config.rateToUSD;
    const dec = (currency === 'PHP' || converted >= 100) ? 0 : 2;
    const formatted = converted.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return { symbol: config.symbol, value: converted, formatted, full: `${config.symbol}${formatted}`, currencyCode: config.code };
  };

  return (
    <SettingsContext.Provider
      value={{
        currency,
        setCurrency,
        altArtStyle,
        setAltArtStyle,
        enabledPriceSources,
        togglePriceSource,
        setEnabledPriceSources,
        formatCard,
        isSettingsOpen,
        openSettings,
        closeSettings,
        toggleSettings,
        shareCrashReports,
        setShareCrashReports,
        user,
        register,
        login,
        updateProfile,
        logout,
        clearUserData,
        formatPrice,
        convertPrice,
        formatYuyuPrice,
        formatUsdPrice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
