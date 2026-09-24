import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Language, StoreType, UserLoginRecord } from '../types';
import { translations } from '../translations';
import { STORE_TYPE_CONFIGS, getStoreConfig } from '../data/storeTypes';
import { AppLogo } from './AppLogo';
import { getUserLoginHistory } from '../services/firestoreSyncService';

interface ProfileModalProps {
  profile: UserProfile;
  currentUser?: User | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
  onOpenClearData?: () => void;
  onInstallApp?: () => void;
  isAppInstalled?: boolean;
  isAppInstallable?: boolean;
  onOpenWelcome?: () => void;
  onLoadStationeryInventory?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onManualSync?: () => Promise<void> | void;
  isSyncing?: boolean;
  onOpenPersonalize?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  currentUser,
  onUpdateProfile,
  onClose,
  onOpenClearData,
  onInstallApp,
  isAppInstalled = false,
  isAppInstallable = false,
  onOpenWelcome,
  onLoadStationeryInventory,
  onOpenAuth,
  onSignOut,
  onManualSync,
  isSyncing = false,
  onOpenPersonalize,
}) => {
  const t = translations[profile.language];
  const [shopName, setShopName] = useState(
    profile.shopName && profile.shopName !== 'मेरी दुकान' && profile.shopName !== 'डेमो स्टोर'
      ? profile.shopName
      : currentUser?.displayName
      ? `${currentUser.displayName} की दुकान`
      : ''
  );
  const [ownerName, setOwnerName] = useState(profile.ownerName || currentUser?.displayName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [selectedLang, setSelectedLang] = useState<Language>(profile.language);
  const [selectedStore, setSelectedStore] = useState<StoreType>(profile.storeType);
  const [loginLogs, setLoginLogs] = useState<UserLoginRecord[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserLoginHistory(currentUser.uid).then((logs) => {
        if (logs && logs.length > 0) {
          setLoginLogs(logs);
        }
      });
    }
  }, [currentUser]);

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

        {/* Shop Branding & Personalization Banner */}
        {onOpenPersonalize && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPersonalize();
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#E7F0EA] to-white border-2 border-[#2F6B4F]/30 hover:border-[#2F6B4F] flex items-center justify-between shadow-2xs transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E4DFD2] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[#2F6B4F] text-xl">palette</span>
                )}
              </div>
              <div>
                <div className="text-xs font-black text-[#1E4632] flex items-center gap-1">
                  <span>{selectedLang === 'en' ? 'Personalize Shop Branding' : 'दुकान का लोगो व ब्रांडिंग सजाएं'}</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </div>
                <div className="text-[10px] text-[#726C60]">
                  {selectedLang === 'en' ? 'Upload logo image, change shop title & category' : 'लोगो फ़ोटो अपलोड करें, नाम और प्रकार बदलें'}
                </div>
              </div>
            </div>
          </button>
        )}

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

              {selectedStore === 'stationery' && onLoadStationeryInventory && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadStationeryInventory();
                    onClose();
                  }}
                  className="mt-2.5 w-full py-2 px-3 rounded-xl bg-[#2F6B4F] hover:bg-[#1E4632] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">barcode_scanner</span>
                  <span>
                    {selectedLang === 'en' ? 'Load 71 Stationery Items with Barcodes' : '71 स्टेशनरी सामान बारकोड सहित स्टॉक में लोड करें'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Account & Synchronization */}
          <div className="pt-2 border-t border-[#E4DFD2] space-y-2">
            <div className="text-[11px] font-bold text-[#726C60] uppercase tracking-wider px-1">
              {selectedLang === 'en' ? 'Account & Backup' : 'खाता व डेटा बैकअप (Account)'}
            </div>

            {currentUser ? (
              <div className="p-3.5 rounded-2xl bg-white border border-[#2F6B4F]/30 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border border-[#2F6B4F]/30"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center font-bold text-sm">
                        {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#262421] truncate">
                        {currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'दुकानदार')}
                      </div>
                      <div className="text-[11px] text-[#726C60] truncate">
                        {currentUser.email || 'Google Account'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#2F6B4F] bg-[#E7F0EA] px-2 py-0.5 rounded-full border border-[#2F6B4F]/20 flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]"></span>
                    <span>सक्रिय (Active)</span>
                  </span>
                </div>

                <div className="text-[11px] text-[#2F6B4F] bg-[#E7F0EA]/80 p-2.5 rounded-xl border border-[#2F6B4F]/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">verified_user</span>
                    <span>
                      {selectedLang === 'en'
                        ? 'Account Connected & Secure'
                        : 'खाता कनेक्टेड व सुरक्षित'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#1E4632] leading-tight pl-5">
                    {selectedLang === 'en'
                      ? 'Your shop inventory, khata, and sales records are securely backed up to your account.'
                      : 'आपकी दुकान का सारा स्टॉक, बही-खाता और बिल रिकॉर्ड्स आपके खाते में सुरक्षित रूप से सिंक हैं।'}
                  </div>
                </div>

                {/* Account & Saved Login Audit Data Details */}
                <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4DFD2] flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#726C60]">
                    <span>{selectedLang === 'en' ? 'Registered Email:' : 'पंजीकृत ईमेल:'}</span>
                    <span className="font-semibold text-[#262421]">{currentUser.email || 'Google Account'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#726C60]">
                    <span>{selectedLang === 'en' ? 'Sign-in Method:' : 'लॉगिन का माध्यम:'}</span>
                    <span className="font-bold text-[#2F6B4F] bg-white px-2 py-0.5 rounded border border-[#E4DFD2] text-[10px]">
                      {currentUser.providerData?.[0]?.providerId === 'password' ? 'Email & Password' : 'Google 1-Click'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#726C60]">
                    <span>{selectedLang === 'en' ? 'Registered Since:' : 'पंजीकरण दिनांक:'}</span>
                    <span className="font-medium text-[#262421]">
                      {profile.registeredAt || profile.createdAt
                        ? new Date(profile.registeredAt || profile.createdAt).toLocaleDateString('hi-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'आज'}
                    </span>
                  </div>

                  {/* Toggle Saved Login History */}
                  <button
                    type="button"
                    onClick={() => setShowLogs(!showLogs)}
                    className="mt-1 pt-1.5 border-t border-[#E4DFD2] flex items-center justify-between text-[#2F6B4F] font-bold text-[10px] cursor-pointer hover:underline"
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">history</span>
                      <span>
                        {selectedLang === 'en' ? 'Saved Login Audit History' : 'सहेजा गया लॉगिन इतिहास'} ({loginLogs.length})
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm">
                      {showLogs ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {/* Render Logs List */}
                  {showLogs && (
                    <div className="mt-1 max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-[#E4DFD2]">
                      {loginLogs.length === 0 ? (
                        <div className="text-[10px] text-[#A29C8E] text-center py-1">
                          लॉगिन सत्र दर्ज हो रहा है...
                        </div>
                      ) : (
                        loginLogs.map((log, idx) => (
                          <div
                            key={log.id || idx}
                            className="flex items-center justify-between text-[10px] pb-1 border-b border-[#FAF7F0] last:border-0"
                          >
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]"></span>
                              <span className="font-medium text-[#262421]">
                                {log.type === 'register' ? 'पंजीकरण (Registered)' : 'लॉगिन (Login)'}
                              </span>
                            </div>
                            <span className="text-[#726C60]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {onManualSync && (
                    <button
                      type="button"
                      onClick={onManualSync}
                      disabled={isSyncing}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] hover:bg-[#E7F0EA] text-[#1E4632] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      <span>{isSyncing ? 'सिंक हो रहा है...' : 'अभी सिंक करें'}</span>
                    </button>
                  )}
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSignOut();
                      }}
                      className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span>लॉगआउट</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E4DFD2] space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-lg">info</span>
                  <div className="text-xs font-bold text-[#262421]">
                    {selectedLang === 'en' ? 'Local Offline Mode' : 'स्थानीय (लोकल) मोड में चल रहा है'}
                  </div>
                </div>
                <p className="text-[11px] text-[#726C60] leading-relaxed">
                  {selectedLang === 'en'
                    ? 'Currently your data is saved only on this device. Sign in with Google to sync your shop data across devices and keep it protected.'
                    : 'अभी आपका डेटा केवल इस डिवाइस पर है। Google से 1-क्लिक में लॉगिन करें ताकि आपका स्टॉक व खाता सुरक्षित रहे और किसी भी फ़ोन पर खुल सके।'}
                </p>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#2F6B4F] hover:bg-[#1E4632] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>
                      {selectedLang === 'en'
                        ? 'Sign In / Connect Account'
                        : 'खाता जोड़ें (लॉगिन करें)'}
                    </span>
                  </button>
                )}
              </div>
            )}
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
