async function testBatch() {
  const testIds = [
    'OP01-001', 'OP01-001_p1', 'OP01-120', 'OP01-120_p1', 'OP01-120_p2',
    'EB01-015', 'EB01-015_p1', 'EB01-015_p2', 'EB01-015_p3', 'EB01-015_p4', 'EB01-015_p5', 'EB01-015_r1'
  ];

  const t0 = Date.now();
  const results = await Promise.all(
    testIds.map(async (id) => {
      try {
        const res = await fetch(`https://onepiece-cardgame.com/images/cardlist/card/${id}.png`, { method: 'HEAD' });
        return { id, existsJp: res.status === 200 };
      } catch (e) {
        return { id, existsJp: false };
      }
    })
  );
  console.log(`Checked ${testIds.length} cards in ${Date.now() - t0}ms:`);
  console.table(results);
}

testBatch();
