import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Check,
  AlertCircle,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vendorName, setVendorName] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [draftItems, setDraftItems] = useState<ScannedBillDraftItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      processBillImage(base64);
    };
    reader.readAsDataURL(file);
  };

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

    setVendorName('Shree Ganesh Wholesale Agency');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDraftItems(sampleDrafts);
    setHasScanned(true);
    showToast(
      lang === 'hi'
        ? 'जांच के लिए नमूना थोक पर्ची लोड की गई।'
        : lang === 'pa'
        ? 'ਜਾਂਚ ਲਈ ਨਮੂਨਾ ਬਿੱਲ ਲੋਡ ਕੀਤਾ ਗਿਆ।'
        : 'Loaded sample purchase bill for instant review.'
    );
  };

  const processBillImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          shopType,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan bill');
      }

      setVendorName(data.vendorName || '');
      setInvoiceDate(data.invoiceDate || '');

      const items: ScannedBillDraftItem[] = (data.items || []).map((it: any, idx: number) => {
        // Look for match in existing items
        const match = existingItems.find(
          (ex) => ex.name.toLowerCase().trim() === it.name?.toLowerCase().trim()
        );

        return {
          id: 'draft_' + idx,
          name: it.name || 'Unknown Item',
          quantity: it.quantity || 1,
          unit: it.unit || 'piece',
          buyPrice: it.buyPrice || 0,
          totalPrice: it.totalPrice || (it.quantity || 1) * (it.buyPrice || 0),
          suggestedSellPrice: it.suggestedSellPrice || (it.buyPrice ? Math.round(it.buyPrice * 1.15) : 0),
          suggestedCategory: it.suggestedCategory || 'general_items',
          packetSize: it.packetSize,
          spoilQuickly: it.spoilQuickly || false,
          exchangeableOnSpoil: it.exchangeableOnSpoil || false,
          matchedItemId: match ? match.id : undefined,
        };
      });

      setDraftItems(items);
      setHasScanned(true);

      if (items.length === 0) {
        setErrorMessage(t.noItemsExtracted);
      }
    } catch (err: any) {
      console.error('Scan bill error:', err);
      setErrorMessage(
        lang === 'hi'
          ? 'बिल स्कैन करने में समस्या हुई।'
          : lang === 'pa'
          ? 'ਬਿੱਲ ਸਕੈਨ ਕਰਨ ਵਿੱਚ ਦਿੱਕਤ ਆਈ।'
          : err.message || 'Error communicating with AI bill scanner.'
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
                <span className="text-[10px] bg-[#D9A62E] text-[#1E4632] font-extrabold px-1.5 py-0.2 rounded-md">
                  Gemini 3.8
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
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2F6B4F]/40 rounded-2xl p-8 bg-[#FAF7F0] hover:bg-[#E7F0EA]/40 transition text-center cursor-pointer flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#1E4632] text-white flex items-center justify-center shadow-md">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#1E4632]">{t.takePhoto}</h4>
                  <p className="text-xs text-[#726C60] max-w-sm mt-1">
                    {lang === 'hi'
                      ? 'थोक व्यापारी की पर्ची की फ़ोटो खींचें। हाथ का लिखा या पक्का कंप्यूटर बिल दोनों चलेगा।'
                      : lang === 'pa'
                      ? 'ਥੋਕ ਵਪਾਰੀ ਦੀ ਪਰਚੀ ਦੀ ਫ਼ੋਟੋ ਖਿੱਚੋ। ਹੱਥ ਦਾ ਲਿਖਿਆ ਜਾਂ ਕੰਪਿਊਟਰ ਬਿੱਲ ਦੋਵੇਂ ਚੱਲਣਗੇ।'
                      : 'Take a clear photo of your wholesaler receipt or invoice.'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Sample Bill Button */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E4DFD2] bg-white">
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

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#F8E6E4] text-[#C1443B] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Editable Draft Review Screen */}
          {hasScanned && !isAnalyzing && (
            <div className="space-y-4">
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
                      className="p-3 rounded-xl border border-[#E4DFD2] bg-white shadow-2xs space-y-2 relative"
                    >
                      <button
                        onClick={() => handleRemoveDraft(draft.id)}
                        className="absolute top-2.5 right-2.5 text-[#726C60] hover:text-[#C1443B] p-1"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Row 1: Name & Matched Status */}
                      <div className="pr-7">
                        <label className="block text-[10px] font-bold text-[#726C60]">
                          {lang === 'hi' ? 'सामान का नाम' : lang === 'pa' ? 'ਸਮਾਨ ਦਾ ਨਾਮ' : 'Product Name'}
                        </label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => handleUpdateDraft(draft.id, { name: e.target.value })}
                          className="w-full font-bold text-xs sm:text-sm text-[#262421] border-b border-[#E4DFD2] focus:border-[#1E4632] focus:outline-hidden py-0.5"
                        />
                        {draft.matchedItemId && (
                          <span className="text-[9px] text-[#2F6B4F] font-bold">
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
                            className="w-full px-2 py-1 rounded-lg border border-[#E4DFD2] font-semibold text-[#262421]"
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
                            className="w-full px-2 py-1 rounded-lg border border-[#E4DFD2] font-semibold text-[#262421]"
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
              className="px-5 py-2.5 rounded-xl bg-[#1E4632] text-white text-xs sm:text-sm font-bold hover:bg-[#2F6B4F] transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.confirmAndAddToStock}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
