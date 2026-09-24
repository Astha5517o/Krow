import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { StockItem, Language, SaleRecord, Customer, CartItem } from '../types';
import { translations } from '../translations';
import { playScanBeep, playSuccessChime } from '../utils/audio';
import { safeStopScanner } from '../utils/scannerUtils';
import { searchKaryanaMaster, KaryanaMasterItem } from '../data/karyanaMasterCatalog';
import { searchStationeryMaster } from '../data/stationeryMasterCatalog';
import { lookupMasterBarcode, normalizeBarcode } from '../data/masterBarcodes';
import { resolveProductByBarcode } from '../services/barcodeLookupService';
import { LooseWeightSellModal } from './LooseWeightSellModal';

interface QuickSellModalProps {
  language: Language;
  stockItems: StockItem[];
  customers?: Customer[];
  shopName?: string;
  preselectedItem?: StockItem;
  onRecordSale?: (sale: SaleRecord, remainingQty: number) => void;
  onConfirmCartSale: (
    cart: CartItem[],
    paymentMode: 'cash' | 'upi' | 'credit',
    customerId?: string
  ) => void;
  onAddUdhaarTransaction?: (
    customerId: string,
    type: 'credit' | 'payment',
    amount: number,
    note: string
  ) => void;
  onAddMasterItemToStock?: (itemData: Omit<StockItem, 'id' | 'createdAt'>) => StockItem;
  onClose: () => void;
  onSwitchToScanToSell?: () => void;
}

export const QuickSellModal: React.FC<QuickSellModalProps> = ({
  language,
  stockItems,
  customers = [],
  shopName = 'किराना स्टोर',
  preselectedItem,
  onRecordSale,
  onConfirmCartSale,
  onAddUdhaarTransaction,
  onAddMasterItemToStock,
  onClose,
  onSwitchToScanToSell,
}) => {
  const t = translations[language];

  // Counter Cart State: The list of items brought on the counter
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (preselectedItem) {
      const profit = (preselectedItem.sellPrice - preselectedItem.buyPrice) * 1;
      return [
        {
          item: preselectedItem,
          quantity: 1,
          sellPrice: preselectedItem.sellPrice,
          buyPrice: preselectedItem.buyPrice,
          lineTotal: preselectedItem.sellPrice,
          lineProfit: profit,
        },
      ];
    }
    return [];
  });

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Checkout Mode & State
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [lastCompletedCart, setLastCompletedCart] = useState<CartItem[]>([]);
  const [lastCompletedMode, setLastCompletedMode] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [lastCustomerName, setLastCustomerName] = useState<string>('');

  // Custom / Loose Item popup state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');

  // Open Namkeen & Loose Weight (50g for ₹10) modal state
  const [showLooseWeightModal, setShowLooseWeightModal] = useState(false);
  const [looseWeightTargetItem, setLooseWeightTargetItem] = useState<StockItem | undefined>(undefined);

  // Barcode Camera Scanner inside Counter POS
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isResolvingBarcode, setIsResolvingBarcode] = useState(false);
  const [autoAddedToast, setAutoAddedToast] = useState<{ name: string; price: number; quantity?: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'counter-pos-camera-region';

  // Derived Metrics
  const totalBill = useMemo(() => cart.reduce((sum, ci) => sum + ci.lineTotal, 0), [cart]);
  const totalProfit = useMemo(() => cart.reduce((sum, ci) => sum + ci.lineProfit, 0), [cart]);
  const totalUnits = useMemo(
    () => cart.reduce((sum, ci) => sum + (ci.isLooseSold ? 1 : ci.quantity), 0),
    [cart]
  );

  // Categories extracted from stock
  const categories = useMemo(() => {
    const cats = Array.from(new Set(stockItems.map((i) => i.category))).filter(Boolean);
    return ['all', ...cats];
  }, [stockItems]);

  // Filtered Stock for Search / Selection
  const filteredItems = useMemo(() => {
    let list = stockItems;
    if (selectedCategory !== 'all') {
      list = list.filter((i) => i.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.barcode && i.barcode.includes(q))
      );
    }
    return list;
  }, [stockItems, selectedCategory, searchQuery]);

  // Popular Shelf: Top items with highest sales history or first 8 items
  const popularItems = useMemo(() => {
    return [...stockItems]
      .sort((a, b) => {
        const aSales = (a.salesHistory || []).reduce((acc, v) => acc + v, 0);
        const bSales = (b.salesHistory || []).reduce((acc, v) => acc + v, 0);
        return bSales - aSales;
      })
      .slice(0, 8);
  }, [stockItems]);

  // Master Catalog Matches for instant addition to counter list even if not yet in shop stock
  const masterCatalogMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const statResults = searchStationeryMaster(q, 6);
    const karyanaResults = searchKaryanaMaster(q, 6);
    const combined = [...statResults, ...karyanaResults];
    return combined.filter(
      (m) =>
        !stockItems.some(
          (s) =>
            s.name.toLowerCase() === m.name.toLowerCase() ||
            (m.barcode && s.barcode === m.barcode)
        )
    ).slice(0, 8);
  }, [searchQuery, stockItems]);

  // Suggestions inside the custom/loose item dialog
  const customMasterMatches = useMemo(() => {
    if (!customItemName.trim()) return [];
    const q = customItemName.trim();
    const statResults = searchStationeryMaster(q, 4);
    const karyanaResults = searchKaryanaMaster(q, 4);
    return [...statResults, ...karyanaResults].slice(0, 6);
  }, [customItemName]);

  const handleAddMasterItemToCounter = (mItem: KaryanaMasterItem) => {
    const stockRepresentation: StockItem = {
      id: 'master-' + mItem.id,
      name: mItem.name,
      category: mItem.category,
      unit: mItem.unit || 'पैकेट',
      currentQuantity: 999,
      reorderLevel: 5,
      buyPrice: mItem.buyPrice || Math.round(mItem.sellPrice * 0.85),
      sellPrice: mItem.sellPrice,
      barcode: mItem.barcode,
      isPerishable: mItem.isPerishable,
      exchangeType: mItem.exchangeType || 'none',
      isLooseItem: mItem.isLooseItem,
      bulkPackWeightKg: mItem.bulkPackWeightKg,
      looseRatePer50g: mItem.looseRatePer50g,
      looseRatePer100g: mItem.looseRatePer100g,
      createdAt: new Date().toISOString(),
    };

    if (mItem.isLooseItem || mItem.unit === 'किलो' || mItem.name.toLowerCase().includes('खुली')) {
      setLooseWeightTargetItem(stockRepresentation);
      setShowLooseWeightModal(true);
      return;
    }

    handleAddItemToCounter(stockRepresentation, 1);
  };

  // Add Item to Counter
  const handleAddItemToCounter = (item: StockItem, qtyToAdd = 1) => {
    playScanBeep();
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) =>
          ci.item.id === item.id ||
          (item.barcode && ci.item.barcode && ci.item.barcode === item.barcode)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + qtyToAdd;
        const lineTotal = item.sellPrice * newQty;
        const lineProfit = (item.sellPrice - item.buyPrice) * newQty;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          lineTotal,
          lineProfit,
        };
        return updated;
      } else {
        const lineTotal = item.sellPrice * qtyToAdd;
        const lineProfit = (item.sellPrice - item.buyPrice) * qtyToAdd;
        return [
          ...prev,
          {
            item,
            quantity: qtyToAdd,
            sellPrice: item.sellPrice,
            buyPrice: item.buyPrice,
            lineTotal,
            lineProfit,
          },
        ];
      }
    });
  };

  const lastScannedBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Intelligent Universal Barcode Processing
  // Guarantees all product details (name, MRP, category, unit, wholesale price)
  // are auto-resolved and automatically added to the counter bill!
  const handleProcessScannedBarcode = async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    const now = Date.now();
    if (lastScannedBarcodeRef.current.code === clean && now - lastScannedBarcodeRef.current.time < 1200) {
      return; // Debounce rapid multi-frames of same barcode
    }
    lastScannedBarcodeRef.current = { code: clean, time: now };

    const normScan = normalizeBarcode(clean);

    // 1. Look up matching item in shop's existing stock
    const match = stockItems.find(
      (i) => i.barcode === clean || (i.barcode && normalizeBarcode(i.barcode) === normScan)
    );

    if (match) {
      handleAddItemToCounter(match, 1);
      setAutoAddedToast({ name: match.name, price: match.sellPrice });
      setTimeout(() => setAutoAddedToast(null), 2500);
      return;
    }

    // 2. Look up matching product in Master Catalog (e.g. Parle-G, Kurkure, Lays, Maggi)
    const masterMatch = lookupMasterBarcode(clean);
    if (masterMatch) {
      const itemData: Omit<StockItem, 'id' | 'createdAt'> = {
        name: language === 'en' ? (masterMatch.nameEn || masterMatch.name) : masterMatch.name,
        category: masterMatch.category,
        unit: masterMatch.unit || 'पैकेट',
        barcode: masterMatch.barcode || clean,
        buyPrice: masterMatch.buyPrice || Math.round(masterMatch.sellPrice * 0.85),
        sellPrice: masterMatch.sellPrice,
        currentQuantity: 20,
        reorderLevel: 5,
        isPerishable: false,
        exchangeType: 'none',
      };

      let finalItem: StockItem;
      if (onAddMasterItemToStock) {
        finalItem = onAddMasterItemToStock(itemData);
      } else {
        finalItem = {
          ...itemData,
          id: 'item-master-' + clean.replace(/\D/g, '') + '-' + Date.now(),
          createdAt: new Date().toISOString(),
        };
      }
      handleAddItemToCounter(finalItem, 1);
      setAutoAddedToast({ name: finalItem.name, price: finalItem.sellPrice });
      setTimeout(() => setAutoAddedToast(null), 2500);
      return;
    }

    // 3. Universal Resolution (Server AI / OpenFoodFacts + Indian Manufacturer Rules)
    // Never prompts the user to type details manually!
    try {
      setIsResolvingBarcode(true);
      const resolved = await resolveProductByBarcode(clean, stockItems);
      setIsResolvingBarcode(false);

      if (resolved) {
        const itemData: Omit<StockItem, 'id' | 'createdAt'> = {
          name: language === 'en' ? (resolved.nameEn || resolved.name) : resolved.name,
          category: resolved.category || 'पैकेज्ड फूड',
          unit: resolved.unit || 'पैकेट',
          barcode: clean,
          buyPrice: resolved.buyPrice || Math.round((resolved.sellPrice || 20) * 0.85),
          sellPrice: resolved.sellPrice || 20,
          currentQuantity: 20,
          reorderLevel: 5,
          isPerishable: false,
          exchangeType: 'none',
        };

        let finalItem: StockItem;
        if (onAddMasterItemToStock) {
          finalItem = onAddMasterItemToStock(itemData);
        } else {
          finalItem = {
            ...itemData,
            id: 'item-auto-' + clean.replace(/\D/g, '') + '-' + Date.now(),
            createdAt: new Date().toISOString(),
          };
        }
        handleAddItemToCounter(finalItem, 1);
        setAutoAddedToast({ name: finalItem.name, price: finalItem.sellPrice });
        setTimeout(() => setAutoAddedToast(null), 2500);
      }
    } catch {
      setIsResolvingBarcode(false);
    }
  };

  // Update Item Quantity in Cart
  const handleUpdateQty = (index: number, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      const updated = [...prev];
      const entry = updated[index];
      if (entry.isLooseSold) {
        const portionCount = newQty;
        const lineTotal = entry.sellPrice * portionCount;
        const lineProfit = (entry.sellPrice - entry.buyPrice) * portionCount;
        const singlePortionKg = entry.weightGrams ? (entry.weightGrams / 1000) : 0.05;
        const updatedKg = entry.item && (entry.item.unit === 'किलो' || entry.item.unit.toLowerCase() === 'kg')
          ? Math.round(singlePortionKg * portionCount * 1000) / 1000
          : portionCount;
        updated[index] = {
          ...entry,
          quantity: updatedKg,
          lineTotal,
          lineProfit,
        };
        return updated;
      }
      const lineTotal = entry.sellPrice * newQty;
      const lineProfit = (entry.sellPrice - entry.buyPrice) * newQty;
      updated[index] = {
        ...entry,
        quantity: newQty,
        lineTotal,
        lineProfit,
      };
      return updated;
    });
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add Custom / Loose Item to Counter
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customItemPrice);
    const qty = parseFloat(customItemQty) || 1;
    if (!customItemName.trim() || isNaN(price) || price <= 0) return;

    const dummyItem: StockItem = {
      id: 'custom-' + Date.now(),
      name: customItemName.trim(),
      category: 'विविध / अन्य',
      unit: 'यूनिट',
      currentQuantity: 999,
      reorderLevel: 0,
      buyPrice: Math.round(price * 0.85),
      sellPrice: price,
      isPerishable: false,
      exchangeType: 'none',
      createdAt: new Date().toISOString(),
    };

    handleAddItemToCounter(dummyItem, qty);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty('1');
    setShowCustomModal(false);
  };

  // Barcode Camera Lifecycle
  useEffect(() => {
    if (!cameraActive) {
      if (scannerRef.current) {
        const scannerInstance = scannerRef.current;
        scannerRef.current = null;
        safeStopScanner(scannerInstance);
      }
      return;
    }

    let isSubscribed = true;
    let qrScanner: Html5Qrcode | null = null;

    try {
      qrScanner = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      scannerRef.current = qrScanner;
    } catch {
      setCameraError('कैमरा शुरू नहीं हो सका');
      setCameraActive(false);
      return;
    }

    const qrConfig = {
      fps: 20,
      qrbox: { width: 240, height: 160 },
      aspectRatio: 1.5,
    };

    const handleQuickScan = (decodedText: string) => {
      if (!isSubscribed) return;
      handleProcessScannedBarcode(decodedText);
    };

    qrScanner
      .start({ facingMode: 'environment' }, qrConfig, handleQuickScan, () => {})
      .then(() => {
        if (!isSubscribed && qrScanner) {
          safeStopScanner(qrScanner);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setCameraError(
            err?.message ||
              'कैमरा अनुमति नहीं मिली। कृपया ब्राउज़र में कैमरा Allow करें।'
          );
          setCameraActive(false);
        }
      });

    return () => {
      isSubscribed = false;
      if (qrScanner) {
        safeStopScanner(qrScanner);
        if (scannerRef.current === qrScanner) {
          scannerRef.current = null;
        }
      }
    };
  }, [cameraActive, stockItems]);

  // Global Hardware USB / Bluetooth Barcode Scanner Gun Listener
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Enter key signals end of barcode from scanner gun
      if (e.key === 'Enter') {
        if (keyBuffer.length >= 6) {
          e.preventDefault();
          handleProcessScannedBarcode(keyBuffer);
          keyBuffer = '';
        }
        return;
      }

      // If typed quickly (< 60ms) or not inside another text input, buffer it
      if (e.key.length === 1 && (!isInput || timeDiff < 60)) {
        if (timeDiff > 250) {
          keyBuffer = ''; // Reset buffer if pause between keystrokes was too long
        }
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stockItems, language]);

  // Finalize Sale (Fast Checkout)
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    playSuccessChime();

    // Confirm bulk sale across stock
    onConfirmCartSale(cart, paymentMode, paymentMode === 'credit' ? selectedCustomerId : undefined);

    // If credit, post to udhaar transaction
    if (paymentMode === 'credit' && selectedCustomerId && onAddUdhaarTransaction) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const itemSummary = cart.map((ci) => `${ci.item.name} (${ci.quantity})`).join(', ');
      onAddUdhaarTransaction(
        selectedCustomerId,
        'credit',
        totalBill,
        `काउंटर बिल: ${itemSummary.slice(0, 100)}`
      );
      setLastCustomerName(customer?.name || 'ग्राहक');
    }

    setLastCompletedCart([...cart]);
    setLastCompletedMode(paymentMode);
    setSaleCompleted(true);
  };

  // Reset for Next Customer
  const handleNextCustomer = () => {
    setCart([]);
    setSaleCompleted(false);
    setSearchQuery('');
    setCashTendered('');
    setLastCompletedCart([]);
  };

  // WhatsApp Receipt Text Builder
  const buildWhatsAppReceiptText = () => {
    const todayStr = new Date().toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = new Date().toLocaleTimeString('hi-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const lines = lastCompletedCart.map((ci, idx) => {
      const weightLabel = ci.weightDisplay ? ` (${ci.weightDisplay})` : '';
      const qtyLabel = ci.weightDisplay ? `1 × ₹${ci.lineTotal}` : `${ci.quantity} × ₹${ci.sellPrice}`;
      return `${idx + 1}. ${ci.item.name}${weightLabel}\n   ${qtyLabel} = ₹${ci.lineTotal}`;
    });

    const modeLabel =
      lastCompletedMode === 'cash'
        ? 'नकद (Cash)'
        : lastCompletedMode === 'upi'
        ? 'ऑनलाइन (UPI QR)'
        : `उधार खाता (${lastCustomerName || 'ग्राहक'})`;

    const total = lastCompletedCart.reduce((sum, ci) => sum + ci.lineTotal, 0);

    return (
      `*${shopName}*\n` +
      `दिनांक: ${todayStr} • ${timeStr}\n\n` +
      `*काउंटर बिक्री बिल*\n` +
      `--------------------------------\n` +
      lines.join('\n') +
      `\n--------------------------------\n` +
      `*कुल बिल राशि: ₹${total}*\n` +
      `भुगतान: ${modeLabel}\n` +
      `--------------------------------\n` +
      `धन्यवाद! फिर पधारें।`
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildWhatsAppReceiptText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Change Return Calculation
  const cashGiven = parseFloat(cashTendered) || 0;
  const changeToReturn = cashGiven > totalBill ? cashGiven - totalBill : 0;

  return (
    <div
      id="counter-pos-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        id="counter-pos-modal-container"
        className="max-w-2xl w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-scale-up"
      >
        {/* MODAL HEADER */}
        <div className="px-4 py-3 bg-white border-b border-[#E4DFD2] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E4632] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">point_of_sale</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#262421] leading-tight">
                {t.counterBillingTitle}
              </h2>
              <p className="text-[11px] text-[#726C60] leading-none mt-0.5">
                {t.counterBillingSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Barcode Camera */}
            <button
              id="counter-toggle-camera-btn"
              type="button"
              onClick={() => {
                setCameraError(null);
                setCameraActive((prev) => !prev);
              }}
              className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                cameraActive
                  ? 'bg-[#1E4632] text-white'
                  : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#4A453C] hover:bg-[#E7F0EA]'
              }`}
              title="कैमरा बारकोड स्कैनर"
            >
              <span className="material-symbols-outlined text-base">
                {cameraActive ? 'videocam_off' : 'barcode_scanner'}
              </span>
              <span className="hidden sm:inline">
                {cameraActive ? 'कैमरा बंद करें' : 'बारकोड स्कैन'}
              </span>
            </button>

            {/* Close Modal */}
            <button
              id="counter-close-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF7F0] text-[#726C60] hover:text-[#262421] hover:bg-[#EAE4D7] flex items-center justify-center transition-colors"
              type="button"
              aria-label="बंद करें"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* SALE COMPLETED SUCCESS SCREEN */}
        {saleCompleted ? (
          <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center gap-4 bg-white">
            <div className="w-16 h-16 rounded-full bg-[#E7F0EA] border-2 border-[#2F6B4F] text-[#1E4632] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl">check</span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#2F6B4F] uppercase tracking-wider block">
                बिक्री पक्की हुई
              </span>
              <h3 className="text-2xl font-extrabold text-[#1E4632] mt-1 font-display">
                ₹{lastCompletedCart.reduce((s, ci) => s + ci.lineTotal, 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-[#726C60] mt-1">
                {lastCompletedCart.length} सामान • मुनाफा +₹
                {lastCompletedCart.reduce((s, ci) => s + ci.lineProfit, 0).toFixed(0)} दर्ज किया गया
              </p>
            </div>

            {/* Bill Summary Ticket Preview */}
            <div className="w-full max-w-md bg-[#FAF7F0] rounded-2xl border border-[#E4DFD2] p-4 text-left shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E4DFD2] pb-2 mb-2">
                <span className="text-xs font-bold text-[#262421]">{shopName}</span>
                <span className="text-[11px] text-[#726C60]">
                  {new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {lastCompletedCart.map((ci, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-[#262421] truncate max-w-[220px]">
                      {ci.item.name} {ci.weightDisplay ? `(${ci.weightDisplay})` : `× ${ci.quantity}`}
                    </span>
                    <span className="font-bold text-[#262421]">₹{ci.lineTotal}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-[#E4DFD2] flex items-center justify-between text-xs font-bold">
                <span className="text-[#726C60]">
                  भुगतान: {lastCompletedMode === 'cash' ? 'नकद' : lastCompletedMode === 'upi' ? 'UPI' : 'उधार खाता'}
                </span>
                <span className="text-sm font-extrabold text-[#1E4632]">
                  कुल: ₹{lastCompletedCart.reduce((s, ci) => s + ci.lineTotal, 0)}
                </span>
              </div>
            </div>

            {/* Fast Actions: WhatsApp Slip & Next Customer */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
              <button
                id="counter-share-whatsapp-btn"
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full sm:flex-1 h-12 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>{t.counterWhatsAppReceipt}</span>
              </button>

              <button
                id="counter-next-sale-btn"
                type="button"
                onClick={handleNextCustomer}
                className="w-full sm:flex-1 h-12 rounded-xl bg-[#1E4632] hover:bg-[#143224] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                <span>{t.counterNextCustomerBtn}</span>
              </button>
            </div>
          </div>
        ) : (
          /* MAIN COUNTER INTERFACE */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* CAMERA REGION (if active) */}
            {cameraActive && (
              <div className="bg-[#122F22] p-2 flex flex-col items-center border-b border-[#2F6B4F]">
                <div
                  id={qrRegionId}
                  className="w-full max-w-xs h-40 rounded-xl overflow-hidden bg-black"
                />
                <span className="text-[11px] text-[#A3D9B5] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">center_focus_strong</span>
                  पैकेट का बारकोड दिखाएं, स्वतः काउंटर लिस्ट में जुड़ेगा
                </span>
                {cameraError && (
                  <span className="text-xs text-[#FF8B8B] mt-1">{cameraError}</span>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              {/* 1. BRING THINGS ON COUNTER: Live Search & Popular Quick Shelf */}
              <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#262421] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#1E4632]">
                      add_circle
                    </span>
                    <span>{t.counterBringPrompt}</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      id="counter-open-loose-weight-btn"
                      type="button"
                      onClick={() => {
                        setLooseWeightTargetItem(undefined);
                        setShowLooseWeightModal(true);
                      }}
                      className="text-xs font-bold text-[#1E4632] hover:text-[#143022] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E7F0EA] border border-[#2F6B4F]/40 transition-all shadow-2xs active:scale-95"
                      title="खुली नमकीन / वजन अनुसार 50g-₹10 बेचें"
                    >
                      <span className="material-symbols-outlined text-sm text-[#2F6B4F]">scale</span>
                      <span>⚖️ खुली नमकीन (50g=₹10)</span>
                    </button>
                    <button
                      id="counter-add-custom-item-btn"
                      type="button"
                      onClick={() => setShowCustomModal(true)}
                      className="text-xs font-bold text-[#8A5A00] hover:text-[#5E3D00] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF8E7] border border-[#F0DFA8] transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      <span>{t.counterAddCustomItem}</span>
                    </button>
                  </div>
                </div>

                {/* Auto-Add Toast Banner */}
                {autoAddedToast && (
                  <div className="bg-[#1E4632] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all animate-bounce">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#A3D9B5]">check_circle</span>
                      <span>
                        {language === 'en'
                          ? `✓ Auto-added: ${autoAddedToast.name} (₹${autoAddedToast.price})`
                          : `✓ स्वतः काउंटर लिस्ट में जोड़ा: ${autoAddedToast.name} (₹${autoAddedToast.price})`}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#2F6B4F] px-1.5 py-0.5 rounded text-[#E7F0EA]">1 Qty</span>
                  </div>
                )}

                {/* Barcode Resolving Spinner */}
                {isResolvingBarcode && (
                  <div className="bg-[#E7F0EA] border border-[#2F6B4F] text-[#1E4632] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>
                      {language === 'en'
                        ? 'Resolving barcode & fetching product details automatically...'
                        : 'बारकोड से सामान की पूरी जानकारी स्वतः लोड हो रही है...'}
                    </span>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#726C60] text-lg">
                    search
                  </span>
                  <input
                    id="counter-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const q = searchQuery.trim();
                        if (!q) return;
                        // If it's a barcode (e.g. 5+ numbers)
                        if (/^\d{5,}$/.test(q)) {
                          handleProcessScannedBarcode(q);
                          setSearchQuery('');
                          return;
                        }
                        // If filtered stock has an exact match or single match
                        if (filteredItems.length === 1) {
                          handleAddItemToCounter(filteredItems[0], 1);
                          setSearchQuery('');
                          return;
                        }
                        if (filteredItems.length > 0) {
                          handleAddItemToCounter(filteredItems[0], 1);
                          setSearchQuery('');
                        }
                      }
                    }}
                    placeholder={
                      language === 'en'
                        ? 'Type item name or barcode / scan with gun...'
                        : 'सामान का नाम या बारकोड टाइप करें / गन से स्कैन करें...'
                    }
                    className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] text-xs text-[#262421] font-medium placeholder-[#726C60] focus:outline-none focus:border-[#1E4632] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-[#726C60] hover:text-[#262421]"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>

                {/* Filter / Category Pills */}
                {searchQuery === '' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                    {categories.slice(0, 7).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#1E4632] text-white'
                            : 'bg-[#FAF7F0] text-[#726C60] hover:text-[#262421] border border-[#E4DFD2]'
                        }`}
                      >
                        {cat === 'all' ? 'सभी' : cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Items Quick Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                  {(searchQuery ? filteredItems : popularItems).map((item) => {
                    const cartEntry = cart.find((ci) => ci.item.id === item.id);
                    const isLoose =
                      item.isLooseItem ||
                      item.unit === 'किलो' ||
                      item.unit.toLowerCase() === 'kg' ||
                      item.name.toLowerCase().includes('खुली') ||
                      item.name.toLowerCase().includes('नमकीन');

                    return (
                      <div
                        key={item.id}
                        id={`counter-quick-add-${item.id}`}
                        onClick={() => {
                          if (isLoose) {
                            setLooseWeightTargetItem(item);
                            setShowLooseWeightModal(true);
                          } else {
                            handleAddItemToCounter(item, 1);
                          }
                        }}
                        className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[58px] cursor-pointer active:scale-95 ${
                          cartEntry
                            ? 'bg-[#E7F0EA] border-[#2F6B4F] shadow-2xs'
                            : 'bg-[#FAF7F0] hover:bg-white border-[#E4DFD2]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-[#262421] line-clamp-1 leading-tight">
                            {item.name}
                          </span>
                          {cartEntry && (
                            <span className="w-5 h-5 rounded-full bg-[#1E4632] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {cartEntry.weightDisplay ? '1' : cartEntry.quantity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-1 text-[#726C60]">
                          <span className="font-bold text-[#1E4632]">
                            {isLoose
                              ? `₹${item.looseRatePer50g || Math.round(item.sellPrice / 20)}/50g`
                              : `₹${item.sellPrice}`}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px]">
                              {item.currentQuantity} {item.unit}
                            </span>
                            {isLoose && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLooseWeightTargetItem(item);
                                  setShowLooseWeightModal(true);
                                }}
                                className="px-1 py-0.2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-extrabold text-[9px]"
                                title="वजन अनुसार तौलकर 50g-₹10 बेचें"
                              >
                                ⚖️ तौलें
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Master Catalog Quick-Add for Counter List (when searched) */}
                {searchQuery && masterCatalogMatches.length > 0 && (
                  <div className="pt-2.5 border-t border-[#E4DFD2] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#1E4632] font-bold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#2F6B4F]">auto_awesome</span>
                        <span>{language === 'en' ? 'Master Catalog Quick-Add to Bill:' : 'किराना मास्टर कैटलॉग (1-क्लिक में काउंटर बिल पर जोड़ें):'}</span>
                      </span>
                      <span className="text-[10px] text-[#726C60]">{masterCatalogMatches.length} उपलब्ध</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {masterCatalogMatches.map((mItem) => (
                        <button
                          key={mItem.id}
                          type="button"
                          onClick={() => handleAddMasterItemToCounter(mItem)}
                          className="p-2 rounded-xl text-left border border-dashed border-[#2F6B4F] bg-[#F4F9F6] hover:bg-[#E7F0EA] transition-all flex flex-col justify-between min-h-[58px] active:scale-95 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-[#1E4632] line-clamp-1 leading-tight group-hover:text-[#16291E]">
                              {mItem.name}
                            </span>
                            <span className="text-[9px] bg-[#2F6B4F]/10 text-[#2F6B4F] px-1 py-0.2 rounded font-bold">
                              +जोड़ें
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1 text-[#726C60]">
                            <span className="font-extrabold text-[#1E4632]">₹{mItem.sellPrice}</span>
                            <span className="text-[10px]">{mItem.unit}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. MAKE A LIST OF IT: The Live Counter Bill List */}
              <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#8A5A00]">
                      receipt_long
                    </span>
                    <span className="text-xs font-bold text-[#262421]">
                      {t.counterItemsOnCounter} ({cart.length} प्रकार • {totalUnits} यूनिट)
                    </span>
                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-[11px] text-[#9E2A2B] hover:underline font-semibold"
                    >
                      खाली करें
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="py-6 px-4 text-center rounded-xl bg-[#FAF7F0] border border-dashed border-[#C8BEAB]">
                    <span className="material-symbols-outlined text-3xl text-[#726C60]">
                      shopping_basket
                    </span>
                    <p className="text-xs font-medium text-[#726C60] mt-1 max-w-sm mx-auto">
                      {t.counterEmptyMsg}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Item Rows */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {cart.map((ci, idx) => (
                        <div
                          key={idx}
                          id={`counter-cart-item-${ci.item.id}`}
                          className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#262421] truncate">
                                {ci.item.name}
                              </span>
                              {ci.weightDisplay && (
                                <span className="text-[10px] font-extrabold bg-[#2F6B4F]/10 text-[#1E4632] px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[11px]">scale</span>
                                  <span>{ci.weightDisplay}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#726C60] mt-0.5">
                              <span>
                                {ci.weightDisplay
                                  ? `दर: ₹${ci.sellPrice}`
                                  : `₹${ci.sellPrice} / ${ci.item.unit}`}
                              </span>
                              <span className="text-[#2F6B4F] font-semibold">
                                +₹{(ci.lineProfit || 0).toFixed(0)} मुनाफ़ा
                              </span>
                            </div>
                          </div>

                          {/* Stepper Quantity */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (ci.isLooseSold) {
                                  const currentCount = Math.round(ci.lineTotal / (ci.sellPrice || 1));
                                  handleUpdateQty(idx, currentCount - 1);
                                } else {
                                  handleUpdateQty(idx, ci.quantity - 1);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-white border border-[#E4DFD2] text-sm font-bold text-[#262421] hover:bg-[#EAE4D7] flex items-center justify-center active:scale-90"
                              title="मात्रा कम करें"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-extrabold text-[#1E4632]">
                              {ci.isLooseSold
                                ? Math.max(1, Math.round(ci.lineTotal / (ci.sellPrice || 1)))
                                : ci.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (ci.isLooseSold) {
                                  const currentCount = Math.round(ci.lineTotal / (ci.sellPrice || 1));
                                  handleUpdateQty(idx, currentCount + 1);
                                } else {
                                  handleUpdateQty(idx, ci.quantity + 1);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-white border border-[#E4DFD2] text-sm font-bold text-[#262421] hover:bg-[#EAE4D7] flex items-center justify-center active:scale-90"
                              title="मात्रा बढ़ाएं"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="w-16 text-right flex-shrink-0">
                            <span className="text-xs font-extrabold text-[#262421] block">
                              ₹{ci.lineTotal}
                            </span>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="w-6 h-6 rounded-full text-[#726C60] hover:text-[#9E2A2B] hover:bg-white flex items-center justify-center"
                            title="हटाएं"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Reassurance Notice: Nothing Missed */}
                    <div className="px-3 py-1.5 rounded-lg bg-[#E7F0EA] border border-[#2F6B4F]/20 flex items-center gap-1.5 text-[11px] text-[#1E4632] font-semibold">
                      <span className="material-symbols-outlined text-sm text-[#2F6B4F]">
                        verified
                      </span>
                      <span>{t.counterNothingMissedMsg}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. SELL IT — QUICK PROCESS: Running Total & Payment Selection */}
              {cart.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3.5 shadow-xs space-y-3">
                  {/* Bill Summary Banner */}
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#726C60] block font-medium">
                        {t.counterRunningTotal}
                      </span>
                      <span className="text-2xl font-extrabold text-[#1E4632] font-display">
                        ₹{totalBill.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#726C60] block">अनुमानित शुद्ध मुनाफ़ा</span>
                      <span className="text-sm font-extrabold text-[#2F6B4F] bg-[#E7F0EA] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                        +₹{totalProfit.toFixed(0)} मुनाफ़ा
                      </span>
                    </div>
                  </div>

                  {/* Payment Mode Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      id="counter-pay-mode-cash"
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        paymentMode === 'cash'
                          ? 'bg-[#1E4632] text-white border-[#1E4632] shadow-xs'
                          : 'bg-[#FAF7F0] border-[#E4DFD2] text-[#4A453C] hover:bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">payments</span>
                      <span>नकद (Cash)</span>
                    </button>

                    <button
                      id="counter-pay-mode-upi"
                      type="button"
                      onClick={() => setPaymentMode('upi')}
                      className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        paymentMode === 'upi'
                          ? 'bg-[#1E4632] text-white border-[#1E4632] shadow-xs'
                          : 'bg-[#FAF7F0] border-[#E4DFD2] text-[#4A453C] hover:bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                      <span>ऑनलाइन / UPI</span>
                    </button>

                    <button
                      id="counter-pay-mode-credit"
                      type="button"
                      onClick={() => setPaymentMode('credit')}
                      className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        paymentMode === 'credit'
                          ? 'bg-[#8A5A00] text-white border-[#8A5A00] shadow-xs'
                          : 'bg-[#FAF7F0] border-[#E4DFD2] text-[#4A453C] hover:bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">menu_book</span>
                      <span>खाता (Udhaar)</span>
                    </button>
                  </div>

                  {/* CASH MODE: Change Calculator */}
                  {paymentMode === 'cash' && (
                    <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#726C60] font-medium">ग्राहक ने दिए:</span>
                        <input
                          id="counter-cash-given-input"
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder={`₹${totalBill}`}
                          className="w-24 h-8 px-2 rounded-lg bg-white border border-[#E4DFD2] text-xs font-bold text-[#262421] focus:outline-none focus:border-[#1E4632]"
                        />
                      </div>

                      {changeToReturn > 0 && (
                        <div className="text-right text-xs">
                          <span className="text-[#726C60]">वापस करें: </span>
                          <span className="font-extrabold text-[#9E2A2B] font-display">
                            ₹{changeToReturn}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPI MODE: Instant Payment Hint */}
                  {paymentMode === 'upi' && (
                    <div className="p-2.5 rounded-xl bg-[#E7F0EA] border border-[#2F6B4F]/30 flex items-center gap-2 text-xs text-[#1E4632]">
                      <span className="material-symbols-outlined text-base">qr_code_2</span>
                      <span>
                        ग्राहक से ₹{totalBill} का UPI / QR स्कैन करवाएं और नीचे पुष्टि करें
                      </span>
                    </div>
                  )}

                  {/* UDHAAR MODE: Select Customer */}
                  {paymentMode === 'credit' && (
                    <div className="p-2.5 rounded-xl bg-[#FFF8E7] border border-[#F0DFA8] space-y-1.5">
                      <label className="text-xs font-bold text-[#8A5A00] block">
                        उधार खाता ग्राहक चुनें:
                      </label>
                      <select
                        id="counter-select-customer"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-[#F0DFA8] text-xs font-semibold text-[#262421] focus:outline-none"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''} • पुराना बाकी: ₹{c.balance}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* FINAL 1-TAP CONFIRM BUTTON */}
                  <button
                    id="counter-confirm-sale-btn"
                    type="button"
                    onClick={handleFinalizeSale}
                    className={`w-full h-12 rounded-xl text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all ${
                      paymentMode === 'credit'
                        ? 'bg-[#8A5A00] hover:bg-[#684300]'
                        : 'bg-[#1E4632] hover:bg-[#122F22]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <span>
                      {paymentMode === 'credit'
                        ? `खाते में लिखें (₹${totalBill})`
                        : `बिक्री पक्की करें (₹${totalBill})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM / LOOSE ITEM MODAL DIALOG */}
        {showCustomModal && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3 animate-fade-in">
            <div className="max-w-xs w-full bg-white rounded-2xl border border-[#E4DFD2] p-4 shadow-xl space-y-3 animate-scale-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#262421]">
                  अन्य खुला सामान जोड़ें
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="text-[#726C60]"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleAddCustomItem} className="space-y-2.5">
                <div className="relative">
                  <label className="text-[11px] font-semibold text-[#726C60] block mb-1">
                    सामान का नाम:
                  </label>
                  <input
                    type="text"
                    required
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="जैसे: धनिया, दही, खुला आटा, मैगी"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#E4DFD2] text-xs text-[#262421] focus:outline-none focus:border-[#1E4632]"
                  />
                  {customMasterMatches.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {customMasterMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setCustomItemName(m.name);
                            setCustomItemPrice(String(m.sellPrice));
                          }}
                          className="text-[10px] bg-[#E7F0EA] hover:bg-[#D5E6DA] text-[#1E4632] px-2 py-0.5 rounded-full font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>{m.name}</span>
                          <span className="font-bold">₹{m.sellPrice}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[#726C60] block mb-1">
                      दर (₹):
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder="10"
                      className="w-full h-9 px-2.5 rounded-lg border border-[#E4DFD2] text-xs text-[#262421] focus:outline-none focus:border-[#1E4632]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#726C60] block mb-1">
                      मात्रा:
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={customItemQty}
                      onChange={(e) => setCustomItemQty(e.target.value)}
                      placeholder="1"
                      className="w-full h-9 px-2.5 rounded-lg border border-[#E4DFD2] text-xs text-[#262421] focus:outline-none focus:border-[#1E4632]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 h-9 rounded-lg border border-[#E4DFD2] text-xs font-semibold text-[#726C60]"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-[#1E4632] text-white text-xs font-bold"
                  >
                    जोड़ें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Open Loose Namkeen & Weight Selling Modal */}
        {showLooseWeightModal && (
          <LooseWeightSellModal
            language={language}
            stockItems={stockItems}
            preselectedItem={looseWeightTargetItem}
            onAddToCart={(cartItem) => {
              setCart((prev) => [...prev, cartItem]);
              setShowLooseWeightModal(false);
            }}
            onClose={() => setShowLooseWeightModal(false)}
          />
        )}
      </div>
    </div>
  );
};
