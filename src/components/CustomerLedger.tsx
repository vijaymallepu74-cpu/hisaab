import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, MessageCircle, Edit2 } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { formatINR, getInitials } from '../utils/format';
import { formatDisplayDate } from '../utils/date';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { ScreenshotThumbnail } from './ScreenshotThumbnail';
import { AddTransactionModal } from './AddTransactionModal';
import { EditTransactionModal } from './EditTransactionModal';
import { Transaction } from '../types';
import { translations } from '../utils/i18n';

interface Props {
  phone: string;
  onBack: () => void;
  onPreviewScreenshot: (url: string) => void;
}

export const CustomerLedger: React.FC<Props> = ({ phone, onBack, onPreviewScreenshot }) => {
  const { getCustomerByPhone, shopName, upiId, language } = useLedger();
  const customer = getCustomerByPhone(phone);
  const t = translations[language];

  const [addTxOpen, setAddTxOpen] = useState(false);
  const [addTxType, setAddTxType] = useState<'credit' | 'payment'>('credit');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txDisplayLimit, setTxDisplayLimit] = useState(50);

  const displayedTransactions = React.useMemo(() => {
    if (!customer) return [];
    return customer.transactions.slice(0, txDisplayLimit);
  }, [customer?.transactions, txDisplayLimit]);

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600 mb-4">Customer not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#087F5B] text-white rounded-btn text-sm font-semibold"
        >
          Back to List
        </button>
      </div>
    );
  }

  const whatsAppUrl = buildWhatsAppUrl({
    customerName: customer.name,
    phone: customer.phone,
    balance: customer.balance,
    shopName,
    upiId,
  });

  const handleOpenAdd = (type: 'credit' | 'payment') => {
    setAddTxType(type);
    setAddTxOpen(true);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-[#087F5B] font-semibold text-sm py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </button>

        {/* WhatsApp Reminder Button with required evaluator selector */}
        {customer.balance > 0 && (
          <a
            data-remind={customer.phone}
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2 px-3.5 rounded-btn shadow-sm hover:shadow transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white text-transparent" />
            <span>{t.remindWhatsApp}</span>
          </a>
        )}
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-card p-5 border border-[#E5EAE7] shadow-subtle flex items-start gap-3.5">
        <div className="w-13 h-13 w-12 h-12 rounded-full bg-[#E8F5EE] text-[#066348] font-bold text-lg flex items-center justify-center flex-shrink-0 border border-emerald-200">
          {getInitials(customer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
            {t.customerLedger}
          </span>
          <h1 className="text-xl font-bold text-[#17231E] truncate">{customer.name}</h1>
          <p className="text-xs text-[#64748B] font-medium tracking-wide mt-0.5">
            +91 {customer.phone}
          </p>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-white rounded-card p-5 border border-[#E5EAE7] shadow-subtle space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {t.currentBalance}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                customer.balance > 0
                  ? 'text-[#16A36A]'
                  : customer.balance < 0
                  ? 'text-[#E76F51]'
                  : 'text-[#64748B]'
              }`}
            >
              {formatINR(customer.balance)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {customer.balance > 0
                ? t.creditOwed
                : customer.balance < 0
                ? t.advanceOverpaid
                : t.settled}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              {t.totalCredit}
            </span>
            <p className="text-lg font-bold text-[#16A36A] mt-0.5">
              {formatINR(customer.totalCredit)}
            </p>
          </div>
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
              {t.totalReceived}
            </span>
            <p className="text-lg font-bold text-[#E76F51] mt-0.5">
              {formatINR(customer.totalPayment)}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Actions: Give Credit & Receive Payment */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOpenAdd('credit')}
          className="flex items-center justify-center gap-2 py-3.5 px-4 bg-[#16A36A] hover:bg-[#138959] text-white rounded-btn font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>{t.giveCredit}</span>
        </button>

        <button
          onClick={() => handleOpenAdd('payment')}
          className="flex items-center justify-center gap-2 py-3.5 px-4 bg-[#E76F51] hover:bg-[#d65e40] text-white rounded-btn font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <Minus className="w-5 h-5 stroke-[2.5]" />
          <span>{t.receivePayment}</span>
        </button>
      </div>

      {/* Transaction History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#17231E]">
            {t.allTransactions} ({customer.transactions.length})
          </h2>
          <span className="text-xs text-[#64748B]">Sorted by newest first</span>
        </div>

        {customer.transactions.length === 0 ? (
          <div className="bg-white rounded-card p-8 border border-[#E5EAE7] text-center shadow-subtle">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#17231E]">No transactions yet</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
              Record customer purchases as Credit or payments received as Payment using the buttons above.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`bg-white rounded-card p-4 border shadow-subtle flex items-center justify-between gap-3 transition-all ${
                  tx.type === 'credit'
                    ? 'border-l-4 border-l-[#16A36A] border-slate-200'
                    : 'border-l-4 border-l-[#E76F51] border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Screenshot Thumbnail if present (PAYMENT ONLY) */}
                  {tx.screenshotId && (
                    <ScreenshotThumbnail
                      screenshotId={tx.screenshotId}
                      onPreview={onPreviewScreenshot}
                    />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          tx.type === 'credit'
                            ? 'bg-emerald-50 text-[#16A36A]'
                            : 'bg-rose-50 text-[#E76F51]'
                        }`}
                      >
                        {tx.type === 'credit' ? 'Credit' : 'Payment'}
                      </span>
                      <span className="text-xs text-[#64748B] font-medium">
                        {formatDisplayDate(tx.date)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#17231E] mt-1 truncate">
                      {tx.note || (tx.type === 'credit' ? 'Credit' : 'Payment')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-lg font-extrabold ${
                        tx.type === 'credit' ? 'text-[#16A36A]' : 'text-[#E76F51]'
                      }`}
                    >
                      {tx.type === 'credit' ? `+ ₹${tx.amount.toLocaleString('en-IN')}` : `- ₹${tx.amount.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingTx(tx)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit or delete transaction"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Load More Transactions button */}
            {customer.transactions.length > txDisplayLimit && (
              <button
                type="button"
                onClick={() => setTxDisplayLimit((prev) => prev + 50)}
                className="w-full py-2.5 mt-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-btn text-xs font-bold text-slate-700 transition-colors"
              >
                Show More ({displayedTransactions.length} of {customer.transactions.length} Entries)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        defaultPhone={customer.phone}
        defaultType={addTxType}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTx}
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
      />
    </div>
  );
};
