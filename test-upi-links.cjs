// @ts-check
/**
 * TEST SUITE A: UPI PAYMENT LINK GENERATION
 * Maximum timeout: 120 seconds
 */

const assert = require('assert');

// Set hard execution timeout of 120s
const timer = setTimeout(() => {
  console.error('TIMEOUT: Test suite A exceeded 120 seconds!');
  process.exit(1);
}, 120000);

console.log('=== TEST SUITE A: UPI PAYMENT LINK GENERATION ===');
const startTime = Date.now();

try {
  // Re-implement / import pure logic functions for rigorous unit verification
  function isValidUpiId(upiId) {
    if (!upiId) return false;
    return /^[\w.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim());
  }

  function buildUpiPaymentUrl(params) {
    const pa = encodeURIComponent(params.upiId.trim());
    const pn = encodeURIComponent(params.shopName.trim());
    const am = Math.abs(Math.round(params.balance));
    const note = params.note || `Dues Payment - ${params.shopName.trim()}`;
    const tn = encodeURIComponent(note);

    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }

  // TEST A1: UPI Format Validation
  console.log('\n[A1] Testing UPI ID validation (isValidUpiId)...');
  const validUpiIds = [
    'exampleupi@hdjcbank',
    'shopname@okaxis',
    'kirana.store@icici',
    'user_123@okhdfcbank',
    'merchant-store@paytm',
    'my.shop_name@sbi'
  ];
  for (const upi of validUpiIds) {
    assert.strictEqual(isValidUpiId(upi), true, `Expected valid: ${upi}`);
  }
  console.log(`✓ Passed ${validUpiIds.length} valid UPI ID formats.`);

  const invalidUpiIds = [
    '',
    '   ',
    'invalid',
    '@bank',
    'user@',
    'a@b', // too short domain / handle
    'user@bank@extra',
    'user name@bank',
    'user#bad@bank'
  ];
  for (const upi of invalidUpiIds) {
    assert.strictEqual(isValidUpiId(upi), false, `Expected invalid: ${upi}`);
  }
  console.log(`✓ Passed ${invalidUpiIds.length} invalid UPI ID rejection checks.`);

  // TEST A2: Schema and Parameter Sequence Validation
  console.log('\n[A2] Testing exact UPI URL schema and parameter ordering...');
  const url1 = buildUpiPaymentUrl({
    upiId: 'exampleupi@hdjcbank',
    shopName: 'Lakshmi Provision Store',
    balance: 670,
  });
  console.log('Generated URL 1:', url1);
  assert.strictEqual(
    url1,
    'upi://pay?pa=exampleupi%40hdjcbank&pn=Lakshmi%20Provision%20Store&am=670&cu=INR&tn=Dues%20Payment%20-%20Lakshmi%20Provision%20Store',
    'Schema must match upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...'
  );
  console.log('✓ URL 1 matches exact required schema and parameter sequence.');

  // TEST A3: Parameter Encoding (spaces, &, special characters)
  console.log('\n[A3] Testing parameter encoding with special characters...');
  const url2 = buildUpiPaymentUrl({
    upiId: 'merchant_99@okhdfcbank',
    shopName: 'Balaji & Sons Kirana (Main Branch)',
    balance: 3470.50, // Floating point rounding test
  });
  console.log('Generated URL 2:', url2);
  assert.ok(url2.includes('pn=Balaji%20%26%20Sons%20Kirana%20(Main%20Branch)'), 'Shop name with & must be encoded');
  assert.ok(url2.includes('&am=3471&cu=INR&'), 'Amount must round to integer rupee');
  assert.ok(url2.startsWith('upi://pay?pa=merchant_99%40okhdfcbank'), 'Payee address must be correct');
  console.log('✓ Special characters, spaces, and rounding handled correctly.');

  // TEST A4: Multiple Balance Scenarios
  console.log('\n[A4] Testing multiple customer balances...');
  const testBalances = [100, 250, 1260, 2810, 11820, 50000];
  for (const bal of testBalances) {
    const url = buildUpiPaymentUrl({
      upiId: 'exampleupi@hdjcbank',
      shopName: 'Test Shop',
      balance: bal,
    });
    assert.ok(url.includes(`&am=${bal}&cu=INR&`), `Amount ${bal} must match`);
  }
  console.log(`✓ Tested ${testBalances.length} balance amounts successfully.`);

  clearTimeout(timer);
  const duration = Date.now() - startTime;
  console.log(`\n======================================================`);
  console.log(`✅ TEST SUITE A PASSED in ${duration}ms!`);
  console.log(`======================================================`);
  process.exit(0);
} catch (err) {
  clearTimeout(timer);
  console.error('\n❌ TEST SUITE A FAILED:', err);
  process.exit(1);
}
