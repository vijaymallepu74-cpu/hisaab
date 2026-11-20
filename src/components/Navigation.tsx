import React from 'react';
import { Home, Users, Plus, MoreHorizontal } from 'lucide-react';
import { Screen } from '../types';
import { translations } from '../utils/i18n';
import { useLedger } from '../context/LedgerContext';

interface Props {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNavigation: React.FC<Props> = ({
  currentScreen,
  onNavigate,
  onOpenQuickAdd,
}) => {
  const { language } = useLedger();
  const t = translations[language];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5EAE7] py-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Home */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            currentScreen === 'dashboard'
              ? 'text-[#087F5B] font-bold'
              : 'text-[#64748B] hover:text-[#17231E] font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${currentScreen === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">{t.home}</span>
        </button>

        {/* Central Prominent Add Action */}
        <button
          onClick={onOpenQuickAdd}
          className="relative -top-3 w-12 h-12 rounded-full bg-[#087F5B] hover:bg-[#066348] text-white flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          aria-label="Add transaction or customer"
          title="Add Entry"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Customers */}
        <button
          onClick={() => onNavigate('customers')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            currentScreen === 'customers' || currentScreen === 'ledger'
              ? 'text-[#087F5B] font-bold'
              : 'text-[#64748B] hover:text-[#17231E] font-medium'
          }`}
        >
          <Users className={`w-5 h-5 ${currentScreen === 'customers' || currentScreen === 'ledger' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">{t.customers}</span>
        </button>

        {/* More */}
        <button
          onClick={() => onNavigate('more')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            currentScreen === 'more' || currentScreen === 'import' || currentScreen === 'overdue'
              ? 'text-[#087F5B] font-bold'
              : 'text-[#64748B] hover:text-[#17231E] font-medium'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${currentScreen === 'more' || currentScreen === 'import' || currentScreen === 'overdue' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">{t.more}</span>
        </button>
      </div>
    </nav>
  );
};
