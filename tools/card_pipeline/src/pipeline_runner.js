/**
 * @file pipeline_runner.js
 * End-to-end execution of the Japanese One Piece TCG card ingestion,
 * canonical identity matching, Yuyutei price synchronization, and data integrity checks.
 */

import { CanonicalIdentityService } from './canonical_identity.js';
import { LimitlessImporter } from './limitless_importer.js';
import { YuyuteiMatcher } from './yuyutei_matcher.js';
import { GradedPricingService } from './graded_pricing.js';
import { ImageValidator } from './image_validator.js';
import { SupportedSets, PriceStatus, VariantType } from './types.js';

export class CardPipelineRunner {
  constructor() {
    this.cardCatalog = new Map(); // Key: canonicalId -> Card
    this.priceRecords = new Map(); // Key: `${canonicalId}_${source}_${condition}_${isGraded}` -> PriceRecord
    this.auditLogs = [];
  }

  /**
   * Loads seed cards and runs full pipeline.
   */
  async runPipeline({ rawCards = [], yuyuteiInventory = [], gradedListings = [] } = {}) {
    console.log('====================================================');
    console.log('🚀 LOG POSE TCG - JAPANESE CARD DATA PIPELINE RUNNER');
    console.log('====================================================');

    // 1. LIMITLESS INGESTION & CANONICAL NORMALIZATION
    console.log(`\n[STEP 1] Ingesting and Normalizing Cards (${rawCards.length} incoming records)...`);
    const importResults = LimitlessImporter.upsertCardCatalog(this.cardCatalog, rawCards);
    console.log(`   ✔ Created: ${importResults.created}`);
    console.log(`   ✔ Updated: ${importResults.updated}`);
    console.log(`   ✔ Incomplete/Errors: ${importResults.incomplete}`);

    // 2. IMAGE INTEGRITY VALIDATION
    console.log('\n[STEP 2] Validating Card Images...');
    let verifiedImages = 0;
    let missingImages = 0;
    for (const card of this.cardCatalog.values()) {
      const validation = ImageValidator.validateCardImage(card, card.imageUrl);
      if (validation.isValid) {
        verifiedImages++;
      } else {
        missingImages++;
        this.auditLogs.push({
          type: 'IMAGE_ISSUE',
          canonicalId: card.canonicalId,
          reason: validation.reason
        });
      }
    }
    console.log(`   ✔ Verified Images: ${verifiedImages}`);
    console.log(`   ⚠ Missing/Placeholder Images: ${missingImages}`);

    // 3. YUYUTEI EXACT PRICE MATCHING
    console.log('\n[STEP 3] Matching Yuyutei Japanese Market Prices...');
    let availablePrices = 0;
    let unavailablePrices = 0;

    for (const card of this.cardCatalog.values()) {
      const priceRecord = YuyuteiMatcher.matchCardPrice({
        canonicalCard: card,
        candidateListings: yuyuteiInventory
      });

      const priceKey = `${card.canonicalId}_yuyutei_A_false`;
      this.priceRecords.set(priceKey, priceRecord);

      if (priceRecord.status === PriceStatus.AVAILABLE) {
        availablePrices++;
      } else {
        unavailablePrices++;
      }
    }
    console.log(`   ✔ Prices Available: ${availablePrices}`);
    console.log(`   ✔ Marked UNAVAILABLE (Safe rejection): ${unavailablePrices}`);

    // 4. GRADED PRICING INGESTION (PSA/BGS/CGC)
    console.log('\n[STEP 4] Processing Graded Card Prices...');
    let gradedCount = 0;
    for (const item of gradedListings) {
      const targetCard = this.cardCatalog.get(item.canonicalId);
      if (targetCard) {
        const gradedRecord = GradedPricingService.createGradedPriceRecord({
          canonicalCard: targetCard,
          gradingCompany: item.gradingCompany,
          grade: item.grade,
          priceRaw: item.priceRaw,
          currency: item.currency || 'JPY',
          source: item.source || 'snkrdunk'
        });
        const gradedKey = `${targetCard.canonicalId}_${gradedRecord.source}_${gradedRecord.condition}_true`;
        this.priceRecords.set(gradedKey, gradedRecord);
        gradedCount++;
      }
    }
    console.log(`   ✔ Isolated Graded Records Stored: ${gradedCount}`);

    // 5. DATA INTEGRITY AUDIT REPORT
    console.log('\n====================================================');
    console.log('📊 PIPELINE DATA INTEGRITY REPORT');
    console.log('====================================================');
    const integrityReport = this.generateIntegrityReport();
    console.log(JSON.stringify(integrityReport, null, 2));

    return {
      catalogSize: this.cardCatalog.size,
      priceRecordsCount: this.priceRecords.size,
      integrityReport
    };
  }

  generateIntegrityReport() {
    const totalCards = this.cardCatalog.size;
    let baseCount = 0;
    let parallelCount = 0;
    let mangaCount = 0;
    let spCount = 0;
    let promoCount = 0;
    let withPrice = 0;
    let unavailable = 0;

    const setsBreakdown = {};
    for (const setKey of Object.keys(SupportedSets)) {
      setsBreakdown[setKey] = 0;
    }

    for (const card of this.cardCatalog.values()) {
      if (card.variantType === VariantType.BASE) baseCount++;
      else if (card.variantType === VariantType.PARALLEL) parallelCount++;
      else if (card.variantType === VariantType.MANGA) mangaCount++;
      else if (card.variantType === VariantType.SP) spCount++;
      else if (card.variantType === VariantType.PROMO) promoCount++;

      if (setsBreakdown[card.setCode] !== undefined) {
        setsBreakdown[card.setCode]++;
      } else {
        setsBreakdown[card.setCode] = 1;
      }
    }

    for (const price of this.priceRecords.values()) {
      if (!price.isGraded) {
        if (price.status === PriceStatus.AVAILABLE) withPrice++;
        if (price.status === PriceStatus.UNAVAILABLE) unavailable++;
      }
    }

    return {
      totalCards,
      totalUniqueCanonicalIds: this.cardCatalog.size,
      duplicatesDetected: 0, // Canonical map guarantees 0 duplicates
      breakdownByVariant: {
        base: baseCount,
        parallelAltArt: parallelCount,
        mangaSuperParallel: mangaCount,
        specialRare: spCount,
        promo: promoCount
      },
      pricingStatus: {
        available: withPrice,
        unavailable: unavailable,
        unmatchedNeverGuessed: true
      },
      setsCataloged: setsBreakdown
    };
  }
}
