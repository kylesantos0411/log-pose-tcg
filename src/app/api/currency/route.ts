import { NextResponse } from 'next/server';
import { DEFAULT_EXCHANGE_RATES, type SupportedCurrency, type ExchangeRatesMap } from '@/lib/exchange-rates';

// In-memory cache for serverless runtime
let cachedData: {
  rates: ExchangeRatesMap;
  lastUpdated: string;
  provider: string;
} | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes server-side cache

export async function GET() {
  const now = Date.now();

  // Return server cache if still fresh
  if (cachedData && now - lastFetchTime < CACHE_DURATION_MS) {
    return NextResponse.json(
      {
        success: true,
        base: 'USD',
        rates: cachedData.rates,
        lastUpdated: cachedData.lastUpdated,
        provider: cachedData.provider,
        cached: true,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
      }
    );
  }

  // 1. Fetch from primary provider (Open Exchange Rates / er-api)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.result === 'success' && data.rates) {
        const rates: ExchangeRatesMap = {
          USD: 1.0,
          JPY: Number(data.rates.JPY) || DEFAULT_EXCHANGE_RATES.JPY,
          EUR: Number(data.rates.EUR) || DEFAULT_EXCHANGE_RATES.EUR,
          GBP: Number(data.rates.GBP) || DEFAULT_EXCHANGE_RATES.GBP,
          CAD: Number(data.rates.CAD) || DEFAULT_EXCHANGE_RATES.CAD,
          AUD: Number(data.rates.AUD) || DEFAULT_EXCHANGE_RATES.AUD,
          SGD: Number(data.rates.SGD) || DEFAULT_EXCHANGE_RATES.SGD,
          PHP: Number(data.rates.PHP) || DEFAULT_EXCHANGE_RATES.PHP,
        };

        const lastUpdated = data.time_last_update_utc || new Date().toISOString();
        cachedData = { rates, lastUpdated, provider: 'open.er-api.com' };
        lastFetchTime = now;

        return NextResponse.json(
          {
            success: true,
            base: 'USD',
            rates,
            lastUpdated,
            provider: 'open.er-api.com',
            cached: false,
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
            },
          }
        );
      }
    }
  } catch (err) {
    console.warn('Primary exchange rates provider failed, trying fallback:', err);
  }

  // 2. Fetch from secondary provider (Frankfurter / European Central Bank)
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        const rates: ExchangeRatesMap = {
          USD: 1.0,
          JPY: Number(data.rates.JPY) || DEFAULT_EXCHANGE_RATES.JPY,
          EUR: Number(data.rates.EUR) || DEFAULT_EXCHANGE_RATES.EUR,
          GBP: Number(data.rates.GBP) || DEFAULT_EXCHANGE_RATES.GBP,
          CAD: Number(data.rates.CAD) || DEFAULT_EXCHANGE_RATES.CAD,
          AUD: Number(data.rates.AUD) || DEFAULT_EXCHANGE_RATES.AUD,
          SGD: Number(data.rates.SGD) || DEFAULT_EXCHANGE_RATES.SGD,
          PHP: Number(data.rates.PHP) || DEFAULT_EXCHANGE_RATES.PHP,
        };

        const lastUpdated = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
        cachedData = { rates, lastUpdated, provider: 'api.frankfurter.app' };
        lastFetchTime = now;

        return NextResponse.json(
          {
            success: true,
            base: 'USD',
            rates,
            lastUpdated,
            provider: 'api.frankfurter.app',
            cached: false,
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
            },
          }
        );
      }
    }
  } catch (err) {
    console.warn('Secondary exchange rates provider failed:', err);
  }

  // 3. Fallback: Return cached data if exists, or robust defaults
  const fallbackRates = cachedData?.rates || DEFAULT_EXCHANGE_RATES;
  const fallbackUpdated = cachedData?.lastUpdated || new Date().toISOString();

  return NextResponse.json(
    {
      success: true,
      base: 'USD',
      rates: fallbackRates,
      lastUpdated: fallbackUpdated,
      provider: cachedData ? cachedData.provider : 'offline-baseline',
      fallback: true,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    }
  );
}
