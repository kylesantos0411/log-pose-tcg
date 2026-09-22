const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function screenshot(browser, url, filename, waitMs = 3000) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(waitMs);
  const outPath = path.join(ARTIFACTS, filename);
  await page.screenshot({ path: outPath, fullPage: false });
  await page.close();
  console.log('Saved:', outPath);
}

async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  
  await screenshot(browser, 'http://localhost:3000/cards?q=ST01-001&lang=jp', 'verify_st01001_jp.png', 4000);
  await screenshot(browser, 'http://localhost:3000/cards?q=EB01-015&lang=jp', 'verify_eb01015_jp.png', 4000);
  await screenshot(browser, 'http://localhost:3000/cards?q=OP05-119&lang=jp', 'verify_op05119_jp.png', 4000);
  
  await browser.close();
  console.log('All done!');
}

main().catch(console.error);
