/**
 * @file canonical_identity.js
 * Authoritative Canonical Card Identity generator and normalizer.
 * Format: {GAME}_{SET_CODE}_{CARD_NUMBER}_{VARIANT}_{LANGUAGE}
 * Example: OPT_OP01_OP01-025_BASE_JP
 * Example: OPT_OP01_OP01-025_PARALLEL_JP
 * Example: OPT_OP01_OP01-120_MANGA_JP
 */

import { GameCode, VariantType, Language, SupportedSets } from './types.js';

export class CanonicalIdentityService {
  /**
   * Normalizes a set code into the standard hyphenated format (e.g. "OP01" -> "OP-01").
   */
  static normalizeSetCode(raw) {
    if (!raw) throw new Error('Set code cannot be empty');
    const cleaned = String(raw).trim().toUpperCase();

    // Check direct match
    if (SupportedSets[cleaned]) return SupportedSets[cleaned].setCode;

    // Check aliases: PRB / THE BEST -> PRB-01
    if (cleaned === 'PRB' || cleaned === 'THE BEST' || cleaned === 'ONE PIECE CARD THE BEST') {
      return 'PRB-01';
    }

    // Check without hyphen (e.g. OP01 -> OP-01, EB01 -> EB-01, PRB01 -> PRB-01, ST01 -> ST-01)
    for (const info of Object.values(SupportedSets)) {
      if (info.normalizedCode === cleaned || info.setCode === cleaned) {
        return info.setCode;
      }
    }

    // Pattern matching: OP01 -> OP-01, PRB1 -> PRB-01
    const match = cleaned.match(/^([A-Z]+)[-_]?0*([0-9]+)$/);
    if (match) {
      const prefix = match[1];
      const num = match[2].padStart(2, '0');
      const candidate = `${prefix}-${num}`;
      if (SupportedSets[candidate]) return SupportedSets[candidate].setCode;
      return candidate;
    }

    if (cleaned.includes('PROMO')) return 'PROMO';

    return cleaned;
  }

  /**
   * Normalizes card numbers (e.g. "op01-001" -> "OP01-001", "PRB-01-001" -> "PRB01-001", "PRB01001" -> "PRB01-001").
   */
  static normalizeCardNumber(raw) {
    if (!raw) throw new Error('Card number cannot be empty');
    const cleaned = String(raw).trim().toUpperCase();

    // 1. Handle multi-hyphen/multi-part formats: PRB-01-001, OP-01-025, EB-01-006, ST-01-012
    const multiHyphenMatch = cleaned.match(/^([A-Z]+)[-_]([0-9]{1,2})[-_]([0-9]{3,4})$/);
    if (multiHyphenMatch) {
      const prefix = multiHyphenMatch[1];
      const setNum = multiHyphenMatch[2].padStart(2, '0');
      const cardNum = multiHyphenMatch[3];
      return `${prefix}${setNum}-${cardNum}`;
    }

    // 2. Standard hyphenated card number regex (OP01-001, ST01-001, EB01-001, P-001, PRB01-001)
    const match = cleaned.match(/^([A-Z0-9]+)[-_]([0-9]{3,4})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }

    // 3. Unhyphenated card number regex (e.g. PRB01001 -> PRB01-001, OP01025 -> OP01-025)
    const unhyphenMatch = cleaned.match(/^([A-Z]+[0-9]{2})([0-9]{3,4})$/);
    if (unhyphenMatch) {
      return `${unhyphenMatch[1]}-${unhyphenMatch[2]}`;
    }

    return cleaned;
  }

  /**
   * Determines the canonical variant type from card attributes, names, and flags.
   */
  static detectVariantType(metadata = {}) {
    const name = String(metadata.name || '').toLowerCase();
    const rarity = String(metadata.rarity || '').toUpperCase();
    const variantTag = String(metadata.variant || metadata.variant_type || '').toUpperCase();
    const flags = String(metadata.flags || '').toLowerCase();
    const cardNumber = String(metadata.cardNumber || metadata.card_number || metadata.number || '').toUpperCase();

    if (variantTag.includes('MANGA') || name.includes('manga') || flags.includes('manga') || flags.includes('comic')) {
      return VariantType.MANGA;
    }
    if (
      variantTag.includes('PARALLEL') ||
      name.includes('parallel') ||
      flags.includes('parallel') ||
      variantTag === 'AA' ||
      flags.includes('alt art')
    ) {
      return VariantType.PARALLEL;
    }
    // PRB parallel rarity prefixes: P-L, P-SR, P-SEC, P-R, P-UC, P-C (not standalone P which is Promo)
    if (
      (rarity.startsWith('P-') && !cardNumber.startsWith('P-') && rarity.length > 2) ||
      rarity.endsWith('-P')
    ) {
      return VariantType.PARALLEL;
    }
    if (variantTag.includes('SP') || rarity === 'SP' || flags.includes('special rare')) {
      return VariantType.SP;
    }
    if (variantTag.includes('BOX_TOPPER') || flags.includes('box topper')) {
      return VariantType.BOX_TOPPER;
    }
    if (variantTag.includes('PROMO') || rarity === 'P' || cardNumber.startsWith('P-')) {
      return VariantType.PROMO;
    }

    return VariantType.BASE;
  }

  /**
   * Generates the unique, collision-proof canonical card ID.
   */
  static buildCanonicalId({
    game = GameCode.ONE_PIECE,
    setCode,
    cardNumber,
    variantType = VariantType.BASE,
    language = Language.JP
  }) {
    const normSet = this.normalizeSetCode(setCode).replace(/[^A-Z0-9]/g, '');
    const normNum = this.normalizeCardNumber(cardNumber);
    const normVar = String(variantType).toUpperCase();
    const normLang = String(language).toUpperCase();

    return `${game}_${normSet}_${normNum}_${normVar}_${normLang}`;
  }

  /**
   * Deconstructs a canonical card ID into its components.
   */
  static parseCanonicalId(canonicalId) {
    if (!canonicalId) throw new Error('Invalid canonical ID');
    const parts = String(canonicalId).split('_');
    if (parts.length < 5) {
      throw new Error(`Malformed canonical ID: "${canonicalId}". Expected 5 parts separated by underscore.`);
    }

    return {
      game: parts[0],
      normalizedSetCode: parts[1],
      cardNumber: parts[2],
      variantType: parts[3],
      language: parts[4]
    };
  }

  /**
   * Verifies if two card representations refer to the exact same canonical card.
   */
  static isExactMatch(cardA, cardB) {
    if (!cardA || !cardB) return false;

    // Direct canonical ID match
    if (cardA.canonicalId && cardB.canonicalId) {
      return cardA.canonicalId === cardB.canonicalId;
    }

    const numARaw = cardA.cardNumber || cardA.card_number || (cardA.canonicalId ? this.parseCanonicalId(cardA.canonicalId).cardNumber : null);
    const numBRaw = cardB.cardNumber || cardB.card_number || (cardB.canonicalId ? this.parseCanonicalId(cardB.canonicalId).cardNumber : null);
    if (!numARaw || !numBRaw) return false;

    const numA = this.normalizeCardNumber(numARaw);
    const numB = this.normalizeCardNumber(numBRaw);
    if (numA !== numB) return false;

    const setARaw = cardA.setCode || cardA.set_code || cardA.set || (cardA.canonicalId ? this.parseCanonicalId(cardA.canonicalId).normalizedSetCode : null);
    const setBRaw = cardB.setCode || cardB.set_code || cardB.set || (cardB.canonicalId ? this.parseCanonicalId(cardB.canonicalId).normalizedSetCode : null);
    if (!setARaw || !setBRaw) return false;

    const setA = this.normalizeSetCode(setARaw);
    const setB = this.normalizeSetCode(setBRaw);
    if (setA !== setB) return false;

    const varA = cardA.variantType || this.detectVariantType(cardA);
    const varB = cardB.variantType || this.detectVariantType(cardB);
    if (varA !== varB) return false;

    const langA = cardA.language || Language.JP;
    const langB = cardB.language || Language.JP;
    return langA === langB;
  }
}
