const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function screenshot(url, filename) {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('has_seen_splash', 'true');
    localStorage.setItem('optcg_install_dismissed', 'true');
    sessionStorage.setItem('log_pose_app_synced', 'true');
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    try {
      await page.waitForSelector('#app-sync-loader', { hidden: true, timeout: 6000 });
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
    const outPath = path.join(ARTIFACTS, filename);
    await page.screenshot({ path: outPath });
    console.log('Saved:', filename);
  } catch (e) {
    console.error('Error:', e.message);
  }
  await browser.close();
}

const [, , url, filename] = process.argv;
screenshot(url, filename).catch(console.error);
