export interface YuyuScrapedItem {
  code: string;
  title: string;
  priceYen: number;
  imgUrl: string | null;
  rarity: string | null;
  isSuperParallel: boolean;
  isParallel: boolean;
  isBase: boolean;
}

export async function scrapeYuyuteiSet(slug: string): Promise<YuyuScrapedItem[]> {
  const url = `https://yuyu-tei.jp/sell/opc/s/${slug.toLowerCase()}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      }
    });

    if (!res.ok) {
      console.warn(`[${slug}] Yuyu-tei returned status ${res.status}`);
      return [];
    }

    const html = await res.text();
    const blocks = html.split('class="card-product');
    const items: YuyuScrapedItem[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const codeM = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
      const titleM = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
      const priceM = b.match(/([0-9,]+)\s*円/);
      const imgM = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);
      const rarityM = b.match(/<span class="d-block text-center border border-dark[^>]*>([\s\S]*?)<\/span>/i);

      if (codeM && priceM) {
        const code = codeM[1].trim();
        const title = titleM ? titleM[1].trim() : '';
        const priceYen = parseInt(priceM[1].replace(/,/g, ''), 10);
        const imgUrl = imgM ? imgM[1].replace('/100_140/', '/front/') : null;
        const rarity = rarityM ? rarityM[1].trim() : null;

        const isSuperParallel = title.includes('スーパーパラレル');
        const isParallel = !isSuperParallel && (title.includes('パラレル') || title.includes('サイン') || title.includes('SP'));
        const isBase = !title.includes('パラレル') && !title.includes('サイン');

        items.push({
          code,
          title,
          priceYen,
          imgUrl,
          rarity,
          isSuperParallel,
          isParallel,
          isBase
        });
      }
    }

    console.log(`[${slug}] Scraped ${items.length} items from Yuyu-tei.`);
    return items;
  } catch (err: any) {
    console.error(`[${slug}] Error scraping Yuyu-tei:`, err.message);
    return [];
  }
}
