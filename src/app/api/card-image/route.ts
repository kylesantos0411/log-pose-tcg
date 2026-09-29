import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sanitizeIdentifier } from '@/lib/sanitizer';

const CACHE_DIR = path.join(process.cwd(), 'public', 'cards');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {}
}

const ALLOWED_HOSTS = new Set([
  'onepiece-cardgame.com',
  'en.onepiece-cardgame.com',
  'asia-en.onepiece-cardgame.com',
  'card.yuyu-tei.jp',
  'yuyu-tei.jp',
  'cardmarket.com',
  'static.cardmarket.com',
  'tcgplayer.com',
  'tcgplayer-cdn.tcgplayer.com',
  'onepiececollection.fr',
  'www.onepiececollection.fr',
]);

function isHostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h.startsWith('192.168.') ||
    h.startsWith('10.') ||
    h.startsWith('169.254.') ||
    h.endsWith('.local')
  ) {
    return false;
  }
  return (
    ALLOWED_HOSTS.has(h) ||
    h.endsWith('.onepiece-cardgame.com') ||
    h.endsWith('.yuyu-tei.jp') ||
    h.endsWith('.cardmarket.com') ||
    h.endsWith('.onepiececollection.fr')
  );
}

function fetchUrlBuffer(
  targetUrl: string,
  timeoutMs = 4500
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      if (!isHostAllowed(parsed.hostname)) {
        return resolve(null);
      }

      const client = parsed.protocol === 'https:' ? https : http;
      const origin = parsed.origin + '/';

      const req = client.get(
        targetUrl,
        {
          family: 4,
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': origin,
          },
        },
        (res) => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            return resolve(null);
          }
          const chunks: any[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 200) {
              return resolve(null);
            }
            const rawType = (res.headers['content-type'] || '').toLowerCase();
            const contentType =
              rawType.includes('jpeg') || targetUrl.toLowerCase().includes('.jpg')
                ? 'image/jpeg'
                : rawType.includes('webp') || targetUrl.toLowerCase().includes('.webp')
                ? 'image/webp'
                : 'image/png';
            resolve({ buffer, contentType });
          });
          res.on('error', () => resolve(null));
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

function generateSvgPlaceholder(cardCode: string): string {
  const displayCode = (cardCode || 'OPTCG').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 490" width="100%" height="100%">
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
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get('url');
  let id = searchParams.get('id') || '';
  const isPlaceholder = searchParams.get('placeholder') === '1';

  if (isPlaceholder) {
    const svg = generateSvgPlaceholder(id);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  if (!url && !id) {
    return new NextResponse('Missing url or id parameter', { status: 400 });
  }

  // Clean and prepare
  if (url) {
    url = url.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');
  }

  // Derive card identifiers
  let cleanId = sanitizeIdentifier(id);
  let baseId = cleanId ? cleanId.split('_')[0] : '';

  // If id is not explicitly provided, try extracting it from url or DB
  if (!cleanId && url) {
    const fileMatch = url.match(/\/([A-Z0-9]+-[0-9]+(?:_[A-Za-z0-9]+)?)\.(?:png|jpg|jpeg|webp)/i);
    if (fileMatch) {
      cleanId = sanitizeIdentifier(fileMatch[1]);
      baseId = cleanId.split('_')[0];
    } else {
      // Try DB lookup by imageUrl
      try {
        const found = await prisma.card.findFirst({
          where: { imageUrl: url },
          select: { id: true, cardNumber: true },
        });
        if (found) {
          cleanId = found.id;
          baseId = found.cardNumber || found.id.split('_')[0];
        }
      } catch {}
    }
  }

  const SPECIAL_CARD_OVERRIDES: Record<string, string> = {
    'EB04-061_P2': 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/EB04-061_p3.png',
    'EB04-061_P3': 'https://asia-en.onepiece-cardgame.com/images/cardlist/card/EB04-061_p3.png',
  };

  const upperCleanId = cleanId.toUpperCase();
  const isSpecialOverridden = Boolean(SPECIAL_CARD_OVERRIDES[upperCleanId]);

  // Check if a direct local card asset exists (e.g. public/cards/EB04-061_p3.png)
  const directAssetFile = upperCleanId === 'EB04-061_P2' || upperCleanId === 'EB04-061_P3'
    ? path.join(CACHE_DIR, 'EB04-061_p3.png')
    : path.join(CACHE_DIR, `${cleanId}.png`);

  if (fs.existsSync(directAssetFile)) {
    try {
      const buffer = fs.readFileSync(directAssetFile);
      if (buffer.length > 200) {
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=2592000, immutable',
          },
        });
      }
    } catch {}
  }

  // Local disk cache check (keyed by url or id)
  const cacheKey = isSpecialOverridden
    ? SPECIAL_CARD_OVERRIDES[upperCleanId]
    : (url || `card_${cleanId}`);
  const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${hash}.bin`);
  const metaFile = path.join(CACHE_DIR, `${hash}.meta`);

  if (!isSpecialOverridden && fs.existsSync(cacheFile) && fs.existsSync(metaFile)) {
    try {
      const buffer = fs.readFileSync(cacheFile);
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      if (buffer.length > 200) {
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': meta.contentType || 'image/png',
            'Cache-Control': 'public, max-age=2592000, immutable',
          },
        });
      }
    } catch {}
  }

  // Construct candidates in priority order:
  // 1. Explicit override if registered
  // 2. Primary url (e.g. Yuyu-tei store scan)
  // 3. Official Bandai Asia-EN card scan
  // 4. Official Bandai Japan card scan
  // 5. Base card Japanese / Asia-EN Bandai scan
  const candidates: string[] = [];
  if (isSpecialOverridden) {
    candidates.push(SPECIAL_CARD_OVERRIDES[upperCleanId]);
  }
  if (url && !isSpecialOverridden) {
    candidates.push(url);
  }
  if (cleanId) {
    candidates.push(`https://asia-en.onepiece-cardgame.com/images/cardlist/card/${cleanId}.png`);
    candidates.push(`https://onepiece-cardgame.com/images/cardlist/card/${cleanId}.png`);
  }
  if (baseId && baseId !== cleanId) {
    candidates.push(`https://asia-en.onepiece-cardgame.com/images/cardlist/card/${baseId}.png`);
    candidates.push(`https://onepiece-cardgame.com/images/cardlist/card/${baseId}.png`);
    candidates.push(`https://en.onepiece-cardgame.com/images/cardlist/card/${baseId}.png`);
  }

  // De-duplicate candidates preserving order
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const candidate of uniqueCandidates) {
    const result = await fetchUrlBuffer(candidate);
    if (result && result.buffer && result.buffer.length > 200) {
      // Cache the valid buffer
      try {
        fs.writeFileSync(cacheFile, result.buffer);
        fs.writeFileSync(metaFile, JSON.stringify({ contentType: result.contentType, source: candidate }));
      } catch {}

      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          'Content-Type': result.contentType,
          'Cache-Control': 'public, max-age=2592000, immutable',
        },
      });
    }
  }

  // Final fallback: return the vector SVG placeholder so the UI never displays broken icons
  const fallbackSvg = generateSvgPlaceholder(cleanId || baseId || 'OPTCG');
  return new NextResponse(fallbackSvg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
