import React, { useEffect } from 'react';
import { Language } from '../types';

export type CalculationInfoType = 'todayProfit' | 'weekProfit' | 'margin' | 'udhaarRepaid' | 'customerRepaid';

export interface CalculationInfoData {
  type: CalculationInfoType;
  title: string;
  formula: string;
  explanation: string;
  example?: string;
  statsBreakdown?: { label: string; value: string; color?: string }[];
}

interface CalculationInfoModalProps {
  language: Language;
  data: CalculationInfoData | null;
  onClose: () => void;
}

export const CalculationInfoModal: React.FC<CalculationInfoModalProps> = ({
  language,
  data,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!data) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl p-5 flex flex-col gap-4 animate-scale-up text-[#262421]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4DFD2] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">info</span>
            </div>
            <h3 className="text-base font-bold text-[#16291E] leading-tight">
              {data.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="बंद करें"
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center border border-[#E4DFD2] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Formula Box */}
        <div className="bg-white rounded-2xl border border-[#2F6B4F]/20 p-3.5 flex flex-col gap-1.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6B4F]">
            {language === 'en'
              ? 'Formula'
              : language === 'pa'
              ? 'ਫਾਰਮੂਲਾ'
              : language === 'ja'
              ? '計算式'
              : 'हिसाब का सूत्र'}
          </span>
          <div className="text-sm font-extrabold font-mono text-[#16291E] bg-[#E7F0EA]/60 px-3 py-2 rounded-xl border border-[#2F6B4F]/15">
            {data.formula}
          </div>
        </div>

        {/* Explanation text */}
        <div className="text-xs text-[#524E45] leading-relaxed">
          {data.explanation}
        </div>

        {/* Optional Stats Breakdown */}
        {data.statsBreakdown && data.statsBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#726C60]">
              {language === 'en'
                ? 'Current Breakdown'
                : language === 'pa'
                ? 'ਮੌਜੂਦਾ ਵੇਰਵਾ'
                : language === 'ja'
                ? '現在の内訳'
                : 'ताज़ा ब्योरा'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.statsBreakdown.map((sb, idx) => (
                <div key={idx} className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E4DFD2]">
                  <span className="text-[10px] text-[#726C60] block truncate">{sb.label}</span>
                  <span
                    className={`font-bold font-display text-sm ${
                      sb.color || 'text-[#262421]'
                    }`}
                  >
                    {sb.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Example */}
        {data.example && (
          <div className="text-[11px] text-[#726C60] bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4DFD2] italic">
            💡 {data.example}
          </div>
        )}

        {/* Footer Confirmation */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#2F6B4F] hover:bg-[#23533D] text-white font-bold text-xs shadow-sm transition-all active:scale-[0.99]"
        >
          {language === 'en'
            ? 'Got it'
            : language === 'pa'
            ? 'ਸਮਝ ਗਿਆ'
            : language === 'ja'
            ? '閉じる'
            : 'समझ गया / ठीक है'}
        </button>
      </div>
    </div>
  );
};
