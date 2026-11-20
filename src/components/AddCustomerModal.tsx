import React, { useState } from 'react';
import { X, User, Phone, Check } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useToast } from './Toast';
import { normalizePhone, isValidIndianPhone } from '../utils/format';
import { translations } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: (phone: string) => void;
}

export const AddCustomerModal: React.FC<Props> = ({ isOpen, onClose, onSuccessNavigate }) => {
  const { addCustomer, language } = useLedger();
  const { showToast } = useToast();
  const t = translations[language];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    if (error) setError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const cleanPhone = normalizePhone(phone);

    if (!trimmedName) {
      setError('Customer name cannot be empty');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Phone number must contain exactly 10 digits');
      return;
    }

    if (!isValidIndianPhone(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number (starts with 6, 7, 8, or 9)');
      return;
    }

    setSubmitting(true);
    const result = addCustomer(trimmedName, cleanPhone);
    setSubmitting(false);

    if (result.success) {
      showToast(`Customer ${trimmedName} added successfully!`, 'success');
      setName('');
      setPhone('');
      setError(null);
      onClose();
      if (onSuccessNavigate) {
        onSuccessNavigate(cleanPhone);
      }
    } else {
      setError(result.error || 'Failed to add customer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-[20px] sm:rounded-[20px] p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#17231E]">{t.addCustomer}</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Register a new customer to maintain their ledger</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-btn font-medium flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
              Customer Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Ramesh Patel"
                autoFocus
                className="w-full pl-11 pr-4 py-3 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-[15px] font-medium transition-all text-[#17231E] placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
              10-Digit Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                maxLength={10}
                className="w-full pl-14 pr-4 py-3 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-[15px] font-medium tracking-wide transition-all text-[#17231E] placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">Used for WhatsApp payment reminders and quick search</p>
          </div>

          <div className="pt-2 flex gap-3">
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
              className="flex-1 py-3 px-4 bg-[#087F5B] hover:bg-[#066348] text-white font-semibold text-sm rounded-btn shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-70"
            >
              <Check className="w-4 h-4" />
              <span>Save Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
