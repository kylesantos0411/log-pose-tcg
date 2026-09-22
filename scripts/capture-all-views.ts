import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 920, deviceScaleFactor: 2 });

  // 1. OP05-119_p1 (The "GEAR 5" comic card that was mistakenly priced before)
  console.log('Navigating to OP05-119_p1...');
  await page.goto('http://localhost:3000/cards/OP05-119_p1', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'op05_119_p1_gear5_fixed.png') });
  console.log('Saved op05_119_p1_gear5_fixed.png');

  // 2. OP05-119_p2 (The Manga Rare)
  console.log('Navigating to OP05-119_p2...');
  await page.goto('http://localhost:3000/cards/OP05-119_p2', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'op05_119_p2_manga_fixed.png') });
  console.log('Saved op05_119_p2_manga_fixed.png');

  // 3. Search EB01-015 in English with PHP currency (verifying _p3 is ₱35)
  console.log('Navigating to EB01-015 English search...');
  await page.goto('http://localhost:3000/cards?q=EB01-015&currency=PHP', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'eb01_015_en_catalog_fixed.png') });
  console.log('Saved eb01_015_en_catalog_fixed.png');

  // 4. Search EB01-015 in Japanese mode (verifying English promos _p3, _p4, _p5 are hidden)
  console.log('Navigating to EB01-015 Japanese search...');
  await page.goto('http://localhost:3000/cards?q=EB01-015&lang=jp&currency=source', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'eb01_015_jp_catalog_clean.png') });
  console.log('Saved eb01_015_jp_catalog_clean.png');

  // 5. Search OP05-119 in Japanese mode
  console.log('Navigating to OP05-119 Japanese search...');
  await page.goto('http://localhost:3000/cards?q=OP05-119&lang=jp&currency=source', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'op05_119_jp_catalog_clean.png') });
  console.log('Saved op05_119_jp_catalog_clean.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(console.error);
