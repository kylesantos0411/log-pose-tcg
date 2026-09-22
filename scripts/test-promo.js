async function run() {
  const res = await fetch('https://en.onepiece-cardgame.com/cardlist/?series=569901');
  const html = await res.text();
  const regex = /<div class="getInfo"><h3>Card Set\(s\)<\/h3>(.*?)<\/div>/g;
  let match;
  const sets = new Set();
  while ((match = regex.exec(html)) !== null) {
    sets.add(match[1].trim());
  }
  console.log('Unique Card Sets in 569901 count:', sets.size);
  console.log([...sets]);
}
run();
