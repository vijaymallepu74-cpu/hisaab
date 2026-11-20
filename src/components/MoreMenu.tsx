import React, { useState } from 'react';
import { 
  Clock, 
  Upload, 
  Download, 
  Globe, 
  Store, 
  ChevronRight,
  ChevronDown,
  Calendar,
  Sparkles,
  Plus,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useToast } from './Toast';
import { exportLedgerToCSV } from '../utils/csv';
import { exportLedgerToExcel } from '../utils/excel';
import { translations } from '../utils/i18n';
import { isValidUpiId } from '../utils/whatsapp';
import { BackupVaultModal } from './BackupVaultModal';

interface Props {
  onNavigateToImport: () => void;
  onNavigateToOverdue: () => void;
}

export const MoreMenu: React.FC<Props> = ({ onNavigateToImport, onNavigateToOverdue }) => {
  const { 
    activeShopId,
    shops,
    shopName, 
    setShopName, 
    upiId, 
    setUpiId, 
    language, 
    setLanguage, 
    effectiveToday,
    customerSummaries,
    loadSampleDataset,
    clearAllData,
    switchShop,
    createShop
  } = useLedger();

  const { showToast } = useToast();
  const t = translations[language];

  // Shop management state
  const [showShopSwitcher, setShowShopSwitcher] = useState(false);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopUpi, setNewShopUpi] = useState('');

  // Shop edit state
  const [editingShop, setEditingShop] = useState(false);
  const [shopInput, setShopInput] = useState(shopName);
  const [upiInput, setUpiInput] = useState(upiId);

  // Clear data dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Help FAQ collapse state
  const [showHelpDetails, setShowHelpDetails] = useState(false);

  // Encrypted Backup Vault state
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultDefaultTab, setVaultDefaultTab] = useState<'export' | 'restore'>('export');

  const [exportingExcel, setExportingExcel] = useState(false);

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = upiInput.trim();
    if (cleanUpi && !isValidUpiId(cleanUpi)) {
      showToast(t.valValidUpi, 'error');
      return;
    }
    setShopName(shopInput.trim() || t.defaultShop);
    setUpiId(cleanUpi);
    setEditingShop(false);
    showToast('Shop details updated!', 'success');
  };

  const handleCreateNewShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) {
      showToast('Shop name is required', 'error');
      return;
    }
    const cleanUpi = newShopUpi.trim();
    if (cleanUpi && !isValidUpiId(cleanUpi)) {
      showToast(t.valValidUpi, 'error');
      return;
    }
    createShop(newShopName.trim(), cleanUpi || 'exampleupi@hdjcbank');
    setIsCreatingShop(false);
    setShowShopSwitcher(false);
    setNewShopName('');
    setNewShopUpi('');
    showToast(`Created & switched to ${newShopName.trim()}`, 'success');
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportLedgerToExcel({ customerSummaries, shopName });
      showToast('Master Excel ledger (.xlsx) generated successfully!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to export Excel ledger', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportCSV = () => {
    exportLedgerToCSV(customerSummaries, shopName);
    showToast('Ledger exported to CSV successfully!', 'success');
  };

  const handleLoadSample = async () => {
    await loadSampleDataset();
    showToast('Sample dataset loaded (Lakshmi Provision Store)!', 'success');
  };

  const handleClearActiveShop = () => {
    const currentName = shopName;
    clearAllData();
    setShowClearConfirm(false);
    showToast(`Ledger for "${currentName}" reset. Other shops remain untouched.`, 'info');
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-[#17231E]">{t.more} & {t.settings}</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Application tools, multi-shop profiles, and data controls</p>
      </div>

      {/* Multi-Shop Profile Management Card */}
      <div className="bg-white rounded-card p-5 border border-[#E5EAE7] shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#087F5B] flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-base font-bold text-[#17231E] truncate">{shopName}</h2>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono truncate max-w-[130px]" title={activeShopId}>
                  {activeShopId}
                </span>
              </div>
              <p className="text-xs text-[#64748B] truncate">
                {upiId ? `UPI: ${upiId}` : 'No UPI ID configured'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              id="shop-profiles-btn"
              onClick={() => {
                setShowShopSwitcher(!showShopSwitcher);
                setEditingShop(false);
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-[#087F5B] rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              {shops.length > 1 ? `Shops (${shops.length})` : 'Profiles'}
            </button>
            <button
              id="edit-shop-btn"
              onClick={() => {
                setShopInput(shopName);
                setUpiInput(upiId);
                setEditingShop(!editingShop);
                setShowShopSwitcher(false);
              }}
              className="text-xs font-bold text-[#087F5B] hover:underline"
            >
              {editingShop ? 'Close' : 'Edit'}
            </button>
          </div>
        </div>

        {/* Shop Switcher & Creator View */}
        {showShopSwitcher && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17231E]">
              <span>Available Shop Profiles</span>
              <button
                id="new-shop-btn"
                onClick={() => setIsCreatingShop(!isCreatingShop)}
                className="flex items-center gap-1 text-[#087F5B] hover:underline font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                {isCreatingShop ? 'Cancel' : 'New Shop'}
              </button>
            </div>

            {isCreatingShop && (
              <form onSubmit={handleCreateNewShop} className="p-3 bg-slate-50 rounded-xl space-y-2.5 border border-slate-200">
                <p className="text-xs font-bold text-slate-800">Add Independent Shop Profile</p>
                <div>
                  <input
                    id="new-shop-name-inp"
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="Shop Name (e.g. Ramesh Kirana)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:border-[#087F5B]"
                  />
                </div>
                <div>
                  <input
                    id="new-shop-upi-inp"
                    type="text"
                    value={newShopUpi}
                    onChange={(e) => setNewShopUpi(e.target.value)}
                    placeholder="Optional UPI ID (e.g. ramesh@okaxis)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:border-[#087F5B]"
                  />
                </div>
                <button
                  id="create-shop-btn"
                  type="submit"
                  className="w-full py-1.5 bg-[#087F5B] text-white rounded-lg text-xs font-bold hover:bg-[#066348]"
                >
                  Create & Open Ledger
                </button>
              </form>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {shops.map((s) => {
                const isActive = s.id === activeShopId;
                return (
                  <div
                    key={s.id}
                    data-shop-id={s.id}
                    onClick={() => switchShop(s.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className={`w-4 h-4 ${isActive ? 'text-[#087F5B]' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.id}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-extrabold uppercase">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#087F5B] font-semibold hover:underline">
                        Switch
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Edit Current Shop Info */}
        {editingShop && (
          <form onSubmit={handleSaveShopSettings} className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1">
                {t.shopNameLabel}
              </label>
              <input
                id="shop-name-input"
                type="text"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                placeholder="e.g. Lakshmi Provision Store"
                className="w-full px-3 py-2 rounded-inp border border-[#E5EAE7] text-sm font-medium outline-none focus:border-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1">
                {t.upiIdLabel}
              </label>
              <input
                id="shop-upi-input"
                type="text"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                placeholder="e.g. exampleupi@hdjcbank"
                className="w-full px-3 py-2 rounded-inp border border-[#E5EAE7] text-sm font-medium outline-none focus:border-[#087F5B]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {t.upiHelp}
              </p>
            </div>

            <button
              id="save-shop-settings-btn"
              type="submit"
              className="w-full py-2.5 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn text-xs font-bold shadow-sm"
            >
              {t.saveShopDetails || 'Save Shop Details'}
            </button>
          </form>
        )}
      </div>

      {/* Encrypted Backup & Restore Vault Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-card p-5 border border-slate-700 shadow-elevated space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white">{t.encryptedVault}</h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {t.encryptedVaultSubtext}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="open-vault-export-btn"
            onClick={() => {
              setVaultDefaultTab('export');
              setIsVaultModalOpen(true);
            }}
            className="py-2.5 px-3 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.createBackup}</span>
          </button>
          <button
            id="open-vault-restore-btn"
            onClick={() => {
              setVaultDefaultTab('restore');
              setIsVaultModalOpen(true);
            }}
            className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded-btn text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.restoreLedger}</span>
          </button>
        </div>
      </div>

      {/* Main Tool Actions */}
      <div className="bg-white rounded-card border border-[#E5EAE7] divide-y divide-slate-100 shadow-subtle overflow-hidden">
        {/* Overdue Customers */}
        <button
          onClick={onNavigateToOverdue}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#17231E]">{t.overdueCustomers}</p>
              <p className="text-xs text-[#64748B]">{t.overdueSubtext}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Import JSON Data (Evaluator Requirement) */}
        <button
          onClick={onNavigateToImport}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#087F5B] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#17231E]">{t.importData}</p>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-[#066348] px-2 py-0.5 rounded-full">
                  JSON
                </span>
              </div>
              <p className="text-xs text-[#64748B]">Import customer and transaction records from a JSON file</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Export Excel (.xlsx) using Master Template */}
        <button
          onClick={handleExportExcel}
          disabled={exportingExcel}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#087F5B] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#17231E]">{t.exportExcel}</p>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-[#066348] px-2 py-0.5 rounded-full">
                  Template
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {exportingExcel ? 'Generating workbook...' : 'Uses master Excel ledger template with borders & styling'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Export CSV (Separate Option) */}
        <button
          onClick={handleExportCSV}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#17231E]">{t.exportCsv}</p>
              <p className="text-xs text-[#64748B]">Download full customer & transaction CSV file</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Load Sample Customers */}
        <button
          onClick={handleLoadSample}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#17231E]">{t.loadSampleCustomers}</p>
              <p className="text-xs text-[#64748B]">1-click populate sample customer accounts & transactions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Language Toggle & System Info */}
      <div className="bg-white rounded-card p-5 border border-[#E5EAE7] shadow-subtle space-y-4">
        {/* Language Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#087F5B]" />
            <span className="text-xs font-bold text-[#17231E] uppercase tracking-wider">
              Language / భాష / भाषा
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              id="lang-en-btn"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                language === 'en'
                  ? 'bg-white text-[#087F5B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              English
            </button>
            <button
              id="lang-te-btn"
              onClick={() => setLanguage('te')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                language === 'te'
                  ? 'bg-white text-[#087F5B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              తెలుగు (Telugu)
            </button>
            <button
              id="lang-hi-btn"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                language === 'hi'
                  ? 'bg-white text-[#087F5B] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Effective Date Info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{t.effectiveDateLabel}:</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span>{effectiveToday}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              {window.location.search.includes('today=') ? 'Simulated Date' : 'Local browser date'}
            </span>
          </div>
        </div>
      </div>

      {/* Browser Storage Persistence & Safety Notice */}
      <div className="bg-amber-50/70 rounded-card p-4 border border-amber-200/80 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold text-amber-950">{t.storageNoticeTitle}</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {t.storageNoticeText}
          </p>
          <p className="text-[11px] text-amber-900 font-semibold mt-1">
            {t.storageNoticeTip}
          </p>
        </div>
      </div>

      {/* Help & Data Privacy FAQ (Explains App Reset vs Browser Clear Site Data) */}
      <div className="bg-white rounded-card p-5 border border-[#E5EAE7] shadow-subtle space-y-3">
        <button
          onClick={() => setShowHelpDetails(!showHelpDetails)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#17231E]">
            <HelpCircle className="w-4 h-4 text-[#087F5B]" />
            <span>Data Isolation & Privacy Guide</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showHelpDetails ? 'rotate-180' : ''}`} />
        </button>

        {showHelpDetails && (
          <div className="pt-2 text-xs text-slate-600 space-y-3 leading-relaxed border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-800">In-App Reset Local Ledger</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Resets customers, credit records, payments, and receipt attachments <strong>only for the currently active shop profile</strong> on this browser. Any other shop profiles you maintain remain intact, and data on other devices is completely unaffected.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Browser-Level "Clear Site Data"</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This is a global browser maintenance tool (in browser Settings → Clear Browsing Data). It erases all cookies, LocalStorage keys, and IndexedDB stores across all shops and domains on this browser profile.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Local-First Storage Boundary</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All records stay strictly on your local browser. Customer phone numbers and financial notes are never transmitted to external servers or logged in plain text.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reset Local Ledger (Critical Multi-User Isolated Reset) */}
      <div className="bg-rose-50/50 rounded-card p-4 border border-rose-200">
        {!showClearConfirm ? (
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <p className="text-xs font-bold text-rose-900">{t.resetLedgerTitle}</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {t.resetLedgerSubtext}
              </p>
            </div>
            <button
              id="reset-ledger-trigger-btn"
              onClick={() => setShowClearConfirm(true)}
              className="py-1.5 px-3 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-50 flex-shrink-0"
            >
              {t.resetLedgerBtn}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">
                  {language === 'en' ? `Reset ledger for "${shopName}"?` : `${t.resetConfirmTitle} ("${shopName}")`}
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  {t.resetConfirmText} <strong>{shopName}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                id="reset-cancel-btn"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                id="reset-confirm-btn"
                onClick={handleClearActiveShop}
                className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
              >
                {language === 'en' ? `Yes, Reset ${shopName}` : `${t.resetConfirmBtn} (${shopName})`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Encrypted Backup & Restore Vault Modal */}
      <BackupVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        defaultTab={vaultDefaultTab}
      />
    </div>
  );
};
