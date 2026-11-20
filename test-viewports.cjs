// @ts-check
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const assert = require('assert');

const BASE_URL = 'http://localhost:5173/';
const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runViewportMatrix() {
  console.log('=== MULTI-VIEWPORT & MULTI-LANGUAGE RESPONSIVENESS MATRIX ===');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Populate data
  await page.goto(`${BASE_URL}#import`, { waitUntil: 'networkidle0' });
  await sleep(400);
  const sampleData = await page.evaluate(async () => {
    const resp = await fetch('/sample-data.json');
    return await resp.text();
  });
  await page.evaluate((data) => {
    const el = document.getElementById('import-box');
    if (el) {
      el.value = data;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, sampleData);
  await page.click('#import-go');
  await sleep(600);

  const viewports = [
    { name: 'iPhone SE (375px)', width: 375, height: 667 },
    { name: 'iPhone 14 / 15 (390px)', width: 390, height: 844 },
    { name: 'iPhone 14/15 Pro Max (430px)', width: 430, height: 932 },
    { name: 'Desktop (1280px)', width: 1280, height: 800 }
  ];

  const languages = [
    { code: 'en', btnId: 'lang-en-btn', name: 'English' },
    { code: 'te', btnId: 'lang-te-btn', name: 'Telugu' },
    { code: 'hi', btnId: 'lang-hi-btn', name: 'Hindi' }
  ];

  const routes = ['', 'customers', 'overdue', 'more', 'customer-9000000101'];

  for (const lang of languages) {
    console.log(`\n--- Testing Language: ${lang.name} (${lang.code}) ---`);
    await page.evaluate(() => { window.location.hash = 'more'; });
    await sleep(300);
    await page.waitForSelector(`#${lang.btnId}`, { timeout: 5000 });
    await page.evaluate((id) => document.getElementById(id)?.click(), lang.btnId);
    await sleep(300);

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await sleep(200);

      for (const route of routes) {
        await page.evaluate((r) => { window.location.hash = r; }, route);
        await sleep(200);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const routeLabel = route || 'dashboard';

        if (scrollWidth > vp.width) {
          throw new Error(`OVERFLOW DETECTED: [${lang.name} - ${vp.name} - Route: ${routeLabel}] scrollWidth=${scrollWidth}px > viewport=${vp.width}px`);
        }
      }
      console.log(`  ✓ ${vp.name}: All 5 screens zero overflow (scrollWidth <= ${vp.width}px)`);
    }
  }

  // Restore English
  await page.evaluate(() => { window.location.hash = 'more'; });
  await sleep(300);
  await page.evaluate(() => document.getElementById('lang-en-btn')?.click());
  await sleep(300);

  console.log('\n======================================================');
  console.log('🎉 ALL VIEWPORTS (375px, 390px, 430px, 1280px) & ALL LANGUAGES (EN, TE, HI) VERIFIED 100% CLEAN! 🎉');
  console.log('======================================================');

  await browser.close();
}

runViewportMatrix().catch(err => {
  console.error(err);
  process.exit(1);
});
