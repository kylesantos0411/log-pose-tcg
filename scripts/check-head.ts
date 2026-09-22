async function check() {
  const urls = [
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015.png',
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p1.png',
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p2.png',
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p3.png',
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p4.png',
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015_p5.png',
    'https://onepiece-cardgame.com/images/cardlist/card/EB01-015_r1.png',
  ];

  for (const u of urls) {
    const res = await fetch(u, { method: 'HEAD' });
    console.log(u.split('/').pop(), res.status, res.headers.get('content-length'));
  }
}
check();
