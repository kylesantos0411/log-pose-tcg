const fs = require('fs');

const list = [
  'OP01-120', 'OP02-013', 'OP03-122', 'OP04-083', 'OP06-118', 'OP07-051', 'OP08-118', 'OP09-118', 'OP10-119', 'EB01-006'
];

async function main() {
  for (const code of list) {
    try {
      const res = await fetch('https://yuyu-tei.jp/sell/opc/s/search?search_word=' + code, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await res.text();
      const blocks = html.split('class="card-product');
      console.log('\n=== ' + code + ' ===');
      for (let i = 1; i < blocks.length; i++) {
        const b = blocks[i];
        const priceMatch = b.match(/([0-9,]+)\s*円/);
        const titleMatch = b.match(/<h4 class="text-primary fw-bold">([\s\S]*?)<\/h4>/i);
        const imgMatch = b.match(/src="(https:\/\/card\.yuyu-tei\.jp\/opc\/[^"]+)"/i);
        console.log('  ', (titleMatch ? titleMatch[1].trim() : ''), '--> ¥' + (priceMatch ? priceMatch[1] : ''), imgMatch ? imgMatch[1].replace('/100_140/', '/front/') : '');
      }
    } catch (e) {
      console.error(code, e.message);
    }
  }
}

main();
