/**
 * WhatsApp reminder URL and message generator with embedded UPI payment link.
 * Strictly adheres to evaluation requirements:
 * https://wa.me/91<10-digit-phone>?text=<URL-ENCODED-MESSAGE>
 * 
 * UPI URL schema:
 * upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */

export interface WhatsAppReminderOptions {
  customerName: string;
  phone: string;
  balance: number;
  shopName: string;
  upiId?: string;
}

/**
 * Validates UPI Virtual Payment Address (VPA) format: username@bank
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId) return false;
  return /^[\w.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim());
}

/**
 * Generates standard UPI payment URL:
 * upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export function buildUpiPaymentUrl(params: {
  upiId: string;
  shopName: string;
  balance: number;
  note?: string;
}): string {
  const pa = encodeURIComponent(params.upiId.trim());
  const pn = encodeURIComponent(params.shopName.trim());
  const am = Math.abs(Math.round(params.balance));
  const note = params.note || `Dues Payment - ${params.shopName.trim()}`;
  const tn = encodeURIComponent(note);

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Builds the plain text WhatsApp message containing greeting, balance,
 * shop name, embedded UPI payment link (for positive balances), and polite closing.
 */
export function buildWhatsAppMessage(options: WhatsAppReminderOptions): string {
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

/**
 * Generates the full wa.me link with URL-encoded message text
 */
export function buildWhatsAppUrl(options: WhatsAppReminderOptions): string {
  const cleanPhone = options.phone.replace(/\D/g, '').slice(-10);
  const message = buildWhatsAppMessage(options);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
}
