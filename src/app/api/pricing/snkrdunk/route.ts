import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSnkrdunkPricing } from '@/lib/snkrdunk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId') || searchParams.get('id');

    if (!cardId) {
      return NextResponse.json({ error: 'cardId parameter is required' }, { status: 400 });
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
        name: searchParams.get('name') || cardId,
        isAltArt: cardId.includes('_p'),
        pack: {
          code: searchParams.get('packCode') || cardId.split('-')[0],
          name: searchParams.get('packName') || '',
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
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
