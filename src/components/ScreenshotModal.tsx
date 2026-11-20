import React from 'react';
import { X, Download } from 'lucide-react';

interface Props {
  imageUrl: string | null;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<Props> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `hisaab_payment_proof_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Payment Screenshot Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex items-center justify-center bg-slate-900/5 max-h-[75vh] overflow-auto">
          <img
            src={imageUrl}
            alt="Payment receipt full size"
            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
          />
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Securely saved and verified via IndexedDB browser storage.
          </p>
        </div>
      </div>
    </div>
  );
};
