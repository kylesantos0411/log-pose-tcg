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
  await page.setViewport({ width: 1400, height: 1000 });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('log_pose_app_synced', 'true');
    localStorage.setItem('optcg_install_dismissed', 'true');
  });

  // 1. Snapshot /cards?sort=latest
  await page.goto('http://localhost:3000/cards?sort=latest', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS, 'op17_op18_cards_latest_verified.png') });
  console.log('Saved: op17_op18_cards_latest_verified.png');

  // 2. Snapshot modal on home page
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes('Latest')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACTS, 'op17_op18_modal_verified.png') });
  console.log('Saved: op17_op18_modal_verified.png');

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
