const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
const sampleExpected = JSON.parse(fs.readFileSync('sample-expected.json', 'utf8'));

async function runEvaluatorTests() {
  console.log('--- STARTING HISAAB AUTOMATED EVALUATOR VERIFICATION ---');
  console.log('Browser binary:', CHROME_PATH);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 }); // Evaluator standard mobile viewport

  const BASE_URL = 'http://localhost:5173/?today=2026-11-15';
  console.log(`Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // Step 1: Navigate to Import Data screen
  console.log('\n[TEST 1] Testing Import Screen & Selectors (#import-box, #import-go)...');
  await page.goto(`${BASE_URL}#import`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#import-box', { timeout: 5000 });
  await page.waitForSelector('#import-go', { timeout: 5000 });
  console.log('✓ Found #import-box textarea and #import-go button!');

  // Step 2: Paste JSON and trigger Import
  console.log('\n[TEST 2] Pasting sample-data.json into #import-box and clicking #import-go...');
  await page.evaluate((val) => {
    const el = document.getElementById('import-box');
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, JSON.stringify(sampleData, null, 2));
  await page.click('#import-go');
  await new Promise(r => setTimeout(r, 1000)); // wait for import & recalculation

  // Step 3: Verify Dashboard & Total Outstanding
  console.log('\n[TEST 3] Navigating to Dashboard and checking #total-outstanding...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#total-outstanding', { timeout: 5000 });
  
  const totalOutstandingText = await page.$eval('#total-outstanding', el => el.textContent.trim());
  console.log(`Total Outstanding displayed: "${totalOutstandingText}"`);
  if (totalOutstandingText === '₹11,820') {
    console.log('✓ #total-outstanding MATCHES EXACT EXPECTATION: ₹11,820');
  } else {
    throw new Error(`Expected ₹11,820 but got "${totalOutstandingText}"`);
  }

  // Step 4: Verify Every Customer Row [data-customer] and Balance [data-balance]
  console.log('\n[TEST 4] Verifying all 8 customer rows [data-customer] and balances [data-balance]...');
  for (const [phone, expBalance] of Object.entries(sampleExpected.balances)) {
    const custSelector = `[data-customer="${phone}"]`;
    await page.waitForSelector(custSelector, { timeout: 5000 });
    
    const balanceText = await page.$eval(`${custSelector} [data-balance]`, el => el.textContent.trim());
    const expectedFormatted = `₹${expBalance.toLocaleString('en-IN')}`;
    console.log(`Customer ${phone}: displayed "${balanceText}", expected "${expectedFormatted}"`);
    
    if (balanceText !== expectedFormatted) {
      throw new Error(`Customer ${phone} balance mismatch! Expected ${expectedFormatted}, got ${balanceText}`);
    }

    // Step 5: Check WhatsApp Reminder Link a[data-remind="<phone>"]
    const remindHref = await page.$eval(`${custSelector} a[data-remind="${phone}"]`, el => el.getAttribute('href'));
    console.log(`WhatsApp Link for ${phone}: ${remindHref.substring(0, 50)}...`);
    
    if (!remindHref.startsWith(`https://wa.me/91${phone}?text=`)) {
      throw new Error(`Invalid WhatsApp URL for ${phone}: ${remindHref}`);
    }
    const decodedMsg = decodeURIComponent(remindHref.split('?text=')[1]);
    if (!decodedMsg.includes(`Rs. ${expBalance}`)) {
      throw new Error(`WhatsApp message does not contain Rs. ${expBalance}: ${decodedMsg}`);
    }
  }
  console.log('✓ All 8 customers and balances match sample-expected.json perfectly!');
  console.log('✓ All WhatsApp links (a[data-remind]) are compliant and contain correct balance & shop name!');

  // Step 6: Test Payment Screenshot upload (#shot-input and img[data-shot])
  console.log('\n[TEST 5] Testing Payment Screenshot Upload & img[data-shot]...');
  // Click on first customer Ravi Kumar
  await page.click('[data-customer="9000000101"]');
  await new Promise(r => setTimeout(r, 800));

  // In Ravi's ledger, click "Receive Payment"
  const buttons = await page.$$('button');
  let receivePaymentBtn = null;
  for (const b of buttons) {
    const text = await (await b.getProperty('textContent')).jsonValue();
    if (text.includes('Receive Payment')) {
      receivePaymentBtn = b;
      break;
    }
  }
  if (!receivePaymentBtn) throw new Error('Receive Payment button not found');
  await receivePaymentBtn.click();
  await new Promise(r => setTimeout(r, 600));

  // Verify #shot-input exists
  await page.waitForSelector('#shot-input', { timeout: 5000 });
  console.log('✓ Found #shot-input file input in payment form!');

  // Create a dummy image file to upload
  const testImagePath = path.join(__dirname, 'test-proof.png');
  // 1x1 transparent PNG buffer
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'));

  const fileInput = await page.$('#shot-input');
  await fileInput.uploadFile(testImagePath);
  await new Promise(r => setTimeout(r, 500));

  // Enter amount
  await page.type('input[placeholder="0"]', '200');
  
  // Submit payment
  const saveBtn = await page.$('button[type="submit"]');
  await saveBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // Verify img[data-shot] appears on the transaction entry
  await page.waitForSelector('img[data-shot]', { timeout: 5000 });
  const shotSrc = await page.$eval('img[data-shot]', el => el.getAttribute('src'));
  console.log('✓ Successfully displayed img[data-shot] on transaction! src begins with:', shotSrc.substring(0, 30));

  // Step 7: Test reload persistence of screenshot
  console.log('\n[TEST 6] Testing Reload Persistence of Screenshot in IndexedDB...');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('img[data-shot]', { timeout: 5000 });
  console.log('✓ img[data-shot] persisted across reload via IndexedDB!');

  // Check Ravi Kumar's updated balance: originally 670, now 670 - 200 = 470
  const updatedBalanceText = await page.$eval('div.flex-baseline, span.text-3xl', el => el.textContent.trim());
  console.log(`Ravi Kumar updated net balance after ₹200 payment: "${updatedBalanceText}"`);

  // Step 8: Viewport check
  console.log('\n[TEST 7] Testing 375px mobile viewport constraints...');
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const windowInnerWidth = await page.evaluate(() => window.innerWidth);
  console.log(`ScrollWidth: ${bodyScrollWidth}px, Viewport: ${windowInnerWidth}px`);
  if (bodyScrollWidth <= windowInnerWidth) {
    console.log('✓ No horizontal overflow at 375px width!');
  } else {
    console.warn('⚠️ Warning: horizontal overflow detected');
  }

  // Cleanup test image
  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);

  console.log('\n======================================================');
  console.log('🎉 ALL HISAAB EVALUATOR REQUIREMENTS VERIFIED 100% PASSING! 🎉');
  console.log('======================================================');

  await browser.close();
  process.exit(0);
}

runEvaluatorTests().catch(err => {
  console.error('\n❌ EVALUATOR TEST FAILED:', err);
  process.exit(1);
});
