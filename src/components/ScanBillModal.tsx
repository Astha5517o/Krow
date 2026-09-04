import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';
import { ScannedBillDraftItem } from '../types';
import { getCategoriesByShopType } from '../data/categories';

interface ScanBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanBillModal: React.FC<ScanBillModalProps> = ({ isOpen, onClose }) => {
  const { profile, batchAddScannedItems, items: existingItems, showToast } = useShop();
  const lang = profile?.language || 'hi';
  const shopType = profile?.shopType || 'general_store';
  const t = getTranslation(lang);
  const categories = getCategoriesByShopType(shopType);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vendorName, setVendorName] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [draftItems, setDraftItems] = useState<ScannedBillDraftItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSampleBill, setIsSampleBill] = useState(false);

  // Client-side image compression: downscales giant phone camera photos to max 1600px
  // Keeps file size around 200-400KB, preventing network drops and Vercel 4.5MB payload limits
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया केवल फ़ोटो (JPG, PNG आदि) चुनें।'
          : 'Please select an image file (JPG, PNG, etc.).'
      );
      return;
    }

    try {
      setIsAnalyzing(true);
      const compressedBase64 = await compressImageFile(file);
      setImagePreview(compressedBase64);
      processBillImage(compressedBase64);
    } catch (e) {
      console.warn('Canvas compression fallback to direct read:', e);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        processBillImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (!isOpen) return null;

  // Demo bill option for instant testing without needing paper
  const handleLoadDemoBill = () => {
    // Generate a simulated clear receipt canvas or pre-extracted items
    const sampleDrafts: ScannedBillDraftItem[] =
      shopType === 'stationery'
        ? [
            {
              id: 'draft_1',
              name: 'Navneet Single Line Long Notebook',
              quantity: 24,
              unit: 'piece',
              buyPrice: 38,
              totalPrice: 912,
              suggestedSellPrice: 50,
              suggestedCategory: 'stationery',
              packetSize: 6,
              spoilQuickly: false,
              exchangeableOnSpoil: false,
            },
            {
              id: 'draft_2',
              name: 'Doms Zoom Triangle Pencils Box',
              quantity: 10,
              unit: 'box',
              buyPrice: 42,
              totalPrice: 420,
              suggestedSellPrice: 60,
              suggestedCategory: 'stationery',
              packetSize: 10,
              spoilQuickly: false,
              exchangeableOnSpoil: false,
            },
            {
              id: 'draft_3',
              name: 'Fevicol MR Squeezy Bottle (50g)',
              quantity: 12,
              unit: 'bottle',
              buyPrice: 18,
              totalPrice: 216,
              suggestedSellPrice: 25,
              suggestedCategory: 'stationery',
              spoilQuickly: false,
              exchangeableOnSpoil: false,
            },
          ]
        : [
            {
              id: 'draft_1',
              name: 'Amul Taaza Milk 500ml Pouch',
              quantity: 24,
              unit: 'pouch',
              buyPrice: 25.5,
              totalPrice: 612,
              suggestedSellPrice: 27,
              suggestedCategory: 'milk_dairy',
              packetSize: 12,
              spoilQuickly: true,
              exchangeableOnSpoil: false,
            },
            {
              id: 'draft_2',
              name: 'Britannia Good Day Butter (60g)',
              quantity: 36,
              unit: 'packet',
              buyPrice: 8.4,
              totalPrice: 302.4,
              suggestedSellPrice: 10,
              suggestedCategory: 'biscuits_snacks',
              packetSize: 12,
              spoilQuickly: false,
              exchangeableOnSpoil: false,
            },
            {
              id: 'draft_3',
              name: 'Rin Detergent Bar (250g)',
              quantity: 16,
              unit: 'piece',
              buyPrice: 26,
              totalPrice: 416,
              suggestedSellPrice: 30,
              suggestedCategory: 'cleaning_supplies',
              packetSize: 4,
              spoilQuickly: false,
              exchangeableOnSpoil: false,
            },
            {
              id: 'draft_4',
              name: 'Harvest Gold Bread 400g',
              quantity: 8,
              unit: 'packet',
              buyPrice: 42,
              totalPrice: 336,
              suggestedSellPrice: 50,
              suggestedCategory: 'bread_bakery',
              spoilQuickly: true,
              exchangeableOnSpoil: true,
            },
          ];

    setVendorName(shopType === 'stationery' ? 'Vidya Stationery Wholesalers' : 'Shree Ganesh Wholesale Agency');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDraftItems(sampleDrafts);
    setHasScanned(true);
    setIsSampleBill(true);
    setErrorMessage(null);
    showToast(
      lang === 'hi'
        ? 'जांच के लिए नमूना थोक पर्ची लोड की गई (यह असली पर्ची नहीं है)।'
        : lang === 'pa'
        ? 'ਜਾਂਚ ਲਈ ਨਮੂਨਾ ਬਿੱਲ ਲੋਡ ਕੀਤਾ ਗਿਆ।'
        : 'Loaded sample purchase bill for instant review (DEMO).'
    );
  };

  const processBillImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsSampleBill(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const res = await fetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          shopType,
          language: lang,
        }),
      });

      clearTimeout(timeoutId);

      const isJson = res.headers.get('content-type')?.includes('application/json');
      let data: any = null;
      if (isJson) {
        data = await res.json();
      }

      if (!res.ok || data?.success === false) {
        const errorMsg = data?.error || (
          lang === 'hi'
            ? 'पर्ची से सामान नहीं पढ़ा जा सका। कृपया साफ़ रोशनी में दोबारा फ़ोटो लें।'
            : 'Could not read items from this bill photo. Please take a clearer, well-lit photo.'
        );
        throw new Error(errorMsg);
      }

      const billData = data?.data || data || {};
      const rawItems = Array.isArray(billData.items) ? billData.items : [];

      if (rawItems.length === 0) {
        throw new Error(
          lang === 'hi'
            ? 'पर्ची से कोई सामान नहीं मिला। कृपया साफ़ लिखावट वाली फ़ोटो लें।'
            : 'No valid inventory items found in this bill photo. Please try with a clearer photo.'
        );
      }

      setVendorName(billData.vendorName || '');
      setInvoiceDate(billData.invoiceDate || new Date().toISOString().split('T')[0]);

      const items: ScannedBillDraftItem[] = rawItems.map((it: any, idx: number) => {
        // Look for match in existing items
        const match = existingItems.find(
          (ex) => ex.name.toLowerCase().trim() === it.name?.toLowerCase().trim()
        );

        return {
          id: 'draft_' + idx + '_' + Date.now(),
          name: it.name || 'Unknown Item',
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'packet',
          buyPrice: Number(it.buyPrice) || 0,
          totalPrice: Number(it.totalPrice) || (Number(it.quantity) || 1) * (Number(it.buyPrice) || 0),
          suggestedSellPrice: Number(it.suggestedSellPrice) || (it.buyPrice ? Math.round(Number(it.buyPrice) * 1.15) : 0),
          suggestedCategory: it.suggestedCategory || 'general_items',
          packetSize: it.packetSize,
          spoilQuickly: Boolean(it.spoilQuickly),
          exchangeableOnSpoil: Boolean(it.exchangeableOnSpoil),
          matchedItemId: match ? match.id : undefined,
          isUncertain: Boolean(it.isUncertain),
          uncertainField: it.uncertainField || undefined,
        };
      });

      setDraftItems(items);
      setHasScanned(true);
    } catch (err: any) {
      console.error('Scan bill error:', err);
      // STRICT DIRECTIVE: NEVER substitute sample/placeholder data automatically on failure.
      // Reset draft items to empty, do not show scanned screen, show clean error state with "Try Again".
      setDraftItems([]);
      setHasScanned(false);
      setErrorMessage(
        err?.name === 'AbortError'
          ? (lang === 'hi' ? 'सर्वर से संपर्क धीमा होने के कारण समय समाप्त हो गया। कृपया दोबारा कोशिश करें।' : 'Server request timed out. Please check your connection and try again.')
          : (err?.message || (lang === 'hi' ? 'स्कैन पूरा नहीं हो सका। कृपया दोबारा कोशिश करें।' : 'Scan could not be completed. Please try again.'))
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateDraft = (id: string, updates: Partial<ScannedBillDraftItem>) => {
    setDraftItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, ...updates };
        if ('quantity' in updates || 'buyPrice' in updates) {
          updated.totalPrice = Math.round(updated.quantity * updated.buyPrice * 10) / 10;
        }
        return updated;
      })
    );
  };

  const handleRemoveDraft = (id: string) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddNewDraftRow = () => {
    const newId = 'draft_manual_' + Date.now();
    setDraftItems((prev) => [
      ...prev,
      {
        id: newId,
        name: '',
        quantity: 1,
        unit: 'packet',
        buyPrice: 20,
        totalPrice: 20,
        suggestedSellPrice: 25,
        suggestedCategory: categories[0]?.id || 'general_items',
        spoilQuickly: false,
        exchangeableOnSpoil: false,
      },
    ]);
  };

  const handleConfirmAddToStock = () => {
    const validItems = draftItems.filter((it) => it.name.trim().length > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया कम से कम एक सही सामान जोड़ें।'
          : lang === 'pa'
          ? 'ਘੱਟੋ-ਘੱਟ ਇੱਕ ਸਹੀ ਸਮਾਨ ਜੋੜੋ।'
          : 'Please ensure at least one valid item is present.'
      );
      return;
    }

    batchAddScannedItems(validItems);
    onClose();
  };

  const grandTotal = draftItems.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E4DFD2] my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4DFD2] flex items-center justify-between bg-[#1E4632] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0]/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#D9A62E]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base">{t.scanBillTitle}</h3>
                <span className="text-[10px] bg-[#D9A62E] text-[#1E4632] font-extrabold px-1.5 py-0.5 rounded-md">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-[#FAF7F0]/80">{t.scanBillSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Upload / Capture Stage */}
          {!hasScanned && !isAnalyzing && (
            <div className="space-y-4">
              {/* Combined Compact Action Bar: Camera + Gallery + Inline Dropzone */}
              <div className="bg-[#FAF7F0] border border-[#E4DFD2] rounded-2xl p-3 shadow-2xs space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2.5 px-3 bg-[#1E4632] hover:bg-[#153424] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#D9A62E] shrink-0" />
                    <span className="truncate">
                      {lang === 'hi' ? 'कैमरे से फ़ोटो लें' : lang === 'pa' ? 'ਕੈਮਰੇ ਨਾਲ ਫ਼ੋਟੋ' : 'Camera Photo'}
                    </span>
                  </button>

                  {/* Gallery Button */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-2.5 px-3 bg-white hover:bg-[#F4EFE6] text-[#1E4632] border border-[#1E4632]/30 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-xs cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                    <span className="truncate">
                      {lang === 'hi' ? 'गैलरी से चुनें' : lang === 'pa' ? 'ਗੈਲਰੀ ਵਿੱਚੋਂ' : 'From Gallery'}
                    </span>
                  </button>
                </div>

                {/* Inline Drag / Drop & Quick Subtext */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => galleryInputRef.current?.click()}
                  className={`py-1.5 px-3 rounded-lg border border-dashed text-center cursor-pointer transition text-[11px] font-medium flex items-center justify-center gap-1.5 ${
                    isDragging
                      ? 'border-[#1E4632] bg-[#E7F0EA] text-[#1E4632]'
                      : 'border-[#D9D3C5] bg-white/70 text-[#726C60] hover:bg-white hover:text-[#1E4632]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-[#2F6B4F] shrink-0" />
                  <span className="truncate">
                    {lang === 'hi'
                      ? 'या पर्चे की फ़ोटो (JPG, PNG) यहाँ खींच कर लाएं'
                      : lang === 'pa'
                      ? 'ਜਾਂ ਪਰਚੇ ਦੀ ਫ਼ੋਟੋ ਇੱਥੇ ਖਿੱਚ ਕੇ ਲਿਆਓ'
                      : 'Or drop bill image here (auto-compressed)'}
                  </span>
                </div>
              </div>

              {/* Hidden Inputs */}
              {/* 1. Camera Input (forces hardware camera on mobile) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              {/* 2. Gallery Input (opens photo gallery/file picker on mobile & desktop) */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Sample Bill Button */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E4DFD2] bg-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2F6B4F]" />
                  <span className="text-xs font-semibold text-[#262421]">
                    {lang === 'hi' ? 'अभी पर्चा नहीं है? डेमो चलाएं' : lang === 'pa' ? 'ਅਜੇ ਪਰਚਾ ਨਹੀਂ ਹੈ? ਡੈਮੋ ਚਲਾਓ' : 'No paper bill right now? Try sample'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadDemoBill}
                  className="px-3 py-1.5 rounded-lg bg-[#E7F0EA] text-[#1E4632] text-xs font-bold hover:bg-[#2F6B4F] hover:text-white transition cursor-pointer"
                >
                  {lang === 'hi' ? 'नमूना बिल लोड करें' : lang === 'pa' ? 'ਨਮੂਨਾ ਬਿੱਲ ਲੋਡ ਕਰੋ' : 'Load Demo Bill'}
                </button>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#E7F0EA] flex items-center justify-center animate-pulse">
                  <Loader2 className="w-8 h-8 text-[#2F6B4F] animate-spin" />
                </div>
                <Sparkles className="w-5 h-5 text-[#D9A62E] absolute -top-1 -right-1 animate-bounce" />
              </div>
              <h4 className="font-bold text-base text-[#1E4632]">{t.scanningBillNotice}</h4>
              <p className="text-xs text-[#726C60] max-w-sm">{t.scanningBillSubnotice}</p>
            </div>
          )}

          {/* Error notice with instant recovery actions - NO fake fallback data */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#E02424]" />
                <div className="flex-1">
                  <h5 className="font-bold text-xs text-[#9B1C1C]">
                    {lang === 'hi' ? 'पर्ची स्कैन नहीं हो सकी' : lang === 'pa' ? 'ਪਰਚਾ ਸਕੈਨ ਨਹੀਂ ਹੋ ਸਕਿਆ' : 'Bill Scanning Failed'}
                  </h5>
                  <p className="font-medium text-[11px] text-[#726C60] mt-0.5 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F8B4B4]/40">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setImagePreview(null);
                    cameraInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1E4632] hover:bg-[#153424] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-[#D9A62E]" />
                  <span>{lang === 'hi' ? 'दोबारा फ़ोटो लें' : lang === 'pa' ? 'ਦੁਬਾਰਾ ਫ਼ੋਟੋ ਲਓ' : 'Try Again / Retake Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setImagePreview(null);
                    galleryInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] text-[#1E4632] font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#2F6B4F]" />
                  <span>{lang === 'hi' ? 'गैलरी से चुनें' : 'Choose from Gallery'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setImagePreview(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[#726C60] hover:text-[#262421] text-xs font-medium cursor-pointer ml-auto"
                >
                  {lang === 'hi' ? 'खारिज करें' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}

          {/* Editable Draft Review Screen */}
          {hasScanned && !isAnalyzing && (
            <div className="space-y-4">
              {/* UNMISTAKABLE DEMO SAMPLE BANNER (Only when explicitly loaded via demo button) */}
              {isSampleBill && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-500 rounded-xl flex items-start gap-2.5 text-amber-950 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {lang === 'hi' ? 'डेमो नमूना' : 'DEMO'}
                      </span>
                      <h5 className="font-extrabold text-xs text-amber-950 tracking-wide uppercase">
                        {lang === 'hi' ? '⚠️ नमूना पर्ची — यह आपकी असली पर्ची नहीं है' : lang === 'pa' ? '⚠️ ਨਮੂਨਾ ਬਿੱਲ — ਇਹ ਤੁਹਾਡਾ ਅਸਲੀ ਬਿੱਲ ਨਹੀਂ ਹੈ' : '⚠️ SAMPLE — NOT YOUR REAL BILL'}
                      </h5>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium mt-1 leading-relaxed">
                      {lang === 'hi'
                        ? 'यह केवल ऐप की कार्यप्रणाली देखने के लिए एक परीक्षण नमूना है। यह आपके द्वारा खींची गई असली पर्ची का डेटा नहीं है।'
                        : lang === 'pa'
                        ? 'ਇਹ ਸਿਰਫ ਡੈਮੋ ਵੇਖਣ ਲਈ ਨਮੂਨਾ ਹੈ। ਇਹ ਤੁਹਾਡੇ ਕੈਮਰੇ ਵਾਲਾ ਅਸਲੀ ਬਿੱਲ ਨਹੀਂ ਹੈ।'
                        : 'This is pre-filled sample data for demonstration. None of these items came from your photographed bill.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Wholesaler & Date Meta */}
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4DFD2] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#726C60] uppercase">{t.billVendor}</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder={
                      lang === 'hi'
                        ? 'थोक व्यापारी / एजेंसी का नाम'
                        : lang === 'pa'
                        ? 'ਥੋਕ ਵਪਾਰੀ / ਏਜੰਸੀ ਦਾ ਨਾਮ'
                        : 'Wholesaler Agency Name'
                    }
                    className="w-full font-bold text-[#1E4632] bg-transparent border-b border-[#E4DFD2] focus:border-[#1E4632] focus:outline-hidden py-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#726C60] uppercase">{t.billInvoiceDate}</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full font-bold text-[#262421] bg-transparent border-b border-[#E4DFD2] focus:border-[#1E4632] focus:outline-hidden py-0.5"
                  />
                </div>
              </div>

              {/* Review banner */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#262421]">{t.draftReviewTitle}</h4>
                  <p className="text-[11px] text-[#726C60]">{t.draftReviewSubtitle}</p>
                </div>
                <button
                  onClick={handleAddNewDraftRow}
                  className="flex items-center gap-1 text-xs font-bold text-[#2F6B4F] hover:text-[#1E4632] px-2 py-1 rounded-lg border border-[#2F6B4F]/30 bg-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'सामान जोड़ें' : lang === 'pa' ? 'ਸਮਾਨ ਜੋੜੋ' : 'Add Row'}</span>
                </button>
              </div>

              {/* Editable Draft Table/Cards */}
              <div className="space-y-3">
                {draftItems.map((draft) => {
                  return (
                    <div
                      key={draft.id}
                      className={`p-3 rounded-xl border bg-white shadow-2xs space-y-2 relative ${
                        draft.isUncertain
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-[#E4DFD2]'
                      }`}
                    >
                      <button
                        onClick={() => handleRemoveDraft(draft.id)}
                        className="absolute top-2.5 right-2.5 text-[#726C60] hover:text-[#C1443B] p-1"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Row 1: Name & Matched Status & Uncertainty Warning */}
                      <div className="pr-7 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <label className="block text-[10px] font-bold text-[#726C60]">
                            {lang === 'hi' ? 'सामान का नाम' : lang === 'pa' ? 'ਸਮਾਨ ਦਾ ਨਾਮ' : 'Product Name'}
                          </label>
                          {draft.isUncertain && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              {lang === 'hi' ? 'लिखावट / दाम जांचें' : 'Check handwriting / price'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => handleUpdateDraft(draft.id, { name: e.target.value })}
                          className={`w-full font-bold text-xs sm:text-sm text-[#262421] border-b focus:border-[#1E4632] focus:outline-hidden py-0.5 ${
                            draft.uncertainField === 'name' ? 'border-amber-400 bg-amber-50/40' : 'border-[#E4DFD2]'
                          }`}
                        />
                        {draft.matchedItemId && (
                          <span className="text-[9px] text-[#2F6B4F] font-bold block">
                            ✓ {lang === 'hi' ? 'दुकान के मौजूदा स्टॉक से मेल खाता है (स्टॉक बढ़ेगा)' : lang === 'pa' ? 'ਮੌਜੂਦਾ ਸਟਾਕ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਹੈ' : 'Matches existing stock (will restock)'}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Quantity, Unit, Buy Price, Sell Price, Line Total */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-[#726C60]">
                            {lang === 'hi' ? 'गिनती' : lang === 'pa' ? 'ਗਿਣਤੀ' : 'Qty'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={draft.quantity}
                            onChange={(e) =>
                              handleUpdateDraft(draft.id, { quantity: parseFloat(e.target.value) || 0 })
                            }
                            className={`w-full px-2 py-1 rounded-lg border font-semibold text-[#262421] ${
                              draft.uncertainField === 'quantity' ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300' : 'border-[#E4DFD2]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#726C60]">
                            {lang === 'hi' ? 'नाप' : lang === 'pa' ? 'ਮਿਣਤੀ' : 'Unit'}
                          </label>
                          <input
                            type="text"
                            value={draft.unit}
                            onChange={(e) => handleUpdateDraft(draft.id, { unit: e.target.value })}
                            className="w-full px-2 py-1 rounded-lg border border-[#E4DFD2] font-semibold text-[#262421]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#726C60]">
                            {lang === 'hi' ? 'खरीद भाव (₹)' : lang === 'pa' ? 'ਖਰੀਦ ਭਾਅ (₹)' : 'Buy (₹)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={draft.buyPrice}
                            onChange={(e) =>
                              handleUpdateDraft(draft.id, { buyPrice: parseFloat(e.target.value) || 0 })
                            }
                            className={`w-full px-2 py-1 rounded-lg border font-semibold text-[#262421] ${
                              draft.isUncertain || draft.uncertainField === 'buyPrice'
                                ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-300'
                                : 'border-[#E4DFD2]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#1E4632]">
                            {lang === 'hi' ? 'बिक्री भाव (₹)' : lang === 'pa' ? 'ਵੇਚ ਭਾਅ (₹)' : 'Sell (₹)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={draft.suggestedSellPrice || ''}
                            onChange={(e) =>
                              handleUpdateDraft(draft.id, { suggestedSellPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded-lg border border-[#2F6B4F] font-bold text-[#1E4632]"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-[#726C60]">
                            {t.lineTotal}
                          </label>
                          <div className="py-1 text-sm font-extrabold text-[#262421]">
                            ₹{draft.totalPrice}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Category & Spoilage attributes */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                        <select
                          value={draft.suggestedCategory || 'general_items'}
                          onChange={(e) => handleUpdateDraft(draft.id, { suggestedCategory: e.target.value })}
                          className="px-2 py-1 rounded-md border border-[#E4DFD2] text-[11px] bg-white font-medium"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name[lang] || c.name.en}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleUpdateDraft(draft.id, { spoilQuickly: !draft.spoilQuickly })}
                          className={`px-2 py-1 rounded-md border text-[11px] font-bold transition cursor-pointer ${
                            draft.spoilQuickly
                              ? 'bg-[#FBF0D9] text-[#9A7016] border-[#D9A62E]'
                              : 'bg-white text-[#726C60] border-[#E4DFD2]'
                          }`}
                        >
                          {draft.spoilQuickly
                            ? '✓ ' + (lang === 'hi' ? 'जल्दी ख़राब' : lang === 'pa' ? 'ਜਲਦੀ ਖ਼ਰਾਬ' : 'Perishable')
                            : lang === 'hi'
                            ? '+ जल्दी ख़राब'
                            : lang === 'pa'
                            ? '+ ਜਲਦੀ ਖ਼ਰਾਬ'
                            : '+ Perishable'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total summary */}
              <div className="p-3 bg-[#E7F0EA] rounded-xl border border-[#2F6B4F]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1E4632]">
                    {draftItems.length} {lang === 'hi' ? 'सामान गिने गए' : lang === 'pa' ? 'ਸਮਾਨ ਗਿਣੇ ਗਏ' : 'Items Extracted'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#726C60] mr-2">{lang === 'hi' ? 'बिल का कुल योग:' : lang === 'pa' ? 'ਬਿੱਲ ਦਾ ਕੁੱਲ ਜੋੜ:' : 'Invoice Total:'}</span>
                  <span className="text-base font-extrabold text-[#1E4632]">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4DFD2] bg-[#FAF7F0] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (hasScanned) {
                setHasScanned(false);
                setDraftItems([]);
                setImagePreview(null);
                setIsSampleBill(false);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-[#E4DFD2] bg-white text-xs font-bold text-[#726C60] hover:bg-[#FAF7F0] cursor-pointer"
          >
            {hasScanned ? (lang === 'hi' ? 'फिर से स्कैन करें' : lang === 'pa' ? 'ਦੁਬਾਰਾ ਸਕੈਨ ਕਰੋ' : 'Rescan') : t.cancelBtn}
          </button>

          {hasScanned && (
            <button
              onClick={handleConfirmAddToStock}
              className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                isSampleBill
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#1E4632] hover:bg-[#2F6B4F]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isSampleBill
                  ? (lang === 'hi' ? 'नमूना स्टॉक जोड़ें (डेमो)' : 'Save Sample Demo')
                  : t.confirmAndAddToStock}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
