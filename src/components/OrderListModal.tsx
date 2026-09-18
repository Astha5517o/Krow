import React, { useState, useMemo } from 'react';
import { StockItem, Language } from '../types';
import { translations } from '../translations';
import { localizeItemName, localizeUnit } from '../utils/localization';

interface OrderListModalProps {
  language: Language;
  stockItems: StockItem[];
  onClose: () => void;
  onUpdateItemQuantity?: (itemId: string, newQty: number) => void;
}

interface OrderLine {
  item: StockItem;
  packsCount: number; // Number of cartons/crates/bundles
  totalUnits: number; // packsCount * packSize (or calculated units)
  totalCost: number;
  selected: boolean;
}

export const OrderListModal: React.FC<OrderListModalProps> = ({
  language,
  stockItems,
  onClose,
}) => {
  const t = translations[language];

  // Eligible items: currentQuantity <= reorderLevel, or low stock
  const candidateItems = useMemo(() => {
    return stockItems.filter((item) => item.currentQuantity <= item.reorderLevel);
  }, [stockItems]);

  // If candidate items are empty, fall back to top 3 lowest stock items for demonstration
  const displaySourceItems = useMemo(() => {
    if (candidateItems.length > 0) return candidateItems;
    return [...stockItems].sort((a, b) => a.currentQuantity - b.currentQuantity).slice(0, 3);
  }, [candidateItems, stockItems]);

  // Initial order lines with wholesale rounding
  const [orderLines, setOrderLines] = useState<OrderLine[]>(() => {
    return displaySourceItems.map((item) => {
      const packSize = item.packSize || 10;
      const deficit = Math.max(1, (item.reorderLevel * 2) - item.currentQuantity);
      const packsCount = Math.max(1, Math.ceil(deficit / packSize));
      const totalUnits = packsCount * packSize;
      const totalCost = totalUnits * item.buyPrice;

      return {
        item,
        packsCount,
        totalUnits,
        totalCost,
        selected: true,
      };
    });
  });

  const [selectedSupplier, setSelectedSupplier] = useState('all');

  const suppliers = useMemo(() => {
    const s = new Set<string>();
    orderLines.forEach((ol) => {
      if (ol.item.supplierName) s.add(ol.item.supplierName);
    });
    return ['all', ...Array.from(s)];
  }, [orderLines]);

  const filteredLines = useMemo(() => {
    if (selectedSupplier === 'all') return orderLines;
    return orderLines.filter((ol) => ol.item.supplierName === selectedSupplier);
  }, [orderLines, selectedSupplier]);

  const updatePacksCount = (index: number, newCount: number) => {
    if (newCount < 1) return;
    setOrderLines((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const packSize = target.item.packSize || 10;
      const totalUnits = newCount * packSize;
      const totalCost = totalUnits * target.item.buyPrice;
      updated[index] = { ...target, packsCount: newCount, totalUnits, totalCost };
      return updated;
    });
  };

  const toggleSelect = (index: number) => {
    setOrderLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const selectedLines = orderLines.filter((l) => l.selected);
  const totalCost = selectedLines.reduce((acc, l) => acc + l.totalCost, 0);

  // Generate clean WhatsApp message
  const handleSendWhatsApp = () => {
    let headerTitle = '📦 *Krow Wholesale Reorder List*\n\n';
    if (language === 'hi') headerTitle = '📦 *थोक रीऑर्डर पर्चा — Krow*\n\n';
    if (language === 'pa') headerTitle = '📦 *ਥੋਕ ਰੀਆਰਡਰ ਪਰਚੀ — Krow*\n\n';
    if (language === 'ja') headerTitle = '📦 *Krow 卸売仕入発注伝票*\n\n';

    let text = headerTitle;
    selectedLines.forEach((ol, i) => {
      const unitStr = localizeUnit(ol.item.unit, language);
      const itemName = localizeItemName(ol.item.name, language);
      text += `${i + 1}. *${itemName}*: ${ol.packsCount} ${t.perPack} (${ol.totalUnits} ${unitStr}) — ₹${ol.totalCost}\n`;
    });
    text += `\n💰 *${t.estimatedPaymentLabel}:* ₹${totalCost.toLocaleString('en-IN')}\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="order-list-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full max-h-[92vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6B4F] text-2xl">
              receipt_long
            </span>
            <div>
              <h2 className="text-base font-bold text-[#262421] font-display">
                {t.orderListHeaderTitle}
              </h2>
              <span className="text-[11px] text-[#726C60] block">
                {t.orderListHeaderDesc}
              </span>
            </div>
          </div>
          <button
            id="close-order-list-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Supplier Filter Pills */}
        {suppliers.length > 2 && (
          <div className="px-4 py-2 bg-white border-b border-[#E4DFD2] flex gap-2 overflow-x-auto no-scrollbar">
            {suppliers.map((sup) => (
              <button
                key={sup}
                onClick={() => setSelectedSupplier(sup)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  selectedSupplier === sup
                    ? 'bg-[#2F6B4F] text-white'
                    : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#726C60]'
                }`}
                type="button"
              >
                {sup === 'all' ? t.filterAll : sup}
              </button>
            ))}
          </div>
        )}

        {/* Items List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1">
          {filteredLines.length === 0 ? (
            <div className="text-center py-10 text-[#726C60]">
              <span className="material-symbols-outlined text-4xl text-[#2F6B4F] mb-2">
                check_circle
              </span>
              <p className="text-sm font-bold text-[#262421]">
                {t.emptyOrderListMsg}
              </p>
            </div>
          ) : (
            filteredLines.map((ol, idx) => {
              const unitStr = localizeUnit(ol.item.unit, language);
              return (
                <div
                  key={ol.item.id}
                  className={`bg-white rounded-2xl border p-3.5 shadow-2xs transition-all ${
                    ol.selected ? 'border-[#2F6B4F]/40' : 'border-[#E4DFD2] opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={ol.selected}
                      onChange={() => toggleSelect(idx)}
                      className="w-5 h-5 mt-0.5 rounded text-[#2F6B4F] focus:ring-[#2F6B4F]"
                    />

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold text-[#262421] truncate">
                          {localizeItemName(ol.item.name, language)}
                        </span>
                        <span className="text-xs font-extrabold text-[#1E4632] font-display whitespace-nowrap">
                          ₹{ol.totalCost.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-xs text-[#726C60] mt-0.5">
                        {ol.packsCount} {t.perPack} ({ol.totalUnits} {unitStr}) • ₹{ol.item.buyPrice}/{unitStr}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E4DFD2]/60">
                        <span className="text-[11px] text-[#C1443B] font-semibold">
                          {t.stockLeftPrefix} {ol.item.currentQuantity} {unitStr} ({t.reorderBadge}: {ol.item.reorderLevel})
                        </span>

                        {/* Packs Stepper */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updatePacksCount(idx, ol.packsCount - 1)}
                            className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] text-sm font-bold text-[#262421] flex items-center justify-center active:scale-90"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#262421]">
                            {ol.packsCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => updatePacksCount(idx, ol.packsCount + 1)}
                            className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] text-sm font-bold text-[#262421] flex items-center justify-center active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Summary & Actions */}
        <div className="p-4 bg-white border-t border-[#E4DFD2] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[#726C60] block">
                {t.estimatedPaymentLabel} ({selectedLines.length})
              </span>
              <span className="text-2xl font-extrabold text-[#1E4632] font-display">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="px-2.5 py-1 bg-[#FBF0D9] text-[#7a5900] text-xs font-bold rounded-full border border-[#D9A62E]/30">
              {t.wholesaleSavingsIncluded}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="print-order-btn"
              onClick={handlePrint}
              type="button"
              className="h-12 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] hover:bg-[#E4DFD2] text-[#262421] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              <span>{t.printOrPdfBtn}</span>
            </button>

            <button
              id="send-whatsapp-order-btn"
              onClick={handleSendWhatsApp}
              type="button"
              className="h-12 rounded-xl bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              <span>{t.sendOrderViaWhatsAppBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
