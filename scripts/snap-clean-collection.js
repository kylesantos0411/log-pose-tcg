const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  // 1. Mobile Collection view (List mode, no cut elements)
  console.log('Navigating to http://localhost:3000/collection...');
  await page.goto('http://localhost:3000/collection', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'collection_clean_mobile_verified.png') });
  console.log('Saved: collection_clean_mobile_verified.png');

  // 2. Scrolled view
  await page.evaluate(() => window.scrollBy(0, 300));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS, 'collection_scrolled_mobile_verified.png') });
  console.log('Saved: collection_scrolled_mobile_verified.png');

  // 3. Switch to Grid view
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  const gridBtn = await page.$('button[title="Grid View"]');
  if (gridBtn) {
    await gridBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS, 'collection_grid_mobile_verified.png') });
    console.log('Saved: collection_grid_mobile_verified.png');
  }

  // 4. Tap first card to verify detail view modal opens
  const firstCard = await page.$('div[class*="aspect-"]');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS, 'collection_card_detail_verified.png') });
    console.log('Saved: collection_card_detail_verified.png');
  }

  await browser.close();
  console.log('Finished capturing collection screenshots!');
}

main().catch(console.error);
