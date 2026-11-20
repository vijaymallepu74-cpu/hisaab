import { CustomerSummary } from '../types';

export function exportLedgerToCSV(customerSummaries: CustomerSummary[], shopName: string): void {
  const headers = [
    'Customer Name',
    'Phone Number',
    'Transaction Type',
    'Amount (INR)',
    'Date',
    'Note',
    'Customer Current Balance (INR)'
  ];

  const rows: string[][] = [];

  customerSummaries.forEach((cust) => {
    if (cust.transactions.length === 0) {
      // Still include customer even if no transactions yet
      rows.push([
        escapeCSV(cust.name),
        escapeCSV(cust.phone),
        'N/A',
        '0',
        cust.createdAt?.split('T')[0] || '',
        'No transactions',
        String(cust.balance)
      ]);
    } else {
      cust.transactions.forEach((tx) => {
        rows.push([
          escapeCSV(cust.name),
          escapeCSV(cust.phone),
          escapeCSV(tx.type.toUpperCase()),
          String(tx.amount),
          escapeCSV(tx.date),
          escapeCSV(tx.note || ''),
          String(cust.balance)
        ]);
      });
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanShop = shopName.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanShop}_hisaab_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: string): string {
  if (!val) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
