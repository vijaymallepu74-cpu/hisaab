import React, { useState, useMemo } from 'react';
import { Search, UserPlus, MessageCircle, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { formatINR, getInitials } from '../utils/format';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { translations } from '../utils/i18n';

interface Props {
  onSelectCustomer: (phone: string) => void;
  onOpenAddCustomer: () => void;
}

type SortKey = 'balance-desc' | 'balance-asc' | 'name-asc' | 'recent';

export const CustomerList: React.FC<Props> = ({ onSelectCustomer, onOpenAddCustomer }) => {
  const { customerSummaries, shopName, upiId, language } = useLedger();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('balance-desc');
  const [filterBalanceOnly, setFilterBalanceOnly] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);
  const t = translations[language];

  const processedCustomers = useMemo(() => {
    let list = customerSummaries;

    // Filter by search query
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }

    // Filter by balance only if toggled
    if (filterBalanceOnly) {
      list = list.filter((c) => c.balance > 0);
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sort === 'balance-desc') return b.balance - a.balance;
      if (sort === 'balance-asc') return a.balance - b.balance;
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'recent') {
        const dateA = a.lastCreditDate || a.createdAt || '';
        const dateB = b.lastCreditDate || b.createdAt || '';
        return dateB.localeCompare(dateA);
      }
      return 0;
    });
  }, [customerSummaries, search, sort, filterBalanceOnly]);

  React.useEffect(() => {
    setDisplayLimit(50);
  }, [search, sort, filterBalanceOnly]);

  const displayedCustomers = useMemo(() => {
    return processedCustomers.slice(0, displayLimit);
  }, [processedCustomers, displayLimit]);

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-[#17231E]">{t.customers}</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {customerSummaries.length} registered accounts
          </p>
        </div>
        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-1.5 py-2.5 px-3.5 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-sm font-medium bg-white transition-all text-[#17231E] placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter / Sort Row */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setFilterBalanceOnly(!filterBalanceOnly)}
            className={`px-3 py-1.5 rounded-full font-semibold border transition-all ${
              filterBalanceOnly
                ? 'bg-emerald-50 border-emerald-300 text-[#066348]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filterBalanceOnly ? '✓ With Balance Only' : 'Show All'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
          >
            <option value="balance-desc">Balance (High to Low)</option>
            <option value="balance-asc">Balance (Low to High)</option>
            <option value="name-asc">Name (A to Z)</option>
            <option value="recent">Recently Active</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      {processedCustomers.length === 0 ? (
        <div className="bg-white rounded-card p-8 border border-[#E5EAE7] text-center shadow-subtle">
          <h3 className="text-sm font-bold text-[#17231E]">No customers found</h3>
          <p className="text-xs text-[#64748B] mt-1">
            Try adjusting your search query or add a new customer.
          </p>
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
              /* REQUIRED ATTRIBUTE: data-customer */
              <div
                key={cust.phone}
                data-customer={cust.phone}
                onClick={() => onSelectCustomer(cust.phone)}
                className="bg-white rounded-card p-4 border border-[#E5EAE7] hover:border-emerald-300 shadow-subtle hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
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

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="text-right">
                    {/* REQUIRED ATTRIBUTE: data-balance INSIDE data-customer */}
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
                      {cust.transactions.length} entries
                    </span>
                  </div>

                  {/* REQUIRED SELECTOR: a[data-remind] */}
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
          {processedCustomers.length > displayLimit && (
            <button
              type="button"
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="w-full py-3 mt-1 bg-white hover:bg-slate-50 border border-[#E5EAE7] rounded-btn text-xs font-bold text-[#087F5B] transition-colors shadow-subtle flex items-center justify-center gap-1.5"
            >
              <span>Show More ({displayedCustomers.length} of {processedCustomers.length} Customers)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
