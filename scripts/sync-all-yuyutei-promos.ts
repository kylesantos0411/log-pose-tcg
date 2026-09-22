/**
 * sync-all-yuyutei-promos.ts
 *
 * Scrapes all 222+ Promo cards directly from Yuyu-tei:
 * 1. Creates any missing promo variants (e.g. P-041_p2, P-041_p3, etc.)
 * 2. Sets exact Yuyu-tei prices (JPY) and realistic USD market equivalents
 * 3. Fixes severely underpriced reprints (_r1) so they never show ₱6
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface YuyuPromo {
  code: string;
  rawTitle: string;
  priceYen: number;
  img: string;
}

// Map Japanese promo character names to English
const NAME_MAP: Record<string, string> = {
  'モンキー・D・ルフィ': 'Monkey.D.Luffy',
  'ロロノア・ゾロ': 'Roronoa Zoro',
  'ナミ': 'Nami',
  'ウソップ': 'Usopp',
  'サンジ': 'Sanji',
  'トニートニー・チョッパー': 'Tony Tony.Chopper',
  'ニコ・ロビン': 'Nico Robin',
  'フランキー': 'Franky',
  'ブルック': 'Brook',
  'ジンベエ': 'Jinbe',
  'ポートガス・D・エース': 'Portgas.D.Ace',
  'サボ': 'Sabo',
  'トラファルガー・ロー': 'Trafalgar Law',
  'ユースタス・キッド': 'Eustass"Captain"Kid',
  'シャンクス': 'Shanks',
  'ボア・ハンコック': 'Boa Hancock',
  'ヤマト': 'Yamato',
  'ウタ': 'Uta',
  'ゴール・D・ロジャー': 'Gol.D.Roger',
  'シルバーズ・レイリー': 'Silvers Rayleigh',
  'エドワード・ニューゲート': 'Edward.Newgate',
  'クザン': 'Kuzan',
  'ボルサリーノ': 'Borsalino',
  'サカズキ': 'Sakazuki',
  'バギー': 'Buggy',
  'クロコダイル': 'Crocodile',
  'ドンキホーテ・ドフラミンゴ': 'Donquixote Doflamingo',
  'ジュラキュール・ミホーク': 'Dracule Mihawk',
  'バルトロメオ': 'Bartolomeo',
  'キャベンディッシュ': 'Cavendish',
  'コビー': 'Koby',
  'キャロット': 'Carrot',
  'コアラ': 'Koala',
};

async function main() {
  console.log('🌐 Fetching all Promos from Yuyu-tei (search_word=P-)...');
  const url = 'https://yuyu-tei.jp/sell/opc/s/search?search_word=P-';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Yuyu-tei: ${res.statusText}`);
  }

  const html = await res.text();
  const cardBlocks = html.split('class="card-product');
  console.log(`Fetched ${cardBlocks.length - 1} promo card blocks from Yuyu-tei.`);

  const promoCards: YuyuPromo[] = [];
  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);

    if (codeMatch && priceMatch) {
      const code = codeMatch[1].trim();
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const priceYen = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      const img = imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : '';

      promoCards.push({
        code,
        rawTitle,
        priceYen,
        img
      });
    }
  }

  // Group by base code e.g. P-041
  const grouped: Record<string, YuyuPromo[]> = {};
  for (const c of promoCards) {
    if (!grouped[c.code]) grouped[c.code] = [];
    grouped[c.code].push(c);
  }

  console.log(`Processing ${Object.keys(grouped).length} unique promo base codes...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const [code, items] of Object.entries(grouped)) {
    // Sort items: base (no (パラレル)) first, then parallels by price ascending
    items.sort((a, b) => {
      const aIsPar = a.rawTitle.includes('(パラレル)');
      const bIsPar = b.rawTitle.includes('(パラレル)');
      if (!aIsPar && bIsPar) return -1;
      if (aIsPar && !bIsPar) return 1;
      return a.priceYen - b.priceYen;
    });

    // Find any existing cards in the DB for this code (e.g. P-041, P-041_p1, P-041_r1)
    const existingInDb = await prisma.card.findMany({
      where: {
        OR: [
          { id: code },
          { id: { startsWith: `${code}_p` } },
          { id: { startsWith: `${code}_r` } }
        ]
      },
      orderBy: { id: 'asc' }
    });

    // Find template card to clone attributes if we need to create missing variants
    const templateCard = existingInDb.find(c => c.id === code) || existingInDb[0];

    // Map each item from Yuyu-tei
    let parallelIndex = 1;
    for (const item of items) {
      const isParallel = item.rawTitle.includes('(パラレル)');
      const usdPrice = Math.round((item.priceYen / 152) * 100) / 100;

      // Extract promo event description from Japanese parentheses e.g. "(BANDAI CARD GAMES Fest 23-24 World Tour来場記念)"
      const eventMatch = item.rawTitle.match(/\((?!パラレル)([^)]+)\)/);
      const eventDesc = eventMatch ? eventMatch[1].trim() : (isParallel ? 'Parallel Promo' : 'Official Bandai Promo');

      let targetId = code;
      if (isParallel) {
        targetId = `${code}_p${parallelIndex}`;
        parallelIndex++;
      }

      const existingCard = existingInDb.find(c => c.id === targetId);

      if (existingCard) {
        // Update price and promoSource
        await prisma.card.update({
          where: { id: targetId },
          data: {
            yuyuPrice: item.priceYen,
            marketPrice: existingCard.marketPrice && existingCard.marketPrice > 1.0 ? existingCard.marketPrice : usdPrice,
            promoSource: existingCard.promoSource || eventDesc,
            imageUrl: existingCard.imageUrl || item.img
          }
        });
        updatedCount++;
      } else if (templateCard) {
        // Create the missing variant!
        await prisma.card.create({
          data: {
            id: targetId,
            packId: templateCard.packId || '569901',
            name: templateCard.name,
            category: templateCard.category,
            colors: templateCard.colors,
            cost: templateCard.cost,
            power: templateCard.power,
            counter: templateCard.counter,
            attributes: templateCard.attributes,
            types: templateCard.types,
            rarity: 'Promo',
            effect: templateCard.effect,
            trigger: templateCard.trigger,
            imageUrl: item.img || templateCard.imageUrl,
            blockNumber: templateCard.blockNumber || 2,
            isAltArt: true,
            baseCardId: code,
            marketPrice: usdPrice,
            yuyuPrice: item.priceYen,
            promoSource: eventDesc,
          }
        });
        createdCount++;
        console.log(`  ✨ Created missing promo variant: [${targetId}] ${templateCard.name} (${eventDesc}): ¥${item.priceYen}`);
      }
    }

    // Also fix any reprint card (e.g. P-041_r1) that was given $0.11 / ₱6
    const reprints = existingInDb.filter(c => c.id.includes('_r'));
    for (const r of reprints) {
      const baseItem = items[0];
      if (baseItem && (!r.marketPrice || r.marketPrice < 1.0 || !r.yuyuPrice || r.yuyuPrice < 100)) {
        const reprintYen = Math.round(baseItem.priceYen * 0.45);
        const reprintUsd = Math.round(reprintYen / 152 * 100) / 100;
        await prisma.card.update({
          where: { id: r.id },
          data: {
            yuyuPrice: Math.max(reprintYen, 250),
            marketPrice: Math.max(reprintUsd, 2.0),
            promoSource: r.promoSource || 'Premium Booster Promo Reprint'
          }
        });
        console.log(`  🔧 Fixed underpriced reprint: [${r.id}] ${r.name}: ¥${Math.max(reprintYen, 250)} / $${Math.max(reprintUsd, 2.0)}`);
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Finished syncing promos! Created: ${createdCount} new cards, Updated: ${updatedCount} cards.`);

  // Verify P-041 specifically
  const p041Cards = await prisma.card.findMany({
    where: { id: { contains: 'P-041' } },
    select: { id: true, name: true, rarity: true, marketPrice: true, yuyuPrice: true, promoSource: true }
  });
  console.log('\n--- VERIFIED P-041 IN DATABASE ---');
  console.table(p041Cards);

  await prisma.$disconnect();
}

main().catch(console.error);
