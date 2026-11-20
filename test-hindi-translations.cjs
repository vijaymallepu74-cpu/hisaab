// @ts-check
/**
 * TEST SUITE D: HINDI TRANSLATIONS
 * Maximum timeout: 120 seconds
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const assert = require('assert');

const timer = setTimeout(() => {
  console.error('TIMEOUT: Test suite D exceeded 120 seconds!');
  process.exit(1);
}, 120000);

const BASE_URL = 'http://localhost:5173/';
const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runHindiTest() {
  console.log('=== TEST SUITE D: HINDI TRANSLATIONS ===');
  const startTime = Date.now();

  let browser;
  try {
    console.log('\n[D1] Launching headless browser for Hindi UI verification...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Open More page and switch to Hindi
    console.log('[D2] Navigating to settings and activating Hindi (#lang-hi-btn)...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#lang-hi-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('lang-hi-btn')?.click());
    await sleep(400);

    // Verify localStorage persistence
    const savedSettings = await page.evaluate(() => localStorage.getItem('hisaab_settings_v1'));
    assert.ok(savedSettings && savedSettings.includes('"language":"hi"'), 'Language must persist as "hi" in localStorage');
    console.log('✓ Hindi language preference persisted to storage.');

    // Navigate to Dashboard
    console.log('[D3] Checking Hindi Dashboard strings...');
    await page.evaluate(() => { window.location.hash = ''; });
    await sleep(500);

    const bodyText = await page.evaluate(() => document.body.textContent || '');
    assert.ok(bodyText.includes('कुल बकाया'), 'Dashboard must display "कुल बकाया" (Total Outstanding)');
    assert.ok(bodyText.includes('लाइव बहीखाता'), 'Dashboard must display "लाइव बहीखाता" (Live Ledger)');
    assert.ok(bodyText.includes('कुल ग्राहक'), 'Dashboard must display "कुल ग्राहक" (Total Customers)');
    console.log('✓ Hindi Dashboard headers and banners render accurately.');

    // Check Navigation
    console.log('[D4] Checking Hindi Bottom Navigation bar...');
    const navText = await page.$eval('nav, [class*="bottom-nav"], [class*="fixed bottom"]', el => el.textContent || '');
    assert.ok(navText.includes('होम'), 'Navigation must include "होम" (Home)');
    assert.ok(navText.includes('ग्राहक'), 'Navigation must include "ग्राहक" (Customers)');
    assert.ok(navText.includes('अधिक'), 'Navigation must include "अधिक" (More)');
    console.log('✓ Hindi Navigation items verified: होम, ग्राहक, अधिक.');

    // Check Data Preservation
    console.log('[D5] Verifying customer records and numbers are intact in Hindi...');
    const totalOut = await page.$eval('#total-outstanding', el => el.textContent?.trim());
    assert.ok(totalOut && totalOut.includes('₹'), 'Currency symbol must be preserved');
    console.log(`✓ Currency and amounts remain intact: ${totalOut}`);

    // Check 375px Mobile Viewport for Hindi
    console.log('[D6] Testing 375px mobile viewport for Hindi rendering & overflow...');
    await page.setViewport({ width: 375, height: 667 });
    await sleep(300);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Mobile 375px Viewport ScrollWidth: ${scrollWidth}px (Max: 375px)`);
    assert.ok(scrollWidth <= 375, `Hindi layout must not exceed 375px (got ${scrollWidth}px)`);
    console.log('✓ Zero horizontal overflow at 375px mobile width in Hindi.');

    // Switch back to English default
    await page.evaluate(() => { window.location.hash = 'more'; });
    await sleep(300);
    await page.evaluate(() => document.getElementById('lang-en-btn')?.click());
    await sleep(300);

    clearTimeout(timer);
    const duration = Date.now() - startTime;
    console.log(`\n======================================================`);
    console.log(`✅ TEST SUITE D PASSED in ${duration}ms!`);
    console.log(`======================================================`);
    process.exit(0);
  } catch (err) {
    clearTimeout(timer);
    console.error('\n❌ TEST SUITE D FAILED:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runHindiTest();
