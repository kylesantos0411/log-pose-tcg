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
  await page.setViewport({ width: 1400, height: 1100 });
  await page.goto('http://localhost:3000/cards?q=EB01-015', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2500));
  
  // Click on the first card artwork to open modal
  const cardImg = await page.$('.group .aspect-\\[7\\/10\\]');
  if (cardImg) {
    await cardImg.click();
    await new Promise(r => setTimeout(r, 1500));

    // Scroll the modal container so the chart box is fully visible
    await page.evaluate(() => {
      const scrollable = document.querySelector('.overflow-y-auto');
      if (scrollable) {
        scrollable.scrollTop = 260;
      }
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACTS, 'chart_layout_verified.png') });
    console.log('Saved: chart_layout_verified.png');
  }
  await browser.close();
}

main().catch(console.error);
