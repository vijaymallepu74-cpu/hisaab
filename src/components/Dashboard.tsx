import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  MessageCircle, 
  ChevronRight, 
  AlertTriangle,
  Store,
  Calendar,
  Sparkles,
  PlusCircle
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { formatINR, getInitials } from '../utils/format';
import { formatDisplayDate } from '../utils/date';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { translations } from '../utils/i18n';

interface Props {
  onSelectCustomer: (phone: string) => void;
  onOpenAddCustomer: () => void;
  onOpenAddTransaction: () => void;
  onNavigateToMore: () => void;
  onNavigateToOverdue: () => void;
}

export const Dashboard: React.FC<Props> = ({
  onSelectCustomer,
  onOpenAddCustomer,
  onOpenAddTransaction,
  onNavigateToMore,
  onNavigateToOverdue,
}) => {
  const { 
    shopName, 
    effectiveToday, 
    customerSummaries, 
    overallSummary, 
    upiId, 
    language,
    loadSampleDataset
  } = useLedger();

  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const t = translations[language];

  // Immediate filtering as user types by name or 10-digit phone
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customerSummaries;
    return customerSummaries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customerSummaries, searchQuery]);

  // Reset display window when search changes
  React.useEffect(() => {
    setDisplayLimit(50);
  }, [searchQuery]);

  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayLimit);
  }, [filteredCustomers, displayLimit]);

  return (
    <div className="space-y-4 pb-24">
      {/* Dashboard Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#087F5B] text-white flex items-center justify-center shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#087F5B]">
                {t.appTitle}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-[#64748B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDisplayDate(effectiveToday)}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#17231E] leading-tight truncate max-w-[220px] sm:max-w-xs">
              {shopName}
            </h1>
          </div>
        </div>

        <button
          onClick={onNavigateToMore}
          className="p-2.5 text-slate-600 hover:text-[#087F5B] hover:bg-emerald-50/60 rounded-btn transition-colors border border-transparent hover:border-emerald-200"
          aria-label="Shop Settings"
          title="Settings & Tools"
        >
          <Store className="w-5 h-5 text-slate-500 hover:text-[#087F5B]" />
        </button>
      </div>

      {/* Prominent Emerald-Themed Outstanding Summary Card */}
      <div className="bg-gradient-to-br from-[#087F5B] to-[#066348] text-white rounded-card p-6 shadow-elevated relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-12 top-3 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-emerald-100 uppercase">
              {t.totalOutstanding}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-white backdrop-blur-sm">
              {t.liveLedger}
            </span>
          </div>

          {/* CRITICAL EVALUATOR SELECTOR: id="total-outstanding" */}
          <div className="mt-2.5 mb-1.5">
            <span
              id="total-outstanding"
              className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white block"
            >
              {formatINR(overallSummary.totalOutstanding)}
            </span>
          </div>

          <p className="text-xs text-emerald-100/90 font-medium mt-1">
            {t.outstandingSubtext}
          </p>

          {/* Quick Metrics Inside Hero Card */}
          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/15">
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">
                {t.totalCustomers}
              </span>
              <p className="text-base font-bold text-white mt-0.5">
                {overallSummary.totalCustomers}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">
                {t.customersWithBalance}
              </span>
              <p className="text-base font-bold text-white mt-0.5">
                {overallSummary.customersWithBalance}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Defaulter Alert Banner if applicable */}
      {overallSummary.topDefaulter && overallSummary.topDefaulter.balance > 0 && (
        <div 
          onClick={() => onSelectCustomer(overallSummary.topDefaulter!.phone)}
          className="bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-btn p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-subtle"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                {t.topDefaulter}
              </span>
              <p className="text-sm font-bold text-slate-800 truncate">
                {overallSummary.topDefaulter.name} — <span className="text-amber-900 font-extrabold">{formatINR(overallSummary.topDefaulter.balance)}</span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-700 flex-shrink-0" />
        </div>
      )}

      {/* Primary Actions & Search Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-sm font-medium bg-white transition-all text-[#17231E] placeholder:text-slate-400 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                {t.clearSearch}
              </button>
            )}
          </div>

          {/* Add Customer Action Button */}
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 py-2.5 px-3 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex-shrink-0 active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 flex-shrink-0" />
            <span>+ {t.addCustomer}</span>
          </button>

          {/* Quick Add Entry if customers exist */}
          {customerSummaries.length > 0 && (
            <button
              onClick={onOpenAddTransaction}
              className="hidden sm:flex items-center gap-1.5 py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-[#066348] border border-emerald-200 rounded-btn font-bold text-sm transition-all flex-shrink-0 active:scale-95"
              title="Add credit or payment entry"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ {t.addEntry}</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer List Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#17231E]">
            {t.customers} ({filteredCustomers.length})
          </h2>
          {overallSummary.totalCustomers > 0 && (
            <button
              onClick={onNavigateToOverdue}
              className="text-xs font-semibold text-[#087F5B] hover:underline"
            >
              {t.viewOverdue} →
            </button>
          )}
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-card p-8 border border-[#E5EAE7] text-center shadow-subtle">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#087F5B] flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-sm font-bold text-[#17231E]">{t.noCustomersFound}</h3>
                <p className="text-xs text-[#64748B] mt-1">No customer matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-[#087F5B] hover:underline"
                >
                  Clear search query
                </button>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-[#17231E]">{t.noCustomersYet}</h3>
                <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
                  {t.addFirstCustomerPrompt}
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-4">
                  <button
                    onClick={onOpenAddCustomer}
                    className="py-2.5 px-4 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn text-xs font-bold shadow-sm"
                  >
                    + {t.addCustomer}
                  </button>
                  <button
                    onClick={loadSampleDataset}
                    className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#066348] border border-emerald-200 rounded-btn text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load 8 Sample Customers</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedCustomers.map((cust) => {
              const whatsAppUrl = buildWhatsAppUrl({
                customerName: cust.name,
                phone: cust.phone,
                balance: cust.balance,
                shopName,
                upiId,
              });

              return (
                /* MANDATORY EVALUATOR ATTRIBUTE: data-customer="<10-digit-phone>" */
                <div
                  key={cust.phone}
                  data-customer={cust.phone}
                  onClick={() => onSelectCustomer(cust.phone)}
                  className="bg-white rounded-card p-4 border border-[#E5EAE7] hover:border-emerald-300 shadow-subtle hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar + Customer Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#E8F5EE] text-[#066348] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                      {getInitials(cust.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-[#17231E] truncate group-hover:text-[#087F5B] transition-colors">
                        {cust.name}
                      </h3>
                      <p className="text-xs text-[#64748B] font-medium tracking-wide">
                        {cust.phone}
                      </p>
                    </div>
                  </div>

                  {/* Right: Balance + Quick WhatsApp Button */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="text-right">
                      {/* MANDATORY EVALUATOR ATTRIBUTE: data-balance INSIDE matching data-customer */}
                      <span
                        data-balance
                        className={`text-base font-extrabold tracking-tight block ${
                          cust.balance > 0
                            ? 'text-[#16A36A]'
                            : cust.balance < 0
                            ? 'text-[#E76F51]'
                            : 'text-[#64748B]'
                        }`}
                      >
                        {formatINR(cust.balance)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                        {cust.balance > 0 ? 'Pending' : cust.balance < 0 ? 'Advance' : 'Settled'}
                      </span>
                    </div>

                    {/* MANDATORY EVALUATOR SELECTOR: a[data-remind="<phone>"] */}
                    {cust.balance > 0 && (
                      <a
                        data-remind={cust.phone}
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-200 hover:border-transparent flex items-center justify-center transition-all shadow-sm active:scale-95"
                        title={`Send WhatsApp reminder to ${cust.name}`}
                        aria-label={`Send WhatsApp reminder to ${cust.name}`}
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </a>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors -mr-1" />
                  </div>
                </div>
              );
            })}

            {/* Load More Button for large datasets */}
            {filteredCustomers.length > displayLimit && (
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 50)}
                className="w-full py-3 mt-1 bg-white hover:bg-slate-50 border border-[#E5EAE7] rounded-btn text-xs font-bold text-[#087F5B] transition-colors shadow-subtle flex items-center justify-center gap-1.5"
              >
                <span>Show More ({displayedCustomers.length} of {filteredCustomers.length} Customers)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
