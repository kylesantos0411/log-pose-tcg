/**
 * @file graded_pricing.js
 * Dedicated service for PSA/BGS/CGC Graded Card pricing.
 * Strictly guarantees that graded prices NEVER overwrite raw market prices.
 */

import { PriceStatus, GradingCompany } from './types.js';

export class GradedPricingService {
  /**
   * Creates a dedicated graded card price record tied to a canonical card.
   */
  static createGradedPriceRecord({
    canonicalCard,
    gradingCompany,
    grade,
    priceRaw,
    currency = 'JPY',
    source = 'snkrdunk',
    externalUrl = null,
    externalId = null
  }) {
    if (!canonicalCard) throw new Error('Canonical card is required');
    if (!gradingCompany || !Object.values(GradingCompany).includes(gradingCompany.toUpperCase())) {
      throw new Error(`Invalid grading company: "${gradingCompany}". Supported: ${Object.values(GradingCompany).join(', ')}`);
    }
    if (!grade) throw new Error('Grade is required (e.g. 10, 9.5, 9)');

    const cleanCompany = gradingCompany.toUpperCase();
    const cleanGrade = String(grade).trim();
    const numPrice = Number(priceRaw);
    const validPrice = !isNaN(numPrice) && numPrice > 0 ? numPrice : null;

    // JPY to PHP reference rate
    const pricePhp = validPrice != null && currency === 'JPY' ? Number((validPrice * 0.375).toFixed(2)) : null;

    return {
      cardId: canonicalCard.id || null,
      canonicalId: canonicalCard.canonicalId,
      source: String(source).toLowerCase(),
      priceRaw: validPrice,
      currency: currency.toUpperCase(),
      pricePhp,
      status: validPrice != null ? PriceStatus.AVAILABLE : PriceStatus.UNAVAILABLE,
      condition: `GRADED_${cleanCompany}_${cleanGrade}`,
      isGraded: true, // STRICT FLAG: Never allow graded price to be treated as raw!
      gradingCompany: cleanCompany,
      grade: cleanGrade,
      externalUrl,
      externalId,
      lastCheckedAt: new Date().toISOString(),
      notes: `${cleanCompany} ${cleanGrade} verified graded price`
    };
  }
}
