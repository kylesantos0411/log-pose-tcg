/**
 * @file types.js
 * Core enumeration and domain types for Japanese One Piece TCG pipeline.
 */

export const PriceStatus = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  SCRAPE_ERROR: 'SCRAPE_ERROR',
  NOT_CHECKED: 'NOT_CHECKED'
};

export const VariantType = {
  BASE: 'BASE',
  PARALLEL: 'PARALLEL',
  MANGA: 'MANGA',
  SP: 'SP',
  SPECIAL: 'SPECIAL',
  PROMO: 'PROMO',
  BOX_TOPPER: 'BOX_TOPPER'
};

export const Language = {
  JP: 'JP',
  EN: 'EN'
};

export const GameCode = {
  ONE_PIECE: 'OPT'
};

export const GradingCompany = {
  PSA: 'PSA',
  BGS: 'BGS',
  CGC: 'CGC'
};

export const SupportedSets = {
  'OP-01': { setCode: 'OP-01', normalizedCode: 'OP01', name: 'Romance Dawn', releaseDate: '2022-07-22' },
  'OP-02': { setCode: 'OP-02', normalizedCode: 'OP02', name: 'Paramount War', releaseDate: '2022-11-04' },
  'OP-03': { setCode: 'OP-03', normalizedCode: 'OP03', name: 'Pillars of Strength', releaseDate: '2023-02-11' },
  'OP-04': { setCode: 'OP-04', normalizedCode: 'OP04', name: 'Kingdoms of Intrigue', releaseDate: '2023-05-27' },
  'OP-05': { setCode: 'OP-05', normalizedCode: 'OP05', name: 'Awakening of the New Era', releaseDate: '2023-08-26' },
  'OP-06': { setCode: 'OP-06', normalizedCode: 'OP06', name: 'Flamboyant Fortunes', releaseDate: '2023-11-25' },
  'OP-07': { setCode: 'OP-07', normalizedCode: 'OP07', name: '500 Years in the Future', releaseDate: '2024-02-24' },
  'OP-08': { setCode: 'OP-08', normalizedCode: 'OP08', name: 'Two Legends', releaseDate: '2024-05-25' },
  'OP-09': { setCode: 'OP-09', normalizedCode: 'OP09', name: 'Emperors in the New World', releaseDate: '2024-08-31' },
  'OP-10': { setCode: 'OP-10', normalizedCode: 'OP10', name: 'Royal Bloodlines', releaseDate: '2024-11-30' },
  'EB-01': { setCode: 'EB-01', normalizedCode: 'EB01', name: 'Memorial Collection', releaseDate: '2024-01-27' },
  'EB-02': { setCode: 'EB-02', normalizedCode: 'EB02', name: 'Anime 25th Collection', releaseDate: '2024-09-28' },
  'PRB-01': { setCode: 'PRB-01', normalizedCode: 'PRB01', name: 'The Best Premium Booster', releaseDate: '2024-07-27' },
  'ST-01': { setCode: 'ST-01', normalizedCode: 'ST01', name: 'Straw Hat Crew Starter Deck', releaseDate: '2022-07-08' },
  'ST-02': { setCode: 'ST-02', normalizedCode: 'ST02', name: 'Worst Generation Starter Deck', releaseDate: '2022-07-08' },
  'PROMO': { setCode: 'PROMO', normalizedCode: 'PROMO', name: 'Promotional Cards', releaseDate: '2022-07-01' }
};
