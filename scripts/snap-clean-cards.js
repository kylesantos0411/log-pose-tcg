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

  // 1. Clean 3-column cards view (sort=latest)
  console.log('Navigating to http://localhost:3000/cards?sort=latest...');
  await page.goto('http://localhost:3000/cards?sort=latest', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'cards_clean_3col_verified.png') });
  console.log('Saved: cards_clean_3col_verified.png');

  // 2. Scrolled down view
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'cards_clean_3col_scrolled_verified.png') });
  console.log('Saved: cards_clean_3col_scrolled_verified.png');

  // 3. Open filters drawer
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  const filterBtn = await page.$('button[title="Toggle Filter & Search"]');
  if (filterBtn) {
    await filterBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS, 'cards_filters_drawer_verified.png') });
    console.log('Saved: cards_filters_drawer_verified.png');
    // Close filter drawer
    await filterBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Toggle 2-column view
  const gridBtn = await page.$('button[title*="Toggle between 2 and 3 columns"]');
  if (gridBtn) {
    await gridBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS, 'cards_2col_verified.png') });
    console.log('Saved: cards_2col_verified.png');
  }

  // 5. Open Card Detail View
  const firstCard = await page.$('main div[class*="cursor-pointer"]');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS, 'cards_detail_modal_verified.png') });
    console.log('Saved: cards_detail_modal_verified.png');
  }

  await browser.close();
  console.log('All verification screenshots saved successfully!');
}

main().catch(console.error);
