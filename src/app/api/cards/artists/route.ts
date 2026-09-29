import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const artistGroups = await prisma.card.groupBy({
      by: ['artistName'],
      where: {
        artistName: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        artistName: 'asc',
      },
    });

    const artists = artistGroups
      .filter((g) => g.artistName && g.artistName.trim().length > 0)
      .map((g) => ({
        name: g.artistName as string,
        count: g._count.id,
      }));

    return NextResponse.json({
      success: true,
      count: artists.length,
      artists,
    });
  } catch (error: any) {
    console.error('Error fetching artists list:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load artists' },
      { status: 500 }
    );
  }
}
