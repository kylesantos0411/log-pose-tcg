const fs = require('fs');
const html = fs.readFileSync('scripts/yuyutei_sample.html', 'utf8');

const regex = /href="(https:\/\/yuyu-tei\.jp\/sell\/opc\/[a-zA-Z0-9_\-\/?=&;]+)"/g;
const matches = [];
let m;
while ((m = regex.exec(html)) !== null) {
  matches.push(m[1]);
}

const unique = [...new Set(matches)];
console.log('Total unique Yuyu-tei OPC links:', unique.length);

// Filter by set or search links
const setLinks = unique.filter(u => u.includes('/s/search?') || u.includes('/s/web/') || u.includes('promo'));
console.log('Set/search links:', setLinks.length);
setLinks.slice(0, 30).forEach(l => console.log(' ', l));
