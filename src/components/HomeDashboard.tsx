import React, { useState, useMemo } from 'react';
import { StockItem, Customer, CustomerTransaction, SaleRecord, Language } from '../types';
import { translations } from '../translations';
import { localizeItemName, localizeUnit } from '../utils/localization';
import { getAggregateUdhaarStats } from '../utils/udhaarUtils';
import { CalculationInfoModal, CalculationInfoData } from './CalculationInfoModal';

interface HomeDashboardProps {
  language: Language;
  stockItems: StockItem[];
  customers: Customer[];
  transactions?: Record<string, CustomerTransaction[]>;
  salesRecords: SaleRecord[];
  onOpenQuickSell: (item?: StockItem) => void;
  onOpenScanToSell: () => void;
  onOpenShareStock: () => void;
  onOpenScanBill: () => void;
  onOpenAddItem: () => void;
  onOpenNightCount: () => void;
  onOpenOrderList: () => void;
  onNavigateToStock: () => void;
  onNavigateToUdhaar: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  language,
  stockItems,
  customers,
  transactions = {},
  salesRecords,
  onOpenQuickSell,
  onOpenScanToSell,
  onOpenShareStock,
  onOpenScanBill,
  onOpenAddItem,
  onOpenNightCount,
  onOpenOrderList,
  onNavigateToStock,
  onNavigateToUdhaar,
}) => {
  const t = translations[language];

  // Progressive disclosure modal for profit/margin calculations
  const [activeCalculationInfo, setActiveCalculationInfo] = useState<CalculationInfoData | null>(null);

  // Calculate today's net profit purely from actual sales records
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = salesRecords.filter((s) => s.date === todayStr);
  const displayTodayProfit = todaySales.reduce((acc, s) => acc + (s.profit || 0), 0);

  // Calculate past 7 days profit purely from actual sales records
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekSales = salesRecords.filter((s) => new Date(s.date) >= sevenDaysAgo);
  const displayWeekProfit = weekSales.reduce((acc, s) => acc + (s.profit || 0), 0);

  // Aggregate Udhaar repayment statistics
  const aggregateUdhaar = useMemo(() => {
    return getAggregateUdhaarStats(customers, transactions);
  }, [customers, transactions]);

  // Calculate total market udhaar from customers
  const activeCreditCustomers = customers.filter((c) => c.balance > 0);
  const totalMarketUdhaar = activeCreditCustomers.reduce((acc, c) => acc + c.balance, 0);

  // Items running out of stock (currentQuantity <= reorderLevel)
  const lowStockItems = stockItems.filter((item) => item.currentQuantity <= item.reorderLevel);

  // Needs attention items (perishable with low stock OR low stock items)
  const needsAttentionList = stockItems.filter(
    (item) => item.isPerishable || item.currentQuantity <= item.reorderLevel
  ).slice(0, 4);

  return (
    <div id="home-dashboard-container" className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* 1. HERO CARD: Net Profit Hero (Stitch Screen 18) */}
      <div id="profit-hero-card" className="bg-[#E7F0EA] border border-[#2F6B4F]/20 rounded-3xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F6B4F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2F6B4F]"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1E4632] uppercase tracking-wide">
                {t.todayNetProfit}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCalculationInfo({
                    type: 'profit',
                    title: t.infoTodayProfitTitle,
                    formula: 'Profit = sell price − buy price',
                    explanation:
                      'Profit = sell price − buy price, per item sold today (from Quick Sell and Night Count entries).',
                    statsBreakdown: [
                      {
                        label:
                          language === 'en'
                            ? "Today's Net Profit"
                            : 'आज का शुद्ध मुनाफ़ा',
                        value: `₹${displayTodayProfit.toLocaleString('en-IN')}`,
                        color: 'text-[#1E4632]',
                      },
                      {
                        label:
                          language === 'en'
                            ? 'Sales Logged Today'
                            : 'आज की कुल बिक्री',
                        value: `${todaySales.length}`,
                      },
                    ],
                    example:
                      language === 'en'
                        ? 'E.g., selling an item bought at ₹16 for ₹20 records ₹4 net profit.'
                        : 'उदाहरण: ₹16 में ख़रीदा गया सामान ₹20 में बेचने पर ₹4 का शुद्ध मुनाफ़ा दर्ज होता है।',
                  });
                }}
                className="w-5 h-5 rounded-full bg-[#1E4632]/10 hover:bg-[#1E4632]/20 text-[#1E4632] flex items-center justify-center transition-colors text-xs"
                aria-label="मुनाफ़ा कैसे निकलता है?"
                title="हिसाब समझें"
              >
                <span className="material-symbols-outlined text-[13px]">info</span>
              </button>
            </div>
          </div>
          {todaySales.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2F6B4F] text-white shadow-2xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">receipt_long</span>
              <span>
                {todaySales.length}{' '}
                {language === 'en'
                  ? 'Sales Logged'
                  : language === 'pa'
                  ? 'ਵਿਕਰੀ ਦਰਜ'
                  : language === 'ja'
                  ? '件の販売'
                  : 'बिक्री दर्ज'}
              </span>
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2F6B4F] text-white shadow-2xs">
              {t.growthBadge}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-4xl sm:text-5xl font-extrabold text-[#1E4632] tracking-tight font-display">
            ₹{displayTodayProfit.toLocaleString('en-IN')}
          </div>
          <button
            id="hero-quick-sell-btn"
            onClick={onOpenScanToSell}
            className="h-10 px-4 rounded-full bg-[#2F6B4F] hover:bg-[#1E4632] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all touch-manipulation"
            type="button"
            title={language === 'en' ? 'Quick Sell (Barcode POS)' : 'तुरंत बिक्री (बारकोड POS)'}
          >
            <span className="material-symbols-outlined text-base">barcode_scanner</span>
            <span>{t.btnSell}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-[#2F6B4F]/15 flex items-center justify-between text-xs text-[#1E4632]/80 font-medium">
          <div className="flex items-center gap-1.5">
            <span>{t.weekNetProfit}:</span>
            <button
              type="button"
              onClick={() => {
                setActiveCalculationInfo({
                  type: 'profit',
                  title: t.infoWeekProfitTitle,
                  formula: '∑ (sell price − buy price) for past 7 days',
                  explanation: t.infoWeekProfitDesc,
                  statsBreakdown: [
                    {
                      label:
                        language === 'en'
                          ? "This Week's Net Profit"
                          : 'इस हफ़्ते का कुल मुनाफ़ा',
                      value: `₹${displayWeekProfit.toLocaleString('en-IN')}`,
                      color: 'text-[#1E4632]',
                    },
                  ],
                });
              }}
              className="w-4 h-4 rounded-full bg-[#1E4632]/10 hover:bg-[#1E4632]/20 text-[#1E4632] flex items-center justify-center transition-colors text-xs"
              aria-label="हफ़्ते का मुनाफ़ा हिसाब"
              title="हिसाब समझें"
            >
              <span className="material-symbols-outlined text-[12px]">info</span>
            </button>
          </div>
          <span className="font-bold text-[#1E4632]">₹{displayWeekProfit.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 2. TWO STAT TILES: Total Stock vs Total Udhaar */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stock Tile */}
        <div
          id="stat-stock-tile"
          onClick={onNavigateToStock}
          className="bg-white border border-[#E4DFD2] rounded-2xl p-4 shadow-2xs cursor-pointer hover:border-[#2F6B4F]/40 transition-all active:scale-[0.99] touch-manipulation flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#726C60] mb-2">
            <span className="text-xs font-bold">{t.totalStockItems}</span>
            <span className="material-symbols-outlined text-base text-[#2F6B4F]">inventory_2</span>
          </div>
          <div>
            <div className="text-xl font-bold text-[#262421] font-display">
              {stockItems.length} {t.availableStock}
            </div>
            {lowStockItems.length > 0 ? (
              <span className="inline-block mt-1 text-[11px] font-bold text-[#C1443B] bg-[#F8E6E4] px-2 py-0.5 rounded-full">
                {lowStockItems.length} {t.runningOutSoon}
              </span>
            ) : (
              <span className="inline-block mt-1 text-[11px] font-semibold text-[#2F6B4F] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                {t.sufficientStock}
              </span>
            )}
          </div>
        </div>

        {/* Udhaar Tile with Explicit Aggregate Repayment Percentage */}
        <div
          id="stat-udhaar-tile"
          onClick={onNavigateToUdhaar}
          className="bg-white border border-[#E4DFD2] rounded-2xl p-4 shadow-2xs cursor-pointer hover:border-[#2F6B4F]/40 transition-all active:scale-[0.99] touch-manipulation flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#726C60] mb-2">
            <span className="text-xs font-bold">{t.totalMarketUdhaar}</span>
            <span className="material-symbols-outlined text-base text-[#C1443B]">account_balance_wallet</span>
          </div>
          <div>
            <div className="text-xl font-bold text-[#C1443B] font-display">
              ₹{totalMarketUdhaar.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-[#1E4632] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                {aggregateUdhaar.aggregateRepaidPercent}% {language === 'en' ? 'repaid' : 'वापस मिला'}
              </span>
              <span className="text-[11px] font-medium text-[#726C60]">
                ({activeCreditCustomers.length} {t.onCustomersCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COUNTER QUICK ACTIONS: 6 prominent action cards */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#726C60] uppercase tracking-wider">
            {t.counterQuickActions}
          </h3>
          <span className="text-[11px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
            {language === 'en' ? 'Counter POS' : 'दुकान काउंटर'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Quick Sell (Barcode Scanner POS for rapid checkout) */}
          <button
            id="action-quick-sell-btn"
            onClick={onOpenScanToSell}
            className="p-3.5 rounded-2xl bg-[#E7F0EA]/80 border border-[#2F6B4F]/40 hover:bg-[#E7F0EA] active:scale-[0.98] shadow-2xs flex items-center gap-3 text-left transition-all touch-manipulation min-h-[58px]"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2F6B4F] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-xl">barcode_scanner</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-[#1E4632] leading-tight">
                  {t.actionQuickSell}
                </span>
                <span className="text-[9px] bg-[#2F6B4F] text-white font-bold px-1 rounded">
                  POS
                </span>
              </div>
              <span className="text-[11px] text-[#2F6B4F]/80 leading-none mt-1 font-medium">
                {t.actionQuickSellDesc}
              </span>
            </div>
          </button>

          {/* Loose Items Sell (Atta, Dal, Sugar, Milk without barcode) */}
          <button
            id="action-scan-to-sell-btn"
            onClick={() => onOpenQuickSell()}
            className="p-3.5 rounded-2xl bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] active:scale-[0.98] shadow-2xs flex items-center gap-3 text-left transition-all touch-manipulation min-h-[58px]"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-[#7a5900] border border-[#E4DFD2] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl fill">point_of_sale</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#262421] leading-tight">
                {t.actionScanToSell}
              </span>
              <span className="text-[11px] text-[#726C60] leading-none mt-1">
                {t.actionScanToSellDesc}
              </span>
            </div>
          </button>

          {/* Customer Live Stock & QR */}
          <button
            id="action-share-stock-btn"
            onClick={onOpenShareStock}
            className="p-3.5 rounded-2xl bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] active:scale-[0.98] shadow-2xs flex items-center gap-3 text-left transition-all touch-manipulation min-h-[58px]"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-[#7a5900] border border-[#E4DFD2] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl">qr_code_2</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#262421] leading-tight">
                {t.actionShareStock}
              </span>
              <span className="text-[11px] text-[#726C60] leading-none mt-1">
                {t.actionShareStockDesc}
              </span>
            </div>
          </button>

          {/* Scan Bill */}
          <button
            id="action-scan-bill-btn"
            onClick={onOpenScanBill}
            className="p-3.5 rounded-2xl bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] active:scale-[0.98] shadow-2xs flex items-center gap-3 text-left transition-all touch-manipulation min-h-[58px]"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FBF0D9] text-[#7a5900] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl fill">document_scanner</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#262421] leading-tight">
                {t.actionScanBill}
              </span>
              <span className="text-[11px] text-[#726C60] leading-none mt-1">
                {t.actionScanBillDesc}
              </span>
            </div>
          </button>

          {/* Add Item */}
          <button
            id="action-add-item-btn"
            onClick={onOpenAddItem}
            className="p-3.5 rounded-2xl bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] active:scale-[0.98] shadow-2xs flex items-center gap-3 text-left transition-all touch-manipulation min-h-[58px]"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] text-[#2F6B4F] border border-[#E4DFD2] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl fill">add_circle</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#262421] leading-tight">
                {t.actionAddItem}
              </span>
              <span className="text-[11px] text-[#726C60] leading-none mt-1">
                {t.actionAddItemDesc}
              </span>
            </div>
          </button>

          {/* Night Count */}
          <button
            id="action-night-count-btn"
            onClick={onOpenNightCount}
            className="p-3.5 rounded-2xl bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] active:scale-[0.98] shadow-2xs flex items-center gap-3 text-left transition-all touch-manipulation min-h-[58px]"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FBF0D9] text-[#D9A62E] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl fill">bedtime</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#262421] leading-tight">
                {t.actionNightCount}
              </span>
              <span className="text-[11px] text-[#726C60] leading-none mt-1">
                {t.actionNightCountDesc}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. SECTION: Needs Attention / Alerts (Stitch Screen 18) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C1443B] text-base">warning</span>
            <h3 className="text-sm font-bold text-[#262421]">
              {t.needsAttentionSection}
            </h3>
          </div>
          <span className="text-xs font-bold text-[#C1443B] bg-[#F8E6E4] px-2 py-0.5 rounded-full">
            {needsAttentionList.length} {t.alertsCountSuffix}
          </span>
        </div>

        {needsAttentionList.length === 0 ? (
          <div className="bg-white border border-[#E4DFD2] rounded-2xl p-5 text-center flex flex-col items-center justify-center shadow-2xs">
            <span className="material-symbols-outlined text-3xl text-[#2F6B4F] mb-1">
              verified
            </span>
            <p className="text-xs font-bold text-[#262421]">
              {stockItems.length === 0
                ? (language === 'pa' ? 'ਅਜੇ ਕੋਈ ਸਟਾਕ ਆਈਟਮ ਨਹੀਂ ਹੈ' : language === 'en' ? 'No stock items added yet' : 'अभी कोई स्टॉक आइटम नहीं है')
                : (language === 'pa' ? 'ਸਾਰਾ ਸਟਾਕ ਪੂਰਾ ਹੈ' : language === 'en' ? 'All stock levels are optimal' : 'सारा स्टॉक सुरक्षित स्तर पर है')}
            </p>
            <p className="text-[11px] text-[#726C60] mt-0.5">
              {stockItems.length === 0
                ? (language === 'pa' ? 'ਨਵਾਂ ਸਮਾਨ ਜੋੜਨ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਬਟਨ ਵਰਤੋ' : language === 'en' ? 'Use Quick Sell or Scan Bill to begin' : 'नया सामान जोड़ने के लिए बिल स्कैन या ऐड आइटम दबाएं')
                : (language === 'pa' ? 'ਕਿਸੇ ਆਈਟਮ ਦੀ ਕਮੀ ਨਹੀਂ ਹੈ' : language === 'en' ? 'No items need reordering right now' : 'किसी भी आइटम के रीऑर्डर की जरूरत नहीं है')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {needsAttentionList.map((item) => {
              const isOutOfStock = item.currentQuantity <= 0;
              const isLowStock = item.currentQuantity <= item.reorderLevel;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#E4DFD2] rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.isPerishable ? 'bg-[#FBF0D9] text-[#D9A62E]' : 'bg-[#E7F0EA] text-[#2F6B4F]'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {item.isPerishable ? 'alarm' : 'inventory_2'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-[#262421] truncate max-w-[160px]">
                          {localizeItemName(item.name, language)}
                        </span>
                        {item.isPerishable && (
                          <span className="text-[10px] font-bold text-[#7a5900] bg-[#FBF0D9] px-1.5 py-0.2 rounded-md">
                            {t.sellByTonight}
                          </span>
                        )}
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-[#C1443B] bg-[#F8E6E4] px-1.5 py-0.2 rounded-md">
                            {t.stockEmpty}
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-[#C1443B] bg-[#F8E6E4] px-1.5 py-0.2 rounded-md">
                            {t.limitedStock}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-xs text-[#726C60] mt-0.5">
                        <span className="font-bold text-[#262421]">
                          {item.currentQuantity} {localizeUnit(item.unit, language)}
                        </span>{' '}
                        {t.leftUnits}
                        {item.reorderLevel > 0 && (
                          <span className="text-[#A29C8E] ml-1.5">
                            • {t.reorderLevelLabel}: {item.reorderLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLowStock ? (
                      <button
                        id={`order-btn-${item.id}`}
                        onClick={onOpenOrderList}
                        className="h-8 px-3 rounded-full bg-[#FAF7F0] border border-[#2F6B4F] text-[#2F6B4F] hover:bg-[#E7F0EA] text-xs font-bold active:scale-95 transition-all touch-manipulation"
                        type="button"
                      >
                        {t.orderAction}
                      </button>
                    ) : null}
                    <button
                      id={`sell-btn-${item.id}`}
                      onClick={() => onOpenQuickSell(item)}
                      className="h-8 px-3.5 rounded-full bg-[#2F6B4F] text-white hover:bg-[#1E4632] text-xs font-bold active:scale-95 shadow-2xs transition-all touch-manipulation"
                      type="button"
                    >
                      {t.btnSell}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
