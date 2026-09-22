async function testSearch(query) {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });
  console.log(`Query: "${query}" - Status: ${res.status}`);
  const html = await res.text();
  console.log(`HTML Length: ${html.length}`);

  const cardBlocks = html.split('class="card-product');
  console.log(`cardBlocks length: ${cardBlocks.length}`);

  const results = [];
  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="([^"]+)"\s+alt="([^"]+)"/i);

    if (codeMatch && priceMatch) {
      results.push({
        code: codeMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim() : '',
        priceYen: parseInt(priceMatch[1].replace(/,/g, ''), 10),
        img: imgMatch ? imgMatch[1] : '',
        alt: imgMatch ? imgMatch[2] : ''
      });
    }
  }

  results.forEach((r, idx) => {
    console.log(`  [${idx + 1}] ${r.code} - ${r.title} : ¥${r.priceYen.toLocaleString()}`);
  });
}

async function main() {
  const query = process.argv[2] || 'ST01-001';
  await testSearch(query);
}

main();
