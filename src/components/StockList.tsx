import React, { useState, useMemo } from 'react';
import { StockItem, Language, StoreType } from '../types';
import { translations } from '../translations';
import { getDefaultCategories } from '../data/defaultData';
import { localizeCategory, localizeItemName, localizeUnit } from '../utils/localization';
import { CalculationInfoModal, CalculationInfoData } from './CalculationInfoModal';

interface StockListProps {
  language: Language;
  storeType: StoreType;
  items: StockItem[];
  onOpenAddItem: (itemToEdit?: StockItem) => void;
  onOpenOrderList: () => void;
  onQuickSell: (item: StockItem) => void;
  onOpenScanToSell?: () => void;
  onOpenShareStock?: () => void;
}

export const StockList: React.FC<StockListProps> = ({
  language,
  storeType,
  items,
  onOpenAddItem,
  onOpenOrderList,
  onQuickSell,
  onOpenScanToSell,
  onOpenShareStock,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeCalculationInfo, setActiveCalculationInfo] = useState<CalculationInfoData | null>(null);

  const categories = useMemo(() => {
    return ['all', ...getDefaultCategories(storeType)];
  }, [storeType]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const lowStockCount = items.filter((i) => i.currentQuantity <= i.reorderLevel).length;

  return (
    <div id="stock-list-container" className="flex flex-col gap-3 pb-24 animate-fade-in">
      {/* Top action row: Title & Quick Shortcuts */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl font-bold text-[#262421] font-display">
            {t.stockListTitle}
          </h2>
          <span className="text-xs text-[#726C60]">
            {items.length} {t.totalItemsCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenScanToSell && (
            <button
              id="stock-scan-sell-btn"
              onClick={onOpenScanToSell}
              className="h-9 px-3 rounded-full bg-[#E7F0EA] border border-[#2F6B4F]/30 text-[#2F6B4F] hover:bg-[#2F6B4F] hover:text-white active:scale-95 font-bold text-xs flex items-center gap-1 shadow-2xs transition-all touch-manipulation"
              type="button"
              title={language === 'en' ? 'Scan to Sell' : 'बारकोड से बेचें'}
            >
              <span className="material-symbols-outlined text-base">barcode_scanner</span>
              <span className="hidden sm:inline">{language === 'en' ? 'Scan Sell' : 'बारकोड'}</span>
            </button>
          )}

          {onOpenShareStock && (
            <button
              id="stock-share-btn"
              onClick={onOpenShareStock}
              className="h-9 px-3 rounded-full bg-white border border-[#E4DFD2] text-[#262421] hover:bg-[#FAF7F0] active:scale-95 font-bold text-xs flex items-center gap-1 shadow-2xs transition-all touch-manipulation"
              type="button"
              title={language === 'en' ? 'Customer Live Stock' : 'ग्राहक स्टॉक'}
            >
              <span className="material-symbols-outlined text-base text-[#7a5900]">qr_code_2</span>
              <span className="hidden sm:inline">{language === 'en' ? 'Share QR' : 'QR लिंक'}</span>
            </button>
          )}

          <button
            id="open-reorder-list-btn"
            onClick={onOpenOrderList}
            className="h-9 px-3 rounded-full bg-[#FAF7F0] border border-[#2F6B4F] text-[#2F6B4F] hover:bg-[#E7F0EA] active:scale-95 font-bold text-xs flex items-center gap-1 shadow-2xs transition-all touch-manipulation"
            type="button"
          >
            <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            <span className="hidden xs:inline">{t.orderListAction}</span>
            {lowStockCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#C1443B] text-white text-[11px] flex items-center justify-center font-bold">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#726C60] text-xl">
          search
        </span>
        <input
          id="search-stock-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchStockPlaceholder}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#E4DFD2] text-sm text-[#262421] placeholder-[#A29C8E] focus:outline-none focus:border-[#2F6B4F] focus:ring-1 focus:ring-[#2F6B4F] shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#726C60] hover:text-[#262421] p-1"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 min-h-[36px] active:scale-95 touch-manipulation ${
                isSelected
                  ? 'bg-[#2F6B4F] text-white shadow-2xs'
                  : 'bg-white border border-[#E4DFD2] text-[#726C60] hover:bg-[#FAF7F0]'
              }`}
              type="button"
            >
              <span>{cat === 'all' ? t.filterAll : localizeCategory(cat, language)}</span>
            </button>
          );
        })}
      </div>

      {/* Item Cards List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4DFD2] p-8 text-center flex flex-col items-center justify-center my-6 shadow-2xs">
          <span className="material-symbols-outlined text-4xl text-[#A29C8E] mb-2">
            inventory
          </span>
          <p className="text-sm font-bold text-[#262421] mb-1">
            {t.emptyStockMsg}
          </p>
          <button
            onClick={() => onOpenAddItem()}
            className="mt-3 px-4 py-2 bg-[#2F6B4F] text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>{t.addNewItem}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredItems.map((item) => {
            const isLow = item.currentQuantity <= item.reorderLevel;
            const profitPerUnit = item.sellPrice - item.buyPrice;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E4DFD2] p-3.5 shadow-2xs hover:border-[#2F6B4F]/30 transition-all flex flex-col gap-2.5"
              >
                {/* Top Row: Name, Category, Edit Trigger */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      onClick={() => onOpenAddItem(item)}
                      className={`cursor-pointer w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.isPerishable ? 'bg-[#FBF0D9] text-[#7a5900]' : 'bg-[#E7F0EA] text-[#2F6B4F]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {item.isPerishable ? 'alarm' : 'inventory_2'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() => onOpenAddItem(item)}
                          className="cursor-pointer text-sm font-bold text-[#262421] hover:text-[#2F6B4F] transition-colors"
                        >
                          {localizeItemName(item.name, language)}
                        </span>
                        {item.isPerishable && (
                          <span className="text-[10px] font-bold text-[#7a5900] bg-[#FBF0D9] px-1.5 py-0.2 rounded-md">
                            {t.perishableBadge}
                          </span>
                        )}
                        {item.exchangeType === 'exchangeable' && (
                          <span className="text-[10px] font-bold text-[#1E4632] bg-[#E7F0EA] px-1.5 py-0.2 rounded-md">
                            {t.returnableBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#726C60] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{localizeCategory(item.category, language)}</span>
                        {item.packSize ? (
                          <span>• {item.packSize} {t.perPack}</span>
                        ) : null}
                        {item.barcode ? (
                          <span className="text-[10px] font-mono bg-[#FAF7F0] border border-[#E4DFD2] text-[#2F6B4F] px-1.5 py-0.2 rounded flex items-center gap-1 font-semibold" title={`Barcode: ${item.barcode}`}>
                            <span className="material-symbols-outlined text-[12px]">barcode</span>
                            <span>{item.barcode.length > 10 ? `${item.barcode.slice(0, 4)}...${item.barcode.slice(-4)}` : item.barcode}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenAddItem(item)}
                            className="text-[10px] text-[#A29C8E] hover:text-[#2F6B4F] transition-colors flex items-center gap-0.5"
                            title="Add Barcode"
                          >
                            <span className="material-symbols-outlined text-[12px]">barcode_scanner</span>
                            <span>+ {language === 'en' ? 'Barcode' : 'बारकोड'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenAddItem(item)}
                    className="text-[#726C60] hover:text-[#2F6B4F] p-1"
                    title={t.btnEdit}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>

                {/* Middle Row: Quantity & Alert Badge */}
                <div className="flex items-center justify-between bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4DFD2]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#262421]">
                      {t.shopStockLabel}:
                    </span>
                    <span className="text-sm font-extrabold text-[#2F6B4F] font-display">
                      {item.currentQuantity} {localizeUnit(item.unit, language)}
                    </span>
                    {item.reorderLevel > 0 && (
                      <span className="text-xs text-[#726C60]">
                        ({t.reorderBadge}: {item.reorderLevel})
                      </span>
                    )}
                  </div>

                  {isLow ? (
                    <span className="text-[11px] font-bold text-[#C1443B] bg-[#F8E6E4] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      {t.stockLowBadge}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#2F6B4F] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                      {t.stockAdequateBadge}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Cost, Sell, Profit and Quick Sell Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[#726C60]">{t.costPriceLabel}: </span>
                      <span className="font-bold text-[#262421]">₹{item.buyPrice}</span>
                    </div>
                    <div>
                      <span className="text-[#726C60]">{t.sellPriceLabel}: </span>
                      <span className="font-bold text-[#262421]">₹{item.sellPrice}</span>
                    </div>
                    {(() => {
                      const marginPercent =
                        item.sellPrice > 0
                          ? Math.round(((item.sellPrice - item.buyPrice) / item.sellPrice) * 100)
                          : 0;
                      return (
                        <div className="text-[#2F6B4F] font-bold bg-[#E7F0EA] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>
                            +₹{profitPerUnit} {t.profitBadge} ({marginPercent}%)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCalculationInfo({
                                type: 'margin',
                                title: `${localizeItemName(item.name, language)}: ${language === 'en' ? 'Margin' : 'मार्जिन'}`,
                                formula: 'Margin % = ((Sell Price − Buy Price) ÷ Sell Price) × 100',
                                explanation: t.infoMarginDesc,
                                statsBreakdown: [
                                  {
                                    label: language === 'en' ? 'Buy Price (Cost)' : 'ख़रीद मूल्य (लागत)',
                                    value: `₹${item.buyPrice}`,
                                  },
                                  {
                                    label: language === 'en' ? 'Sell Price (Customer)' : 'बिक्री मूल्य (ग्राहक दर)',
                                    value: `₹${item.sellPrice}`,
                                  },
                                  {
                                    label: language === 'en' ? 'Profit per Unit' : 'प्रति यूनिट मुनाफ़ा',
                                    value: `+₹${profitPerUnit}`,
                                    color: 'text-[#2F6B4F]',
                                  },
                                  {
                                    label: language === 'en' ? 'Profit Margin' : 'मार्जिन प्रतिशत',
                                    value: `${marginPercent}%`,
                                    color: 'text-[#2F6B4F]',
                                  },
                                ],
                                example:
                                  language === 'en'
                                    ? `Selling at ₹${item.sellPrice} yields ₹${profitPerUnit} net profit (${marginPercent}% margin).`
                                    : `₹${item.sellPrice} पर बेचने पर ₹${profitPerUnit} का मुनाफ़ा मिलता है (${marginPercent}% मार्जिन)।`,
                              });
                            }}
                            className="w-4 h-4 rounded-full bg-[#2F6B4F]/15 hover:bg-[#2F6B4F]/30 text-[#1E4632] flex items-center justify-center transition-colors text-xs"
                            aria-label="मार्जिन हिसाब"
                            title="मार्जिन हिसाब समझें"
                          >
                            <span className="material-symbols-outlined text-[11px]">info</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    id={`stock-list-sell-btn-${item.id}`}
                    onClick={() => onQuickSell(item)}
                    className="h-8 px-4 rounded-full bg-[#2F6B4F] hover:bg-[#1E4632] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all touch-manipulation flex items-center gap-1"
                    type="button"
                  >
                    <span>{t.btnSell}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) for adding new item */}
      <button
        id="fab-add-stock-item"
        onClick={() => onOpenAddItem()}
        className="fixed bottom-20 right-4 z-30 h-14 px-5 rounded-full bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all touch-manipulation"
        type="button"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
        <span className="text-sm">{t.addNewItem}</span>
      </button>

      {/* Progressive Disclosure Calculation Info Modal */}
      {activeCalculationInfo && (
        <CalculationInfoModal
          data={activeCalculationInfo}
          language={language}
          onClose={() => setActiveCalculationInfo(null)}
        />
      )}
    </div>
  );
};
