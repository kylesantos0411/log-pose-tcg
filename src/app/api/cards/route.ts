import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCardArtist, getCardIdsByArtist, ARTIST_PROFILES, isGuestArtist } from '@/lib/artist-data';
import { sanitizeIdentifier, sanitizeSearchQuery, sanitizeString } from '@/lib/sanitizer';

const CHARACTER_ALIASES: Record<string, string[]> = {
  'oden': ['Kouzuki Oden', 'Kozuki Oden', 'Oden'],
  'kozuki oden': ['Kouzuki Oden', 'Kozuki Oden'],
  'kouzuki oden': ['Kouzuki Oden'],
  'kozuki': ['Kouzuki', 'Kozuki'],
  'kouzuki': ['Kouzuki', 'Kozuki'],
  'ace': ['Portgas.D.Ace'],
  'portgas d ace': ['Portgas.D.Ace'],
  'portgas d. ace': ['Portgas.D.Ace'],
  'portgas ace': ['Portgas.D.Ace'],
  'luffy': ['Monkey.D.Luffy', 'Luffy'],
  'monkey d luffy': ['Monkey.D.Luffy'],
  'monkey d. luffy': ['Monkey.D.Luffy'],
  'zoro': ['Roronoa Zoro', 'Zoro'],
  'whitebeard': ['Edward.Newgate', 'Whitebeard'],
  'blackbeard': ['Marshall.D.Teach', 'Blackbeard'],
  'teach': ['Marshall.D.Teach', 'Teach'],
  'marshall d teach': ['Marshall.D.Teach'],
  'marshall d. teach': ['Marshall.D.Teach'],
  'big mom': ['Charlotte Linlin', 'Big Mom'],
  'bigmom': ['Charlotte Linlin'],
  'linlin': ['Charlotte Linlin'],
  'charlotte linlin': ['Charlotte Linlin'],
  'roger': ['Gol.D.Roger', 'Roger'],
  'gol d roger': ['Gol.D.Roger'],
  'gol d. roger': ['Gol.D.Roger'],
  'law': ['Trafalgar Law', 'Trafalgar.D.Water Law', 'Law'],
  'trafalgar d water law': ['Trafalgar.D.Water Law'],
  'trafalgar law': ['Trafalgar Law'],
  'kid': ['Eustass"Captain"Kid', 'Eustass.Kid', 'Kid'],
  'kidd': ['Eustass"Captain"Kid', 'Eustass.Kid'],
  'eustass captain kid': ['Eustass"Captain"Kid'],
  'eustass kid': ['Eustass"Captain"Kid', 'Eustass.Kid'],
  'chopper': ['Tony Tony.Chopper', 'Tony Tony Chopper', 'Chopper'],
  'tony tony chopper': ['Tony Tony.Chopper', 'Tony Tony Chopper'],
  'mihawk': ['Dracule Mihawk', 'Mihawk'],
  'dracule mihawk': ['Dracule Mihawk'],
  'hancock': ['Boa Hancock', 'Hancock'],
  'boa hancock': ['Boa Hancock'],
  'bonney': ['Jewelry Bonney', 'Bonney'],
  'jewelry bonney': ['Jewelry Bonney'],
  'kuma': ['Bartholomew Kuma', 'Kuma'],
  'bartholomew kuma': ['Bartholomew Kuma'],
  'rayleigh': ['Silvers Rayleigh', 'Rayleigh'],
  'silvers rayleigh': ['Silvers Rayleigh'],
  'garp': ['Monkey.D.Garp', 'Garp'],
  'monkey d garp': ['Monkey.D.Garp'],
  'dragon': ['Monkey.D.Dragon', 'Dragon'],
  'monkey d dragon': ['Monkey.D.Dragon'],
  'doflamingo': ['Donquixote Doflamingo', 'Doflamingo'],
  'donquixote doflamingo': ['Donquixote Doflamingo'],
  'katakuri': ['Charlotte Katakuri', 'Katakuri'],
  'charlotte katakuri': ['Charlotte Katakuri'],
  'momonosuke': ['Kouzuki Momonosuke', 'Kozuki Momonosuke', 'Momonosuke'],
  'kozuki momonosuke': ['Kouzuki Momonosuke'],
  'kouzuki momonosuke': ['Kouzuki Momonosuke'],
  'hiyori': ['Kouzuki Hiyori', 'Kozuki Hiyori', 'Hiyori'],
  'kozuki hiyori': ['Kouzuki Hiyori'],
  'kouzuki hiyori': ['Kouzuki Hiyori'],
  'toki': ['Kouzuki Toki', 'Kozuki Toki', 'Toki'],
  'kozuki toki': ['Kouzuki Toki'],
  'kouzuki toki': ['Kouzuki Toki'],
  'sukiyaki': ['Kouzuki Sukiyaki', 'Kozuki Sukiyaki', 'Sukiyaki'],
  'aokiji': ['Kuzan', 'Aokiji'],
  'kuzan': ['Kuzan'],
  'akainu': ['Sakazuki', 'Akainu'],
  'sakazuki': ['Sakazuki'],
  'kizaru': ['Borsalino', 'Kizaru'],
  'borsalino': ['Borsalino'],
  'fujitora': ['Issho', 'Fujitora'],
  'issho': ['Issho'],
  'ryokugyu': ['Aramaki', 'Ryokugyu'],
  'aramaki': ['Aramaki'],
  'greenbull': ['Aramaki'],
  'coby': ['Koby', 'Coby'],
  'koby': ['Koby'],
  'kaido': ['Kaido', 'Kaidou'],
  'kaidou': ['Kaidou', 'Kaido'],
  'corazon': ['Donquixote Rosinante', 'Corazon', 'Rosinante'],
  'rosinante': ['Donquixote Rosinante', 'Rosinante'],
  'bon clay': ['Mr.2.Bon.Kurei(Bentham)', 'Bon Clay', 'Bentham'],
  'mr 2': ['Mr.2.Bon.Kurei(Bentham)'],
  'mr. 2': ['Mr.2.Bon.Kurei(Bentham)'],
  'bentham': ['Mr.2.Bon.Kurei(Bentham)'],
  'reiju': ['Vinsmoke Reiju', 'Reiju'],
  'vinsmoke reiju': ['Vinsmoke Reiju'],
  'lucci': ['Rob Lucci', 'Lucci'],
  'rob lucci': ['Rob Lucci'],
  'newgate': ['Edward.Newgate'],
  'edward newgate': ['Edward.Newgate'],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = sanitizeSearchQuery(searchParams.get('q') || '');
    const artist = sanitizeString(searchParams.get('artist') || '', 50);
    const color = sanitizeString(searchParams.get('color') || '', 20);
    const category = sanitizeString(searchParams.get('category') || '', 30);
    const rarity = sanitizeString(searchParams.get('rarity') || '', 20);
    const set = sanitizeString(searchParams.get('set') || '', 30);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : Math.min(rawPage, 1000);
    const rawLimit = parseInt(searchParams.get('limit') || '36', 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 36 : Math.min(rawLimit, 100);

    const isVintageQuery =
      (category && category.toLowerCase() === 'vintage') ||
      (set && /^HB/i.test(set.trim())) ||
      searchParams.get('isVintage') === 'true';

    // Show cards with Japanese prints or vintage cards
    const where: any = isVintageQuery
      ? { isVintage: true }
      : {
          OR: [
            { hasJpPrint: true },
            { isVintage: true },
          ],
        };

    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const targetIds = idsParam
        .split(',')
        .map((s) => sanitizeIdentifier(s.trim()))
        .filter(Boolean)
        .slice(0, 100);
      if (targetIds.length > 0) {
        where.id = { in: targetIds };
        delete where.hasJpPrint;
        delete where.yuyuPrice;
        delete where.OR;
        delete where.isVintage;
      }
    }

    const andConditions: any[] = [];

    // Artist filter or artist keyword matching
    let targetArtist = artist && artist !== 'All' ? artist : '';
    let isArtistQuery = false;

    // Detect if query explicitly targets an artist, e.g. "artist:nakamaru", "!artist:nakamaru", "@nakamaru"
    const explicitArtistMatch = q?.match(/^(?:!?artist:|@)\s*(.+)$/i);
    if (explicitArtistMatch) {
      targetArtist = explicitArtistMatch[1].replace(/^["']|["']$/g, '').trim();
      isArtistQuery = true;
    }

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
        'nakamaru': 'Nakamaru',
        'tapioca': 'TAPIOCA',
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
      const targetLower = targetArtist.toLowerCase().trim();
      const allArtists = await prisma.card.findMany({
        where: { artistName: { not: null } },
        select: { artistName: true },
        distinct: ['artistName'],
      });

      const matchedArtists = allArtists
        .filter((a) => {
          if (!a.artistName) return false;
          const lower = a.artistName.toLowerCase().trim();
          return lower === targetLower;
        })
        .map((a) => a.artistName as string);

      if (matchedArtists.length > 0) {
        andConditions.push({ artistName: { in: matchedArtists } });
      } else {
        andConditions.push({
          OR: [
            { artistName: { equals: targetArtist } },
            { artistName: { contains: targetArtist } },
          ],
        });
      }
    }

    if (q && !isArtistQuery) {
      const cleanQ = q.replace(/\s*\((Alt Art|Parallel|Reprint|Promo)[^)]*\)/gi, '').trim();
      const isPureParallel = /^(alt\s*art|parallel|parallel\s*cards?|alt\s*arts?|alt)$/i.test(cleanQ || q.trim());
      const isPurePromo = /^(promo|promos|promotional|promotions?)$/i.test(cleanQ || q.trim());
      const isPureFlagship = /^(flagship|flagships|flagship\s*battle)$/i.test(cleanQ || q.trim());
      const isPureTournament = /^(tournament|tournaments|tournament\s*pack|regional|regionals|treasure\s*cup|championship)$/i.test(cleanQ || q.trim());
      const isPureAnniversary = /^(anniversary|anniv|anniversary\s*set|25th)$/i.test(cleanQ || q.trim());
      
      const isDonCategory = (cat: string | null) => {
        if (!cat || cat.toLowerCase() === 'all') return false;
        return /^(don|don!|don!!|don!!\s*cards?|don\s*cards?|ドン|ドン!!|ドン!!カード)$/i.test(cat.trim());
      };
      const isNonDonCategorySelected = category && category !== 'All' && !isDonCategory(category);

      const isPureDon = !isNonDonCategorySelected && /^(don|don!|don!!|don!!\s*cards?|don\s*cards?|ドン|ドン!!|ドン!!カード)$/i.test((cleanQ || q).trim());
      const isCompoundDon = !isNonDonCategorySelected && !isPureDon &&
        !/donquixote|don\s*marlon/i.test(cleanQ || q) &&
        !/don't/i.test(cleanQ || q) &&
        /(?:^|\b)(?:don(?:!!?|\s*cards?|!!\s*cards?)?|ドン(?:!!?|カード)?)(?:\b|$)/i.test(cleanQ || q);

      if (isPureDon) {
        andConditions.push({
          OR: [
            { category: 'DON!!' },
            { id: { contains: 'DON' } },
            { name: { startsWith: 'DON!!' } },
          ],
        });
      } else if (isCompoundDon) {
        const donWordRegex = /(?:^|\b)(?:don(?:!!?|\s*cards?|!!\s*cards?)?|ドン(?:!!?|カード)?)(?:\b|$)/i;
        const subQuery = (cleanQ || q).replace(donWordRegex, ' ').replace(/\s+/g, ' ').trim();

        andConditions.push({
          OR: [
            { category: 'DON!!' },
            { id: { contains: 'DON' } },
            { name: { startsWith: 'DON!!' } },
          ],
        });

        if (subQuery) {
          const isParallelSub = /^(parallel|super parallel|alt|alt art|パラレル|スーパーパラレル)$/i.test(subQuery);
          const isSuperParallelSub = /^(super parallel|スーパーパラレル)$/i.test(subQuery);
          const isGoldSub = /^(gold|golden|金文字|箔押し)$/i.test(subQuery);

          if (isSuperParallelSub) {
            andConditions.push({
              OR: [
                { name: { contains: 'Super Parallel' } },
                { promoSource: { contains: 'スーパーパラレル' } },
              ],
            });
          } else if (isParallelSub) {
            andConditions.push({
              OR: [
                { id: { contains: '_p' } },
                { rarity: 'Special' },
                { promoSource: { contains: 'Parallel' } },
                { promoSource: { contains: 'パラレル' } },
              ],
            });
          } else if (isGoldSub) {
            andConditions.push({
              OR: [
                { name: { contains: '金文字' } },
                { name: { contains: '箔押し' } },
                { promoSource: { contains: '金文字' } },
                { promoSource: { contains: '箔押し' } },
              ],
            });
          } else {
            andConditions.push({
              OR: [
                { id: { contains: subQuery } },
                { name: { contains: subQuery } },
                { promoSource: { contains: subQuery } },
              ],
            });
          }
        }
      } else if (isPureParallel) {
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
        const sLower = searchTerm.toLowerCase().trim();

        // Exact word match for artist names to prevent substring bleed (e.g. nakamaru vs nakama)
        const allArtists = await prisma.card.findMany({
          where: { artistName: { not: null } },
          select: { artistName: true },
          distinct: ['artistName'],
        });

        const matchedArtistsForTerm = allArtists
          .filter((a) => {
            if (!a.artistName) return false;
            const lower = a.artistName.toLowerCase().trim();
            return lower === sLower;
          })
          .map((a) => a.artistName as string);

        const nameVariants = new Set<string>();
        nameVariants.add(searchTerm);

        // Check character aliases
        if (CHARACTER_ALIASES[sLower]) {
          for (const v of CHARACTER_ALIASES[sLower]) {
            nameVariants.add(v);
          }
        }

        // Handle space to dot variations and "D." formatting (e.g. "Portgas D Ace" -> "Portgas.D.Ace", "Edward Newgate" -> "Edward.Newgate")
        const dMatch = searchTerm.match(/^([A-Za-z]+)\s+D\.?\s+([A-Za-z]+)$/i);
        if (dMatch) {
          nameVariants.add(`${dMatch[1]}.D.${dMatch[2]}`);
        }
        if (/\b[Dd]\b/.test(searchTerm)) {
          nameVariants.add(searchTerm.replace(/\s+([Dd])\.?\s+/g, '.$1.'));
        }
        if (searchTerm.includes(' ')) {
          nameVariants.add(searchTerm.replace(/\s+/g, '.'));
        }

        // Handle transliteration variations (e.g. Kozuki <-> Kouzuki, Kaido <-> Kaidou)
        if (/kozuki/i.test(searchTerm)) {
          nameVariants.add(searchTerm.replace(/kozuki/gi, 'Kouzuki'));
        }
        if (/kouzuki/i.test(searchTerm)) {
          nameVariants.add(searchTerm.replace(/kouzuki/gi, 'Kozuki'));
        }
        if (/kaido/i.test(searchTerm)) {
          nameVariants.add(searchTerm.replace(/kaido/gi, 'Kaidou'));
        }
        if (/kaidou/i.test(searchTerm)) {
          nameVariants.add(searchTerm.replace(/kaidou/gi, 'Kaido'));
        }

        const isExactAce = sLower === 'ace';
        const orFilters: any[] = [];

        if (isExactAce) {
          orFilters.push(
            { name: { contains: 'Portgas.D.Ace' } },
            { name: { startsWith: 'Ace ' } },
            { name: { equals: 'Ace' } },
            { name: { contains: ' Ace ' } },
            { name: { contains: ' Ace,' } },
            { name: { contains: ' Ace!' } },
            { name: { contains: ' Ace?' } },
            { name: { contains: '& Ace' } },
            { name: { contains: 'Ace &' } },
            { id: { startsWith: 'Ace' } }
          );
        } else {
          for (const v of nameVariants) {
            orFilters.push({ name: { contains: v } });
            orFilters.push({ id: { contains: v } });
          }
        }

        orFilters.push(
          { promoSource: { contains: searchTerm } },
          { displaySet: { contains: searchTerm } },
          { printedSetCode: { contains: searchTerm } },
          { originalSet: { contains: searchTerm } },
          { yuyuteiSet: { contains: searchTerm } },
          { vintageSeries: { contains: searchTerm } },
          { vintagePart: { contains: searchTerm } },
        );

        const isCharacterQuery = Boolean(CHARACTER_ALIASES[sLower] || dMatch || isExactAce);

        // Only match pack.name if it's not a character query and length >= 5 to prevent deck names like "Luffy & Ace" matching all cards for Ace
        if (!isCharacterQuery && searchTerm.length >= 5) {
          orFilters.push({ pack: { is: { name: { contains: searchTerm } } } });
        }
        orFilters.push({ pack: { is: { code: { contains: searchTerm } } } });

        // Set Code & PRB Alias expansion (e.g. PRB01, PRB-01, OP01, PRB, THE BEST)
        const cleanUpperTerm = searchTerm.trim().toUpperCase();
        const setCodeMatch = cleanUpperTerm.match(/^([A-Z]{2,4})[-_\s]?0?(\d{1,2})$/);

        if (setCodeMatch) {
          const prefix = setCodeMatch[1];
          const num = parseInt(setCodeMatch[2], 10);
          const formattedNum = String(num).padStart(2, '0');
          const dashCode = `${prefix}-${formattedNum}`;
          const noDashCode = `${prefix}${formattedNum}`;

          orFilters.push(
            { displaySet: dashCode },
            { displaySet: noDashCode },
            { pack: { is: { code: dashCode } } },
            { pack: { is: { code: noDashCode } } },
            { pack: { is: { name: { contains: `[${dashCode}]` } } } },
            { printedSetCode: dashCode },
            { printedSetCode: noDashCode },
            { id: { startsWith: dashCode } },
            { id: { startsWith: noDashCode } },
            { cardNumber: { startsWith: dashCode } },
            { cardNumber: { startsWith: noDashCode } }
          );
        } else if (cleanUpperTerm === 'PRB') {
          orFilters.push(
            { displaySet: { contains: 'PRB' } },
            { pack: { is: { code: { contains: 'PRB' } } } },
            { id: { contains: 'PRB' } },
            { cardNumber: { contains: 'PRB' } }
          );
        } else if (cleanUpperTerm === 'THE BEST' || cleanUpperTerm === 'THEBEST') {
          orFilters.push(
            { pack: { is: { name: { contains: 'THE BEST' } } } },
            { displaySet: { contains: 'PRB' } }
          );
        } else if (/^THE\s*BEST\s*(?:VOL\.?\s*)?0?1$/i.test(cleanUpperTerm)) {
          orFilters.push(
            { displaySet: 'PRB-01' },
            { pack: { is: { code: 'PRB-01' } } },
            { pack: { is: { name: { contains: '[PRB-01]' } } } }
          );
        } else if (/^THE\s*BEST\s*(?:VOL\.?\s*)?0?2$/i.test(cleanUpperTerm)) {
          orFilters.push(
            { displaySet: 'PRB-02' },
            { pack: { is: { code: 'PRB-02' } } },
            { pack: { is: { name: { contains: '[PRB-02]' } } } }
          );
        }

        // Detect Set + Number compound queries like "PRB01-013", "PRB-01-013", "PRB01 013", etc.
        const compoundMatch = searchTerm.match(/^([A-Za-z]{2,4}[-_]?\d{1,2})[-\s]+(\d{2,3}(?:_p\d+)?)$/i);
        if (compoundMatch) {
          const rawSet = compoundMatch[1];
          const cardNum = compoundMatch[2];
          const cleanSet = rawSet.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          
          let dashSet = rawSet;
          let compactSet = cleanSet;

          const sm = cleanSet.match(/^([A-Z]{2,4})0?(\d{1,2})$/);
          if (sm) {
            const p = sm[1];
            const n = String(parseInt(sm[2], 10)).padStart(2, '0');
            dashSet = `${p}-${n}`;
            compactSet = `${p}${n}`;
          }

          orFilters.push({
            AND: [
              {
                OR: [
                  { displaySet: dashSet },
                  { displaySet: compactSet },
                  { pack: { is: { code: dashSet } } },
                  { pack: { is: { code: compactSet } } },
                  { pack: { is: { name: { contains: `[${dashSet}]` } } } },
                  { id: { startsWith: dashSet } },
                  { id: { startsWith: compactSet } },
                  { printedSetCode: dashSet },
                  { printedSetCode: compactSet },
                ]
              },
              {
                OR: [
                  { id: { contains: cardNum } },
                  { cardNumber: { contains: cardNum } }
                ]
              }
            ]
          });
        }

        // Prevent substring bleed: don't match types on 'don' or for character queries
        if (!isCharacterQuery && !/^(don|don!|don!!)$/i.test(searchTerm.trim())) {
          orFilters.push({ types: { contains: searchTerm } });
        }

        if (!isCharacterQuery && matchedArtistsForTerm.length > 0) {
          orFilters.push({ artistName: { in: matchedArtistsForTerm } });
        }

        andConditions.push({ OR: orFilters });
      }
    }

    if (color && color !== 'All') {
      where.colors = { contains: color };
    }

    if (category && category !== 'All') {
      const catLower = category.trim().toLowerCase();
      if (catLower === 'vintage') {
        where.isVintage = true;
      } else if (catLower === 'character') {
        where.category = 'Character';
      } else if (catLower === 'event') {
        where.category = 'Event';
      } else if (catLower === 'stage') {
        where.category = 'Stage';
      } else if (
        catLower === 'don!! card' ||
        catLower === 'don!! cards' ||
        catLower === 'don card' ||
        catLower === 'don cards' ||
        catLower === 'don!!' ||
        catLower === 'don!' ||
        catLower === 'don' ||
        catLower === 'ドン' ||
        catLower === 'ドン!!' ||
        catLower === 'ドン!!カード'
      ) {
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
        { printedSetCode: { equals: clean } },
        { printedSetCode: { equals: withDash } },
        { printedSetCode: { equals: noDash } },
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
      } else if (clean.toUpperCase() === 'DON') {
        setOrs.push({ category: 'DON!!' });
        setOrs.push({ id: { contains: 'DON' } });
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

    const res = NextResponse.json({
      cards: formattedCards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.headers.set('CDN-Cache-Control', 'public, s-maxage=3600');
    res.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600');
    return res;
  } catch (error: any) {
    console.error('Error in /api/cards route:', error);
    return NextResponse.json({ error: 'Failed to retrieve card data' }, { status: 500 });
  }
}
