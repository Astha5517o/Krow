import React, { useState, useMemo } from 'react';
import { StockItem, Language, SupplierChannel } from '../types';
import { translations } from '../translations';
import { localizeItemName, localizeUnit } from '../utils/localization';
import { DEFAULT_WHOLESALERS, getChannelBadgeDetails, inferWholesalerInfo } from '../data/wholesalersData';

interface OrderListModalProps {
  language: Language;
  stockItems: StockItem[];
  shopName?: string;
  ownerName?: string;
  phone?: string;
  onClose: () => void;
  onUpdateItemQuantity?: (itemId: string, newQty: number) => void;
  onBatchReceiveStock?: (itemsToReceive: { itemId: string; addedQty: number }[]) => void;
}

interface OrderLine {
  item: StockItem;
  packsCount: number; // Number of cartons/crates/bundles/boris
  totalUnits: number; // packsCount * packSize (or calculated units)
  totalCost: number;
  selected: boolean;
  channel: SupplierChannel;
  supplierName: string;
}

type TabType = 'ration' | 'tobacco' | 'daily_van' | 'all';
type ViewMode = 'list' | 'slip';

export const OrderListModal: React.FC<OrderListModalProps> = ({
  language,
  stockItems,
  shopName = 'मेरी दुकान (Krōw Store)',
  ownerName,
  phone,
  onClose,
  onBatchReceiveStock,
}) => {
  const t = translations[language];

  // Active Channel Tab
  const [activeTab, setActiveTab] = useState<TabType>('ration');
  const [viewMode, setViewMode] = useState<ViewMode>('slip');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecificSupplier, setSelectedSpecificSupplier] = useState<string>('all');
  const [copiedToast, setCopiedToast] = useState(false);
  const [orderGivenTimestamp, setOrderGivenTimestamp] = useState<Record<string, string>>({});
  const [receivedSuccessMessage, setReceivedSuccessMessage] = useState<string | null>(null);

  // Classify all stock items and calculate reorder recommendations
  const allOrderLines = useMemo<OrderLine[]>(() => {
    // 1. Identify low stock items (currentQuantity <= reorderLevel)
    const lowStockItems = stockItems.filter((item) => item.currentQuantity <= item.reorderLevel);

    // If low stock is sparse, include candidate items with low currentQuantity so shopkeeper always has a live demo
    const sourceItems = lowStockItems.length >= 4 
      ? lowStockItems 
      : [...stockItems].sort((a, b) => (a.currentQuantity / Math.max(1, a.reorderLevel)) - (b.currentQuantity / Math.max(1, b.reorderLevel)));

    return sourceItems.map((item) => {
      const packSize = item.packSize || 10;
      const deficit = Math.max(1, (item.reorderLevel * 2) - item.currentQuantity);
      const packsCount = Math.max(1, Math.ceil(deficit / packSize));
      const totalUnits = packsCount * packSize;
      const totalCost = totalUnits * item.buyPrice;

      // Determine channel and supplier
      const inferred = inferWholesalerInfo(item.category, item.name);
      const channel: SupplierChannel = item.supplierChannel || inferred.channel;
      const supplierName = item.supplierName || inferred.suggestedSupplierName;

      return {
        item,
        packsCount,
        totalUnits,
        totalCost,
        selected: true,
        channel,
        supplierName,
      };
    });
  }, [stockItems]);

  // Master local state of lines so user can increment/decrement or toggle selection
  const [orderLines, setOrderLines] = useState<OrderLine[]>(allOrderLines);

  // Sync if source changes
  React.useEffect(() => {
    setOrderLines(allOrderLines);
  }, [allOrderLines]);

  // Filter lines according to the active tab, supplier, and search query
  const displayedLines = useMemo(() => {
    return orderLines.filter((line) => {
      // 1. Tab Channel Filter
      if (activeTab === 'ration') {
        if (line.channel !== 'ration_mandi') return false;
      } else if (activeTab === 'tobacco') {
        if (line.channel !== 'tobacco_agency') return false;
      } else if (activeTab === 'daily_van') {
        if (line.channel !== 'daily_salesman' && line.channel !== 'dairy_fresh') return false;
      }

      // 2. Specific Supplier Pill Filter
      if (selectedSpecificSupplier !== 'all' && line.supplierName !== selectedSpecificSupplier) {
        return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = line.item.name.toLowerCase().includes(q);
        const matchesCategory = line.item.category.toLowerCase().includes(q);
        const matchesSupplier = line.supplierName.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesSupplier) return false;
      }

      return true;
    });
  }, [orderLines, activeTab, selectedSpecificSupplier, searchQuery]);

  // List of distinct suppliers available under the current tab
  const tabSuppliers = useMemo(() => {
    const s = new Set<string>();
    orderLines
      .filter((l) => {
        if (activeTab === 'ration') return l.channel === 'ration_mandi';
        if (activeTab === 'tobacco') return l.channel === 'tobacco_agency';
        if (activeTab === 'daily_van') return l.channel === 'daily_salesman' || l.channel === 'dairy_fresh';
        return true;
      })
      .forEach((l) => s.add(l.supplierName));

    return ['all', ...Array.from(s)];
  }, [orderLines, activeTab]);

  const selectedLines = displayedLines.filter((l) => l.selected);
  const totalCost = selectedLines.reduce((acc, l) => acc + l.totalCost, 0);

  // Stepper count updates
  const updatePacksCount = (itemId: string, newCount: number) => {
    if (newCount < 1) return;
    setOrderLines((prev) =>
      prev.map((line) => {
        if (line.item.id === itemId) {
          const packSize = line.item.packSize || 10;
          const totalUnits = newCount * packSize;
          const totalCost = totalUnits * line.item.buyPrice;
          return { ...line, packsCount: newCount, totalUnits, totalCost };
        }
        return line;
      })
    );
  };

  const toggleSelect = (itemId: string) => {
    setOrderLines((prev) =>
      prev.map((line) => {
        if (line.item.id === itemId) {
          return { ...line, selected: !line.selected };
        }
        return line;
      })
    );
  };

  // Generate clean WhatsApp order slip text
  const generateSlipText = () => {
    let title = '*Krōw Wholesale Reorder Slip*\n';
    let notice = '';

    if (activeTab === 'ration') {
      title = `*राशन व किराना मंडी ऑर्डर पर्चा — ${shopName}*\n`;
      notice = '_(थोक गल्ला व्यापारी — कृपया टेम्पो डिलीवरी तैयार रखें)_\n\n';
    } else if (activeTab === 'tobacco') {
      title = `*सिगरेट व तंबाकू एजेंसी इंडेंट पर्चा — ${shopName}*\n`;
      notice = '_(एजेंसी पर्चा — डब्बा / खोका / बंडल)_\n\n';
    } else if (activeTab === 'daily_van') {
      title = `*दैनिक वैन सेल्समैन काउंटर ऑर्डर — ${shopName}*\n`;
      notice = '_(दैनिक वैन डिलीवरी — रैक रिफिल)_\n\n';
    } else {
      title = `*थोक सप्लायर ऑर्डर पर्चा — ${shopName}*\n\n`;
    }

    let text = `${title}${notice}`;
    text += `*तारीख:* ${new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n`;
    if (ownerName) text += `*दुकानदार:* ${ownerName}\n`;
    if (phone) text += `*संपर्क:* ${phone}\n`;
    text += `───────────────\n`;

    selectedLines.forEach((line, i) => {
      const unitStr = localizeUnit(line.item.unit, language);
      const itemName = localizeItemName(line.item.name, language);
      text += `${i + 1}. *${itemName}*\n`;
      text += `   • मात्रा: *${line.packsCount} ${t.perPack}* (${line.totalUnits} ${unitStr})\n`;
      text += `   • अनुमानित दर: ₹${line.item.buyPrice}/${unitStr} | कुल: ₹${line.totalCost.toLocaleString('en-IN')}\n`;
    });

    text += `───────────────\n`;
    text += `*कुल अनुमानित राशि:* ₹${totalCost.toLocaleString('en-IN')}\n\n`;
    text += `_Sent via Krōw Store Manager_`;

    return text;
  };

  const handleSendWhatsApp = () => {
    const text = generateSlipText();
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopySlip = () => {
    const text = generateSlipText();
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Daily Salesman actions
  const handleMarkOrderGiven = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOrderGivenTimestamp((prev) => ({
      ...prev,
      [activeTab]: timeStr,
    }));
  };

  const handleReceiveStockFromVan = () => {
    if (!onBatchReceiveStock) return;
    const itemsToReceive = selectedLines.map((line) => ({
      itemId: line.item.id,
      addedQty: line.totalUnits,
    }));

    onBatchReceiveStock(itemsToReceive);
    setReceivedSuccessMessage(t.stockReceivedSuccessMsg);
    setTimeout(() => {
      setReceivedSuccessMessage(null);
    }, 3000);
  };

  // Header & Instructions banner per active tab
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case 'ration':
        return {
          title: t.wholesalerRationTab,
          instruction: t.rationSlipNotice,
          icon: 'receipt_long',
          color: 'from-[#8A5A00]/10 to-[#F0C968]/20',
          borderColor: 'border-[#F0C968]',
          badgeText: 'Send Slip to Mandi',
          isDailySalesman: false,
        };
      case 'tobacco':
        return {
          title: t.wholesalerTobaccoTab,
          instruction: t.tobaccoAgencySlipNotice,
          icon: 'smoke_free',
          color: 'from-[#9E2A2B]/10 to-[#F4A7A8]/20',
          borderColor: 'border-[#F4A7A8]',
          badgeText: 'Send Indent to Agency',
          isDailySalesman: false,
        };
      case 'daily_van':
        return {
          title: t.wholesalerDailyVanTab,
          instruction: t.dailySalesmanNotice,
          icon: 'local_shipping',
          color: 'from-[#1E4632]/10 to-[#A3D9B5]/20',
          borderColor: 'border-[#A3D9B5]',
          badgeText: 'Salesman Visits Daily',
          isDailySalesman: true,
        };
      default:
        return {
          title: t.wholesalerAllTab,
          instruction: t.orderListHeaderDesc,
          icon: 'inventory_2',
          color: 'from-[#FAF7F0] to-[#E4DFD2]/30',
          borderColor: 'border-[#E4DFD2]',
          badgeText: 'All Suppliers',
          isDailySalesman: false,
        };
    }
  }, [activeTab, t]);

  return (
    <div
      id="multi-wholesaler-order-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div className="max-w-xl w-full max-h-[94vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] border border-[#A3D9B5]/50 flex items-center justify-center text-[#1E4632]">
              <span className="material-symbols-outlined text-2xl">
                {tabConfig.icon}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#262421] font-display flex items-center gap-2">
                <span>{t.orderListHeaderTitle}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F0] border border-[#E4DFD2] text-[#726C60]">
                  Krōw Hub
                </span>
              </h2>
              <span className="text-xs text-[#726C60] block">
                {shopName} • {selectedLines.length} {t.itemsCheckingCount}
              </span>
            </div>
          </div>

          <button
            id="close-order-list-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center transition-colors"
            type="button"
            title="बंद करें"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 4 Multi-Wholesaler Channel Tabs */}
        <div className="px-3 pt-2.5 bg-white border-b border-[#E4DFD2] flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            id="tab-wholesaler-ration"
            type="button"
            onClick={() => {
              setActiveTab('ration');
              setSelectedSpecificSupplier('all');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'ration'
                ? 'border-[#8A5A00] text-[#8A5A00] bg-[#FFF8E7]'
                : 'border-transparent text-[#726C60] hover:text-[#262421]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>{t.wholesalerRationTab}</span>
          </button>

          <button
            id="tab-wholesaler-tobacco"
            type="button"
            onClick={() => {
              setActiveTab('tobacco');
              setSelectedSpecificSupplier('all');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'tobacco'
                ? 'border-[#9E2A2B] text-[#9E2A2B] bg-[#FBEAEA]'
                : 'border-transparent text-[#726C60] hover:text-[#262421]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smoke_free</span>
            <span>{t.wholesalerTobaccoTab}</span>
          </button>

          <button
            id="tab-wholesaler-daily-van"
            type="button"
            onClick={() => {
              setActiveTab('daily_van');
              setSelectedSpecificSupplier('all');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'daily_van'
                ? 'border-[#1E4632] text-[#1E4632] bg-[#EBF5EF]'
                : 'border-transparent text-[#726C60] hover:text-[#262421]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span>{t.wholesalerDailyVanTab}</span>
          </button>

          <button
            id="tab-wholesaler-all"
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedSpecificSupplier('all');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'all'
                ? 'border-[#262421] text-[#262421] bg-[#FAF7F0]'
                : 'border-transparent text-[#726C60] hover:text-[#262421]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>{t.wholesalerAllTab}</span>
          </button>
        </div>

        {/* Wholesaler Channel Banner & Workflow Notice */}
        <div className={`p-3 bg-gradient-to-r ${tabConfig.color} border-b ${tabConfig.borderColor} flex items-start gap-2.5`}>
          <span className="material-symbols-outlined text-lg mt-0.5 text-[#262421]/70">
            info
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#262421]">{tabConfig.title}</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/80 border border-black/10 text-[#262421]">
                {tabConfig.badgeText}
              </span>
            </div>
            <p className="text-[11px] text-[#4A453C] mt-0.5 leading-snug">
              {tabConfig.instruction}
            </p>
          </div>
        </div>

        {/* Controls Bar: View Mode Switcher + Specific Supplier Filter + Search */}
        <div className="px-4 py-2.5 bg-white border-b border-[#E4DFD2] flex flex-wrap items-center justify-between gap-2">
          {/* View Mode Toggle: Slip vs List */}
          <div className="flex bg-[#FAF7F0] p-0.5 rounded-xl border border-[#E4DFD2]">
            <button
              id="view-mode-slip-btn"
              type="button"
              onClick={() => setViewMode('slip')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'slip'
                  ? 'bg-white shadow-2xs text-[#1E4632]'
                  : 'text-[#726C60] hover:text-[#262421]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              <span>{t.slipViewMode}</span>
            </button>
            <button
              id="view-mode-list-btn"
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white shadow-2xs text-[#1E4632]'
                  : 'text-[#726C60] hover:text-[#262421]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
              <span>{t.listViewMode}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-[190px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सर्च करें..."
              className="w-full h-8 pl-7 pr-2 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] text-xs text-[#262421] focus:outline-none focus:border-[#1E4632]"
            />
            <span className="material-symbols-outlined text-sm text-[#726C60] absolute left-2 top-2">
              search
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#726C60] hover:text-black"
              >
                <span className="material-symbols-outlined text-xs">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Supplier Filter Pills */}
        {tabSuppliers.length > 2 && (
          <div className="px-4 py-2 bg-white/80 border-b border-[#E4DFD2] flex gap-1.5 overflow-x-auto no-scrollbar">
            {tabSuppliers.map((sup) => (
              <button
                key={sup}
                type="button"
                onClick={() => setSelectedSpecificSupplier(sup)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedSpecificSupplier === sup
                    ? 'bg-[#1E4632] text-white'
                    : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#726C60] hover:bg-[#E4DFD2]'
                }`}
              >
                {sup === 'all' ? t.filterAll : sup}
              </button>
            ))}
          </div>
        )}

        {/* Daily Salesman Status Banner (if order was recorded as given) */}
        {tabConfig.isDailySalesman && orderGivenTimestamp[activeTab] && (
          <div className="mx-4 mt-3 p-2.5 bg-[#EBF5EF] rounded-xl border border-[#A3D9B5] flex items-center justify-between text-xs text-[#1E4632] font-semibold animate-fade-in">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#1E4632]">
                check_circle
              </span>
              <span>
                {t.orderGivenRecordedBadge} ({orderGivenTimestamp[activeTab]})
              </span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold border border-[#A3D9B5]">
              Done ✓
            </span>
          </div>
        )}

        {/* Received Success Message Banner */}
        {receivedSuccessMessage && (
          <div className="mx-4 mt-3 p-2.5 bg-[#D4EDDA] rounded-xl border border-[#C3E6CB] flex items-center gap-2 text-xs text-[#155724] font-bold animate-fade-in">
            <span className="material-symbols-outlined text-base">task_alt</span>
            <span>{receivedSuccessMessage}</span>
          </div>
        )}

        {/* Body Content: Either Slip View or List View */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1">
          {displayedLines.length === 0 ? (
            <div className="text-center py-12 text-[#726C60]">
              <span className="material-symbols-outlined text-4xl text-[#1E4632] mb-2">
                check_circle
              </span>
              <p className="text-sm font-bold text-[#262421]">
                {t.emptyOrderListMsg}
              </p>
              <p className="text-xs text-[#726C60] mt-1">
                इस चैनल में कोई सामान रीऑर्डर सीमा के नीचे नहीं है।
              </p>
            </div>
          ) : viewMode === 'slip' ? (
            /* ========================================================================= */
            /* 1. AUTHENTIC KIRANA ORDER SLIP (दुकान का पर्चा) VIEW                      */
            /* ========================================================================= */
            <div
              id="authentic-order-slip-card"
              className="bg-[#FFFDF9] rounded-2xl border border-[#E0D8C7] shadow-sm p-4 text-[#262421] font-sans relative overflow-hidden"
              style={{
                backgroundImage: 'radial-gradient(#E8DFCE 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Slip Top Header */}
              <div className="border-b-2 border-dashed border-[#C8BEAB] pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-[#1E4632] font-display">
                      {shopName}
                    </h3>
                    <p className="text-[11px] text-[#726C60]">
                      {tabConfig.title} • {tabConfig.badgeText}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#726C60] block">
                      पर्चा क्र. #{Math.floor(Date.now() / 100000).toString().slice(-4)}
                    </span>
                    <span className="text-xs font-semibold text-[#262421]">
                      {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Wholesaler & Method Indicator */}
                <div className="mt-2 pt-2 border-t border-[#E8DFCE] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[#726C60]">
                    <span className="font-bold text-[#262421]">सप्लायर:</span>
                    <span className="truncate max-w-[200px]">
                      {selectedSpecificSupplier !== 'all' ? selectedSpecificSupplier : tabConfig.title}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#1E4632]">
                    {tabConfig.isDailySalesman ? 'वैन काउंटर ऑर्डर' : 'पर्चा डिलीवरी'}
                  </div>
                </div>
              </div>

              {/* Lined Items Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[11px] font-bold text-[#726C60] border-b border-[#E8DFCE] pb-1 uppercase tracking-wider">
                  <span className="col-span-1">#</span>
                  <span className="col-span-6">सामान का नाम</span>
                  <span className="col-span-3 text-right">मात्रा (पेटी/यूनिट)</span>
                  <span className="col-span-2 text-right">रुपये</span>
                </div>

                {displayedLines.map((ol, idx) => {
                  const unitStr = localizeUnit(ol.item.unit, language);
                  return (
                    <div
                      key={ol.item.id}
                      onClick={() => toggleSelect(ol.item.id)}
                      className={`grid grid-cols-12 text-xs py-1.5 border-b border-[#F0EAE1] items-center cursor-pointer transition-colors ${
                        ol.selected ? 'text-[#262421]' : 'opacity-40 line-through text-[#999]'
                      } hover:bg-black/2 rounded`}
                    >
                      <span className="col-span-1 font-bold text-[#726C60] text-[11px]">
                        {idx + 1}.
                      </span>
                      <div className="col-span-6 pr-1">
                        <span className="font-bold block truncate">
                          {localizeItemName(ol.item.name, language)}
                        </span>
                        <span className="text-[10px] text-[#726C60]">
                          स्टॉक: {ol.item.currentQuantity} {unitStr} (न्यूनतम: {ol.item.reorderLevel})
                        </span>
                      </div>
                      <div className="col-span-3 text-right pr-1">
                        <span className="font-extrabold text-[#1E4632] block">
                          {ol.packsCount} {t.perPack}
                        </span>
                        <span className="text-[10px] text-[#726C60]">
                          ({ol.totalUnits} {unitStr})
                        </span>
                      </div>
                      <span className="col-span-2 text-right font-extrabold text-[#1E4632] font-display">
                        ₹{ol.totalCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Slip Total Footer */}
              <div className="mt-3 pt-3 border-t-2 border-dashed border-[#C8BEAB] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#726C60] block font-medium">
                    कुल चयनित सामान: {selectedLines.length}
                  </span>
                  <span className="text-[11px] text-[#8A5A00] font-semibold">
                    थोक छूट व कार्टन मार्जिन शामिल
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#726C60] block">अनुमानित कुल</span>
                  <span className="text-xl font-extrabold text-[#1E4632] font-display">
                    ₹{totalCost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. INTERACTIVE ITEM LIST VIEW WITH COUNTER STEPPERS                       */
            /* ========================================================================= */
            <div className="flex flex-col gap-2.5">
              {displayedLines.map((ol) => {
                const unitStr = localizeUnit(ol.item.unit, language);
                const badge = getChannelBadgeDetails(ol.channel, language);

                return (
                  <div
                    key={ol.item.id}
                    className={`bg-white rounded-2xl border p-3.5 shadow-2xs transition-all ${
                      ol.selected ? 'border-[#1E4632]/40 bg-white' : 'border-[#E4DFD2] opacity-60 bg-[#FAF7F0]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={ol.selected}
                        onChange={() => toggleSelect(ol.item.id)}
                        className="w-5 h-5 mt-0.5 rounded text-[#1E4632] focus:ring-[#1E4632] accent-[#1E4632]"
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

                        {/* Wholesaler & Channel Tag */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bgColor} ${badge.textColor} ${badge.badgeBorder}`}>
                            {badge.title}
                          </span>
                          <span className="text-[11px] text-[#726C60] truncate max-w-[180px]">
                            {ol.supplierName}
                          </span>
                        </div>

                        {/* Pack breakdown */}
                        <div className="text-xs text-[#726C60] mt-1">
                          {ol.packsCount} {t.perPack} ({ol.totalUnits} {unitStr}) • ₹{ol.item.buyPrice}/{unitStr}
                        </div>

                        {/* Counter Stepper + Stock Status */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E4DFD2]/60">
                          <span className="text-[11px] text-[#C1443B] font-semibold">
                            {t.stockLeftPrefix} {ol.item.currentQuantity} {unitStr} ({t.reorderBadge}: {ol.item.reorderLevel})
                          </span>

                          {/* Packs Stepper */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updatePacksCount(ol.item.id, ol.packsCount - 1)}
                              className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] text-sm font-bold text-[#262421] flex items-center justify-center active:scale-90"
                              title="मात्रा घटाएं"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-[#262421]">
                              {ol.packsCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePacksCount(ol.item.id, ol.packsCount + 1)}
                              className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] text-sm font-bold text-[#262421] flex items-center justify-center active:scale-90"
                              title="मात्रा बढ़ाएं"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Salesman Action Panel (Only on Bread, Biscuits & Chips Tab) */}
        {tabConfig.isDailySalesman && displayedLines.length > 0 && (
          <div className="px-4 py-2.5 bg-[#EBF5EF]/80 border-t border-[#A3D9B5] flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-[#1E4632]">
              <span className="font-bold block">सेल्समैन काउंटर ऑर्डर</span>
              <span className="text-[10px] text-[#456A54]">
                दुकान पर खड़े सेल्समैन को ऑर्डर दें या वैन से माल प्राप्त करें
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="mark-daily-order-given-btn"
                type="button"
                onClick={handleMarkOrderGiven}
                className="h-8 px-3 rounded-lg bg-white border border-[#1E4632] text-[#1E4632] font-bold text-xs flex items-center gap-1 hover:bg-[#1E4632] hover:text-white active:scale-95 transition-all shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>{t.markOrderGivenBtn}</span>
              </button>

              {onBatchReceiveStock && (
                <button
                  id="receive-van-stock-btn"
                  type="button"
                  onClick={handleReceiveStockFromVan}
                  className="h-8 px-3 rounded-lg bg-[#1E4632] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#153424] active:scale-95 transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">inventory</span>
                  <span>{t.receiveStockFromVanBtn}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Order Summary & Actions */}
        <div className="p-4 bg-white border-t border-[#E4DFD2] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[#726C60] block">
                {t.estimatedPaymentLabel} ({selectedLines.length} सामान)
              </span>
              <span className="text-2xl font-extrabold text-[#1E4632] font-display">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Copy slip button */}
              <button
                id="copy-slip-btn"
                type="button"
                onClick={handleCopySlip}
                className="h-9 px-3 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] text-[#262421] font-bold text-xs flex items-center gap-1 hover:bg-[#E4DFD2] active:scale-95 transition-all"
                title="पर्चा टेक्स्ट कॉपी करें"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedToast ? 'check' : 'content_copy'}
                </span>
                <span>{copiedToast ? 'कॉपी हुआ!' : t.copySlipBtn}</span>
              </button>
            </div>
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
              className="h-12 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
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
