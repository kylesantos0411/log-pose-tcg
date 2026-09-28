import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEbaySoldSearchUrl } from '@/lib/ebay-pricing';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get('id');

  if (!cardId) {
    return NextResponse.json({ error: 'Missing card id parameter' }, { status: 400 });
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

    return NextResponse.json({
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
