import React, { useState } from 'react';
import { StockItem, Language, NightCountItem, SaleRecord } from '../types';
import { translations } from '../translations';
import { localizeCategory, localizeItemName, localizeUnit } from '../utils/localization';

interface NightCountModalProps {
  language: Language;
  stockItems: StockItem[];
  onSaveCount: (updatedStock: { id: string; newQty: number }[], sales: SaleRecord[], totalProfit: number) => void;
  onClose: () => void;
}

export const NightCountModal: React.FC<NightCountModalProps> = ({
  language,
  stockItems,
  onSaveCount,
  onClose,
}) => {
  const t = translations[language];

  // Eligible items: perishable items or items with sales history / active stock
  const candidateItems = stockItems.filter((i) => i.isPerishable || i.currentQuantity > 0);

  const [countState, setCountState] = useState<Record<string, { closingStock: number; isReturn: boolean }>>(() => {
    const initial: Record<string, { closingStock: number; isReturn: boolean }> = {};
    candidateItems.forEach((item) => {
      initial[item.id] = {
        closingStock: item.currentQuantity,
        isReturn: false,
      };
    });
    return initial;
  });

  const [selectedCat, setSelectedCat] = useState('all');

  const categories = ['all', ...candidateItems.map((i) => i.category).filter((cat, index, arr) => arr.indexOf(cat) === index)];

  const filteredItems = candidateItems.filter((item) => {
    return selectedCat === 'all' || item.category === selectedCat;
  });

  const updateClosing = (itemId: string, val: number) => {
    setCountState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        closingStock: Math.max(0, val),
      },
    }));
  };

  const toggleReturn = (itemId: string) => {
    setCountState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isReturn: !prev[itemId]?.isReturn,
      },
    }));
  };

  // Calculate sold quantities and profit
  let totalDailyProfit = 0;
  let totalSoldUnits = 0;

  const calculatedItems: NightCountItem[] = candidateItems.map((item) => {
    const morning = item.currentQuantity + 15; // Morning baseline
    const closing = countState[item.id]?.closingStock ?? item.currentQuantity;
    const isReturn = countState[item.id]?.isReturn ?? false;
    const sold = Math.max(0, morning - closing);
    const profitPerUnit = item.sellPrice - item.buyPrice;
    const itemProfit = sold * profitPerUnit;

    totalDailyProfit += itemProfit;
    totalSoldUnits += sold;

    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      morningStock: morning,
      closingStock: closing,
      calculatedSold: sold,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      profit: itemProfit,
      isPerishable: item.isPerishable,
      isExpiryReturn: isReturn,
    };
  });

  const handleFinish = () => {
    const updatedStock = candidateItems.map((item) => ({
      id: item.id,
      newQty: countState[item.id]?.closingStock ?? item.currentQuantity,
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    const generatedSales: SaleRecord[] = calculatedItems
      .filter((ci) => ci.calculatedSold > 0)
      .map((ci) => ({
        id: 'night-sale-' + ci.itemId + '-' + Date.now(),
        itemId: ci.itemId,
        itemName: ci.name,
        quantity: ci.calculatedSold,
        unit: ci.unit,
        buyPrice: ci.buyPrice,
        sellPrice: ci.sellPrice,
        profit: ci.profit,
        totalAmount: ci.calculatedSold * ci.sellPrice,
        date: todayStr,
        timestamp: Date.now(),
      }));

    onSaveCount(updatedStock, generatedSales, totalDailyProfit);
    onClose();
  };

  return (
    <div id="night-count-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full max-h-[94vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#FBF0D9] text-[#7a5900] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl fill">bedtime</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#262421] font-display">
                {t.nightCountTitle}
              </h2>
              <span className="text-[11px] text-[#726C60] block">
                {t.nightCountHeaderTitle}
              </span>
            </div>
          </div>
          <button
            id="close-night-count-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Progress & Info Banner */}
        <div className="p-3 bg-[#E7F0EA] border-b border-[#2F6B4F]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6B4F] text-lg fill">verified</span>
            <span className="text-xs font-bold text-[#1E4632]">
              {t.pendingCountBadge}: {candidateItems.length} {t.itemsCheckingCount}
            </span>
          </div>
          <span className="text-[11px] text-[#2F6B4F] font-bold">
            {t.todaySalesCount}: {totalSoldUnits}
          </span>
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="px-4 py-2 bg-white border-b border-[#E4DFD2] flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  selectedCat === cat
                    ? 'bg-[#2F6B4F] text-white'
                    : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#726C60]'
                }`}
                type="button"
              >
                {cat === 'all' ? t.filterAll : localizeCategory(cat, language)}
              </button>
            ))}
          </div>
        )}

        {/* Item List with Stepper */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1">
          {filteredItems.map((item) => {
            const closingVal = countState[item.id]?.closingStock ?? item.currentQuantity;
            const isReturnVal = countState[item.id]?.isReturn ?? false;
            const morningVal = item.currentQuantity + 15;
            const soldVal = Math.max(0, morningVal - closingVal);
            const profitVal = soldVal * (item.sellPrice - item.buyPrice);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E4DFD2] p-3.5 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.isPerishable ? 'bg-[#FBF0D9] text-[#7a5900]' : 'bg-[#E7F0EA] text-[#2F6B4F]'
                    }`}>
                      <span className="material-symbols-outlined text-lg">
                        {item.isPerishable ? 'alarm' : 'inventory_2'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-[#262421] truncate">
                        {localizeItemName(item.name, language)}
                      </span>
                      <div className="text-xs text-[#726C60] flex items-center gap-2 mt-0.5">
                        <span>
                          {t.morningStockLabel}: {morningVal} {localizeUnit(item.unit, language)}
                        </span>
                        <span className="font-bold text-[#2F6B4F]">
                          • {t.soldCountLabel}: {soldVal}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-[#1E4632] font-display">
                      +₹{profitVal.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-[#726C60] block">{t.profitBadge}</span>
                  </div>
                </div>

                {/* Counter Input Row */}
                <div className="flex items-center justify-between bg-[#FAF7F0] p-2 rounded-xl border border-[#E4DFD2]">
                  <span className="text-xs font-bold text-[#262421]">
                    {t.enterRemainingStockLabel}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateClosing(item.id, closingVal - 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-[#E4DFD2] text-base font-bold text-[#262421] flex items-center justify-center active:scale-90"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={closingVal}
                      onChange={(e) => updateClosing(item.id, parseInt(e.target.value, 10) || 0)}
                      className="w-14 h-8 rounded-lg border border-[#E4DFD2] bg-white text-center font-bold text-sm text-[#2F6B4F] focus:outline-none focus:border-[#2F6B4F]"
                    />
                    <button
                      type="button"
                      onClick={() => updateClosing(item.id, closingVal + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-[#E4DFD2] text-base font-bold text-[#262421] flex items-center justify-center active:scale-90"
                    >
                      +
                    </button>
                    <span className="text-xs text-[#726C60] font-medium min-w-[32px]">
                      {localizeUnit(item.unit, language)}
                    </span>
                  </div>
                </div>

                {/* Perishable Warning & Return Option */}
                {item.isPerishable && (
                  <div className="p-2.5 rounded-xl bg-[#FBF0D9] border border-[#D9A62E]/30 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7a5900]">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>{t.perishableWarning}</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={isReturnVal}
                        onChange={() => toggleReturn(item.id)}
                        className="w-4 h-4 rounded text-[#2F6B4F] focus:ring-[#2F6B4F]"
                      />
                      <span className="text-xs font-bold text-[#262421]">
                        {t.markExpiryReturn} ({t.supplierReturnLabel})
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Closing Reconcile Footer */}
        <div className="p-4 bg-white border-t border-[#E4DFD2] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#726C60]">
              {t.estimatedDailyProfitLabel}
            </span>
            <span className="text-xl font-extrabold text-[#1E4632] font-display">
              ₹{totalDailyProfit.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            id="save-night-count-btn"
            type="button"
            onClick={handleFinish}
            className="w-full h-12 bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{t.saveCountBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
