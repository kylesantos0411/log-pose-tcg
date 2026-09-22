const fs = require('fs');
const html = fs.readFileSync('scripts/yuyutei_sample.html', 'utf8');

const cardBlocks = html.split('class="card-product');
console.log('cardBlocks length:', cardBlocks.length);

for (let i = 1; i < cardBlocks.length; i++) {
  const b = cardBlocks[i];
  const priceMatch = b.match(/([0-9,]+)\s*円/);
  const codeMatch = b.match(/class="d-block border border-dark[^>]*>([\s\S]*?)<\/span>/i);
  const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
  console.log(`Block ${i}:`, {
    code: codeMatch ? codeMatch[1].trim() : 'no code',
    price: priceMatch ? priceMatch[1] : 'no price',
    title: titleMatch ? titleMatch[1].trim() : 'no title'
  });
}
