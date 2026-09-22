const puppeteer = require('puppeteer');
const path = require('path');

async function screenshot(url, filename, waitMs = 3000) {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, waitMs));
  const outPath = path.join('C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318', filename);
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  console.log('Screenshot saved:', outPath);
}

async function main() {
  // Test ST01-001 in JP mode (should show 3 cards with correct prices)
  await screenshot('http://localhost:3000/cards?q=ST01-001&lang=jp', 'verify_st01001_jp.png');
  
  // Test EB01-015 in JP mode (should show base + _p1 + _p3 + _r1 only)
  await screenshot('http://localhost:3000/cards?q=EB01-015&lang=jp', 'verify_eb01015_jp.png');
  
  // Test a random OP set in JP mode
  await screenshot('http://localhost:3000/cards?set=OP01&lang=jp', 'verify_op01_jp.png');
}

main().catch(console.error);
