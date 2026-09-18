import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { StockItem, StoreType, Language, ExchangeType } from '../types';
import { translations } from '../translations';
import { getDefaultCategories } from '../data/defaultData';
import { lookupMasterBarcode, MasterProduct } from '../data/masterBarcodes';

interface AddItemModalProps {
  language: Language;
  storeType: StoreType;
  itemToEdit?: StockItem;
  initialBarcode?: string;
  onSave: (itemData: Omit<StockItem, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  language,
  storeType,
  itemToEdit,
  initialBarcode,
  onSave,
  onDelete,
  onClose,
}) => {
  const t = translations[language];
  const categories = getDefaultCategories(storeType);

  const [name, setName] = useState(itemToEdit?.name || '');
  const [barcode, setBarcode] = useState(itemToEdit?.barcode || initialBarcode || '');
  const [category, setCategory] = useState(itemToEdit?.category || categories[0]);
  const [unit, setUnit] = useState(itemToEdit?.unit || 'पैकेट');
  const [packSize, setPackSize] = useState<string>(itemToEdit?.packSize ? String(itemToEdit.packSize) : '');
  const [currentQuantity, setCurrentQuantity] = useState<number>(itemToEdit?.currentQuantity ?? 10);
  const [reorderLevel, setReorderLevel] = useState<number>(itemToEdit?.reorderLevel ?? 5);
  const [buyPrice, setBuyPrice] = useState<string>(itemToEdit?.buyPrice ? String(itemToEdit.buyPrice) : '');
  const [sellPrice, setSellPrice] = useState<string>(itemToEdit?.sellPrice ? String(itemToEdit.sellPrice) : '');
  const [isPerishable, setIsPerishable] = useState<boolean>(itemToEdit?.isPerishable ?? false);
  const [exchangeType, setExchangeType] = useState<ExchangeType>(itemToEdit?.exchangeType || 'none');
  const [supplierName, setSupplierName] = useState<string>(itemToEdit?.supplierName || '');
  const [error, setError] = useState('');
  const [matchedMaster, setMatchedMaster] = useState<MasterProduct | undefined>(undefined);

  // Camera scanning state for quick barcode scanning
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'add-item-barcode-scanner';

  // Play crisp scan beep sound
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio not supported or allowed
    }
  };

  useEffect(() => {
    if (!showCamera) {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {}).finally(() => {
          html5QrRef.current?.clear();
          html5QrRef.current = null;
        });
      }
      return;
    }

    let isMounted = true;
    setCameraError(null);

    const timer = setTimeout(async () => {
      try {
        const qr = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        html5QrRef.current = qr;

        await qr.start(
          { facingMode: 'environment' },
          {
            fps: 25,
            qrbox: { width: 280, height: 140 },
            aspectRatio: 1.333333,
          },
          (decoded) => {
            if (!isMounted) return;
            const clean = decoded.trim();
            if (clean) {
              playScanBeep();
              setBarcode(clean);
              const found = lookupMasterBarcode(clean);
              if (found) {
                handleApplyMaster(found);
              }
              setShowCamera(false);
            }
          },
          () => {}
        );
      } catch {
        if (isMounted) {
          setCameraError(
            language === 'en'
              ? 'Could not access camera. Please enter barcode manually.'
              : 'कैमरा शुरू नहीं हो सका। कृपया बारकोड हाथ से लिखें।'
          );
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {}).finally(() => {
          html5QrRef.current?.clear();
          html5QrRef.current = null;
        });
      }
    };
  }, [showCamera, language]);

  // Auto-detect master product when barcode changes
  useEffect(() => {
    if (!barcode.trim()) {
      setMatchedMaster(undefined);
      return;
    }
    const found = lookupMasterBarcode(barcode);
    setMatchedMaster(found);
  }, [barcode]);

  // If initialBarcode provided on open and no name was entered yet, auto-fill immediately
  useEffect(() => {
    if (initialBarcode && !itemToEdit && !name) {
      const found = lookupMasterBarcode(initialBarcode);
      if (found) {
        setName(language === 'en' ? found.nameEn : found.name);
        setCategory(found.category);
        setUnit(found.unit);
        setSellPrice(String(found.sellPrice));
        setBuyPrice(String(found.buyPrice));
      }
    }
  }, [initialBarcode, itemToEdit, language, name]);

  const handleApplyMaster = (m: MasterProduct) => {
    setName(language === 'en' ? m.nameEn : m.name);
    setCategory(m.category);
    setUnit(m.unit);
    setSellPrice(String(m.sellPrice));
    setBuyPrice(String(m.buyPrice));
  };

  const numBuy = parseFloat(buyPrice) || 0;
  const numSell = parseFloat(sellPrice) || 0;
  const calculatedProfit = numSell > 0 ? (numSell - numBuy) : 0;

  const unitTags = ['पैकेट', 'बोरी', 'कट्टा', 'लड़ी', 'पेटी', 'दर्जन', 'किलो', 'लीटर', 'पीस'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'pa' ? 'ਕਿਰਪਾ ਕਰਕੇ ਸਮਾਨ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ' : language === 'en' ? 'Please enter item name' : 'कृपया सामान का नाम दर्ज करें');
      return;
    }
    if (numSell <= 0) {
      setError(language === 'pa' ? 'ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਵਿਕਰੀ ਭਾਅ ਦਰਜ ਕਰੋ' : language === 'en' ? 'Please enter valid sell price' : 'कृपया सही बिक्री भाव दर्ज करें');
      return;
    }

    onSave(
      {
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        category,
        unit: unit.trim() || 'पैकेट',
        packSize: packSize ? parseInt(packSize, 10) : undefined,
        currentQuantity,
        reorderLevel,
        buyPrice: numBuy,
        sellPrice: numSell,
        isPerishable,
        exchangeType: isPerishable ? exchangeType : 'none',
        supplierName: supplierName.trim() || undefined,
      },
      itemToEdit?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full max-h-[92vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Sticky Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6B4F] text-2xl">
              {itemToEdit ? 'edit_note' : 'add_box'}
            </span>
            <h2 className="text-lg font-bold text-[#262421] font-display">
              {itemToEdit ? t.editItemTitle : t.addItemTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-[#F8E6E4] border border-[#C1443B]/30 rounded-xl text-xs font-semibold text-[#C1443B] flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* 1. Main Details */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FBF0D9] text-[#7a5900] text-xs font-bold flex items-center justify-center">
                १
              </span>
              <h3 className="text-sm font-bold text-[#262421]">
                {t.mainDetailsSection}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {t.itemNameLabel} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.itemNamePlaceholder}
                required
                className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
              />
            </div>

            {/* Optional Barcode for packaged goods */}
            <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E4DFD2] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#262421] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#2F6B4F]">barcode_scanner</span>
                  <span>{language === 'en' ? 'Barcode (EAN/UPC)' : 'बारकोड (वैकल्पिक)'}</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCamera(!showCamera)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all ${
                      showCamera
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#2F6B4F] hover:bg-[#23533D] text-white shadow-xs'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {showCamera ? 'close' : 'photo_camera'}
                    </span>
                    <span>{showCamera ? (language === 'en' ? 'Close Camera' : 'बंद करें') : (language === 'en' ? 'Scan with Camera' : 'कैमरा स्कैन')}</span>
                  </button>
                  <span className="text-[10px] bg-[#2F6B4F]/10 text-[#2F6B4F] font-bold px-1.5 py-0.5 rounded">
                    {language === 'en' ? 'FMCG' : 'पैकेज्ड सामान'}
                  </span>
                </div>
              </div>

              {/* In-Modal Camera Scanner */}
              {showCamera && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-16/10 border-2 border-[#2F6B4F] shadow-md animate-scale-up">
                  <div id={scannerContainerId} className="w-full h-full" />
                  
                  {/* Viewfinder Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                    <div className="relative w-full max-w-[240px] h-[90px] border-2 border-dashed border-emerald-400/90 rounded-lg flex items-center justify-center">
                      <div className="w-full h-[1.5px] bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-black/80 p-3 flex flex-col items-center justify-center text-center text-white">
                      <span className="material-symbols-outlined text-amber-400 text-2xl mb-1">videocam_off</span>
                      <p className="text-[11px] text-stone-300">{cameraError}</p>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/90 bg-black/50 backdrop-blur-xs px-2 py-1 rounded">
                    <span>{language === 'en' ? 'Point camera at barcode' : 'बारकोड पर कैमरा रखें'}</span>
                    <button
                      type="button"
                      onClick={() => setShowCamera(false)}
                      className="text-amber-300 font-bold underline"
                    >
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </button>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Scan or enter barcode (e.g. 8901030006241)'
                    : 'बारकोड नंबर लिखें या गन से स्कैन करें (जैसे 8901030006241)'
                }
                className="w-full h-10 px-3 rounded-lg border border-[#E4DFD2] bg-white text-xs font-mono text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
              />

              {/* Quick Small Packet / Sachet Sample Chips */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1 text-[10px] text-[#6B7C72] mb-1">
                  <span className="material-symbols-outlined text-[12px] text-emerald-700">bolt</span>
                  <span className="font-semibold">{language === 'en' ? 'Quick small packets:' : 'छोटे पैकेट / पाउच उदाहरण:'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'क्लिनिक प्लस ₹1', code: '8901030006241' },
                    { label: 'पल्स टॉफी ₹1', code: '8901296061015' },
                    { label: 'घड़ी पाउच ₹1', code: '8906007280010' },
                    { label: 'मैगी मसाला ₹5', code: '8901058853636' },
                    { label: 'पारले-जी ₹5', code: '8901719101015' },
                    { label: 'नेस्कैफे ₹2', code: '8901058870022' },
                  ].map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => {
                        setBarcode(s.code);
                        const found = lookupMasterBarcode(s.code);
                        if (found) {
                          handleApplyMaster(found);
                        }
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-md text-[10px] font-semibold transition-colors shadow-2xs"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-[#726C60]">
                {language === 'en'
                  ? 'For cold drinks, biscuits, soap, snacks. Leave blank for loose ration (atta, dal, rice).'
                  : 'कोल्ड ड्रिंक, बिस्कुट, साबुन, चिप्स आदि के लिए। खुले राशन (दाल, आटा, चीनी) के लिए खाली छोड़ें।'}
              </p>

              {matchedMaster && (
                <div className="mt-2.5 p-2.5 bg-[#EBF3EE] border border-[#2F6B4F]/30 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#2F6B4F] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>{language === 'en' ? 'Master Catalog Match' : 'मास्टर कैटलॉग में मिला'}</span>
                      </span>
                      {matchedMaster.isSmallPacket && (
                        <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                          {language === 'en' ? 'Small Packet' : 'छोटा पैकेट'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#16291E] truncate mt-0.5">
                      {language === 'en' ? matchedMaster.nameEn : matchedMaster.name}
                    </p>
                    <p className="text-[10px] text-[#4A5D52]">
                      ₹{matchedMaster.sellPrice} MRP • {matchedMaster.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyMaster(matchedMaster)}
                    className="px-2.5 py-1.5 bg-[#2F6B4F] hover:bg-[#23533D] text-white text-xs font-bold rounded-lg shrink-0 shadow-xs flex items-center gap-1 transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xs">magic_button</span>
                    <span>{language === 'en' ? 'Auto-Fill' : 'ऑटो-भरें'}</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1.5">
                {t.categoryLabel}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      category === cat
                        ? 'bg-[#2F6B4F] text-white'
                        : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#726C60] hover:bg-[#E7F0EA]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Custom Unit & Pack Size */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FBF0D9] text-[#7a5900] text-xs font-bold flex items-center justify-center">
                २
              </span>
              <h3 className="text-sm font-bold text-[#262421]">
                {t.unitSection}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {t.unitTypeLabel}
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={t.unitTypePlaceholder}
                className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
              />
              <p className="text-[11px] text-[#726C60] mt-1">
                {t.unitHelperHint}
              </p>

              {/* Unit Fast Tag Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unitTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setUnit(tag)}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                      unit === tag
                        ? 'bg-[#E7F0EA] border-[#2F6B4F] text-[#1E4632] font-bold'
                        : 'bg-white border-[#E4DFD2] text-[#726C60] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {t.packSizeLabel}
              </label>
              <input
                type="number"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder={t.packSizePlaceholder}
                className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
              />
            </div>
          </div>

          {/* 3. Stock Quantity & Alert */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FBF0D9] text-[#7a5900] text-xs font-bold flex items-center justify-center">
                ३
              </span>
              <h3 className="text-sm font-bold text-[#262421]">
                {t.stockQtyAlertSection}
              </h3>
            </div>

            {/* Current Stock Stepper */}
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-[#262421]">
                  {t.currentShopStockLabel}
                </span>
                <span className="text-[11px] text-[#726C60]">काउंटर पर मौजूद</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentQuantity((q) => Math.max(0, q - 1))}
                  className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-lg text-[#262421] flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 h-10 rounded-xl border border-[#E4DFD2] bg-white text-center font-bold text-base text-[#2F6B4F] focus:outline-none focus:border-[#2F6B4F]"
                />
                <button
                  type="button"
                  onClick={() => setCurrentQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-lg text-[#262421] flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reorder Level Stepper */}
            <div className="flex items-center justify-between border-t border-[#E4DFD2]/60 pt-3">
              <div>
                <span className="block text-xs font-bold text-[#262421]">
                  {t.reorderLevelAlertLabel}
                </span>
                <span className="text-[11px] text-[#726C60]">
                  {t.reorderHelperHint}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReorderLevel((r) => Math.max(0, r - 1))}
                  className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-lg text-[#262421] flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <input
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 h-10 rounded-xl border border-[#E4DFD2] bg-white text-center font-bold text-base text-[#C1443B] focus:outline-none focus:border-[#C1443B]"
                />
                <button
                  type="button"
                  onClick={() => setReorderLevel((r) => r + 1)}
                  className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-lg text-[#262421] flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 4. Cost, Sell Price & Profit Margin */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FBF0D9] text-[#7a5900] text-xs font-bold flex items-center justify-center">
                ४
              </span>
              <h3 className="text-sm font-bold text-[#262421]">
                {t.pricingSection}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.costPriceLabel} (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="24"
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] font-bold focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.sellPriceLabel} (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="28"
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] font-bold focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>
            </div>

            {/* Profit Margin Badge Card */}
            <div className="p-3 bg-[#E7F0EA] rounded-xl border border-[#2F6B4F]/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#1E4632] block">
                  {t.profitMarginLabel}
                </span>
                <span className="text-lg font-extrabold text-[#1E4632] font-display">
                  +₹{calculatedProfit.toFixed(1)} / {unit}
                </span>
              </div>
              {calculatedProfit > 0 && (
                <span className="px-2.5 py-1 bg-[#2F6B4F] text-white text-[11px] font-bold rounded-full shadow-2xs">
                  {t.profitableDealBadge}
                </span>
              )}
            </div>
          </div>

          {/* 5. Perishable & Return Policy */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FBF0D9] text-[#7a5900] text-xs font-bold flex items-center justify-center">
                ५
              </span>
              <h3 className="text-sm font-bold text-[#262421]">
                {t.expirySection}
              </h3>
            </div>

            {/* Perishable Toggle */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] cursor-pointer">
              <input
                type="checkbox"
                checked={isPerishable}
                onChange={(e) => setIsPerishable(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded text-[#2F6B4F] focus:ring-[#2F6B4F]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#262421]">
                  {t.perishableOption}
                </span>
                <span className="text-[11px] text-[#726C60]">
                  {t.perishableOptionDesc}
                </span>
              </div>
            </label>

            {/* If perishable, ask exchange vs pure loss */}
            {isPerishable && (
              <div className="flex flex-col gap-2 pl-2 border-l-2 border-[#D9A62E]">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E4DFD2] bg-white cursor-pointer">
                  <input
                    type="radio"
                    name="exchangeType"
                    checked={exchangeType === 'exchangeable'}
                    onChange={() => setExchangeType('exchangeable')}
                    className="w-4 h-4 mt-0.5 text-[#2F6B4F] focus:ring-[#2F6B4F]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#262421]">
                      {t.exchangeableOption}
                    </span>
                    <span className="text-[11px] text-[#726C60]">
                      {t.exchangeableOptionDesc}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E4DFD2] bg-white cursor-pointer">
                  <input
                    type="radio"
                    name="exchangeType"
                    checked={exchangeType === 'loss'}
                    onChange={() => setExchangeType('loss')}
                    className="w-4 h-4 mt-0.5 text-[#2F6B4F] focus:ring-[#2F6B4F]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#C1443B]">
                      {t.pureLossOption}
                    </span>
                    <span className="text-[11px] text-[#726C60]">
                      {t.pureLossOptionDesc}
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {t.supplierNameLabel}
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder={t.supplierNamePlaceholder}
                className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {itemToEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(itemToEdit.id)}
                className="h-12 px-4 rounded-xl border border-[#C1443B]/40 text-[#C1443B] hover:bg-[#F8E6E4] font-bold text-xs active:scale-95 transition-all"
              >
                {t.btnDelete}
              </button>
            )}

            <button
              type="submit"
              className="flex-1 h-12 bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              <span>{t.saveItemBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
