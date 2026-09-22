async function run() {
  const res = await fetch('https://onepiece-cardgame.com/cardlist/?series=550901');
  const html = await res.text();
  const idx = html.indexOf('入手');
  if (idx !== -1) {
    console.log('Snippet around 入手:', html.slice(idx - 100, idx + 400));
  } else {
    console.log('入手 not found, let\'s search for class="getInfo"');
    const idx2 = html.indexOf('getInfo');
    if (idx2 !== -1) {
      console.log('Snippet around getInfo:', html.slice(idx2 - 100, idx2 + 400));
    } else {
      console.log('getInfo not found, let\'s look for dt/dd');
      const idx3 = html.indexOf('<dt>');
      if (idx3 !== -1) {
        console.log('Snippet around <dt>:', html.slice(idx3, idx3 + 500));
      }
    }
  }
}
run();
