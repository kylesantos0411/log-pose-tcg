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

    if (targetArtist) {
      const artistOrs: any[] = [
        { artistName: { equals: targetArtist } },
        { artistName: { contains: targetArtist } },
      ];
      if (isGuestArtist(targetArtist)) {
        const allCards = await prisma.card.findMany({
          select: { id: true, name: true },
        });
        const artistCardIds = getCardIdsByArtist(targetArtist, allCards);
        if (artistCardIds.length > 0) {
          artistOrs.push({ id: { in: artistCardIds } });
        }
      }
      andConditions.push({ OR: artistOrs });
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
      const catLower = category.trim().toLowerCase();
      if (catLower === 'character') {
        where.category = 'Character';
      } else if (catLower === 'event') {
        where.category = 'Event';
      } else if (catLower === 'stage') {
        where.category = 'Stage';
      } else if (catLower === 'don!! card' || catLower === 'don!!' || catLower === 'don') {
        where.category = 'DON!!';
      } else if (catLower === 'leader') {
        where.category = 'Leader';
      } else {
        where.category = category;
      }
    }

    if (rarity && rarity !== 'All') {
      const rUpper = rarity.trim().toUpperCase();
      if (rUpper === 'P-SEC') {
        where.rarity = 'SecretRare';
        where.isAltArt = true;
      } else if (rUpper === 'SEC') {
        where.rarity = 'SecretRare';
        where.isAltArt = false;
      } else if (rUpper === 'P-SR') {
        where.rarity = 'SuperRare';
        where.isAltArt = true;
      } else if (rUpper === 'SR') {
        where.rarity = 'SuperRare';
        where.isAltArt = false;
      } else if (rUpper === 'PR') {
        where.rarity = 'Rare';
        where.isAltArt = true;
      } else if (rUpper === 'R') {
        where.rarity = 'Rare';
        where.isAltArt = false;
      } else if (rUpper === 'P-UC') {
        where.rarity = 'Uncommon';
        where.isAltArt = true;
      } else if (rUpper === 'UC') {
        where.rarity = 'Uncommon';
        where.isAltArt = false;
      } else if (rUpper === 'PC') {
        where.rarity = 'Common';
        where.isAltArt = true;
      } else if (rUpper === 'C') {
        where.rarity = 'Common';
        where.isAltArt = false;
      } else if (rUpper === 'PL') {
        where.rarity = 'Leader';
        where.isAltArt = true;
      } else if (rUpper === 'L') {
        where.rarity = 'Leader';
        where.isAltArt = false;
      } else if (rUpper === 'SP') {
        andConditions.push({
          OR: [
            { rarity: 'Special' },
            { promoSource: { contains: 'SP' } },
            { promoSource: { contains: '特別' } },
          ],
        });
      } else if (rUpper === 'TR') {
        andConditions.push({
          OR: [
            { rarity: 'TreasureRare' },
            { promoSource: { contains: 'TR' } },
            { promoSource: { contains: 'トレジャー' } },
          ],
        });
      } else if (rUpper === 'PP') {
        andConditions.push({
          OR: [
            { rarity: 'Promo', isAltArt: true },
            { rarity: 'Parallel' },
          ],
        });
      } else if (rUpper === 'P') {
        where.rarity = 'Promo';
        where.isAltArt = false;
      } else if (rUpper === '-') {
        andConditions.push({
          OR: [
            { category: 'DON!!' },
            { rarity: '-' },
          ],
        });
      } else {
        where.rarity = rarity;
      }
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
        { displaySet: { equals: clean } },
        { displaySet: { equals: withDash } },
        { displaySet: { equals: noDash } },
        { yuyuteiSet: { equals: clean } },
        { yuyuteiSet: { equals: withDash } },
        { yuyuteiSet: { equals: noDash } },
      ];

      if (/^promo|p$/i.test(clean)) {
        setOrs.push({ packId: '569901' });
        setOrs.push({ pack: { code: 'PROMO' } });
        setOrs.push({ displaySet: 'PROMO' });
        setOrs.push({ yuyuteiSet: 'PROMO' });
      } else if (/^special$/i.test(clean)) {
        setOrs.push({ packId: '569801' });
        setOrs.push({ pack: { code: 'SPECIAL' } });
        setOrs.push({ displaySet: 'SPECIAL' });
        setOrs.push({ yuyuteiSet: 'SPECIAL' });
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

    const formattedCards = cards.map((c) => ({
      ...c,
      card_number: c.cardNumber || c.id.split('_')[0],
      printed_set_code: c.printedSetCode,
      original_set: c.originalSet,
      yuyutei_set: c.yuyuteiSet,
      display_set: c.displaySet,
      printing_type: c.printingType,
      artist_name: c.artistName,
      artist_source: c.artistSource,
      artist_source_url: c.artistSourceUrl,
      artist_verification_status: c.artistVerificationStatus,
    }));

    return NextResponse.json({
      cards: formattedCards,
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
