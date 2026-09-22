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
  await page.setViewport({ width: 1400, height: 950 });

  // 1. Visit settings and capture live preview toggles
  await page.goto('http://localhost:3000/settings', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Open settings modal
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Settings"]') || document.querySelector('header button');
    // or trigger openSettings directly or click settings button
  });
  
  // Let's open via clicking currency / settings button on /cards page
  await page.goto('http://localhost:3000/cards?q=OP02-001', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2500));

  // Click currency button in top right header to open SettingsModal
  const settingsBtn = await page.$('button[title*="Currency"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS, 'settings_toggles_preview.png') });
    console.log('Saved settings_toggles_preview.png');

    // Click PSA to toggle it off!
    const psaToggle = await page.$('button[title*="PSA"]');
    if (psaToggle) {
      await psaToggle.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACTS, 'settings_psa_toggled_off.png') });
      console.log('Saved settings_psa_toggled_off.png');
    }

    // Close settings modal
    const closeBtn = await page.$('button[aria-label="Close settings"]') || await page.$('.fixed button:has(svg)');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // Now click on the first card to open detail modal
  const cardImg = await page.$('.group .aspect-\\[7\\/10\\]');
  if (cardImg) {
    await cardImg.click();
    await new Promise(r => setTimeout(r, 1500));

    // Scroll down to see pricing and chart
    await page.evaluate(() => {
      const scrollable = document.querySelector('.overflow-y-auto');
      if (scrollable) {
        scrollable.scrollTop = 260;
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS, 'card_detail_psa_hidden.png') });
    console.log('Saved card_detail_psa_hidden.png');

    // Now click eBay in the chart legend footer to toggle eBay off directly from the card modal!
    const ebayLegendBtn = await page.$('button[title*="eBay"]');
    if (ebayLegendBtn) {
      await ebayLegendBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACTS, 'card_detail_ebay_toggled_from_chart.png') });
      console.log('Saved card_detail_ebay_toggled_from_chart.png');
    }
  }

  await browser.close();
}

main().catch(console.error);
