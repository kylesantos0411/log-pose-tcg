const http = require('http');

function getUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  // Test ST01-001 in JP mode
  const raw = await getUrl('http://localhost:3000/api/cards?q=ST01-001&lang=jp&limit=10');
  const result = JSON.parse(raw);
  console.log('=== ST01-001 JP mode ===');
  console.log('Total:', result.pagination?.total);
  for (const c of result.cards) {
    console.log(`  ${c.id}: ${c.name} | yuyuPrice=¥${c.yuyuPrice} | marketPrice=$${c.marketPrice}`);
  }

  // Test EB01-015 in JP mode
  const raw2 = await getUrl('http://localhost:3000/api/cards?q=EB01-015&lang=jp&limit=10');
  const result2 = JSON.parse(raw2);
  console.log('\n=== EB01-015 JP mode ===');
  console.log('Total:', result2.pagination?.total);
  for (const c of result2.cards) {
    console.log(`  ${c.id}: ${c.name} | yuyuPrice=¥${c.yuyuPrice} | promoSource=${c.promoSource}`);
  }
}

main().catch(console.error);
