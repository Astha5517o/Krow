import React, { useState, useEffect } from 'react';
import { PublicCatalogItem, PublicStoreInfo, Language } from '../types';
import { getPublicStoreCatalog } from '../services/publicCatalogService';

interface PublicStockViewProps {
  storeId: string;
  language?: Language;
  onBackToApp?: () => void;
}

export const PublicStockView: React.FC<PublicStockViewProps> = ({
  storeId,
  language = 'hi',
  onBackToApp,
}) => {
  const [storeInfo, setStoreInfo] = useState<PublicStoreInfo | null>(null);
  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await getPublicStoreCatalog(storeId);
        if (isMounted) {
          setStoreInfo(res.store);
          setItems(res.items);
        }
      } catch (err) {
        console.error('Failed to load public catalog:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  // Unique categories
  const categories = ['all', ...Array.from(new Set(items.map((it) => it.category)))];

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability =
      availabilityFilter === 'all' || item.status === availabilityFilter;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const inStockCount = items.filter((it) => it.status === 'in_stock').length;
  const lowStockCount = items.filter((it) => it.status === 'low_stock').length;
  const outOfStockCount = items.filter((it) => it.status === 'out_of_stock').length;

  const handleShareOnWhatsApp = () => {
    const pageUrl = window.location.href;
    const shopName = storeInfo?.shopName || 'हमारी दुकान';
    const text = encodeURIComponent(
      `नमस्ते! हमारे ${shopName} में अभी क्या-क्या सामान उपलब्ध है, यहाँ लाइव देखें:\n${pageUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOrderOnWhatsApp = (item?: PublicCatalogItem) => {
    const shopName = storeInfo?.shopName || 'दुकान';
    const phone = storeInfo?.phone ? storeInfo.phone.replace(/[^0-9]/g, '') : '';
    const message = item
      ? `नमस्ते! मुझे आपके ${shopName} से यह सामान चाहिए:\n- ${item.name} (${item.unit || ''})`
      : `नमस्ते! मुझे आपके ${shopName} से सामान मंगाना है।`;
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#16291E] flex flex-col selection:bg-[#2F6B4F]/20">
      {/* Top Banner & Customer Header */}
      <header className="bg-white border-b border-[#E4DFD2] sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6B4F] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[#16291E] leading-tight">
                  {storeInfo?.shopName || 'दुकान लाइव स्टॉक सूची'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#EBF3EE] text-[#2F6B4F] px-2 py-0.5 rounded-full border border-[#2F6B4F]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F] animate-pulse" />
                  लाइव स्टॉक
                </span>
              </div>
              <p className="text-[11px] text-[#6B7C72]">
                {language === 'en'
                  ? 'Real-time stock availability for customers'
                  : 'ग्राहकों के लिए लाइव दुकान सूची • कोई लॉगिन ज़रूरी नहीं'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#2F6B4F] text-xs font-bold transition-colors"
                title="Back to Shopkeeper App"
              >
                दुकानदार लॉगिन
              </button>
            )}
            <button
              type="button"
              onClick={handleShareOnWhatsApp}
              className="w-9 h-9 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] flex items-center justify-center transition-transform active:scale-95"
              title="Share Catalog on WhatsApp"
            >
              <span className="material-symbols-outlined text-lg">share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* Welcome Card & WhatsApp Action */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4DFD2] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-[#2F6B4F] uppercase tracking-wider block">
              ग्राहक सेवा केंद्र
            </span>
            <h2 className="text-sm font-bold text-[#16291E]">
              दुकान आने से पहले चेक करें कि सामान उपलब्ध है या नहीं
            </h2>
            <p className="text-xs text-[#6B7C72] mt-0.5">
              कुल {items.length} सामान दर्ज • {inStockCount} अभी काउंटर पर उपलब्ध
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOrderOnWhatsApp()}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            <span>WhatsApp पर ऑर्डर भेजें</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7C72] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="सामान खोजें... (जैसे दूध, ब्रेड, मैगी, तेल, दाल)"
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-[#E4DFD2] text-sm text-[#16291E] placeholder:text-[#94A3B8] focus:border-[#2F6B4F] focus:ring-1 focus:ring-[#2F6B4F] outline-none shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7C72] hover:text-[#16291E]"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2F6B4F] text-white shadow-xs font-bold'
                  : 'bg-white text-[#4A5D52] border border-[#E4DFD2] hover:bg-[#E8E4D9]'
              }`}
            >
              {cat === 'all' ? 'सभी सामान' : cat}
            </button>
          ))}
        </div>

        {/* Availability Quick Filters */}
        <div className="grid grid-cols-4 gap-1.5 text-xs text-center">
          <button
            type="button"
            onClick={() => setAvailabilityFilter('all')}
            className={`py-2 px-1 rounded-xl border transition-all ${
              availabilityFilter === 'all'
                ? 'bg-white border-[#2F6B4F] font-bold text-[#16291E] shadow-xs'
                : 'bg-white/60 border-[#E4DFD2] text-[#6B7C72]'
            }`}
          >
            सभी ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('in_stock')}
            className={`py-2 px-1 rounded-xl border transition-all ${
              availabilityFilter === 'in_stock'
                ? 'bg-[#EBF3EE] border-[#2F6B4F] font-bold text-[#2F6B4F] shadow-xs'
                : 'bg-white/60 border-[#E4DFD2] text-[#6B7C72]'
            }`}
          >
            उपलब्ध ({inStockCount})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('low_stock')}
            className={`py-2 px-1 rounded-xl border transition-all ${
              availabilityFilter === 'low_stock'
                ? 'bg-[#FEF3C7] border-[#F59E0B] font-bold text-[#B45309] shadow-xs'
                : 'bg-white/60 border-[#E4DFD2] text-[#6B7C72]'
            }`}
          >
            कम बचा ({lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('out_of_stock')}
            className={`py-2 px-1 rounded-xl border transition-all ${
              availabilityFilter === 'out_of_stock'
                ? 'bg-[#FEE2E2] border-[#EF4444] font-bold text-[#B91C1C] shadow-xs'
                : 'bg-white/60 border-[#E4DFD2] text-[#6B7C72]'
            }`}
          >
            ख़त्म ({outOfStockCount})
          </button>
        </div>

        {/* Catalog Items List */}
        {loading ? (
          <div className="py-16 text-center text-[#6B7C72] space-y-2">
            <span className="material-symbols-outlined text-4xl animate-spin text-[#2F6B4F]">
              sync
            </span>
            <p className="text-xs font-semibold">दुकान का लाइव स्टॉक लोड हो रहा है...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E4DFD2] space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
            <h3 className="text-sm font-bold text-[#16291E]">कोई सामान नहीं मिला</h3>
            <p className="text-xs text-[#6B7C72]">
              कृपया दूसरा नाम लिखकर खोजें या ऊपर &apos;सभी सामान&apos; फ़िल्टर चुनें
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const isInStock = item.status === 'in_stock';
              const isLowStock = item.status === 'low_stock';
              const isOutOfStock = item.status === 'out_of_stock';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-[#E4DFD2] hover:border-[#2F6B4F]/40 shadow-xs flex flex-col justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-[#6B7C72] bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#E4DFD2]">
                        {item.category}
                      </span>

                      {/* AVAILABILITY PILL (NO EXACT QUANTITY OR REORDER LEVEL EXPOSED!) */}
                      {isInStock && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2F6B4F] bg-[#EBF3EE] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]" />
                          उपलब्ध
                        </span>
                      )}
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          सीमित स्टॉक
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B91C1C] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                          अभी ख़त्म
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-[#16291E] line-clamp-2 mt-1">
                      {item.name}
                    </h3>
                    {item.unit && (
                      <p className="text-[11px] text-[#6B7C72]">पैकिंग: {item.unit}</p>
                    )}
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#FAF7F0]">
                    <div>
                      {item.sellPrice && item.sellPrice > 0 ? (
                        <div>
                          <span className="text-[10px] text-[#6B7C72] block">दुकान भाव / MRP</span>
                          <span className="text-base font-black text-[#16291E]">
                            ₹{item.sellPrice}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B7C72]">कीमत काउंटर पर</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOrderOnWhatsApp(item)}
                      className="px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#25D366] hover:text-white text-[#128C7E] font-bold text-xs rounded-xl border border-[#E4DFD2] flex items-center gap-1 transition-all"
                      title="Order via WhatsApp"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>ऑर्डर</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Share Banner at Bottom */}
        <div className="bg-white rounded-2xl p-4 border border-[#E4DFD2] text-center space-y-2">
          <p className="text-xs font-semibold text-[#16291E]">
            यह लिंक अपने परिवार या पड़ोसियों को भी भेजें
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#16291E] font-bold text-xs rounded-xl border border-[#E4DFD2] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copiedLink ? 'लिंक कॉपी हो गया!' : 'लिंक कॉपी करें'}</span>
            </button>
            <button
              type="button"
              onClick={handleShareOnWhatsApp}
              className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              <span>WhatsApp पर शेयर</span>
            </button>
          </div>
          <p className="text-[10px] text-[#94A3B8]">
            सुरक्षित सार्वजनिक दृश्य • थोक भाव या मुनाफ़ा पूर्णतः सुरक्षित व गोपनीय है
          </p>
        </div>
      </main>
    </div>
  );
};
