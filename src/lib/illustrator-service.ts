/**
 * illustrator-service.ts
 *
 * Dedicated data retrieval service for card illustrator / artist information.
 *
 * PRIMARY SOURCE:
 * Binder Pirates: https://www.binderpirates.com/
 *
 * SECONDARY SOURCE / CROSS-CHECK:
 * One Piece Card Letter: https://onepiececard-letter.com/onepiececard-illustrator-list/
 *
 * Rules:
 * 1. Do not guess artists.
 * 2. Match the illustrator to the exact printing/artwork (card number + variant).
 * 3. Do not assume the artist from an original card applies to reprints.
 * 4. Store artist_name, artist_source, artist_source_url, and artist_verification_status.
 * 5. If uncredited or unverified, record artist_name = null and artist_verification_status = "missing".
 */

export interface IllustratorResult {
  artistName: string | null;
  artistSource: string;
  artistSourceUrl: string;
  artistVerificationStatus: 'verified' | 'missing';
}

const memoryCache = new Map<string, IllustratorResult>();

// Known verified Japanese/English artist aliases cross-referenced with One Piece Card Letter
export const KNOWN_ARTIST_CANONICAL: Record<string, string> = {
  'akira egawa': 'Akira Egawa',
  'egawa akira': 'Akira Egawa',
  'eiichiro oda': 'Eiichiro Oda',
  'oda eiichiro': 'Eiichiro Oda',
  'sunohara': 'Sunohara',
  'makitoshi': 'Makitoshi',
  'bashikou': 'BASHIKOU',
  'otton': 'Otton',
  'anderson': 'Anderson',
  'nijihayashi': 'Nijihayashi',
  'ryuda': 'Ryuda',
  'kawayoo': 'kawayoo',
  'naochika morishita': 'Naochika Morishita',
  'hayaken-sarena': 'Hayaken-sarena',
  'bisai': 'BISAI',
  'suzume sakuragi': 'Suzume Sakuragi',
  'tapioca': 'TAPIOCA',
  'sowsow': 'SOWSOW',
  'tatsuya': 'tatsuya',
  'hashimoto q': 'Hashimoto Q',
  'k akagishi': 'K Akagishi',
  'akanegumo': 'Akanegumo',
  'yoko akiyama': 'Yoko Akiyama',
  'gege akutami': 'Gege Akutami',
  'noriko asaka': 'Noriko Asaka',
  'yosuke adachi': 'Yosuke Adachi',
  'yoichi amano': 'Yoichi Amano',
  'kento amemiya': 'Kento Amemiya',
  'keisuke itagaki': 'KEISUKE ITAGAKI',
  'kisuke': 'KISUKE',
  'shie nanahara': 'Shie Nanahara',
  'mutsumi sasaki': 'Mutsumi Sasaki',
  'houkiboshi': 'HOUKIBOSHI',
  'masami onishi': 'Masami Onishi',
  'mitsuhiro arita': 'Mitsuhiro Arita',
  'daisuke izuka': 'Daisuke Izuka',
  'nuisuke': 'Nuisuke',
  'senki': 'SENKI',
  'shinichirou otsuka': 'Shinichirou Otsuka',
  'so-taro': 'SO-TARO',
  'tasuku': 'Tasuku',
  'tono': 'TONO',
  'yumik': 'Yumik',
};

/**
 * Normalizes artist name to standard title case or canonical spelling
 */
export function normalizeArtistName(rawName?: string | null): string | null {
  if (!rawName) return null;
  const trimmed = rawName.trim().replace(/^by\s+/i, '');
  const lower = trimmed.toLowerCase();
  if (KNOWN_ARTIST_CANONICAL[lower]) {
    return KNOWN_ARTIST_CANONICAL[lower];
  }

  // Check for ALL CAPS (e.g. "AKIRA EGAWA", "TAPIOCA")
  if (/^[A-Z0-9\s.\-]+$/.test(trimmed) && trimmed.length > 3) {
    // Title-case if standard name
    return trimmed
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return trimmed;
}

/**
 * Retrieves the illustrator for a specific card printing from Binder Pirates
 */
export async function fetchIllustratorFromBinderPirates(
  cardNumber: string,
  variantSuffix?: string | null
): Promise<IllustratorResult> {
  const cleanCardNumber = cardNumber.trim().toUpperCase();
  // e.g. "OP01-025", "OP05-119"
  const cacheKey = `${cleanCardNumber}:${variantSuffix || 'base'}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  const baseCardUrl = `https://www.binderpirates.com/cards/${cleanCardNumber}`;

  try {
    const res = await fetch(baseCardUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 86400 }, // Cache on server for 24h
    });

    if (!res.ok) {
      const result: IllustratorResult = {
        artistName: null,
        artistSource: 'Binder Pirates',
        artistSourceUrl: baseCardUrl,
        artistVerificationStatus: 'missing',
      };
      memoryCache.set(cacheKey, result);
      return result;
    }

    const html = await res.text();

    // Check if a specific variant was requested
    let targetVariantPath = '';
    if (variantSuffix) {
      // e.g. variantSuffix = "p1", "p2", "_p1"
      const cleanSuffix = variantSuffix.replace(/^_/, '');
      const searchTarget = `${cleanCardNumber}${cleanSuffix}`;

      // Search href="/cards/OP01-025/OP01-025p1"
      const variantRegex = new RegExp(`href="(\\/cards\\/[^"]*${searchTarget}[^"]*)"`, 'i');
      const vMatch = html.match(variantRegex);
      if (vMatch) {
        targetVariantPath = vMatch[1];
      }
    } else {
      // Check if base print is located at /cards/ID/ID
      const baseVariantRegex = new RegExp(`href="(\\/cards\\/${cleanCardNumber}\\/${cleanCardNumber}[^"]*)"`, 'i');
      const bMatch = html.match(baseVariantRegex);
      if (bMatch) {
        targetVariantPath = bMatch[1];
      }
    }

    // If specific variant path found, fetch variant-specific page
    let finalHtml = html;
    let finalUrl = baseCardUrl;

    if (targetVariantPath) {
      finalUrl = `https://www.binderpirates.com${targetVariantPath}`;
      try {
        const vRes = await fetch(finalUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        if (vRes.ok) {
          finalHtml = await vRes.text();
        }
      } catch {}
    }

    // Extract: Illustrated by <a ... href="/artists/slug">NAME</a>
    const artistRegex = /Illustrated by[\s\S]*?href="\/artists\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
    const match = finalHtml.match(artistRegex);

    if (match && match[2]) {
      const rawArtist = match[2].replace(/<[^>]+>/g, '').trim();
      const normalized = normalizeArtistName(rawArtist);

      const result: IllustratorResult = {
        artistName: normalized,
        artistSource: 'Binder Pirates',
        artistSourceUrl: finalUrl,
        artistVerificationStatus: 'verified',
      };
      memoryCache.set(cacheKey, result);
      return result;
    }

    // Fallback: check __NEXT_DATA__ or json blobs if present
    const jsonMatch = finalHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const cardObj = data.props?.pageProps?.card;
        if (cardObj?.illustrator || cardObj?.artist) {
          const raw = cardObj.illustrator || cardObj.artist;
          const normalized = normalizeArtistName(raw);
          const result: IllustratorResult = {
            artistName: normalized,
            artistSource: 'Binder Pirates',
            artistSourceUrl: finalUrl,
            artistVerificationStatus: 'verified',
          };
          memoryCache.set(cacheKey, result);
          return result;
        }
      } catch {}
    }

    // If not found, strictly record as missing (do not guess or infer)
    const result: IllustratorResult = {
      artistName: null,
      artistSource: 'Binder Pirates',
      artistSourceUrl: finalUrl,
      artistVerificationStatus: 'missing',
    };
    memoryCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    const result: IllustratorResult = {
      artistName: null,
      artistSource: 'Binder Pirates',
      artistSourceUrl: baseCardUrl,
      artistVerificationStatus: 'missing',
    };
    memoryCache.set(cacheKey, result);
    return result;
  }
}
