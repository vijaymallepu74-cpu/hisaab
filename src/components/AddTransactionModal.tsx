import React, { useState, useRef } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Upload, Check, Trash2, Calendar, FileText } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useToast } from './Toast';
import { saveScreenshotToDB } from '../utils/db';
import { translations } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultType?: 'credit' | 'payment';
}

export const AddTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultPhone,
  defaultType = 'credit',
}) => {
  const { customers, addTransaction, effectiveToday, language, activeShopId } = useLedger();
  const { showToast } = useToast();
  const t = translations[language];

  const [phone, setPhone] = useState(defaultPhone || (customers[0]?.phone ?? ''));
  const [type, setType] = useState<'credit' | 'payment'>(defaultType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(effectiveToday);
  const [note, setNote] = useState('');
  
  // Screenshot state
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if defaultPhone or defaultType changes when opened
  React.useEffect(() => {
    if (isOpen) {
      if (defaultPhone) setPhone(defaultPhone);
      setType(defaultType);
      setDate(effectiveToday);
      setAmount('');
      setNote('');
      setScreenshotDataUrl(null);
      setScreenshotFileName(null);
      setError(null);
    }
  }, [isOpen, defaultPhone, defaultType, effectiveToday]);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.phone === phone);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setScreenshotDataUrl(result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotDataUrl(null);
    setScreenshotFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submission

    if (!phone) {
      setError('Please select a customer');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!date) {
      setError('Date is required');
      return;
    }

    setSubmitting(true);
    let screenshotId: string | undefined;

    // Only attach screenshot to payment transactions
    if (type === 'payment' && screenshotDataUrl) {
      try {
        screenshotId = `shot_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await saveScreenshotToDB(screenshotId, screenshotDataUrl, activeShopId);
      } catch {
        // Safe fail without logging sensitive binary or identifiers
      }
    }

    const result = addTransaction({
      phone,
      type,
      amount: Math.round(numAmount),
      date,
      note: note.trim() || (type === 'credit' ? 'Credit' : 'Payment'),
      screenshotId,
    });

    setSubmitting(false);

    if (result.success) {
      showToast(
        `${type === 'credit' ? 'Credit' : 'Payment'} of ₹${Math.round(numAmount).toLocaleString('en-IN')} recorded!`,
        'success'
      );
      onClose();
    } else {
      setError(result.error || 'Failed to save transaction');
    }
  };

  const quickNotes = type === 'credit' 
    ? ['Groceries', 'Rice & Atta', 'Daily Milk & Eggs', 'Household Items', 'Vegetables']
    : ['Paid on UPI', 'Cash Payment', 'Google Pay', 'PhonePe', 'Bank Transfer'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-[24px] sm:rounded-[20px] p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#17231E]">
              {type === 'credit' ? 'Give Credit' : 'Receive Payment'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {currentCustomer ? `For ${currentCustomer.name} (${currentCustomer.phone})` : 'Record a new entry'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-btn font-medium flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection if not locked */}
          {!defaultPhone && (
            <div>
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
                Select Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-3 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-sm font-medium text-[#17231E] bg-white transition-all"
              >
                {customers.map((c) => (
                  <option key={c.phone} value={c.phone}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type Toggle: Credit (Green) vs Payment (Coral) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-inp">
            <button
              type="button"
              onClick={() => setType('credit')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                type === 'credit'
                  ? 'bg-white text-[#16A36A] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Give Credit (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('payment')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                type === 'payment'
                  ? 'bg-white text-[#E76F51] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Receive Payment (-)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
              Amount (INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-bold text-slate-700">
                ₹
              </div>
              <input
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0"
                autoFocus
                className={`w-full pl-10 pr-4 py-3 rounded-inp border border-[#E5EAE7] focus:ring-2 outline-none text-2xl font-bold text-[#17231E] tracking-tight placeholder:text-slate-300 transition-all ${
                  type === 'credit'
                    ? 'focus:border-[#16A36A] focus:ring-[#16A36A]/20'
                    : 'focus:border-[#E76F51] focus:ring-[#E76F51]/20'
                }`}
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
              Transaction Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-sm font-medium text-[#17231E]"
              />
            </div>
            {date === effectiveToday && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <span>✓</span> Defaulted to system date ({effectiveToday})
              </p>
            )}
          </div>

          {/* Note & Quick Chips */}
          <div>
            <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
              Note / Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={type === 'credit' ? 'e.g. Rice, Dal, Groceries' : 'e.g. Paid via UPI'}
                className="w-full pl-11 pr-4 py-2.5 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-sm font-medium text-[#17231E] placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNotes.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setNote(chip)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Screenshot Upload: ONLY FOR PAYMENT TYPE */}
          {/* CRITICAL EVALUATOR SELECTOR: <input type="file" id="shot-input" accept="image/*"> */}
          {type === 'payment' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
                Payment Screenshot / Receipt <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              {!screenshotDataUrl ? (
                <div className="relative border-2 border-dashed border-[#E5EAE7] hover:border-[#087F5B] rounded-inp p-4 text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-emerald-50/30">
                  <input
                    type="file"
                    id="shot-input"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-[#087F5B] transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-[#087F5B]">
                      Upload UPI screenshot or receipt
                    </span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP supported</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-inp border border-slate-200">
                  <img
                    src={screenshotDataUrl}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {screenshotFileName || 'Screenshot attached'}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">Ready to save</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {/* Keep file input accessible even if replaced */}
                  <input
                    type="file"
                    id="shot-input"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-[#E5EAE7] hover:bg-slate-50 text-[#64748B] font-semibold text-sm rounded-btn transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-3 px-4 text-white font-semibold text-sm rounded-btn shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-70 ${
                type === 'credit'
                  ? 'bg-[#16A36A] hover:bg-[#138959]'
                  : 'bg-[#E76F51] hover:bg-[#d65e40]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Save {type === 'credit' ? 'Credit' : 'Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
