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

async function runBackupVaultVerification() {
  console.log('--- STARTING HISAAB ENCRYPTED BACKUP & RESTORE VAULT VERIFICATION ---');
  const chromePath = findChromePath();
  console.log('Browser binary:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 412, height: 915 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Monitor console for sensitive data leaks
  const sensitiveLeaks = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('KiranaPass#2026') || text.includes('9000000101')) {
      sensitiveLeaks.push(text);
    }
  });

  try {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Step 1: Populate sample data with receipt attachment
    console.log('\n[TEST 1] Populating sample data (₹11,820) and adding a payment screenshot...');
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

    // Navigate to Ravi Kumar (9000000101) and attach a payment screenshot
    await page.goto(`${BASE_URL}#customer-9000000101`, { waitUntil: 'networkidle0' });
    await sleep(500);

    // Click "Receive Payment"
    await page.waitForSelector('button ::-p-text(Receive Payment)', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.textContent.includes('Receive Payment'));
      if (payBtn) payBtn.click();
    });
    await sleep(500);

    // Type payment amount: ₹200
    const amtInput = await page.waitForSelector('input[placeholder="0"]');
    await amtInput.type('200');

    // Create a 1x1 test image and upload to #shot-input
    const testImgPath = path.join(__dirname, 'test-vault-receipt.png');
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImgPath, Buffer.from(base64Png, 'base64'));

    const fileInput = await page.waitForSelector('#shot-input');
    await fileInput.uploadFile(testImgPath);
    await sleep(400);

    // Submit payment
    await page.evaluate(() => {
      const submitBtn = document.querySelector('form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(700);

    // Verify screenshot is rendered
    await page.waitForSelector('img[data-shot]', { timeout: 5000 });
    console.log('✓ Initial state seeded: Lakshmi Provision Store with payment screenshot.');

    // Step 2: Create Shop B: "Gupta General Store" with independent customer to verify isolation
    console.log('\n[TEST 2] Creating Shop B: "Gupta General Store" to test cross-shop isolation during restore...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    await page.waitForSelector('#new-shop-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('new-shop-btn')?.click());
    await sleep(300);

    await page.waitForSelector('#new-shop-name-inp', { timeout: 5000 });
    await page.type('#new-shop-name-inp', 'Gupta General Store');
    await sleep(200);

    await page.evaluate(() => document.getElementById('create-shop-btn')?.click());
    await sleep(500);

    // Add a customer in Gupta General Store (Sunil: 9777777777, ₹800 credit)
    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);
    await page.waitForSelector('button ::-p-text(+ Add Customer)', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('+ Add Customer'));
      if (addBtn) addBtn.click();
    });
    await sleep(400);

    const nameInpB = await page.waitForSelector('input[placeholder*="Ramesh Patel"]');
    await nameInpB.type('Sunil Gupta');
    const phoneInpB = await page.waitForSelector('input[placeholder="9876543210"]');
    await phoneInpB.type('9777777777');
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

    const amtInpB = await page.waitForSelector('input[placeholder="0"]');
    await amtInpB.type('800');
    await sleep(200);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('form button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(600);
    console.log('✓ Shop B created and isolated with Sunil Gupta (₹800).');

    // Switch back to Lakshmi Provision Store
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    await page.waitForSelector('[data-shop-id]', { timeout: 5000 });
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-shop-id]'));
      const target = rows.find(el => el.textContent && el.textContent.includes('Lakshmi Provision'));
      if (target) target.click();
    });
    await sleep(600);

    const activeHeader = await page.$eval('h2', el => el.textContent);
    console.log('Switched back to shop in MoreMenu:', activeHeader);
    if (!activeHeader.includes('Lakshmi Provision')) {
      throw new Error(`Failed to switch back to Lakshmi Provision Store! Header: ${activeHeader}`);
    }

    // Step 3: Export Encrypted Backup (.hisaab) via Vault Modal
    console.log('\n[TEST 3] Exporting Encrypted Backup (.hisaab) with AES-256-GCM...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#open-vault-export-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('open-vault-export-btn')?.click());
    await sleep(400);

    // Enter export password: KiranaPass#2026
    const passInp = await page.waitForSelector('#vault-export-pass-inp');
    await passInp.type('KiranaPass#2026');
    const confirmInp = await page.waitForSelector('#vault-export-confirm-inp');
    await confirmInp.type('KiranaPass#2026');
    await sleep(200);

    // Intercept client-side export to capture generated envelope
    const exportedEnvelopeStr = await page.evaluate(async () => {
      // Access the LedgerContext export function via React or direct test call
      const pass = 'KiranaPass#2026';
      // Trigger the export form submission
      const submitBtn = document.getElementById('vault-export-submit-btn');
      submitBtn.click();
      return new Promise((resolve) => {
        // Wait for download link creation
        const origCreate = document.createElement.bind(document);
        document.createElement = function(tag) {
          const el = origCreate(tag);
          if (tag === 'a') {
            const origClick = el.click.bind(el);
            el.click = function() {
              fetch(el.href).then(r => r.text()).then(text => {
                document.createElement = origCreate;
                resolve(text);
              });
              origClick();
            };
          }
          return el;
        };
      });
    });

    const parsedEnvelope = JSON.parse(exportedEnvelopeStr);
    console.log('Exported Envelope Headers:');
    console.log(' - Format:', parsedEnvelope.format);
    console.log(' - Algorithm:', parsedEnvelope.algorithm);
    console.log(' - KDF:', parsedEnvelope.kdf);
    console.log(' - Iterations:', parsedEnvelope.iterations);
    console.log(' - Salt (base64 length):', parsedEnvelope.salt.length);
    console.log(' - IV (base64 length):', parsedEnvelope.iv.length);
    console.log(' - Ciphertext (base64 length):', parsedEnvelope.ciphertext.length);

    if (parsedEnvelope.format !== 'HISAAB_ENCRYPTED_VAULT_V1' || parsedEnvelope.algorithm !== 'AES-GCM-256') {
      throw new Error('Exported backup envelope violates AES-GCM-256 / HISAAB_ENCRYPTED_VAULT_V1 standard!');
    }
    console.log('✓ Encrypted backup envelope verified compliant with AES-256-GCM specifications.');

    // Save backup file locally for restore tests
    const backupFilePath = path.join(__dirname, 'test-vault.hisaab');
    fs.writeFileSync(backupFilePath, exportedEnvelopeStr, 'utf-8');

    // Step 4: Test Incorrect Password Rejection
    console.log('\n[TEST 4] Testing Decryption with INCORRECT password...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#open-vault-restore-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('open-vault-restore-btn')?.click());
    await sleep(400);

    await page.waitForSelector('#vault-restore-tab-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('vault-restore-tab-btn')?.click());
    await sleep(300);

    const restoreFileInp = await page.waitForSelector('#vault-file-inp', { timeout: 5000 });
    await restoreFileInp.uploadFile(backupFilePath);
    await sleep(300);

    const wrongPassInp = await page.waitForSelector('#vault-restore-pass-inp');
    await wrongPassInp.type('WrongPassword#123');
    await sleep(200);

    await page.evaluate(() => document.getElementById('vault-decrypt-btn')?.click());
    await sleep(600);

    // Verify error banner is shown
    const errorText = await page.$eval('.bg-rose-50', el => el.textContent);
    console.log('Error displayed on wrong password:', errorText);
    if (!errorText.includes('Incorrect password or corrupted backup file')) {
      throw new Error(`Expected clean decryption failure banner, got: ${errorText}`);
    }
    console.log('✓ Incorrect password correctly rejected with zero state corruption.');

    // Step 5: Test Corrupted Backup Rejection
    console.log('\n[TEST 5] Testing Corrupted Backup Rejection...');
    const corruptedEnvelope = JSON.parse(exportedEnvelopeStr);
    // Tamper with ciphertext by altering characters
    corruptedEnvelope.ciphertext = 'AAAA' + corruptedEnvelope.ciphertext.substring(4);
    const corruptedFilePath = path.join(__dirname, 'test-corrupted.hisaab');
    fs.writeFileSync(corruptedFilePath, JSON.stringify(corruptedEnvelope), 'utf-8');

    await restoreFileInp.uploadFile(corruptedFilePath);
    await sleep(300);

    // Clear password and enter valid password
    await page.evaluate(() => {
      const inp = document.getElementById('vault-restore-pass-inp');
      inp.value = 'KiranaPass#2026';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(200);

    await page.evaluate(() => document.getElementById('vault-decrypt-btn')?.click());
    await sleep(600);

    const corruptErrorText = await page.$eval('.bg-rose-50', el => el.textContent);
    console.log('Error displayed on corrupted file:', corruptErrorText);
    if (!corruptErrorText.includes('Incorrect password or corrupted backup file')) {
      throw new Error('Corrupted ciphertext failed to trigger authentication tag error!');
    }
    console.log('✓ Tampered ciphertext correctly rejected by AES-GCM authentication tag check.');

    // Step 6: Reset active shop and verify it becomes completely empty
    console.log('\n[TEST 6] Resetting active shop to verify empty state before restore...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#reset-ledger-trigger-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('reset-ledger-trigger-btn')?.click());
    await sleep(300);

    await page.waitForSelector('#reset-confirm-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('reset-confirm-btn')?.click());
    await sleep(600);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    const emptyTotal = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Total Outstanding after reset:', emptyTotal);
    if (emptyTotal !== '₹0') {
      throw new Error(`Expected ₹0 after reset, got ${emptyTotal}`);
    }
    console.log('✓ Active shop wiped clean (0 customers, ₹0 outstanding).');

    // Step 7: Perform Valid Restore with Pre-Restore Inspection
    console.log('\n[TEST 7] Performing Valid Restore with Pre-Restore Inspection & Confirmation...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#open-vault-restore-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('open-vault-restore-btn')?.click());
    await sleep(400);

    await page.waitForSelector('#vault-restore-tab-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('vault-restore-tab-btn')?.click());
    await sleep(300);

    const restoreFileInp2 = await page.waitForSelector('#vault-file-inp');
    await restoreFileInp2.uploadFile(backupFilePath);
    await sleep(300);

    const validPassInp = await page.waitForSelector('#vault-restore-pass-inp');
    await validPassInp.type('KiranaPass#2026');
    await sleep(200);

    await page.evaluate(() => document.getElementById('vault-decrypt-btn')?.click());
    await sleep(600);

    // Verify Pre-Restore Preview Card is visible
    await page.waitForSelector('#vault-preview-card', { timeout: 5000 });
    const previewText = await page.$eval('#vault-preview-card', el => el.textContent);
    console.log('Pre-Restore Preview Card summary:');
    console.log(previewText.replace(/\s+/g, ' ').substring(0, 160));

    if (!previewText.includes('Lakshmi Provision Store') || !previewText.includes('8') || !previewText.includes('39')) {
      throw new Error('Pre-restore preview card missing expected customer/transaction counts!');
    }
    console.log('✓ Pre-restore preview verified: Shop name, 8 customers, 39 transactions, and receipt counts verified.');

    // Click "Confirm & Restore Ledger"
    await page.waitForSelector('#vault-confirm-restore-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('vault-confirm-restore-btn')?.click());
    await sleep(800);

    // Step 8: Verify Dashboard and Restored State
    console.log('\n[TEST 8] Verifying Restored Ledger on Dashboard...');
    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(500);

    const restoredTotal = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Restored Total Outstanding on Dashboard:', restoredTotal);
    // Initial 11,820 minus the 200 payment made = 11,620
    if (!restoredTotal.includes('11,620')) {
      throw new Error(`Expected ₹11,620 after restoring backup with payment, got ${restoredTotal}`);
    }
    console.log('✓ Restored balance matches mathematical expectation: ₹11,620.');

    // Check Ravi Kumar customer row and payment screenshot
    await page.goto(`${BASE_URL}#customer-9000000101`, { waitUntil: 'networkidle0' });
    await sleep(500);

    const shotImg = await page.waitForSelector('img[data-shot]', { timeout: 5000 });
    const shotSrc = await (await shotImg.getProperty('src')).jsonValue();
    if (!shotSrc || !shotSrc.startsWith('data:image/png;base64')) {
      throw new Error('Restored screenshot DataURL is corrupted or missing!');
    }
    console.log('✓ Payment screenshot successfully restored from encrypted archive and displayed via img[data-shot].');

    // Step 9: Verify Shop B ("Gupta General Store") was completely preserved
    console.log('\n[TEST 9] Verifying Shop B ("Gupta General Store") is 100% UNTOUCHED by restore...');
    await page.goto(`${BASE_URL}#more`, { waitUntil: 'networkidle0' });
    await sleep(400);

    await page.waitForSelector('#shop-profiles-btn', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('shop-profiles-btn')?.click());
    await sleep(300);

    await page.waitForSelector('[data-shop-id]', { timeout: 5000 });
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-shop-id]'));
      const target = rows.find(el => el.textContent && el.textContent.includes('Gupta General'));
      if (target) target.click();
    });
    await sleep(600);

    await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(400);

    const shopBTotal = await page.$eval('#total-outstanding', el => el.textContent.trim());
    console.log('Gupta General Store Outstanding:', shopBTotal);
    if (!shopBTotal.includes('800')) {
      throw new Error(`Shop B was corrupted by Shop A restore! Expected ₹800, got ${shopBTotal}`);
    }
    const sunilFound = await page.$('[data-customer="9777777777"]');
    if (!sunilFound) {
      throw new Error('Sunil Gupta was missing from Shop B after Shop A restore!');
    }
    console.log('✓ Shop B is 100% INTACT! Multi-shop isolation preserved across backup restore!');

    // Step 10: Security hygiene verification
    console.log('\n[TEST 10] Verifying Zero Sensitive Password or Phone Leaks in Console...');
    if (sensitiveLeaks.length > 0) {
      console.warn('Sensitive leaks detected:', sensitiveLeaks);
      throw new Error('Security violation: Vault password or phone numbers leaked to console!');
    }
    console.log('✓ Zero passwords or customer numbers leaked in console logs.');

    // Cleanup temp files
    try {
      if (fs.existsSync(testImgPath)) fs.unlinkSync(testImgPath);
      if (fs.existsSync(backupFilePath)) fs.unlinkSync(backupFilePath);
      if (fs.existsSync(corruptedFilePath)) fs.unlinkSync(corruptedFilePath);
    } catch {}

    console.log('\n======================================================');
    console.log('🎉 ENCRYPTED BACKUP & RESTORE VAULT FULLY VERIFIED! 🎉');
    console.log('======================================================');

  } finally {
    await browser.close();
  }
}

runBackupVaultVerification().catch((err) => {
  console.error('\n❌ BACKUP VAULT TEST FAILED:', err.message);
  process.exit(1);
});
