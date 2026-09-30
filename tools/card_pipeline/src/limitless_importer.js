/**
 * @file limitless_importer.js
 * Importer and normalizer for Limitless TCG Japanese One Piece cards.
 * Ensures complete coverage, non-duplicated upserts, and authentic Japanese card metadata.
 */

import { CanonicalIdentityService } from './canonical_identity.js';
import { GameCode, VariantType, Language, SupportedSets } from './types.js';

export class LimitlessImporter {
  /**
   * Normalizes a raw scraped Limitless card object into a CanonicalCard.
   */
  static normalizeRawCard(raw, contextSetCode = null) {
    if (!raw.cardNumber && !raw.card_number && !raw.number) {
      throw new Error(`Cannot import card: missing card number in record ${JSON.stringify(raw)}`);
    }

    const cardNumber = CanonicalIdentityService.normalizeCardNumber(
      raw.cardNumber || raw.card_number || raw.number
    );

    // Prefer context set code, fallback to card set code
    const rawSet = contextSetCode || raw.setCode || raw.set_code || raw.set;
    if (!rawSet) {
      throw new Error(`Cannot import card ${cardNumber}: missing set affiliation`);
    }
    const setCode = CanonicalIdentityService.normalizeSetCode(rawSet);

    // Detect variant
    const variantType = CanonicalIdentityService.detectVariantType({
      ...raw,
      cardNumber
    });

    const isAlternateArt = variantType !== VariantType.BASE;

    const canonicalId = CanonicalIdentityService.buildCanonicalId({
      game: GameCode.ONE_PIECE,
      setCode,
      cardNumber,
      variantType,
      language: raw.language || Language.JP
    });

    // Clean name handling (Japanese and English)
    const name = String(raw.name || raw.cardName || '').trim();
    const nameJa = String(raw.nameJa || raw.name_ja || raw.japaneseName || '').trim() || null;

    // Numerical stats normalization
    const cost = raw.cost != null && raw.cost !== '' && !isNaN(Number(raw.cost)) ? Number(raw.cost) : null;
    const power = raw.power != null && raw.power !== '' && !isNaN(Number(raw.power)) ? Number(raw.power) : null;
    const counter = raw.counter != null && raw.counter !== '' && !isNaN(Number(raw.counter)) ? Number(raw.counter) : null;

    // Image URL validation (must not be empty, must be valid URI)
    let imageUrl = raw.imageUrl || raw.image_url || raw.image || null;
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      imageUrl = null;
    }

    return {
      canonicalId,
      setCode,
      cardNumber,
      name: name || `Card ${cardNumber}`,
      nameJa,
      rarity: (raw.rarity || 'C').toUpperCase(),
      color: raw.color || 'Red',
      type: raw.type || 'Character',
      cost,
      power,
      counter,
      attribute: raw.attribute || null,
      effect: raw.effect || null,
      triggerEffect: raw.triggerEffect || raw.trigger_effect || raw.trigger || null,
      illustrator: raw.illustrator || null,
      imageUrl,
      variantType,
      language: raw.language || Language.JP,
      isAlternateArt,
      rawMetadata: {
        source: 'limitless',
        importedAt: new Date().toISOString(),
        originalData: raw
      }
    };
  }

  /**
   * Idempotent card catalog upsert against an existing memory or database map.
   * If card does not exist: inserts new record.
   * If card exists: updates metadata fields while preserving pricing, collection and user ties.
   */
  static upsertCardCatalog(existingCardMap, incomingCards) {
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      incomplete: 0,
      errors: []
    };

    for (const raw of incomingCards) {
      try {
        const normalized = this.normalizeRawCard(raw);

        // Quality check: Missing critical metadata
        if (!normalized.name || !normalized.cardNumber || !normalized.setCode) {
          results.incomplete++;
          results.errors.push({
            card: raw,
            reason: 'Missing critical metadata (name, cardNumber, or setCode)'
          });
          continue;
        }

        if (existingCardMap.has(normalized.canonicalId)) {
          // Card already exists - Safe update of changed metadata
          const existing = existingCardMap.get(normalized.canonicalId);
          existing.name = normalized.name;
          if (normalized.nameJa) existing.nameJa = normalized.nameJa;
          existing.effect = normalized.effect;
          existing.triggerEffect = normalized.triggerEffect;
          existing.cost = normalized.cost;
          existing.power = normalized.power;
          existing.counter = normalized.counter;
          if (normalized.imageUrl && (!existing.imageUrl || existing.imageUrl.includes('placeholder'))) {
            existing.imageUrl = normalized.imageUrl;
          }
          existing.updatedAt = new Date().toISOString();
          results.updated++;
        } else {
          // New card creation
          normalized.createdAt = new Date().toISOString();
          normalized.updatedAt = new Date().toISOString();
          existingCardMap.set(normalized.canonicalId, normalized);
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          card: raw,
          reason: err.message
        });
      }
    }

    return results;
  }
}
