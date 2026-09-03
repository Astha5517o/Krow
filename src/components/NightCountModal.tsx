import React, { useState, useMemo } from 'react';
import { Moon, X, Check, TrendingUp, AlertCircle, Search, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';

interface NightCountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NightCountModal: React.FC<NightCountModalProps> = ({ isOpen, onClose }) => {
  const { items, profile, logNightCount } = useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);

  // Map of itemId -> remaining count string
  const [counts, setCounts] = useState<{ [itemId: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    items.forEach((item) => {
      initial[item.id] = item.quantity.toString();
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');

  // Update counts when items change
  React.useEffect(() => {
    if (isOpen) {
      const initial: { [key: string]: string } = {};
      items.forEach((item) => {
        initial[item.id] = item.quantity.toString();
      });
      setCounts(initial);
      setSearchQuery('');
    }
  }, [isOpen, items]);

  const handleCountChange = (itemId: string, val: string) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  // Compute live totals
  const { totalSoldUnits, totalProfitCalculated, changedItemCount } = useMemo(() => {
    let soldUnits = 0;
    let profit = 0;
    let changed = 0;

    items.forEach((item) => {
      const countedStr = counts[item.id];
      if (countedStr !== undefined && countedStr !== '') {
        const counted = parseFloat(countedStr) || 0;
        if (counted !== item.quantity) {
          changed++;
        }
        if (counted < item.quantity) {
          const sold = item.quantity - counted;
          soldUnits += sold;
          profit += sold * (item.sellPrice - item.buyPrice);
        }
      }
    });

    return {
      totalSoldUnits: soldUnits,
      totalProfitCalculated: Math.round(profit * 10) / 10,
      changedItemCount: changed,
    };
  }, [items, counts]);

  const handleSave = () => {
    const entries = items.map((item) => ({
      itemId: item.id,
      countedQty: parseFloat(counts[item.id]) || 0,
    }));

    logNightCount(entries, notes.trim() || undefined);
    onClose();
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E4DFD2] my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4DFD2] flex items-center justify-between bg-[#1E4632] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0]/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-[#D9A62E]" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.nightCountTitle}</h3>
              <p className="text-[11px] text-[#FAF7F0]/80">{t.nightCountSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live computed banner */}
        <div className="p-3.5 bg-[#FBF0D9] border-b border-[#E4DFD2] flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-[#9A7016]">
              {lang === 'hi' ? 'रात की गिनती से अनुमानित कमाई:' : lang === 'pa' ? 'ਰਾਤ ਦੀ ਗਿਣਤੀ ਤੋਂ ਕਮਾਈ:' : 'Estimated profit tonight:'}
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-[#262421]">
              ₹{totalProfitCalculated.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-semibold text-[#726C60]">
                ({totalSoldUnits} {lang === 'hi' ? 'पीस बिके' : lang === 'pa' ? 'ਪੀਸ ਵਿਕੇ' : 'units sold'})
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] bg-white px-2 py-1 rounded-lg border border-[#D9A62E]/40 font-bold text-[#9A7016]">
              {changedItemCount} {lang === 'hi' ? 'सामान बदले' : lang === 'pa' ? 'ਸਮਾਨ ਬਦਲੇ' : 'items updated'}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-[#E4DFD2] bg-[#FAF7F0]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#726C60] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'सामान खोजें...' : lang === 'pa' ? 'ਸਮਾਨ ਖੋਜੋ...' : 'Search item to count...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E4DFD2] bg-white text-xs text-[#262421] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Items counting list */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-[#E4DFD2]/60">
          {filteredItems.map((item) => {
            const countedStr = counts[item.id] ?? '';
            const countedNum = parseFloat(countedStr) || 0;
            const sold = item.quantity > countedNum ? item.quantity - countedNum : 0;
            const itemProfit = Math.round(sold * (item.sellPrice - item.buyPrice) * 10) / 10;

            return (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[#262421]">{item.name}</span>
                    {item.spoilQuickly && (
                      <span className="text-[9px] font-bold bg-[#FBF0D9] text-[#9A7016] px-1 py-0.2 rounded-sm">
                        {lang === 'hi' ? 'ताज़ा' : lang === 'pa' ? 'ਤਾਜ਼ਾ' : 'Perishable'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#726C60] flex items-center gap-2 mt-0.5">
                    <span>
                      {t.previousStock}: <strong>{item.quantity} {item.unit}</strong>
                    </span>
                    {sold > 0 && (
                      <span className="text-[#2F6B4F] font-bold">
                        • {t.soldToday}: {sold} {item.unit} (+₹{itemProfit})
                      </span>
                    )}
                  </div>
                </div>

                {/* Input field for tonight's count */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right">
                    <label className="block text-[10px] font-bold text-[#726C60]">{t.leftTonight}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={counts[item.id] ?? ''}
                        onChange={(e) => handleCountChange(item.id, e.target.value)}
                        className="w-16 sm:w-20 px-2 py-1.5 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm font-extrabold text-[#1E4632] text-center focus:bg-white focus:border-[#1E4632] focus:outline-hidden shadow-2xs"
                      />
                      <span className="text-xs font-semibold text-[#726C60]">{item.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4DFD2] bg-[#FAF7F0] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E4DFD2] bg-white text-xs font-bold text-[#726C60] hover:bg-[#E4DFD2]/40 cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#1E4632] text-white text-xs sm:text-sm font-bold hover:bg-[#2F6B4F] transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveClosingCountBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
