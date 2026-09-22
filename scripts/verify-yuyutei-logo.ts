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
  await page.setViewport({ width: 440, height: 950, deviceScaleFactor: 2 });

  console.log('Navigating to OP05-119_p1 card detail...');
  await page.goto('http://localhost:3000/cards/OP05-119_p1', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));

  // Scroll down a bit so the pricing box is prominently in view
  await page.evaluate(() => {
    window.scrollBy(0, 320);
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.screenshot({ path: path.join(outDir, 'card_detail_yuyutei_phoenix_logo.png') });
  console.log('Saved card_detail_yuyutei_phoenix_logo.png');

  // Also take full page screenshot
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'card_detail_full_verified.png') });
  console.log('Saved card_detail_full_verified.png');

  await browser.close();
}

main().catch(console.error);
