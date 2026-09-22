const https = require('https');

https.get('https://yuyu-tei.jp/sell/opc/s/search?search_word=OP14-108', {
  family: 4,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const blocks = body.split('class="card-product');
    console.log('Total blocks for OP14-108:', blocks.length - 1);
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
      const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
      const priceMatch = b.match(/([0-9,]+)\s*円/);
      const imgMatch = b.match(/src="([^"]+yuyu-tei\.jp\/opc\/[^"]+)"/i) || b.match(/data-src="([^"]+yuyu-tei\.jp\/opc\/[^"]+)"/i);
      console.log({
        code: codeMatch ? codeMatch[1].trim() : null,
        title: titleMatch ? titleMatch[1].trim() : null,
        price: priceMatch ? priceMatch[1] : null,
        img: imgMatch ? imgMatch[1] : null
      });
    }
  });
});
