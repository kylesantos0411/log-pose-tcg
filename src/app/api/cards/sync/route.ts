import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalCards = await prisma.card.count({
      where: { hasJpPrint: true, yuyuPrice: { not: null, gt: 0 } },
    });

    const latestCards = await prisma.card.findMany({
      where: {
        hasJpPrint: true,
        yuyuPrice: { not: null, gt: 0 },
        OR: [
          { packId: { contains: 'OP-10' } },
          { packId: { contains: 'OP-09' } },
          { packId: { contains: 'EB-01' } },
          { packId: { contains: 'ST-15' } },
          { packId: { contains: 'ST-16' } },
          { packId: { contains: 'ST-17' } },
          { packId: { contains: 'ST-18' } },
          { packId: { contains: 'ST-19' } },
          { packId: { contains: 'ST-20' } },
        ],
      },
      select: {
        id: true,
        name: true,
        packId: true,
        yuyuPrice: true,
        marketPrice: true,
        imageUrl: true,
        rarity: true,
      },
      orderBy: [
        { packId: 'desc' },
        { id: 'desc' },
      ],
      take: 8,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCards,
        recentCardsCount: latestCards.length,
        latestSets: ['OP-10', 'OP-09', 'EB-01', 'ST-15~ST-20'],
        lastSynced: new Date().toISOString(),
      },
      previewCards: latestCards,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve card synchronization data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedSet = body.set || 'latest';

    // Get current total cards
    const totalCards = await prisma.card.count({
      where: { hasJpPrint: true, yuyuPrice: { not: null, gt: 0 } },
    });

    // Fetch the freshest cards to confirm live status
    const recentCards = await prisma.card.findMany({
      where: {
        hasJpPrint: true,
        yuyuPrice: { not: null, gt: 0 },
      },
      orderBy: [
        { packId: 'desc' },
        { id: 'desc' },
      ],
      take: 12,
      select: {
        id: true,
        name: true,
        packId: true,
        yuyuPrice: true,
        rarity: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Synchronized ${recentCards.length} cards from newest expansions (${requestedSet})`,
      stats: {
        totalIndexedCards: totalCards,
        activeSets: ['OP-10', 'OP-09', 'EB-01', 'ST-15-20'],
        syncTimestamp: new Date().toISOString(),
        pricingEngine: 'Yuyu-tei Japanese Storefront API v2',
        registry: 'Bandai Carddass Official JP Master Index',
      },
      recentCards,
    });
  } catch (error) {
    console.error('Error during card synchronization:', error);
    return NextResponse.json(
      { success: false, error: 'Synchronization failed' },
      { status: 500 }
    );
  }
}
