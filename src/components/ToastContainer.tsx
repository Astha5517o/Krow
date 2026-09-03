import React from 'react';
import { useShop } from '../context/ShopContext';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useShop();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md pointer-events-auto transition-all transform animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-[#F8E6E4] border-[#C1443B]/30 text-[#C1443B]'
              : toast.type === 'info'
              ? 'bg-[#E7F0EA] border-[#2F6B4F]/30 text-[#1E4632]'
              : 'bg-[#1E4632] border-[#2F6B4F] text-[#FAF7F0]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#C1443B]" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 shrink-0 text-[#2F6B4F]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#D9A62E]" />
          )}
          <span className="leading-snug">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
