async function inspectOP05() {
  const url = `https://yuyu-tei.jp/sell/opc/s/search?search_word=OP05-119`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  const cardBlocks = html.split('class="card-product');
  
  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const priceMatch = b.match(/([0-9,]+)\s*円/);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);
    console.log(`[${i}]`, {
      code: codeMatch ? codeMatch[1].trim() : '',
      title: titleMatch ? titleMatch[1].trim() : '',
      price: priceMatch ? priceMatch[1] : '',
      frontImg: imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : ''
    });
  }
}

inspectOP05();
