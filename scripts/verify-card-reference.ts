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
  await page.setViewport({ width: 420, height: 880, deviceScaleFactor: 2 });

  // 1. Shanks card OP01-120
  await page.goto('http://localhost:3000/cards/OP01-120', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, 'card_stats_shanks_verified.png') });
  console.log('Saved card_stats_shanks_verified.png');

  // 2. ST17-003 or OP05-119_p1
  await page.goto('http://localhost:3000/cards/OP05-119_p1', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, 'card_stats_luffy_verified.png') });
  console.log('Saved card_stats_luffy_verified.png');

  await browser.close();
}

main().catch(console.error);
