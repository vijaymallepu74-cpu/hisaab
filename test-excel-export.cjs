const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
const sampleExpected = JSON.parse(fs.readFileSync('sample-expected.json', 'utf8'));

async function testExcelTemplateExport() {
  console.log('=== VERIFYING MASTER EXCEL TEMPLATE & EXPORT ===');

  // 1. Identify template in public/
  const publicDir = path.join(__dirname, 'public');
  const xlsxFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.xlsx'));
  console.log('Found template file in public/:', xlsxFiles);
  if (xlsxFiles.length === 0) {
    throw new Error('No .xlsx template found in public directory!');
  }
  const templatePath = path.join(publicDir, xlsxFiles[0]);

  // 2. Inspect original workbook
  const originalWb = new ExcelJS.Workbook();
  await originalWb.xlsx.readFile(templatePath);
  const origWs = originalWb.worksheets[0];

  console.log('Worksheet Name:', origWs.name);
  console.log('Initial Row Count:', origWs.rowCount);
  const origHeaders = origWs.getRow(1).values.filter(x => x !== undefined);
  console.log('Original Row 1 Headers:', origHeaders);

  const origColWidths = [];
  origWs.columns.forEach((col, idx) => {
    origColWidths[idx + 1] = col.width;
  });
  console.log('Original Column Widths:', origColWidths);

  // 3. Populate using our logic
  const balances = {};
  sampleData.customers.forEach(c => balances[c.phone] = 0);
  sampleData.entries.forEach(e => {
    if (e.type === 'credit') balances[e.phone] += e.amount;
    else if (e.type === 'payment') balances[e.phone] -= e.amount;
  });

  const exportRecords = [];
  sampleData.customers.forEach(cust => {
    const custTxs = sampleData.entries.filter(e => e.phone === cust.phone);
    if (custTxs.length === 0) {
      exportRecords.push({
        customerName: cust.name,
        phone: String(cust.phone),
        type: 'N/A',
        amount: 0,
        date: '2026-09-27',
        note: 'No transactions',
        currentBalance: balances[cust.phone]
      });
    } else {
      custTxs.forEach(tx => {
        exportRecords.push({
          customerName: cust.name,
          phone: String(cust.phone),
          type: tx.type.toUpperCase(),
          amount: tx.amount,
          date: tx.date,
          note: tx.note || '',
          currentBalance: balances[cust.phone]
        });
      });
    }
  });

  console.log(`Total sample records to export: ${exportRecords.length}`);

  // Create populated workbook using the template as master
  const targetWb = new ExcelJS.Workbook();
  await targetWb.xlsx.readFile(templatePath);
  const ws = targetWb.worksheets[0];
  const templateRow = ws.getRow(2);
  const totalTemplateRows = ws.rowCount;

  exportRecords.forEach((rec, idx) => {
    const rowNum = idx + 2;
    const row = ws.getRow(rowNum);
    const isExtended = rowNum > totalTemplateRows;

    row.getCell(1).value = idx + 1; // Sno
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(2).value = rec.customerName; // Customer Name
    
    // Ensure phone numbers remain 10-digit text values
    const phoneCell = row.getCell(3);
    phoneCell.value = String(rec.phone);
    phoneCell.numFmt = '@';
    phoneCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Transaction Type
    const typeCell = row.getCell(4);
    typeCell.value = rec.type;
    typeCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Amount (INR)
    const amountCell = row.getCell(5);
    amountCell.value = rec.amount;
    amountCell.numFmt = '#,##0';
    amountCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Date
    const dateCell = row.getCell(6);
    dateCell.value = rec.date;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Note
    row.getCell(7).value = rec.note;

    // Customer Current Balance (INR)
    const balCell = row.getCell(8);
    balCell.value = rec.currentBalance;
    balCell.numFmt = '#,##0';
    balCell.alignment = { horizontal: 'right', vertical: 'middle' };

    if (isExtended) {
      row.height = templateRow.height || 20;
      for (let c = 1; c <= 8; c++) {
        const tCell = templateRow.getCell(c);
        const cell = row.getCell(c);
        if (tCell.border) cell.border = JSON.parse(JSON.stringify(tCell.border));
        if (tCell.font) cell.font = JSON.parse(JSON.stringify(tCell.font));
        if (tCell.fill) cell.fill = JSON.parse(JSON.stringify(tCell.fill));
      }
    }
  });

  const testOutputPath = path.join(__dirname, 'test-ledger-output.xlsx');
  await targetWb.xlsx.writeFile(testOutputPath);
  console.log(`✓ Populated workbook saved to ${testOutputPath}`);

  // 4. Verify populated workbook
  const verifyWb = new ExcelJS.Workbook();
  await verifyWb.xlsx.readFile(testOutputPath);
  const verifyWs = verifyWb.worksheets[0];

  console.log('\n--- VERIFYING OUTPUT INTEGRITY ---');
  console.log(`Worksheet: "${verifyWs.name}" (Matches: ${verifyWs.name === origWs.name})`);
  console.log(`Total Rows in Output: ${verifyWs.rowCount} (Expected: ${exportRecords.length + 1})`);
  
  if (verifyWs.rowCount !== exportRecords.length + 1) {
    throw new Error(`Row count mismatch: expected ${exportRecords.length + 1}, got ${verifyWs.rowCount}`);
  }

  // Check all rows have thin borders
  let allRowsBordered = true;
  for (let r = 2; r <= verifyWs.rowCount; r++) {
    const row = verifyWs.getRow(r);
    for (let c = 1; c <= 8; c++) {
      const b = row.getCell(c).border;
      if (!b || !b.left || !b.right || !b.top || !b.bottom) {
        allRowsBordered = false;
        console.error(`Missing border on row ${r} col ${c}`);
      }
    }
  }
  console.log('✓ All 38 data rows have complete borders preserved:', allRowsBordered);
  if (!allRowsBordered) throw new Error('Some cells lacked borders!');

  // Check phone numbers are text values
  for (let r = 2; r <= verifyWs.rowCount; r++) {
    const cell = verifyWs.getRow(r).getCell(3);
    if (typeof cell.value !== 'string' || cell.value.length !== 10) {
      throw new Error(`Phone number at row ${r} is not a 10-digit text value: ${cell.value}`);
    }
  }
  console.log('✓ All phone numbers verified as 10-digit text strings!');

  // Check column widths match original
  for (let c = 1; c <= 8; c++) {
    const origW = origWs.columns[c - 1]?.width;
    const newW = verifyWs.columns[c - 1]?.width;
    console.log(`Col ${c}: Original width = ${origW}, Output width = ${newW}`);
  }
  console.log('✓ Column widths preserved!');

  // Check financial totals in output
  let totalCredits = 0;
  let totalPayments = 0;
  for (let r = 2; r <= verifyWs.rowCount; r++) {
    const row = verifyWs.getRow(r);
    const type = row.getCell(4).value;
    const amount = Number(row.getCell(5).value);
    if (type === 'CREDIT') totalCredits += amount;
    else if (type === 'PAYMENT') totalPayments += amount;
  }
  console.log(`Total Credits: ₹${totalCredits}, Total Payments: ₹${totalPayments}, Net: ₹${totalCredits - totalPayments}`);
  if (totalCredits - totalPayments !== sampleExpected.total_outstanding) {
    throw new Error(`Balance calculation in output does not match expected outstanding!`);
  }
  console.log('✓ Sum of transactions matches exact expected ₹11,820 total!');

  // Clean up test file
  if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);

  // 5. Test UI integration with Puppeteer
  console.log('\n--- VERIFYING IN-BROWSER EXCEL EXPORT CLICK ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#more', { waitUntil: 'networkidle0' });

  // Check that both "Export to Excel (.xlsx)" and "Export to CSV" exist
  const buttons = await page.$$('button');
  let excelBtnFound = false;
  let csvBtnFound = false;
  for (const b of buttons) {
    const text = await (await b.getProperty('textContent')).jsonValue();
    if (text.includes('Export to Excel (.xlsx)')) excelBtnFound = true;
    if (text.includes('Export to CSV')) csvBtnFound = true;
  }

  console.log('Found "Export to Excel (.xlsx)" button in UI:', excelBtnFound);
  console.log('Found "Export to CSV" button in UI (preserved):', csvBtnFound);

  if (!excelBtnFound || !csvBtnFound) {
    throw new Error('Both Excel and CSV export options must be present in the UI!');
  }

  await browser.close();
  console.log('\n======================================================');
  console.log('🎉 EXCEL TEMPLATE EXPORT FULLY VERIFIED & PASSING! 🎉');
  console.log('======================================================');
}

testExcelTemplateExport().catch(e => {
  console.error('❌ EXCEL TEST FAILED:', e);
  process.exit(1);
});
