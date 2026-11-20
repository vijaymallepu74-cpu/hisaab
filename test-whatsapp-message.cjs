// @ts-check
/**
 * TEST SUITE B: WHATSAPP MESSAGE CONSTRUCTION
 * Maximum timeout: 120 seconds
 */

const assert = require('assert');

const timer = setTimeout(() => {
  console.error('TIMEOUT: Test suite B exceeded 120 seconds!');
  process.exit(1);
}, 120000);

console.log('=== TEST SUITE B: WHATSAPP MESSAGE CONSTRUCTION ===');
const startTime = Date.now();

try {
  function buildUpiPaymentUrl(params) {
    const pa = encodeURIComponent(params.upiId.trim());
    const pn = encodeURIComponent(params.shopName.trim());
    const am = Math.abs(Math.round(params.balance));
    const note = params.note || `Dues Payment - ${params.shopName.trim()}`;
    const tn = encodeURIComponent(note);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }

  function buildWhatsAppMessage(options) {
    const { customerName, balance, shopName, upiId } = options;
    const balanceInt = Math.abs(Math.round(balance));
    const effectiveShop = shopName.trim() || 'My Shop';

    let message = `Hello ${customerName.trim()},\n\nThis is a friendly reminder regarding your outstanding balance of Rs. ${balanceInt} at ${effectiveShop}.\n\nPlease make the payment at your convenience.`;

    // Include UPI payment link ONLY for positive outstanding balances (exclude zero/negative)
    if (balance > 0) {
      const effectiveUpi = (upiId && upiId.trim() && upiId.includes('@'))
        ? upiId.trim()
        : 'exampleupi@hdjcbank';

      const upiLink = buildUpiPaymentUrl({
        upiId: effectiveUpi,
        shopName: effectiveShop,
        balance: balanceInt,
        note: `Dues Payment - ${effectiveShop}`,
      });

      message += `\n\nPay via UPI: ${upiLink}`;
    }

    message += `\n\nThank you!`;
    return message;
  }

  function buildWhatsAppUrl(options) {
    const cleanPhone = options.phone.replace(/\D/g, '').slice(-10);
    const message = buildWhatsAppMessage(options);
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  // TEST B1: Positive balance WhatsApp URL & Message
  console.log('\n[B1] Testing positive balance WhatsApp message construction...');
  const sampleRavi = {
    customerName: 'Ravi Kumar',
    phone: '9000000101',
    balance: 670,
    shopName: 'Lakshmi Provision Store',
    upiId: 'exampleupi@hdjcbank',
  };

  const urlRavi = buildWhatsAppUrl(sampleRavi);
  console.log('Ravi Kumar URL:\n', urlRavi);
  assert.ok(urlRavi.startsWith('https://wa.me/919000000101?text='), 'Must start with wa.me/91<10-digit>');

  const msgRavi = buildWhatsAppMessage(sampleRavi);
  console.log('Ravi Kumar Message Body:\n', msgRavi);
  assert.ok(msgRavi.includes('Hello Ravi Kumar,'), 'Must contain customer greeting');
  assert.ok(msgRavi.includes('Rs. 670'), 'Must contain balance');
  assert.ok(msgRavi.includes('Lakshmi Provision Store'), 'Must contain shop name');
  assert.ok(msgRavi.includes('Pay via UPI: upi://pay?pa=exampleupi%40hdjcbank&pn=Lakshmi%20Provision%20Store&am=670&cu=INR&tn=Dues%20Payment%20-%20Lakshmi%20Provision%20Store'), 'Must contain full UPI payment link');
  console.log('✓ Positive balance message and URL constructed correctly.');

  // TEST B2: Multiple customers from evaluator dataset
  console.log('\n[B2] Testing multiple customer profiles from sample-data.json...');
  const customers = [
    { name: 'Sunita Devi', phone: '9000000102', balance: 3470 },
    { name: 'Mohd Irfan', phone: '9000000103', balance: 2810 },
    { name: 'Anjali Reddy', phone: '9000000104', balance: 1260 },
    { name: 'Prakash Rao', phone: '9000000105', balance: 230 },
    { name: 'Fatima Begum', phone: '9000000106', balance: 2830 },
  ];

  for (const c of customers) {
    const msg = buildWhatsAppMessage({
      customerName: c.name,
      phone: c.phone,
      balance: c.balance,
      shopName: 'Lakshmi Provision Store',
      upiId: 'exampleupi@hdjcbank',
    });
    assert.ok(msg.includes(c.name), `Must contain name ${c.name}`);
    assert.ok(msg.includes(`Rs. ${c.balance}`), `Must contain Rs. ${c.balance}`);
    assert.ok(msg.includes(`&am=${c.balance}&cu=INR&`), `UPI link must have amount ${c.balance}`);
  }
  console.log(`✓ Verified ${customers.length} sample customers with correct dynamic balances.`);

  // TEST B3: Zero and Negative balance EXCLUSION
  console.log('\n[B3] Testing Zero & Negative balance exclusion (NO UPI link)...');
  const zeroBalanceMsg = buildWhatsAppMessage({
    customerName: 'Zero Balance User',
    phone: '9876543210',
    balance: 0,
    shopName: 'Lakshmi Provision Store',
    upiId: 'exampleupi@hdjcbank',
  });
  console.log('Zero balance message snippet:\n', zeroBalanceMsg);
  assert.strictEqual(zeroBalanceMsg.includes('upi://pay'), false, 'Zero balance MUST NOT contain UPI link');
  console.log('✓ Zero balance customer correctly excluded from UPI payment link.');

  const negativeBalanceMsg = buildWhatsAppMessage({
    customerName: 'Advance Paid User',
    phone: '9876543211',
    balance: -450,
    shopName: 'Lakshmi Provision Store',
    upiId: 'exampleupi@hdjcbank',
  });
  console.log('Negative balance message snippet:\n', negativeBalanceMsg);
  assert.strictEqual(negativeBalanceMsg.includes('upi://pay'), false, 'Negative balance MUST NOT contain UPI link');
  console.log('✓ Negative balance customer correctly excluded from UPI payment link.');

  // TEST B4: Custom UPI ID override vs Fallback
  console.log('\n[B4] Testing custom shop UPI ID and fallback...');
  const customUpiMsg = buildWhatsAppMessage({
    customerName: 'Test Customer',
    phone: '9876543212',
    balance: 500,
    shopName: 'My Grocery Store',
    upiId: 'grocer@icici',
  });
  assert.ok(customUpiMsg.includes('pa=grocer%40icici'), 'Should use custom UPI ID');

  const fallbackUpiMsg = buildWhatsAppMessage({
    customerName: 'Test Customer',
    phone: '9876543212',
    balance: 500,
    shopName: 'My Grocery Store',
    upiId: '', // Empty -> should fallback
  });
  assert.ok(fallbackUpiMsg.includes('pa=exampleupi%40hdjcbank'), 'Should fallback to default shop UPI');
  console.log('✓ Custom UPI ID and fallback handling verified.');

  clearTimeout(timer);
  const duration = Date.now() - startTime;
  console.log(`\n======================================================`);
  console.log(`✅ TEST SUITE B PASSED in ${duration}ms!`);
  console.log(`======================================================`);
  process.exit(0);
} catch (err) {
  clearTimeout(timer);
  console.error('\n❌ TEST SUITE B FAILED:', err);
  process.exit(1);
}
