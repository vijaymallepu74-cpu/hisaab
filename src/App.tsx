import React, { useState, useEffect } from 'react';
import { LedgerProvider, useLedger } from './context/LedgerContext';
import { ToastProvider } from './components/Toast';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { CustomerLedger } from './components/CustomerLedger';
import { OverdueScreen } from './components/OverdueScreen';
import { ImportDataScreen } from './components/ImportDataScreen';
import { MoreMenu } from './components/MoreMenu';
import { BottomNavigation } from './components/Navigation';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ScreenshotModal } from './components/ScreenshotModal';
import { Screen } from './types';
import { UserPlus, ArrowRightLeft } from 'lucide-react';

const MainApp: React.FC = () => {
  const { customers } = useLedger();

  // Screen state derived from URL hash on load
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('customer-')) {
        return 'ledger';
      }
      if (['dashboard', 'customers', 'overdue', 'import', 'more'].includes(hash)) {
        return hash as Screen;
      }
    }
    return 'dashboard';
  });

  const [selectedPhone, setSelectedPhone] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('customer-')) {
        return hash.replace('customer-', '');
      }
    }
    return null;
  });

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isQuickAddChoiceOpen, setIsQuickAddChoiceOpen] = useState(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('customer-')) {
        const phone = hash.replace('customer-', '');
        setSelectedPhone(phone);
        setCurrentScreen('ledger');
      } else if (['dashboard', 'customers', 'overdue', 'import', 'more'].includes(hash)) {
        setCurrentScreen(hash as Screen);
      } else if (!hash) {
        setCurrentScreen('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    window.location.hash = screen === 'dashboard' ? '' : screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCustomer = (phone: string) => {
    setSelectedPhone(phone);
    setCurrentScreen('ledger');
    window.location.hash = `customer-${phone}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCustomers = () => {
    setCurrentScreen('dashboard');
    setSelectedPhone(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuickAdd = () => {
    if (customers.length === 0) {
      // If no customers, open Add Customer directly
      setIsAddCustomerOpen(true);
    } else {
      setIsQuickAddChoiceOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#17231E] flex flex-col items-center">
      {/* Desktop Centered Container */}
      <main className="w-full max-w-lg md:max-w-xl lg:max-w-2xl px-4 sm:px-6 pt-3 pb-24 flex-1">
        
        {/* Screen Routing */}
        {currentScreen === 'dashboard' && (
          <Dashboard
            onSelectCustomer={handleSelectCustomer}
            onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
            onNavigateToMore={() => navigateTo('more')}
            onNavigateToOverdue={() => navigateTo('overdue')}
          />
        )}

        {currentScreen === 'customers' && (
          <CustomerList
            onSelectCustomer={handleSelectCustomer}
            onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
          />
        )}

        {currentScreen === 'ledger' && selectedPhone && (
          <CustomerLedger
            phone={selectedPhone}
            onBack={handleBackToCustomers}
            onPreviewScreenshot={(url) => setPreviewScreenshotUrl(url)}
          />
        )}

        {currentScreen === 'overdue' && (
          <OverdueScreen
            onSelectCustomer={handleSelectCustomer}
            onBack={() => navigateTo('dashboard')}
          />
        )}

        {currentScreen === 'import' && (
          <ImportDataScreen
            onBack={() => navigateTo('more')}
            onSuccessNavigate={() => navigateTo('dashboard')}
          />
        )}

        {currentScreen === 'more' && (
          <MoreMenu
            onNavigateToImport={() => navigateTo('import')}
            onNavigateToOverdue={() => navigateTo('overdue')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        onOpenQuickAdd={handleOpenQuickAdd}
      />

      {/* Quick Add Action Choice Sheet */}
      {isQuickAddChoiceOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsQuickAddChoiceOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-center pb-1">
              Select Action
            </h3>
            
            <button
              onClick={() => {
                setIsQuickAddChoiceOpen(false);
                setIsAddTransactionOpen(true);
              }}
              className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#087F5B] text-white flex items-center justify-center font-bold">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#066348]">Record Transaction</p>
                <p className="text-xs text-slate-500">Give credit or record payment for existing customer</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsQuickAddChoiceOpen(false);
                setIsAddCustomerOpen(true);
              }}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Add New Customer</p>
                <p className="text-xs text-slate-500">Register new customer name and 10-digit phone</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Global Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccessNavigate={(phone) => handleSelectCustomer(phone)}
      />

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />

      {/* Full Size Payment Screenshot Lightbox Modal */}
      <ScreenshotModal
        imageUrl={previewScreenshotUrl}
        onClose={() => setPreviewScreenshotUrl(null)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <LedgerProvider>
        <MainApp />
      </LedgerProvider>
    </ToastProvider>
  );
};

export default App;
