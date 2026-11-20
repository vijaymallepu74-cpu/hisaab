import React, { useState } from 'react';
import { X, Check, Trash2, Calendar, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { useLedger } from '../context/LedgerContext';
import { useToast } from './Toast';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<Props> = ({ transaction, isOpen, onClose }) => {
  const { updateTransaction, deleteTransaction } = useLedger();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setDate(transaction.date);
      setNote(transaction.note || '');
      setError(null);
      setShowConfirmDelete(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    setProcessing(true);
    const res = updateTransaction(transaction.id, {
      amount: Math.round(numAmount),
      date,
      note,
    });
    setProcessing(false);

    if (res.success) {
      showToast('Transaction updated successfully!', 'success');
      onClose();
    } else {
      setError(res.error || 'Failed to update transaction');
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    const res = await deleteTransaction(transaction.id);
    setProcessing(false);

    if (res.success) {
      showToast('Transaction deleted. Balances updated.', 'info');
      onClose();
    } else {
      setError(res.error || 'Failed to delete transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-[20px] p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#17231E]">
              Edit {transaction.type === 'credit' ? 'Credit' : 'Payment'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">Modify entry or remove from ledger</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showConfirmDelete ? (
          <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
            <h3 className="text-sm font-bold text-rose-900">Are you sure you want to delete this entry?</h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              Deleting this {transaction.type} of ₹{transaction.amount} will immediately recalculate the customer's balance. This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2 px-3 bg-white border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg hover:bg-rose-50"
              >
                No, Keep Entry
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-btn font-medium">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
                Amount (INR)
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
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-xl font-bold text-[#17231E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
                Date
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231E] uppercase tracking-wider mb-1.5">
                Note / Description
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-inp border border-[#E5EAE7] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none text-sm font-medium text-[#17231E]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="py-3 px-3 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-btn flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 border border-[#E5EAE7] hover:bg-slate-50 text-[#64748B] font-semibold text-xs rounded-btn transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="py-3 px-5 bg-[#087F5B] hover:bg-[#066348] text-white font-semibold text-xs rounded-btn shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
