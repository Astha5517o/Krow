import React, { useState, useRef } from 'react';
import { StockItem, Language, ScannedBillDraft, ScannedBillItem } from '../types';
import { translations } from '../translations';
import { localizeItemName, localizeUnit } from '../utils/localization';
import { matchStockItem, inferCategory, matchMasterKaryanaItem } from '../utils/stockMatcher';
import { preprocessBillImage } from '../utils/imagePreprocess';

interface ScanBillModalProps {
  language: Language;
  stockItems: StockItem[];
  onConfirmAddToStock: (
    itemsToAdd: {
      name: string;
      quantity: number;
      unit: string;
      rate: number;
      category?: string;
      matchedItemId?: string;
    }[],
    vendorName: string,
    paymentMode: 'cash' | 'credit'
  ) => void;
  onClose: () => void;
}

interface ImageQualityWarning {
  type: 'dark' | 'blurry' | 'angle';
  message: string;
}

export const ScanBillModal: React.FC<ScanBillModalProps> = ({
  language,
  stockItems,
  onConfirmAddToStock,
  onClose,
}) => {
  const t = translations[language];
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [billDraft, setBillDraft] = useState<ScannedBillDraft | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [qualityWarning, setQualityWarning] = useState<ImageQualityWarning | null>(null);

  // Pre-processing and retry states
  const [rawImage, setRawImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [scanStatusStage, setScanStatusStage] = useState<'preprocessing' | 'scanning' | 'retrying'>('preprocessing');
  const [preprocessInfo, setPreprocessInfo] = useState<{
    detectedAngle: number;
    contrastBoosted: boolean;
    deskewApplied: boolean;
    isRetry: boolean;
  } | null>(null);

  // Match item names with existing stock to compare buy rates
  const enrichScannedItem = (item: {
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
    category?: string;
    isUncertain?: boolean;
    nameConfidence?: 'high' | 'medium' | 'low';
    qtyConfidence?: 'high' | 'medium' | 'low';
    rateConfidence?: 'high' | 'medium' | 'low';
  }): ScannedBillItem => {
    // Look for matching stock item using smart matcher
    const matched = matchStockItem(item.name, stockItems);
    const masterMatch = !matched ? matchMasterKaryanaItem(item.name) : undefined;

    let rateComparison: 'fair' | 'cheaper' | 'costlier' | 'check' = 'fair';
    if (matched) {
      if (item.rate < matched.buyPrice) {
        rateComparison = 'cheaper';
      } else if (item.rate > matched.buyPrice) {
        rateComparison = 'costlier';
      } else {
        rateComparison = 'fair';
      }
    } else if (item.isUncertain || item.rateConfidence === 'low') {
      rateComparison = 'check';
    }

    return {
      id: 'scanned-' + Math.random().toString(36).substr(2, 9),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || masterMatch?.unit || 'पैकेट',
      rate: item.rate,
      total: item.total || item.quantity * item.rate,
      category: item.category || masterMatch?.category || inferCategory(item.name),
      isUncertain: item.isUncertain || item.nameConfidence === 'low' || item.qtyConfidence === 'low' || item.rateConfidence === 'low',
      nameConfidence: item.nameConfidence || (item.isUncertain ? 'low' : 'high'),
      qtyConfidence: item.qtyConfidence || (item.isUncertain ? 'low' : 'high'),
      rateConfidence: item.rateConfidence || (item.isUncertain ? 'low' : 'high'),
      matchedItemId: matched?.id,
      existingBuyRate: matched?.buyPrice,
      existingSellRate: matched?.sellPrice,
      suggestedSellRate: masterMatch?.sellPrice,
      matchedMasterName: masterMatch?.name,
      rateComparison,
    };
  };

  const executeScanApi = async (imageBase64: string, mimeType: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const res = await fetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      if (!res.ok) {
        return { success: false, error: 'Network error while uploading bill' };
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to scan' };
    }
  };

  const handleProcessImage = async (
    base64: string,
    mimeType: string = 'image/jpeg',
    isDirectRetry: boolean = false
  ) => {
    setLoading(true);
    setErrorMessage('');
    setQualityWarning(null);
    setPendingImage(null);
    setRawImage({ base64, mimeType });

    try {
      // Step 1: High-Speed Image Pre-processing (Deskewing & Contrast Enhancement in <80ms)
      setScanStatusStage('preprocessing');
      const prepProfile = isDirectRetry ? 'high-contrast' : 'standard';

      const prepResult = await preprocessBillImage(base64, {
        profile: prepProfile,
        enhanceContrast: true,
        deskew: true,
        maxDimension: 1100,
      });

      // Step 2: High-Performance Vision OCR via Gemini Cascade
      setScanStatusStage('scanning');
      const json = await executeScanApi(prepResult.processedBase64, prepResult.mimeType);

      const items = json.success && json.data?.items && Array.isArray(json.data.items) ? json.data.items : [];
      if (!json.success || !json.data || items.length === 0) {
        setErrorMessage(t.scanFailureMsg);
        setLoading(false);
        return;
      }

      setPreprocessInfo({
        detectedAngle: prepResult.detectedAngle,
        contrastBoosted: prepResult.contrastBoosted,
        deskewApplied: prepResult.deskewApplied,
        isRetry: isDirectRetry,
      });

      const raw = json.data;
      const enrichedItems: ScannedBillItem[] = (raw.items || []).map(enrichScannedItem);
      const totalAmount = enrichedItems.reduce((acc, i) => acc + i.total, 0);

      setBillDraft({
        vendorName: raw.vendorName || 'थोक विक्रेता (Wholesale Distributor)',
        billDate: raw.billDate || new Date().toLocaleDateString('hi-IN'),
        billNumber: raw.billNumber || '',
        items: enrichedItems,
        totalAmount,
        previousBalanceBaqi: raw.previousBalanceBaqi,
        billTotal: raw.billTotal,
        grandTotal: raw.grandTotal,
        paymentMode: 'cash',
      });
    } catch (err) {
      console.error('Bill scan client error:', err);
      setErrorMessage(t.scanFailureMsg);
    } finally {
      setLoading(false);
    }
  };

  // High-performance image loader: reads file directly and delegates to single-pass preprocessor
  const processCapturedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleProcessImage(base64, file.type || 'image/jpeg');
    };
    reader.onerror = () => {
      setErrorMessage(t.scanFailureMsg);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so picking the same file again triggers onChange
    const inputElement = e.target;
    processCapturedFile(file);
    inputElement.value = '';
  };

  // Sample realistic bill matching real Indian handwritten wholesale slips
  const handleUseSampleBill = () => {
    setLoading(true);
    setQualityWarning(null);
    setPendingImage(null);

    setTimeout(() => {
      const sampleItems = [
        {
          name: 'आटा (10kg थैला)',
          quantity: 4,
          unit: '10kg बोरी',
          rate: 320,
          total: 1280,
          category: 'दाल व अनाज',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'सफेद चना (काबुली)',
          quantity: 5,
          unit: 'किलो',
          rate: 84,
          total: 420,
          category: 'दाल व अनाज',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'रिफाइंड तेल (1 Tin)',
          quantity: 1,
          unit: 'टिन',
          rate: 2190,
          total: 2190,
          category: 'खाद्य तेल व घी',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'गरम मसाला (500g)',
          quantity: 1,
          unit: '500g पैकेट',
          rate: 130,
          total: 130,
          category: 'मसाले',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'हल्दी पाउडर (500g)',
          quantity: 1,
          unit: '500g पैकेट',
          rate: 110,
          total: 110,
          category: 'मसाले',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'लाल मिर्च (500g)',
          quantity: 1,
          unit: '500g पैकेट',
          rate: 130,
          total: 130,
          category: 'मसाले',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'मैदा',
          quantity: 5,
          unit: 'किलो',
          rate: 34,
          total: 170,
          category: 'दाल व अनाज',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
        {
          name: 'अजवाइन (500g)',
          quantity: 1,
          unit: '500g पैकेट',
          rate: 100,
          total: 100,
          category: 'मसाले',
          isUncertain: false,
          nameConfidence: 'high' as const,
          qtyConfidence: 'high' as const,
          rateConfidence: 'high' as const,
        },
      ];

      const enriched = sampleItems.map(enrichScannedItem);
      const totalAmount = enriched.reduce((acc, i) => acc + i.total, 0);

      setBillDraft({
        vendorName: 'तौफ़ीक़ शाह स्पाइसेस (Taufiq Shah Spices)',
        billDate: new Date().toLocaleDateString('hi-IN'),
        billNumber: 'BIL-743',
        items: enriched,
        totalAmount,
        previousBalanceBaqi: 1200,
        billTotal: 4530,
        grandTotal: 5730,
        paymentMode: 'cash',
      });
      setLoading(false);
    }, 500);
  };

  const updateDraftItem = (index: number, field: keyof ScannedBillItem, val: any) => {
    if (!billDraft) return;
    const items = [...billDraft.items];
    const item = { ...items[index], [field]: val };
    item.total = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    // User manually edited, clear uncertainty for this field
    if (field === 'name') item.nameConfidence = 'high';
    if (field === 'quantity') item.qtyConfidence = 'high';
    if (field === 'rate') item.rateConfidence = 'high';
    if (item.nameConfidence === 'high' && item.qtyConfidence === 'high' && item.rateConfidence === 'high') {
      item.isUncertain = false;
    }
    items[index] = item;
    const totalAmount = items.reduce((acc, i) => acc + i.total, 0);
    setBillDraft({ ...billDraft, items, totalAmount });
  };

  const handleConfirm = () => {
    if (!billDraft) return;
    const itemsToAdd = billDraft.items.map((i) => ({
      name: i.name,
      quantity: Number(i.quantity) || 0,
      unit: i.unit,
      rate: Number(i.rate) || 0,
      category: i.category,
      matchedItemId: i.matchedItemId,
    }));

    onConfirmAddToStock(itemsToAdd, billDraft.vendorName, billDraft.paymentMode);
    onClose();
  };

  return (
    <div id="scan-bill-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div id="scan-bill-modal-container" className="max-w-md w-full max-h-[94vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6B4F] text-2xl">
              document_scanner
            </span>
            <h2 className="text-base font-bold text-[#262421] font-display">
              {t.billScanHeaderTitle}
            </h2>
          </div>
          <button
            id="close-scan-bill-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Hidden Camera Input (forces device camera via capture="environment") */}
        <input
          id="camera-file-input"
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Hidden Gallery Input (strictly WITHOUT capture attribute so Android and iOS open photo gallery picker) */}
        <input
          id="gallery-file-input"
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Top Warning Banner (Stitch Screen 12) */}
          <div className="p-3.5 bg-[#FBF0D9] border border-[#D9A62E]/40 rounded-2xl flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#D9A62E] text-2xl flex-shrink-0 fill">
              shield
            </span>
            <div>
              <h3 className="text-xs font-bold text-[#7a5900]">
                {t.billScanWarningBanner}
              </h3>
              <p className="text-[11px] text-[#7a5900] leading-snug mt-0.5">
                {t.billScanWarningDesc}
              </p>
            </div>
          </div>

          {/* Pre-upload Quality Warning Prompt */}
          {qualityWarning && pendingImage && (
            <div className="p-3.5 bg-[#FBF0D9] border border-[#D9A62E] rounded-2xl flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#D9A62E] text-xl flex-shrink-0">
                  warning
                </span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#7a5900] block">
                    {t.photoUnclearWarning} ({qualityWarning.message})
                  </span>
                  <p className="text-[11px] text-[#7a5900] mt-0.5">
                    {t.retakeOrProceed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-9 bg-white border border-[#D9A62E] rounded-xl text-xs font-bold text-[#7a5900] hover:bg-[#FAF7F0] active:scale-95 transition-all"
                >
                  📷 {t.btnTakePhoto}
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 h-9 bg-white border border-[#D9A62E] rounded-xl text-xs font-bold text-[#7a5900] hover:bg-[#FAF7F0] active:scale-95 transition-all"
                >
                  🖼️ {t.btnUploadBill}
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessImage(pendingImage.base64, pendingImage.mimeType)}
                  className="flex-1 h-9 bg-[#2F6B4F] text-white rounded-xl text-xs font-bold hover:bg-[#1E4632] active:scale-95 transition-all"
                >
                  {t.btnContinue}
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator with Stage-specific Status */}
          {loading && (
            <div className="bg-white rounded-2xl border border-[#E4DFD2] p-8 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="relative mb-3 flex items-center justify-center">
                <div
                  className={`w-14 h-14 border-3 rounded-full animate-spin ${
                    scanStatusStage === 'retrying'
                      ? 'border-[#D9A62E] border-t-transparent'
                      : 'border-[#2F6B4F] border-t-transparent'
                  }`}
                />
                <span
                  className={`material-symbols-outlined text-2xl absolute ${
                    scanStatusStage === 'retrying'
                      ? 'text-[#D9A62E]'
                      : 'text-[#2F6B4F]'
                  }`}
                >
                  {scanStatusStage === 'preprocessing'
                    ? 'tune'
                    : scanStatusStage === 'retrying'
                    ? 'auto_fix_high'
                    : 'document_scanner'}
                </span>
              </div>
              <p className="text-sm font-bold text-[#262421]">
                {scanStatusStage === 'preprocessing'
                  ? t.preprocessingBillMsg
                  : scanStatusStage === 'retrying'
                  ? t.scanRetryingMsg
                  : t.scanningWaitMsg}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-[#726C60]">
                <span className={`inline-block w-2 h-2 rounded-full ${scanStatusStage === 'retrying' ? 'bg-[#D9A62E]' : 'bg-[#2F6B4F]'} animate-pulse`}></span>
                <span>
                  {scanStatusStage === 'preprocessing'
                    ? (language === 'pa' ? 'ਲਿਖਾਵਟ ਸਾਫ਼ ਅਤੇ ਕੋਣ ਸਿੱਧਾ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...' : language === 'en' ? 'Straightening angle & enhancing text contrast...' : 'लिखावट स्पष्ट व तिरछापन सीधा किया जा रहा है...')
                    : scanStatusStage === 'retrying'
                    ? (language === 'pa' ? 'ਗੂੜ੍ਹੀ ਸਿਆਹੀ ਅਤੇ ਵੱਧ ਕੰਟ੍ਰਾਸਟ ਨਾਲ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼...' : language === 'en' ? 'Applying ink deepening & high-contrast retry...' : 'गहरी स्याही व हाई-कंट्रास्ट से दोबारा स्कैन हो रहा है...')
                    : (language === 'pa' ? 'ਸਮਾਨ, ਗਿਣਤੀ ਅਤੇ ਥੋਕ ਭਾਅ ਪੜ੍ਹ ਰਹੇ ਹਾਂ...' : language === 'en' ? 'Reading items, pack quantities & buy rates...' : 'सामान, मात्रा और थोक भाव पहचाने जा रहे हैं...')}
                </span>
              </div>
            </div>
          )}

          {/* Error Message with Retry Controls */}
          {errorMessage && !loading && (
            <div className="p-3.5 bg-[#F8E6E4] border border-[#C1443B]/30 rounded-2xl flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#C1443B] text-xl flex-shrink-0">
                error
              </span>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#C1443B]">
                  {errorMessage}
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {rawImage && (
                    <button
                      id="retry-scan-button"
                      type="button"
                      onClick={() => handleProcessImage(rawImage.base64, rawImage.mimeType, true)}
                      className="px-3 py-1.5 bg-[#2F6B4F] hover:bg-[#1E4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      <span>{t.btnRetryScan}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white border border-[#C1443B]/30 rounded-lg text-xs font-bold text-[#C1443B] flex items-center gap-1 hover:bg-[#FAF7F0] cursor-pointer"
                  >
                    <span>📷</span>
                    <span>{t.btnTakePhoto}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white border border-[#C1443B]/30 rounded-lg text-xs font-bold text-[#C1443B] flex items-center gap-1 hover:bg-[#FAF7F0] cursor-pointer"
                  >
                    <span>🖼️</span>
                    <span>{t.btnUploadBill}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseSampleBill}
                    className="px-2.5 py-1.5 bg-[#FBF0D9] border border-[#D9A62E]/30 rounded-lg text-xs font-bold text-[#7a5900] flex items-center gap-1 hover:bg-[#ffdea1] cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>{t.btnUseSampleBill}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Initial Upload State */}
          {!billDraft && !loading && !qualityWarning && (
            <div className="bg-white rounded-2xl border border-[#E4DFD2] p-6 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              </div>
              <h3 className="text-base font-bold text-[#262421]">
                {t.scanWholesaleBillTitle}
              </h3>
              <p className="text-xs text-[#726C60] mt-1 mb-5 max-w-xs">
                {t.scanWholesaleBillDesc}
              </p>

              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  id="take-bill-photo-btn"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-12 bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">camera_alt</span>
                  <span>{t.btnTakePhoto}</span>
                </button>

                <button
                  id="upload-bill-photo-btn"
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full h-11 bg-white border border-[#E4DFD2] hover:bg-[#FAF7F0] text-[#262421] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">image</span>
                  <span>{t.btnUploadBill}</span>
                </button>

                <button
                  id="use-sample-bill-btn"
                  type="button"
                  onClick={handleUseSampleBill}
                  className="w-full h-10 bg-[#FBF0D9] hover:bg-[#ffdea1] text-[#7a5900] border border-[#D9A62E]/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-1"
                >
                  <span className="material-symbols-outlined text-base fill">bolt</span>
                  <span>{t.btnUseSampleBill}</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanned Bill Draft Table (Stitch Screen 12) */}
          {billDraft && !loading && (
            <div className="flex flex-col gap-3">
              {/* Vendor Box */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#E4DFD2] shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xl fill">store</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#726C60] block leading-none">
                      {t.wholesaleVendorLabel}
                    </span>
                    <span className="text-sm font-bold text-[#262421] block mt-0.5">
                      {billDraft.vendorName}
                    </span>
                    <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[11px] text-[#A29C8E]">
                      <span>{billDraft.billDate} • {billDraft.items.length} {t.scannedItemsCountSuffix}</span>
                      {preprocessInfo && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F0EA] text-[#2F6B4F] text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[12px]">tune</span>
                          <span>{t.scanAutoEnhancedBadge}</span>
                          {preprocessInfo.deskewApplied && Math.abs(preprocessInfo.detectedAngle) >= 0.5 && (
                            <span>• {Math.abs(preprocessInfo.detectedAngle).toFixed(1)}°</span>
                          )}
                          {preprocessInfo.isRetry && (
                            <span className="text-[#B37800] font-bold">
                              ({language === 'pa' ? 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼' : language === 'en' ? 'Retry' : 'पुनः प्रयास'})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs font-bold text-[#2F6B4F] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">replay</span>
                  <span>{t.btnRetakePhoto}</span>
                </button>
              </div>

              {/* Items List */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#E4DFD2] pb-2">
                  <h4 className="text-xs font-bold text-[#262421] uppercase tracking-wider">
                    {t.itemsFoundInBillTitle}
                  </h4>
                  <span className="text-[11px] text-[#726C60] font-medium">
                    {t.tapToEditHint}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {billDraft.items.map((item, idx) => {
                    const isEditing = editingItemIndex === idx;
                    const hasNameUncertain = item.nameConfidence === 'low';
                    const hasQtyUncertain = item.qtyConfidence === 'low';
                    const hasRateUncertain = item.rateConfidence === 'low';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all ${
                          item.isUncertain
                            ? 'bg-[#FBF0D9]/35 border-[#D9A62E]/60'
                            : 'bg-[#FAF7F0] border-[#E4DFD2]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col flex-1 min-w-0">
                            {isEditing ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateDraftItem(idx, 'name', e.target.value)}
                                  className={`w-full h-8 px-2 rounded-lg border bg-white text-xs font-bold text-[#262421] ${
                                    hasNameUncertain ? 'border-[#D9A62E] ring-1 ring-[#D9A62E]' : 'border-[#E4DFD2]'
                                  }`}
                                />
                                {hasNameUncertain && (
                                  <span className="text-[10px] text-[#C1443B] font-medium block mt-0.5">
                                    {t.fieldUncertainTooltip}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-xs font-bold text-[#262421] px-1 py-0.5 rounded ${
                                    hasNameUncertain ? 'bg-[#FBF0D9] border border-[#D9A62E]/60 text-[#7a5900]' : ''
                                  }`}
                                  title={hasNameUncertain ? t.fieldUncertainTooltip : undefined}
                                >
                                  {localizeItemName(item.name, language)}
                                </span>

                                {item.category && (
                                  <span className="text-[10px] font-medium text-[#726C60] bg-[#FAF7F0] border border-[#E4DFD2] px-1.5 py-0.5 rounded-md">
                                    {item.category}
                                  </span>
                                )}

                                {item.matchedItemId ? (
                                  <span className="text-[10px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    ✓ स्टॉक लिंक
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-[#7a5900] bg-[#FBF0D9] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    + नया आइटम
                                  </span>
                                )}

                                {!item.matchedItemId && item.matchedMasterName && (
                                  <span
                                    className="text-[10px] font-bold text-[#1E4632] bg-[#E7F0EA] border border-[#2F6B4F]/30 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                    title="किराना मास्टर कैटलॉग से सुझाया गया बिक्री भाव"
                                  >
                                    <span className="material-symbols-outlined text-[11px] text-[#2F6B4F]">auto_awesome</span>
                                    <span>MRP भाव: ₹{item.suggestedSellRate}</span>
                                  </span>
                                )}

                                {item.rateComparison === 'cheaper' && (
                                  <span className="text-[10px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-1.5 py-0.2 rounded-md">
                                    {t.rateCheaperBadge}
                                  </span>
                                )}
                                {item.rateComparison === 'fair' && (
                                  <span className="text-[10px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-1.5 py-0.2 rounded-md">
                                    {t.rateFairBadge}
                                  </span>
                                )}
                                {item.isUncertain && (
                                  <span className="text-[10px] font-bold text-[#C1443B] bg-[#F8E6E4] px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                    {t.uncertainHandwriting}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingItemIndex(isEditing ? null : idx)}
                            className="text-[#726C60] hover:text-[#2F6B4F] text-xs font-bold ml-2 flex-shrink-0"
                          >
                            {isEditing ? t.btnDone : t.btnChange}
                          </button>
                        </div>

                        {/* Per-Field Confidence Qty, Rate & Total Row */}
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#E4DFD2]/60">
                          {/* Qty Column */}
                          <div className={`p-1 rounded-lg ${hasQtyUncertain ? 'bg-[#FBF0D9]/80 border border-[#D9A62E]' : ''}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#726C60] block">
                                {t.qtyColLabel}
                              </span>
                              {hasQtyUncertain && (
                                <span className="text-[9px] text-[#C1443B] font-bold" title={t.fieldUncertainTooltip}>
                                  ⚠️
                                </span>
                              )}
                            </div>
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateDraftItem(idx, 'quantity', e.target.value)}
                                className="w-full h-7 px-1.5 rounded border border-[#E4DFD2] bg-white text-xs font-bold"
                              />
                            ) : (
                              <span className="text-xs font-bold text-[#262421]">
                                {item.quantity} {localizeUnit(item.unit, language)}
                              </span>
                            )}
                          </div>

                          {/* Rate Column */}
                          <div className={`p-1 rounded-lg ${hasRateUncertain ? 'bg-[#FBF0D9]/80 border border-[#D9A62E]' : ''}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#726C60] block">
                                {t.billRateColLabel}
                              </span>
                              {hasRateUncertain && (
                                <span className="text-[9px] text-[#C1443B] font-bold" title={t.fieldUncertainTooltip}>
                                  ⚠️
                                </span>
                              )}
                            </div>
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateDraftItem(idx, 'rate', e.target.value)}
                                className="w-full h-7 px-1.5 rounded border border-[#E4DFD2] bg-white text-xs font-bold"
                              />
                            ) : (
                              <span className="text-xs font-bold text-[#262421]">
                                ₹{item.rate}
                              </span>
                            )}
                          </div>

                          {/* Line Total */}
                          <div className="text-right p-1">
                            <span className="text-[10px] text-[#726C60] block">
                              {t.lineTotalColLabel}
                            </span>
                            <span className="text-xs font-extrabold text-[#1E4632] font-display">
                              ₹{item.total.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total & Previous Arrears (Baqi) Breakdown */}
                {billDraft.previousBalanceBaqi && billDraft.previousBalanceBaqi > 0 ? (
                  <div className="pt-2 border-t border-[#E4DFD2] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-[#726C60]">
                      <span>{t.totalInvoiceAmount} ({t.itemsFoundInBillTitle}):</span>
                      <span className="font-bold text-[#262421]">₹{billDraft.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#7a5900]">
                      <span>पिछला बकाया / उधारी (Bq / Arrears):</span>
                      <span className="font-bold text-[#7a5900]">+₹{billDraft.previousBalanceBaqi.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1.5 border-t border-dashed border-[#E4DFD2] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#1E4632] block">
                          कुल देय राशि (Grand Total):
                        </span>
                        <span className="text-[10px] text-[#726C60]">
                          पर्चा सामान + पिछला बकाया
                        </span>
                      </div>
                      <span className="text-xl font-extrabold text-[#1E4632] font-display">
                        ₹{(billDraft.grandTotal || (billDraft.totalAmount + billDraft.previousBalanceBaqi)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#E4DFD2] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#262421] block">
                        {t.totalInvoiceAmount}
                      </span>
                      <span className="text-[11px] text-[#726C60]">
                        {t.totalTaxIncluded}
                      </span>
                    </div>
                    <span className="text-xl font-extrabold text-[#1E4632] font-display">
                      ₹{billDraft.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Mode Selection (Cash vs Credit) */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#E4DFD2] shadow-2xs flex flex-col gap-2">
                <span className="text-xs font-bold text-[#262421]">
                  {t.selectPaymentMode}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="payment-mode-cash-btn"
                    type="button"
                    onClick={() => setBillDraft({ ...billDraft, paymentMode: 'cash' })}
                    className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      billDraft.paymentMode === 'cash'
                        ? 'bg-[#E7F0EA] border-[#2F6B4F] text-[#1E4632] shadow-2xs'
                        : 'bg-white border-[#E4DFD2] text-[#726C60]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    <span>{t.paymentModeCash}</span>
                  </button>

                  <button
                    id="payment-mode-credit-btn"
                    type="button"
                    onClick={() => setBillDraft({ ...billDraft, paymentMode: 'credit' })}
                    className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      billDraft.paymentMode === 'credit'
                        ? 'bg-[#FBF0D9] border-[#D9A62E] text-[#7a5900] shadow-2xs'
                        : 'bg-white border-[#E4DFD2] text-[#726C60]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">menu_book</span>
                    <span>{t.paymentModeCredit}</span>
                  </button>
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                id="confirm-scanned-bill-btn"
                type="button"
                onClick={handleConfirm}
                className="w-full h-12 bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>{t.btnConfirmAddToStock}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
