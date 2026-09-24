import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { StockItem, StoreType, Language, ExchangeType, SupplierChannel, SupplierOrderMode } from '../types';
import { translations } from '../translations';
import {
  getDefaultCategories,
  INITIAL_UNIFORM_STOCK_ITEMS,
  INITIAL_GIFT_STOCK_ITEMS,
} from '../data/defaultData';
import { safeStopScanner } from '../utils/scannerUtils';
import { lookupMasterBarcode, MasterProduct } from '../data/masterBarcodes';
import { resolveProductByBarcode } from '../services/barcodeLookupService';
import { inferWholesalerInfo, DEFAULT_WHOLESALERS } from '../data/wholesalersData';
import {
  searchKaryanaMaster,
  KaryanaMasterItem,
  getKaryanaMasterCategories,
  KARYANA_MASTER_ITEMS,
} from '../data/karyanaMasterCatalog';
import {
  searchStationeryMaster,
  STATIONERY_SECTIONS,
} from '../data/stationeryMasterCatalog';
import { playSuccessChime } from '../utils/audio';

interface AddItemModalProps {
  language: Language;
  storeType: StoreType;
  itemToEdit?: StockItem;
  initialBarcode?: string;
  autoScanDirectly?: boolean;
  onSave: (itemData: Omit<StockItem, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  language,
  storeType,
  itemToEdit,
  initialBarcode,
  autoScanDirectly = false,
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
  const [supplierName, setSupplierName] = useState<string>(
    itemToEdit?.supplierName || inferWholesalerInfo(itemToEdit?.category || categories[0], itemToEdit?.name).suggestedSupplierName
  );
  const [supplierChannel, setSupplierChannel] = useState<SupplierChannel>(
    itemToEdit?.supplierChannel || inferWholesalerInfo(itemToEdit?.category || categories[0], itemToEdit?.name).channel
  );
  const [supplierOrderMode, setSupplierOrderMode] = useState<SupplierOrderMode>(
    itemToEdit?.supplierOrderMode || inferWholesalerInfo(itemToEdit?.category || categories[0], itemToEdit?.name).orderMode
  );
  const [isLooseItem, setIsLooseItem] = useState<boolean>(itemToEdit?.isLooseItem ?? false);
  const [bulkPackWeightKg, setBulkPackWeightKg] = useState<string>(itemToEdit?.bulkPackWeightKg ? String(itemToEdit.bulkPackWeightKg) : '');
  const [looseRatePer50g, setLooseRatePer50g] = useState<string>(itemToEdit?.looseRatePer50g ? String(itemToEdit.looseRatePer50g) : '');
  const [looseRatePer100g, setLooseRatePer100g] = useState<string>(itemToEdit?.looseRatePer100g ? String(itemToEdit.looseRatePer100g) : '');
  const [error, setError] = useState('');
  const [matchedMaster, setMatchedMaster] = useState<MasterProduct | undefined>(undefined);
  const [isResolvingBarcode, setIsResolvingBarcode] = useState(false);

  // Master Catalog Autocomplete Dropdown State
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');
  const [autoFillSuccessNotice, setAutoFillSuccessNotice] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Camera scanning state for quick barcode scanning
  const [showCamera, setShowCamera] = useState(autoScanDirectly);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'add-item-barcode-scanner';

  // Instant Auto-List Mode: packet details are auto-filled and item is listed directly to stock
  const [autoListOnScan, setAutoListOnScan] = useState(!itemToEdit);
  const [autoListedToast, setAutoListedToast] = useState<{ name: string; price: number; barcode: string } | null>(null);
  const [itemsListedSessionCount, setItemsListedSessionCount] = useState(0);
  const lastScanTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Filtered master catalog items strictly based on the current store type
  const masterCatalogSuggestions = useMemo(() => {
    if (storeType === 'stationery') {
      return searchStationeryMaster(
        name,
        15,
        catalogCategoryFilter === 'all' ? undefined : catalogCategoryFilter
      );
    }
    if (storeType === 'uniform') {
      const q = name.toLowerCase().trim();
      return INITIAL_UNIFORM_STOCK_ITEMS.filter((item) => {
        const matchesCat = catalogCategoryFilter === 'all' || item.category === catalogCategoryFilter;
        const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      }).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        sellPrice: item.sellPrice,
        buyPrice: item.buyPrice,
        barcode: item.barcode,
        packSizes: [item.packSize ? `${item.packSize} पीस` : '1 पीस'],
      } as KaryanaMasterItem));
    }
    if (storeType === 'gift_shop') {
      const q = name.toLowerCase().trim();
      return INITIAL_GIFT_STOCK_ITEMS.filter((item) => {
        const matchesCat = catalogCategoryFilter === 'all' || item.category === catalogCategoryFilter;
        const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      }).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        sellPrice: item.sellPrice,
        buyPrice: item.buyPrice,
        barcode: item.barcode,
        packSizes: [item.packSize ? `${item.packSize} पीस` : '1 पीस'],
      } as KaryanaMasterItem));
    }
    // Kirana / default: only Kirana items
    return searchKaryanaMaster(
      name,
      15,
      catalogCategoryFilter === 'all' ? undefined : catalogCategoryFilter
    );
  }, [name, catalogCategoryFilter, storeType]);

  // Dynamic catalog filter chips strictly matching the store type
  const catalogFilterChips = useMemo(() => {
    if (storeType === 'stationery') {
      return [
        { id: 'all', label: language === 'en' ? 'All Stationery' : 'सभी स्टेशनरी' },
        { id: 'पेन, पेंसिल व सुधार सामग्री', label: '✏️ पेन व पेंसिल' },
        { id: 'कॉपियाँ, रजिस्टर व पेपर', label: '📓 कॉपियाँ/रजिस्टर' },
        { id: 'ज्योमेट्री बॉक्स व स्केल', label: '📐 ज्योमेट्री बॉक्स' },
        { id: 'रंग, पेंट व आर्ट क्राफ्ट', label: '🎨 रंग व आर्ट' },
        { id: 'गोंद, टेप व कैंची', label: '✂️ गोंद व टेप' },
        { id: 'फाइल, फोल्डर व ऑफिस सामान', label: '📁 फाइल व ऑफिस' },
      ];
    }
    if (storeType === 'uniform') {
      return [
        { id: 'all', label: language === 'en' ? 'All Uniforms' : 'सभी यूनिफॉर्म' },
        { id: 'स्कूल यूनिफॉर्म (शर्ट/पैंट)', label: '👔 शर्ट व पैंट' },
        { id: 'स्कर्ट व ट्यूनिक', label: '👗 स्कर्ट व फ्रॉक' },
        { id: 'टाई व बेल्ट', label: '🎗️ टाई व बेल्ट' },
        { id: 'स्कूल जूते व मोज़े', label: '🧦 जूते व मोज़े' },
        { id: 'स्वेटर व ब्लेज़र', label: '🧥 स्वेटर/ब्लेज़र' },
      ];
    }
    if (storeType === 'gift_shop') {
      return [
        { id: 'all', label: language === 'en' ? 'All Gifts' : 'सभी गिफ्ट' },
        { id: 'खिलौने व गेम्स', label: '🧸 खिलौने व गेम्स' },
        { id: 'गिफ्ट शोपीस व मूर्तियाँ', label: '🏺 शोपीस व मूर्तियाँ' },
        { id: 'घड़ियां व वॉल क्लॉक', label: '⏰ घड़ियां' },
        { id: 'फोटो फ्रेम व एल्बम', label: '🖼️ फोटो फ्रेम' },
        { id: 'ग्रीटिंग कार्ड व रैपिंग', label: '💌 ग्रीटिंग कार्ड' },
      ];
    }
    return [
      { id: 'all', label: language === 'en' ? 'All Grocery' : 'सभी किराना' },
      { id: 'दाल व अनाज', label: '🌾 दाल व अनाज' },
      { id: 'मसाले', label: '🧂 मसाले' },
      { id: 'खाद्य तेल व घी', label: '🍳 तेल व घी' },
      { id: 'चाय व पेय', label: '☕ चाय व पेय' },
      { id: 'दूध व ब्रेड', label: '🥛 दूध व ब्रेड' },
      { id: 'बिस्कुट व नमकीन', label: '🍫 बिस्कुट/नमकीन' },
      { id: 'पैकेज्ड फूड', label: '🥫 मैगी/नूडल्स' },
      { id: 'पर्सनल केयर', label: '🧼 साबुन/तेल' },
      { id: 'सफाई सामान', label: '🧽 सर्फ/सफाई' },
    ];
  }, [storeType, language]);

  // Catalog Toggle Button Text
  const catalogBtnTitle = useMemo(() => {
    if (showCatalogDropdown) return language === 'en' ? 'Hide Catalog' : 'कैटलॉग छुपाएं';
    if (storeType === 'stationery') return language === 'en' ? 'Stationery Catalog (71+ items)' : 'स्टेशनरी कैटलॉग (71+ आइटम)';
    if (storeType === 'uniform') return language === 'en' ? 'Uniform Catalog' : 'यूनिफॉर्म कैटलॉग';
    if (storeType === 'gift_shop') return language === 'en' ? 'Gift Catalog' : 'गिफ्ट कैटलॉग';
    return language === 'en' ? 'Kirana Catalog (250+ items)' : 'किराना कैटलॉग (250+ आइटम)';
  }, [showCatalogDropdown, storeType, language]);

  // Unit fast tags by store type
  const unitTags = useMemo(() => {
    if (storeType === 'stationery') {
      return ['पीस', 'दर्जन', 'पैकेट', 'बॉक्स', 'सेट', 'रिम'];
    }
    if (storeType === 'uniform') {
      return ['पीस', 'जोड़ा', 'सेट', 'पैकेट'];
    }
    if (storeType === 'gift_shop') {
      return ['पीस', 'सेट', 'बॉक्स', 'पैकेट'];
    }
    return ['पैकेट', 'किलो', 'ग्राम', 'लीटर', 'बोतल', 'पीस', 'पेटी', 'थैले'];
  }, [storeType]);

  // Sample quick barcodes by store type
  const sampleBarcodes = useMemo(() => {
    if (storeType === 'stationery') {
      return [
        { label: 'लिखो-फेंको पेन ₹5', code: '8901725001010' },
        { label: 'जेल पेन ₹40', code: '8901725001027' },
        { label: 'क्लासमेट कॉपी ₹60', code: '8901725002017' },
        { label: 'अप्सरा पेंसिल ₹7', code: '8901725001041' },
        { label: 'फेविकोल 20g ₹10', code: '8901725005018' },
        { label: 'नटराज रबर ₹5', code: '8901725001065' },
      ];
    }
    if (storeType === 'uniform') {
      return [
        { label: 'सफेद शर्ट', code: '8901825001011' },
        { label: 'फुल पैंट', code: '8901825001028' },
        { label: 'स्कूल टाई', code: '8901825001035' },
        { label: 'स्कूल बेल्ट', code: '8901825001042' },
        { label: 'सफेद मोज़े', code: '8901825001059' },
      ];
    }
    if (storeType === 'gift_shop') {
      return [
        { label: 'स्टंट कार', code: '8901925001018' },
        { label: 'कैक्टस टॉय', code: '8901925001025' },
        { label: 'एलईडी घड़ी', code: '8901925001032' },
        { label: 'फोटो फ्रेम', code: '8901925001049' },
      ];
    }
    return [
      { label: 'क्लिनिक प्लस ₹1', code: '8901030006241' },
      { label: 'पल्स टॉफी ₹1', code: '8901296061015' },
      { label: 'घड़ी पाउच ₹1', code: '8906007280010' },
      { label: 'मैगी मसाला ₹5', code: '8901058853636' },
      { label: 'पारले-जी ₹5', code: '8901719101015' },
      { label: 'नेस्कैफे ₹2', code: '8901058870022' },
    ];
  }, [storeType]);

  // Click outside to close master catalog dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCatalogDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMasterItem = (item: KaryanaMasterItem) => {
    setName(language === 'en' ? (item.nameEn || item.name) : item.name);

    if (categories.includes(item.category)) {
      setCategory(item.category);
    } else {
      const match = categories.find((c) => c.includes(item.category) || item.category.includes(c));
      if (match) setCategory(match);
    }

    setUnit(item.unit || 'पैकेट');
    setSellPrice(String(item.sellPrice || ''));
    setBuyPrice(String(item.buyPrice || ''));
    if (item.barcode) {
      setBarcode(item.barcode);
    }
    if (item.isPerishable) {
      setIsPerishable(true);
      if (item.exchangeType) setExchangeType(item.exchangeType);
    }
    if (item.isLooseItem) {
      setIsLooseItem(true);
      if (item.bulkPackWeightKg) setBulkPackWeightKg(String(item.bulkPackWeightKg));
      if (item.looseRatePer50g) setLooseRatePer50g(String(item.looseRatePer50g));
      if (item.looseRatePer100g) setLooseRatePer100g(String(item.looseRatePer100g));
    }

    const inferred = inferWholesalerInfo(item.category, item.name);
    setSupplierChannel(inferred.channel);
    setSupplierOrderMode(inferred.orderMode);
    setSupplierName(inferred.suggestedSupplierName);

    playSuccessChime();
    setShowCatalogDropdown(false);
    setAutoFillSuccessNotice(
      language === 'en'
        ? `⚡ Auto-filled: ${item.nameEn || item.name} (₹${item.sellPrice} MRP)`
        : `⚡ 2-क्लिक ऑटो-फिल: ${item.name} (MRP ₹${item.sellPrice})`
    );
    setTimeout(() => setAutoFillSuccessNotice(null), 3500);
  };

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

  const handleApplyMaster = (m: MasterProduct) => {
    setName(language === 'en' ? (m.nameEn || m.name) : m.name);
    setCategory(m.category);
    setUnit(m.unit || 'पैकेट');
    setSellPrice(String(m.sellPrice));
    setBuyPrice(String(m.buyPrice));
    const inferred = inferWholesalerInfo(m.category, m.name);
    setSupplierChannel(inferred.channel);
    setSupplierOrderMode(inferred.orderMode);
    setSupplierName(inferred.suggestedSupplierName);
    setMatchedMaster(m);
    setAutoFillSuccessNotice(
      language === 'en'
        ? `✓ Auto-filled: ${m.nameEn || m.name} (₹${m.sellPrice})`
        : `✓ बारकोड से सभी विवरण भर दिए गए: ${m.name} (भाव: ₹${m.sellPrice})`
    );
    try {
      playSuccessChime();
    } catch {}
  };

  // Master Barcode Handler: Resolves product info and auto-lists item directly into stock
  const handleProcessAndAutoListBarcode = async (rawCode: string, forceAutoList = false) => {
    const clean = rawCode.trim();
    if (!clean) return;

    // Prevent duplicate rapid bursts of same packet code
    const now = Date.now();
    if (lastScanTimeRef.current.code === clean && now - lastScanTimeRef.current.time < 1600) {
      return;
    }
    lastScanTimeRef.current = { code: clean, time: now };

    playScanBeep();
    setBarcode(clean);
    setIsResolvingBarcode(true);

    try {
      const found = await resolveProductByBarcode(clean);
      setIsResolvingBarcode(false);

      if (found) {
        handleApplyMaster(found);

        const shouldAutoSave = (autoListOnScan || forceAutoList) && !itemToEdit;
        if (shouldAutoSave) {
          const finalName = language === 'en' ? (found.nameEn || found.name) : found.name;
          const inferred = inferWholesalerInfo(found.category, found.name);
          const sellP = found.sellPrice || 20;
          const buyP = found.buyPrice || Math.round(sellP * 0.85);

          const itemData: Omit<StockItem, 'id' | 'createdAt'> = {
            name: finalName,
            barcode: clean,
            category: found.category || categories[0],
            unit: found.unit || 'पैकेट',
            packSize: 1,
            currentQuantity: 20,
            reorderLevel: 5,
            buyPrice: buyP,
            sellPrice: sellP,
            isPerishable: false,
            exchangeType: 'none',
            isLooseItem: false,
            supplierName: found.brand || inferred.suggestedSupplierName,
            supplierChannel: inferred.channel,
            supplierOrderMode: inferred.orderMode,
          };

          onSave(itemData);
          playSuccessChime();
          setItemsListedSessionCount((c) => c + 1);
          setAutoListedToast({
            name: finalName,
            price: sellP,
            barcode: clean,
          });
          setTimeout(() => setAutoListedToast(null), 3500);
        }
      }
    } catch {
      setIsResolvingBarcode(false);
    }
  };

  // Camera Barcode Scanner Effect
  useEffect(() => {
    if (!showCamera) {
      if (html5QrRef.current) {
        const scannerInstance = html5QrRef.current;
        html5QrRef.current = null;
        safeStopScanner(scannerInstance);
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
              handleProcessAndAutoListBarcode(clean);
              if (!autoListOnScan) {
                setShowCamera(false);
              }
            }
          },
          () => {}
        );

        if (!isMounted) {
          await safeStopScanner(qr);
          return;
        }
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
      if (html5QrRef.current) {
        const scannerInstance = html5QrRef.current;
        html5QrRef.current = null;
        safeStopScanner(scannerInstance);
      }
    };
  }, [showCamera, autoListOnScan, language]);

  // Hardware USB Barcode Scanner Gun Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isBarcodeField = activeEl?.getAttribute('data-barcode-field') === 'true';
      // If focused on another text input, don't intercept unless it's the barcode field
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !isBarcodeField) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 160) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          e.preventDefault();
          const clean = buffer.trim();
          buffer = '';
          handleProcessAndAutoListBarcode(clean);
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoListOnScan, itemToEdit, language, categories]);

  // Auto-detect master product and auto-fill when barcode changes
  useEffect(() => {
    const clean = barcode.trim();
    if (!clean) {
      setMatchedMaster(undefined);
      setIsResolvingBarcode(false);
      return;
    }

    let isCurrent = true;

    // Instant local check first (0ms)
    const quickLocal = lookupMasterBarcode(clean);
    if (quickLocal) {
      setMatchedMaster(quickLocal);
      if (!name || name.trim() === '') {
        handleApplyMaster(quickLocal);
      }
      return;
    }

    // For barcodes with 5+ digits, trigger smart lookup
    if (clean.length >= 5) {
      setIsResolvingBarcode(true);
      const timer = setTimeout(async () => {
        try {
          const found = await resolveProductByBarcode(clean);
          if (!isCurrent) return;
          setIsResolvingBarcode(false);
          if (found) {
            setMatchedMaster(found);
            if (!name || name.trim() === '') {
              handleApplyMaster(found);
            }
          }
        } catch {
          if (isCurrent) setIsResolvingBarcode(false);
        }
      }, 350);

      return () => {
        isCurrent = false;
        clearTimeout(timer);
      };
    }
  }, [barcode]);

  // If initialBarcode provided on open and no name was entered yet, auto-fill immediately
  useEffect(() => {
    if (initialBarcode && !itemToEdit && !name) {
      setIsResolvingBarcode(true);
      resolveProductByBarcode(initialBarcode).then((found) => {
        setIsResolvingBarcode(false);
        if (found) {
          handleApplyMaster(found);
        }
      }).catch(() => setIsResolvingBarcode(false));
    }
  }, [initialBarcode, itemToEdit, language, name]);

  const numBuy = parseFloat(buyPrice) || 0;
  const numSell = parseFloat(sellPrice) || 0;
  const calculatedProfit = numSell > 0 ? (numSell - numBuy) : 0;

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
        isLooseItem,
        bulkPackWeightKg: bulkPackWeightKg ? parseFloat(bulkPackWeightKg) : undefined,
        looseRatePer50g: looseRatePer50g ? parseFloat(looseRatePer50g) : undefined,
        looseRatePer100g: looseRatePer100g ? parseFloat(looseRatePer100g) : undefined,
        supplierName: supplierName.trim() || undefined,
        supplierChannel,
        supplierOrderMode,
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

            {/* 1-Click Auto-Fill Toast Notification */}
            {autoFillSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs animate-scale-up">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                  <span>{autoFillSuccessNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoFillSuccessNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
            )}

            {/* Item Name Input with Master Catalog Autocomplete */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#262421]">
                  {t.itemNameLabel} *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatalogDropdown(!showCatalogDropdown)}
                  className="text-[11px] font-bold text-[#2F6B4F] hover:text-[#1E4632] flex items-center gap-1 bg-[#2F6B4F]/10 hover:bg-[#2F6B4F]/15 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">menu_book</span>
                  <span>{catalogBtnTitle}</span>
                </button>
              </div>

              {/* Category Filter Chips for Master Catalog */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none mb-1 text-[11px]">
                {catalogFilterChips.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCatalogCategoryFilter(cat.id);
                      setShowCatalogDropdown(true);
                    }}
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all text-[11px] font-semibold cursor-pointer ${
                      catalogCategoryFilter === cat.id
                        ? 'bg-[#2F6B4F] text-white shadow-2xs'
                        : 'bg-[#F3EFE6] text-[#615C53] hover:bg-[#EAE4D6]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setShowCatalogDropdown(true);
                  }}
                  onFocus={() => setShowCatalogDropdown(true)}
                  placeholder={
                    storeType === 'stationery'
                      ? (language === 'en' ? 'Type stationery item name (e.g. Ball Pen, Copy, Geometry Box, Fevicol...)' : 'स्टेशनरी सामान का नाम लिखें (जैसे बॉल पेन, कॉपी, रजिस्टर, फेविकोल, स्केल...)')
                      : (language === 'en' ? 'Type item name (e.g. Maggi, Atta, Salt, Oil...)' : 'सामान का नाम लिखें (जैसे मैगी, आटा, तेल, नमक, हल्दी...)')
                  }
                  required
                  className="w-full h-11 px-3 pr-9 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
                {name && (
                  <button
                    type="button"
                    onClick={() => {
                      setName('');
                      setShowCatalogDropdown(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9386] hover:text-[#262421]"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Master Catalog Dropdown Suggestions */}
              {showCatalogDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-[#2F6B4F] rounded-2xl shadow-xl z-30 overflow-hidden animate-scale-up">
                  <div className="bg-[#FAF7F0] px-3 py-1.5 border-b border-[#E4DFD2] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E4632] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#2F6B4F]">auto_awesome</span>
                      <span>
                        {storeType === 'stationery'
                          ? (language === 'en' ? 'Stationery Master Catalog (Click to Auto-fill all fields)' : 'स्टेशनरी मास्टर कैटलॉग (क्लिक करते ही भाव, बारकोड व विवरण भर जाएगा)')
                          : (language === 'en' ? 'Karyana Master Catalog (Click to Auto-fill all fields)' : 'किराना मास्टर कैटलॉग (क्लिक करते ही भाव व सब भर जाएगा)')}
                      </span>
                    </span>
                    <span className="text-[10px] text-[#726C60]">
                      {masterCatalogSuggestions.length} {language === 'en' ? 'items' : 'आइटम'}
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-[#F0EBE0]">
                    {masterCatalogSuggestions.length > 0 ? (
                      masterCatalogSuggestions.map((mItem) => (
                        <div
                          key={mItem.id}
                          onClick={() => handleSelectMasterItem(mItem)}
                          className="p-2.5 hover:bg-[#F4F9F6] cursor-pointer transition-colors flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#262421] group-hover:text-[#1E4632]">
                                {mItem.name}
                              </span>
                              {mItem.isPerishable && (
                                <span className="text-[9px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-bold">
                                  {language === 'en' ? 'Fresh' : 'ताज़ा'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#726C60]">
                              <span className="truncate">{mItem.nameEn}</span>
                              <span>•</span>
                              <span className="bg-[#FAF7F0] px-1.5 py-0.2 rounded text-[10px] font-medium border border-[#E4DFD2]">
                                {mItem.category}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-[#262421]">{mItem.unit}</span>
                              {mItem.barcode && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-[#2F6B4F] bg-[#EBF4EE] px-1.5 py-0.2 rounded border border-[#CDE5D6] flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">barcode_scanner</span>
                                    {mItem.barcode}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="block text-xs font-black text-[#1E4632]">
                                ₹{mItem.sellPrice}
                              </span>
                              <span className="block text-[10px] text-[#726C60]">
                                खरीद: ₹{mItem.buyPrice}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg bg-[#2F6B4F] text-white text-[11px] font-bold group-hover:bg-[#1E4632] shadow-2xs flex items-center gap-0.5"
                            >
                              <span>चुनें</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#726C60] space-y-1">
                        <p className="font-semibold text-[#262421]">
                          {language === 'en' ? 'No catalog item matches this search' : 'कैटलॉग में यह नाम नहीं मिला'}
                        </p>
                        <p className="text-[11px]">
                          {language === 'en' ? 'You can type your own custom item name and details below.' : 'आप नीचे अपना नया नाम और भाव दर्ज कर सकते हैं।'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-[#FAF7F0] border-t border-[#E4DFD2] flex items-center justify-between text-[11px]">
                    <span className="text-[#726C60]">
                      💡 2 क्लिक में पूरा फॉर्म भरें (टाइपिंग की ज़रूरत नहीं)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCatalogDropdown(false)}
                      className="text-[#2F6B4F] font-bold hover:underline"
                    >
                      {language === 'en' ? 'Close' : 'बंद करें'}
                    </button>
                  </div>
                </div>
              )}
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

              {/* Auto-List Mode Toggle Banner */}
              {!itemToEdit && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-emerald-950 font-bold">
                    <input
                      type="checkbox"
                      checked={autoListOnScan}
                      onChange={(e) => setAutoListOnScan(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-emerald-700">bolt</span>
                      <span>
                        {language === 'en'
                          ? 'Auto-List to Stock on Scan (No manual typing or clicks needed)'
                          : '⚡ ऑटो-लिस्ट मोड: बारकोड स्कैन होते ही सामान खुद स्टॉक में लिस्ट हो जाए'}
                      </span>
                    </span>
                  </label>
                  {itemsListedSessionCount > 0 && (
                    <span className="bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-scale-up">
                      <span className="material-symbols-outlined text-[13px]">done_all</span>
                      <span>{itemsListedSessionCount} {language === 'en' ? 'listed' : 'लिस्टेड'}</span>
                    </span>
                  )}
                </div>
              )}

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

                  {/* Auto-Listed Toast in Camera Viewfinder */}
                  {autoListedToast && (
                    <div className="absolute top-2 left-2 right-2 bg-emerald-900/95 backdrop-blur-xs border border-emerald-400 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-between shadow-lg z-10 animate-fade-in">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-emerald-300 text-sm">verified</span>
                        <span className="truncate">✓ {autoListedToast.name} (₹{autoListedToast.price}) लिस्ट हो गया!</span>
                      </div>
                      <span className="text-[10px] text-emerald-200 shrink-0">अगला पैकेट दिखाएं →</span>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 bg-black/80 p-3 flex flex-col items-center justify-center text-center text-white">
                      <span className="material-symbols-outlined text-amber-400 text-2xl mb-1">videocam_off</span>
                      <p className="text-[11px] text-stone-300">{cameraError}</p>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/90 bg-black/60 backdrop-blur-xs px-2.5 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-emerald-400">qr_code_scanner</span>
                      {language === 'en' ? 'Point camera at any packet barcode' : 'किसी भी पैकेट के बारकोड पर कैमरा रखें'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCamera(false)}
                      className="bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded text-xs transition-colors"
                    >
                      {language === 'en' ? 'Done' : 'कैमरा बंद'}
                    </button>
                  </div>
                </div>
              )}

              {/* Barcode Input & Instant Auto-List Action */}
              <div className="flex gap-1.5">
                <input
                  data-barcode-field="true"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleProcessAndAutoListBarcode(barcode, true);
                    }
                  }}
                  placeholder={
                    language === 'en'
                      ? 'Scan or enter barcode (e.g. 8901030006241)'
                      : 'बारकोड नंबर लिखें या गन से स्कैन करें (जैसे 8901030006241)'
                  }
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E4DFD2] bg-white text-xs font-mono text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
                <button
                  type="button"
                  onClick={() => handleProcessAndAutoListBarcode(barcode, true)}
                  className="h-10 px-3 bg-[#1E4632] hover:bg-[#163526] text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs transition-all"
                  title={language === 'en' ? 'Auto-fill details & list item to stock' : 'सामान का विवरण भरकर तुरंत स्टॉक में लिस्ट करें'}
                >
                  <span className="material-symbols-outlined text-sm text-[#F4D03F]">bolt</span>
                  <span>{language === 'en' ? 'Auto-List' : 'ऑटो-लिस्ट'}</span>
                </button>
              </div>

              {/* Barcode Resolving Indicator */}
              {isResolvingBarcode && (
                <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-medium animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>
                    {language === 'en'
                      ? 'Fetching product details from barcode...'
                      : 'बारकोड से सामान का नाम, भाव व विवरण अपने आप निकाला जा रहा है...'}
                  </span>
                </div>
              )}

              {/* Auto-Listed Success Toast Banner */}
              {autoListedToast && (
                <div className="p-3 bg-[#1E4632] text-white border border-[#2F6B4F] rounded-xl flex items-center justify-between gap-2 text-xs font-bold shadow-md animate-scale-up">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-emerald-300 text-lg shrink-0">verified</span>
                    <span className="truncate">
                      {language === 'en'
                        ? `⚡ "${autoListedToast.name}" (₹${autoListedToast.price}) auto-listed in stock!`
                        : `⚡ "${autoListedToast.name}" (भाव ₹${autoListedToast.price}) स्टॉक में अपने-आप लिस्ट हो गया!`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoListedToast(null)}
                    className="text-white/80 hover:text-white shrink-0 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Auto-fill Success Notice */}
              {autoFillSuccessNotice && !autoListedToast && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-800 font-semibold shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-emerald-600 text-sm shrink-0">check_circle</span>
                    <span className="truncate">{autoFillSuccessNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoFillSuccessNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 shrink-0 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Quick Sample Barcode Chips */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1 text-[10px] text-[#6B7C72] mb-1">
                  <span className="material-symbols-outlined text-[12px] text-emerald-700">bolt</span>
                  <span className="font-semibold">
                    {storeType === 'stationery'
                      ? (language === 'en' ? 'Quick stationery samples:' : 'स्टेशनरी बारकोड उदाहरण:')
                      : (language === 'en' ? 'Quick sample barcodes:' : 'बारकोड उदाहरण:')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sampleBarcodes.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => {
                        handleProcessAndAutoListBarcode(s.code);
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-md text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer"
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
                    onClick={() => {
                      setCategory(cat);
                      const inferred = inferWholesalerInfo(cat, name);
                      setSupplierChannel(inferred.channel);
                      setSupplierOrderMode(inferred.orderMode);
                      if (!supplierName || supplierName === 'गुप्ता होलसेल एजेंसी') {
                        setSupplierName(inferred.suggestedSupplierName);
                      }
                    }}
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

          {/* 2B. Loose Item / Bulk-to-Loose Weight Selling Setting */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E7F0EA] text-[#1E4632] text-xs font-bold flex items-center justify-center">
                  ⚖️
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#262421]">
                    {language === 'en' ? 'Open Loose / Weight Selling' : 'खुली नमकीन / खुला सामान (वजन से बिक्री)'}
                  </h3>
                  <p className="text-[11px] text-[#726C60]">
                    {language === 'en'
                      ? 'Sell 50g, 100g, or custom ₹ amount from big bulk packet'
                      : 'थोक पैकेट (5kg) से 50 ग्राम, 100 ग्राम या ₹10-₹20 में बेचें'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLooseItem}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsLooseItem(checked);
                    if (checked) {
                      if (!unit || unit === 'पैकेट') setUnit('किलो');
                      if (!looseRatePer50g) setLooseRatePer50g('10');
                      if (!looseRatePer100g) setLooseRatePer100g('20');
                      if (!bulkPackWeightKg) setBulkPackWeightKg('5');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F6B4F]"></div>
              </label>
            </div>

            {isLooseItem && (
              <div className="space-y-3 pt-2 border-t border-[#E4DFD2] animate-fade-in">
                <div className="p-2.5 rounded-xl bg-[#F4F9F6] border border-[#2F6B4F]/20 text-[11px] text-[#1E4632] flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-[#2F6B4F] shrink-0 mt-0.5">info</span>
                  <span>
                    {language === 'en'
                      ? 'When selling 50g for ₹10, inventory will deduct 0.05 kg from your bulk stock automatically.'
                      : 'बिल में 50g = ₹10 बेचते ही आपके बल्क स्टॉक से 0.05 किलो स्टॉक स्वतः घट जाएगा।'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#262421] mb-1">
                      {language === 'en' ? 'Bulk Pack Weight (Kg)' : 'थोक पैकेट वजन (किलो)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={bulkPackWeightKg}
                        onChange={(e) => setBulkPackWeightKg(e.target.value)}
                        placeholder="5"
                        className="w-full h-10 px-2.5 pr-8 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs font-bold text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-[#726C60]">Kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#262421] mb-1">
                      {language === 'en' ? '50g Rate (₹)' : '50 ग्राम भाव (₹)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-[#726C60]">₹</span>
                      <input
                        type="number"
                        step="any"
                        value={looseRatePer50g}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLooseRatePer50g(val);
                          const n = parseFloat(val);
                          if (!isNaN(n) && (!looseRatePer100g || parseFloat(looseRatePer100g) === 0)) {
                            setLooseRatePer100g(String(n * 2));
                          }
                        }}
                        placeholder="10"
                        className="w-full h-10 pl-6 pr-2 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs font-bold text-[#1E4632] focus:outline-none focus:border-[#2F6B4F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#262421] mb-1">
                      {language === 'en' ? '100g Rate (₹)' : '100 ग्राम भाव (₹)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-[#726C60]">₹</span>
                      <input
                        type="number"
                        step="any"
                        value={looseRatePer100g}
                        onChange={(e) => setLooseRatePer100g(e.target.value)}
                        placeholder="20"
                        className="w-full h-10 pl-6 pr-2 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs font-bold text-[#1E4632] focus:outline-none focus:border-[#2F6B4F]"
                      />
                    </div>
                  </div>
                </div>

                {/* Fast Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#726C60] font-semibold">त्वरित दर:</span>
                  {[
                    { label: '50g = ₹10 (₹200/kg)', r50: '10', r100: '20' },
                    { label: '50g = ₹15 (₹300/kg)', r50: '15', r100: '30' },
                    { label: '50g = ₹20 (₹400/kg)', r50: '20', r100: '40' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLooseRatePer50g(p.r50);
                        setLooseRatePer100g(p.r100);
                      }}
                      className="px-2 py-0.5 bg-[#FAF7F0] hover:bg-[#E7F0EA] text-[#262421] text-[10px] font-semibold rounded-md border border-[#E4DFD2] transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

            {/* Wholesaler & Ordering Mode Section */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.wholesalerVendorLabel}
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder={t.supplierNamePlaceholder}
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              {/* Quick Wholesaler presets */}
              <div>
                <span className="text-[11px] font-bold text-[#726C60] block mb-1">
                  {t.suggestWholesaleSupplier}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_WHOLESALERS.slice(0, 4).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSupplierName(w.name);
                        setSupplierChannel(w.channel);
                        setSupplierOrderMode(w.orderMode);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        supplierName === w.name
                          ? 'bg-[#2F6B4F] text-white border-[#2F6B4F]'
                          : 'bg-[#FAF7F0] border-[#E4DFD2] text-[#4A453C] hover:bg-[#E7F0EA]'
                      }`}
                    >
                      {w.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Mode: Send Slip vs Daily Salesman */}
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1.5">
                  {t.deliveryMethodLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      supplierOrderMode === 'slip'
                        ? 'border-[#8A5A00] bg-[#FFF8E7]'
                        : 'border-[#E4DFD2] bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderMode"
                      checked={supplierOrderMode === 'slip'}
                      onChange={() => {
                        setSupplierOrderMode('slip');
                        if (supplierChannel === 'daily_salesman') {
                          setSupplierChannel('ration_mandi');
                        }
                      }}
                      className="mt-0.5 text-[#8A5A00] focus:ring-[#8A5A00]"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-[#262421] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#8A5A00]">receipt_long</span>
                        <span>{t.methodSendSlip}</span>
                      </span>
                      <span className="text-[10px] text-[#726C60] leading-tight mt-0.5">
                        राशन / सिगरेट (WhatsApp या पर्चा)
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      supplierOrderMode === 'daily_salesman'
                        ? 'border-[#1E4632] bg-[#EBF5EF]'
                        : 'border-[#E4DFD2] bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderMode"
                      checked={supplierOrderMode === 'daily_salesman'}
                      onChange={() => {
                        setSupplierOrderMode('daily_salesman');
                        setSupplierChannel('daily_salesman');
                      }}
                      className="mt-0.5 text-[#1E4632] focus:ring-[#1E4632]"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-[#262421] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#1E4632]">local_shipping</span>
                        <span>{t.methodDailySalesman}</span>
                      </span>
                      <span className="text-[10px] text-[#726C60] leading-tight mt-0.5">
                        ब्रेड, बिस्कुट, चिप्स (दुकान पर आते हैं)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
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
