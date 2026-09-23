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
    localStorage.setItem('logpose_install_dismissed', String(Date.now()));
  });

  // Helper to remove any loader and wait
  async function cleanAndSnap(url, outName) {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.evaluate(() => {
      const loader = document.getElementById('app-sync-loader');
      if (loader) loader.remove();
      document.documentElement.classList.add('app-synced');
    });
    await new Promise(r => setTimeout(r, 2000));
    const outPath = path.join(ARTIFACTS, outName);
    await page.screenshot({ path: outPath });
    console.log(`Saved: ${outName}`);
  }

  // 1. Sunohara filter
  await cleanAndSnap('http://localhost:3000/cards?artist=Sunohara', 'artist_sunohara_verified.png');

  // 2. Search "oda"
  await cleanAndSnap('http://localhost:3000/cards?q=oda', 'artist_search_oda_verified.png');

  // 3. Artist Modal for Sunohara
  await cleanAndSnap('http://localhost:3000/cards/OP01-016_p1', 'card_detail_nami_sunohara.png');
  const artistBtn = await page.$('button[title*="View Illustrator"]');
  if (artistBtn) {
    await artistBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS, 'sunohara_profile_modal_verified.png') });
    console.log('Saved: sunohara_profile_modal_verified.png');
  }

  await browser.close();
  console.log('All artist snapshots complete!');
}

main().catch(console.error);
