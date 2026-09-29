import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSnkrdunkPricing } from '@/lib/snkrdunk';
import { sanitizeIdentifier, sanitizeString } from '@/lib/sanitizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCardId = searchParams.get('cardId') || searchParams.get('id');
    const cardId = sanitizeIdentifier(rawCardId);

    if (!cardId) {
      return NextResponse.json({ error: 'Valid cardId parameter is required' }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { pack: true },
    });

    if (!card) {
      // Allow fallback if card is constructed on the fly
      const fallbackCard = {
        id: cardId,
        cardNumber: cardId.split('_')[0],
        name: sanitizeString(searchParams.get('name') || cardId, 100),
        isAltArt: cardId.includes('_p'),
        pack: {
          code: sanitizeString(searchParams.get('packCode') || cardId.split('-')[0], 20),
          name: sanitizeString(searchParams.get('packName') || '', 100),
        },
      };
      const pricing = await fetchSnkrdunkPricing(fallbackCard);
      return NextResponse.json({ success: true, pricing });
    }

    const pricing = await fetchSnkrdunkPricing(card);
    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    console.error('Error fetching SNKRDUNK pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve SNKRDUNK pricing' },
      { status: 500 }
    );
  }
}
