import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CACHE_DIR = path.join(process.cwd(), 'public', 'cards');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {}
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Force rewrite of English Bandai scans to official Japanese Bandai scans
  url = url.replace('https://en.onepiece-cardgame.com/', 'https://onepiece-cardgame.com/');

  // SSRF Protection: Validate URL and enforce strict domain whitelist
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse('Invalid URL format', { status: 400 });
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return new NextResponse('Invalid protocol', { status: 400 });
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
    'tcgplayer-cdn.tcgplayer.com'
  ]);

  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowed = 
    ALLOWED_HOSTS.has(hostname) || 
    hostname.endsWith('.onepiece-cardgame.com') || 
    hostname.endsWith('.yuyu-tei.jp') ||
    hostname.endsWith('.cardmarket.com');

  if (!isAllowed) {
    return new NextResponse('Forbidden host domain', { status: 403 });
  }

  // Prevent local/private IP address bypasses
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('169.254.') ||
    hostname.endsWith('.local')
  ) {
    return new NextResponse('Forbidden address', { status: 403 });
  }

  // Create local cache file path using MD5 hash of url
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const ext = url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') ? 'jpg' : 'png';
  const cacheFile = path.join(CACHE_DIR, `${hash}.${ext}`);

  // Serve from disk cache if exists
  if (fs.existsSync(cacheFile)) {
    try {
      const buffer = fs.readFileSync(cacheFile);
      const contentType = ext === 'jpg' ? 'image/jpeg' : 'image/png';
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=2592000, immutable',
        },
      });
    } catch {}
  }

  try {
    let origin = 'https://onepiece-cardgame.com/';
    try {
      origin = new URL(url).origin + '/';
    } catch {}

    const client = url.startsWith('https:') ? https : http;

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const request = client.get(
        url,
        {
          family: 4, // Force IPv4 to prevent Windows timeout issues
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': origin,
          },
          timeout: 8000,
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            return reject(new Error(`Failed with status ${res.statusCode}`));
          }
          const chunks: any[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timed out'));
      });
    });

    const contentType = ext === 'jpg' ? 'image/jpeg' : 'image/png';

    // Save to disk cache asynchronously
    try {
      fs.writeFile(cacheFile, buffer, () => {});
    } catch {}

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error proxying image: ${err.message}`, { status: 500 });
  }
}
