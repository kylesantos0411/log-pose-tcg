async function run() {
  const [res1, res2] = await Promise.all([
    fetch('https://onepiece-cardgame.com/cardlist/?series=550901').then(r=>r.text()),
    fetch('https://onepiece-cardgame.com/cardlist/?series=550801').then(r=>r.text())
  ]);

  function parseJpHtml(html) {
    const blocks = html.split('<dl class="modalCol"');
    const map = {};
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const imgMatch = b.match(/data-src=["'][^"']*?\/card\/([^"'\?]+)\.png/i);
      const cardId = imgMatch ? imgMatch[1] : null;
      
      // Get the text between 入手情報 and next <div or </dd>
      const infoMatch = b.match(/<h3>入手情報<\/h3>([\s\S]*?)(?:<div class="getInfoBtnCol"|<\/dd>|<\/div>)/i);
      const eventInfo = infoMatch ? infoMatch[1].replace(/<[^>]+>/g, '').trim() : null;
      if (cardId) map[cardId] = eventInfo;
    }
    return map;
  }

  const map1 = parseJpHtml(res1);
  const map2 = parseJpHtml(res2);
  const total = { ...map1, ...map2 };

  console.log('Total JP mapped:', Object.keys(total).length);
  const flagship = Object.entries(total).filter(([id, info]) => info && info.includes('フラッグシップ'));
  console.log('JP Flagship cards count:', flagship.length);
  console.log('Sample Flagship cards:', flagship.slice(0, 15));
}
run();
