import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  // 1. Mobile viewport
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 420, height: 880, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await mobilePage.screenshot({ path: path.join(outDir, 'onepiece_tcg_header_verified.png') });
  console.log('Saved onepiece_tcg_header_verified.png');

  // 2. Desktop simulator preview
  const previewPage = await browser.newPage();
  await previewPage.setViewport({ width: 1200, height: 850, deviceScaleFactor: 1.5 });
  await previewPage.goto('http://localhost:3000/preview', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));
  await previewPage.screenshot({ path: path.join(outDir, 'onepiece_tcg_preview_verified.png') });
  console.log('Saved onepiece_tcg_preview_verified.png');

  await browser.close();
}

main().catch(console.error);
