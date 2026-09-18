import React, { useState } from 'react';
import { UserProfile, Language, StoreType } from '../types';
import { translations } from '../translations';
import { STORE_TYPE_CONFIGS, getStoreConfig } from '../data/storeTypes';
import { AppLogo } from './AppLogo';

interface ProfileModalProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
  onOpenClearData?: () => void;
  onInstallApp?: () => void;
  isAppInstalled?: boolean;
  isAppInstallable?: boolean;
  onOpenWelcome?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  onOpenClearData,
  onInstallApp,
  isAppInstalled = false,
  isAppInstallable = false,
  onOpenWelcome,
}) => {
  const t = translations[profile.language];
  const [shopName, setShopName] = useState(profile.shopName);
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [selectedLang, setSelectedLang] = useState<Language>(profile.language);
  const [selectedStore, setSelectedStore] = useState<StoreType>(profile.storeType);

  const activeStoreConfig = getStoreConfig(selectedStore);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      shopName: shopName.trim() || profile.shopName,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      language: selectedLang,
      storeType: selectedStore,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo size="xs" />
            <h3 className="text-base font-bold text-[#262421] font-display">
              {t.profileTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-[#726C60] flex items-center justify-center cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1">
              {t.shopNameLabel}
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1">
              {t.ownerLabel}
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1">
              {t.customerPhoneLabel}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
            />
          </div>

          {/* Language Switch */}
          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1">
              {t.onboardingStep1Title}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['hi', 'pa', 'en', 'ja'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                    selectedLang === lang
                      ? 'bg-[#2F6B4F] text-white border-[#2F6B4F]'
                      : 'bg-white border-[#E4DFD2] text-[#726C60]'
                  }`}
                >
                  {lang === 'hi' ? 'हिंदी' : lang === 'pa' ? 'ਪੰਜਾਬੀ' : lang === 'ja' ? '日本語' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* Store Type Classification Dropdown ("dropbox type") */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="store-type-select" className="text-xs font-bold text-[#262421] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2F6B4F] text-[17px]">category</span>
                <span>{t.storeDropdownLabel || t.onboardingStep2Title}</span>
              </label>
              <span className="text-[10px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                {activeStoreConfig.emoji} {t[activeStoreConfig.titleKey]}
              </span>
            </div>

            {/* Dropbox / Select Element */}
            <div className="relative">
              <select
                id="store-type-select"
                value={selectedStore === 'general_store' ? 'kirana' : selectedStore}
                onChange={(e) => setSelectedStore(e.target.value as StoreType)}
                className="w-full h-12 pl-10 pr-10 rounded-xl border border-[#2F6B4F]/40 bg-white text-sm font-bold text-[#262421] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2F6B4F]/30 focus:border-[#2F6B4F] transition-all cursor-pointer shadow-2xs"
              >
                {STORE_TYPE_CONFIGS.map((store) => (
                  <option key={store.id} value={store.id} className="py-2 text-sm font-medium">
                    {store.emoji} {t[store.titleKey]}
                  </option>
                ))}
              </select>

              {/* Leading Icon */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-base">
                {activeStoreConfig.emoji}
              </div>

              {/* Trailing Dropdown Chevron */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#726C60] flex items-center">
                <span className="material-symbols-outlined text-xl">expand_more</span>
              </div>
            </div>

            {/* Active Store Type Info Card */}
            <div className="mt-2.5 p-3 rounded-2xl bg-[#FAF7F0] border border-[#E4DFD2] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E4632]">
                  {t[activeStoreConfig.titleKey]}
                </span>
                <span className="text-[10px] text-[#726C60] font-medium">
                  ऑटो कैटेगरी एडैप्टर
                </span>
              </div>
              <p className="text-xs text-[#726C60] leading-snug">
                {t[activeStoreConfig.descKey]}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(activeStoreConfig.sampleTags[selectedLang] || activeStoreConfig.sampleTags.hi).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-white border border-[#E4DFD2] text-[#262421] text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* App & Data Management Actions */}
          <div className="pt-2 border-t border-[#E4DFD2] space-y-2">
            <div className="text-[11px] font-bold text-[#726C60] uppercase tracking-wider px-1">
              ऐप व डेटा प्रबंधन (App & Data)
            </div>

            {/* Install PWA Button if supported */}
            {onInstallApp && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E4DFD2]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {isAppInstalled ? 'check_circle' : 'install_mobile'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#262421]">
                      {isAppInstalled ? 'Krow ऐप इंस्टॉल है' : 'मोबाइल ऐप इंस्टॉल करें'}
                    </div>
                    <div className="text-[10px] text-[#726C60] truncate">
                      {isAppInstalled ? 'होमस्क्रीन से डायरेक्ट चलेगा' : 'ब्राउज़र से सीधे फ़ोन पर डाउनलोड'}
                    </div>
                  </div>
                </div>

                {!isAppInstalled && (
                  <button
                    type="button"
                    onClick={onInstallApp}
                    className="px-3 py-1.5 rounded-lg bg-[#2F6B4F] hover:bg-[#1E4632] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>इंस्टॉल</span>
                  </button>
                )}
                {isAppInstalled && (
                  <span className="text-[10px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                    Installed
                  </span>
                )}
              </div>
            )}

            {/* Clear All Store Data Button */}
            {onOpenClearData && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClearData();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-red-50/50 hover:bg-red-50 border border-red-200 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-700">
                      दुकान का डेटा साफ़ करें (Clear All Data)
                    </div>
                    <div className="text-[10px] text-red-500">
                      स्टॉक, बिक्री व उधार खाता रीसेट करें
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-red-400 group-hover:text-red-600 transition-colors text-lg">
                  chevron_right
                </span>
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-12 mt-2 bg-[#2F6B4F] hover:bg-[#1E4632] text-white text-sm font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {t.btnSave}
          </button>

          {onOpenWelcome && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWelcome();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] hover:bg-[#E7F0EA] text-[#1E4632] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>{selectedLang === 'hi' ? 'Krōw के बारे में देखें (What can Krōw do?)' : selectedLang === 'pa' ? 'Krōw ਬਾਰੇ ਦੇਖੋ (What can Krōw do?)' : 'About Krōw & Features'}</span>
            </button>
          )}

          {/* Legal Copyright & Software Identification */}
          <div className="pt-3 border-t border-[#E4DFD2] space-y-1.5 text-center select-none">
            <div className="flex items-center justify-center gap-2">
              <AppLogo size="xs" showText={false} />
              <span className="text-xs font-bold text-[#16291E]">Krow™ Retail OS</span>
              <span className="text-[10px] text-[#2F6B4F] font-bold bg-[#E7F0EA] px-2 py-0.5 rounded-full">v2.4 Official</span>
            </div>
            <div className="text-[11px] font-semibold text-[#4A453C]">
              © 2026 Krow Technologies Inc. All rights reserved.
            </div>
            <div className="text-[10px] text-[#726C60]">
              {selectedLang === 'en'
                ? 'Know More, Grow More • Secured & Certified Retail Operating System'
                : selectedLang === 'pa'
                ? 'ਕੈਨੋ ਮੋਰ, ਗ੍ਰੋ ਮੋਰ • ਸੁਰੱਖਿਅਤ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਖੁਦਰਾ ਪ੍ਰਣਾਲੀ'
                : 'कैनो मोर • ग्रो मोर — सुरक्षित व प्रमाणित किराना बहीखाता'}
            </div>
            <div className="text-[9px] text-[#8C8275]">
              Proprietary software. Unauthorized reproduction or redistribution is strictly prohibited.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
