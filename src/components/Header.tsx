import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { AppLogo } from './AppLogo';
import { getStoreConfig } from '../data/storeTypes';

interface HeaderProps {
  profile: UserProfile;
  currentUser?: User | null;
  isSyncing?: boolean;
  onLanguageChange: (lang: Language) => void;
  onOpenProfile: () => void;
  onOpenStoreSelect: () => void;
  onOpenShareStock?: () => void;
  onOpenWelcome?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentUser,
  isSyncing = false,
  onLanguageChange,
  onOpenProfile,
  onOpenStoreSelect,
  onOpenShareStock,
  onOpenWelcome,
  onOpenAuth,
}) => {
  const t = translations[profile.language];
  const [showLangMenu, setShowLangMenu] = useState(false);
  const storeConfig = getStoreConfig(profile.storeType);

  const langNames: Record<Language, string> = {
    hi: 'हिन्दी',
    pa: 'ਪੰਜਾਬੀ',
    en: 'English',
    ja: '日本語',
  };

  // Strictly enforce privacy: before login, NEVER show personal name or personal shop
  const isAuthenticated = Boolean(currentUser);
  const headerTitle = isAuthenticated
    ? (profile.shopName || (currentUser?.displayName ? `${currentUser.displayName} की दुकान` : t[storeConfig.titleKey]))
    : 'Krōw POS';

  const headerSubtitle = isAuthenticated
    ? `${t[storeConfig.titleKey]}`
    : `${t[storeConfig.titleKey]} • ${profile.language === 'en' ? 'Demo' : 'डेमो'}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E4DFD2] shadow-2xs">
      <div className="max-w-md mx-auto h-14 px-3 flex items-center justify-between gap-2">
        {/* Left: Brand & Store Identity (Android 56dp standard ratio) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Executive Krōw Brand Emblem Button */}
          <button
            onClick={onOpenWelcome}
            className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            title="Krōw Retail POS"
            type="button"
            aria-label="Krōw POS"
          >
            <AppLogo size="sm" showText={false} />
          </button>

          {/* Store Category / Personalize Pill */}
          <button
            id="header-shop-selector-btn"
            onClick={isAuthenticated ? onOpenProfile : onOpenStoreSelect}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#E4DFD2] transition-all min-w-0 text-left shadow-2xs active:scale-[0.98] cursor-pointer"
            type="button"
            title={headerTitle}
          >
            {isAuthenticated && profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Shop Logo"
                className="w-6 h-6 rounded-lg object-cover flex-shrink-0 border border-[#E4DFD2]"
              />
            ) : (
              <span className="w-6 h-6 rounded-lg bg-[#E4EFE8] text-[#0A2719] flex items-center justify-center text-xs flex-shrink-0 font-bold">
                <span className="material-symbols-outlined text-[15px]">{storeConfig.icon}</span>
              </span>
            )}

            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-extrabold text-xs sm:text-[13px] text-[#1C1B1A] truncate max-w-[110px] xs:max-w-[140px] leading-tight">
                {headerTitle}
              </span>
              <span className="text-[10px] text-[#5C6460] font-semibold flex items-center gap-0.5 leading-tight">
                <span className="truncate max-w-[90px] xs:max-w-[120px]">{headerSubtitle}</span>
                <span className="material-symbols-outlined text-[12px] text-[#8C938F]">expand_more</span>
              </span>
            </div>
          </button>
        </div>

        {/* Right: Android-Ergonomic Quick Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Language Selector Pill */}
          <div className="relative">
            <button
              id="header-language-toggle-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="h-8 px-2 rounded-xl bg-white border border-[#E4DFD2] flex items-center gap-1 text-[11px] font-bold text-[#0A2719] shadow-2xs hover:bg-[#E4EFE8] transition-colors cursor-pointer"
              type="button"
              aria-label="Change Language"
            >
              <span className="material-symbols-outlined text-[14px] text-[#2F6B4F]">translate</span>
              <span className="max-w-[45px] truncate">{langNames[profile.language]}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-2xl shadow-xl border border-[#E4DFD2] py-1 z-50 animate-scale-up">
                {(['hi', 'pa', 'en', 'ja'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange(lang);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between cursor-pointer ${
                      profile.language === lang
                        ? 'bg-[#E4EFE8] text-[#0A2719] font-bold'
                        : 'text-[#1C1B1A] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <span>{langNames[lang]}</span>
                    {profile.language === lang && (
                      <span className="material-symbols-outlined text-xs text-[#0A2719]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share QR (Visible when authenticated or on wider screens) */}
          {isAuthenticated && onOpenShareStock && (
            <button
              onClick={onOpenShareStock}
              className="w-8 h-8 rounded-xl bg-white border border-[#E4DFD2] text-[#7a5900] hover:bg-[#E4EFE8] flex items-center justify-center shadow-2xs active:scale-95 transition-transform cursor-pointer"
              title={profile.language === 'en' ? 'Customer Live Catalog & QR' : 'ग्राहक लाइव स्टॉक व QR'}
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">qr_code_2</span>
            </button>
          )}

          {/* Auth State Button: Professional Login CTA vs Verified Profile Avatar */}
          {!isAuthenticated && onOpenAuth ? (
            <button
              id="header-open-auth-btn"
              onClick={onOpenAuth}
              className="h-8 px-2.5 rounded-xl bg-[#0A2719] hover:bg-[#15422B] text-white flex items-center gap-1.5 text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Google लॉगिन व क्लाउड बैकअप"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>{profile.language === 'en' ? 'Login' : 'लॉगिन'}</span>
            </button>
          ) : (
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-xl bg-[#0A2719] text-[#FAF7F0] flex items-center justify-center shadow-2xs active:scale-95 transition-transform relative overflow-hidden cursor-pointer"
              aria-label={t.profileTitle}
              type="button"
              title={currentUser ? `${currentUser.displayName || currentUser.email || 'User'} • सक्रिय (Active)` : t.profileTitle}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="material-symbols-outlined text-[18px]">person</span>
              )}
              {currentUser && (
                <span
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                    isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400'
                  }`}
                  title={isSyncing ? 'सिंक हो रहा है...' : 'खाता सक्रिय (Active)'}
                />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
