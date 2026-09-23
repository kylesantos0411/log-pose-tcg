const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('log_pose_app_synced', 'true');
    localStorage.setItem('logpose_install_dismissed', String(Date.now()));
  });

  console.log('--- TEST 1: OP01-001 (Base Card without human artist) ---');
  await page.goto('http://localhost:3000/cards/OP01-001', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const pageContent1 = await page.content();
  const hasBandaiNamco = pageContent1.includes('BANDAI NAMCO') || pageContent1.includes('TOEI ANIMATION');
  const hasOfficialCardArt = pageContent1.includes('Official Card Art');
  console.log('OP01-001 has Bandai Namco illustrator button:', hasBandaiNamco);
  console.log('OP01-001 has Official Card Art badge:', hasOfficialCardArt);
  await page.screenshot({ path: path.join(ARTIFACTS, 'base_card_official_art_verified.png') });

  console.log('\n--- TEST 2: OP01-016_p1 (Sunohara Parallel Art) ---');
  await page.goto('http://localhost:3000/cards/OP01-016_p1', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const pageContent2 = await page.content();
  const hasSunohara = pageContent2.includes('SUNOHARA');
  console.log('OP01-016_p1 displays SUNOHARA illustrator button:', hasSunohara);
  await page.screenshot({ path: path.join(ARTIFACTS, 'nami_sunohara_verified.png') });

  console.log('\n--- TEST 3: OP05-119_p1 (Eiichiro Oda Manga Rare) ---');
  await page.goto('http://localhost:3000/cards/OP05-119_p1', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const pageContent3 = await page.content();
  const hasOda = pageContent3.includes('EIICHIRO ODA');
  console.log('OP05-119_p1 displays EIICHIRO ODA illustrator button:', hasOda);
  await page.screenshot({ path: path.join(ARTIFACTS, 'manga_oda_verified.png') });

  console.log('\n--- TEST 4: /cards Filter Tray and Artist Dropdown ---');
  await page.goto('http://localhost:3000/cards', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Click filter button to open filter tray
  const filterBtn = await page.$('button[title*="Filter"], button:has(svg.lucide-sliders-horizontal)');
  if (filterBtn) {
    await filterBtn.click();
    await new Promise(r => setTimeout(r, 800));
  } else {
    // try finding by text or icon
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const f = btns.find(b => b.textContent.includes('Filter') || b.innerHTML.includes('sliders-horizontal'));
      if (f) f.click();
    });
    await new Promise(r => setTimeout(r, 800));
  }

  // Check all options in illustrator select
  const selectOptions = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const artistSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('Illustrator') || o.text.includes('Eiichiro Oda')));
    if (!artistSelect) return [];
    return Array.from(artistSelect.options).map(o => o.text);
  });
  console.log('Artist dropdown options count:', selectOptions.length);
  console.log('Artist dropdown options:', selectOptions);
  console.log('Contains Bandai Namco:', selectOptions.some(o => o.includes('Bandai') || o.includes('Toei')));

  await page.screenshot({ path: path.join(ARTIFACTS, 'artist_dropdown_verified.png') });

  await browser.close();
  console.log('\nAll tests complete!');
}

main().catch(console.error);
