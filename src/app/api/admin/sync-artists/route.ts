import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeArtistName } from '@/lib/illustrator-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for admin sync

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchSetUrls() {
  const res = await fetch('https://onepiece.limitlesstcg.com/cards', {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed to load sets list: ${res.statusText}`);
  const html = await res.text();

  const links = [...html.matchAll(/href="(\/cards\/([a-z0-9]+-[a-z0-9\-]+))"/gi)];
  const setPaths = Array.from(new Set(links.map((m) => m[1]))).filter(
    (u) => !u.includes('advanced') && !u.includes('promos')
  );
  return setPaths;
}

async function scrapeSetPage(setPath: string, isJp = false) {
  const langPrefix = isJp ? '/cards/jp/' : '/cards/';
  const cleanSlug = setPath.replace(/^\/cards\/(?:jp\/)?/, '');
  const targetUrl = `https://onepiece.limitlesstcg.com${langPrefix}${cleanSlug}?display=full&show=all&unique=prints`;

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return {};
    const html = await res.text();

    const cardProfiles = html.split('<div class="card-profile">').slice(1);
    const setMapping: Record<string, { artistName: string; sourceUrl: string }> = {};

    for (const block of cardProfiles) {
      const idMatch = block.match(/<span class="card-text-id">\s*([A-Za-z0-9_\-]+)\s*<\/span>/i);
      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const artistMatch = block.match(/Illustrated by[\s\S]*?<a[^>]*>\s*([^<]+)\s*<\/a>/i);

      if (idMatch && artistMatch) {
        const baseId = idMatch[1].trim();
        const rawArtist = artistMatch[1].trim();
        const artist = normalizeArtistName(rawArtist);

        if (!artist) continue;

        let finalCardId = baseId;
        if (imgMatch) {
          const pMatch = imgMatch[1].match(/\/([A-Za-z0-9\-]+(?:_p\d+)?)_(?:EN|JP)\.webp/i);
          if (pMatch && pMatch[1]) {
            finalCardId = pMatch[1];
          }
        }

        setMapping[finalCardId] = {
          artistName: artist,
          sourceUrl: targetUrl,
        };
      }
    }

    return setMapping;
  } catch {
    return {};
  }
}

export async function POST() {
  try {
    const setPaths = await fetchSetUrls();
    const allCardArtistMap: Record<string, { artistName: string; sourceUrl: string }> = {};

    for (const setPath of setPaths) {
      const enMap = await scrapeSetPage(setPath, false);
      Object.assign(allCardArtistMap, enMap);
      const jpMap = await scrapeSetPage(setPath, true);
      Object.assign(allCardArtistMap, jpMap);
    }

    const enPromos = await scrapeSetPage('/cards/promos', false);
    const jpPromos = await scrapeSetPage('/cards/promos', true);
    Object.assign(allCardArtistMap, enPromos, jpPromos);

    let updatedCount = 0;
    for (const [cardId, data] of Object.entries(allCardArtistMap)) {
      try {
        const existing = await prisma.card.findFirst({
          where: {
            OR: [
              { id: cardId },
              { id: cardId.replace(/_p/, '_p') },
              { id: cardId.replace(/_p/, 'p') },
              { id: { startsWith: cardId } },
            ],
          },
          select: { id: true },
        });

        if (existing) {
          await prisma.card.update({
            where: { id: existing.id },
            data: {
              artistName: data.artistName,
              artistSource: 'Limitless TCG',
              artistSourceUrl: data.sourceUrl,
              artistVerificationStatus: 'verified',
            },
          });
          updatedCount++;
        }
      } catch {}
    }

    const distinct = await prisma.card.findMany({
      where: { artistName: { not: null } },
      select: { artistName: true },
      distinct: ['artistName'],
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      distinctArtistsCount: distinct.length,
      totalScraped: Object.keys(allCardArtistMap).length,
    });
  } catch (error: any) {
    console.error('Error in sync-artists API:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
