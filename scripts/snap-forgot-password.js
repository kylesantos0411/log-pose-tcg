const puppeteer = require('puppeteer-core');
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
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click account button in header (title="Account / Sign In")
  const accountBtn = await page.$('button[title*="Account"]');
  if (accountBtn) {
    await accountBtn.click();
  } else {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Account'));
      if (btn) btn.click();
    });
  }

  await new Promise(r => setTimeout(r, 1000));

  // Click on "Sign In" tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const signInTab = tabs.find(t => t.textContent && t.textContent.trim() === 'Sign In');
    if (signInTab) signInTab.click();
  });

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS, 'account_login_with_forgot_pw.png') });
  console.log('Saved account_login_with_forgot_pw.png');

  // Click "Forgot password?"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const forgot = btns.find(b => b.textContent && b.textContent.includes('Forgot password?'));
    if (forgot) forgot.click();
  });

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS, 'account_forgot_password_view.png') });
  console.log('Saved account_forgot_password_view.png');

  await browser.close();
}

main().catch(console.error);
