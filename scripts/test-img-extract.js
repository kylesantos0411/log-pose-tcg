const fs = require('fs');

async function testImg() {
  const html = fs.readFileSync('scripts/yuyutei_sample.html', 'utf8');
  const cardBlocks = html.split('class="card-product');

  for (let i = 1; i < cardBlocks.length; i++) {
    const b = cardBlocks[i];
    const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);
    const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
    const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
    const priceMatch = b.match(/([0-9,]+)\s*円/);

    console.log(`Card ${i}:`, {
      code: codeMatch ? codeMatch[1].trim() : '',
      title: titleMatch ? titleMatch[1].trim() : '',
      price: priceMatch ? priceMatch[1] : '',
      img: imgMatch ? imgMatch[1] : 'no img',
      frontImg: imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : 'no'
    });
  }
}

testImg();
