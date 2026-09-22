const fs = require('fs');

async function testCat() {
  const res = await fetch(`https://yuyu-tei.jp/show/opc/list/cat1`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  fs.writeFileSync('scripts/cat1.html', html);
  console.log('Saved cat1.html. Length:', html.length);
  
  const regex = /href="([^"]+)"/g;
  const links = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    links.push(m[1]);
  }
  console.log('Total links:', links.length);
  const filtered = [...new Set(links.filter(l => !l.startsWith('#') && !l.includes('javascript:')))];
  filtered.slice(0, 40).forEach(l => console.log(' ', l));
}

testCat();
