// @ts-check
/**
 * TEST SUITE C: TELUGU TRANSLATIONS
 * Maximum timeout: 120 seconds
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const assert = require('assert');

const timer = setTimeout(() => {
  console.error('TIMEOUT: Test suite C exceeded 120 seconds!');
  process.exit(1);
}, 120000);

const BASE_URL = 'http://localhost:5173/';
const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runTeluguTest() {
  console.log('=== TEST SUITE C: TELUGU TRANSLATIONS ===');
  const startTime = Date.now();

  let browser;
  try {
    // 1. In-browser UI verification
    console.log('\n[C1] Launching headless browser for Telugu UI verification...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Open More page and switch to Telugu
    console.log('[C2] Navigating to settings and activating Telugu (#lang-te-btn)...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#lang-te-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('lang-te-btn')?.click());
    await sleep(400);

    // Verify localStorage persistence
    const savedSettings = await page.evaluate(() => localStorage.getItem('hisaab_settings_v1'));
    assert.ok(savedSettings && savedSettings.includes('"language":"te"'), 'Language must persist as "te" in localStorage');
    console.log('✓ Telugu language preference persisted to storage.');

    // Navigate to Dashboard
    console.log('[C3] Checking Telugu Dashboard strings...');
    await page.evaluate(() => { window.location.hash = ''; });
    await sleep(500);

    const bodyText = await page.evaluate(() => document.body.textContent || '');
    assert.ok(bodyText.includes('మొత్తం బకాయి'), 'Dashboard must display "మొత్తం బకాయి" (Total Outstanding)');
    assert.ok(bodyText.includes('లైవ్ లెడ్జర్'), 'Dashboard must display "లైవ్ లెడ్జర్" (Live Ledger)');
    assert.ok(bodyText.includes('మొత్తం కస్టమర్లు'), 'Dashboard must display "మొత్తం కస్టమర్లు" (Total Customers)');
    console.log('✓ Telugu Dashboard headers and banners render accurately.');

    // Check Navigation
    console.log('[C4] Checking Telugu Bottom Navigation bar...');
    const navText = await page.$eval('nav, [class*="bottom-nav"], [class*="fixed bottom"]', el => el.textContent || '');
    assert.ok(navText.includes('హోమ్'), 'Navigation must include "హోమ్" (Home)');
    assert.ok(navText.includes('ఖాతాదారులు'), 'Navigation must include "ఖాతాదారులు" (Customers)');
    assert.ok(navText.includes('మరిన్ని'), 'Navigation must include "మరిన్ని" (More)');
    console.log('✓ Telugu Navigation items verified: హోమ్, ఖాతాదారులు, మరిన్ని.');

    // Check Data Preservation
    console.log('[C5] Verifying customer records and numbers are intact...');
    const totalOut = await page.$eval('#total-outstanding', el => el.textContent?.trim());
    assert.ok(totalOut && totalOut.includes('₹'), 'Currency symbol must be preserved');
    console.log(`✓ Currency and amounts remain intact: ${totalOut}`);

    // Check 375px Mobile Viewport for Telugu
    console.log('[C6] Testing 375px mobile viewport for Telugu rendering & overflow...');
    await page.setViewport({ width: 375, height: 667 });
    await sleep(300);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Mobile 375px Viewport ScrollWidth: ${scrollWidth}px (Max: 375px)`);
    assert.ok(scrollWidth <= 375, `Telugu layout must not exceed 375px (got ${scrollWidth}px)`);
    console.log('✓ Zero horizontal overflow at 375px mobile width in Telugu.');

    // Switch back to English default
    await page.evaluate(() => { window.location.hash = 'more'; });
    await sleep(300);
    await page.evaluate(() => document.getElementById('lang-en-btn')?.click());
    await sleep(300);

    clearTimeout(timer);
    const duration = Date.now() - startTime;
    console.log(`\n======================================================`);
    console.log(`✅ TEST SUITE C PASSED in ${duration}ms!`);
    console.log(`======================================================`);
    process.exit(0);
  } catch (err) {
    clearTimeout(timer);
    console.error('\n❌ TEST SUITE C FAILED:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runTeluguTest();
