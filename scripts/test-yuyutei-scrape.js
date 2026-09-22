async function test() {
  const url = 'https://yuyu-tei.jp/sell/opc/s/search?search_word=P-041';
  console.log('Fetching Yuyu-tei search:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML Length:', html.length);
    
    // Save sample HTML to scratch
    const fs = require('fs');
    fs.writeFileSync('scripts/yuyutei_sample.html', html);
    console.log('Saved scripts/yuyutei_sample.html');
  } catch (err) {
    console.error('Error fetching Yuyu-tei:', err);
  }
}

test();
