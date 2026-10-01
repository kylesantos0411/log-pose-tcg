/**
 * Real-Time Everyday Exchange Rates Engine for Log Pose TCG
 * Provides accurate daily forex rates against USD as the universal benchmark.
 * Backed by Open Exchange Rates (er-api) with European Central Bank (Frankfurter) fallback.
 */

export type SupportedCurrency =
  | 'USD'
  | 'JPY'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'PHP';

export type ExchangeRatesMap = Record<SupportedCurrency, number>;

/**
 * High-accuracy everyday baseline rates (October 2026 reference)
 * Used as immediate fallback if offline or during zero-latency initial render
 */
export const DEFAULT_EXCHANGE_RATES: ExchangeRatesMap = {
  USD: 1.0,
  JPY: 157.30,
  EUR: 0.8818,
  GBP: 0.7538,
  CAD: 1.4213,
  AUD: 1.4383,
  SGD: 1.2776,
  PHP: 62.7547,
};

const RATES_STORAGE_KEY = 'logpose_exchange_rates';
const RATES_UPDATED_KEY = 'logpose_exchange_rates_updated_at';

/**
 * Retrieve cached rates synchronously from localStorage for instant, layout-shift-free rendering.
 */
export function getCachedExchangeRates(): ExchangeRatesMap {
  if (typeof window === 'undefined') return { ...DEFAULT_EXCHANGE_RATES };
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EXCHANGE_RATES };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_EXCHANGE_RATES };

    // Validate that required currency keys exist and are positive numbers
    const result: ExchangeRatesMap = { ...DEFAULT_EXCHANGE_RATES };
    for (const key of Object.keys(DEFAULT_EXCHANGE_RATES) as SupportedCurrency[]) {
      const val = Number(parsed[key]);
      if (!isNaN(val) && val > 0) {
        result[key] = val;
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_EXCHANGE_RATES };
  }
}

/**
 * Get the timestamp when exchange rates were last updated locally.
 */
export function getCachedRatesUpdatedAt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(RATES_UPDATED_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Save rates to localStorage and notify all listeners across the app.
 */
export function saveCachedExchangeRates(rates: ExchangeRatesMap, updatedAt?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const now = updatedAt || new Date().toISOString();
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates));
    localStorage.setItem(RATES_UPDATED_KEY, now);
    window.dispatchEvent(
      new CustomEvent('logpose_rates_updated', {
        detail: { rates, updatedAt: now },
      })
    );
  } catch (err) {
    console.error('Failed to save cached exchange rates:', err);
  }
}

/**
 * Sanitizes and validates a candidate rates object.
 */
function sanitizeRates(rawRates: any): ExchangeRatesMap | null {
  if (!rawRates || typeof rawRates !== 'object') return null;

  const sanitized: ExchangeRatesMap = { ...DEFAULT_EXCHANGE_RATES };
  let validCount = 0;

  for (const code of Object.keys(DEFAULT_EXCHANGE_RATES) as SupportedCurrency[]) {
    const val = Number(rawRates[code]);
    // Plausibility bounds check to guard against garbage data
    if (!isNaN(val) && val > 0.1 && val < 50000) {
      sanitized[code] = val;
      validCount++;
    }
  }

  // Ensure primary trade currencies (JPY, PHP, EUR, USD) are valid
  if (validCount < 4 || !sanitized.JPY || !sanitized.PHP) {
    return null;
  }

  return sanitized;
}

/**
 * Fetch live, everyday exchange rates from server API or direct provider fallbacks.
 */
export async function fetchLiveExchangeRates(): Promise<{
  rates: ExchangeRatesMap;
  updatedAt: string;
  source: string;
}> {
  const now = new Date().toISOString();

  // 1. Try our Next.js API route first (which provides server-side caching)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/currency', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json();
        const validRates = sanitizeRates(json.rates);
        if (validRates) {
          saveCachedExchangeRates(validRates, json.lastUpdated || now);
          return {
            rates: validRates,
            updatedAt: json.lastUpdated || now,
            source: json.provider || 'server-api',
          };
        }
      }
    } catch {
      // Fall through to direct client fetch
    }
  }

  // 2. Direct fallback: Open Exchange Rates (er-api.com, updated daily, free, CORS-friendly)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.result === 'success' && json.rates) {
        const validRates = sanitizeRates(json.rates);
        if (validRates) {
          const timestamp = json.time_last_update_utc || now;
          saveCachedExchangeRates(validRates, timestamp);
          return { rates: validRates, updatedAt: timestamp, source: 'open.er-api.com' };
        }
      }
    }
  } catch {
    // Fall through to secondary fallback
  }

  // 3. Secondary fallback: European Central Bank via Frankfurter API
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.rates) {
        const candidateRates = { ...json.rates, USD: 1.0 };
        const validRates = sanitizeRates(candidateRates);
        if (validRates) {
          const timestamp = json.date ? new Date(json.date).toISOString() : now;
          saveCachedExchangeRates(validRates, timestamp);
          return { rates: validRates, updatedAt: timestamp, source: 'api.frankfurter.app' };
        }
      }
    }
  } catch {
    // Fall through to cached / default
  }

  // 4. Return cached rates if all remote sources are unreachable
  const cached = getCachedExchangeRates();
  const cachedTime = getCachedRatesUpdatedAt() || now;
  return { rates: cached, updatedAt: cachedTime, source: 'offline-cache' };
}

/**
 * Universal Currency Conversion helper:
 * Converts an amount from one currency to another using the provided or cached exchange rates.
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates?: ExchangeRatesMap
): number {
  if (from === to || amount === 0 || isNaN(amount)) return amount;
  const activeRates = rates || getCachedExchangeRates();

  const fromRate = activeRates[from] || DEFAULT_EXCHANGE_RATES[from] || 1.0;
  const toRate = activeRates[to] || DEFAULT_EXCHANGE_RATES[to] || 1.0;

  // Amount in USD = amount / fromRate
  // Amount in Target = (amount in USD) * toRate
  return (amount / fromRate) * toRate;
}

/**
 * Convenient helper to get current JPY to USD multiplier (1 JPY in USD)
 */
export function getYenToUsdMultiplier(rates?: ExchangeRatesMap): number {
  const activeRates = rates || getCachedExchangeRates();
  const jpyRate = activeRates.JPY || DEFAULT_EXCHANGE_RATES.JPY;
  return 1 / jpyRate;
}

/**
 * Convenient helper to get current USD to PHP rate
 */
export function getUsdToPhpRate(rates?: ExchangeRatesMap): number {
  const activeRates = rates || getCachedExchangeRates();
  return activeRates.PHP || DEFAULT_EXCHANGE_RATES.PHP;
}
