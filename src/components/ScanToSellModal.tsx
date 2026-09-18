import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { StockItem, Language } from '../types';
import { playScanBeep, playSuccessChime } from '../utils/audio';
import { lookupMasterBarcode, MasterProduct } from '../data/masterBarcodes';

export interface CartItem {
  item: StockItem;
  quantity: number;
  sellPrice: number;
  buyPrice: number;
  lineTotal: number;
  lineProfit: number;
}

interface ScanToSellModalProps {
  language: Language;
  stockItems: StockItem[];
  initialItem?: StockItem;
  initialShowLoosePicker?: boolean;
  onConfirmSale: (cart: CartItem[]) => void;
  onUpdateItemBarcode?: (itemId: string, barcode: string) => void;
  onLinkBarcode?: (itemId: string, barcode: string) => void;
  onAddNewWithBarcode?: (barcode: string) => void;
  onAddNewItemWithBarcode?: (barcode: string) => void;
  onAddMasterItemToStock?: (itemData: Omit<StockItem, 'id' | 'createdAt'>) => StockItem;
  onClose: () => void;
}

export const ScanToSellModal: React.FC<ScanToSellModalProps> = ({
  language,
  stockItems,
  initialItem,
  initialShowLoosePicker = false,
  onConfirmSale,
  onUpdateItemBarcode,
  onLinkBarcode,
  onAddNewWithBarcode,
  onAddNewItemWithBarcode,
  onAddMasterItemToStock,
  onClose,
}) => {
  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [macroZoom, setMacroZoom] = useState(false);
  const macroZoomRef = useRef(false);

  // Keep macroZoomRef synced
  useEffect(() => {
    macroZoomRef.current = macroZoom;
  }, [macroZoom]);

  // Rapid Scan Mode: When active, immediately adds +1 to cart on scan with instant sound/haptic
  const [rapidMode, setRapidMode] = useState(false);
  const [rapidScanBanner, setRapidScanBanner] = useState<{ name: string; price: number } | null>(null);

  // Test simulation dropdown (discreet, no screen clutter)
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  // Loose Item Picker state (att, dal, sugar, milk without barcodes)
  const [showLoosePicker, setShowLoosePicker] = useState(initialShowLoosePicker);
  const [looseSearch, setLooseSearch] = useState('');
  const [selectedLooseCategory, setSelectedLooseCategory] = useState('all');
  const [selectedLooseItem, setSelectedLooseItem] = useState<StockItem | null>(null);
  const [looseQty, setLooseQty] = useState<number>(1);

  // Cart / session state - initialized with initialItem if provided
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (initialItem) {
      return [
        {
          item: initialItem,
          quantity: 1,
          sellPrice: initialItem.sellPrice,
          buyPrice: initialItem.buyPrice,
          lineTotal: initialItem.sellPrice,
          lineProfit: Math.max(0, initialItem.sellPrice - initialItem.buyPrice),
        },
      ];
    }
    return [];
  });
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [lastCompletedCart, setLastCompletedCart] = useState<CartItem[]>([]);

  // Confirmation card state for matched item (Normal Mode)
  const [scannedMatchedItem, setScannedMatchedItem] = useState<{
    item: StockItem;
    quantity: number;
  } | null>(null);

  // Master Catalog match (Item recognized in master catalog, but not yet in local stock)
  const [matchedMasterProduct, setMatchedMasterProduct] = useState<{
    product: MasterProduct;
    barcode: string;
  } | null>(null);

  // Unrecognized barcode state (Neither in local stock nor in master catalog)
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string | null>(null);
  const [linkTargetItemId, setLinkTargetItemId] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'krow-barcode-reader';
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const isCardOpenRef = useRef<boolean>(false);
  const rapidModeRef = useRef<boolean>(rapidMode);

  // Keep rapidModeRef synced for scanner callback
  useEffect(() => {
    rapidModeRef.current = rapidMode;
  }, [rapidMode]);

  // Synchronize active card state to prevent unwanted frame re-scans while confirming
  useEffect(() => {
    isCardOpenRef.current = Boolean(scannedMatchedItem || matchedMasterProduct || unrecognizedBarcode);
  }, [scannedMatchedItem, matchedMasterProduct, unrecognizedBarcode]);

  // Total cart calculations
  const totalItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const totalSaleAmount = cart.reduce((sum, ci) => sum + ci.lineTotal, 0);
  const totalSaleProfit = cart.reduce((sum, ci) => sum + ci.lineProfit, 0);

  // Add an item to the active cart session
  const addItemToCart = (item: StockItem, quantity = 1) => {
    const lineTotal = quantity * item.sellPrice;
    const lineProfit = quantity * (item.sellPrice - item.buyPrice);

    setCart((prev) => {
      const existingIdx = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: newQty * item.sellPrice,
          lineProfit: newQty * (item.sellPrice - item.buyPrice),
        };
        return updated;
      }
      return [
        ...prev,
        {
          item,
          quantity,
          sellPrice: item.sellPrice,
          buyPrice: item.buyPrice,
          lineTotal,
          lineProfit,
        },
      ];
    });
  };

  // Process a scanned code (from camera, manual entry, or physical barcode gun)
  const handleBarcodeScanned = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Tactile haptic feedback on supported mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {}
    }

    playScanBeep();

    // Normalization helper (handles leading zero differences in UPC/EAN)
    const normalize = (val: string) => val.trim().replace(/\D/g, '').replace(/^0+/, '');
    const normTarget = normalize(code);

    // 1. First check in current shop stock
    const matched = stockItems.find((it) => {
      if (!it.barcode) return false;
      const cleanIt = it.barcode.trim();
      return cleanIt === code || (normTarget && normalize(cleanIt) === normTarget);
    });

    if (matched) {
      if (rapidModeRef.current) {
        // Superfast Rapid Mode: immediately add to cart + flash toast
        addItemToCart(matched, 1);
        setRapidScanBanner({ name: matched.name, price: matched.sellPrice });
        setTimeout(() => setRapidScanBanner(null), 2000);
      } else {
        // Confirmation mode: show quantity selector card
        setScannedMatchedItem({
          item: matched,
          quantity: 1,
        });
        setMatchedMasterProduct(null);
        setUnrecognizedBarcode(null);
      }
      return;
    }

    // 2. Check in Central Master Barcode Catalog (Maggi, Coke, Thums Up, Lay's, etc.)
    const masterMatch = lookupMasterBarcode(code);
    if (masterMatch) {
      setMatchedMasterProduct({
        product: masterMatch,
        barcode: code,
      });
      setScannedMatchedItem(null);
      setUnrecognizedBarcode(null);
      return;
    }

    // 3. Unrecognized barcode: prompt shopkeeper to link or create
    setUnrecognizedBarcode(code);
    setScannedMatchedItem(null);
    setMatchedMasterProduct(null);
  };

  // Global Hardware USB / Bluetooth Barcode Scanner Listener
  // Catches keystrokes sent at high speed from physical barcode guns
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
          handleBarcodeScanned(keyBuffer);
          keyBuffer = '';
        }
        return;
      }

      // If typed quickly (< 50ms) or not inside another text input, buffer it
      if (e.key.length === 1 && (!isInput || timeDiff < 60)) {
        if (timeDiff > 250) {
          keyBuffer = ''; // Reset buffer if pause between keystrokes was too long
        }
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stockItems]);

  // Start High-Speed HTML5 Camera Scanner
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);

        // Hardware accelerated BarcodeDetector when available + all common retail formats
        const html5Qr = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });

        html5QrCodeRef.current = html5Qr;

        // Tuned for high-speed 30 FPS scanning; adaptive height for small sachets and 1D retail bars
        const config = {
          fps: 30,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.max(260, Math.min(420, Math.floor(viewfinderWidth * 0.94)));
            const height = Math.max(130, Math.min(240, Math.floor(viewfinderHeight * 0.65)));
            return { width, height };
          },
          aspectRatio: 1.333333,
          disableFlip: false,
        };

        const cameraConfig = {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        };

        await html5Qr.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (!isMounted) return;
            // Freeze scan intake while shopkeeper is confirming active item (in normal mode)
            if (!rapidModeRef.current && isCardOpenRef.current) return;

            const now = Date.now();
            const clean = decodedText.trim();
            // Prevent duplicate burst scans of the same item within 1.2s in normal mode, or 0.8s in rapid mode
            const minInterval = rapidModeRef.current ? 800 : 1200;
            if (clean === lastScanRef.current.code && now - lastScanRef.current.time < minInterval) {
              return;
            }
            lastScanRef.current = { code: clean, time: now };
            handleBarcodeScanned(clean);
          },
          () => {}
        );

        if (isMounted) {
          setScannerActive(true);
        }
      } catch (err) {
        console.warn('Camera could not be started or permission denied:', err);
        if (isMounted) {
          setScannerActive(false);
          setCameraError(
            language === 'en'
              ? 'Camera unavailable or permission denied. You can enter barcodes manually or use a USB scanner.'
              : language === 'pa'
              ? 'ਕੈਮਰਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਤੁਸੀਂ ਬਾਰਕੋਡ ਨੰਬਰ ਲਿਖ ਸਕਦੇ ਹੋ।'
              : 'कैमरा उपलब्ध नहीं है या अनुमति नहीं मिली। आप बारकोड नंबर लिखकर या USB गन से स्कैन कर सकते हैं।'
          );
        }
      }
    }

    const timer = setTimeout(() => {
      initCamera();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, [isFrontCamera, language]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {
      // torch not supported on this device/browser
    }
  };

  // Toggle 2x Macro Zoom for Small Packaging & Sachets
  const handleToggleMacroZoom = async () => {
    const nextZoom = !macroZoom;
    setMacroZoom(nextZoom);

    // 1. Try hardware track zoom if device camera driver supports it
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ zoom: nextZoom ? 2.0 : 1.0 } as unknown as MediaTrackConstraintSet],
        });
      } catch {
        // hardware digital zoom not supported, css fallback below handles it seamlessly
      }
    }

    // 2. Optical CSS zoom on the viewfinder video element for crisp close-up framing
    const videoEl = document.querySelector(`#${scannerContainerId} video`) as HTMLVideoElement | null;
    if (videoEl) {
      videoEl.style.transform = nextZoom ? 'scale(1.55)' : 'scale(1)';
      videoEl.style.transformOrigin = 'center center';
      videoEl.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    }
  };

  // Add matched item to current sale session basket
  const handleConfirmAddToBasket = () => {
    if (!scannedMatchedItem) return;
    addItemToCart(scannedMatchedItem.item, scannedMatchedItem.quantity);
    setScannedMatchedItem(null);
  };

  // Add Master Product to shop stock and immediately add to cart
  const handleAddMasterProductToCartAndStock = () => {
    if (!matchedMasterProduct) return;
    const { product, barcode } = matchedMasterProduct;

    let createdItem: StockItem;

    if (onAddMasterItemToStock) {
      createdItem = onAddMasterItemToStock({
        name: language === 'en' ? product.nameEn : product.name,
        category: product.category,
        unit: product.unit,
        barcode: barcode,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        currentQuantity: 20, // Initial stock
        reorderLevel: 5,
        isPerishable: false,
        exchangeType: 'none',
      });
    } else {
      // Fallback local creation
      createdItem = {
        id: 'item-master-' + Date.now(),
        name: language === 'en' ? product.nameEn : product.name,
        category: product.category,
        unit: product.unit,
        barcode: barcode,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        currentQuantity: 20,
        reorderLevel: 5,
        isPerishable: false,
        exchangeType: 'none',
        createdAt: new Date().toISOString(),
      };
    }

    // Immediately add to current cart
    addItemToCart(createdItem, 1);
    setMatchedMasterProduct(null);
  };

  // Modify quantity inside running sale basket
  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...ci,
              quantity: newQty,
              lineTotal: newQty * ci.sellPrice,
              lineProfit: newQty * (ci.sellPrice - ci.buyPrice),
            };
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Link unrecognized barcode to an existing item
  const handleLinkBarcode = () => {
    const code = unrecognizedBarcode || matchedMasterProduct?.barcode;
    if (!code || !linkTargetItemId) return;

    const targetItem = stockItems.find((it) => it.id === linkTargetItemId);
    if (!targetItem) return;

    if (onUpdateItemBarcode) {
      onUpdateItemBarcode(targetItem.id, code);
    } else if (onLinkBarcode) {
      onLinkBarcode(targetItem.id, code);
    }

    // After linking, add to current basket
    addItemToCart({ ...targetItem, barcode: code }, 1);
    setUnrecognizedBarcode(null);
    setMatchedMasterProduct(null);
    setLinkTargetItemId('');
  };

  // Final sale confirmation: deduct stock and log profit
  const handleFinalConfirmSale = () => {
    if (cart.length === 0) return;
    playSuccessChime();
    setLastCompletedCart([...cart]);
    onConfirmSale(cart);
    setSaleCompleted(true);
  };

  // Reset to start a new sale
  const handleStartNewSale = () => {
    setCart([]);
    setSaleCompleted(false);
    setScannedMatchedItem(null);
    setMatchedMasterProduct(null);
    setUnrecognizedBarcode(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full max-h-[94vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2F6B4F] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-2xl">barcode_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold text-[#16291E]">
                  {language === 'en' ? 'Quick Sell' : language === 'pa' ? 'ਤੁਰੰਤ ਵਿਕਰੀ (Quick Sell)' : 'त्वरित बिक्री (Quick Sell)'}
                </h2>
                <span className="text-[10px] font-black bg-[#2F6B4F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  BARCODE POS
                </span>
              </div>
              <p className="text-[11px] text-[#6B7C72]">
                {language === 'en'
                  ? 'Barcode scanner & loose items instant checkout'
                  : 'बारकोड स्कैन करें या खुला राशन तुरंत बेचें'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#6B7C72] flex items-center justify-center transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {saleCompleted ? (
            /* SALE COMPLETED CONFIRMATION */
            <div className="bg-white rounded-2xl p-6 border border-[#E4DFD2] text-center space-y-4 shadow-sm animate-scale-up">
              <div className="w-16 h-16 bg-[#2F6B4F]/15 rounded-full flex items-center justify-center mx-auto text-[#2F6B4F]">
                <span className="material-symbols-outlined text-3xl font-bold">check</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[#16291E]">
                  {language === 'en' ? 'Sale Completed!' : 'बिक्री सफलतापूर्वक दर्ज हुई!'}
                </h3>
                <p className="text-xs text-[#6B7C72] mt-1">
                  {language === 'en'
                    ? 'Stock quantities updated and profit recorded.'
                    : 'दुकान का स्टॉक घटा दिया गया और मुनाफ़ा खाते में दर्ज हो गया।'}
                </p>
              </div>

              <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E4DFD2] space-y-2 text-left">
                <div className="flex justify-between text-xs text-[#6B7C72]">
                  <span>{language === 'en' ? 'Items Sold' : 'कुल बिके सामान'}:</span>
                  <span className="font-bold text-[#16291E]">
                    {lastCompletedCart.reduce((sum, ci) => sum + ci.quantity, 0)} {language === 'en' ? 'items' : 'पीस'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#6B7C72]">
                  <span>{language === 'en' ? 'Total Bill' : 'कुल बिल रकम'}:</span>
                  <span className="font-bold text-base text-[#16291E]">
                    ₹{lastCompletedCart.reduce((sum, ci) => sum + ci.lineTotal, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#2F6B4F] pt-2 border-t border-[#E4DFD2]">
                  <span className="font-bold">{language === 'en' ? 'Earned Profit' : 'शुद्ध मुनाफ़ा'}:</span>
                  <span className="font-black text-base text-[#2F6B4F]">
                    +₹{lastCompletedCart.reduce((sum, ci) => sum + ci.lineProfit, 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#262421] text-xs font-bold rounded-xl border border-[#E4DFD2]"
                >
                  {language === 'en' ? 'Done' : 'पूर्ण'}
                </button>
                <button
                  type="button"
                  onClick={handleStartNewSale}
                  className="py-2.5 px-4 bg-[#2F6B4F] hover:bg-[#23533D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  <span>{language === 'en' ? 'Next Customer' : 'अगला ग्राहक'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PRESELECTED ITEM NOTIFICATION (When opened via "Sell" button on a specific item) */}
              {initialItem && cart.some((ci) => ci.item.id === initialItem.id) && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-950 animate-scale-up shadow-2xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-emerald-700 text-base">check_circle</span>
                    <span className="font-bold truncate">
                      {initialItem.name} — ₹{initialItem.sellPrice}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] bg-emerald-700 text-white font-extrabold px-2 py-0.5 rounded-full">
                    {language === 'en' ? 'In Bill (+1)' : 'बिल में जुड़ा (+1)'}
                  </span>
                </div>
              )}

              {/* SPEED TOGGLE & CONTROLS ROW */}
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-[#E4DFD2]">
                <button
                  type="button"
                  onClick={() => setRapidMode(!rapidMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    rapidMode
                      ? 'bg-[#2F6B4F] text-white shadow-xs'
                      : 'bg-[#FAF7F0] text-[#4A5D52] hover:bg-[#E7F0EA]'
                  }`}
                  title={rapidMode ? 'Rapid scan mode ON' : 'Switch to rapid scan mode'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {rapidMode ? 'bolt' : 'touch_app'}
                  </span>
                  <span>
                    {rapidMode
                      ? language === 'en'
                        ? 'Rapid POS Mode: ON'
                        : 'सुपरफ़ास्ट मोड: चालू'
                      : language === 'en'
                      ? 'Confirm Mode'
                      : 'पुष्टि मोड'}
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  {/* 2x Macro Zoom for Small Packaging & Sachets */}
                  <button
                    type="button"
                    onClick={handleToggleMacroZoom}
                    className={`h-8 px-2 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
                      macroZoom
                        ? 'bg-[#2F6B4F] text-white shadow-xs ring-2 ring-emerald-400'
                        : 'bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#2F6B4F]'
                    }`}
                    title={macroZoom ? 'Macro Zoom 2x ON' : 'Turn on 2x Macro Zoom for small sachets'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {macroZoom ? 'zoom_in' : 'manage_search'}
                    </span>
                    <span>{macroZoom ? '2x ऑन' : 'छोटा पैकेट (2x)'}</span>
                  </button>

                  {/* Torch Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      torchOn ? 'bg-amber-400 text-black' : 'bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#4A5D52]'
                    }`}
                    title="Flashlight"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {torchOn ? 'flash_on' : 'flash_off'}
                    </span>
                  </button>

                  {/* Camera Flip */}
                  <button
                    type="button"
                    onClick={() => setIsFrontCamera(!isFrontCamera)}
                    className="w-8 h-8 rounded-lg bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#4A5D52] flex items-center justify-center transition-colors"
                    title="Flip Camera"
                  >
                    <span className="material-symbols-outlined text-sm">cameraswitch</span>
                  </button>

                  {/* Discreet Simulation Dropdown button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTestDropdown(!showTestDropdown)}
                      className="px-2 py-1 bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#4A5D52] text-[11px] font-semibold rounded-lg flex items-center gap-1"
                      title="Test Barcode"
                    >
                      <span className="material-symbols-outlined text-xs">science</span>
                      <span>टेस्ट</span>
                    </button>

                    {showTestDropdown && (
                      <div className="absolute right-0 mt-1 w-64 max-h-80 overflow-y-auto bg-white border border-[#E4DFD2] rounded-xl shadow-xl p-2 z-30 space-y-1.5 text-xs animate-scale-up">
                        {/* Section 1: Small packets & sachets */}
                        <div className="border-b border-[#E4DFD2] pb-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 px-2 py-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">filter_vintage</span>
                            <span>{language === 'en' ? 'Small Packets & Sachets (₹1-₹5):' : 'छोटे पैकेट व पाउच (₹1-₹5):'}</span>
                          </p>
                          {[
                            { name: 'क्लिनिक प्लस पाउच ₹1', code: '8901030006241', price: 1 },
                            { name: 'पल्स कच्चा आम कैंडी ₹1', code: '8901296061015', price: 1 },
                            { name: 'घड़ी डिटर्जेंट पाउच ₹1', code: '8906007280010', price: 1 },
                            { name: 'एम माचिस ₹1', code: '8901725151012', price: 1 },
                            { name: 'नेस्कैफे कॉफी पाउच ₹2', code: '8901058870022', price: 2 },
                            { name: 'पारले-जी ₹5 पैकेट', code: '8901719101015', price: 5 },
                            { name: 'मैगी मसाला-ए-मैजिक ₹5', code: '8901058853636', price: 5 },
                            { name: 'लेज़ मैजिक मसाला ₹5 मिनी', code: '8901491503020', price: 5 },
                            { name: 'कोलगेट मिनी 20g ₹10', code: '8901314011015', price: 10 },
                          ].map((s) => (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => {
                                handleBarcodeScanned(s.code);
                                setShowTestDropdown(false);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-50 flex justify-between items-center text-[#16291E]"
                            >
                              <span className="truncate font-medium">{s.name}</span>
                              <span className="font-bold text-emerald-700 ml-1">₹{s.price}</span>
                            </button>
                          ))}
                        </div>

                        {/* Section 2: Standard Retail items */}
                        <div>
                          <p className="text-[10px] font-bold text-[#6B7C72] px-2 py-0.5">
                            {language === 'en' ? 'Standard Packaged Goods:' : 'स्टैंडर्ड पैकेट:'}
                          </p>
                          {[
                            { name: 'मैगी 70g नूडल्स ₹14', code: '8901058852899', price: 14 },
                            { name: 'मैगी ₹10 छोटा पैकेट', code: '8901058852905', price: 10 },
                            { name: 'कोका-कोला 300ml ₹30', code: '8901764012273', price: 30 },
                            { name: 'थम्स अप 300ml ₹30', code: '8901764022272', price: 30 },
                            { name: 'स्टिंग 250ml ₹20', code: '8901491102506', price: 20 },
                            { name: 'लेज़ मैजिक मसाला ₹10', code: '8901491503037', price: 10 },
                            { name: 'कुरकुरे मसाला मंच ₹10', code: '8901491001175', price: 10 },
                          ].map((s) => (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => {
                                handleBarcodeScanned(s.code);
                                setShowTestDropdown(false);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#FAF7F0] flex justify-between items-center text-[#16291E]"
                            >
                              <span className="truncate">{s.name}</span>
                              <span className="font-bold text-[#2F6B4F]">₹{s.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CAMERA VIEWFINDER (HIGH-SPEED SCANNING WITH GREEN RETICLE) */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 shadow-inner border-2 border-[#16291E]/20">
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Macro Zoom Active Badge */}
                {macroZoom && (
                  <div className="absolute top-2.5 left-2.5 z-20 bg-emerald-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-white/20">
                    <span className="material-symbols-outlined text-[13px]">zoom_in</span>
                    <span>{language === 'en' ? '2x Macro Zoom: Small Packets' : '2x ज़ूम: छोटे पैकेट / पाउच'}</span>
                  </div>
                )}

                {/* Targeting Overlay with Retail 1D Barcode Box */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="relative w-full max-w-[320px] h-[120px] rounded-xl border-2 border-dashed border-emerald-400/80 bg-emerald-500/5 flex items-center justify-center shadow-xs">
                    {/* Targeting Reticle Corners */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                    {/* Animated High-Speed Laser Sweep */}
                    <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10B981] animate-pulse" />
                  </div>
                </div>

                {/* Rapid Scan Toast Overlay */}
                {rapidScanBanner && (
                  <div className="absolute bottom-3 left-3 right-3 bg-emerald-700/90 backdrop-blur-xs text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-scale-up">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span className="truncate">✓ {rapidScanBanner.name} +1</span>
                    </span>
                    <span className="shrink-0 bg-white/20 px-2 py-0.5 rounded text-[11px]">
                      ₹{rapidScanBanner.price}
                    </span>
                  </div>
                )}

                {/* Camera Error Message */}
                {cameraError && (
                  <div className="absolute inset-0 bg-black/85 p-4 flex flex-col items-center justify-center text-center text-white">
                    <span className="material-symbols-outlined text-amber-400 text-3xl mb-1">
                      videocam_off
                    </span>
                    <p className="text-xs text-stone-300 max-w-xs">{cameraError}</p>
                  </div>
                )}
              </div>

              {/* MANUAL & USB GUN INPUT BAR */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#E4DFD2] shadow-2xs">
                <span className="material-symbols-outlined text-[#2F6B4F] text-lg ml-2">barcode</span>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScanned(manualCode);
                      setManualCode('');
                    }
                  }}
                  placeholder={
                    language === 'en'
                      ? 'Type barcode or scan with USB gun...'
                      : 'बारकोड नंबर लिखें या गन से स्कैन करें...'
                  }
                  className="flex-1 text-xs bg-transparent border-none outline-none font-mono text-[#16291E]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualCode.trim()) {
                      handleBarcodeScanned(manualCode);
                      setManualCode('');
                    }
                  }}
                  className="px-3 py-1.5 bg-[#2F6B4F] hover:bg-[#23533D] text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {language === 'en' ? 'Check' : 'चेक करें'}
                </button>
              </div>

              {/* QUICK LOOSE ITEMS / UNBARCODED ACCORDION BUTTON */}
              <div className="bg-white rounded-2xl border border-[#E4DFD2] overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowLoosePicker(!showLoosePicker)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors ${
                    showLoosePicker ? 'bg-[#E7F0EA] text-[#1E4632]' : 'hover:bg-[#FAF7F0] text-[#262421]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#2F6B4F]/15 flex items-center justify-center text-[#2F6B4F] shrink-0">
                      <span className="material-symbols-outlined text-base">grain</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-extrabold text-[#16291E] truncate">
                        {language === 'en' ? '+ Add Loose / Unbarcoded Ration' : '+ बिना बारकोड / खुला सामान जोड़ें'}
                      </span>
                      <span className="text-[10px] text-[#726C60] hidden sm:inline font-medium">
                        (आटा, दाल, चीनी, दूध)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold text-[#2F6B4F]">
                      {showLoosePicker
                        ? language === 'en' ? 'Close' : 'बंद करें'
                        : language === 'en' ? '+ Add Loose' : '+ खुला जोड़ें'}
                    </span>
                    <span className="material-symbols-outlined text-sm text-[#726C60]">
                      {showLoosePicker ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {/* LOOSE ITEM PICKER DRAWER */}
                {showLoosePicker && (
                  <div className="p-3 border-t border-[#E4DFD2] bg-[#FAF7F0] space-y-2.5 animate-scale-up">
                    {/* Search & filter */}
                    <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#E4DFD2]">
                      <span className="material-symbols-outlined text-base text-[#726C60]">search</span>
                      <input
                        type="text"
                        value={looseSearch}
                        onChange={(e) => setLooseSearch(e.target.value)}
                        placeholder={language === 'en' ? 'Search loose atta, dal, sugar, milk...' : 'खुला आटा, दाल, चीनी, दूध खोजें...'}
                        className="flex-1 text-xs bg-transparent border-none outline-none text-[#16291E]"
                      />
                      {looseSearch && (
                        <button
                          type="button"
                          onClick={() => setLooseSearch('')}
                          className="text-[#726C60] hover:text-[#16291E]"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      )}
                    </div>

                    {/* Loose Items Selection List */}
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
                      {stockItems
                        .filter((it) => {
                          if (!looseSearch.trim()) return true;
                          const q = looseSearch.toLowerCase();
                          return (
                            it.name.toLowerCase().includes(q) ||
                            it.category.toLowerCase().includes(q) ||
                            (it.unit && it.unit.toLowerCase().includes(q))
                          );
                        })
                        .map((it) => {
                          const isSelected = selectedLooseItem?.id === it.id;
                          const profit = Math.max(0, it.sellPrice - it.buyPrice);
                          return (
                            <div
                              key={it.id}
                              onClick={() => {
                                setSelectedLooseItem(it);
                                setLooseQty(1);
                              }}
                              className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#E7F0EA] border-[#2F6B4F] shadow-2xs'
                                  : 'bg-white hover:bg-[#F3EFE6] border-[#E4DFD2]'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#16291E] truncate">{it.name}</span>
                                  {!it.barcode && (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-medium">
                                      खुला
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#726C60] flex items-center gap-2">
                                  <span>स्टॉक: {it.currentQuantity} {it.unit}</span>
                                  <span>• दर: ₹{it.sellPrice}/{it.unit}</span>
                                </div>
                              </div>
                              <div className="text-right ml-2 shrink-0">
                                <span className="font-black text-sm text-[#16291E] block">₹{it.sellPrice}</span>
                                <span className="text-[10px] text-[#2F6B4F] font-bold">+{profit} मुनाफ़ा</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Selected Item Quantity & Quick Add Drawer */}
                    {selectedLooseItem && (
                      <div className="bg-white p-3 rounded-xl border-2 border-[#2F6B4F] space-y-2.5 animate-scale-up">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#2F6B4F] uppercase tracking-wider block">
                              {language === 'en' ? 'Add to Bill:' : 'बिल में जोड़ने के लिए चुना:'}
                            </span>
                            <h4 className="text-sm font-extrabold text-[#16291E]">
                              {selectedLooseItem.name}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-[#16291E]">
                              ₹{selectedLooseItem.sellPrice * looseQty}
                            </span>
                            <span className="text-[10px] text-[#2F6B4F] font-bold block">
                              +{Math.max(0, (selectedLooseItem.sellPrice - selectedLooseItem.buyPrice) * looseQty)} मुनाफ़ा
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper & Quick Pills */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setLooseQty((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-[#16291E] flex items-center justify-center hover:bg-[#E4DFD2] active:scale-95"
                            >
                              -
                            </button>
                            <span className="text-sm font-black text-[#16291E] min-w-[32px] text-center">
                              {looseQty} {selectedLooseItem.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => setLooseQty((q) => q + 1)}
                              className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-[#16291E] flex items-center justify-center hover:bg-[#E4DFD2] active:scale-95"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick preset buttons (1, 2, 5, 10) */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 5, 10].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setLooseQty(preset)}
                                className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                                  looseQty === preset
                                    ? 'bg-[#2F6B4F] text-white border-[#2F6B4F]'
                                    : 'bg-[#FAF7F0] text-[#16291E] border-[#E4DFD2] hover:bg-[#E4DFD2]'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addItemToCart(selectedLooseItem, looseQty);
                            playScanBeep();
                            setSelectedLooseItem(null);
                            setLooseQty(1);
                            setRapidScanBanner({
                              name: `${selectedLooseItem.name} (${looseQty} ${selectedLooseItem.unit})`,
                              price: selectedLooseItem.sellPrice * looseQty,
                            });
                            setTimeout(() => setRapidScanBanner(null), 2500);
                          }}
                          className="w-full py-2 bg-[#2F6B4F] hover:bg-[#23533D] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98"
                        >
                          <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                          <span>
                            {language === 'en'
                              ? `+ Add to Quick Sell Bill • ₹${selectedLooseItem.sellPrice * looseQty}`
                              : `+ त्वरित बिल में जोड़ें • ₹${selectedLooseItem.sellPrice * looseQty}`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONFIRMATION CARD (NORMAL MODE: NEVER DEDUCT SILENTLY WITHOUT USER APPROVAL) */}
              {scannedMatchedItem && (
                <div className="bg-[#EBF3EE] border-2 border-[#2F6B4F] rounded-2xl p-4 shadow-lg animate-scale-up space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold bg-[#2F6B4F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {language === 'en' ? 'Scanned Match' : 'बारकोड पहचाना गया'}
                      </span>
                      <h4 className="text-base font-extrabold text-[#16291E] mt-1">
                        {scannedMatchedItem.item.name}
                      </h4>
                      <p className="text-xs text-[#4A5D52]">
                        {scannedMatchedItem.item.category} • {scannedMatchedItem.item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#6B7C72] block">
                        {language === 'en' ? 'Price' : 'बिक्री भाव'}
                      </span>
                      <span className="text-lg font-black text-[#16291E]">
                        ₹{scannedMatchedItem.item.sellPrice}
                      </span>
                      <span className="text-[10px] text-[#2F6B4F] block font-bold">
                        +{Math.max(0, scannedMatchedItem.item.sellPrice - scannedMatchedItem.item.buyPrice)} मुनाफ़ा
                      </span>
                    </div>
                  </div>

                  {/* Quantity selector with quick-select pills */}
                  <div className="space-y-2 bg-white rounded-xl p-2.5 border border-[#2F6B4F]/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#16291E]">
                        {language === 'en' ? 'Quantity to Sell:' : 'बेचने की मात्रा:'}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setScannedMatchedItem((prev) =>
                              prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-[#FAF7F0] hover:bg-[#E4DFD2] font-bold text-[#16291E] flex items-center justify-center border border-[#E4DFD2] transition-transform active:scale-90"
                        >
                          -
                        </button>
                        <span className="text-base font-black text-[#16291E] min-w-[28px] text-center">
                          {scannedMatchedItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setScannedMatchedItem((prev) =>
                              prev ? { ...prev, quantity: prev.quantity + 1 } : null
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-[#FAF7F0] hover:bg-[#E4DFD2] font-bold text-[#16291E] flex items-center justify-center border border-[#E4DFD2] transition-transform active:scale-90"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Quick quantity shortcuts */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#E4DFD2]/60">
                      <span className="text-[10px] text-[#6B7C72] font-medium mr-1">
                        {language === 'en' ? 'Quick:' : 'त्वरित:'}
                      </span>
                      {[1, 2, 5, 10].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() =>
                            setScannedMatchedItem((prev) =>
                              prev ? { ...prev, quantity: qty } : null
                            )
                          }
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                            scannedMatchedItem.quantity === qty
                              ? 'bg-[#2F6B4F] text-white'
                              : 'bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#2D3F33] border border-[#E4DFD2]'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confirmation Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setScannedMatchedItem(null)}
                      className="py-2.5 px-3 bg-white hover:bg-[#FAF7F0] text-[#6B7C72] font-semibold text-xs rounded-xl border border-[#E4DFD2]"
                    >
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddToBasket}
                      className="py-2.5 px-3 bg-[#2F6B4F] hover:bg-[#23533D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                      <span>
                        {language === 'en'
                          ? `Add ₹${scannedMatchedItem.quantity * scannedMatchedItem.item.sellPrice}`
                          : `बिल में जोड़ें (₹${scannedMatchedItem.quantity * scannedMatchedItem.item.sellPrice})`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* MASTER CATALOG RECOGNITION CARD (FOUND IN CENTRAL FMCG DATABASE) */}
              {matchedMasterProduct && (
                <div className="bg-[#EBF3EE] border-2 border-emerald-600 rounded-2xl p-4 shadow-lg animate-scale-up space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          {language === 'en' ? 'Master Catalog Match' : 'मास्टर कैटलॉग में मिला'}
                        </span>
                        {matchedMasterProduct.product.isSmallPacket && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">filter_vintage</span>
                            {language === 'en' ? 'Small Sachet / Packet' : 'छोटा पैकेट / पाउच'}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-[#16291E] mt-1.5">
                        {language === 'en' ? matchedMasterProduct.product.nameEn : matchedMasterProduct.product.name}
                      </h4>
                      <p className="text-xs text-[#4A5D52]">
                        {matchedMasterProduct.product.category} • {matchedMasterProduct.product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#6B7C72] block">MRP / भाव</span>
                      <span className="text-lg font-black text-[#16291E]">
                        ₹{matchedMasterProduct.product.sellPrice}
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-bold">
                        +{matchedMasterProduct.product.sellPrice - matchedMasterProduct.product.buyPrice} मुनाफ़ा
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A5D52] bg-white p-2.5 rounded-xl border border-emerald-600/30">
                    {language === 'en'
                      ? 'This item is recognized in the master product catalog. Add it to your store stock and current bill in 1 tap!'
                      : 'यह सामान मास्टर कैटलॉग में मौजूद है। 1-क्लिक में दुकान के स्टॉक में जोड़ें और इस बिल में शामिल करें!'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMatchedMasterProduct(null)}
                      className="py-2.5 px-3 bg-white hover:bg-[#FAF7F0] text-[#6B7C72] font-semibold text-xs rounded-xl border border-[#E4DFD2]"
                    >
                      {language === 'en' ? 'Dismiss' : 'हटाएं'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMasterProductToCartAndStock}
                      className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">add_box</span>
                      <span>
                        {language === 'en' ? 'Add & Sell (₹' + matchedMasterProduct.product.sellPrice + ')' : 'स्टॉक में जोड़ें व बेचें'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* UNRECOGNIZED BARCODE CARD (LINK OR CREATE) */}
              {unrecognizedBarcode && (
                <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-2xl p-4 shadow-lg animate-scale-up space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#F59E0B] text-2xl">help</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#92400E]">
                        {language === 'en' ? 'Unrecognized Barcode' : 'यह बारकोड दर्ज नहीं है'}
                      </h4>
                      <p className="text-xs text-[#B45309] font-mono mt-0.5">
                        {unrecognizedBarcode}
                      </p>
                    </div>
                  </div>

                  {/* Option 1: Link to existing stock item */}
                  <div className="bg-white p-3 rounded-xl border border-[#F59E0B]/30 space-y-2">
                    <label className="text-[11px] font-bold text-[#16291E] block">
                      {language === 'en'
                        ? '1. Link to an existing stock item'
                        : '1. दुकान में मौजूद किसी सामान से जोड़ें'}
                    </label>
                    <select
                      value={linkTargetItemId}
                      onChange={(e) => setLinkTargetItemId(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[#E4DFD2] bg-[#FAF7F0] text-[#16291E]"
                    >
                      <option value="">
                        {language === 'en' ? '-- Select Existing Item --' : '-- मौजूदा सामान चुनें --'}
                      </option>
                      {stockItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category} • ₹{item.sellPrice})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!linkTargetItemId}
                      onClick={handleLinkBarcode}
                      className="w-full py-2 bg-[#2F6B4F] disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">link</span>
                      <span>
                        {language === 'en' ? 'Save Link & Add to Bill' : 'लिंक सुरक्षित करें और बिल में जोड़ें'}
                      </span>
                    </button>
                  </div>

                  {/* Option 2: Add as new stock item */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setUnrecognizedBarcode(null)}
                      className="text-xs text-[#6B7C72] hover:text-[#16291E]"
                    >
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const code = unrecognizedBarcode;
                        setUnrecognizedBarcode(null);
                        const addFn = onAddNewWithBarcode || onAddNewItemWithBarcode;
                        if (addFn && code) addFn(code);
                      }}
                      className="text-xs font-bold text-[#2F6B4F] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>
                        {language === 'en' ? '2. Add as New Item' : '2. नया सामान बनाकर जोड़ें'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE SALE BASKET */}
              <div className="bg-white rounded-2xl p-4 border border-[#E4DFD2] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E4DFD2] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2F6B4F]">shopping_bag</span>
                    <h3 className="text-sm font-bold text-[#16291E]">
                      {language === 'en' ? 'Current Sale Basket' : 'ग्राहक का बिल सामान'}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold bg-[#FAF7F0] px-2 py-0.5 rounded-full text-[#4A5D52] border border-[#E4DFD2]">
                    {totalItemsCount} {language === 'en' ? 'items' : 'सामान'}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="py-5 text-center text-[#6B7C72] space-y-1">
                    <span className="material-symbols-outlined text-3xl text-[#94A3B8]">
                      qr_code_scanner
                    </span>
                    <p className="text-xs font-medium">
                      {language === 'en'
                        ? 'No items scanned in this bill'
                        : 'इस बिल में अभी तक कोई सामान नहीं जुड़ा है'}
                    </p>
                    <p className="text-[11px] text-[#94A3B8]">
                      {language === 'en'
                        ? 'Bring barcode in camera view or use USB scanner gun'
                        : 'कैमरे के सामने पैकेट लाएं या USB स्कैनर गन से स्कैन करें'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cart.map((cartItem) => (
                      <div
                        key={cartItem.item.id}
                        className="flex items-center justify-between bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4DFD2]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-[#16291E] truncate">
                              {cartItem.item.name}
                            </h5>
                            {cartItem.item.barcode ? (
                              <span className="text-[9px] bg-[#2F6B4F]/10 text-[#2F6B4F] px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                ❚❚█
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                {language === 'en' ? 'Loose' : 'खुला'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#6B7C72] block mt-0.5">
                            ₹{cartItem.sellPrice} × {cartItem.quantity} {cartItem.item.unit} = <strong className="text-[#16291E]">₹{cartItem.lineTotal}</strong>{' '}
                            <span className="text-[#2F6B4F] font-bold">
                              (+₹{cartItem.lineProfit} मुनाफ़ा)
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(cartItem.item.id, -1)}
                            className="w-6 h-6 rounded-md bg-white border border-[#E4DFD2] text-[#16291E] font-bold text-xs flex items-center justify-center hover:bg-gray-100 transition-transform active:scale-90"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-[#16291E] min-w-[20px] text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(cartItem.item.id, 1)}
                            className="w-6 h-6 rounded-md bg-white border border-[#E4DFD2] text-[#16291E] font-bold text-xs flex items-center justify-center hover:bg-gray-100 transition-transform active:scale-90"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals & Single Confirm Button */}
                {cart.length > 0 && (
                  <div className="pt-2 border-t border-[#E4DFD2] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#6B7C72] block">
                          {language === 'en' ? 'Total Bill:' : 'कुल बिल रकम:'}
                        </span>
                        <span className="text-xl font-black text-[#16291E]">₹{totalSaleAmount}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#2F6B4F] font-medium block">
                          {language === 'en' ? 'Net Profit:' : 'शुद्ध मुनाफ़ा:'}
                        </span>
                        <span className="text-lg font-black text-[#2F6B4F]">+₹{totalSaleProfit}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinalConfirmSale}
                      className="w-full py-3 bg-[#2F6B4F] hover:bg-[#23533D] text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>
                        {language === 'en'
                          ? `Confirm Sale • ₹${totalSaleAmount} (+₹${totalSaleProfit} Profit)`
                          : `बिक्री पक्की करें • ₹${totalSaleAmount} (+₹${totalSaleProfit} मुनाफ़ा)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
