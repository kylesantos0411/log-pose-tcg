async function testSearchP() {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=P-`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });
  console.log(`Status: ${res.status}`);
  const html = await res.text();
  console.log(`HTML Length: ${html.length}`);

  const cardBlocks = html.split('class="card-product');
  console.log(`Total card blocks for "P-": ${cardBlocks.length - 1}`);

  const sample = [];
  for (let i = 1; i < Math.min(cardBlocks.length, 25); i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="([^"]+)"/i);

    if (codeMatch && priceMatch) {
      sample.push({
        code: codeMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim() : '',
        priceYen: parseInt(priceMatch[1].replace(/,/g, ''), 10),
        img: imgMatch ? imgMatch[1] : ''
      });
    }
  }

  console.table(sample);

  // Check if pagination exists
  const paginationMatch = html.match(/class="pagination[\s\S]*?<\/ul>/i);
  console.log('Has pagination?', !!paginationMatch);
  if (paginationMatch) {
    const pageLinks = [...paginationMatch[0].matchAll(/href="([^"]+)"/g)].map(x => x[1]);
    console.log('Pagination links:', pageLinks);
  }
}

testSearchP();
