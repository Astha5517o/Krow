import React from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Zap,
  Moon,
  Camera,
  ClipboardList,
  UserPlus,
  Package,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';

interface HomeDashboardProps {
  onOpenQuickSell: () => void;
  onOpenNightCount: () => void;
  onOpenScanBill: () => void;
  onOpenOrderList: () => void;
  onOpenAddCustomer: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onOpenQuickSell,
  onOpenNightCount,
  onOpenScanBill,
  onOpenOrderList,
  onOpenAddCustomer,
}) => {
  const {
    profile,
    items,
    todayProfit,
    weekProfit,
    totalUdhaarOwed,
    customers,
    reorderSuggestions,
    setActiveScreen,
  } = useShop();

  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);

  const attentionList = reorderSuggestions.slice(0, 6);
  const customersDueCount = customers.filter((c) => c.balance > 0).length;

  return (
    <div className="space-y-3 sm:space-y-4 pb-4">
      {/* 1. Dominant Hero Card: Today's Profit (Visually Largest Element on the Screen) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4DFD2] shadow-xs relative overflow-hidden">
        {/* Top meta row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 text-[#726C60]">
            <TrendingUp className="w-4 h-4 text-[#2F6B4F]" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">{t.todayProfit}</span>
          </div>

          {/* Secondary quiet metric: This Week's Profit */}
          <div className="text-right">
            <span className="text-[11px] text-[#726C60] block font-medium">
              {t.thisWeekProfit}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#262421]">
              ₹{weekProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Hero Dominant Number */}
        <div className="mt-2 mb-1">
          <span className="text-3xl sm:text-4xl font-black text-[#1E4632] tracking-tight">
            ₹{todayProfit.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Crisp bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2F6B4F]" />
      </div>

      {/* 2. Secondary Compact Udhaar Reminder */}
      <div
        onClick={() => setActiveScreen('udhaar')}
        className="bg-[#F8E6E4]/70 rounded-2xl p-3.5 sm:p-4 border border-[#C1443B]/20 flex items-center justify-between cursor-pointer hover:border-[#C1443B]/40 transition shadow-xs group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#C1443B]/20 flex items-center justify-center text-[#C1443B] font-bold text-sm shrink-0">
            ₹
          </div>
          <div>
            <span className="text-xs font-bold text-[#C1443B] tracking-wide block">
              {t.totalUdhaarOwed}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#262421] tracking-tight">
                ₹{totalUdhaarOwed.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#726C60]">
                {customersDueCount} {lang === 'hi' ? 'ग्राहकों पर' : lang === 'pa' ? 'ਗਾਹਕਾਂ \'ਤੇ' : 'due'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#C1443B] group-hover:translate-x-0.5 transition-transform">
          <span>{lang === 'hi' ? 'खाता देखें' : lang === 'pa' ? 'ਖਾਤਾ ਦੇਖੋ' : 'View Ledger'}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Fast Action Buttons */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E4DFD2] shadow-xs">
        <h3 className="text-xs font-bold text-[#726C60] uppercase tracking-wider mb-2.5">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Quick Sell */}
          <button
            onClick={onOpenQuickSell}
            className="flex items-center gap-2 p-2 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] hover:bg-[#E7F0EA] hover:border-[#2F6B4F]/40 transition text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2F6B4F] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1E4632] truncate">{t.quickSellAction}</p>
              <p className="text-[10px] text-[#726C60] truncate">
                {lang === 'hi' ? '1 बेचें' : lang === 'pa' ? '1 ਵੇਚੋ' : 'Sell 1'}
              </p>
            </div>
          </button>

          {/* Night Count */}
          <button
            onClick={onOpenNightCount}
            className="flex items-center gap-2 p-2 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] hover:bg-[#FBF0D9] hover:border-[#D9A62E]/40 transition text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#D9A62E] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#262421] truncate">{t.nightCountAction}</p>
              <p className="text-[10px] text-[#726C60] truncate">
                {lang === 'hi' ? 'दुकान बढ़ाते वक्त' : lang === 'pa' ? 'ਰਾਤ ਦੀ ਗਿਣਤੀ' : 'At closing'}
              </p>
            </div>
          </button>

          {/* Scan Bill (AI) */}
          <button
            onClick={onOpenScanBill}
            className="flex items-center gap-2 p-2 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] hover:bg-[#E7F0EA] hover:border-[#1E4632]/40 transition text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#1E4632] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-[#1E4632] truncate">{t.scanBillAction}</p>
                <Sparkles className="w-2.5 h-2.5 text-[#D9A62E] shrink-0" />
              </div>
              <p className="text-[10px] text-[#726C60] truncate">
                {lang === 'hi' ? 'पर्चा पढ़ें' : lang === 'pa' ? 'ਬਿੱਲ ਪੜ੍ਹੋ' : 'Read bill'}
              </p>
            </div>
          </button>

          {/* Supplier Order List */}
          <button
            onClick={onOpenOrderList}
            className="flex items-center gap-2 p-2 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] hover:bg-[#E7F0EA] hover:border-[#2F6B4F]/40 transition text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2F6B4F]/90 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1E4632] truncate">{t.orderListAction}</p>
              <p className="text-[10px] text-[#726C60] truncate">
                {lang === 'hi' ? 'व्हाट्सएप / कॉपी' : lang === 'pa' ? 'ਵਟਸਐਪ / ਕਾਪੀ' : 'WhatsApp / Copy'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. "Needs Attention" List */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E4DFD2] shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#F8E6E4] text-[#C1443B] flex items-center justify-center">
              <AlertTriangle className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#262421]">{t.needsAttention}</h3>
            </div>
          </div>
          {reorderSuggestions.length > 0 && (
            <button
              onClick={onOpenOrderList}
              className="text-xs font-bold text-[#2F6B4F] hover:text-[#1E4632] flex items-center gap-0.5 cursor-pointer"
            >
              <span>{t.orderListAction}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-6 text-center text-[#726C60] space-y-2">
            <Package className="w-8 h-8 mx-auto text-[#2F6B4F]/40" />
            <p className="text-xs font-semibold text-[#262421]">
              {lang === 'hi'
                ? 'अभी दुकान में कोई सामान दर्ज नहीं है।'
                : 'No items in your store inventory yet.'}
            </p>
            <p className="text-[11px] text-[#726C60] max-w-xs mx-auto">
              {lang === 'hi'
                ? 'दुकानदार अपना सामान खुद जोड़ सकते हैं या थोक पर्चा स्कैन कर सकते हैं।'
                : 'You can add your items manually or scan your wholesale purchase bill.'}
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveScreen('stock')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] transition cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'सामान जोड़ें' : 'Add Item'}</span>
              </button>
              <button
                onClick={onOpenScanBill}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#2F6B4F] text-[#2F6B4F] text-xs font-bold hover:bg-[#E7F0EA] transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'पर्चा स्कैन करें' : 'Scan Bill'}</span>
              </button>
            </div>
          </div>
        ) : attentionList.length === 0 ? (
          <div className="py-5 text-center text-[#726C60]">
            <Package className="w-7 h-7 mx-auto text-[#2F6B4F]/40 mb-1.5" />
            <p className="text-xs font-semibold text-[#1E4632]">{t.allGoodStock}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4DFD2]/60">
            {attentionList.map(({ item, neededQuantity, packetsToOrder, reason, avgDailySales }) => {
              const isPerishable = item.spoilQuickly;

              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#262421] truncate">{item.name}</span>
                      {isPerishable ? (
                        <span className="text-[9px] font-bold bg-[#FBF0D9] text-[#9A7016] px-1.5 py-0.2 rounded-md shrink-0">
                          {lang === 'hi' ? 'जल्दी ख़राब होने वाला' : lang === 'pa' ? 'ਤਾਜ਼ਾ ਮਾਲ' : 'Perishable'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-[#F8E6E4] text-[#C1443B] px-1.5 py-0.2 rounded-md shrink-0">
                          {lang === 'hi' ? 'कम स्टॉक' : lang === 'pa' ? 'ਘੱਟ ਸਟਾਕ' : 'Low Stock'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#726C60] mt-0.5">
                      <span>
                        {lang === 'hi' ? 'दुकान में:' : lang === 'pa' ? 'ਦੁਕਾਨ \'ਚ:' : 'Stock:'}{' '}
                        <strong className={item.quantity <= 0 ? 'text-[#C1443B]' : 'text-[#262421]'}>
                          {item.quantity} {item.unit}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        {reason === 'perishable_velocity' ? (
                          <span className="text-[#9A7016]">
                            {lang === 'hi'
                              ? `7 दिन की बिक्री: ~${avgDailySales}/दिन`
                              : lang === 'pa'
                              ? `7 ਦਿਨ ਦੀ ਵਿਕਰੀ: ~${avgDailySales}/ਦਿਨ`
                              : `7-day avg: ~${avgDailySales}/day`}
                          </span>
                        ) : (
                          <span>
                            {lang === 'hi' ? `अलर्ट लेवल: ${item.reorderLevel}` : lang === 'pa' ? `ਅਲਰਟ ਲੈਵਲ: ${item.reorderLevel}` : `Reorder: ${item.reorderLevel}`}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Quick Order Badge */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-[#1E4632]">
                      {item.packetSize && item.packetSize > 1 ? (
                        <span>
                          {packetsToOrder}{' '}
                          <span className="text-[10px] font-medium text-[#726C60]">
                            {lang === 'hi' ? `पैकेट (${item.packetSize} का)` : lang === 'pa' ? `ਪੈਕਟ (${item.packetSize} ਦਾ)` : `pkts (${item.packetSize} ea)`}
                          </span>
                        </span>
                      ) : (
                        <span>
                          +{neededQuantity} {item.unit}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold text-[#726C60]">
                      {lang === 'hi' ? 'मँगाना चाहिए' : lang === 'pa' ? 'ਮੰਗਾਉਣਾ ਚਾਹੀਦਾ' : 'Suggested'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
