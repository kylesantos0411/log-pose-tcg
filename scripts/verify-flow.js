const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 }); // iPhone 14 Pro

  // 1. Visit Clean Home Screen (as fresh guest)
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_01_home.png' });
  console.log('1. Captured clean guest home screen');

  // 2. Open Account Modal by tapping 'Join' in header
  const joinBtn = await page.$('button[title="Create Account / Sign In"]');
  if (joinBtn) {
    await joinBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_02_account_modal.png' });
    console.log('2. Captured Account Registration modal');

    // Fill in username 'Kyle Santos'
    await page.type('input[placeholder*="Kyle"]', 'Kyle Santos');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_03_account_filled.png' });
    console.log('3. Captured filled account with live tag');

    // Submit registration
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await new Promise(r => setTimeout(r, 1800));
  }

  // 3. Visit Friends Page (Clean state for Kyle)
  await page.goto('http://localhost:3000/friends', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_04_friends_empty.png' });
  console.log('4. Captured fresh friends empty state for registered user');

  // 4. Click Add Demo Friends by finding button with text
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demo = btns.find(b => b.textContent.includes('Add Demo Mates'));
    if (demo) demo.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_05_friends_populated.png' });
  console.log('5. Captured friends list populated with demo mates');

  // 5. Open Add Friend Modal and enter a custom tag
  const addFriendBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const add = btns.find(b => b.textContent.includes('Add Friend'));
    if (add) add.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.type('input[placeholder*="PIRATE-ZORO"]', 'PIRATE-LUFFY-9999');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_06_add_friend_modal.png' });
  console.log('6. Captured Add Friend Modal with tag input');

  // Submit adding friend
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submit = btns.find(b => b.textContent.includes('Add to Crew'));
    if (submit) submit.click();
  });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_07_custom_friend_added.png' });
  console.log('7. Captured custom friend added to list');

  // 6. View Trade Radar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const radar = btns.find(b => b.textContent.includes('Trade Radar'));
    if (radar) radar.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_08_trade_radar.png' });
  console.log('8. Captured Trade Radar with dynamic matches');

  // 7. View User's QR code modal
  const qrBtn = await page.$('button[title="My Collector QR"]');
  if (qrBtn) {
    await qrBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/kyle/.gemini/antigravity/brain/dde0fab6-5fa7-4dff-bde5-6e3258a5e318/clean_user_09_my_qr_code.png' });
    console.log('9. Captured user personalized QR code modal');
  }

  await browser.close();
  console.log('All verification steps completed!');
})().catch(err => {
  console.error('Puppeteer verification failed:', err);
  process.exit(1);
});
