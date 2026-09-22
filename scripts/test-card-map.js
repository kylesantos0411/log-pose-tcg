async function run() {
  const res = await fetch('https://en.onepiece-cardgame.com/cardlist/?series=569801');
  const html = await res.text();
  
  const dlBlocks = html.split('<dl class="modalCol"');
  console.log('Total dl blocks:', dlBlocks.length - 1);

  const cardPromoMap = {};
  for (let i = 1; i < dlBlocks.length; i++) {
    const block = dlBlocks[i];
    const imgMatch = block.match(/data-src=["'][^"']*?\/card\/([^"'\?]+)\.png/i);
    const cardId = imgMatch ? imgMatch[1] : null;

    const infoMatch = block.match(/<div class="getInfo"><h3>Card Set\(s\)<\/h3>([\s\S]*?)<\/div>/i);
    const eventInfo = infoMatch ? infoMatch[1].replace(/<[^>]+>/g, '').trim() : null;

    if (cardId) {
      cardPromoMap[cardId] = eventInfo;
    }
  }

  const sampleEntries = Object.entries(cardPromoMap).slice(0, 15);
  console.log('Mapped 569801 cards count:', Object.keys(cardPromoMap).length);
  console.log('Sample entries:', sampleEntries);
}
run();
