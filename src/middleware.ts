import { NextRequest, NextResponse } from 'next/server';

// Lightweight Edge-compatible in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (rateLimitMap.size > 2000) {
    cleanupExpired();
  }

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

function isOriginAllowed(origin: string, host: string): boolean {
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const currentHost = host.toLowerCase();

    if (originHost === currentHost) return true;
    if (originHost === 'localhost:3000' || originHost === '127.0.0.1:3000') return true;
    if (originHost.endsWith('.vercel.app')) return true;
    if (originHost === 'logpose.app' || originHost.endsWith('.logpose.app')) return true;
    return false;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';
  const origin = req.headers.get('origin') || '';
  const clientIp = getClientIp(req);

  // 1. Handle CORS Preflight for all API endpoints
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const allowed = isOriginAllowed(origin, host);
    const allowedOrigin = allowed ? (origin || '*') : 'null';

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 2. Validate Origin on state-changing API requests (POST / PUT / DELETE)
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (origin && !isOriginAllowed(origin, host)) {
      return NextResponse.json(
        { error: 'Cross-origin request blocked by security policy.' },
        { status: 403 }
      );
    }
  }

  // 3. Rate Limiting for Sensitive Endpoints
  if (pathname.startsWith('/api/auth/')) {
    // Auth endpoints: 20 requests per minute per IP
    const rl = checkRateLimit(`auth:${clientIp}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again in a few moments.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
          },
        }
      );
    }
  } else if (pathname.startsWith('/api/pricing/')) {
    // Pricing endpoints: 60 requests per minute per IP
    const rl = checkRateLimit(`pricing:${clientIp}`, 60, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for pricing API. Please wait a moment.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
          },
        }
      );
    }
  }

  // 4. Admin route access guard check
  if (pathname.startsWith('/admin')) {
    const sessionCookie = req.cookies.get('logpose_session')?.value;
    if (sessionCookie) {
      try {
        const decoded = JSON.parse(decodeURIComponent(sessionCookie));
        if (decoded?.isBanned) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      } catch {
        // Continue to let page handle auth UI
      }
    }
  }

  // 5. Proceed and append security & CORS headers
  const response = NextResponse.next();

  if (pathname.startsWith('/api/')) {
    const allowed = isOriginAllowed(origin, host);
    if (allowed && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
