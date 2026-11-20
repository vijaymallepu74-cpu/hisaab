import ExcelJS from 'exceljs';
import { CustomerSummary } from '../types';

/**
 * Dynamically resolves the Excel template filename from public/ directory
 * avoiding any hardcoded paths.
 */
export async function resolveTemplateUrl(): Promise<string> {
  // First attempt: read template-manifest.json
  try {
    const res = await fetch('/template-manifest.json');
    if (res.ok) {
      const data = await res.json();
      if (data && data.template) {
        return `/${data.template}`;
      }
    }
  } catch (e) {
    console.warn('Could not load template-manifest.json, falling back:', e);
  }

  // Second attempt: query Vite dev server middleware
  try {
    const res = await fetch('/api/get-template');
    if (res.ok) {
      const data = await res.json();
      if (data && data.template) {
        return `/${data.template}`;
      }
    }
  } catch (e) {
    // Ignore in static environments
  }

  // Fallback to default name present in public folder
  return '/My_Shop_hisaab_ledger_2026-11-19.xlsx';
}

export interface ExportExcelOptions {
  customerSummaries: CustomerSummary[];
  shopName: string;
}

/**
 * Loads the existing master Excel template from public/,
 * populates actual customer and transaction ledger records preserving
 * all original formatting (column widths, borders, fonts, alignment, row heights),
 * and triggers a downloadable .xlsx file in the browser.
 */
export async function exportLedgerToExcel({
  customerSummaries,
  shopName,
}: ExportExcelOptions): Promise<void> {
  const templateUrl = await resolveTemplateUrl();

  // 1. Fetch template workbook via public URL
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to load Excel template from ${templateUrl} (Status ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // 2. Load workbook in ExcelJS
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the Excel template');
  }

  // 3. Inspect Row 1 headers to dynamically map column indices
  let colSno = -1;
  let colName = -1;
  let colPhone = -1;
  let colType = -1;
  let colAmount = -1;
  let colDate = -1;
  let colNote = -1;
  let colBalance = -1;

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const val = String(cell.value || '').trim().toLowerCase();
    if (val.includes('sno') || val.includes('s.no') || val === 's no' || val === 'sl no') {
      colSno = colNumber;
    } else if (val.includes('balance')) {
      // Must check balance before 'customer' or 'name' because header is 'Customer Current Balance (INR)'
      colBalance = colNumber;
    } else if (val.includes('name') || val === 'customer' || val.includes('customer name')) {
      colName = colNumber;
    } else if (val.includes('phone') || val.includes('mobile')) {
      colPhone = colNumber;
    } else if (val.includes('type')) {
      colType = colNumber;
    } else if (val.includes('amount')) {
      colAmount = colNumber;
    } else if (val.includes('date')) {
      colDate = colNumber;
    } else if (val.includes('note') || val.includes('desc')) {
      colNote = colNumber;
    }
  });

  // Default fallback if headers were not labeled
  if (colSno === -1) colSno = 1;
  if (colName === -1) colName = 2;
  if (colPhone === -1) colPhone = 3;
  if (colType === -1) colType = 4;
  if (colAmount === -1) colAmount = 5;
  if (colDate === -1) colDate = 6;
  if (colNote === -1) colNote = 7;
  if (colBalance === -1) colBalance = 8;

  // Ensure column widths are sufficient so dates (2026-XX-XX) and names are not clipped
  const ensureColWidth = (colIdx: number, minWidth: number) => {
    if (colIdx !== -1) {
      const col = worksheet.getColumn(colIdx);
      const currWidth = typeof col.width === 'number' ? col.width : 0;
      if (currWidth < minWidth) {
        col.width = minWidth;
      }
    }
  };
  ensureColWidth(colSno, 8);
  ensureColWidth(colName, 20);
  ensureColWidth(colDate, 14);
  ensureColWidth(colNote, 18);
  ensureColWidth(colBalance, 20);

  // 4. Flatten all customer ledger entries
  interface FlattenedEntry {
    customerName: string;
    phone: string;
    type: string;
    amount: number;
    date: string;
    note: string;
    currentBalance: number;
  }

  const records: FlattenedEntry[] = [];

  customerSummaries.forEach((cust) => {
    if (cust.transactions.length === 0) {
      records.push({
        customerName: cust.name,
        phone: String(cust.phone),
        type: 'N/A',
        amount: 0,
        date: cust.createdAt?.split('T')[0] || '',
        note: 'No transactions',
        currentBalance: cust.balance,
      });
    } else {
      cust.transactions.forEach((tx) => {
        records.push({
          customerName: cust.name,
          phone: String(cust.phone),
          type: tx.type.toUpperCase(),
          amount: tx.amount,
          date: tx.date,
          note: tx.note || '',
          currentBalance: cust.balance,
        });
      });
    }
  });

  // 5. Reference preformatted template row 2 for borders, fonts, alignments
  const templateRow = worksheet.getRow(2);
  const totalTemplateRows = worksheet.rowCount; // initially 22 in standard template

  records.forEach((rec, idx) => {
    const rowNum = idx + 2;
    const row = worksheet.getRow(rowNum);
    const isExtendedRow = rowNum > totalTemplateRows;

    row.height = 20;

    // Sno if present
    if (colSno !== -1) {
      const cell = row.getCell(colSno);
      cell.value = idx + 1;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // 1. Customer Name
    const nameCell = row.getCell(colName);
    nameCell.value = rec.customerName;
    nameCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Phone Number (ensure 10-digit text value)
    const phoneCell = row.getCell(colPhone);
    phoneCell.value = String(rec.phone);
    phoneCell.numFmt = '@';
    phoneCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 3. Transaction Type
    const typeCell = row.getCell(colType);
    typeCell.value = rec.type;
    typeCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 4. Amount (INR)
    const amountCell = row.getCell(colAmount);
    amountCell.value = rec.amount;
    amountCell.numFmt = '#,##0';
    amountCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 5. Date
    const dateCell = row.getCell(colDate);
    dateCell.value = rec.date;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 6. Note
    const noteCell = row.getCell(colNote);
    noteCell.value = rec.note;
    noteCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 7. Customer Current Balance (INR)
    const balanceCell = row.getCell(colBalance);
    balanceCell.value = rec.currentBalance;
    balanceCell.numFmt = '#,##0';
    balanceCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Ensure complete borders and template formatting across all cells
    const sampleBorder = templateRow.getCell(1).border || {
      left: { style: 'thin' },
      right: { style: 'thin' },
      top: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      if (!cell.border) {
        cell.border = JSON.parse(JSON.stringify(sampleBorder));
      }
    }

    // If extending beyond preformatted rows, copy styles from template row
    if (isExtendedRow) {
      const maxCols = Math.max(8, worksheet.columnCount);
      for (let c = 1; c <= maxCols; c++) {
        const tCell = templateRow.getCell(c);
        const cell = row.getCell(c);
        if (tCell.border) cell.border = JSON.parse(JSON.stringify(tCell.border));
        if (tCell.font) cell.font = JSON.parse(JSON.stringify(tCell.font));
        if (tCell.fill) cell.fill = JSON.parse(JSON.stringify(tCell.fill));
        if (!cell.alignment && tCell.alignment) {
          cell.alignment = JSON.parse(JSON.stringify(tCell.alignment));
        }
      }
    }
  });

  // If there are fewer records than original preformatted rows, remove excess empty rows
  const lastFilledRow = records.length + 1;
  if (worksheet.rowCount > lastFilledRow) {
    worksheet.spliceRows(lastFilledRow + 1, worksheet.rowCount - lastFilledRow);
  }

  // 6. Export workbook to downloadable Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanShop = (shopName || 'My_Shop').replace(/[^a-zA-Z0-9_-]/g, '_');
  const downloadFileName = `${cleanShop}_hisaab_ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
