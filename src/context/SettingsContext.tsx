'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCardId, AltArtLabelStyle, FormattedCardId } from '@/lib/card-format';
import { 
  StoredAccount, 
  UserSession, 
  getStoredAccounts, 
  registerAccount, 
  authenticateAccount, 
  findAccountByIdentifier,
  deleteStoredAccount, 
  getActiveSession, 
  setActiveSession,
  saveStoredAccountFromSession 
} from '@/lib/user-accounts';
import { transferGuestCardsToAccount, getLocalBinder } from '@/lib/user-collection';
import { 
  getSupabaseBrowserClient, 
  isSupabaseConfigured, 
  signInWithGoogle, 
  signInWithEmailPassword, 
  signUpWithEmailPassword, 
  signOutSupabase 
} from '@/lib/supabase/client';
import { 
  fetchCloudProfile, 
  migrateLocalBinderToCloud 
} from '@/lib/supabase-sync';

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

export type UserProfile = UserSession;

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
  accounts: StoredAccount[];
  isCloudConnected: boolean;
  sendVerificationCode: (email: string, type: 'register' | 'login') => Promise<{ success: boolean; error?: string; devCode?: string; message?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  loginWithSupabaseEmail: (email: string, password: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  registerWithSupabaseEmail: (data: { email: string; password: string; username: string; avatar?: string; crew?: string }) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  register: (data: {
    username?: string;
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
    crew?: string;
    tag?: string;
    customTag?: string;
    code?: string;
  }) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  login: (
    identifier: string,
    password?: string,
    code?: string
  ) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
  deleteAccount: (idOrTag?: string) => boolean;
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
  const [accounts, setAccountsState] = useState<StoredAccount[]>([]);
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

      // Sync active session and registered accounts
      const active = getActiveSession();
      setUserState(active);
      setAccountsState(getStoredAccounts());
    } catch {
      // localStorage may be unavailable in some environments
    }

    // Supabase Auth Listener for Google OAuth and Cloud Auth
    let authUnsubscribe: (() => void) | undefined;
    try {
      const client = getSupabaseBrowserClient();
      if (client && isSupabaseConfigured()) {
        client.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            await syncSupabaseSession(session.user);
          }
        });

        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            await syncSupabaseSession(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUserState(null);
            setActiveSession(null);
          }
        });

        authUnsubscribe = () => subscription.unsubscribe();
      }
    } catch (err) {
      console.warn('Supabase auth listener initialization skipped:', err);
    }

    const handleAuthChange = () => {
      setUserState(getActiveSession());
      setAccountsState(getStoredAccounts());
    };
    window.addEventListener('logpose_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('logpose_auth_changed', handleAuthChange);
      if (authUnsubscribe) authUnsubscribe();
    };
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

  const syncSupabaseSession = async (sbUser: any) => {
    try {
      const cloud = await fetchCloudProfile(sbUser.id);
      const name = cloud?.username || sbUser.user_metadata?.username || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Collector';
      const tag = cloud?.tag || sbUser.user_metadata?.tag || `PIRATE-${name.toUpperCase().slice(0, 8)}-${sbUser.id.slice(0, 4)}`;
      const avatar = cloud?.avatar || sbUser.user_metadata?.avatar || '👒';
      const crew = cloud?.crew || sbUser.user_metadata?.crew || 'Straw Hat Pirates';

      const userProfile: UserProfile = {
        id: sbUser.id,
        name,
        tag,
        email: sbUser.email,
        avatar,
        crew,
        rank: cloud?.rank || 'Cabin Boy',
        rankBadge: cloud?.rankBadge || '⚓',
        createdAt: sbUser.created_at,
      };

      setActiveSession(userProfile);
      setUserState(userProfile);

      // Auto-migrate any cards added while guest
      const guestCards = getLocalBinder(null);
      if (guestCards.length > 0) {
        await migrateLocalBinderToCloud(sbUser.id, guestCards);
        transferGuestCardsToAccount(tag);
      }
    } catch (err) {
      console.error('Failed to sync Supabase session:', err);
    }
  };

  const loginWithGoogle = async (): Promise<{ error?: string }> => {
    return await signInWithGoogle();
  };

  const loginWithSupabaseEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const res = await signInWithEmailPassword(email, pass);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.user) {
      await syncSupabaseSession(res.user);
      return { success: true, user: getActiveSession() || undefined };
    }
    return { success: false, error: 'Sign in failed' };
  };

  const registerWithSupabaseEmail = async (data: {
    email: string;
    password: string;
    username: string;
    avatar?: string;
    crew?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const res = await signUpWithEmailPassword(data);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.user) {
      await syncSupabaseSession(res.user);
      return { success: true, user: getActiveSession() || undefined };
    }
    return { success: true };
  };

  const sendVerificationCode = async (
    email: string,
    type: 'register' | 'login'
  ): Promise<{ success: boolean; error?: string; devCode?: string; message?: string }> => {
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Failed to send verification code.' };
      }
      return { success: true, devCode: data.devCode, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error sending verification code.' };
    }
  };

  const register = async (data: {
    username?: string;
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
    crew?: string;
    tag?: string;
    customTag?: string;
    code?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const rawUsername = (data.username || data.name || '').trim();
    const rawEmail = (data.email || '').trim();
    const rawPassword = (data.password || 'password123').trim();
    const rawCode = (data.code || '').trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: rawUsername,
          email: rawEmail,
          password: rawPassword,
          code: rawCode,
          avatar: data.avatar,
          crew: data.crew,
          customTag: data.customTag || data.tag,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        return { success: false, error: result.error || 'Failed to register account.' };
      }

      if (result.user) {
        setUserState(result.user);
        setActiveSession(result.user);
        saveStoredAccountFromSession(result.user);
        transferGuestCardsToAccount(result.user.tag);
        setAccountsState(getStoredAccounts());
      }
      return { success: true, user: result.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration.' };
    }
  };

  const login = async (
    identifier: string,
    password?: string,
    code?: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();
    const cleanCode = (code || '').trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password: cleanPass || undefined,
          code: cleanCode || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        // Fallback to local accounts if server is unreachable
        const existing = findAccountByIdentifier(cleanId);
        if (existing && cleanPass) {
          const localAuth = authenticateAccount(cleanId, cleanPass);
          if (localAuth.success && localAuth.user) {
            setUserState(localAuth.user);
            setActiveSession(localAuth.user);
            transferGuestCardsToAccount(localAuth.user.tag);
            setAccountsState(getStoredAccounts());
            return localAuth;
          }
        }
        return { success: false, error: result.error || 'Invalid credentials.' };
      }

      if (result.user) {
        setUserState(result.user);
        setActiveSession(result.user);
        saveStoredAccountFromSession(result.user);
        transferGuestCardsToAccount(result.user.tag);
        setAccountsState(getStoredAccounts());
      }
      return { success: true, user: result.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login.' };
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUserState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      setActiveSession(updated);
      return updated;
    });
  };

  const logout = () => {
    try {
      signOutSupabase();
    } catch {}
    setActiveSession(null);
    setUserState(null);
    setAccountsState(getStoredAccounts());
  };

  const deleteAccount = (idOrTag?: string): boolean => {
    const target = idOrTag || user?.tag || user?.id;
    if (!target) return false;
    const ok = deleteStoredAccount(target);
    if (ok) {
      setUserState(null);
      setAccountsState(getStoredAccounts());
    }
    return ok;
  };

  const clearUserData = () => {
    setActiveSession(null);
    setUserState(null);
    try {
      localStorage.removeItem('logpose_user_session');
      localStorage.removeItem('logpose_user_binder');
      localStorage.removeItem('logpose_binder_guest');
      localStorage.removeItem('logpose_registered_accounts');
      localStorage.removeItem('logpose_friends_list');
      localStorage.removeItem('logpose_friend_requests');
    } catch {
      // Ignore
    }
    setAccountsState([]);
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
        accounts,
        isCloudConnected: isSupabaseConfigured(),
        sendVerificationCode,
        loginWithGoogle,
        loginWithSupabaseEmail,
        registerWithSupabaseEmail,
        register,
        login,
        updateProfile,
        logout,
        deleteAccount,
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
