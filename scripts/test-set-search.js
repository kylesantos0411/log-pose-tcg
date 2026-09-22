async function testSet(code) {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=${encodeURIComponent(code)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });
  const html = await res.text();
  const cardBlocks = html.split('class="card-product');
  console.log(`Set "${code}" -> Found ${cardBlocks.length - 1} cards on Yuyu-tei!`);
  
  // Print top 5
  for (let i = 1; i < Math.min(cardBlocks.length, 6); i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    if (codeMatch && priceMatch) {
      console.log(`  ${codeMatch[1].trim()} - ${titleMatch ? titleMatch[1].trim() : ''}: ¥${priceMatch[1]}`);
    }
  }
}

async function main() {
  await testSet('EB01');
  await testSet('OP05');
}

main();
