import React, { useState } from 'react';
import { Language, StoreType } from '../types';
import { translations } from '../translations';
import { KrowWordmark, KiranaStoreIllustration, SproutIcon } from './KrowIllustrations';
import { STORE_TYPE_CONFIGS } from '../data/storeTypes';

interface KrowWelcomeFirstViewProps {
  currentLanguage: Language;
  currentStoreType: StoreType;
  shopName?: string;
  onOpenShop: (lang: Language, storeType: StoreType) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const KrowWelcomeFirstView: React.FC<KrowWelcomeFirstViewProps> = ({
  currentLanguage,
  currentStoreType,
  shopName = 'मेरी दुकान',
  onOpenShop,
  isModal = false,
  onClose,
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage);
  const [selectedStore, setSelectedStore] = useState<StoreType>(currentStoreType);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'story'>('overview');

  const t = translations[selectedLang];

  const features = [
    {
      id: 'stock',
      title: selectedLang === 'hi' ? 'स्टॉक प्रबंधन' : selectedLang === 'pa' ? 'ਸਟਾਕ ਪ੍ਰਬੰਧਨ' : 'Stock Management',
      desc: selectedLang === 'hi' ? 'आइटम जोड़ें, स्टॉक ट्रैक करें, और कम स्टॉक के अलर्ट पाएं।' : selectedLang === 'pa' ? 'ਆਈਟਮਾਂ ਜੋੜੋ, ਸਟਾਕ ਟਰੈਕ ਕਰੋ ਅਤੇ ਘੱਟ ਸਟਾਕ ਅਲਰਟ ਪ੍ਰਾਪਤ ਕਰੋ।' : 'Add items, track stock, and get low stock alerts.',
      icon: 'inventory_2',
      bg: 'bg-[#EBF5EE]',
      iconColor: 'text-[#2F6B4F]',
      badge: selectedLang === 'hi' ? 'स्मार्ट' : 'Smart',
    },
    {
      id: 'bill',
      title: selectedLang === 'hi' ? 'बिल स्कैनिंग' : selectedLang === 'pa' ? 'ਬਿੱਲ ਸਕੈਨਿੰਗ' : 'Bill Scanning',
      desc: selectedLang === 'hi' ? 'सप्लायर बिल को कैमरे से स्कैन करें और कुछ ही सेकंड में सामान जोड़ें।' : selectedLang === 'pa' ? 'ਸਪਲਾਇਰ ਬਿੱਲ ਸਕੈਨ ਕਰੋ ਅਤੇ ਸਕਿੰਟਾਂ ਵਿੱਚ ਆਈਟਮਾਂ ਜੋੜੋ।' : 'Scan supplier bills and add items in seconds.',
      icon: 'receipt_long',
      bg: 'bg-[#FDF7E7]',
      iconColor: 'text-[#B45309]',
      badge: 'AI Camera',
    },
    {
      id: 'profit',
      title: selectedLang === 'hi' ? 'मुनाफ़ा ट्रैकिंग' : selectedLang === 'pa' ? 'ਮੁਨਾਫ਼ਾ ਟਰੈਕਿੰਗ' : 'Profit Tracking',
      desc: selectedLang === 'hi' ? 'हर दिन और हफ्ते का असली मुनाफ़ा साफ़-साफ़ देखें।' : selectedLang === 'pa' ? 'ਆਪਣਾ ਰੋਜ਼ਾਨਾ ਅਤੇ ਹਫ਼ਤਾਵਾਰੀ ਮੁਨਾਫਾ ਸਪਸ਼ਟ ਤੌਰ ਤੇ ਦੇਖੋ।' : 'See your daily & weekly profit clearly.',
      icon: 'currency_rupee',
      bg: 'bg-[#FBF0D9]',
      iconColor: 'text-[#D97706]',
      badge: selectedLang === 'hi' ? 'दैनिक' : 'Daily',
    },
    {
      id: 'udhaar',
      title: selectedLang === 'hi' ? 'उधार खाता (लेजर)' : selectedLang === 'pa' ? 'ਉਧਾਰ ਖਾਤਾ' : 'Udhaar Management',
      desc: selectedLang === 'hi' ? 'ग्राहकों का हिसाब-किताब रखें और समय पर बकाया वसूली करें।' : selectedLang === 'pa' ? 'ਗਾਹਕਾਂ ਅਤੇ ਬਕਾਇਆ ਭੁਗਤਾਨਾਂ ਦਾ ਧਿਆਨ ਰੱਖੋ।' : 'Keep track of customers and pending payments.',
      icon: 'group',
      bg: 'bg-[#E8F2EC]',
      iconColor: 'text-[#1E4632]',
      badge: 'WhatsApp',
    },
    {
      id: 'alerts',
      title: selectedLang === 'hi' ? 'आउट-ऑफ-स्टॉक अलर्ट' : selectedLang === 'pa' ? 'ਆਊਟ-ਆਫ-ਸਟਾਕ ਅਲਰਟ' : 'Out-of-Stock Alerts',
      desc: selectedLang === 'hi' ? 'दुकान की ज़रूरी और सबसे ज़्यादा बिकने वाली चीज़ें कभी खत्म न हों।' : selectedLang === 'pa' ? 'ਜ਼ਰੂਰੀ ਚੀਜ਼ਾਂ ਕਦੇ ਵੀ ਖ਼ਤਮ ਨਾ ਹੋਣ ਦਿਓ।' : 'Never run out of important items.',
      icon: 'warning',
      bg: 'bg-[#FDF0EE]',
      iconColor: 'text-[#DC2626]',
      badge: selectedLang === 'hi' ? 'अलर्ट' : 'Alerts',
    },
  ];

  return (
    <div className={`${isModal ? 'fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4' : 'w-full min-h-screen bg-[#FAF7F0] flex flex-col justify-between p-4 selection:bg-[#2F6B4F] selection:text-white'}`}>
      <div className={`w-full max-w-md mx-auto bg-[#FAF7F0] rounded-3xl shadow-xl border border-[#E4DFD2] overflow-hidden flex flex-col ${isModal ? 'max-h-[92vh] overflow-y-auto' : ''}`}>
        {/* Top Floating Close Button (if shown as modal) */}
        {isModal && onClose && (
          <div className="flex justify-end p-3 pb-0">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 border border-[#E4DFD2] text-[#5A5348] hover:bg-white flex items-center justify-center transition-colors"
              title="Close"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Clean Header Bar with Little Sprout */}
        <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
          {/* Subtle Top Sprout Leaf */}
          <div className="w-10 h-10 rounded-full bg-[#E7F0EA] border border-[#2F6B4F]/20 flex items-center justify-center mb-3 shadow-2xs">
            <SproutIcon size={22} />
          </div>

          {/* Authentic Brand Wordmark with sprout leaves over the 'o' */}
          <KrowWordmark
            size="xl"
            showSparkles={true}
            showSubtitle={true}
            subtitle={selectedLang === 'hi' ? 'सरल साधन • बेहतर व्यापार' : selectedLang === 'pa' ? 'ਸਧਾਰਨ ਸਾਧਨ • ਬਿਹਤਰ ਵਪਾਰ' : 'Simple tools. Better business.'}
          />

          {/* Subtitle Dedication Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E4DFD2] text-[11px] font-semibold text-[#4A6B56] shadow-2xs">
            <span>✨</span>
            <span>
              {selectedLang === 'hi'
                ? 'छोटे दुकानदारों के लिए विशेष रूप से निर्मित'
                : selectedLang === 'pa'
                ? 'ਛੋਟੇ ਦੁਕਾਨਦਾਰਾਂ ਲਈ ਵਿਸ਼ੇਸ਼ ਤੌਰ ਤੇ ਬਣਾਇਆ ਗਿਆ'
                : 'Built with care for small shopkeepers'}
            </span>
          </div>
        </div>

        {/* Interactive Navigation Tabs: Overview | Features | Story */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-3 gap-1 bg-[#EFEBE1] p-1 rounded-2xl border border-[#E4DFD2]">
            <button
              onClick={() => setActiveTab('overview')}
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white text-[#163A2B] shadow-xs' : 'text-[#726C60] hover:text-[#262421]'}`}
            >
              {selectedLang === 'hi' ? 'दुकान व्यू' : selectedLang === 'pa' ? 'ਦੁਕਾਨ ਵਿਊ' : 'Shop View'}
            </button>
            <button
              onClick={() => setActiveTab('features')}
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'features' ? 'bg-white text-[#163A2B] shadow-xs' : 'text-[#726C60] hover:text-[#262421]'}`}
            >
              {selectedLang === 'hi' ? 'सुविधाएं (5)' : selectedLang === 'pa' ? 'ਸਹੂਲਤਾਂ (5)' : 'Features'}
            </button>
            <button
              onClick={() => setActiveTab('story')}
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'story' ? 'bg-white text-[#163A2B] shadow-xs' : 'text-[#726C60] hover:text-[#262421]'}`}
            >
              {selectedLang === 'hi' ? 'मकसद ♡' : selectedLang === 'pa' ? 'ਮਕਸਦ ♡' : 'Why Krōw'}
            </button>
          </div>
        </div>

        {/* Tab 1: Overview (Handset Phone & Kirana Storefront Illustration) */}
        {activeTab === 'overview' && (
          <div className="px-6 py-4 flex flex-col items-center animate-fade-in">
            {/* Hand-drawn Kirana Storefront Illustration */}
            <div className="w-full flex justify-center py-2 relative">
              <KiranaStoreIllustration size={230} animated={true} />
            </div>

            {/* Introductory Text from Astha's Slide */}
            <div className="text-center space-y-1.5 mt-2 max-w-sm">
              <p className="text-sm font-semibold text-[#163A2B] leading-snug">
                {selectedLang === 'hi'
                  ? 'स्टॉक, बिल, मुनाफ़ा और उधार — सब कुछ आसानी से मैनेज करें।'
                  : selectedLang === 'pa'
                  ? 'ਸਟਾਕ, ਬਿੱਲ, ਮੁਨਾਫਾ ਅਤੇ ਉਧਾਰ — ਸਭ ਕੁਝ ਆਸਾਨੀ ਨਾਲ ਸੰਭਾਲੋ।'
                  : 'Manage your stock, profit and udhaar — more easily.'}
              </p>
              <p className="text-xs text-[#6B7C72]">
                {selectedLang === 'hi'
                  ? 'किराना स्टोर • स्टेशनरी दुकान • जनरल स्टोर (और अन्य)'
                  : selectedLang === 'pa'
                  ? 'ਕਿਰਾਣਾ ਸਟੋਰ • ਸਟੇਸ਼ਨਰੀ ਦੁਕਾਨ • ਜਨਰਲ ਸਟੋਰ (ਅਤੇ ਹੋਰ)'
                  : 'Kirana stores + Stationery shops (and more!)'}
              </p>
            </div>

            {/* Quick Language & Store Selector */}
            <div className="w-full mt-4 p-3 bg-white rounded-2xl border border-[#E4DFD2] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4A443A]">
                  {selectedLang === 'hi' ? 'भाषा चुनें' : 'Language'}
                </span>
                <div className="flex gap-1">
                  {(['hi', 'pa', 'en'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLang(lang)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${selectedLang === lang ? 'bg-[#2F6B4F] text-white shadow-2xs' : 'bg-[#FAF7F0] text-[#5A5348] border border-[#E4DFD2]'}`}
                    >
                      {lang === 'hi' ? 'हिन्दी' : lang === 'pa' ? 'ਪੰਜਾਬੀ' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#F0EBE0]">
                <span className="text-xs font-bold text-[#4A443A]">
                  {selectedLang === 'hi' ? 'दुकान का प्रकार' : 'Store Type'}
                </span>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value as StoreType)}
                  className="text-xs font-semibold bg-[#FAF7F0] border border-[#E4DFD2] rounded-lg px-2.5 py-1 text-[#163A2B] focus:outline-none focus:ring-1 focus:ring-[#2F6B4F]"
                >
                  <option value="kirana">🛒 {selectedLang === 'hi' ? 'किराना व राशन' : 'Kirana & Grocery'}</option>
                  <option value="general">🏪 {selectedLang === 'hi' ? 'जनरल स्टोर' : 'General Store'}</option>
                  <option value="stationery">📚 {selectedLang === 'hi' ? 'किताब व स्टेशनरी' : 'Stationery'}</option>
                  <option value="uniform">👔 {selectedLang === 'hi' ? 'यूनिफॉर्म व गारमेंट' : 'Uniforms'}</option>
                  <option value="gift">🎁 {selectedLang === 'hi' ? 'गिफ्ट व खिलौने' : 'Gift & Toys'}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: What can Krōw do? (Exact 5 feature cards from Slide 2) */}
        {activeTab === 'features' && (
          <div className="px-5 py-3 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between px-1 mb-1">
              <h2 className="text-sm font-extrabold text-[#163A2B] flex items-center gap-1.5 font-display">
                <span>What can Krōw do?</span>
                <span className="text-[#4E9F6E]">˗ˏˋ ˎˊ˗</span>
              </h2>
              <span className="text-[10px] font-bold text-[#4A6B56] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                5 Simple Tools
              </span>
            </div>

            {features.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-2xl border border-[#E4DFD2] shadow-2xs flex items-start gap-3 hover:border-[#2F6B4F]/40 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.iconColor} flex items-center justify-center flex-shrink-0 border border-black/5`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#163A2B] leading-tight font-display">
                      {item.title}
                    </span>
                    <span className="text-[9px] font-semibold text-[#4A6B56] bg-[#FAF7F0] px-1.5 py-0.2 rounded border border-[#E4DFD2]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7C72] mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}

            <div className="text-center py-1">
              <span className="text-xs font-semibold text-[#4A6B56] font-display">
                Simple. Useful. Made for small businesses. ☺
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Why I built it? (Directly from Slide 3) */}
        {activeTab === 'story' && (
          <div className="px-5 py-4 space-y-4 animate-fade-in text-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#2F6B4F] uppercase tracking-wider">
                Founder's Note
              </span>
              <h2 className="text-lg font-extrabold text-[#163A2B] font-display flex items-center justify-center gap-1.5">
                <span>Why I built it?</span>
                <span className="text-[#4E9F6E]">˗ˏˋ ˎˊ˗</span>
              </h2>
            </div>

            {/* Founder Note Card */}
            <div className="p-4 bg-white rounded-2xl border border-[#E4DFD2] text-left shadow-2xs space-y-3">
              <p className="text-xs sm:text-sm text-[#3A3630] leading-relaxed">
                {selectedLang === 'hi'
                  ? 'मैंने देखा कि छोटे दुकानदार हर चीज़ को हाथ से संभालने में कितनी मेहनत करते हैं — स्टॉक, पर्चे, मुनाफ़ा, उधार... जब आप खुद पूरी दुकान चला रहे हों, तो यह बहुत ज़्यादा काम हो जाता है।'
                  : 'I noticed how much effort small shopkeepers put in to manage everything manually — stock, bills, profit, udhaar... It\'s a lot, especially when you\'re running the shop too.'}
              </p>

              {/* Highlight Pill */}
              <div className="p-3 rounded-xl bg-[#E7F0EA] border border-[#2F6B4F]/20 text-[#163A2B] font-semibold text-xs leading-relaxed">
                {selectedLang === 'hi'
                  ? 'इसलिए मैंने Krōw बनाया ताकि दुकानदारों का रोज़ का काम आसान, तेज़ और चिंता-मुक्त हो सके।'
                  : 'So I built Krōw to make their daily work simpler, faster and less stressful. ♫'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE0] text-xs font-bold text-[#2F6B4F]">
                <span>Small shops = Big dreams ♡</span>
                <span className="text-[10px] text-[#726C60] font-normal">Krōw Retail OS</span>
              </div>
            </div>

            {/* Quick Highlights Pill Row */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 bg-white rounded-xl border border-[#E4DFD2] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2F6B4F] text-lg">offline_bolt</span>
                <span className="text-[11px] font-bold text-[#262421]">Offline Ready</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E4DFD2] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2F6B4F] text-lg">lock</span>
                <span className="text-[11px] font-bold text-[#262421]">100% Private</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sticky Action Button: Open Shop */}
        <div className="p-5 pt-3 bg-gradient-to-t from-[#FAF7F0] via-[#FAF7F0] to-transparent flex flex-col gap-2">
          <button
            id="open-krow-shop-btn"
            onClick={() => onOpenShop(selectedLang, selectedStore)}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#1E4632] hover:bg-[#163828] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all touch-manipulation"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">storefront</span>
            <span>
              {selectedLang === 'hi'
                ? 'दुकान शुरू करें (Open Shop)'
                : selectedLang === 'pa'
                ? 'ਦੁਕਾਨ ਖੋਲ੍ਹੋ (Open Shop)'
                : 'Open My Shop'}
            </span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>

          <p className="text-center text-[10px] text-[#7A7265] font-medium">
            {selectedLang === 'hi'
              ? 'मुफ़्त • कोई जटिल पासवर्ड नहीं • तुरंत चालू'
              : 'Free to use • No complex passwords • Instant startup'}
          </p>
        </div>
      </div>
    </div>
  );
};
