async function run() {
  const [res1, res2] = await Promise.all([
    fetch('https://en.onepiece-cardgame.com/cardlist/?series=569901').then(r=>r.text()),
    fetch('https://en.onepiece-cardgame.com/cardlist/?series=569801').then(r=>r.text()),
  ]);

  function parseHtml(html) {
    const blocks = html.split('<dl class="modalCol"');
    const map = {};
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const imgMatch = b.match(/data-src=["'][^"']*?\/card\/([^"'\?]+)\.png/i);
      const cardId = imgMatch ? imgMatch[1] : null;
      const infoMatch = b.match(/<div class="getInfo"><h3>Card Set\(s\)<\/h3>([\s\S]*?)<\/div>/i);
      const eventInfo = infoMatch ? infoMatch[1].replace(/<[^>]+>/g, '').trim() : null;
      if (cardId) map[cardId] = eventInfo;
    }
    return map;
  }

  const map1 = parseHtml(res1);
  const map2 = parseHtml(res2);
  const allEvents = new Set([...Object.values(map1), ...Object.values(map2)]);

  console.log('Total event strings:', allEvents.size);
  const flagship = [...allEvents].filter(s => /flagship/i.test(s));
  const tournament = [...allEvents].filter(s => /tournament|championship|cup|regional|battle|qualifier|winner/i.test(s));
  const anniversary = [...allEvents].filter(s => /anniversary|collection|goods|gift/i.test(s));

  console.log('Flagship events:', flagship);
  console.log('Tournament / Competitive events count:', tournament.length);
  console.log('Tournament sample:', tournament.slice(0, 10));
  console.log('Anniversary / Special sample:', anniversary.slice(0, 10));
}
run();
