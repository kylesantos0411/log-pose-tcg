import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 480, height: 860 },
    deviceScaleFactor: 2,
  });

  // 1. OP05-119_p1 detail view (the "GEAR 5" comic card that was mistakenly priced)
  const page1 = await context.newPage();
  await page1.goto('http://localhost:3000/cards/OP05-119_p1');
  await page1.waitForTimeout(2500);
  await page1.screenshot({ path: path.join(outDir, 'op05_119_p1_gear5_fixed.png') });
  console.log('Saved op05_119_p1_gear5_fixed.png');

  // 2. OP05-119_p2 detail view (the actual Manga Rare)
  const page2 = await context.newPage();
  await page2.goto('http://localhost:3000/cards/OP05-119_p2');
  await page2.waitForTimeout(2500);
  await page2.screenshot({ path: path.join(outDir, 'op05_119_p2_manga_fixed.png') });
  console.log('Saved op05_119_p2_manga_fixed.png');

  // 3. EB01-015 search in English mode (checking _p3 price)
  const page3 = await context.newPage();
  await page3.goto('http://localhost:3000/cards?q=EB01-015&currency=PHP');
  await page3.waitForTimeout(2500);
  await page3.screenshot({ path: path.join(outDir, 'eb01_015_en_catalog_fixed.png') });
  console.log('Saved eb01_015_en_catalog_fixed.png');

  // 4. EB01-015 search in Japanese mode (checking exclusion of English exclusives)
  const page4 = await context.newPage();
  await page4.goto('http://localhost:3000/cards?q=EB01-015&lang=jp&currency=source');
  await page4.waitForTimeout(2500);
  await page4.screenshot({ path: path.join(outDir, 'eb01_015_jp_catalog_clean.png') });
  console.log('Saved eb01_015_jp_catalog_clean.png');

  // 5. OP05-119 search in Japanese mode
  const page5 = await context.newPage();
  await page5.goto('http://localhost:3000/cards?q=OP05-119&lang=jp&currency=source');
  await page5.waitForTimeout(2500);
  await page5.screenshot({ path: path.join(outDir, 'op05_119_jp_catalog_clean.png') });
  console.log('Saved op05_119_jp_catalog_clean.png');

  await browser.close();
}

main().catch(console.error);
