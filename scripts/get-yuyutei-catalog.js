const fs = require('fs');

async function testTop() {
  const res = await fetch('https://yuyu-tei.jp/top/opc', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const html = await res.text();
  fs.writeFileSync('scripts/yuyutei_top.html', html);
  console.log('Saved scripts/yuyutei_top.html (length:', html.length, ')');

  const regex = /href="([^"]+)"/g;
  const links = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    links.push(m[1]);
  }
  const opcLinks = [...new Set(links.filter(l => l.includes('/opc/')))];
  console.log('OPC links:', opcLinks.length);
  opcLinks.forEach(l => console.log(' ', l));
}

testTop();
