const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

async function parseYuyu(searchWord) {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(searchWord)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9'
    }
  });

  const html = await res.text();
  const blocks = html.split('class="card-product');
  console.log(`Found ${blocks.length - 1} cards for ${searchWord}:`);
  
  const cards = [];
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"\s+alt="([^"]+)"/i);

    if (codeMatch && priceMatch) {
      const priceYen = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      const code = codeMatch[1].trim();
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const img = imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : '';
      const alt = imgMatch ? imgMatch[2] : '';
      cards.push({ code, rawTitle, priceYen, img, alt });
      console.log(`  [${i}] ${code} | ${rawTitle} | ¥${priceYen.toLocaleString()} | ${img}`);
    }
  }
  return cards;
}

parseYuyu(process.argv[2] || 'ST01-001');
