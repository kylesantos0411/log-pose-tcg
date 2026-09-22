/**
 * Card ID formatting utility for Log Pose TCG.
 * 
 * Replaces internal Bandai database suffixes like `_p1`, `_p2`, `_r1`
 * with clean, official collector designations:
 * - EB04-039_p1 -> EB04-039 (Alt Art) or EB04-039 (Parallel)
 * - EB04-039_p2 -> EB04-039 (Alt Art #2) or EB04-039 (Parallel #2)
 * - EB01-006_r1 -> EB01-006 (Reprint)
 */

export type AltArtLabelStyle = 'alt_art' | 'parallel';

export interface FormattedCardId {
  baseId: string;              // e.g. "EB04-039"
  rawId: string;               // e.g. "EB04-039_p1"
  hasVariant: boolean;         // true if _p or _r suffix
  variantType: 'base' | 'parallel' | 'reprint';
  variantNum?: number;         // 1, 2, 5...
  variantLabel: string | null; // "Alt Art", "Parallel", "Alt Art #2", "Reprint"
  displayId: string;           // "EB04-039 (Alt Art)" or "EB04-039"
}

export function formatCardId(
  cardId?: string | null,
  style: AltArtLabelStyle = 'alt_art'
): FormattedCardId {
  if (!cardId) {
    return {
      baseId: '',
      rawId: '',
      hasVariant: false,
      variantType: 'base',
      variantLabel: null,
      displayId: '',
    };
  }

  const [baseId, suffix] = cardId.split('_');

  if (!suffix) {
    return {
      baseId,
      rawId: cardId,
      hasVariant: false,
      variantType: 'base',
      variantLabel: null,
      displayId: baseId,
    };
  }

  // Suffix matching for Parallel / Alternate Art: _p1, _p2, _p5...
  const pMatch = suffix.match(/^p(\d+)$/i);
  if (pMatch) {
    const num = parseInt(pMatch[1], 10);
    const label =
      style === 'parallel'
        ? num === 1
          ? 'Parallel'
          : `Parallel #${num}`
        : num === 1
        ? 'Alt Art'
        : `Alt Art #${num}`;

    return {
      baseId,
      rawId: cardId,
      hasVariant: true,
      variantType: 'parallel',
      variantNum: num,
      variantLabel: label,
      displayId: `${baseId} (${label})`,
    };
  }

  // Suffix matching for Reprint / Revision: _r1, _r2...
  const rMatch = suffix.match(/^r(\d+)$/i);
  if (rMatch) {
    const num = parseInt(rMatch[1], 10);
    const label = num === 1 ? 'Reprint' : `Reprint #${num}`;

    return {
      baseId,
      rawId: cardId,
      hasVariant: true,
      variantType: 'reprint',
      variantNum: num,
      variantLabel: label,
      displayId: `${baseId} (${label})`,
    };
  }

  // Generic fallback for any other suffix
  const label = suffix.toUpperCase();
  return {
    baseId,
    rawId: cardId,
    hasVariant: true,
    variantType: 'parallel',
    variantLabel: label,
    displayId: `${baseId} (${label})`,
  };
}

/**
 * Strips "(Alt Art)", "(Parallel)", "(Reprint)" from user search input
 * so users can paste formatted codes into search bars and find cards seamlessly.
 */
export function cleanCardSearchQuery(query: string): string {
  if (!query) return '';
  return query
    .replace(/\s*\((Alt Art|Parallel|Reprint|Promo)[^)]*\)/gi, '')
    .trim();
}
