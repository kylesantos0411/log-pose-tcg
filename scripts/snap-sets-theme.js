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

  // 1. Initial sets page (collapsed by default)
  console.log('Navigating to http://localhost:3000/sets...');
  await page.goto('http://localhost:3000/sets', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'sets_default_collapsed_dark.png') });
  console.log('Saved: sets_default_collapsed_dark.png');

  // 2. Expand booster section by clicking via evaluate
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const boosterBtn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('booster'));
    if (boosterBtn) boosterBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS, 'sets_booster_expanded_dark.png') });
  console.log('Saved: sets_booster_expanded_dark.png');

  // 3. Scroll down to see chamfered buttons
  await page.evaluate(() => window.scrollBy(0, 350));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS, 'sets_chamfered_list_dark.png') });
  console.log('Saved: sets_chamfered_list_dark.png');

  await browser.close();
  console.log('Finished capturing sets screenshots!');
}

main().catch(console.error);
