import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '01_small_portrait_phone', width: 320, height: 568, orientation: 'portrait' },
  { name: '02_standard_portrait_phone', width: 375, height: 667, orientation: 'portrait' },
  { name: '03_modern_portrait_phone', width: 390, height: 844, orientation: 'portrait' },
  { name: '04_large_portrait_phone', width: 430, height: 932, orientation: 'portrait' },
  { name: '05_compact_landscape_phone', width: 667, height: 375, orientation: 'landscape' },
  { name: '06_standard_landscape_phone', width: 844, height: 390, orientation: 'landscape' },
  { name: '07_large_landscape_phone', width: 932, height: 430, orientation: 'landscape' },
  { name: '08_tablet_portrait', width: 768, height: 1024, orientation: 'portrait' },
  { name: '09_tablet_landscape', width: 1024, height: 768, orientation: 'landscape' },
  { name: '10_desktop', width: 1366, height: 768, orientation: 'landscape' },
];

const outDir = path.resolve('public/test-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`Testing ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    
    try {
      await page.addInitScript(() => {
        const session = {
          id: 'user-kai',
          name: 'kaipuccino',
          username: 'kaipuccino',
          tag: '@kaipuccino',
          email: 'kylesantos0411@gmail.com',
          role: 'admin',
          avatar: '',
          crew: 'Straw Hat Pirates',
          rank: 'Pirate King',
          rankBadge: '👑',
        };
        localStorage.setItem('logpose_user_session', JSON.stringify(session));
      });

      await page.goto('http://localhost:3000/sim', { waitUntil: 'networkidle', timeout: 20000 });
      // Wait for app sync loader to finish naturally and fade out
      await page.waitForSelector('#app-sync-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // Click Sandbox Practice / Play Sandbox
      const sandboxBtn = await page.$('text="Play Sandbox"');
      if (sandboxBtn) {
        await sandboxBtn.click();
      }

      // Wait for matchmaking modal (2.5s)
      await page.waitForTimeout(3500);

      // Dismiss Mulligan dialog if present
      const keepBtn = await page.$('button:has-text("Keep Hand"), button:has-text("Keep")');
      if (keepBtn) {
        await keepBtn.click().catch(() => {});
        await page.waitForTimeout(1500);
      }
      
      // If matchmaking screen is visible, skip/click battle button if present
      const matchBtn = await page.$('button:has-text("Start Battle"), button:has-text("Ready"), button:has-text("Skip")');
      if (matchBtn) {
        await matchBtn.click().catch(() => {});
        await page.waitForTimeout(1000);
      }

      // Check overflow
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        return {
          scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
          innerWidth: window.innerWidth,
          scrollHeight: Math.max(root.scrollHeight, body.scrollHeight),
          innerHeight: window.innerHeight,
          hasHScroll: Math.max(root.scrollWidth, body.scrollWidth) > window.innerWidth + 1,
          hasVScroll: Math.max(root.scrollHeight, body.scrollHeight) > window.innerHeight + 1,
        };
      });

      const shotPath = path.join(outDir, `${vp.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath}`);

      results.push({
        ...vp,
        overflow,
        success: true,
      });
    } catch (err) {
      console.error(`Error on ${vp.name}:`, err.message);
      results.push({
        ...vp,
        error: err.message,
        success: false,
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
