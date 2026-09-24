export interface YuyuProductRecord {
  productId: string;       // e.g. "10145" (from cart_cid or URL /card/ver/cid)
  ver: string;             // e.g. "op05" (from cart_ver or URL)
  gid: string;             // e.g. "48"
  url: string;             // e.g. "https://yuyu-tei.jp/sell/opc/card/op05/10145"
  imgUrl: string;          // e.g. "https://card.yuyu-tei.jp/opc/front/op05/10145.jpg"
  cardNumber: string;      // e.g. "OP05-119"
  title: string;           // e.g. "モンキー・D・ルフィ(パラレル)"
  rarity: string;          // e.g. "P-SEC", "SEC", "L", "P-L", "SR", "P-SR", "R", "P-R", "UC", "C", "SP"
  priceYen: number;        // e.g. 24800
  stock: string;           // e.g. "4 点", "◯", "×"
  isAltArt: boolean;
  isSuperParallel: boolean;
}

export async function scrapeYuyuteiSet(slug: string): Promise<YuyuProductRecord[]> {
  const cleanSlug = slug.toLowerCase();
  const url = `https://yuyu-tei.jp/sell/opc/s/${cleanSlug}`;
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
    const items: YuyuProductRecord[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];

      // 1. Extract cart_cid (Product ID) & cart_ver (Set Version)
      const cidM = b.match(/class="cart_cid"[^>]*value="([^"]+)"/) || 
                   b.match(/value="([^"]+)"\s+class="cart_cid"/) ||
                   b.match(/\/sell\/opc\/card\/[^\/]+\/([0-9]+)/);
      const verM = b.match(/class="cart_ver"[^>]*value="([^"]+)"/) || 
                   b.match(/value="([^"]+)"\s+class="cart_ver"/) ||
                   b.match(/\/sell\/opc\/card\/([^\/]+)\/[0-9]+/);

      const productId = cidM ? cidM[1].trim() : '';
      const ver = verM ? verM[1].trim() : cleanSlug;

      if (!productId) {
        continue; // Must have valid product ID
      }

      // 2. Extract Card Number & Title
      const codeM = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
      const titleM = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
      const altM = b.match(/<img[^>]*class="card img-fluid"[^>]*alt="([^"]+)"/i) ||
                   b.match(/alt="([^"]+)"[^>]*class="card img-fluid"/i);

      let cardNumber = codeM ? codeM[1].trim() : '';
      let title = titleM ? titleM[1].trim() : '';
      let rarity = '';

      // Parse from alt attribute if available: e.g. "OP05-119 P-SEC モンキー・D・ルフィ(パラレル)"
      if (altM) {
        const parts = altM[1].trim().split(/\s+/);
        if (parts.length >= 3) {
          if (!cardNumber) cardNumber = parts[0];
          rarity = parts[1];
          if (!title) title = parts.slice(2).join(' ');
        } else if (parts.length === 2) {
          if (!cardNumber) cardNumber = parts[0];
          if (!title) title = parts[1];
        }
      }

      if (!rarity) {
        const rarityM = b.match(/<span class="d-block text-center border border-dark[^>]*>([\s\S]*?)<\/span>/i);
        if (rarityM) rarity = rarityM[1].trim();
      }

      // 3. Extract Price & Stock
      const priceM = b.match(/([0-9,]+)\s*円/);
      const priceYen = priceM ? parseInt(priceM[1].replace(/,/g, ''), 10) : 0;

      const stockM = b.match(/class="form-check-label[^"]*cart_sell_zaiko"[^>]*>([\s\S]*?)<\/label>/i);
      const stock = stockM ? stockM[1].replace(/在庫\s*:/, '').trim() : '';

      // 4. Construct direct URLs
      const productUrl = `https://yuyu-tei.jp/sell/opc/card/${ver}/${productId}`;
      const imgUrl = `https://card.yuyu-tei.jp/opc/front/${ver}/${productId}.jpg`;

      // 5. Variant Flags
      const isSuperParallel = title.includes('スーパーパラレル');
      const isAltArt = isSuperParallel || title.includes('パラレル') || title.includes('サイン') || title.includes('SP');

      items.push({
        productId,
        ver,
        gid: '48',
        url: productUrl,
        imgUrl,
        cardNumber,
        title,
        rarity: rarity || (isAltArt ? 'Parallel' : 'Standard'),
        priceYen,
        stock,
        isAltArt,
        isSuperParallel,
      });
    }

    console.log(`[${slug}] Successfully extracted ${items.length} native Yuyutei products.`);
    return items;
  } catch (err: any) {
    console.error(`[${slug}] Error scraping Yuyu-tei:`, err.message);
    return [];
  }
}
