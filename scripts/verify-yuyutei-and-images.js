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

  // 1. Check OP02-001 with modal open (verifying Yuyu-tei logo and authentic Japanese artwork)
  console.log('Navigating to OP02-001...');
  await page.goto('http://localhost:3000/cards?q=OP02-001', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const cardImg = await page.$('.group .aspect-\\[7\\/10\\]');
  if (cardImg) {
    await cardImg.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS, 'yuyutei_logo_and_modal_verified.png') });
    console.log('Saved: yuyutei_logo_and_modal_verified.png');
  }

  // 2. Check EB01-015 variants list
  console.log('Navigating to EB01-015...');
  await page.goto('http://localhost:3000/cards?q=EB01-015', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'eb01_015_yuyutei_verified.png') });
  console.log('Saved: eb01_015_yuyutei_verified.png');

  // 3. Check Collection view
  console.log('Navigating to collection...');
  await page.goto('http://localhost:3000/collection', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'collection_jp_verified.png') });
  console.log('Saved: collection_jp_verified.png');

  await browser.close();
  console.log('All verification screenshots captured!');
}

main().catch(console.error);
