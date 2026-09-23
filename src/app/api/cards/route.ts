import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCardArtist, getCardIdsByArtist, ARTIST_PROFILES, isGuestArtist } from '@/lib/artist-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const artist = searchParams.get('artist');
    const color = searchParams.get('color');
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const set = searchParams.get('set');
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const rawLimit = parseInt(searchParams.get('limit') || '36', 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 36 : Math.min(rawLimit, 100);

    // JP-only mode: always show only cards with a Yuyu-tei price
    const where: any = {
      hasJpPrint: true,
      yuyuPrice: { not: null, gt: 0 },
    };

    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const targetIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (targetIds.length > 0) {
        where.id = { in: targetIds };
        delete where.hasJpPrint;
        delete where.yuyuPrice;
      }
    }

    const andConditions: any[] = [];

    // Artist filter or artist keyword matching
    let targetArtist = artist && artist !== 'All' ? artist : '';
    let isArtistQuery = false;

    if (!targetArtist && q) {
      const lowerQ = q.toLowerCase().trim();
      const ARTIST_ALIASES: Record<string, string> = {
        'oda': 'Eiichiro Oda',
        'eiichiro oda': 'Eiichiro Oda',
        'eiichiro': 'Eiichiro Oda',
        'sunohara': 'Sunohara',
        'egawa': 'Akira Egawa',
        'akira egawa': 'Akira Egawa',
        'makitoshi': 'Makitoshi',
        'bashikou': 'BASHIKOU',
        'otton': 'Otton',
        'anderson': 'Anderson',
        'nijihayashi': 'Nijihayashi',
        'ryuda': 'Ryuda',
        'kawayoo': 'kawayoo',
        'morishita': 'Naochika Morishita',
        'naochika morishita': 'Naochika Morishita',
        'hayaken': 'Hayaken-sarena',
        'hayaken-sarena': 'Hayaken-sarena',
        'hayaken sarena': 'Hayaken-sarena',
        'bisai': 'BISAI',
        'sakuragi': 'Suzume Sakuragi',
        'suzume sakuragi': 'Suzume Sakuragi',
      };

      if (ARTIST_ALIASES[lowerQ]) {
        targetArtist = ARTIST_ALIASES[lowerQ];
        isArtistQuery = true;
      } else {
        const matched = Object.keys(ARTIST_PROFILES).find((k) => {
          const kLower = k.toLowerCase();
          return kLower === lowerQ || (lowerQ.length >= 4 && kLower.includes(lowerQ));
        });
        if (matched) {
          targetArtist = matched;
          isArtistQuery = true;
        }
      }
    }

    if (targetArtist && isGuestArtist(targetArtist)) {
      const allCards = await prisma.card.findMany({
        select: { id: true, name: true },
      });
      const artistCardIds = getCardIdsByArtist(targetArtist, allCards);
      andConditions.push({ id: { in: artistCardIds } });
    }

    if (q && !isArtistQuery) {
      const cleanQ = q.replace(/\s*\((Alt Art|Parallel|Reprint|Promo)[^)]*\)/gi, '').trim();
      const isPureParallel = /^(alt\s*art|parallel|parallel\s*cards?|alt\s*arts?|alt)$/i.test(cleanQ || q.trim());
      const isPurePromo = /^(promo|promos|promotional|promotions?)$/i.test(cleanQ || q.trim());
      const isPureFlagship = /^(flagship|flagships|flagship\s*battle)$/i.test(cleanQ || q.trim());
      const isPureTournament = /^(tournament|tournaments|tournament\s*pack|regional|regionals|treasure\s*cup|championship)$/i.test(cleanQ || q.trim());
      const isPureAnniversary = /^(anniversary|anniv|anniversary\s*set|25th)$/i.test(cleanQ || q.trim());

      if (isPureParallel) {
        andConditions.push({ id: { contains: '_p' } });
      } else if (isPurePromo) {
        andConditions.push({
          OR: [
            { rarity: { equals: 'Promo' } },
            { packId: '569901' },
            { id: { startsWith: 'P-' } },
            { promoSource: { not: null } },
          ],
        });
      } else if (isPureFlagship) {
        andConditions.push({
          OR: [
            { promoSource: { contains: 'Flagship' } },
            { promoSource: { contains: 'フラッグシップ' } },
          ],
        });
      } else if (isPureTournament) {
        andConditions.push({
          OR: [
            { promoSource: { contains: 'Tournament' } },
            { promoSource: { contains: 'Regional' } },
            { promoSource: { contains: 'Championship' } },
            { promoSource: { contains: 'Treasure Cup' } },
            { promoSource: { contains: 'Winner' } },
            { promoSource: { contains: 'Finalist' } },
            { promoSource: { contains: 'Champion' } },
            { promoSource: { contains: '大会' } },
          ],
        });
      } else if (isPureAnniversary) {
        andConditions.push({
          OR: [
            { promoSource: { contains: 'Anniversary' } },
            { promoSource: { contains: '25th' } },
            { promoSource: { contains: '記念' } },
            { pack: { name: { contains: 'Anniversary' } } },
          ],
        });
      } else {
        const searchTerm = cleanQ || q;
        andConditions.push({
          OR: [
            { id: { contains: searchTerm } },
            { name: { contains: searchTerm } },
            { types: { contains: searchTerm } },
            { promoSource: { contains: searchTerm } },
          ],
        });
      }
    }

    if (color && color !== 'All') {
      where.colors = { contains: color };
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (rarity && rarity !== 'All') {
      where.rarity = rarity;
    }

    if (set && set !== 'All') {
      const clean = set.trim();
      const noDash = clean.replace(/[^A-Za-z0-9]/g, '');
      const withDashMatch = clean.match(/^([A-Za-z]+)-?(\d+)$/i);
      const withDash = withDashMatch ? `${withDashMatch[1].toUpperCase()}-${withDashMatch[2]}` : clean;

      const setOrs: any[] = [
        { pack: { code: { equals: clean } } },
        { pack: { code: { equals: withDash } } },
        { pack: { code: { equals: noDash } } },
        { packId: clean },
      ];

      if (/^promo|p$/i.test(clean)) {
        setOrs.push({ packId: '569901' });
        setOrs.push({ pack: { code: 'PROMO' } });
      } else if (/^special$/i.test(clean)) {
        setOrs.push({ packId: '569801' });
        setOrs.push({ pack: { code: 'SPECIAL' } });
      }

      andConditions.push({ OR: setOrs });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    const sort = searchParams.get('sort');
    let orderBy: any = [{ releaseOrder: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }];
    if (sort === 'latest' || sort === 'date-desc') {
      orderBy = [{ releaseOrder: 'desc' }, { releaseDate: 'desc' }, { id: 'asc' }];
    } else if (sort === 'date-asc') {
      orderBy = [{ releaseOrder: 'asc' }, { releaseDate: 'asc' }, { id: 'asc' }];
    } else if (sort === 'price-desc') {
      orderBy = [{ yuyuPrice: 'desc' }, { id: 'asc' }];
    } else if (sort === 'price-asc') {
      orderBy = [{ yuyuPrice: 'asc' }, { id: 'asc' }];
    } else if (sort === 'id-asc') {
      orderBy = [{ id: 'asc' }];
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        include: {
          pack: {
            select: {
              code: true,
              name: true,
              releaseDate: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.card.count({ where }),
    ]);

    return NextResponse.json({
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
