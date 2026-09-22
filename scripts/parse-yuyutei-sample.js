const fs = require('fs');

const html = fs.readFileSync('scripts/yuyutei_sample.html', 'utf8');

// Look for card containers
// In Yuyu-tei, cards in search results usually have class "card-product" or similar
console.log('--- Analyzing HTML structure ---');

// Search for price patterns like "980 円" or "2,480 円"
const priceMatches = [...html.matchAll(/([0-9,]+)\s*円/g)];
console.log('Total price matches:', priceMatches.length);
priceMatches.slice(0, 15).forEach(m => console.log('Price found:', m[0]));

// Let's inspect the cards around 980 or 2,480 or 9,980
const lines = html.split('\n');
console.log('\nTotal lines:', lines.length);

// Let's find lines with "P-041"
const p041Lines = [];
lines.forEach((l, idx) => {
  if (l.includes('P-041') || l.includes('モンキー・D・ルフィ')) {
    p041Lines.push({ line: idx + 1, content: l.trim().slice(0, 150) });
  }
});
console.log('\nLines mentioning P-041 or Monkey D Luffy:', p041Lines.length);
p041Lines.slice(0, 20).forEach(x => console.log(`L${x.line}: ${x.content}`));
