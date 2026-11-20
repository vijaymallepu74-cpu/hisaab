import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Upload, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useToast } from './Toast';
import { formatINR } from '../utils/format';
import { VaultPayloadData } from '../utils/crypto';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'export' | 'restore';
}

export const BackupVaultModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultTab = 'export',
}) => {
  const { 
    shopName, 
    activeShopId,
    customers, 
    transactions, 
    overallSummary,
    exportEncryptedBackup,
    previewEncryptedBackup,
    restoreEncryptedBackup,
  } = useLedger();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'export' | 'restore'>(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setRestoreError(null);
      setExportError(null);
      setRestorePreview(null);
    }
  }, [isOpen, defaultTab]);

  // Export State
  const [exportPass, setExportPass] = useState('');
  const [exportPassConfirm, setExportPassConfirm] = useState('');
  const [showExportPass, setShowExportPass] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restorePass, setRestorePass] = useState('');
  const [showRestorePass, setShowRestorePass] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<(VaultPayloadData & { totalOutstanding: number }) | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError(null);

    if (!exportPass || exportPass.length < 4) {
      setExportError('Password must be at least 4 characters long.');
      return;
    }

    if (exportPass !== exportPassConfirm) {
      setExportError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsExporting(true);
      const jsonStr = await exportEncryptedBackup(exportPass);

      // Trigger browser download of .hisaab file
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeName = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'hisaab';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${safeName}_backup_${dateStr}.hisaab`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Encrypted backup (.hisaab) exported successfully!`, 'success');
      setExportPass('');
      setExportPassConfirm('');
      onClose();
    } catch (err: any) {
      setExportError(err.message || 'Failed to generate encrypted backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setRestoreError(null);
    setRestorePreview(null);
    if (!file) {
      setRestoreFile(null);
      setRestoreFileContent(null);
      return;
    }

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileContent(content);
    };
    reader.onerror = () => {
      setRestoreError('Failed to read selected file.');
    };
    reader.readAsText(file);
  };

  const handleDecryptAndPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError(null);
    setRestorePreview(null);

    if (!restoreFileContent) {
      setRestoreError('Please select a valid .hisaab backup file.');
      return;
    }

    if (!restorePass) {
      setRestoreError('Please enter the vault password.');
      return;
    }

    try {
      setIsDecrypting(true);
      const preview = await previewEncryptedBackup(restoreFileContent, restorePass);
      setRestorePreview(preview);
    } catch (err: any) {
      setRestoreError(err.message || 'Incorrect password or corrupted backup file.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    try {
      setIsRestoring(true);
      await restoreEncryptedBackup(restorePreview);
      showToast(`Ledger for "${restorePreview.shop.name}" restored successfully!`, 'success');
      onClose();
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore ledger.');
    } finally {
      setIsRestoring(false);
    }
  };

  const screenshotCount = transactions.filter(t => t.screenshotId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#E5EAE7] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 to-[#087F5B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-base font-bold leading-tight">Encrypted Backup & Restore</h2>
              <p className="text-[11px] text-emerald-200">AES-256-GCM Secure Vault (.hisaab)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            id="vault-export-tab-btn"
            onClick={() => {
              setActiveTab('export');
              setRestorePreview(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-[#087F5B] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>
          <button
            id="vault-restore-tab-btn"
            onClick={() => {
              setActiveTab('restore');
              setExportError(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'restore'
                ? 'bg-white text-[#087F5B] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Ledger</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'export' ? (
            /* EXPORT TAB */
            <form onSubmit={handleExport} className="space-y-4">
              {/* Summary Stats */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-950 font-bold">
                  <span>Active Shop: {shopName}</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                    {activeShopId}
                  </span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  {customers.length} Customers • {transactions.length} Transactions • {screenshotCount} Receipt Attachments
                </p>
                <p className="text-emerald-700 text-[11px] font-semibold">
                  Total Outstanding: {formatINR(overallSummary.totalOutstanding)}
                </p>
              </div>

              {exportError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{exportError}</span>
                </div>
              )}

              {/* Password Fields */}
              <div>
                <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1">
                  Set Vault Password
                </label>
                <div className="relative">
                  <input
                    id="vault-export-pass-inp"
                    type={showExportPass ? 'text' : 'password'}
                    value={exportPass}
                    onChange={(e) => setExportPass(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3 py-2 pr-10 rounded-inp border border-[#E5EAE7] text-sm font-medium outline-none focus:border-[#087F5B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPass(!showExportPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showExportPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  id="vault-export-confirm-inp"
                  type={showExportPass ? 'text' : 'password'}
                  value={exportPassConfirm}
                  onChange={(e) => setExportPassConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-inp border border-[#E5EAE7] text-sm font-medium outline-none focus:border-[#087F5B]"
                />
              </div>

              {/* Security Alert */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Critical Security Notice</span>
                </div>
                <p className="leading-relaxed">
                  Your backup is encrypted with <strong>AES-256-GCM</strong>. If you forget or lose this password, this backup file cannot be decrypted or recovered by anyone.
                </p>
              </div>

              <button
                id="vault-export-submit-btn"
                type="submit"
                disabled={isExporting}
                className="w-full py-3 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Encrypting & Packaging...' : 'Download Encrypted .hisaab File'}</span>
              </button>
            </form>
          ) : (
            /* RESTORE TAB */
            <div className="space-y-4">
              {!restorePreview ? (
                <form onSubmit={handleDecryptAndPreview} className="space-y-4">
                  {/* File Upload Area */}
                  <div>
                    <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1">
                      Select .hisaab File
                    </label>
                    <input
                      ref={fileInputRef}
                      id="vault-file-inp"
                      type="file"
                      accept=".hisaab,application/json"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#087F5B] hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {restoreFile && (
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        Selected: <strong>{restoreFile.name}</strong> ({(restoreFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1">
                      Vault Decryption Password
                    </label>
                    <div className="relative">
                      <input
                        id="vault-restore-pass-inp"
                        type={showRestorePass ? 'text' : 'password'}
                        value={restorePass}
                        onChange={(e) => setRestorePass(e.target.value)}
                        placeholder="Enter password used during export"
                        className="w-full px-3 py-2 pr-10 rounded-inp border border-[#E5EAE7] text-sm font-medium outline-none focus:border-[#087F5B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRestorePass(!showRestorePass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showRestorePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {restoreError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>{restoreError}</span>
                    </div>
                  )}

                  <button
                    id="vault-decrypt-btn"
                    type="submit"
                    disabled={isDecrypting || !restoreFileContent || !restorePass}
                    className="w-full py-3 bg-[#087F5B] hover:bg-[#066348] text-white rounded-btn font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isDecrypting ? 'Decrypting Vault...' : 'Decrypt & Inspect Backup'}</span>
                  </button>
                </form>
              ) : (
                /* PRE-RESTORE PREVIEW CARD */
                <div id="vault-preview-card" className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Backup Decrypted & Verified!</span>
                    </div>

                    <div className="text-xs text-emerald-900 space-y-1.5 pt-1 border-t border-emerald-200">
                      <p>• Shop Name: <strong>{restorePreview.shop.name}</strong></p>
                      <p>• Customers to Restore: <strong>{restorePreview.customers.length}</strong></p>
                      <p>• Transactions to Restore: <strong>{restorePreview.transactions.length}</strong></p>
                      <p>• Payment Receipts Included: <strong>{Object.keys(restorePreview.screenshots || {}).length}</strong></p>
                      <p>• Total Outstanding: <strong>{formatINR(restorePreview.totalOutstanding)}</strong></p>
                      {restorePreview.exportedAt && (
                        <p className="text-[10px] text-emerald-700">
                          Exported on: {new Date(restorePreview.exportedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Warning Confirmation */}
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-950">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Action Warning</span>
                    </div>
                    <p className="leading-relaxed">
                      Restoring will completely replace the current customer records, transactions, and attachments for <strong>{shopName}</strong>. Other shop profiles on this device will not be affected.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      id="vault-cancel-restore-btn"
                      onClick={() => setRestorePreview(null)}
                      className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      id="vault-confirm-restore-btn"
                      onClick={handleConfirmRestore}
                      disabled={isRestoring}
                      className="flex-1 py-2.5 bg-[#087F5B] hover:bg-[#066348] text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <span>{isRestoring ? 'Restoring...' : 'Confirm & Restore Ledger'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
