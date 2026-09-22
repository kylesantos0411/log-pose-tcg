import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type');

    const where: any = {};

    if (q) {
      where.OR = [
        { code: { contains: q } },
        { name: { contains: q } },
      ];
    }

    if (type && type !== 'All') {
      if (type === 'Booster') {
        where.OR = [
          { seriesType: { contains: 'BOOSTER' } },
          { code: { startsWith: 'OP-' } },
          { code: { startsWith: 'OP1' } },
        ];
      } else if (type === 'Extra') {
        where.OR = [
          { seriesType: { contains: 'EXTRA' } },
          { code: { startsWith: 'EB-' } },
        ];
      } else if (type === 'Starter') {
        where.OR = [
          { seriesType: { contains: 'STARTER' } },
          { seriesType: { contains: 'ULTRA' } },
          { code: { startsWith: 'ST-' } },
        ];
      } else if (type === 'Premium') {
        where.OR = [
          { seriesType: { contains: 'PREMIUM' } },
          { code: { startsWith: 'PRB-' } },
        ];
      } else if (type === 'Promo') {
        where.OR = [
          { seriesType: { contains: 'PROMOTION' } },
          { seriesType: { contains: 'EVENT' } },
          { code: 'PROMO' },
          { id: '569901' },
        ];
      } else if (type === 'Special') {
        where.OR = [
          { seriesType: { contains: 'SPECIAL' } },
          { code: 'SPECIAL' },
          { id: '569801' },
        ];
      }
    }

    const packs = await prisma.pack.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        seriesType: true,
        _count: {
          select: { cards: true },
        },
        cards: {
          take: 4,
          where: { imageUrl: { not: null } },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
            category: true,
          },
          orderBy: [
            { category: 'asc' }, // Leaders and top cards first
            { rarity: 'desc' },
          ],
        },
      },
      orderBy: [
        { code: 'asc' },
      ],
    });

    const formattedPacks = packs.map((pack) => ({
      id: pack.id,
      code: pack.code || 'SET',
      name: pack.name,
      seriesType: pack.seriesType || 'EXPANSION SET',
      cardsCount: pack._count.cards,
      sampleCards: pack.cards,
    }));

    return NextResponse.json({
      sets: formattedPacks,
      total: formattedPacks.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
