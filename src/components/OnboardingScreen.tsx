import React, { useState } from 'react';
import { Check, ArrowRight, Store, BookOpen, Sparkles, Globe } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Language, ShopType } from '../types';
import { getTranslation } from '../i18n/translations';

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding, profile } = useShop();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(profile?.language || 'hi');
  const [selectedShopType, setSelectedShopType] = useState<ShopType>(profile?.shopType || 'general_store');
  const [shopName, setShopName] = useState(profile?.shopName || 'Meri Dukan');

  const t = getTranslation(selectedLanguage);

  const languages: Array<{ code: Language; title: string; subtitle: string }> = [
    { code: 'hi', title: 'हिन्दी (Hindi)', subtitle: 'दुकान की बोलचाल वाली आसान भाषा' },
    { code: 'pa', title: 'ਪੰਜਾਬੀ (Punjabi)', subtitle: 'ਦੁਕਾਨ ਦੀ ਸੌਖੀ ਤੇ ਰੋਜ਼ਾਨਾ ਬੋਲਚਾਲ' },
    { code: 'en', title: 'English', subtitle: 'Simple everyday phrasing' },
  ];

  const handleFinish = () => {
    completeOnboarding(selectedLanguage, selectedShopType, shopName.trim() || 'Meri Dukan');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E4DFD2] space-y-6">
        {/* Brand Logo & Tagline */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#1E4632] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 100 100" className="w-10 h-10">
              <path
                d="M 32 46 C 32 26, 68 26, 68 46"
                fill="none"
                stroke="#FAF7F0"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path d="M 50 31 Q 50 20 50 17" fill="none" stroke="#FAF7F0" strokeWidth="3" strokeLinecap="round" />
              <path d="M 50 24 C 43 23, 39 17, 43 13 C 48 13, 50 21, 50 24 Z" fill="#FAF7F0" />
              <path d="M 50 21 C 56 19, 62 14, 59 10 C 53 10, 50 18, 50 21 Z" fill="#D9A62E" />
              <polygon points="24,45 76,45 69,77 31,77" fill="#FAF7F0" />
              <line x1="31" y1="55" x2="69" y2="55" stroke="#1E4632" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
              <line x1="34" y1="66" x2="66" y2="66" stroke="#1E4632" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#1E4632] tracking-tight">Krow</h1>
          <p className="text-xs text-[#726C60] font-medium">{t.tagline}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-8 h-1.5 rounded-full transition-colors ${
              step === 1 ? 'bg-[#1E4632]' : 'bg-[#2F6B4F]'
            }`}
          />
          <div
            className={`w-8 h-1.5 rounded-full transition-colors ${
              step === 2 ? 'bg-[#1E4632]' : 'bg-[#E4DFD2]'
            }`}
          />
        </div>

        {/* STEP 1: Select Language */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-[#262421]">{t.onboardingStep1Title}</h2>
              <p className="text-xs text-[#726C60]">{t.onboardingStep1Subtitle}</p>
            </div>

            <div className="space-y-2.5">
              {languages.map((l) => {
                const isSelected = selectedLanguage === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedLanguage(l.code)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-[#1E4632] bg-[#E7F0EA] shadow-xs'
                        : 'border-[#E4DFD2] bg-[#FAF7F0] hover:bg-[#FAF7F0]/60'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm text-[#262421]">{l.title}</h3>
                      <p className="text-xs text-[#726C60] mt-0.5">{l.subtitle}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#1E4632] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl bg-[#1E4632] text-white font-bold text-sm hover:bg-[#2F6B4F] transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>{t.continueBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Shop Type & Name */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-[#262421]">{t.onboardingStep2Title}</h2>
              <p className="text-xs text-[#726C60]">{t.onboardingStep2Subtitle}</p>
            </div>

            {/* Shop Name Input */}
            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">{t.shopNameLabel}</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={
                  selectedLanguage === 'hi'
                    ? 'जैसे: वर्मा किराना स्टोर'
                    : selectedLanguage === 'pa'
                    ? 'ਜਿਵੇਂ: ਵਰਮਾ ਕਰਿਆਨਾ ਸਟੋਰ'
                    : 'e.g. Verma Kirana Store'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
              />
            </div>

            {/* Shop Type Selection */}
            <div className="space-y-2.5">
              {/* General Store / Kirana */}
              <button
                type="button"
                onClick={() => setSelectedShopType('general_store')}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                  selectedShopType === 'general_store'
                    ? 'border-[#1E4632] bg-[#E7F0EA] shadow-xs'
                    : 'border-[#E4DFD2] bg-[#FAF7F0]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#2F6B4F] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#262421]">{t.generalStoreType}</h3>
                    {selectedShopType === 'general_store' && (
                      <div className="w-5 h-5 rounded-full bg-[#1E4632] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#726C60] mt-1">{t.generalStoreDesc}</p>
                </div>
              </button>

              {/* Stationery & Uniforms */}
              <button
                type="button"
                onClick={() => setSelectedShopType('stationery')}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                  selectedShopType === 'stationery'
                    ? 'border-[#1E4632] bg-[#E7F0EA] shadow-xs'
                    : 'border-[#E4DFD2] bg-[#FAF7F0]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#D9A62E] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#262421]">{t.stationeryType}</h3>
                    {selectedShopType === 'stationery' && (
                      <div className="w-5 h-5 rounded-full bg-[#1E4632] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#726C60] mt-1">{t.stationeryDesc}</p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
              >
                {selectedLanguage === 'hi' ? 'पीछे' : selectedLanguage === 'pa' ? 'ਪਿੱਛੇ' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-2xl bg-[#1E4632] text-white font-bold text-sm hover:bg-[#2F6B4F] transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D9A62E]" />
                <span>{t.finishOnboardingBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
