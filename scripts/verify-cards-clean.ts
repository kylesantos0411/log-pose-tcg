import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Cards page with sort=latest (clean 3-column art grid matching reference)
  await page.goto('http://localhost:3000/cards?sort=latest');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, 'cards_clean_3col_latest.png') });
  console.log('Saved cards_clean_3col_latest.png');

  // 2. Scrolled down view of cards
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'cards_clean_3col_scrolled.png') });
  console.log('Saved cards_clean_3col_scrolled.png');

  // 3. Scroll back to top and open filter drawer
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  // Click filter toggle button
  const filterBtn = page.locator('button[title="Toggle Filter & Search"]');
  if (await filterBtn.isVisible()) {
    await filterBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'cards_filters_drawer_open.png') });
    console.log('Saved cards_filters_drawer_open.png');
  }

  // 4. Click grid toggle button to switch to 2 columns
  const gridBtn = page.locator('button[title*="Toggle between 2 and 3 columns"]');
  if (await gridBtn.isVisible()) {
    // Close filter drawer first
    const closeBtn = page.locator('button[title="Toggle Filter & Search"]');
    await closeBtn.click();
    await page.waitForTimeout(500);
    await gridBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'cards_2col_toggle.png') });
    console.log('Saved cards_2col_toggle.png');
  }

  // 5. Click on the first card to verify card detail view
  const firstCard = page.locator('main div[class*="cursor-pointer"]').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'cards_detail_modal_from_grid.png') });
    console.log('Saved cards_detail_modal_from_grid.png');
  }

  await browser.close();
}

main().catch(console.error);
