async function testMapping() {
  const url = 'https://yuyu-tei.jp/sell/opc/s/search?search_word=%E3%83%89%E3%83%B3%21%21%E3%82%AB%E3%83%BC%E3%83%89';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  
  const regex = /<a\s+href="https:\/\/yuyu-tei\.jp\/sell\/opc\/card\/([^\/"]+)\/(\d+)"[^>]*>[\s\S]*?<img\s+src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<h4[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/gi;
  
  let match;
  const cards = [];
  while ((match = regex.exec(html)) !== null) {
    const [, folder, productId, imgSrc, alt, titleRaw, priceRaw] = match;
    const title = titleRaw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const price = parseInt(priceRaw.replace(/[^0-9]/g, ''), 10) || null;
    const bigImg = imgSrc.replace('/100_140/', '/front/');
    cards.push({
      folder,
      productId,
      title,
      price,
      imgUrl: bigImg,
      url: `https://yuyu-tei.jp/sell/opc/card/${folder}/${productId}`
    });
  }
  
  console.log('Total cards scraped:', cards.length);

  // Group by folder and sort by productId ascending
  const byFolder = {};
  for (const c of cards) {
    if (!byFolder[c.folder]) byFolder[c.folder] = [];
    byFolder[c.folder].push(c);
  }

  for (const f of Object.keys(byFolder)) {
    byFolder[f].sort((a, b) => parseInt(a.productId, 10) - parseInt(b.productId, 10));
    console.log(`\nFolder: ${f} (${byFolder[f].length} cards):`);
    byFolder[f].slice(0, 6).forEach((c, idx) => {
      console.log(`  [${c.productId}] ${c.title} -> ${c.price}円`);
    });
  }
}

testMapping().catch(console.error);
