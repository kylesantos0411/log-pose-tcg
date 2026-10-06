import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEbaySoldSearchUrl } from '@/lib/ebay-pricing';
import { sanitizeIdentifier } from '@/lib/sanitizer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('id');
  const cardId = sanitizeIdentifier(rawId);

  if (!cardId) {
    return NextResponse.json({ error: 'Missing or invalid card id parameter' }, { status: 400 });
  }

  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        cardNumber: true,
        name: true,
        isVintage: true,
        vintageSeries: true,
        vintagePart: true,
        ebayPrice: true,
        ebayUrl: true,
        ebayLastUpdated: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const ebaySearchUrl =
      card.ebayUrl ||
      generateEbaySoldSearchUrl(card.cardNumber, card.name, card.vintageSeries || 'Hyper Battle');

    const res = NextResponse.json({
      id: card.id,
      name: card.name,
      cardNumber: card.cardNumber,
      isVintage: card.isVintage,
      vintageSeries: card.vintageSeries,
      vintagePart: card.vintagePart,
      ebayPriceUSD: card.ebayPrice,
      ebaySearchUrl,
      lastUpdated: card.ebayLastUpdated,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=86400');
    res.headers.set('CDN-Cache-Control', 'public, s-maxage=7200');
    res.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=7200');
    return res;
  } catch (error: any) {
    console.error('eBay pricing lookup error:', error);
    return NextResponse.json({ error: 'Failed to retrieve eBay pricing data' }, { status: 500 });
  }
}
