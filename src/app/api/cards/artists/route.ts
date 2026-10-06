import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


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

    const res = NextResponse.json({
      success: true,
      count: artists.length,
      artists,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.headers.set('CDN-Cache-Control', 'public, s-maxage=86400');
    res.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=86400');
    return res;
  } catch (error: any) {
    console.error('Error fetching artists list:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load artists' },
      { status: 500 }
    );
  }
}
