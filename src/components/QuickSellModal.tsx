import React, { useState } from 'react';
import { StockItem, Language, SaleRecord } from '../types';
import { translations } from '../translations';

interface QuickSellModalProps {
  language: Language;
  stockItems: StockItem[];
  preselectedItem?: StockItem;
  onRecordSale: (sale: SaleRecord, updatedQty: number) => void;
  onClose: () => void;
  onSwitchToScanToSell?: () => void;
}

export const QuickSellModal: React.FC<QuickSellModalProps> = ({
  language,
  stockItems,
  preselectedItem,
  onRecordSale,
  onClose,
  onSwitchToScanToSell,
}) => {
  const t = translations[language];

  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem?.id || stockItems[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);

  const selectedItem = stockItems.find((i) => i.id === selectedItemId) || stockItems[0];

  if (!selectedItem) {
    return null;
  }

  const profitPerUnit = selectedItem.sellPrice - selectedItem.buyPrice;
  const totalProfit = profitPerUnit * quantity;
  const totalSaleAmount = selectedItem.sellPrice * quantity;

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    const remainingQty = Math.max(0, selectedItem.currentQuantity - quantity);

    const sale: SaleRecord = {
      id: 'sale-' + Date.now(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity,
      unit: selectedItem.unit,
      buyPrice: selectedItem.buyPrice,
      sellPrice: selectedItem.sellPrice,
      profit: totalProfit,
      totalAmount: totalSaleAmount,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };

    onRecordSale(sale, remainingQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6B4F] text-2xl fill">
              point_of_sale
            </span>
            <h3 className="text-base font-bold text-[#262421] font-display">
              {t.actionQuickSell}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-[#726C60] flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Option to switch to Barcode mode for packaged goods */}
        {onSwitchToScanToSell && (
          <button
            type="button"
            onClick={onSwitchToScanToSell}
            className="w-full p-2.5 rounded-xl bg-[#E7F0EA] border border-[#2F6B4F]/30 flex items-center justify-between text-left hover:bg-[#2F6B4F] hover:text-white group transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2F6B4F] group-hover:text-white text-lg">
                barcode_scanner
              </span>
              <span className="text-xs font-bold text-[#1E4632] group-hover:text-white">
                {language === 'en'
                  ? 'Selling packaged goods? Tap to Scan Barcode'
                  : 'पैकेज्ड सामान (कोल्ड ड्रिंक, बिस्कुट) के लिए बारकोड स्कैन करें'}
              </span>
            </div>
            <span className="material-symbols-outlined text-[#2F6B4F] group-hover:text-white text-base">
              arrow_forward
            </span>
          </button>
        )}

        <form onSubmit={handleConfirmSale} className="flex flex-col gap-3">
          {/* Select Item */}
          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1">
              {t.itemNameLabel}
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] font-semibold focus:outline-none focus:border-[#2F6B4F]"
            >
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (बचे: {item.currentQuantity} {item.unit}) — ₹{item.sellPrice}
                </option>
              ))}
            </select>
          </div>

          {/* Stepper Quantity Row */}
          <div className="p-3 rounded-2xl bg-white border border-[#E4DFD2] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#262421] block">
                बिक्री मात्रा
              </span>
              <span className="text-[11px] text-[#726C60]">
                दर: ₹{selectedItem.sellPrice} / {selectedItem.unit}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] text-lg font-bold text-[#262421] flex items-center justify-center active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 h-10 rounded-xl border border-[#E4DFD2] bg-white text-center font-bold text-base text-[#2F6B4F] focus:outline-none focus:border-[#2F6B4F]"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] text-lg font-bold text-[#262421] flex items-center justify-center active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Profit & Bill Total Card */}
          <div className="p-3.5 rounded-2xl bg-[#E7F0EA] border border-[#2F6B4F]/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#1E4632] block">
                कुल ग्राहक बिल
              </span>
              <span className="text-2xl font-extrabold text-[#1E4632] font-display">
                ₹{totalSaleAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#2F6B4F] font-bold block">
                सीधा मुनाफ़ा
              </span>
              <span className="text-lg font-extrabold text-[#2F6B4F] font-display">
                +₹{totalProfit.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-white border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              className="flex-1 h-12 bg-[#2F6B4F] hover:bg-[#1E4632] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              <span>{t.btnSell}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
