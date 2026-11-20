// Synthetic Scalability Benchmark for HISAAB (10,000 customers, 100,000 transactions)
const startTime = Date.now();

console.log('Generating 10,000 synthetic customers and 100,000 transactions...');

const customers = [];
for (let i = 1; i <= 10000; i++) {
  const phone = String(9000000000 + i);
  customers.push({
    id: `cust_${phone}`,
    name: `Customer ${i}`,
    phone: phone,
    createdAt: '2026-01-01'
  });
}

const transactions = [];
const types = ['credit', 'payment'];
for (let j = 1; j <= 100000; j++) {
  const custIndex = (j % 10000) + 1;
  const phone = String(9000000000 + custIndex);
  const type = types[j % 2];
  const amount = (j % 500) + 50;
  transactions.push({
    id: `tx_${j}`,
    phone: phone,
    type: type,
    amount: amount,
    date: '2026-10-15',
    note: 'Daily grocery'
  });
}

console.log(`Generated in ${Date.now() - startTime}ms. Beginning calculation benchmark...`);

const calcStart = Date.now();

// 1. Single-pass O(T) transaction grouping
const txByPhone = new Map();
for (let i = 0; i < transactions.length; i++) {
  const t = transactions[i];
  let list = txByPhone.get(t.phone);
  if (!list) {
    list = [];
    txByPhone.set(t.phone, list);
  }
  list.push(t);
}

// 2. Single-pass O(C) customer calculation
let totalOutstanding = 0;
let totalCredit = 0;
let totalPayment = 0;
let customersWithBalance = 0;
const summaries = new Array(customers.length);
const summariesMap = new Map();

for (let c = 0; c < customers.length; c++) {
  const cust = customers[c];
  const custTxs = txByPhone.get(cust.phone) || [];

  let cCredit = 0;
  let cPayment = 0;
  for (let t = 0; t < custTxs.length; t++) {
    const tx = custTxs[t];
    if (tx.type === 'credit') cCredit += tx.amount;
    else cPayment += tx.amount;
  }

  const balance = cCredit - cPayment;
  totalCredit += cCredit;
  totalPayment += cPayment;
  totalOutstanding += balance;
  if (balance > 0) customersWithBalance++;

  const summary = {
    ...cust,
    balance,
    totalCredit,
    totalPayment,
    transactions: custTxs
  };
  summaries[c] = summary;
  summariesMap.set(cust.phone, summary);
}

const calcDuration = Date.now() - calcStart;

console.log('--- BENCHMARK RESULTS ---');
console.log(`Calculated 10,000 customers & 100,000 transactions in: ${calcDuration}ms!`);
console.log(`Total Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}`);
console.log(`Customers with balance: ${customersWithBalance}`);
console.log(`O(1) Map Lookup Test: Customer 9000005000 -> balance ₹${summariesMap.get('9000005000').balance}`);

if (calcDuration < 200) {
  console.log('✓ Scalability Benchmark Passed (< 200ms for 100,000 records)!');
} else {
  console.warn('⚠️ Warning: calculation took longer than expected.');
}
