const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  // 1. Mobile viewport (exactly matching user's phone screenshot aspect ratio 420x900)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });
  await mobilePage.evaluateOnNewDocument(() => {
    sessionStorage.setItem('log_pose_app_synced', 'true');
    localStorage.setItem('logpose_install_dismissed', String(Date.now()));
  });

  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await mobilePage.evaluate(() => {
    const el = document.getElementById('app-sync-loader');
    if (el) el.remove();
  });
  await new Promise(r => setTimeout(r, 1000));
  await mobilePage.screenshot({ path: path.join(ARTIFACTS, 'clean_theme_mobile_verified.png') });
  console.log('Saved: clean_theme_mobile_verified.png');

  // 2. Desktop viewport (1400x1000)
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1400, height: 1000 });
  await desktopPage.evaluateOnNewDocument(() => {
    sessionStorage.setItem('log_pose_app_synced', 'true');
    localStorage.setItem('logpose_install_dismissed', String(Date.now()));
  });

  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await desktopPage.evaluate(() => {
    const el = document.getElementById('app-sync-loader');
    if (el) el.remove();
  });
  await new Promise(r => setTimeout(r, 1000));
  await desktopPage.screenshot({ path: path.join(ARTIFACTS, 'clean_theme_desktop_verified.png') });
  console.log('Saved: clean_theme_desktop_verified.png');

  await browser.close();
  console.log('Done clean theme snapshots!');
}

main().catch(console.error);
