import React, { useMemo } from 'react';
import { Clock, AlertCircle, MessageCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { formatINR, getInitials } from '../utils/format';
import { formatDisplayDate } from '../utils/date';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { translations } from '../utils/i18n';

interface Props {
  onSelectCustomer: (phone: string) => void;
  onBack: () => void;
}

export const OverdueScreen: React.FC<Props> = ({ onSelectCustomer, onBack }) => {
  const { customerSummaries, shopName, upiId, effectiveToday, language } = useLedger();
  const t = translations[language];

  // Filter only customers with positive balance (money owed to shop)
  const { overdueWithPayments, neverPaid } = useMemo(() => {
    const debtors = customerSummaries.filter((c) => c.balance > 0);

    const withPayments = debtors.filter((c) => c.lastPaymentDate !== undefined);
    const withoutPayments = debtors.filter((c) => c.lastPaymentDate === undefined);

    // Sort by days since last payment descending (most overdue first)
    withPayments.sort((a, b) => {
      const daysA = a.daysSinceLastPayment ?? -1;
      const daysB = b.daysSinceLastPayment ?? -1;
      return daysB - daysA;
    });

    // Sort never paid by days since last credit descending
    withoutPayments.sort((a, b) => {
      const daysA = a.daysSinceLastCredit ?? -1;
      const daysB = b.daysSinceLastCredit ?? -1;
      return daysB - daysA;
    });

    return {
      overdueWithPayments: withPayments,
      neverPaid: withoutPayments,
    };
  }, [customerSummaries]);

  const totalDebtors = overdueWithPayments.length + neverPaid.length;

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-[#087F5B] font-semibold text-sm py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.back}</span>
        </button>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {formatDisplayDate(effectiveToday)}
        </span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-[#17231E]">{t.overdueCustomers}</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          {totalDebtors} {t.overdueSubtext}
        </p>
      </div>

      {totalDebtors === 0 ? (
        <div className="bg-white rounded-card p-8 border border-[#E5EAE7] text-center shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#16A36A] flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#17231E]">{t.noOverdue}</h3>
          <p className="text-xs text-[#64748B] mt-1">
            {t.noOverdueSubtext}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Section: Customers with payments, sorted by days since last payment */}
          {overdueWithPayments.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.pendingSincePayment} ({overdueWithPayments.length})
                </span>
                <span className="text-[11px] text-slate-400">{t.mostDelayedFirst}</span>
              </div>

              <div className="space-y-2">
                {overdueWithPayments.map((cust) => {
                  const whatsAppUrl = buildWhatsAppUrl({
                    customerName: cust.name,
                    phone: cust.phone,
                    balance: cust.balance,
                    shopName,
                    upiId,
                  });

                  const days = cust.daysSinceLastPayment ?? 0;
                  const isSevere = days >= 30;

                  return (
                    <div
                      key={cust.phone}
                      data-customer={cust.phone}
                      onClick={() => onSelectCustomer(cust.phone)}
                      className={`bg-white rounded-card p-4 border shadow-subtle hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSevere ? 'border-amber-300 bg-amber-50/20' : 'border-[#E5EAE7]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#E8F5EE] text-[#066348] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-100">
                          {getInitials(cust.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-[#17231E] truncate">
                            {cust.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                            <span className="font-medium">{cust.phone}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                isSevere ? 'text-amber-800' : 'text-slate-600'
                              }`}
                            >
                              {days} {days === 1 ? t.dayAgo : t.daysAgo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t.lastPaid}: {formatDisplayDate(cust.lastPaymentDate || '')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="text-right">
                          <span data-balance className="text-base font-extrabold text-[#16A36A] block">
                            {formatINR(cust.balance)}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                              isSevere
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {days}d {t.delayed}
                          </span>
                        </div>

                        {/* WhatsApp Reminder Link */}
                        <a
                          data-remind={cust.phone}
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-200 hover:border-transparent flex items-center justify-center transition-all shadow-sm active:scale-95"
                          title={`Remind ${cust.name} on WhatsApp`}
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                        </a>

                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Customers who have NEVER made a payment */}
          {neverPaid.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  {t.neverPaid} ({neverPaid.length})
                </span>
              </div>

              <div className="space-y-2">
                {neverPaid.map((cust) => {
                  const whatsAppUrl = buildWhatsAppUrl({
                    customerName: cust.name,
                    phone: cust.phone,
                    balance: cust.balance,
                    shopName,
                    upiId,
                  });

                  const creditDays = cust.daysSinceLastCredit ?? 0;

                  return (
                    <div
                      key={cust.phone}
                      data-customer={cust.phone}
                      onClick={() => onSelectCustomer(cust.phone)}
                      className="bg-white rounded-card p-4 border border-rose-200 bg-rose-50/15 shadow-subtle hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-800 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-rose-200">
                          {getInitials(cust.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-[#17231E] truncate">
                            {cust.name}
                          </h3>
                          <p className="text-xs text-[#64748B] font-medium">
                            +91 {cust.phone}
                          </p>
                          <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                            {t.firstCredit}: {creditDays} {t.daysAgo} • {t.noPaymentYet}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="text-right">
                          <span data-balance className="text-base font-extrabold text-[#16A36A] block">
                            {formatINR(cust.balance)}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 inline-block mt-0.5">
                            {t.noPaymentYet}
                          </span>
                        </div>

                        <a
                          data-remind={cust.phone}
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-200 hover:border-transparent flex items-center justify-center transition-all shadow-sm active:scale-95"
                          title={`Remind ${cust.name} on WhatsApp`}
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                        </a>

                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
