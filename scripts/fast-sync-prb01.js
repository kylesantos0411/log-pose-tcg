const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function derivePhysicalCardCodes(cardNumber) {
  let printedSetCode = '';
  let originalSet = '';

  if (cardNumber.startsWith('P-')) {
    printedSetCode = 'P';
    originalSet = 'PROMO';
  } else if (cardNumber === '-' || cardNumber.includes('DON')) {
    printedSetCode = 'DON';
    originalSet = 'DON';
  } else {
    const dashIdx = cardNumber.indexOf('-');
    if (dashIdx > 0) {
      printedSetCode = cardNumber.substring(0, dashIdx).toUpperCase();
      const match = printedSetCode.match(/^([A-Za-z]+)(\d+)$/);
      if (match) {
        originalSet = `${match[1].toUpperCase()}-${match[2]}`;
      } else {
        originalSet = printedSetCode;
      }
    } else {
      printedSetCode = cardNumber.toUpperCase();
      originalSet = cardNumber.toUpperCase();
    }
  }

  return { printedSetCode, originalSet };
}

function mapBandaiRarity(rawRarity, id) {
  const r = (rawRarity || '').toUpperCase();
  if (r === 'SEC') return 'SecretRare';
  if (r === 'SR') return 'SuperRare';
  if (r === 'R') return 'Rare';
  if (r === 'UC') return 'Uncommon';
  if (r === 'C') return 'Common';
  if (r === 'L') return 'Leader';
  if (r.includes('SP')) return 'Special';
  if (r.includes('TR')) return 'TreasureRare';
  if (r === 'P') return 'Promo';
  return rawRarity || 'Common';
}

function mapBandaiCategory(rawCategory) {
  const c = (rawCategory || '').toUpperCase();
  if (c === 'CHARACTER') return 'Character';
  if (c === 'LEADER') return 'Leader';
  if (c === 'EVENT') return 'Event';
  if (c === 'STAGE') return 'Stage';
  if (c.includes('DON')) return 'DON!!';
  return rawCategory || 'Character';
}

async function fastSyncSet(seriesId, setCode, packId, yuyuSlug) {
  console.log(`1. Fetching Bandai Asia ${setCode} (${seriesId})...`);
  const bandaiRes = await fetch(`https://asia-en.onepiece-cardgame.com/cardlist/?series=${seriesId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  const bandaiHtml = await bandaiRes.text();
  const dlBlocks = bandaiHtml.split('<dl class="modalCol"');
  console.log(`Bandai Asia cards found: ${dlBlocks.length - 1}`);

  console.log(`2. Fetching Yuyu-tei ${setCode} prices...`);
  const yuyuRes = await fetch(`https://yuyu-tei.jp/sell/opc/s/${yuyuSlug}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9',
    }
  });
  const yuyuHtml = await yuyuRes.text();
  const yuyuBlocks = yuyuHtml.split('class="card-product');
  console.log(`Yuyu-tei products found: ${yuyuBlocks.length - 1}`);

  const yuyuByCode = new Map();
  for (let i = 1; i < yuyuBlocks.length; i++) {
    const b = yuyuBlocks[i];
    const codeM = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleM = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const priceM = b.match(/([0-9,]+)\s*円/);
    if (codeM && priceM) {
      const code = codeM[1].trim();
      const rawTitle = titleM ? titleM[1].trim() : '';
      const priceYen = parseInt(priceM[1].replace(/,/g, ''), 10);
      const isAltArt = rawTitle.includes('パラレル') || rawTitle.includes('サイン');
      const isSuperParallel = rawTitle.includes('スーパーパラレル');

      if (!yuyuByCode.has(code)) yuyuByCode.set(code, []);
      yuyuByCode.get(code).push({ code, rawTitle, priceYen, isAltArt, isSuperParallel });
    }
  }

  let pack = await prisma.pack.findFirst({
    where: { OR: [{ code: setCode }, { id: packId }] }
  });

  let created = 0;
  let updated = 0;

  for (let i = 1; i < dlBlocks.length; i++) {
    const b = dlBlocks[i];
    const idMatch = b.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const infoMatch = b.match(/<div class="infoCol">([\s\S]*?)<\/div>/i);
    const infoParts = infoMatch
      ? [...infoMatch[1].matchAll(/<span>([\s\S]*?)<\/span>/gi)].map(m => cleanHtml(m[1]))
      : [];

    const cardNumber = infoParts[0] || id.split('_')[0];
    const rawRarity = infoParts[1] || '';
    const rawCategory = infoParts[2] || '';

    const nameMatch = b.match(/<div class="cardName">([\s\S]*?)<\/div>/i);
    const name = nameMatch ? cleanHtml(nameMatch[1]) : cardNumber;

    const imgMatch = b.match(/data-src="\.\.\/images\/cardlist\/card\/([^"?]+)/i);
    const imgFile = imgMatch ? imgMatch[1] : `${id}.png`;
    const imageUrl = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${imgFile}`;

    const costMatch = b.match(/<div class="cost"><h3>Cost<\/h3>([\s\S]*?)<\/div>/i);
    const costStr = costMatch ? cleanHtml(costMatch[1]) : null;
    const cost = costStr && costStr !== '-' ? parseInt(costStr, 10) : null;

    const powerMatch = b.match(/<div class="power"><h3>Power<\/h3>([\s\S]*?)<\/div>/i);
    const powerStr = powerMatch ? cleanHtml(powerMatch[1]) : null;
    const power = powerStr && powerStr !== '-' ? parseInt(powerStr, 10) : null;

    const counterMatch = b.match(/<div class="counter"><h3>Counter<\/h3>([\s\S]*?)<\/div>/i);
    const counterStr = counterMatch ? cleanHtml(counterMatch[1]) : null;
    const counter = counterStr && counterStr !== '-' ? parseInt(counterStr, 10) : null;

    const colorMatch = b.match(/<div class="color"><h3>Color<\/h3>([\s\S]*?)<\/div>/i);
    const rawColor = colorMatch ? cleanHtml(colorMatch[1]) : '';
    const colors = rawColor.replace(/\s*\/\s*/g, ',').trim() || 'Red';

    const attrMatch = b.match(/<div class="attribute">[\s\S]*?<i>([\s\S]*?)<\/i>/i);
    const attributes = attrMatch ? cleanHtml(attrMatch[1]) : null;

    const typeMatch = b.match(/<div class="feature"><h3>Type<\/h3>([\s\S]*?)<\/div>/i);
    const types = typeMatch ? cleanHtml(typeMatch[1]) : null;

    const effectMatch = b.match(/<div class="text"><h3>Effect<\/h3>([\s\S]*?)<\/div>/i);
    const effect = effectMatch ? cleanHtml(effectMatch[1]) : null;

    const triggerMatch = b.match(/<div class="trigger"><h3>Trigger<\/h3>([\s\S]*?)<\/div>/i);
    const trigger = triggerMatch ? cleanHtml(triggerMatch[1]) : null;

    const isAltArt = id.includes('_p') || id.includes('_sp') || rawRarity.includes('SP') || rawRarity.includes('TR');

    const { printedSetCode, originalSet } = derivePhysicalCardCodes(cardNumber);

    let printingType = 'Original';
    if (id.includes('_p3') || (rawRarity === 'SEC' && id.includes('_p'))) {
      printingType = 'Super Parallel';
    } else if (rawRarity.includes('SP') || id.includes('_sp')) {
      printingType = 'Special';
    } else if (isAltArt) {
      printingType = 'Parallel';
    } else if (originalSet !== setCode && originalSet !== 'DON') {
      printingType = 'Reprint';
    }

    const rarity = mapBandaiRarity(rawRarity, id);
    const category = mapBandaiCategory(rawCategory);

    // Match Yuyu-tei price
    const yuyuCandidates = yuyuByCode.get(cardNumber) || [];
    let matchedYuyu = null;
    if (yuyuCandidates.length === 1) {
      matchedYuyu = yuyuCandidates[0];
    } else if (yuyuCandidates.length > 1) {
      if (printingType === 'Super Parallel') {
        matchedYuyu = yuyuCandidates.find(c => c.isSuperParallel);
      }
      if (!matchedYuyu) {
        if (isAltArt) {
          matchedYuyu = yuyuCandidates.find(c => c.isAltArt && !c.isSuperParallel);
        } else {
          matchedYuyu = yuyuCandidates.find(c => !c.isAltArt && !c.isSuperParallel);
        }
      }
    }

    const existingCard = await prisma.card.findUnique({ where: { id } });
    const yuyuPrice = matchedYuyu ? matchedYuyu.priceYen : existingCard?.yuyuPrice || null;
    const marketPrice = yuyuPrice ? Math.round((yuyuPrice / 140) * 100) / 100 : existingCard?.marketPrice || null;

    const cardPayload = {
      packId: pack.id,
      name,
      category,
      colors,
      cost,
      power,
      counter,
      attributes,
      types,
      rarity,
      effect,
      trigger,
      imageUrl,
      isAltArt,
      yuyuPrice,
      marketPrice,
      releaseDate: pack.releaseDate,
      releaseOrder: pack.releaseOrder,
      cardNumber,
      printedSetCode,
      originalSet,
      yuyuteiSet: setCode,
      displaySet: setCode,
      printingType,
      hasJpPrint: true,
    };

    if (existingCard) {
      await prisma.card.update({
        where: { id },
        data: cardPayload
      });
      updated++;
    } else {
      await prisma.card.create({
        data: {
          id,
          ...cardPayload
        }
      });
      created++;
    }
  }

  const total = await prisma.card.count({ where: { packId: pack.id } });
  await prisma.pack.update({
    where: { id: pack.id },
    data: { cardsCount: total }
  });

  console.log(`${setCode} sync finished! Created: ${created}, Updated: ${updated}, Total in pack: ${total}`);
}

async function main() {
  await fastSyncSet('556301', 'PRB-01', '569301', 'prb01');
}

main().finally(() => prisma.$disconnect());
