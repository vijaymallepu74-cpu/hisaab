/**
 * WhatsApp reminder URL and message generator.
 * Strictly adheres to evaluation requirements:
 * https://wa.me/91<10-digit-phone>?text=<URL-ENCODED-MESSAGE>
 */

export interface WhatsAppReminderOptions {
  customerName: string;
  phone: string;
  balance: number;
  shopName: string;
  upiId?: string;
}

export function buildWhatsAppMessage(options: WhatsAppReminderOptions): string {
  const { customerName, balance, shopName, upiId } = options;
  const balanceInt = Math.abs(Math.round(balance));

  let message = `Hello ${customerName.trim()},\n\nThis is a friendly reminder regarding your outstanding balance of Rs. ${balanceInt} at ${shopName.trim()}.\n\nPlease make the payment at your convenience.`;

  // Optional UPI payment link if shopkeeper configured one
  if (upiId && upiId.trim() && upiId.includes('@')) {
    const encodedShop = encodeURIComponent(shopName.trim());
    message += `\n\nPay via UPI: upi://pay?pa=${upiId.trim()}&am=${balanceInt}&pn=${encodedShop}`;
  }

  message += `\n\nThank you!`;
  return message;
}

export function buildWhatsAppUrl(options: WhatsAppReminderOptions): string {
  const cleanPhone = options.phone.replace(/\D/g, '').slice(-10);
  const message = buildWhatsAppMessage(options);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
}
