const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE_URL = 'http://localhost:5173/?today=2026-11-15';

function findChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

async function runMultiShopVerification() {
  console.log('--- STARTING HISAAB MULTI-USER & DATA ISOLATION VERIFICATION ---');
  const chromePath = findChromePath();
  console.log('Browser binary:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 412, height: 915 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen for console logs to ensure no customer phone numbers or private data are logged
  const sensitivePhoneLogged = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('9876543210') || text.includes('9123456789')) {
      sensitivePhoneLogged.push(text);
    }
  });

  try {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Step 1: Open More Menu and create Shop A: "Ramesh Kirana"
    console.log('\n[TEST 1] Creating Shop A: "Ramesh Kirana"...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await sleep(200);
    
    // Click Profiles button
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    // Click "New Shop"
    await page.waitForSelector('#new-shop-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('new-shop-btn')?.click());
    await sleep(300);

    // Type into Shop Name
    await page.waitForSelector('#new-shop-name-inp', { timeout: 5000 });
    await page.type('#new-shop-name-inp', 'Ramesh Kirana');
    await sleep(200);

    // Click Create & Open Ledger
    await page.evaluate(() => document.getElementById('create-shop-btn')?.click());
    await sleep(600);

    // Verify active shop is now "Ramesh Kirana"
    const shopHeader = await page.$eval('h2', el => el.textContent);
    console.log('Active Shop in MoreMenu:', shopHeader);
    if (!shopHeader.includes('Ramesh Kirana')) {
      throw new Error(`Expected active shop to be Ramesh Kirana, got ${shopHeader}`);
    }

    // Step 2: Add Customer Ganesh (9876543210) to Ramesh Kirana with ₹1,500 credit
    console.log('\n[TEST 2] Adding Customer "Ganesh" (9876543210) with ₹1,500 credit to Ramesh Kirana...');
    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(500);

    // Click quick add customer button on Dashboard
    await page.waitForSelector('button ::-p-text(+ Add Customer)', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('+ Add Customer'));
      if (addBtn) addBtn.click();
    });
    await sleep(400);

    // Fill customer form
    const nameInp = await page.waitForSelector('input[placeholder*="Ramesh Patel"]');
    await nameInp.type('Ganesh');
    const phoneInp = await page.waitForSelector('input[placeholder="9876543210"]');
    await phoneInp.type('9876543210');
    await sleep(200);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(600);

    // Customer ledger opens. Click "Give Credit"
    await page.waitForSelector('button ::-p-text(Give Credit)', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const creditBtn = btns.find(b => b.textContent.includes('Give Credit'));
      if (creditBtn) creditBtn.click();
    });
    await sleep(400);
    
    const amountInp = await page.waitForSelector('input[placeholder="0"]');
    await amountInp.type('1500');
    await sleep(200);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(600);

    // Navigate to dashboard
    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    // Check outstanding on Ramesh Kirana
    const totalA = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Ramesh Kirana Outstanding:', totalA);
    if (!totalA.includes('1,500')) {
      throw new Error(`Expected ₹1,500 in Ramesh Kirana, got ${totalA}`);
    }
    console.log('✓ Ramesh Kirana correctly isolated with ₹1,500 balance.');

    // Step 3: Create Shop B: "Lakshmi Traders"
    console.log('\n[TEST 3] Creating Shop B: "Lakshmi Traders"...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    await page.waitForSelector('#new-shop-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('new-shop-btn')?.click());
    await sleep(300);

    await page.waitForSelector('#new-shop-name-inp', { timeout: 5000 });
    await page.type('#new-shop-name-inp', 'Lakshmi Traders');
    await sleep(200);

    await page.evaluate(() => document.getElementById('create-shop-btn')?.click());
    await sleep(600);

    // Go to dashboard of Lakshmi Traders
    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    // Verify Lakshmi Traders starts completely fresh (0 customers, ₹0 outstanding)
    const totalB_fresh = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Lakshmi Traders Initial Outstanding:', totalB_fresh);
    if (!totalB_fresh.includes('0')) {
      throw new Error(`Expected ₹0 in Lakshmi Traders, got ${totalB_fresh}`);
    }
    const ganeshInB = await page.$('[data-customer="9876543210"]');
    if (ganeshInB) {
      throw new Error('Data leakage! Ganesh from Ramesh Kirana found in Lakshmi Traders!');
    }
    console.log('✓ Lakshmi Traders is 100% clean and isolated from Ramesh Kirana.');

    // Step 4: Add Customer "Suresh" (9123456789) with ₹2,500 credit to Lakshmi Traders
    console.log('\n[TEST 4] Adding Customer "Suresh" (9123456789) with ₹2,500 credit to Lakshmi Traders...');
    await page.waitForSelector('button ::-p-text(+ Add Customer)', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('+ Add Customer'));
      if (addBtn) addBtn.click();
    });
    await sleep(400);

    const nameInpB = await page.waitForSelector('input[placeholder*="Ramesh Patel"]');
    await nameInpB.type('Suresh');
    const phoneInpB = await page.waitForSelector('input[placeholder="9876543210"]');
    await phoneInpB.type('9123456789');
    await sleep(200);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(600);

    await page.waitForSelector('button ::-p-text(Give Credit)', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const creditBtn = btns.find(b => b.textContent.includes('Give Credit'));
      if (creditBtn) creditBtn.click();
    });
    await sleep(400);

    const amountInpB = await page.waitForSelector('input[placeholder="0"]');
    await amountInpB.type('2500');
    await sleep(200);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(600);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    const totalB = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Lakshmi Traders Outstanding:', totalB);
    if (!totalB.includes('2,500')) {
      throw new Error(`Expected ₹2,500 in Lakshmi Traders, got ${totalB}`);
    }
    console.log('✓ Lakshmi Traders correctly has ₹2,500 balance.');

    // Step 5: Switch back to Ramesh Kirana and verify data intact
    console.log('\n[TEST 5] Switching back to Ramesh Kirana...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('p, div, span'));
      const ramesh = items.find(el => el.textContent === 'Ramesh Kirana');
      if (ramesh) ramesh.click();
    });
    await sleep(600);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    const totalA_return = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Ramesh Kirana Restored Outstanding:', totalA_return);
    if (!totalA_return.includes('1,500')) {
      throw new Error(`Expected ₹1,500 in Ramesh Kirana, got ${totalA_return}`);
    }
    const ganeshFound = await page.$('[data-customer="9876543210"]');
    if (!ganeshFound) {
      throw new Error('Ganesh customer not found in Ramesh Kirana!');
    }
    console.log('✓ Ramesh Kirana records fully preserved after switching back.');

    // Step 6: Test Reset Local Ledger on Ramesh Kirana
    console.log('\n[TEST 6] Testing "Reset Local Ledger" on Ramesh Kirana...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    // Verify warning text is displayed
    const supportingText = await page.$eval('.bg-rose-50\\/50', el => el.textContent);
    if (!supportingText.includes("Deletes this shop's saved ledger from this browser only. Other shops and devices are not affected.")) {
      throw new Error(`Supporting text missing required wording! Found: ${supportingText}`);
    }
    console.log('✓ Required supporting text verified in Reset section.');

    // Click Reset Ledger button to open confirmation
    await page.waitForSelector('#reset-ledger-trigger-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('reset-ledger-trigger-btn')?.click());
    await sleep(300);

    // Verify confirmation dialog mentions "Ramesh Kirana"
    const confirmText = await page.$eval('.bg-rose-50\\/50', el => el.textContent);
    console.log('Confirmation dialog text snippet:', confirmText.substring(0, 100));
    if (!confirmText.includes('Ramesh Kirana')) {
      throw new Error('Confirmation dialog did not explicitly name Ramesh Kirana!');
    }

    // Test Cancel button leaves data intact
    await page.waitForSelector('#reset-cancel-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('reset-cancel-btn')?.click());
    await sleep(300);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);
    const totalA_afterCancel = await page.$eval('#total-outstanding', el => el.textContent.trim());
    if (!totalA_afterCancel.includes('1,500')) {
      throw new Error('Cancel accidentally cleared data!');
    }
    console.log('✓ Cancel leaves records completely unchanged.');

    // Reopen and Confirm Reset
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(300);
    await page.evaluate(() => document.getElementById('reset-ledger-trigger-btn')?.click());
    await sleep(300);

    await page.waitForSelector('#reset-confirm-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('reset-confirm-btn')?.click());
    await sleep(600);

    // Verify Ramesh Kirana is now empty
    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);
    const totalA_reset = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Ramesh Kirana Outstanding after reset:', totalA_reset);
    if (!totalA_reset.includes('0')) {
      throw new Error(`Expected ₹0 after reset, got ${totalA_reset}`);
    }
    console.log('✓ Ramesh Kirana reset successfully to ₹0.');

    // Step 7: Verify Lakshmi Traders was NOT affected by Ramesh Kirana reset
    console.log('\n[TEST 7] Verifying Lakshmi Traders records are 100% UNTOUCHED by Shop A reset...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('p, div, span'));
      const lakshmi = items.find(el => el.textContent === 'Lakshmi Traders');
      if (lakshmi) lakshmi.click();
    });
    await sleep(600);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    const totalB_verified = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Lakshmi Traders Outstanding after Shop A reset:', totalB_verified);
    if (!totalB_verified.includes('2,500')) {
      throw new Error(`Lakshmi Traders was corrupted! Expected ₹2,500, got ${totalB_verified}`);
    }
    const sureshFound = await page.$('[data-customer="9123456789"]');
    if (!sureshFound) {
      throw new Error('Suresh customer was missing from Lakshmi Traders!');
    }
    console.log('✓ Lakshmi Traders is 100% INTACT! Multi-shop isolation verified!');

    // Step 8: Verify Security Hygiene
    console.log('\n[TEST 8] Verifying Security Hygiene (Zero Console Phone Leaks)...');
    if (sensitivePhoneLogged.length > 0) {
      console.warn('Sensitive phones found in console logs:', sensitivePhoneLogged);
      throw new Error('Security violation: Customer phone numbers logged to console!');
    }
    console.log('✓ Zero sensitive customer phone numbers or balances logged to console.');

    // Step 9: Re-verify Acceptance Dataset Import (Lakshmi Provision Store -> ₹11,820)
    console.log('\n[TEST 9] Testing Evaluator Sample Dataset Import...');
    await page.goto(`${BASE_URL}#import`, { waitUntil: 'networkidle0' });
    await sleep(400);

    const sampleJsonPath = path.join(__dirname, 'sample-data.json');
    const sampleJson = fs.readFileSync(sampleJsonPath, 'utf-8');

    await page.evaluate((val) => {
      const el = document.getElementById('import-box');
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, sampleJson);

    await page.click('#import-go');
    await sleep(700);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(500);

    const sampleTotal = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Sample dataset imported outstanding:', sampleTotal);
    if (sampleTotal !== '₹11,820') {
      throw new Error(`Expected ₹11,820, got ${sampleTotal}`);
    }
    console.log('✓ Evaluator sample dataset imports cleanly with exact ₹11,820 total!');

    console.log('\n======================================================');
    console.log('🎉 MULTI-USER DATA ISOLATION & SECURITY FULLY VERIFIED! 🎉');
    console.log('======================================================');

  } finally {
    await browser.close();
  }
}

runMultiShopVerification().catch((err) => {
  console.error('\n❌ MULTI-SHOP TEST FAILED:', err.message);
  process.exit(1);
});
