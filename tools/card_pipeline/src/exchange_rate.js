/**
 * @file exchange_rate.js
 * Automatic retrieval and caching of live Japanese Yen (JPY) to Philippine Peso (PHP) FX rate.
 */

export class ExchangeRateService {
  static DEFAULT_JPY_TO_PHP = 0.375;
  static cachedRate = null;
  static lastFetchedAt = null;
  static CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetches latest JPY -> PHP exchange rate with resilient fallback.
   * @param {Object} options
   * @param {boolean} [options.forceRefresh=false]
   * @returns {Promise<number>}
   */
  static async getJpyToPhpRate({ forceRefresh = false } = {}) {
    const now = Date.now();
    if (!forceRefresh && this.cachedRate && this.lastFetchedAt && (now - this.lastFetchedAt < this.CACHE_TTL_MS)) {
      return this.cachedRate;
    }

    try {
      // Free public Open Exchange Rates / ExchangeRate-API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('https://open.er-api.com/v6/latest/JPY', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && typeof data.rates.PHP === 'number' && data.rates.PHP > 0) {
          this.cachedRate = data.rates.PHP;
          this.lastFetchedAt = now;
          console.log(`[ExchangeRateService] Live JPY -> PHP rate fetched: 1 JPY = ₱${this.cachedRate.toFixed(4)}`);
          return this.cachedRate;
        }
      }
    } catch (err) {
      console.warn(`[ExchangeRateService] Network fetch failed (${err.message}). Using fallback rate ₱${this.DEFAULT_JPY_TO_PHP}`);
    }

    this.cachedRate = this.DEFAULT_JPY_TO_PHP;
    this.lastFetchedAt = now;
    return this.DEFAULT_JPY_TO_PHP;
  }
}
