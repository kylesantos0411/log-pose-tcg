const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  // 1. Visit EB01-015 and wait until images are loaded
  console.log('Visiting EB01-015...');
  await page.goto('http://localhost:3000/cards?q=EB01-015', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait for all images on page to fully complete loading
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('.aspect-\\[7\\/10\\] img'));
    return imgs.length > 0 && imgs.every(img => img.complete && img.naturalHeight > 0);
  }, { timeout: 15000 }).catch(() => console.log('Some images may still be loading...'));

  await page.screenshot({ path: path.join(ARTIFACTS, 'eb01_015_loaded_yuyutei.png') });
  console.log('Saved: eb01_015_loaded_yuyutei.png');

  // 2. Open first card modal (EB01-015) and verify modal with Yuyu-tei logo and full artwork
  const firstCard = await page.$('.group .aspect-\\[7\\/10\\]');
  if (firstCard) {
    await firstCard.click();
    await page.waitForFunction(() => {
      const modalImgs = Array.from(document.querySelectorAll('.fixed img'));
      return modalImgs.some(img => img.complete && img.naturalHeight > 0);
    }, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS, 'eb01_015_modal_yuyutei.png') });
    console.log('Saved: eb01_015_modal_yuyutei.png');
  }

  // 3. Visit OP02 set page or OP02 search to verify Japanese cards
  console.log('Visiting OP02...');
  await page.goto('http://localhost:3000/cards?set=OP02&limit=8', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('.aspect-\\[7\\/10\\] img'));
    return imgs.length > 0 && imgs.every(img => img.complete && img.naturalHeight > 0);
  }, { timeout: 15000 }).catch(() => {});
  await page.screenshot({ path: path.join(ARTIFACTS, 'op02_yuyutei_loaded.png') });
  console.log('Saved: op02_yuyutei_loaded.png');

  await browser.close();
}

main().catch(console.error);
