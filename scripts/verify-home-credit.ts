import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  // 1. Mobile viewport (iPhone 16 Pro: 393 x 852)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await mobilePage.screenshot({ path: path.join(outDir, 'home_developer_credit_verified.png') });
  console.log('Saved home_developer_credit_verified.png');

  // 2. Phone Simulator Preview
  const previewPage = await browser.newPage();
  await previewPage.setViewport({ width: 1200, height: 850, deviceScaleFactor: 1.5 });
  await previewPage.goto('http://localhost:3000/preview', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await previewPage.screenshot({ path: path.join(outDir, 'home_developer_credit_preview.png') });
  console.log('Saved home_developer_credit_preview.png');

  await browser.close();
}

main().catch(console.error);
