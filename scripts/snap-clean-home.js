const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  // 1. Mobile viewport (iPhone 15 Pro dimension: 430 x 932)
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });
  await pageMobile.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await pageMobile.screenshot({ path: path.join(ARTIFACTS, 'clean_home_mobile_verified.png') });
  console.log('Saved: clean_home_mobile_verified.png');

  // 2. Desktop viewport (1440 x 1050)
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 1050 });
  await pageDesktop.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await pageDesktop.screenshot({ path: path.join(ARTIFACTS, 'clean_home_desktop_verified.png') });
  console.log('Saved: clean_home_desktop_verified.png');

  await browser.close();
  console.log('Done screenshots!');
}

main().catch(console.error);
