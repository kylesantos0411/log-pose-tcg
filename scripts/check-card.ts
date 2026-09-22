async function main() {
  const query = process.argv[2] || 'EB01-015';
  console.log(`Searching Yuyu-tei for: ${query}`);
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Yuyu-tei: ${res.statusText}`);
  }

  const html = await res.text();
  const cardBlocks = html.split('class="card-product');
  console.log(`Found ${cardBlocks.length - 1} card blocks on Yuyu-tei.`);

  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const rarityMatch = b.match(/<span class="d-block text-center text-white py-1 px-2 fw-bold[^>]*>([\s\S]*?)<\/span>/i);

    const code = codeMatch ? codeMatch[1].trim() : 'Unknown';
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';
    const rarity = rarityMatch ? rarityMatch[1].trim() : '';
    const price = priceMatch ? priceMatch[1] : '0';

    console.log(`[${i}] ${code} | Rarity: ${rarity} | Title: ${title} | Price: ¥${price}`);
  }
}

main().catch(console.error);
