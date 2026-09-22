async function check() {
  const resJp = await fetch('https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p3.png');
  console.log('Bandai JP EB01-015_p3 status:', resJp.status);

  const resEn = await fetch('https://en.onepiece-cardgame.com/images/cardlist/card/EB01-015_p3.png');
  console.log('Bandai EN EB01-015_p3 status:', resEn.status);

  for (let i = 1; i <= 6; i++) {
    const rJ = await fetch(`https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p${i}.png`);
    const rE = await fetch(`https://en.onepiece-cardgame.com/images/cardlist/card/EB01-015_p${i}.png`);
    console.log(`EB01-015_p${i} -> JP: ${rJ.status} | EN: ${rE.status}`);
  }

  const r0J = await fetch('https://onepiece-cardgame.com/images/cardlist/card/EB01-015.png');
  const r0E = await fetch('https://en.onepiece-cardgame.com/images/cardlist/card/EB01-015.png');
  console.log(`EB01-015 base -> JP: ${r0J.status} | EN: ${r0E.status}`);

  const r1J = await fetch('https://onepiece-cardgame.com/images/cardlist/card/EB01-015_r1.png');
  const r1E = await fetch('https://en.onepiece-cardgame.com/images/cardlist/card/EB01-015_r1.png');
  console.log(`EB01-015_r1 -> JP: ${r1J.status} | EN: ${r1E.status}`);
}

check();
