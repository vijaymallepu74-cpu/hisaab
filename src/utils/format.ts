/**
 * Formats a number according to the Indian numbering system with the Rupee symbol (₹).
 * Example: 11820 -> "₹11,820"
 * Example: 100000 -> "₹1,00,000"
 * Example: 670 -> "₹670"
 */
export function formatINR(amount: number, options?: { showPlus?: boolean; showSign?: boolean }): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount)); // Integer arithmetic preferred for INR
  
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absAmount);

  if (isNegative) {
    return `-₹${formattedNumber}`;
  }
  
  if (options?.showPlus && amount > 0) {
    return `+ ₹${formattedNumber}`;
  }

  return `₹${formattedNumber}`;
}

/**
 * Normalizes phone numbers to standard 10-digit Indian mobile format
 * Removes prefixes (+91, 91, 0) and non-numeric characters.
 */
export function normalizePhone(rawPhone: string | number): string {
  const digitsOnly = String(rawPhone).replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.slice(1);
  }
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  // Return last 10 digits if longer or whatever digits are present
  return digitsOnly.slice(-10);
}

/**
 * Validates whether a phone number is a valid 10-digit Indian mobile number
 * Typically starts with 6, 7, 8, or 9 and has exactly 10 digits.
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

/**
 * Generates initials from a customer name (e.g., "Ravi Kumar" -> "RK", "Sunita" -> "S")
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
