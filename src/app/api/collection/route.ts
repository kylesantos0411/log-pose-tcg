import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userCards = await prisma.userCard.findMany({
      include: {
        card: {
          include: {
            pack: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalCardsCount = 0;
    let totalEstimatedValue = 0;
    let totalInvested = 0;
    const conditionsCount: Record<string, number> = { NM: 0, LP: 0, MP: 0, HP: 0, Graded: 0 };
    let foilsCount = 0;
    let enCount = 0;
    let jpCount = 0;

    for (const uc of userCards) {
      const qty = uc.quantity || 1;
      totalCardsCount += qty;
      const isJp = uc.language === 'jp';

      // Normalize to USD benchmark for overall portfolio calculations
      const unitPriceUsd = isJp
        ? (uc.card.yuyuPrice ? uc.card.yuyuPrice / 152.0 : (uc.card.marketPrice || 0))
        : (uc.card.marketPrice || 0);

      const buyPriceUsd = uc.purchasePrice !== null && uc.purchasePrice !== undefined
        ? (isJp ? uc.purchasePrice / 152.0 : uc.purchasePrice)
        : unitPriceUsd;

      totalEstimatedValue += unitPriceUsd * qty;
      totalInvested += buyPriceUsd * qty;

      const cond = uc.condition || 'NM';
      conditionsCount[cond] = (conditionsCount[cond] || 0) + qty;
      if (uc.isFoil) foilsCount += qty;
      if (isJp) {
        jpCount += qty;
      } else {
        enCount += qty;
      }
    }

    const netProfit = totalEstimatedValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    return NextResponse.json({
      userCards,
      stats: {
        totalCardsCount,
        uniqueCardsCount: userCards.length,
        totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitPercentage: Math.round(profitPercentage * 10) / 10,
        conditionsCount,
        foilsCount,
        enCount,
        jpCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      cardId, 
      quantity = 1, 
      condition = 'NM', 
      isFoil = false, 
      language = 'jp', 
      purchasePrice, 
      notes 
    } = body;

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const targetLang = language === 'jp' ? 'jp' : 'en';

    const existing = await prisma.userCard.findFirst({
      where: {
        cardId,
        condition,
        isFoil: Boolean(isFoil),
        language: targetLang,
      },
    });

    let result;
    if (existing) {
      result = await prisma.userCard.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });
    } else {
      result = await prisma.userCard.create({
        data: {
          cardId,
          quantity,
          condition,
          isFoil: Boolean(isFoil),
          language: targetLang,
          purchasePrice: purchasePrice !== undefined && purchasePrice !== '' ? parseFloat(purchasePrice) : card.marketPrice,
          notes,
        },
      });
    }

    return NextResponse.json({ success: true, item: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.userCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
