import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });

  // 1. Mobile Portrait (iPhone 14 / modern phone: 390 x 844)
  const portraitContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page1 = await portraitContext.newPage();
  await page1.goto('http://localhost:3000/sim?deckId=gumgum-op15-058-83574f8a', { waitUntil: 'networkidle' });
  try {
    await page1.waitForSelector('#app-sync-loader', { state: 'detached', timeout: 8000 });
  } catch {
    await page1.waitForTimeout(5000);
  }
  await page1.waitForTimeout(1000);
  try {
    await page1.click('button:has-text("KEEP HAND")', { timeout: 4000 });
  } catch {}
  await page1.waitForTimeout(1000);
  const pPath = path.join(outDir, 'sim_portrait_verification.png');
  await page1.screenshot({ path: pPath });
  console.log('Saved portrait screenshot:', pPath);
  await portraitContext.close();

  // 2. Mobile Landscape (844 x 390)
  const landscapeContext = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page2 = await landscapeContext.newPage();
  await page2.goto('http://localhost:3000/sim?deckId=gumgum-op15-058-83574f8a', { waitUntil: 'networkidle' });
  try {
    await page2.waitForSelector('#app-sync-loader', { state: 'detached', timeout: 8000 });
  } catch {
    await page2.waitForTimeout(5000);
  }
  await page2.waitForTimeout(1000);
  try {
    await page2.click('button:has-text("KEEP HAND")', { timeout: 4000 });
  } catch {}
  await page2.waitForTimeout(1000);
  const lPath = path.join(outDir, 'sim_landscape_verification.png');
  await page2.screenshot({ path: lPath });
  console.log('Saved landscape screenshot:', lPath);
  await landscapeContext.close();

  await browser.close();
}

main().catch(console.error);
