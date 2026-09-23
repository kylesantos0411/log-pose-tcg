export function getSafeCardImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  // Always rewrite English Bandai URLs to official Japanese Bandai scans
  const cleanUrl = url.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');
  return `/api/card-image?url=${encodeURIComponent(cleanUrl)}`;
}

// Explicit Japanese card image map when Bandai Japan index differs from Bandai English
const JP_CARD_IMAGE_MAP: Record<string, string> = {
  // OP05-119 Monkey.D.Luffy exact 8 Japanese variations from Yuyu-tei & Bandai Japan
  'OP05-119':    'https://onepiece-cardgame.com/images/cardlist/card/OP05-119.png',      // Base SEC Laughing Gear 5 (¥780)
  'OP05-119_p1': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png',   // "GEAR 5" Comic Pop-Art (¥24,800)
  'OP05-119_p2': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p2.png',   // Manga Rare Super Parallel (¥598,000)
  'OP05-119_p3': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p3.png',   // PRB-01 Blue Lightning Punch (¥7,980)
  'OP05-119_p4': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p8.png',   // 2nd Anniv Kaido Punch (¥19,800)
  'OP05-119_p6': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p5.png',   // WANTED POSTER SP (¥59,800)
  'OP05-119_p7': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p6.png',   // Silver Parallel SP (¥498,000)
  'OP05-119_p8': 'https://onepiece-cardgame.com/images/cardlist/card/OP05-119_p7.png',   // Gold Parallel SP (¥1,280,000)
};

/**
 * Returns the official Bandai card image URL for Japanese edition.
 */
export function getEditionCardImageUrl(cardId: string, lang: 'en' | 'jp' = 'jp', fallbackUrl?: string | null): string {
  // If fallbackUrl is a direct high-resolution Bandai Asia-EN, Yuyu-tei or asset image, use it!
  if (fallbackUrl && (fallbackUrl.includes('asia-en.onepiece-cardgame.com') || fallbackUrl.includes('yuyu-tei.jp') || fallbackUrl.includes('/cards/'))) {
    return getSafeCardImageUrl(fallbackUrl);
  }

  // Check explicit Japanese map first to prevent index shifts between EN and JP Bandai
  if (lang === 'jp' && JP_CARD_IMAGE_MAP[cardId]) {
    return getSafeCardImageUrl(JP_CARD_IMAGE_MAP[cardId]);
  }

  // Prefer official Bandai card image
  if (fallbackUrl && fallbackUrl.includes('onepiece-cardgame.com')) {
    const cleanUrl = fallbackUrl.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');
    return getSafeCardImageUrl(cleanUrl);
  }

  const defaultUrl = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${cardId}.png`;
  return getSafeCardImageUrl(defaultUrl);
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
