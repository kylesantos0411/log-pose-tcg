/**
 * @file yuyutei_matcher.js
 * High-precision Yuyutei Japanese card pricing and matching service.
 * Enforces exact card identity matching and strict separation of status:
 * AVAILABLE, UNAVAILABLE, SCRAPE_ERROR, NOT_CHECKED.
 */

import { PriceStatus, VariantType } from './types.js';
import { CanonicalIdentityService } from './canonical_identity.js';

export class YuyuteiMatcher {
  /**
   * Reference JPY to PHP exchange rate (configurable).
   * 1 JPY = ~0.375 PHP
   */
  static JPY_TO_PHP_RATE = 0.375;

  /**
   * Evaluates if a candidate listing from Yuyutei exactly matches the target canonical card.
   * NEVER matches on card name or character name alone.
   */
  static isExactYuyuteiMatch(canonicalCard, yuyuteiProduct) {
    if (!canonicalCard || !yuyuteiProduct) return false;

    // 1. Strict Card Number Check (e.g. OP01-025 vs OP01-025)
    const candidateNumRaw = yuyuteiProduct.cardNumber || yuyuteiProduct.card_number || yuyuteiProduct.cardCode || '';
    if (!candidateNumRaw) {
      return false; // Cannot match listing without card number
    }

    const targetNum = CanonicalIdentityService.normalizeCardNumber(canonicalCard.cardNumber);
    const candidateNum = CanonicalIdentityService.normalizeCardNumber(candidateNumRaw);

    if (targetNum !== candidateNum) {
      return false; // Instant rejection: Different card numbers must never match!
    }

    // 2. Set Check & Extraction from setCode, URL, or Title
    const targetSet = CanonicalIdentityService.normalizeSetCode(canonicalCard.setCode);
    let candidateSet = null;

    if (yuyuteiProduct.setCode) {
      candidateSet = CanonicalIdentityService.normalizeSetCode(yuyuteiProduct.setCode);
    } else if (yuyuteiProduct.url) {
      const urlMatch = yuyuteiProduct.url.match(/\/card\/([a-z0-9]+)\//i) || yuyuteiProduct.url.match(/\/s\/([a-z0-9]+)/i);
      if (urlMatch) {
        candidateSet = CanonicalIdentityService.normalizeSetCode(urlMatch[1]);
      }
    }

    const candidateTitle = String(yuyuteiProduct.name || yuyuteiProduct.title || '');
    if (!candidateSet) {
      if (candidateTitle.includes('(PRB)') || candidateTitle.includes('PRB01') || candidateTitle.includes('THE BEST')) {
        candidateSet = 'PRB-01';
      }
    }

    if (candidateSet) {
      if (targetSet !== candidateSet) {
        return false;
      }
    } else {
      // If candidateSet cannot be inferred, verify reprint cards:
      // If canonical card is a reprint in PRB-01 (or other set) with a card number prefix
      // differing from its setCode (e.g. OP01-001 in PRB-01), do not falsely match an unverified listing.
      const targetCardSetPrefix = targetNum.split('-')[0];
      const targetSetClean = targetSet.replace(/[^A-Z0-9]/g, '');
      const isReprintCard = targetCardSetPrefix !== targetSetClean;

      if (isReprintCard) {
        return false;
      }
    }

    // 3. Variant & Parallel Suffix/Prefix Check
    // Yuyutei designates Parallels as "SR-P", "L-P", "SEC-P", "SP",
    // or PRB prefix rarities "P-L", "P-SR", "P-SEC", "P-R", "P-UC", "P-C", or mentions パラレル / コミック
    const candidateRarity = String(yuyuteiProduct.rarity || '').toUpperCase();

    const isCandidateParallel = 
      candidateRarity.endsWith('-P') || 
      (candidateRarity.startsWith('P-') && candidateRarity !== 'P' && candidateRarity.length > 2) ||
      candidateRarity.includes('PARALLEL') ||
      candidateTitle.includes('パラレル') ||
      candidateTitle.includes('Parallel') ||
      candidateTitle.includes('コミック') ||
      candidateTitle.includes('スーパーパラレル');

    const isCandidateManga = 
      candidateTitle.includes('コミック') || 
      candidateTitle.includes('スーパーパラレル') ||
      candidateTitle.includes('Manga');

    const isTargetParallel = canonicalCard.variantType === VariantType.PARALLEL;
    const isTargetManga = canonicalCard.variantType === VariantType.MANGA;

    if (isTargetManga) {
      return isCandidateManga;
    }

    if (isTargetParallel) {
      return isCandidateParallel && !isCandidateManga;
    }

    // Base card must NOT match a parallel or manga listing!
    if (canonicalCard.variantType === VariantType.BASE) {
      if (isCandidateParallel || isCandidateManga) {
        return false;
      }
      // Rarity comparison
      if (canonicalCard.rarity && yuyuteiProduct.rarity) {
        const cleanTargetRarity = canonicalCard.rarity.replace(/^P-/, '').replace(/-P$/, '').replace(/[^A-Z]/g, '');
        const cleanCandidateRarity = yuyuteiProduct.rarity.replace(/^P-/, '').replace(/-P$/, '').replace(/[^A-Z]/g, '');
        if (cleanTargetRarity !== cleanCandidateRarity) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Matches a canonical card against candidate search results from Yuyutei.
   * If an exact match is found, returns status AVAILABLE with price.
   * If search succeeds but no product qualifies, returns status UNAVAILABLE (never substitutes another card).
   * If search threw an error or timed out, returns status SCRAPE_ERROR (retains old price).
   */
  static matchCardPrice({
    canonicalCard,
    candidateListings = [],
    scrapeError = null,
    previousPriceRecord = null
  }) {
    const timestamp = new Date().toISOString();

    // 1. Technical Scrape Failure Handling
    if (scrapeError) {
      return {
        cardId: canonicalCard.id || null,
        canonicalId: canonicalCard.canonicalId,
        source: 'yuyutei',
        // Retain previous valid price if available; do NOT wipe out data on temporary failure!
        priceRaw: previousPriceRecord ? previousPriceRecord.priceRaw : null,
        currency: 'JPY',
        pricePhp: previousPriceRecord ? previousPriceRecord.pricePhp : null,
        status: PriceStatus.SCRAPE_ERROR,
        condition: 'A',
        isGraded: false,
        lastCheckedAt: timestamp,
        notes: `Scrape error: ${scrapeError.message || String(scrapeError)}`,
        externalUrl: previousPriceRecord?.externalUrl || null,
        externalId: previousPriceRecord?.externalId || null
      };
    }

    // 2. Exact Match Search
    let matchedProduct = null;
    for (const listing of candidateListings) {
      if (this.isExactYuyuteiMatch(canonicalCard, listing)) {
        matchedProduct = listing;
        break; // First verified exact match
      }
    }

    // 3. Exact Match Found -> AVAILABLE
    if (matchedProduct) {
      const priceJpy = Number(matchedProduct.price);
      if (!isNaN(priceJpy) && priceJpy >= 0) {
        const pricePhp = Number((priceJpy * this.JPY_TO_PHP_RATE).toFixed(2));
        return {
          cardId: canonicalCard.id || null,
          canonicalId: canonicalCard.canonicalId,
          source: 'yuyutei',
          priceRaw: priceJpy,
          currency: 'JPY',
          pricePhp,
          status: PriceStatus.AVAILABLE,
          condition: matchedProduct.condition || 'A',
          isGraded: false,
          lastCheckedAt: timestamp,
          notes: 'Exact match verified',
          externalUrl: matchedProduct.url || null,
          externalId: matchedProduct.productId || null
        };
      }
    }

    // 4. No Exact Match Found -> UNAVAILABLE
    // Card exists in catalog, but Yuyutei does not have an exact listing
    return {
      cardId: canonicalCard.id || null,
      canonicalId: canonicalCard.canonicalId,
      source: 'yuyutei',
      priceRaw: null,
      currency: 'JPY',
      pricePhp: null,
      status: PriceStatus.UNAVAILABLE,
      condition: 'A',
      isGraded: false,
      lastCheckedAt: timestamp,
      notes: 'No exact card match found on Yuyutei stock',
      externalUrl: null,
      externalId: null
    };
  }
}
