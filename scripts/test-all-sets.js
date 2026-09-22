async function testAllSets() {
  const sets = [
    'OP01', 'OP02', 'OP03', 'OP04', 'OP05', 'OP06', 'OP07', 'OP08', 'OP09', 'OP10',
    'EB01', 'PRB01'
  ];

  for (const s of sets) {
    const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${s}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9'
      }
    });
    const html = await res.text();
    const blocks = html.split('class="card-product');
    console.log(`Set ${s}: ${blocks.length - 1} cards found on Yuyu-tei`);
  }
}

testAllSets();
