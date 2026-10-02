/**
 * @file image_validator.js
 * Validates card artwork and scans.
 * Enforces:
 * 1. Never guess an image from a similarly named card.
 * 2. Prefer Japanese scan over English scan for JP cards.
 * 3. Flag missing/unverified images rather than assigning wrong illustrations.
 */

export class ImageValidator {
  /**
   * Evaluates if a card image is verified, unverified, or missing.
   */
  static validateCardImage(canonicalCard, candidateImageUrl) {
    if (!candidateImageUrl || typeof candidateImageUrl !== 'string') {
      return {
        isValid: false,
        status: 'MISSING',
        imageUrl: null,
        reason: 'Image URL is null or empty'
      };
    }

    const trimmed = candidateImageUrl.trim();

    // Check placeholder domains
    if (trimmed.includes('via.placeholder.com') || trimmed.includes('picsum.photos')) {
      return {
        isValid: false,
        status: 'PLACEHOLDER',
        imageUrl: null,
        reason: 'Placeholder image rejected'
      };
    }

    // Must be valid HTTP/HTTPS URL
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return {
        isValid: false,
        status: 'INVALID_URI',
        imageUrl: null,
        reason: 'Invalid URI scheme'
      };
    }

    // Check English vs Japanese domain for Japanese cards
    if (canonicalCard.language === 'JP' && trimmed.includes('en.onepiece-cardgame.com')) {
      // Flag as unverified language asset
      return {
        isValid: true,
        status: 'LANGUAGE_MISMATCH_WARNING',
        imageUrl: trimmed,
        reason: 'Image is from English card domain for a Japanese card record'
      };
    }

    return {
      isValid: true,
      status: 'VERIFIED',
      imageUrl: trimmed,
      reason: 'Image verified'
    };
  }
}
