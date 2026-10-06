export function getSvgPlaceholderDataUrl(cardCode: string): string {
  const displayCode = (cardCode || 'OPTCG').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 490" width="100%" height="100%">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141724"/>
      <stop offset="50%" stop-color="#1b2030"/>
      <stop offset="100%" stop-color="#11131c"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="344" height="484" rx="20" fill="url(#g1)" stroke="url(#gold)" stroke-width="2.5"/>
  <rect x="15" y="15" width="320" height="460" rx="14" fill="none" stroke="#2e354a" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="175" cy="210" r="46" fill="#202536" stroke="#fbbf24" stroke-width="2"/>
  <polygon points="175,178 185,210 175,242 165,210" fill="#fbbf24"/>
  <circle cx="175" cy="210" r="6" fill="#141724"/>
  <text x="175" y="285" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="20" text-anchor="middle" letter-spacing="1">${displayCode}</text>
  <text x="175" y="310" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="600" font-size="11" text-anchor="middle" letter-spacing="2">ONE PIECE TCG</text>
  <text x="175" y="445" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="9" text-anchor="middle" letter-spacing="2">LOG POSE TCG</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSafeCardImageUrl(url?: string | null, cardId?: string | null): string {
  if (!url && !cardId) return '';
  if (url && url.startsWith('/')) return url;

  const cleanId = (cardId || '').trim();

  // If this card is in JP_CARD_IMAGE_MAP, pass its mapped URL
  let targetUrl = url || '';
  if (cleanId && JP_CARD_IMAGE_MAP[cleanId]) {
    targetUrl = JP_CARD_IMAGE_MAP[cleanId];
  }

  // 1. Direct high-speed BunnyCDN / Yuyu-tei URLs:
  // Can be loaded directly in the browser over HTTPS with 0 Vercel serverless proxy load
  if (targetUrl && targetUrl.startsWith('https://card.yuyu-tei.jp/')) {
    return targetUrl;
  }

  // 2. All other URLs (Bandai Asia-EN series 556117, Bandai JP, onepiececollection.fr HTTP, etc.)
  // MUST be routed through /api/card-image because Bandai sends 'Cross-Origin-Resource-Policy: same-site'
  // and HTTP gets blocked by browser mixed-content!
  const params = new URLSearchParams();
  if (cleanId) params.set('id', cleanId);
  if (targetUrl) {
    const cleanTargetUrl = targetUrl.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');
    params.set('url', cleanTargetUrl);
  }

  return `/api/card-image?${params.toString()}`;
}

/**
 * Graceful client-side fallback when an <img> fails to load
 */
export function handleCardImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  cardId?: string | null,
  fallbackUrl?: string | null
) {
  const target = e.currentTarget;
  const currentSrc = target.src || '';
  const cleanId = (cardId || '').trim();
  const baseId = cleanId.split('_')[0];

  // Stage 1: Route through /api/card-image to execute server-side multi-tier cascade
  // (Bandai Asia-EN series 556117 -> DB scan -> Bandai Japan -> Base card)
  if (!currentSrc.includes('/api/card-image')) {
    const params = new URLSearchParams();
    if (cleanId) params.set('id', cleanId);
    if (fallbackUrl) params.set('url', fallbackUrl);
    target.src = `/api/card-image?${params.toString()}`;
    return;
  }

  // Stage 2: High-fidelity Vector SVG Placeholder (guaranteed 100% success, zero network cost)
  target.src = getSvgPlaceholderDataUrl(cleanId || baseId || 'OPTCG');
}

// Explicit Japanese card image map when Bandai Japan index differs from Bandai English
export const JP_CARD_IMAGE_MAP: Record<string, string> = {
  // OP01-120 Shanks exact Japanese variations from Yuyu-tei & Bandai Japan
  'OP01-120':    'https://card.yuyu-tei.jp/opc/front/op01/10150.jpg',    // Base SEC (Makitoshi - ¥500)
  'OP01-120_p1': 'https://card.yuyu-tei.jp/opc/front/op01/10151.jpg',    // OP-01 Secret Parallel (¥3,980)
  'OP01-120_p2': 'https://card.yuyu-tei.jp/opc/front/op01/10152.jpg',    // OP-01 Manga Super Parallel (刻印なし - ¥128,000)
  'OP01-120_p4': 'https://card.yuyu-tei.jp/opc/front/op01/10152.jpg',    // OP-01 Manga Super Parallel (刻印なし - ¥128,000)
  'OP01-120_p5': 'https://card.yuyu-tei.jp/opc/front/prb01/10023.jpg',   // PRB-01 Parallel by lack (¥500)
  'OP01-120_p6': 'https://onepiece-cardgame.com/images/cardlist/card/OP01-120_p6.png', // PRB-01 Manga Super Parallel (刻印あり - ¥198,000)

  // Promotion Cards
  'P-094':       'https://card.yuyu-tei.jp/opc/front/promo-100/10117.jpg', // Roronoa Zoro (V Jump July 2024 - ¥980)
  'P-095':       'https://card.yuyu-tei.jp/opc/front/promo-100/10120.jpg', // Sanji (Saikyo Jump July 2024 - ¥420)

  // OP05-119 Monkey.D.Luffy exact 8 Japanese variations from Yuyu-tei & Bandai Japan
  'OP05-119':    'https://onepiece-cardgame.com/images/cardlist/card/OP05-119.png',      // Base SEC Laughing Gear 5 (¥780)
  'OP05-119_p1': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png',   // "GEAR 5" Comic Pop-Art (¥24,800)
  'OP05-119_p2': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p2.png',   // Manga Rare Super Parallel (¥598,000)
  'OP05-119_p3': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p3.png',   // PRB-01 Blue Lightning Punch (¥7,980)
  'OP05-119_p4': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p8.png',   // 2nd Anniv Kaido Punch (¥19,800)
  'OP05-119_p6': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p5.png',   // WANTED POSTER SP (¥59,800)
  'OP05-119_p7': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p6.png',   // Silver Parallel SP (¥498,000)
  'OP05-119_p8': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p7.png',   // Gold Parallel SP (¥1,280,000)

  // EB04-061 Monkey.D.Luffy (OP-17 / EB-04 The World's Strongest Warriors)
  'EB04-061':    'https://asia-en.onepiece-cardgame.com/images/cardlist/card/EB04-061.png',       // Base SEC Laughing Gear 5
  'EB04-061_p1': 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/EB04-061_p1.png',    // Parallel Alt Art (Lightning/Stars)
  'EB04-061_p2': 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/EB04-061_p3.png',    // Manga Rare Super Parallel (Straw Hat Crew Medallion - ¥1,480,000)
  'EB04-061_p3': 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/EB04-061_p3.png',    // Manga Rare Super Parallel (Bandai Series 556117)
};

/**
 * Returns the official Bandai card image URL for Japanese edition.
 */
export function getEditionCardImageUrl(cardId: string, lang: 'en' | 'jp' = 'jp', fallbackUrl?: string | null): string {
  const cleanId = (cardId || '').trim();

  // Check explicit Japanese map first to prevent index shifts between EN and JP Bandai
  if (cleanId && JP_CARD_IMAGE_MAP[cleanId]) {
    return getSafeCardImageUrl(JP_CARD_IMAGE_MAP[cleanId], cleanId);
  }

  // If fallbackUrl is provided and is a known good host, use it via getSafeCardImageUrl
  if (fallbackUrl) {
    if (fallbackUrl.startsWith('https://card.yuyu-tei.jp/')) {
      return getSafeCardImageUrl(fallbackUrl, cleanId);
    }
    if (fallbackUrl.includes('onepiececollection.fr') || fallbackUrl.startsWith('http://')) {
      return getSafeCardImageUrl(fallbackUrl, cleanId);
    }
    if (fallbackUrl.includes('asia-en.onepiece-cardgame.com') || fallbackUrl.includes('/cards/')) {
      return getSafeCardImageUrl(fallbackUrl, cleanId);
    }
    if (fallbackUrl.includes('onepiece-cardgame.com')) {
      const cleanUrl = fallbackUrl.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');
      return getSafeCardImageUrl(cleanUrl, cleanId);
    }
  }

  const defaultUrl = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${cleanId}.png`;
  return getSafeCardImageUrl(defaultUrl, cleanId);
}

// Popular Japanese character name lookups for authentic display
export const JAPANESE_NAME_MAP: Record<string, string> = {
  'Monkey.D.Luffy': 'モンキー・D・ルフィ',
  'Roronoa Zoro': 'ロロノア・ゾロ',
  'Nami': 'ナミ',
  'Usopp': 'ウソップ',
  'Sanji': 'サンジ',
  'Tony Tony.Chopper': 'トニートニー・チョッパー',
  'Nico Robin': 'ニコ・ロビン',
  'Franky': 'フランキー',
  'Brook': 'ブルック',
  'Jinbe': 'ジンベエ',
  'Trafalgar Law': 'トラファルガー・ロー',
  'Eustass"Captain"Kid': 'ユースタス・キッド',
  'Eustass "Captain" Kid': 'ユースタス・キッド',
  'Eustass Kid': 'ユースタス・キッド',
  'Kid': 'ユースタス・キッド',
  'Portgas.D.Ace': 'ポートガス・D・エース',
  'Sabo': 'サボ',
  'Yamato': 'ヤマト',
  'Shanks': 'シャンクス',
  'Edward.Newgate': 'エドワード・ニューゲート',
  'Boa Hancock': 'ボア・ハンコック',
  'Donquixote Doflamingo': 'ドンキホーテ・ドフラミンゴ',
  'Crocodile': 'クロコダイル',
  'Charlotte Katakuri': 'シャーロット・カタクリ',
  'Charlotte Linlin': 'シャーロット・リンリン',
  'Kaido': 'カイドウ',
  'Kozuki Oden': '光月おでん',
  'Bartholomew Kuma': 'バーソロミュー・くま',
  'Rob Lucci': 'ロブ・ルッチ',
  'Marshall.D.Teach': 'マーシャル・D・ティーチ',
  'Kuzan': 'クザン',
  'Sakazuki': 'サカズキ',
  'Borsalino': 'ボルサリーノ',
  'Silvers Rayleigh': 'シルバーズ・レイリー',
  'Dracule Mihawk': 'ジュラキュール・ミホーク',
  'Gol.D.Roger': 'ゴール・D・ロジャー',
  'Gecko Moria': 'ゲッコー・モリア',
  'Perona': 'ペローナ',
  'Enel': 'エネル',
  'Smoker': 'スモーカー',
  'Buggy': 'バギー',
  'Jewelry Bonney': 'ジュエリー・ボニー',
  'Uta': 'ウタ',
};

export * from './card-format';
