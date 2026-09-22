import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 420, height: 880, deviceScaleFactor: 2 });

  // 1. Home screen
  console.log('Loading home screen...');
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await mobilePage.screenshot({ path: path.join(outDir, 'clean_home_no_bars.png') });
  console.log('Saved clean_home_no_bars.png');

  // 2. Cards screen
  console.log('Loading cards screen...');
  await mobilePage.goto('http://localhost:3000/cards', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));
  await mobilePage.screenshot({ path: path.join(outDir, 'cards_no_bars.png') });
  console.log('Saved cards_no_bars.png');

  // 3. Sets screen
  console.log('Loading sets screen...');
  await mobilePage.goto('http://localhost:3000/sets', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await mobilePage.screenshot({ path: path.join(outDir, 'sets_no_bars.png') });
  console.log('Saved sets_no_bars.png');

  // 4. Phone preview simulator
  console.log('Loading simulator preview...');
  const previewPage = await browser.newPage();
  await previewPage.setViewport({ width: 1200, height: 850, deviceScaleFactor: 1.5 });
  await previewPage.goto('http://localhost:3000/preview', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2500));
  await previewPage.screenshot({ path: path.join(outDir, 'preview_simulator_no_bars.png') });
  console.log('Saved preview_simulator_no_bars.png');

  await browser.close();
}

main().catch(console.error);
